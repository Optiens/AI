---
title: 'MQTT × Supabaseで作る農業IoTリアルタイムダッシュボード：Raspberry Piセンサーデータの収集から可視化まで'
date: '2026-03-25'
category: 'technology'
excerpt: 'Mosquitto（MQTT）とSupabaseを組み合わせた農業IoTデータパイプラインの構築方法を解説。Raspberry Piのセンサーデータをクラウドに蓄積し、リアルタイムで可視化する実装手順を紹介します。'
image: '/blog/mqtt-supabase-farm-dashboard.webp'
---

## はじめに：農業IoTにおけるデータ活用の重要性

水耕栽培の収量と品質を安定させるには、環境データのリアルタイム把握が欠かせません。EC値（養液濃度）、pH、水温、CO2濃度といった指標がわずかにずれるだけで、植物の成長速度や品質は大きく変化します。

Optiensでは、Raspberry Pi 4Bを中心としたIoTシステムでこれらのデータを24時間収集し、**MQTT（Mosquitto）→ Python → Supabase**というパイプラインでクラウドに蓄積・可視化しています。本記事では、その技術的な仕組みを詳しく解説します。

---

## MQTTとは：IoTの標準プロトコル

MQTT（Message Queuing Telemetry Transport）は、IoTデバイス間の通信に特化した軽量プロトコルです。TCP/IP上で動作し、以下の特徴を持ちます。

- **Pub/Subモデル**: センサー（Publisher）がトピックにデータを発行し、サーバー（Subscriber）が購読
- **低帯域・低消費電力**: センサーデバイスへの負荷が最小限
- **QoS対応**: 通信品質（0/1/2）を用途に応じて選択可能

OptiensではMosquitto（オープンソースのMQTTブローカー）をRaspberry Pi上で動かし、全センサーデータの中継点として使用しています。

### トピック設計

センサー種別ごとにトピックを分割し、可読性とスケーラビリティを確保しています。

```
optiens/sensors/ec          # EC値（mS/cm）
optiens/sensors/ph          # pH値
optiens/sensors/water_temp  # 水温（℃）
optiens/sensors/air_temp    # 気温（℃）
optiens/sensors/humidity    # 湿度（%）
optiens/sensors/co2         # CO2濃度（ppm）
optiens/sensors/lux         # 照度（lux）
optiens/control/pump        # ポンプ制御コマンド
optiens/control/led         # LED制御コマンド
```

センサー値はJSON形式のペイロードで送信します。

```json
{
  "value": 1.85,
  "timestamp": "2026-03-25T09:30:00+09:00",
  "unit": "mS/cm"
}
```

タイムスタンプをデバイス側で付与することで、ブローカー側でのデータ欠損を防ぎます。

---

## Supabaseへのデータ蓄積

Supabaseは、PostgreSQLをベースにしたオープンソースのBaaSです。無料枠でも以下の機能が使えます。

- **PostgreSQLデータベース**: 構造化データの長期蓄積
- **リアルタイムサブスクリプション**: WebSocketでダッシュボードへ即時反映
- **REST API / JavaScript SDK**: クライアントからのシンプルなアクセス

### テーブル設計

時系列データの読み取り性能を重視したシンプルな設計にしています。

```sql
CREATE TABLE sensor_readings (
  id          BIGSERIAL PRIMARY KEY,
  sensor_type TEXT        NOT NULL,   -- 'ec', 'ph', 'water_temp' など
  value       NUMERIC     NOT NULL,
  unit        TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 時系列クエリの高速化
CREATE INDEX ON sensor_readings (sensor_type, recorded_at DESC);
```

将来的に栽培エリアが複数になった場合は、`zone_id` カラムを追加することで同一スキーマのまま拡張できます。

### MQTTブリッジスクリプト

Pythonスクリプトでメッセージをサブスクライブし、Supabaseに書き込みます。`paho-mqtt` と `supabase-py` を使用します。

```python
import json
import paho.mqtt.client as mqtt
from supabase import create_client

SUPABASE_URL = "https://xxxx.supabase.co"
SUPABASE_KEY = "your-anon-key"
MQTT_BROKER  = "localhost"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client   = mqtt.Client()

TOPIC_MAP = {
    "optiens/sensors/ec":         ("ec",         "mS/cm"),
    "optiens/sensors/ph":         ("ph",         ""),
    "optiens/sensors/water_temp": ("water_temp", "℃"),
    "optiens/sensors/air_temp":   ("air_temp",   "℃"),
    "optiens/sensors/humidity":   ("humidity",   "%"),
    "optiens/sensors/co2":        ("co2",        "ppm"),
    "optiens/sensors/lux":        ("lux",        "lux"),
}

def on_message(client, userdata, msg):
    if msg.topic in TOPIC_MAP:
        sensor_type, unit = TOPIC_MAP[msg.topic]
        payload = json.loads(msg.payload)
        supabase.table("sensor_readings").insert({
            "sensor_type": sensor_type,
            "value":       payload["value"],
            "unit":        unit,
            "recorded_at": payload.get("timestamp"),
        }).execute()

client.on_message = on_message
client.connect(MQTT_BROKER, 1883)
for topic in TOPIC_MAP:
    client.subscribe(topic)
client.loop_forever()
```

このスクリプトをsystemdサービスとして登録することで、Raspberry Pi起動時に自動的にデータ収集が開始されます。障害時の自動再起動設定（`Restart=on-failure`）を加えることで、運用の信頼性が向上します。

---

## リアルタイムダッシュボードの構築

Supabaseのリアルタイム機能（WebSocket）を利用して、センサーデータの変化をブラウザに即時反映します。

**構成:**
- フロントエンド: Astro + Chart.js
- 更新方式: Supabase Realtime（`INSERT` イベントを購読）
- 表示項目: 現在値カード、24時間トレンドグラフ、アラートバナー

**アラート条件の例:**

| センサー | 下限 | 上限 | アクション |
|---|---|---|---|
| EC値 | 1.5 mS/cm | 2.5 mS/cm | 養液補充・交換を通知 |
| pH | 5.5 | 7.0 | pH調整液の添加を通知 |
| 水温 | 15℃ | 28℃ | ヒーター/冷却ファン制御 |
| CO2 | 400 ppm | 1500 ppm | 換気ファン制御 |

アラートはMQTT経由でRaspberry Piに制御コマンドとして送返し、デバイスが自律的に応答します。

---

## Optiensでの実運用データ

現在Phase 1（自宅テスト栽培）として、60秒間隔でセンサーデータを収集しています。

- **1日あたりのレコード数**: 約10,000件（7センサー × 1,440回/日）
- **累積データ量**: 3ヶ月でSupabaseの無料枠（500MB）の10%未満
- **可視化**: 水温とEC値の日変動から、ポンプ稼働サイクルとの相関が確認できた

蓄積したデータはClaude Code（AI）のMCP経由で自然言語クエリに対応しています。「今週のEC値の平均は？」「昨日pHが急変した時間帯は？」といった質問に即座に回答し、施肥タイミングの最適化に活用しています。

Phase 2の廃校教室への移行後は、複数の栽培エリアに同一アーキテクチャで展開予定です。スケーラビリティを意識した設計が、今後の拡張コストを抑える鍵になります。

---

## まとめ：農業IoTデータパイプラインの設計指針

MQTT + Supabaseの組み合わせは、農業IoTのデータパイプラインとして高い実用性を持っています。

| 要素 | 採用技術 | 採用理由 |
|---|---|---|
| ブローカー | Mosquitto | 軽量・Raspberry Piで安定稼働 |
| データ蓄積 | Supabase | PostgreSQL互換・リアルタイム・無料枠あり |
| ブリッジ | Python (paho-mqtt) | 豊富なライブラリ・RPiとの親和性 |
| 可視化 | Astro + Chart.js | 軽量・静的サイト生成で高速表示 |

農業IoTは「センサーをつなぐ」だけでなく、**収集したデータをどう活用するか**が本質的な価値を生みます。適切なデータパイプライン設計が、AIによる意思決定支援の品質を左右します。

センサーから収穫まで、すべてをデータで繋ぐ。Optiensが目指す農業のDXは、こうした技術の積み重ねから始まります。

---

*参考資料:*
- *Eclipse Mosquitto — An open source MQTT broker*
- *Supabase Documentation — Database, Realtime, Auth*
- *Eclipse Paho — MQTT Python Client Library*
