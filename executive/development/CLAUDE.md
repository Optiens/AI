# 開発部 — ツール開発・API連携・自動化

## 役割
社内ツール・スクリプト開発、API連携、業務自動化を担う。
IoTシステム（水耕栽培制御）の実装コードは `c:\optiens-iot` リポジトリで管理する。

## 担当エージェント
- `critical-analyst` — 技術的な死角・矛盾の検出
- `review-agent` — 成果物の品質チェック

## フォルダ構成
- `tools/` — 社内ツール・スクリプト（画像生成、データ変換等）
- `architecture/` — アーキテクチャ決定記録（ADR）

## 技術スタック
- **Webサイト**: Astro 5 + TypeScript（`c:\workspace\optiens-website`）、Vercel（hnd1）
- **IoT制御**: Python + MQTT（Mosquitto）+ Zigbee2MQTT（`c:\optiens-iot`）
- **エッジ**: Raspberry Pi 4B ×2（Pi1: Zigbee2MQTT+MCP Server / Pi2: センサー+カメラ）
- **センサー**: EC/pH/水温/気温湿度/CO2/照度（MCP3008 ADC経由）
- **制御**: Zigbeeスマートスイッチ + リレーモジュール（ポンプ・LED・ヒーター）
- **AI連携**: Claude Code × MCP（Model Context Protocol）でiPhoneから音声操作
- **クラウド**: Supabase（データ蓄積・ダッシュボード）
- **CI/CD**: GitHub Actions

## 関連リポジトリ
- `c:\workspace\optiens-website` — Webサイト（Astro + Vercel）
- `c:\optiens-iot` — IoT制御システム（RPi + MQTT + Supabase）

## 注意事項
- 不可逆な操作（git push・本番デプロイ等）はオーナー承認必須
- セキュリティ: APIキー・シークレットをコードに含めない
