# 開発部 — ツール開発・API連携・自動化

## 役割
社内ツール・スクリプト開発、API連携、業務自動化を担う。
IoT・SaaS の実装コードは `c:\optiens-iot` リポジトリで管理する。

## 担当エージェント
- `critical-analyst` — 技術的な死角・矛盾の検出
- `review-agent` — 成果物の品質チェック

## フォルダ構成
- `tools/` — 社内ツール・スクリプト（画像生成、データ変換等）
- `architecture/` — アーキテクチャ決定記録（ADR）

## 技術スタック
- **Webサイト**: Astro 5 + TypeScript（`c:\workspace\optiens-website`）
- **IoT・SaaS**: Python + Supabase（`c:\optiens-iot`）
- **エッジ**: Raspberry Pi + Python
- **クラウド**: Supabase（PostgreSQL + Edge Functions + Storage + Auth）
- **CI/CD**: GitHub Actions

## 関連リポジトリ
- `c:\workspace\optiens-website` — Webサイト（Astro + Vercel）
- `c:\optiens-iot` — IoT・SaaS（Edge + Supabase + OTA）

## 注意事項
- 不可逆な操作（git push・本番デプロイ等）はオーナー承認必須
- セキュリティ: APIキー・シークレットをコードに含めない
