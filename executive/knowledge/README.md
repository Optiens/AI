# Optiens — Executive Knowledge Base

## フォルダ構成
| フォルダ | 用途 |
|---|---|
| inbox/ | AIが作成したドラフト・メモの一時置き場 |
| meetings/ | 議事録・打合せ記録 |
| report/ | AIが作成した月次・週次レポート |
| projects/ | プロジェクトごとの資料 |
| knowledge/ | AI用ナレッジベース・プロンプト集（本フォルダ）|
| scripts/ | 自動化スクリプト（n8n定義・Shell等）|
| strategy/ | 経営戦略・事業戦略文書 |
| data/ | 市場データ・KPI・業界ニュース |
| archives/ | 過去バージョンのドキュメント |

## 重要ルール
- すべてのドキュメントはMarkdown形式で保存
- ファイル名先頭に日付を付ける（例: `20260309_補助金調査.md`）
- YAMLフロントマターで `source`, `date`, `status`, `owner` を明記
- 最終決定前のドラフトは `[DRAFT]` をファイル名に含める
