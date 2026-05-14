-- Curated Optiens operating knowledge from existing internal Markdown documents.
-- Goal: the admin knowledge base should be sufficient for day-to-day operation.

insert into public.knowledge_entries (
  id,
  title,
  category,
  owner,
  visibility,
  maturity,
  summary,
  body,
  tags,
  source,
  updated_at,
  updated_by
) values
(
  'optiens-current-business-principles',
  'Optiens現行事業方針・禁止事項',
  'governance',
  'COO',
  'internal',
  'operational',
  'Optiensを運用する時に最初に確認する、現行事業方針、優先順位、禁止表現、Phase方針の基準。',
  $kb$
## 正本
- `AGENTS.md`
- `executive/marketing/brand-guideline.md`

## 現行方針
合同会社Optiensは、AI支援事業を当面の最優先事業として進める。無料AI活用診断、詳細レポート+60分MTG、導入支援、保守・追加開発へつなげる。

水耕栽培事業は長期目標であり、室内LED×IoT水耕栽培の実証、ユニットエコノミクス証明、就労支援事業所・自治体への導入支援へ段階的に進める。

## 必ず守る禁止事項
- 宇宙・宇宙農業を記述しない
- SaaSプラットフォームの外部販売を収益モデルとして記述しない
- 医療機関、防災拠点、離島・船舶・地下施設など孤立環境をターゲットにしない
- 家庭用ガーデニング、食育教室として扱わない
- 個人向けEC、産直ECをハーブ販売導線として書かない
- ビニールハウス転換を残さない
- 社保スキームを公開サイトに記載しない

## 判断ルール
迷った時は、Phase A1の初受注獲得、顧客満足できる有償診断、導入支援への接続を優先する。旧方針やアーカイブ資料の内容を現行サイト、診断レポート、営業資料へ戻さない。
$kb$,
  array['事業方針', '禁止事項', 'Phase A1', 'AI支援', '水耕栽培', '運用基準'],
  'AGENTS.md; executive/marketing/brand-guideline.md',
  now(),
  'codex'
),
(
  'brand-writing-and-color-standard',
  'ブランドカラー・公開文書ルール',
  'brand',
  'CMO',
  'internal',
  'operational',
  'Web、診断レポート、営業資料、メールで使うブランドカラー、文体、禁止表現の基準。',
  $kb$
## 正本
- `executive/marketing/brand-guideline.md`
- `AGENTS.md`

## ブランドカラー
- Primary Deep Lapis: `#1F3A93`
- Primary Dark: `#152870`
- Secondary Lapis Light: `#6B85C9`
- Accent Sakura: `#E48A95`
- Accent Soft: `#FFCED0`

旧グリーン系 `#2e574c`, `#5ea89a`, `#ea4335` は原則使わない。Webでは `src/styles/global.css` のCSS変数を使い、ページ内で `--brand` を再定義しない。

## 文体
煽り口調、過度な確約、実績を盛る表現を避ける。Phase A1の会社として、現状整理、業務分解、現実的な導入判断を支援する文体にする。

## 公開前チェック
公開ページやレポートには、禁止事項、古い収益モデル、旧ターゲット、古い色が残っていないかを確認する。`ai-examples` 変更時はブランドガードとビルドを実行する。
$kb$,
  array['ブランドカラー', '文体', '公開前チェック', 'Deep Lapis', 'Sakura', '禁止表現'],
  'executive/marketing/brand-guideline.md; AGENTS.md',
  now(),
  'codex'
),
(
  'ai-support-offer-ladder',
  'AI支援事業の商品階段',
  'sales',
  'CEO / COO',
  'internal',
  'operational',
  '無料診断から詳細レポート、導入支援、保守へつなげる商品階段と各商品の役割。',
  $kb$
## 正本
- `executive/ai-consulting/無料版vs有償版_定義.md`
- `executive/ai-consulting/業務フロー定義.md`
- `AGENTS.md`

## 商品階段
1. 無料AI活用診断: 課題の一次整理、AI活用余地、優先順位を提示する入口
2. 詳細レポート+60分MTG: 税込5,500円。有償確認枠であり、顧客の本気度確認と導入支援への橋渡し
3. 導入支援: 個別見積。業務フロー、既存ツール、データ状態、運用担当を見て設計する
4. 保守・追加開発: 月額または継続契約。改善、障害対応、ナレッジ更新を扱う

## 営業判断
詳細レポート単体で大きな利益を出すより、導入支援に進むべき顧客を見極めることを目的にする。無料診断で説明しすぎず、有償版では具体的な業務、効果根拠、導入ステップ、費用感を出す。
$kb$,
  array['AI支援', '商品設計', '無料診断', '詳細レポート', '導入支援', '保守'],
  'executive/ai-consulting/無料版vs有償版_定義.md; executive/ai-consulting/業務フロー定義.md',
  now(),
  'codex'
),
(
  'ai-consulting-sales-operations-sop',
  'AI支援事業の営業・納品フローSOP',
  'operations',
  'COO / CMO',
  'internal',
  'operational',
  '問い合わせから無料診断、有償化、MTG、導入支援提案までの営業運用手順。',
  $kb$
## 正本
- `executive/ai-consulting/業務フロー定義.md`
- `src/pages/admin/leads.astro`

## 基本フロー
1. 無料診断フォーム受信
2. 自動生成・送付状況を管理画面で確認
3. 顧客の業種、課題、反応を見て有償版への案内を判断
4. 有償版申込後は `pending_payment`
5. 入金確認後は `paid`
6. 詳細レポート生成・送付後は `report_sent`
7. MTG日程調整後は `mtg_scheduled`
8. 導入支援提案へ進む場合は個別見積

## 管理画面で見る項目
ステータス、最終エラー、入金、送付URL、顧客メモ、紹介者、フォロー期限を見る。`manual_review`, `quota_retry_pending`, `limit_exceeded` は当日確認する。

## 注意
リード管理はAPI稼働状況と混在させない。案件・リードの判断は `/admin/leads`、APIや自動化障害は稼働確認画面で扱う。
$kb$,
  array['営業運用', 'リード管理', 'ステータス', '有償化', 'MTG', '導入支援'],
  'executive/ai-consulting/業務フロー定義.md; src/pages/admin/leads.astro',
  now(),
  'codex'
),
(
  'paid-diagnosis-full-automation-sop',
  '有償診断の完全自動運用SOP',
  'operations',
  'COO / CTO',
  'internal',
  'operational',
  '有償版AI活用診断を人間チェックなしで提供するための入金、生成、品質ゲート、送付、例外処理の手順。',
  $kb$
## 正本
- `executive/ai-consulting/有償版_完全自動運用手順_v1.0.md`
- `supabase/functions/process-paid-diagnosis/index.ts`
- `src/pages/api/payment-check.ts`
- `src/pages/api/payment-notify.ts`

## 基本方針
有償版も人間チェックなしで自動納品する。ただし、品質ゲートに落ちたレポートは顧客へ送付しない。失敗時は `manual_review` に落とし、ナレッジDBの「有償レポート生成失敗時の手動復旧SOP」に従う。

## 自動フロー
1. 申込完了メールで振込先、請求情報、返金条件を送る
2. 顧客の入金通知または定期チェックで入金を検知する
3. `status=paid` に変更し、領収情報を送る
4. `process-paid-diagnosis` が詳細レポートを生成する
5. Google Slidesを作成・共有する
6. 顧客へ納品メールとMTG案内を送る

## 公開前に必要な設定
Vercel本番環境変数、Supabase Edge Function Secrets、Google Slidesテンプレート、出力フォルダ、Resend、freee、MTG予約URLを確認する。
$kb$,
  array['有償版', '完全自動化', '入金確認', '品質ゲート', 'Google Slides', 'Resend'],
  'executive/ai-consulting/有償版_完全自動運用手順_v1.0.md',
  now(),
  'codex'
),
(
  'paid-report-quality-standard',
  '有償詳細レポート品質基準',
  'ai',
  'CSO / CTO',
  'internal',
  'operational',
  '企業が税込5,500円を払って納得できる有償レポートにするための内容基準。',
  $kb$
## 正本
- `executive/ai-consulting/有償版_詳細レポート設計書_v1.0.md`
- `scripts/generate-paid-pptx.mjs`
- `supabase/functions/process-paid-diagnosis/index.ts`

## 有償版で必要な内容
- 会社情報を踏まえた個別性
- 業務課題とAI活用余地の対応関係
- 7件の具体施策
- 導入優先度
- 概算工数削減
- 月額価値の保守的試算
- 導入ステップ
- 必要ツールや運用体制
- リスクと対策
- 次回MTGで決める事項

## 自動生成の品質ゲート
未置換プレースホルダー、禁止語、施策欠落、数値根拠不足を検知したら送付しない。無料版と違い、一般論だけのレポート、抽象的な提案、顧客が次に動けない資料は有償品質として不可。
$kb$,
  array['有償レポート', '品質基準', '7施策', '効果試算', '品質ゲート'],
  'executive/ai-consulting/有償版_詳細レポート設計書_v1.0.md; supabase/functions/process-paid-diagnosis/index.ts',
  now(),
  'codex'
),
(
  'free-diagnosis-report-generation-sop',
  '無料診断レポート生成SOP',
  'operations',
  'CTO / CMO',
  'internal',
  'operational',
  '無料AI活用診断レポートの生成、送付、失敗時対応、詳細版への接続の基準。',
  $kb$
## 正本
- `executive/ai-consulting/無料診断Slidesテンプレ仕様.md`
- `scripts/generate-diagnosis-pptx.mjs`
- `supabase/functions/process-diagnosis/index.ts`
- `.agents/skills/generate-diagnosis-report/SKILL.md`

## 目的
無料診断は、顧客の課題を一次整理し、AI活用の方向性を示す入口。無料版では過度に詳細な設計や見積を出しすぎず、詳細版や導入支援に進む理由を残す。

## 運用
フォーム受信後、自動生成、Google Slides作成、送付を行う。失敗時は `manual_review`、クォータ問題は `quota_retry_pending` として管理画面で確認する。

## 詳細版への接続
無料版では「何ができそうか」を示し、有償版では「どの業務に、どの順番で、どれくらいの効果を狙って導入するか」まで出す。
$kb$,
  array['無料診断', 'Slides', '自動生成', 'manual_review', '詳細版導線'],
  'executive/ai-consulting/無料診断Slidesテンプレ仕様.md; supabase/functions/process-diagnosis/index.ts',
  now(),
  'codex'
),
(
  'ai-consulting-term-master',
  'AI支援事業 用語マスタ',
  'brand',
  'CMO / COO',
  'internal',
  'operational',
  'AI支援事業で使う用語、避ける表現、顧客向けに言い換える表現の基準。',
  $kb$
## 正本
- `executive/ai-consulting/用語マスタ.md`
- `executive/marketing/brand-guideline.md`

## 使い方
Web、診断レポート、メール、営業資料で表現が揺れたら用語マスタを優先する。AIを魔法のように見せず、業務分解、社内データ、運用設計、確認フローとして説明する。

## 表現方針
- 「AIで何でも自動化」ではなく「定型判断、文書作成、検索、確認、集計の一部を任せる」
- 「必ず成果が出る」ではなく「現状情報をもとに、費用対効果を検証する」
- 「安く早く」だけでなく「小さく始めて、運用で育てる」

## 注意
禁止事項と旧方針に関わる語は、顧客向け文書や自動生成プロンプトに混ぜない。
$kb$,
  array['用語', '表記', '言い換え', 'AI支援', '営業資料'],
  'executive/ai-consulting/用語マスタ.md',
  now(),
  'codex'
),
(
  'spot-ticket-product-sop',
  'スポットチケット商品SOP',
  'sales',
  'CEO / CMO',
  'internal',
  'operational',
  'AI導入支援の前後で使うスポット相談・作業チケットの商品設計と使いどころ。',
  $kb$
## 正本
- `executive/ai-consulting/スポットチケット_商品設計書_v1.0.md`

## 目的
導入支援契約に進む前、または保守契約ほど継続しない顧客に対して、単発の相談・小規模作業・資料レビュー・設定支援を提供する。

## 使いどころ
- 詳細レポート後、すぐ導入支援には進まないが具体相談がある
- 社内資料、プロンプト、業務フローを短時間で整えたい
- 本契約前の小さな信頼形成をしたい

## 注意
スポット対応を増やしすぎると代表1名体制では納期が崩れる。管理画面で未対応数、期限、売上単価を確認し、導入支援や保守へ移せる案件を優先する。
$kb$,
  array['スポットチケット', '商品設計', '単発相談', '営業', '導入支援'],
  'executive/ai-consulting/スポットチケット_商品設計書_v1.0.md',
  now(),
  'codex'
),
(
  'invoice-receipt-qualified-invoice-sop',
  '請求書・領収書・インボイス運用SOP',
  'operations',
  'CFO / COO',
  'internal',
  'operational',
  '有償診断、導入支援、保守で使う請求書、領収書、適格請求書情報、返金記録の運用。',
  $kb$
## 正本
- `executive/legal-ip/templates/README.md`
- `executive/legal-ip/templates/DRAFT_請求書テンプレ_v0.1.md`
- `executive/legal-ip/templates/DRAFT_領収書テンプレ_v0.1.md`
- `src/lib/paid-billing.ts`

## 有償診断の基本
税込5,500円。税抜5,000円、消費税10% 500円。登録番号は `T9090003003025`。申込完了メールに請求情報、入金確認メールに領収情報を記載する。

## freee運用
入金確認後、freee側で売上として記録する。顧客から正式PDFを求められた場合は、申込番号を参照して請求書または領収書を発行する。

## 返金時
管理画面で対象リードを `cancelled` にし、`admin_notes` に返金理由、返金日、freee処理IDを残す。既発行メールやPDFとの対応関係を残す。

## 注意
法務・税務テンプレートはドラフト。大きな契約や外部提示前は専門家確認を前提にする。
$kb$,
  array['請求書', '領収書', 'インボイス', 'freee', '返金', '適格請求書'],
  'executive/legal-ip/templates/README.md; src/lib/paid-billing.ts',
  now(),
  'codex'
),
(
  'contract-template-catalog-sop',
  '契約書・法務テンプレート運用',
  'governance',
  'CLO / COO',
  'internal',
  'operational',
  '導入支援、保守、技術コンサル、NDA、紹介契約などのテンプレートの所在と使い方。',
  $kb$
## 正本
- `executive/legal-ip/templates/README.md`
- `executive/legal-ip/templates/技術コンサルティング契約書_テンプレート.md`
- `executive/legal-ip/templates/システム導入支援契約書_テンプレート.md`
- `executive/legal-ip/templates/保守サポート契約書_テンプレート.md`
- `executive/legal-ip/templates/DRAFT_NDA_v0.1.md`

## 運用
契約書類はドラフトであり、本番利用前に弁護士確認を受ける。軽微な見積、請求、領収と、継続契約・成果物責任・個人情報・秘密情報を含む契約は分けて扱う。

## 使い分け
- 導入支援: 個別見積、要件、成果物、検収、責任範囲を明確化
- 保守: 月額範囲、対応時間、対象外作業、解約条件を明確化
- 技術コンサル: 助言、調査、資料作成など成果物と責任範囲を限定
- NDA: 顧客資料、業務データ、未公開情報を扱う時に使用

## 注意
テンプレートをそのまま顧客に送らない。案件内容に合わせて条項を確認し、変更履歴を残す。
$kb$,
  array['契約書', 'NDA', '導入支援', '保守', '法務', 'テンプレート'],
  'executive/legal-ip/templates/README.md',
  now(),
  'codex'
),
(
  'referral-partner-sop',
  '紹介制度・営業パートナー運用SOP',
  'sales',
  'CEO / COO',
  'internal',
  'operational',
  '商工会、福祉コンサルタント、営業パートナーなど紹介経由案件の記録、紹介料、社内メモの扱い。',
  $kb$
## 正本
- `executive/legal-ip/templates/紹介料規定_v1.1.md`
- `executive/legal-ip/templates/紹介制度ご案内_v1.1.md`
- `src/pages/api/admin/lead-update.ts`

## 運用
紹介経由案件は、紹介者名、紹介元、申込日、入金日、対象商品、紹介料対象かを管理画面に記録する。

## 無料化・紹介対応
紹介経由で無料化する場合でも、ステータス、金額、紹介者名、メール送信履歴を残す。無料化は営業上の施策であり、通常価格や商品価値を曖昧にしない。

## 注意
紹介料は契約、請求、支払条件、反社確認、税務処理が絡む。外部パートナーと継続運用する前に、規定と契約書を確認する。
$kb$,
  array['紹介', '営業パートナー', '紹介料', '無料化', 'リード管理'],
  'executive/legal-ip/templates/紹介料規定_v1.1.md; executive/legal-ip/templates/紹介制度ご案内_v1.1.md',
  now(),
  'codex'
),
(
  'monthly-accounting-review-sop',
  '月次会計レビューSOP',
  'operations',
  'CFO',
  'internal',
  'operational',
  '毎月のfreee、入金、経費、役員報酬、税務準備を確認するための会計運用手順。',
  $kb$
## 正本
- `executive/finance/月次レビューフォーマット_v1.0.md`
- `executive/finance/経費精算運用ルール_v1.0.md`
- `executive/finance/法人税申告準備リスト_第1期.md`
- `.agents/skills/monthly-accounting-check/SKILL.md`

## 月初に確認すること
- 前月売上、入金、未収
- freeeの銀行同期と未処理明細
- 経費領収書の漏れ
- 役員報酬、社会保険、税金関連
- 有償診断、導入支援、保守売上の分類
- 返金があれば売上取消または返金取引

## 記録
月次レビュー結果、異常値、未処理タスク、翌月の確認事項を残す。金額は推測で書かず、freeeや銀行明細を根拠にする。
$kb$,
  array['月次会計', 'freee', '経費', '法人税', '入金', '返金'],
  'executive/finance/月次レビューフォーマット_v1.0.md; executive/finance/経費精算運用ルール_v1.0.md',
  now(),
  'codex'
),
(
  'expense-reimbursement-sop',
  '経費精算・証憑管理SOP',
  'operations',
  'CFO',
  'internal',
  'operational',
  '領収書、請求書、カード明細、事業用支出をfreeeに残すための経費精算ルール。',
  $kb$
## 正本
- `executive/finance/経費精算運用ルール_v1.0.md`
- `executive/legal-ip/templates/DRAFT_領収書テンプレ_v0.1.md`

## 基本
事業支出は証憑を残し、日付、支払先、金額、用途、関連案件を確認できるようにする。AI支援、水耕栽培、共通管理費を混ぜず、後で月次レビューできる粒度にする。

## freee登録
銀行・カード明細と証憑を突合し、未処理を残さない。手入力した場合は重複登録に注意する。

## 注意
領収書がない支出、私用混在、返金、立替はメモを残す。税務判断が必要なものは月次レビューで保留にし、独断で処理しない。
$kb$,
  array['経費精算', '証憑', 'freee', '領収書', '月次レビュー'],
  'executive/finance/経費精算運用ルール_v1.0.md',
  now(),
  'codex'
),
(
  'tax-filing-prep-first-period',
  '第1期 法人税申告準備SOP',
  'governance',
  'CFO',
  'internal',
  'seed',
  '第1期の法人税申告に向けて、日々残すべき証憑、会計データ、確認事項の一覧。',
  $kb$
## 正本
- `executive/finance/法人税申告準備リスト_第1期.md`

## 目的
決算期末にまとめて慌てないため、売上、経費、役員報酬、税金、契約、請求・領収、返金、補助金関連の証憑を日々整理する。

## 必須管理
- freeeの未処理明細を減らす
- 請求書、領収書、契約書、見積書を案件と紐づける
- 個人支出と法人支出を分ける
- 売上計上日と入金日を区別する
- 返金と取消は理由を残す

## 注意
税務判断が必要な項目はナレッジだけで完結させず、税理士確認に回す。
$kb$,
  array['法人税', '決算', '第1期', 'freee', '証憑', '税務'],
  'executive/finance/法人税申告準備リスト_第1期.md',
  now(),
  'codex'
),
(
  'openai-quota-monitoring-sop',
  'OpenAIクォータ監視SOP',
  'ai',
  'CTO',
  'internal',
  'operational',
  'OpenAI APIの残高、利用上限、リトライ待ち、診断生成停止を監視する運用手順。',
  $kb$
## 正本
- `docs/operations/openai-quota-monitoring.md`
- `src/pages/admin/api-status.astro`
- `supabase/functions/process-diagnosis/index.ts`

## 目的
無料診断や有償レポートがAPIクォータ、残高、レート制限で止まることを早期検知する。

## 確認項目
- OpenAIダッシュボードの利用上限と残高
- `quota_retry_pending` のリード数
- `ai_api_events` のエラー率
- Vercel CronとSupabase Edge Functionの実行状況

## 対応
クォータや残高が原因なら、顧客へ不完全な資料を送らず復旧後に再処理する。有償版が止まった場合は、手動復旧SOPまたは返金判断へ進む。
$kb$,
  array['OpenAI', 'クォータ', 'API監視', 'quota_retry_pending', 'ai_api_events'],
  'docs/operations/openai-quota-monitoring.md',
  now(),
  'codex'
),
(
  'google-slides-automation-gcp-sop',
  'Google Slides自動化・GCP設定SOP',
  'ai',
  'CTO',
  'internal',
  'operational',
  '診断レポートをGoogle Slidesで自動生成するためのGCP、Service Account、Drive権限、環境変数の基準。',
  $kb$
## 正本
- `executive/development/GCPセットアップ手順書_Slides自動化.md`
- `scripts/test-paid-template.mjs`
- `scripts/update-paid-slides-template.mjs`

## 必須要素
- Google Cloud Project
- Google Slides API / Drive API
- Service Account
- Service Account private key
- テンプレートSlides ID
- 出力フォルダID
- テンプレートとフォルダのService Account共有権限

## 障害時の見方
Slides URLが作れない場合は、テンプレートID、フォルダID、API有効化、秘密鍵改行、共有権限を確認する。メールだけ失敗した場合はResend側、URL生成前ならGoogle側を優先して見る。

## 注意
秘密鍵やサービスアカウント情報はナレッジ本文に貼らない。環境変数名と確認箇所だけを残す。
$kb$,
  array['Google Slides', 'GCP', 'Service Account', 'Drive API', '環境変数'],
  'executive/development/GCPセットアップ手順書_Slides自動化.md',
  now(),
  'codex'
),
(
  'ai-hourly-value-benchmark',
  '業務階層別時給・効果試算基準',
  'sales',
  'CFO / CSO',
  'internal',
  'operational',
  '診断レポートで削減時間や月額価値を過大評価しないための時給ベンチマーク。',
  $kb$
## 正本
- `executive/research/data/20260513_業務階層別時給相場.md`

## 使い方
無料診断・有償レポート・提案書で、時間削減効果を金額換算する時の保守的な基準として使う。顧客が納得できるよう、職種や業務階層に応じた時給を使い、過大なROIを出さない。

## 原則
- 下限または保守値を採用する
- 時給を盛らない
- 「削減時間 × 時給」は効果の一部であり、売上増や品質向上とは分ける
- 有償版では算式と前提を明示する

## 注意
効果試算を盛ると導入支援時の信頼を失う。迷ったら保守側に倒す。
$kb$,
  array['時給', '効果試算', 'ROI', '有償レポート', '保守的試算'],
  'executive/research/data/20260513_業務階層別時給相場.md',
  now(),
  'codex'
),
(
  'ai-support-pricing-strategy',
  'AI支援事業 価格戦略メモ',
  'sales',
  'CEO / CFO',
  'internal',
  'operational',
  '無料診断、詳細レポート、導入支援、保守の価格判断と値付けの考え方。',
  $kb$
## 正本
- `executive/research/data/20260501_AI支援事業_価格戦略メモ.md`
- `AGENTS.md`

## 現行価格階段
- 無料レポート: 0円
- 詳細レポート+60分MTG: 税込5,500円
- 導入支援: 個別見積
- 保守・研修: 別途見積または月額

## 判断
詳細レポートは単体利益よりも、本気度確認と導入支援への接続を重視する。導入支援は業務範囲、データ状態、既存ツール、運用担当、セキュリティ要件で見積を変える。

## 注意
低単価の有償診断で返金交渉に時間を使いすぎない。顧客満足と次の受注につながる信頼を優先する。
$kb$,
  array['価格戦略', '詳細レポート', '導入支援', '保守', '返金'],
  'executive/research/data/20260501_AI支援事業_価格戦略メモ.md; AGENTS.md',
  now(),
  'codex'
),
(
  'ai-security-risk-consulting-notes',
  'AI導入セキュリティ懸念と提案時の説明',
  'ai',
  'CTO / CMO',
  'internal',
  'operational',
  '中小企業へAI導入を提案する時に説明すべき情報漏洩、権限、ログ、運用ルールの論点。',
  $kb$
## 正本
- `executive/research/data/20260423_AI導入セキュリティ懸念調査.md`
- `src/content/blog/20260505-hallucination-business-control.md`
- `src/content/blog/20260506-ai-delegation-risk-and-audit.md`

## 提案時に見る論点
- 顧客情報、個人情報、契約書、会計情報をAIに入れてよいか
- 社内ルールと権限管理
- ログ、監査、承認フロー
- ハルシネーション対策
- 重要判断を人間が確認する範囲

## Optiensの説明方針
AI導入は「全部自動化」ではなく、業務分解、権限設計、確認フロー、ログ管理をセットで設計する。小さく始め、情報の種類ごとに使えるAIと使えないAIを分ける。

## 注意
セキュリティ懸念を軽く扱わない。顧客が怖がっている場合は、リスクを否定せず、制御方法を示す。
$kb$,
  array['セキュリティ', '情報漏洩', '権限', '監査ログ', 'AI導入'],
  'executive/research/data/20260423_AI導入セキュリティ懸念調査.md',
  now(),
  'codex'
),
(
  'subsidy-positioning-compliance',
  '補助金訴求・適用可能性の注意点',
  'sales',
  'CFO / CMO',
  'internal',
  'operational',
  'AI診断や導入支援を補助金文脈で説明する時の適用可能性、リスク、禁止表現。',
  $kb$
## 正本
- `executive/research/data/20260424_AI診断サービス補助金適用調査.md`
- `executive/research/data/20260424_補助金訴求_法的リスク検証.md`
- `.agents/skills/subsidy-matching-guidelines/SKILL.md`

## 方針
補助金は顧客の導入判断を助ける情報として扱う。採択や補助対象を確約しない。制度名、対象経費、申請時期、要件は変わるため、最新公募要領を確認する。

## 表現
「使える可能性がある」「対象になり得る」「公募要領確認が必要」と書く。断定、採択保証、実質無料といった表現は避ける。

## 運用
補助金相談が来たら、対象制度、顧客属性、事業内容、申請期限、対象経費、見積書、実績報告負担を確認する。
$kb$,
  array['補助金', '助成金', '法的リスク', '公募要領', '営業訴求'],
  'executive/research/data/20260424_AI診断サービス補助金適用調査.md; executive/research/data/20260424_補助金訴求_法的リスク検証.md',
  now(),
  'codex'
),
(
  'admin-dashboard-and-daily-check-sop',
  '管理ダッシュボード・日次チェックSOP',
  'operations',
  'COO',
  'internal',
  'operational',
  '管理画面、日次メール、Google Tasks、API稼働、リード、ナレッジを毎日確認する運用。',
  $kb$
## 正本
- `AGENTS.md`
- `src/lib/admin-ops.ts`
- `src/lib/admin-report-catalog.ts`
- `.agents/skills/check-deadlines/SKILL.md`

## 毎日見るもの
- 今日の対応タスク
- 期限超過・期限接近タスク
- 無料診断と有償レポートの処理状況
- `manual_review`, `quota_retry_pending`, `limit_exceeded`
- 入金待ち、入金済み、レポート送付待ち
- APIエラー、クォータ、メール送信
- ナレッジDBの不足

## 使い分け
リード・案件は `/admin/leads`、ナレッジは `/admin/knowledge`、APIや自動化は稼働確認、監査ログは `/admin/audit` で確認する。

## 注意
管理画面は見るだけでなく、次の行動を決めるための画面。問題がなければ簡潔に、問題があれば対象IDと対応案を残す。
$kb$,
  array['管理画面', '日次チェック', 'Google Tasks', 'API稼働', 'ナレッジDB'],
  'AGENTS.md; src/lib/admin-report-catalog.ts',
  now(),
  'codex'
),
(
  'knowledge-db-growth-loop-sop',
  'ナレッジDB更新ループSOP',
  'operations',
  'COO',
  'internal',
  'operational',
  '社内ナレッジDBを日々育て、Optiensがナレッジ確認だけで運用できる状態へ近づける手順。',
  $kb$
## 正本
- `src/pages/admin/knowledge.astro`
- `src/lib/optiens-knowledge.ts`
- `supabase/migrations/20260514_admin_ops_tables.sql`

## 目的
ナレッジDBは、代表1名体制でも業務判断を再現できるようにするための社内基盤。新しい作業、失敗、顧客対応、判断基準はSOP化して残す。

## 追加する基準
- 同じ質問が2回出た
- 判断に迷った
- 失敗時の復旧手順が必要
- 顧客対応文面が必要
- 価格、返金、契約、税務、API障害など判断が属人化しやすい

## 書き方
タイトル、目的、正本、手順、判断基準、注意点、検索キーワードを入れる。古い方針や公開できない秘密情報はそのまま貼らない。
$kb$,
  array['ナレッジDB', 'SOP', '引き継ぎ', '運用', '更新ループ'],
  'src/pages/admin/knowledge.astro; supabase/migrations/20260514_admin_ops_tables.sql',
  now(),
  'codex'
),
(
  'hydroponics-unit-economics-gate',
  '水耕栽培ユニットエコノミクス判定',
  'hydroponics',
  'CFO / CRO',
  'internal',
  'operational',
  '室内LED×IoT水耕栽培を拡大する前に必ず見る、1株コスト、電力、収穫安定性の判定基準。',
  $kb$
## 正本
- `executive/research/data/20260325_ユニットエコノミクス算出方法.md`
- `executive/research/data/20260325_ユニットエコノミクス査読結果.md`
- `AGENTS.md`

## 原則
ユニットエコノミクスの証明なくして拡大しない。水耕栽培は、販売より先に実証と数値管理を優先する。

## H2移行条件
- 1株あたりコストが販売価格の40%以下
- 週次収穫量CVが20%以内
- レストラン2軒以上の継続発注
- IoTが1ヶ月無停止

## 管理指標
1株コスト、LED電気代比率、kWh/kg、週次収穫量CV、IoT停止時間、収穫量、販売単価を記録する。
$kb$,
  array['水耕栽培', 'ユニットエコノミクス', 'H2移行条件', 'kWh/kg', '収穫CV'],
  'executive/research/data/20260325_ユニットエコノミクス算出方法.md; AGENTS.md',
  now(),
  'codex'
),
(
  'hydroponics-success-and-failure-lessons',
  '水耕栽培 成功企業・失敗回避メモ',
  'hydroponics',
  'CRO / CFO',
  'internal',
  'operational',
  '植物工場・水耕栽培の成功企業調査から、Optiensが拡大前に守るべき教訓を整理する。',
  $kb$
## 正本
- `executive/research/data/20260325_水耕栽培成功企業調査.md`
- `executive/research/reports/20260323_水耕栽培_高単価ハーブ生産事業_調査.md`

## 教訓
大規模化の前に、品目、販路、電気代、作業工数、収穫安定性、販売単価を確認する。栽培技術だけでなく、継続発注と利益が重要。

## Optiensでの適用
自社農場はショーケースと実証の位置づけ。高単価ハーブ、地元レストラン、道の駅、業務用ECを中心に検証する。家庭向けや教育用途に寄せない。

## 注意
成功事例をそのまま真似しない。代表1名体制、初期資金、室内LED×IoTの前提で成立する範囲に絞る。
$kb$,
  array['水耕栽培', '成功企業', '高単価ハーブ', '販路', '失敗回避'],
  'executive/research/data/20260325_水耕栽培成功企業調査.md; executive/research/reports/20260323_水耕栽培_高単価ハーブ生産事業_調査.md',
  now(),
  'codex'
),
(
  'hydroponics-iot-equipment-reference',
  '水耕栽培IoT機器・計測設計メモ',
  'hydroponics',
  'CTO / CRO',
  'internal',
  'seed',
  'Raspberry Pi、Zigbee、センサー、Supabaseを使った室内水耕栽培の計測・制御構成。',
  $kb$
## 正本
- `executive/research/data/20260324_水耕栽培IoT機器比較調査.md`
- `AGENTS.md`

## 構成
Pi1はZigbee2MQTTとMCP Server、Pi2はセンサーとカメラを想定する。EC、pH、水温、気温湿度、CO2、照度、電力、収穫量を記録し、Supabaseへ蓄積する。

## 管理目的
自動制御そのものより、ユニットエコノミクスの証明と安定栽培の再現性を優先する。電力、収穫量、停止時間、環境値を後から分析できる形で残す。

## 注意
導入支援として外部展開する前に、自社環境で1ヶ月無停止と収穫安定性を確認する。
$kb$,
  array['IoT', 'Raspberry Pi', 'Zigbee', 'Supabase', 'センサー', '水耕栽培'],
  'executive/research/data/20260324_水耕栽培IoT機器比較調査.md; AGENTS.md',
  now(),
  'codex'
),
(
  'hydroponics-roadmap-and-synergy',
  '水耕栽培ロードマップとAI支援事業シナジー',
  'hydroponics',
  'CEO / COO',
  'internal',
  'operational',
  'Phase H1-H5の長期ロードマップと、AI支援事業との相互強化の考え方。',
  $kb$
## 正本
- `AGENTS.md`
- `executive/research/data/20260324_事業拡大ビジョン調査.md`

## ロードマップ
H1は自宅テスト栽培、H2は1室8-10台、H3は3室、H4は標準化、H5は就労支援事業所・自治体への導入支援。すべて室内LED×IoT水耕栽培を前提にする。

## シナジー
水耕栽培の実証データは、AI支援事業のIoT提案の説得力になる。AI支援事業の売上は、水耕栽培への投資原資になる。

## 注意
短期売上を急がない。H2移行条件を満たすまでは、栽培拡大よりデータ取得と安定化を優先する。
$kb$,
  array['H1', 'H2', 'H5', 'ロードマップ', 'AI支援', '室内LED'],
  'AGENTS.md; executive/research/data/20260324_事業拡大ビジョン調査.md',
  now(),
  'codex'
),
(
  'corporate-routine-calendar-sop',
  '法人運営の定期チェックSOP',
  'operations',
  'COO',
  'internal',
  'operational',
  '毎週、毎月、四半期、年次で確認するサイト、ドキュメント、補助金、財務、インフラの定期運用。',
  $kb$
## 正本
- `AGENTS.md`
- `executive/research/data/20260326_法人経営定期タスク.md`
- `.agents/skills/check-deadlines/SKILL.md`

## 定期チェック
月曜はサイト整合性とドキュメント整合性。毎月1日はカレンダー先読み、ネクストアクション棚卸、補助金公募、競合・市場ニュース、インフラ稼働確認。

3の倍数月は四半期業績レビュー準備。4月1日は事業計画年次レビュー、契約・サブスク棚卸。

## ルール
問題がなければ簡潔に報告する。問題があれば具体的な箇所と修正案を出す。方針変更や重要文書の変更は承認を取る。
$kb$,
  array['定期チェック', 'Google Tasks', '補助金', 'インフラ', '年次レビュー'],
  'AGENTS.md; executive/research/data/20260326_法人経営定期タスク.md',
  now(),
  'codex'
)
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  owner = excluded.owner,
  visibility = excluded.visibility,
  maturity = excluded.maturity,
  summary = excluded.summary,
  body = excluded.body,
  tags = excluded.tags,
  source = excluded.source,
  updated_at = now(),
  updated_by = excluded.updated_by;
