---
title: 'MCP（Model Context Protocol）で農業IoTをClaude Codeから操作する：Raspberry Pi MCPサーバーの実装'
date: '2026-04-06'
category: 'AI'
excerpt: 'Anthropicが策定したMCP（Model Context Protocol）をRaspberry Piに実装し、Claude Codeから農業IoTシステムを自然言語で操作する手法を解説。センサーデータ取得から機器制御まで、AIエージェントによる農場管理の実践例を紹介します。'
image: '/images/blog/mcp-model-context-protocol-farm-control.webp'
---

## はじめに：AIで農場を操作するという発想

「今の養液のEC値は？」「LEDライトを明日の朝6時から点灯して」「今週の水温の変化を教えて」

これらのコマンドをスマートフォンから自然言語で送り、Raspberry Piが即座に応答する——そんな農場管理が**MCP（Model Context Protocol）**によって実現します。

MCPはAnthropicが2024年11月に公開したオープンな標準プロトコルです。AIモデル（Claude）と外部ツール・データソースを安全に接続するための仕様で、農業IoTの文脈では「Claudeが農場のセンサーを直接読み取り、機器を制御する」ことを可能にします。

Optiensでは、Phase 1（テスト栽培）のIoTシステムにMCPサーバーを実装し、Claude Code経由でiPhoneから農場を操作する仕組みを構築しています。本記事では、その技術的な設計と実装手順を解説します。

---

## MCPとは：AIとツールをつなぐ標準規格

MCPは「AIモデルが外部リソースを利用するための共通インターフェース」です。従来、AIに外部ツールを使わせるには各モデルのFunction Calling仕様に合わせた独自実装が必要でしたが、MCPはこれを標準化します。

### MCPの基本構造

```
Claude Code（クライアント）
    │
    │ MCP Protocol（JSON-RPC 2.0 over stdio/SSE）
    ▼
MCPサーバー（Raspberry Pi上で動作）
    ├── tools/        → 実行可能な操作（センサー読取、機器制御）
    ├── resources/    → 読み取り可能なデータ（ログ、履歴）
    └── prompts/      → 定型プロンプトテンプレート
```

**重要な設計原則：**
- MCPサーバーはツールの定義とスキーマを公開するだけ
- 実際の「何をすべきか」の判断はClaude（LLM）が行う
- セキュリティ：ツールの実行にはユーザーの明示的な承認が必要

農業IoTにおけるMCPの価値は、**Claudeが農場の文脈を理解した上で複合的な操作を自律的に実行できる点**にあります。単なるAPIラッパーではなく、「EC値が高いからポンプを止めて養液を薄める」という判断込みの操作が可能です。

---

## Raspberry Pi MCPサーバーの実装

### 環境構成

OptiensのIoTシステムでは以下の役割分担でMCPを実装しています。

| 機器 | 役割 |
|---|---|
| Raspberry Pi 1（Pi1） | MCPサーバー + Zigbee2MQTT + Mosquittoブローカー |
| Raspberry Pi 2（Pi2） | センサー読取 + MQTTパブリッシュ |
| iPhone（Claude Code） | MCPクライアント（自然言語で操作） |

Pi1がMCPサーバーとして外部（Claude）からの命令を受け付け、MQTTを通じてPi2のセンサー値取得やZigbeeスイッチ制御を実行します。

### MCPサーバーのセットアップ

Pythonの公式MCP SDKを使用します。

```bash
pip install mcp
```

MCPサーバーの基本実装（`farm_mcp_server.py`）：

```python
import asyncio
import json
import paho.mqtt.client as mqtt
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

app = Server("optiens-farm")
mqtt_client = mqtt.Client()
mqtt_client.connect("localhost", 1883)
latest_sensors = {}

def on_message(client, userdata, msg):
    """MQTTからセンサーデータを受信してキャッシュ"""
    topic_map = {
        "optiens/sensors/ec":         "ec",
        "optiens/sensors/ph":         "ph",
        "optiens/sensors/water_temp": "water_temp",
        "optiens/sensors/air_temp":   "air_temp",
        "optiens/sensors/humidity":   "humidity",
        "optiens/sensors/co2":        "co2",
    }
    if msg.topic in topic_map:
        payload = json.loads(msg.payload)
        latest_sensors[topic_map[msg.topic]] = payload

mqtt_client.on_message = on_message
for topic in ["optiens/sensors/#"]:
    mqtt_client.subscribe(topic)
mqtt_client.loop_start()

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="get_sensor_data",
            description="現在の農場センサーデータを取得（EC値・pH・水温・気温・湿度・CO2）",
            inputSchema={"type": "object", "properties": {}, "required": []},
        ),
        types.Tool(
            name="control_device",
            description="農場機器（LED・ポンプ・ヒーター）のON/OFF制御",
            inputSchema={
                "type": "object",
                "properties": {
                    "device": {"type": "string", "enum": ["led", "pump", "heater"]},
                    "state":  {"type": "string", "enum": ["on", "off"]},
                },
                "required": ["device", "state"],
            },
        ),
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "get_sensor_data":
        if not latest_sensors:
            return [types.TextContent(type="text", text="センサーデータ未受信")]
        lines = [f"- {k}: {v['value']} {v.get('unit', '')}"
                 for k, v in latest_sensors.items()]
        return [types.TextContent(type="text", text="\n".join(lines))]

    if name == "control_device":
        topic = f"optiens/control/{arguments['device']}"
        mqtt_client.publish(topic, json.dumps({"state": arguments["state"]}))
        return [types.TextContent(
            type="text",
            text=f"{arguments['device']} を {arguments['state']} にしました",
        )]

    return [types.TextContent(type="text", text=f"不明なツール: {name}")]

async def main():
    async with stdio_server() as streams:
        await app.run(streams[0], streams[1], app.create_initialization_options())

asyncio.run(main())
```

### Claude CodeへのMCP登録

`~/.claude.json`（または `claude mcp add` コマンド）でMCPサーバーを登録します。

```json
{
  "mcpServers": {
    "optiens-farm": {
      "command": "python",
      "args": ["/home/pi/farm_mcp_server.py"],
      "env": {}
    }
  }
}
```

SSH経由でリモート接続する場合は、`command` に `ssh pi@pi1.local python /home/pi/farm_mcp_server.py` を指定することで、iPhoneのClaude Codeアプリから直接Raspberry Piを操作できます。

---

## 実際の操作例

MCPサーバー稼働後、Claude Codeとの対話は以下のようになります。

**センサーデータの確認：**
```
オーナー: 今の農場の状態は？

Claude: 現在のセンサーデータです：
- EC値: 1.85 mS/cm（推奨範囲: 1.5〜2.5）→ 正常
- pH: 6.2（推奨範囲: 5.5〜7.0）→ 正常
- 水温: 21.3℃（推奨範囲: 15〜28℃）→ 正常
- 気温: 24.1℃ / 湿度: 68%
- CO2: 820 ppm

すべての値が推奨範囲内です。
```

**機器制御：**
```
オーナー: 今夜だけLEDを早めに消して

Claude: 何時に消灯しますか？通常の消灯時間も教えてください。

オーナー: 今夜だけ20時に。いつもは22時。

Claude: LEDを20時に消灯するようにスケジュールします。
[tool: control_device {"device": "led", "state": "off"}]
20時にLEDを消灯しました。明日は通常の22時消灯に戻ります。
```

**複合判断：**
```
オーナー: 今週のEC値が気になる

Claude: センサーログを確認します。
[tool: get_sensor_data]
今週のEC値の傾向：月曜2.1→水曜1.9→金曜1.7と緩やかに低下しています。
養液の消費が進んでいる可能性があります。次の水やりのタイミングで
養液を補充することをお勧めします。
```

---

## Optiensでの取り組みと今後の展望

現在Phase 1では、上記の基本実装を稼働させ、センサー読取・LED/ポンプ制御・履歴参照の3機能をClaude Codeから操作できる状態を構築中です。

Phase 2以降では、MCPツールを拡張し、**収穫予測・施肥スケジュール自動生成・異常検知アラート**といった高度な機能を追加予定です。Supabaseに蓄積した時系列データをMCPのResourcesとして公開することで、Claudeが過去のデータを参照しながら栽培管理の意思決定を支援します。

将来的に就労支援事業所へのシステム導入を見据えると、MCPによるAI操作インターフェースは重要な差別化要素になります。専門的なITスキルがなくても、スマートフォンから自然言語で農場を管理できる仕組みは、福祉現場でのハードルを大幅に下げます。

---

## まとめ

MCP（Model Context Protocol）を農業IoTに適用することで、次の3点が実現します。

1. **自然言語による農場操作**：コマンド暗記不要、文脈を理解したAIが最適な操作を実行
2. **標準化されたインターフェース**：Claude以外のMCP対応AIエージェントとも互換性あり
3. **段階的な機能拡張**：ツール定義を追加するだけで制御できる対象を増やせる

AIが農場のデータを理解し、人間の意図を汲んで自律的に動く——MCPはその実現を大きく手助けする技術です。センサー収集（MQTT）、クラウド蓄積（Supabase）、AI操作（MCP）を組み合わせたOptiensのアーキテクチャは、小規模な植物工場から全国展開まで一貫して使える基盤になります。

---

*参考資料:*
- *Model Context Protocol — Anthropic公式ドキュメント (modelcontextprotocol.io)*
- *MCP Python SDK — GitHub (modelcontextprotocol/python-sdk)*
- *Eclipse Paho Python MQTT Client*
