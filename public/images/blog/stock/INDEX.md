# Blog Stock Images — Index

ブログ記事のアイキャッチに使い回すためのストック画像 50 枚を、Imagen 4 Ultra で生成して保管しています。記事執筆時に該当テーマの画像を選び、記事スラッグ名にコピーして使ってください。

**生成日**：2026-05-13
**生成元**：`scripts/generate-blog-stock-50.mjs`
**モデル**：Imagen 4 Ultra (Vertex AI / us-central1)
**スタイル統一**：Modern editorial illustration, clean vector style, no text/logos, business editorial aesthetic

## 使い方

```bash
# 例：stock の concept-01 を 2026-05-20 の新記事に流用
cp public/images/blog/stock/concept-01-human-ai-collaboration.webp \
   public/images/blog/20260520-my-new-article-slug.webp
```

ブログ記事の frontmatter には新しい記事スラッグ名のパスを書きます（memory: `feedback_blog-image-path-naming.md`）。

## カテゴリと一覧

### A. business-ai（AI 活用・業務効率化）10 枚

| # | スラッグ | 用途 |
|---|---|---|
| 01 | business-ai-01-agent-automation | AI エージェントによる業務オーケストレーション全般 |
| 02 | business-ai-02-data-dashboard | データ分析・KPI ダッシュボード |
| 03 | business-ai-03-chatbot-customer-support | 問い合わせ対応・チャットボット |
| 04 | business-ai-04-meeting-minutes | 議事録・要約 |
| 05 | business-ai-05-email-automation | メール自動振り分け・返信下書き |
| 06 | business-ai-06-sns-content | SNS 投稿生成・予約投稿 |
| 07 | business-ai-07-document-creation | 文書作成・共同編集 |
| 08 | business-ai-08-multilingual | 多言語対応・翻訳 |
| 09 | business-ai-09-inventory-management | 在庫管理・自動発注 |
| 10 | business-ai-10-sales-reporting | 売上分析・自動レポート |

### B. security（セキュリティ・リスク管理）10 枚

| # | スラッグ | 用途 |
|---|---|---|
| 01 | security-01-data-protection | データ保護全般 |
| 02 | security-02-credential-vault | 認証鍵管理・シークレット保管 |
| 03 | security-03-incident-response | インシデント対応 |
| 04 | security-04-privacy-personal-data | 個人情報保護 |
| 05 | security-05-authentication-flow | 認証フロー |
| 06 | security-06-vulnerability-audit | 脆弱性監査 |
| 07 | security-07-compliance-checklist | コンプライアンス対応 |
| 08 | security-08-phishing-prevention | フィッシング対策 |
| 09 | security-09-zero-trust-architecture | ゼロトラスト・最小権限 |
| 10 | security-10-data-backup | バックアップ・復旧 |

### C. management（経営判断・中小企業）10 枚

| # | スラッグ | 用途 |
|---|---|---|
| 01 | management-01-executive-decision | 経営者の意思決定 |
| 02 | management-02-roi-analysis | ROI 分析・投資回収 |
| 03 | management-03-dx-transformation | DX 推進・業務変革 |
| 04 | management-04-strategic-planning | 戦略立案・ロードマップ |
| 05 | management-05-subsidy-funding | 補助金活用・採択 |
| 06 | management-06-team-collaboration | チームコラボレーション |
| 07 | management-07-kpi-monitoring | KPI モニタリング |
| 08 | management-08-cost-reduction | コスト削減・効率化 |
| 09 | management-09-business-continuity | 事業継続・冗長化 |
| 10 | management-10-investor-meeting | 投資家向け・資金調達 |

### D. industry（業種別）10 枚

| # | スラッグ | 業種 |
|---|---|---|
| 01 | industry-01-accommodation-pension | 宿泊・ペンション・キャンプ場 |
| 02 | industry-02-restaurant-cafe | 飲食・カフェ |
| 03 | industry-03-bakery | パン屋・菓子製造 |
| 04 | industry-04-winery-brewery | ワイナリー・醸造所 |
| 05 | industry-05-agriculture-farming | 農業・畜産 |
| 06 | industry-06-construction-renovation | 工務店・建設・リフォーム |
| 07 | industry-07-municipality-government | 自治体・行政 |
| 08 | industry-08-retail-shop | 小売店 |
| 09 | industry-09-outdoor-tour-guide | アウトドアガイド・観光 |
| 10 | industry-10-professional-services | 士業・専門サービス |

### E. concept（抽象・コンセプチュアル）10 枚

| # | スラッグ | 用途 |
|---|---|---|
| 01 | concept-01-human-ai-collaboration | 人と AI の協働 |
| 02 | concept-02-future-progress | 成長・未来志向 |
| 03 | concept-03-workflow-automation | ワークフロー自動化 |
| 04 | concept-04-time-saving | 時間節約・余白創出 |
| 05 | concept-05-integration-systems | システム統合・連携 |
| 06 | concept-06-knowledge-management | ナレッジ管理 |
| 07 | concept-07-feedback-loop | PDCA・フィードバックループ |
| 08 | concept-08-scaling-up | スケール拡大 |
| 09 | concept-09-trust-transparency | 透明性・説明可能性 |
| 10 | concept-10-balance-optimization | 最適化・バランス |

## 再生成・追加生成

```bash
# 既存ファイルはスキップされる（冪等性あり）
node scripts/generate-blog-stock-50.mjs
```

50 枚以外のテーマで追加が必要になったら、`scripts/generate-blog-stock-50.mjs` の `items` 配列に新規エントリを追加してから実行してください。
