-- Keep admin knowledge aligned with the 2026-05-15 service definition update.

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
  'term-master-ai-support',
  'AI支援事業の用語マスタ',
  'brand',
  'COO / CMO',
  'internal',
  'operational',
  '現行ホームページ基準のサービス名、診断プラン、詳細レポート、面談、添付対応、禁止表現の正本。',
  $kb$
## 正本

- `executive/ai-consulting/用語マスタ.md`
- `src/pages/index.astro`
- `src/pages/service.astro`
- `src/pages/free-diagnosis.astro`

## 基本方針

公開表現は現行ホームページ、サービスページ、AI活用診断ページを優先する。事業全体の公開サービス名は「AI業務自動化・AIエージェント導入支援」。AXはAI Transformationの意味で、業務プロセスをAIが理解できる形に再設計する取り組みとして説明する。

AI活用診断は、AI活用診断簡易版（無料）と詳細版AI活用診断（¥5,500税込）に分ける。詳細版の納品物名は「詳細レポート」。

詳細版AI活用診断は汎用AI相談の代行ではなく、Optiensの診断基準で優先順位、やらないこと、費用前提、次の一手を整理する導入判断資料として扱う。

詳細版AI活用診断には60分MTGを含めない。レポート内容の補足ヒアリングはAI診断官βを入口にし、人間相談が必要な場合は単発AI相談、導入支援前の範囲整理が必要な場合は有償要件定義として別導線で案内する。

現行フォームの自動読取は、1申込につき画像1点または公開URL1件まで。画像はJPG、PNG、GIF、WebPの最大5MB、URLは取得HTML最大512KB、AIへ渡す本文は最大約6,000字。PDF、Excel、Wordを現行フォームで直接添付できるとは書かない。

診断レポートの標準納品形式はGoogle Slides URL。PDF納品、詳細レポートに面談が含まれる表現、申込停止中に見える表現、成果保証、旧事業方針に該当する表現は禁止する。
$kb$,
  array['用語マスタ', '表記統一', 'AI活用診断', '詳細レポート', 'MTGなし'],
  'executive/ai-consulting/用語マスタ.md; user directive 2026-05-15',
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
- `executive/ai-consulting/有償版_詳細レポート設計書_v1.0.md`
- `supabase/functions/process-paid-diagnosis/index.ts`
- `src/pages/api/payment-check.ts`
- `src/pages/api/payment-notify.ts`

## 基本方針

有償版も人間チェックなしで自動納品する。フォーム入力をもとにAIが詳細レポートを自動生成し、未置換プレースホルダー、禁止語、施策欠落、数値根拠不足などの機械的な品質ゲートを通過したものだけを自動送付する。

詳細版AI活用診断には60分MTGを含めない。追加ヒアリングはAI診断官βを入口にし、人間相談が必要な場合は単発AI相談、導入支援前の範囲整理が必要な場合は有償要件定義として別導線で案内する。

公開・納品文面では「AIによる下書き生成と人による確認で作成」と書かない。正しい表現は「フォーム入力をもとにAIが自動生成し、品質ゲート通過後に自動送付しています」。

## 自動フロー

1. 申込完了メールで振込先、請求情報、返金条件を送る
2. 顧客の入金通知または定期チェックで入金を検知する
3. `status=paid` に変更し、領収情報を送る
4. `process-paid-diagnosis` が詳細レポートを生成する
5. Google Slidesを作成・共有する
6. 顧客へ納品メールを送る

## 例外処理

品質ゲートに落ちたレポートは顧客へ送付しない。失敗時は `manual_review` に落とし、ナレッジDBの「有償レポート生成失敗時の手動復旧SOP」に従う。期限内に復旧できない場合は返金を優先する。
$kb$,
  array['有償版', '完全自動化', '品質ゲート', 'Google Slides', 'MTGなし', '返金'],
  'executive/ai-consulting/有償版_詳細レポート設計書_v1.0.md; supabase/functions/process-paid-diagnosis/index.ts',
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
- 導入支援へ進む場合の確認ポイント

## 価格レンジ

18万円は、単発スクリプトや内部ツール試作なら成立するが、顧客向けの導入支援としては安すぎる。要件整理、連携、検証、手順書、初期保守の責任を含める場合は以下を標準にする。

- 1業務MVP: ¥270,000〜360,000
- 2業務実装: ¥420,000〜560,000
- 3業務または外部連携多め: ¥600,000〜800,000+
- 実装期間: 1業務は3〜4週間、1〜2業務は4〜6週間

正式見積は、導入支援のご相談時に対象業務、連携先、データ状態、運用体制を確認して確定する。

## 提案・デモリンク

公開デモがある施策は、提案本文に関連デモURLを入れる。例: 問い合わせ一次回答は `/inquiry-routing`、見積書は `/quote-generator`、社内検索/RAGは `/data-search`、承認は `/approval-workflow`、管理画面は `/custom-management`。

## リスク表現

「発生可能性: 中」を並べると導入障害に見えやすい。リスクは隠さず、列名を「管理方針」にして「初期対策で低減」「運用で管理」「重点管理」「月次確認」のように、対策込みで表現する。

## 自動生成の品質ゲート

未置換プレースホルダー、禁止語、施策欠落、数値根拠不足を検知したら送付しない。無料版と違い、一般論だけのレポート、抽象的な提案、顧客が次に動けない資料は有償品質として不可。
$kb$,
  array['有償レポート', '品質基準', '価格', 'デモリンク', '品質ゲート', 'MTGなし'],
  'executive/ai-consulting/有償版_詳細レポート設計書_v1.0.md; scripts/generate-paid-pptx.mjs',
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
