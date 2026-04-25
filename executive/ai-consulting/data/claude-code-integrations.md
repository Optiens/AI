---
source: Web検索（GitHub MCP公式リポジトリ、Glama.ai、mcpservers.org、各社プレスリリース）
date: 2026-04-25
category: 技術トレンド
status: 初版
owner: アレクセイ・モロゾフ（CRO）
---

# Claude Code 連携可能サービス一覧

## 概要

Claude Codeは以下の方法で外部サービスと連携できる:

1. **内蔵ツール**: Read / Write / Edit / Bash / Glob / Grep / WebSearch / WebFetch（標準搭載）
2. **MCPサーバー**: Model Context Protocolで外部ツールに接続（設定ファイルで追加）
3. **API直接呼び出し**: Bashツール経由でcurl/CLIコマンドを実行
4. **自動化プラットフォーム経由**: Zapier MCP / n8n MCP で間接的に数千サービスに接続

MCPサーバーの総数は22,000以上（2026年4月時点、Glama.aiレジストリ）。

---

## 1. コミュニケーション

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **Slack** | 公式MCP | チャンネルへの定期レポート自動投稿、メッセージ検索 | あり（制限付き） |
| **LINE公式アカウント** | 公式MCP（LINE社） | AIエージェントから顧客へメッセージ配信、予約リマインド | あり（月200通） |
| **Discord** | コミュニティMCP | サーバー管理、メッセージ送受信、bot連携 | あり |
| **Telegram** | コミュニティMCP | bot経由の通知・メッセージ送信 | あり |
| **Email（Gmail等）** | コミュニティMCP / Zapier MCP | 定型メール自動送信、受信メール分析 | あり |

## 2. プロジェクト管理・タスク管理

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **Notion** | 公式MCP（Notion社） | ページ作成・更新、データベース操作、タスク管理 | あり |
| **Linear** | コミュニティMCP | Issue作成・更新、スプリント管理 | あり（小規模） |
| **Jira** | コミュニティMCP / GitKraken MCP | チケット作成・検索・更新 | あり（10名以下） |
| **Asana** | コミュニティMCP / Zapier MCP | タスク・プロジェクト管理、タイムライン検索 | あり |
| **Todoist** | コミュニティMCP | タスク作成・完了管理 | あり |
| **Trello** | コミュニティMCP | ボード・カード操作 | あり |
| **Google Tasks** | API直接（gcloud CLI） | タスク追加・完了・期限管理（Optiensで運用中） | あり |

## 3. ファイル・ドキュメント

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **Google Drive** | 公式MCP（Anthropic参照実装） | ファイル検索・内容取得、Docs/Sheets/Slides読み書き | あり（15GB） |
| **Dropbox** | コミュニティMCP / Zapier MCP | ファイル管理・共有リンク生成 | あり（2GB） |
| **OneDrive** | コミュニティMCP / n8n MCP | ファイル操作（14操作対応） | あり（5GB） |
| **Obsidian** | コミュニティMCP | ナレッジベース（Vault）へのアクセス・検索 | あり（ローカル） |
| **Contentful** | 公式MCP（Contentful社） | CMSコンテンツの作成・管理 | あり（制限付き） |
| **Webflow** | 公式MCP（Webflow社） | Webサイト・CMS管理 | あり（制限付き） |

## 4. カレンダー・スケジュール

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **Google Calendar** | コミュニティMCP / Google Drive MCP | 予定の作成・検索・リマインド設定 | あり |
| **Outlook Calendar** | コミュニティMCP | Microsoft 365カレンダー操作 | あり（個人） |
| **CalDAV** | コミュニティMCP | 標準プロトコル経由のカレンダー操作 | - |

## 5. 会計・財務

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **freee会計** | 公式MCP（freee社OSS） | 仕訳登録、請求書作成、勤怠管理、給与計算。約330 API対応 | なし（有料プラン必須） |
| **マネーフォワード** | 公式MCP（リモートMCP） | 会計データ参照・操作。2026年3月全プラン対応 | なし |
| **Stripe** | 公式MCP（Stripe社） | 決済処理、サブスク管理、売上データ取得 | あり（従量課金） |
| **Square** | 公式MCP | POS・決済データ連携 | あり（従量課金） |
| **Chargebee** | 公式MCP | サブスクリプション管理 | あり（制限付き） |
| **PayPal** | コミュニティMCP | 決済・送金処理 | あり（従量課金） |

## 6. SNS・マーケティング

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **X (Twitter)** | コミュニティMCP（複数） | ツイート投稿・検索・分析、フォロワー管理 | あり（API Free tier制限大） |
| **Instagram** | Ayrshare MCP / API直接 | 投稿管理・分析（Meta API経由） | なし（Ayrshareは有料） |
| **Facebook** | Ayrshare MCP / API直接 | ページ投稿・広告管理 | なし |
| **LinkedIn** | Ayrshare MCP | 投稿・プロフィール管理 | なし |
| **TikTok** | Ayrshare MCP | 動画投稿・分析 | なし |
| **Pinterest** | Ayrshare MCP | ピン作成・ボード管理 | なし |
| **Ahrefs** | 公式MCP（Ahrefs社） | SEO分析・キーワード調査・被リンク分析 | なし |
| **Ayrshare** | 公式MCP（統合SNS） | 13+プラットフォーム統合。1つのMCPで複数SNS操作 | あり（制限付き） |

## 7. CRM・顧客管理

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **Salesforce** | 公式MCP | SOQL検索、レコードCRUD、レポート取得、商談管理 | なし |
| **HubSpot** | 公式MCP（2025年6月〜） | コンタクト検索、ディール更新、アソシエーション管理 | あり（CRM無料版） |
| **Coupler.io** | 公式MCP | Salesforce/HubSpotデータのAI分析 | あり（制限付き） |

## 8. ECサイト

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **Shopify** | 公式MCP（2025年夏〜全ストア標準搭載） | 商品管理、在庫確認、注文処理、価格更新 | なし（月額$39〜） |
| **BASE** | 未対応（API直接は可能） | 商品・注文管理（REST API経由） | あり |
| **Stripe** | 公式MCP | EC決済・サブスク管理 | あり（従量課金） |

## 9. データベース

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **Supabase** | 公式MCP | テーブル操作、クエリ実行、Edge Functions管理 | あり（500MB） |
| **PostgreSQL** | 公式MCP（Anthropic参照実装） | SQL実行、スキーマ管理 | - |
| **SQLite** | 公式MCP（Anthropic参照実装） | ローカルDB操作・分析 | あり（ローカル） |
| **MySQL** | コミュニティMCP | SQL実行、テーブル管理 | - |
| **MongoDB** | コミュニティMCP | NoSQLドキュメント操作 | あり（Atlas 512MB） |
| **Firebase/Firestore** | コミュニティMCP | ドキュメントCRUD、認証管理 | あり（Sparkプラン） |
| **Redis** | 公式MCP（Anthropic参照実装） | キャッシュ・セッション管理 | あり（制限付き） |
| **Neo4j** | コミュニティMCP | グラフデータベース操作 | あり（Community） |
| **BigQuery** | コミュニティMCP | 大規模データ分析・クエリ | あり（月1TB無料） |
| **Neon** | 公式MCP（Neon社） | サーバーレスPostgres管理 | あり |
| **ClickHouse** | 公式MCP | 分析DB操作 | あり（Cloud） |
| **DuckDB / MotherDuck** | 公式MCP | インプロセスSQL分析 | あり |

## 10. 自動化プラットフォーム

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **Zapier** | 公式MCP | 8,000+アプリ接続。単一MCPで多数サービスに間接連携 | あり（月100タスク） |
| **Make (Integromat)** | 公式MCP | シナリオ実行・自動化ワークフロー管理 | あり（月1,000操作） |
| **n8n** | コミュニティMCP / セルフホスト | ワークフロー自動化。Google Drive等のMCPテンプレート豊富 | あり（セルフホスト無料） |

## 11. 開発・インフラ

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **GitHub** | 公式MCP（GitHub社） | Issue/PR管理、コード検索、リポジトリ操作 | あり |
| **GitLab** | 公式MCP | MR管理、CI/CD操作 | あり |
| **Vercel** | コミュニティMCP / API直接 | デプロイ管理、プロジェクト設定 | あり（Hobby） |
| **AWS** | 公式MCP（複数: Core/CDK/Cost） | インフラ管理、コスト分析、Bedrock連携 | あり（Free Tier） |
| **Cloudflare** | 公式MCP | Workers/Pages/R2等のリソース管理 | あり（Free） |
| **Docker** | コミュニティMCP | コンテナ操作・管理 | あり |
| **Kubernetes** | コミュニティMCP | クラスター管理 | - |
| **Sentry** | 公式MCP（Anthropic参照実装） | エラー追跡・スタックトレース分析 | あり（制限付き） |
| **Grafana** | 公式MCP | ダッシュボード・データソースクエリ | あり（OSS） |
| **CircleCI** | 公式MCP | CI/CDビルド管理 | あり（制限付き） |
| **Azure DevOps** | 公式MCP | パイプライン・リポジトリ管理 | あり（5名以下） |
| **Render** | 公式MCP | サービスデプロイ・DB管理 | あり |
| **Playwright** | コミュニティMCP | ブラウザ自動化・E2Eテスト・スクレイピング | あり（OSS） |
| **Puppeteer** | コミュニティMCP | ブラウザ自動操作 | あり（OSS） |
| **Postman** | 公式MCP | API テスト・ドキュメント管理 | あり |

## 12. 検索・情報取得

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **Brave Search** | 公式MCP（Anthropic参照実装） | Web検索（APIキー必要） | あり（月2,000回） |
| **Perplexity** | 公式MCP（リモート） | AI検索・リサーチ | なし |
| **Tavily** | 公式MCP（リモート） | AI最適化検索エンジン | あり（月1,000回） |
| **SearXNG** | コミュニティMCP | セルフホスト型メタ検索 | あり（OSS） |
| **Exa** | コミュニティMCP | セマンティック検索 | あり（制限付き） |
| **Firecrawl** | コミュニティMCP | Webスクレイピング・データ抽出 | あり（月500回） |
| **Google Maps** | 公式MCP（Anthropic参照実装） | 地図検索、ルート計算、場所情報 | あり（月$200クレジット） |

## 13. AI・メディア生成

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **ElevenLabs** | 公式MCP | テキスト→音声変換 | あり（月1万文字） |
| **Mux** | 公式MCP | 動画API操作・アップロード | あり（制限付き） |
| **Ollama** | コミュニティMCP | ローカルLLM実行 | あり（OSS） |
| **Hugging Face** | コミュニティMCP | モデル実行・推論 | あり |

## 14. IoT・スマートホーム

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **Home Assistant** | コミュニティMCP | スマートデバイス制御・センサーデータ取得 | あり（OSS） |
| **Homey** | コミュニティMCP | ホームオートメーション | なし |

## 15. その他ユーティリティ

| サービス | MCP対応状況 | 活用例 | 無料プラン |
|---|---|---|---|
| **Weather API** | コミュニティMCP | 天気情報取得（農業IoTとの連携に有用） | あり |
| **Time** | 公式MCP（Anthropic参照実装） | タイムゾーン変換 | あり |
| **Memory** | 公式MCP（Anthropic参照実装） | ナレッジグラフ型永続メモリ | あり |
| **Sequential Thinking** | 公式MCP（Anthropic参照実装） | 段階的問題解決 | あり |
| **Screenshot** | コミュニティMCP | デスクトップキャプチャ | あり |
| **MicroCMS** | コミュニティMCP | 記事作成・CMS投稿自動化 | あり（制限付き） |
| **Context7** | コミュニティMCP | ライブラリの最新ドキュメント・コード例提供 | あり |
| **Composio** | 公式MCP（統合プラットフォーム） | 250+ツール統合。単一接続で多数サービスに連携 | あり（制限付き） |

---

## Optiens AI支援事業への活用ポイント

### 小規模事業者に提案しやすい組み合わせ

1. **飲食店**: freee MCP + LINE MCP + Google Calendar MCP
   - 会計自動化 + 予約リマインド + スケジュール管理

2. **小売・EC事業者**: Shopify MCP + Stripe MCP + HubSpot MCP
   - 在庫・注文管理 + 決済 + 顧客管理の統合

3. **士業・コンサル**: Google Drive MCP + Notion MCP + Gmail MCP
   - 書類管理 + ナレッジ管理 + メール自動化

4. **製造・農業**: Supabase MCP + Home Assistant MCP + Slack MCP
   - IoTデータ蓄積 + デバイス制御 + アラート通知

5. **SNSマーケティング全般**: Ayrshare MCP（13+プラットフォーム統合）
   - 1つのMCPで複数SNSへの投稿・分析を一元化

### Zapier MCPによるロングテール対応

Zapier MCPを1つ設定するだけで8,000+アプリに間接接続可能。
個別MCPが存在しないニッチなサービスでもZapier/Make経由で連携できるため、
顧客のツール構成を問わず提案が可能。

---

## 出典

- GitHub MCP公式リポジトリ: https://github.com/modelcontextprotocol/servers
- Glama.ai MCPレジストリ: https://glama.ai/mcp/servers（22,111サーバー登録）
- awesome-mcp-servers: https://github.com/wong2/awesome-mcp-servers
- mcpservers.org: https://mcpservers.org
- MCP公式レジストリ: https://registry.modelcontextprotocol.io/
- freee MCP: https://github.com/freee/freee-mcp
- LINE Bot MCP Server: https://github.com/line/line-bot-mcp-server
- Claude Code MCP ドキュメント: https://code.claude.com/docs/en/mcp
