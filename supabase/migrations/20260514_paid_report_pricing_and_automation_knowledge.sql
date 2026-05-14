-- Update paid diagnosis knowledge after pricing and automation policy review.

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
有償版も人間チェックなしで自動納品する。フォーム入力をもとにAIが詳細レポートを自動生成し、未置換プレースホルダー、禁止語、施策欠落、数値根拠不足などの機械的な品質ゲートを通過したものだけを自動送付する。

公開・納品文面では「AIによる下書き生成と人による確認で作成」と書かない。正しい表現は「フォーム入力をもとにAIが自動生成し、品質ゲート通過後に自動送付しています」。

## 自動フロー
1. 申込完了メールで振込先、請求情報、返金条件を送る
2. 顧客の入金通知または定期チェックで入金を検知する
3. `status=paid` に変更し、領収情報を送る
4. `process-paid-diagnosis` が詳細レポートを生成する
5. Google Slidesを作成・共有する
6. 顧客へ納品メールとMTG案内を送る

## 例外処理
品質ゲートに落ちたレポートは顧客へ送付しない。失敗時は `manual_review` に落とし、ナレッジDBの「有償レポート生成失敗時の手動復旧SOP」に従う。期限内に復旧できない場合は返金を優先する。
$kb$,
  array['有償版', '完全自動化', '品質ゲート', 'Google Slides', 'Resend', '返金'],
  'executive/ai-consulting/有償版_完全自動運用手順_v1.0.md; supabase/functions/process-paid-diagnosis/index.ts',
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

## 価格レンジ
18万円は、単発スクリプトや内部ツール試作なら成立するが、顧客向けの導入支援としては安すぎる。要件整理、連携、検証、手順書、初期保守の責任を含める場合は以下を標準にする。

- 1業務MVP: ¥270,000〜360,000
- 2業務実装: ¥420,000〜560,000
- 3業務または外部連携多め: ¥600,000〜800,000+
- 実装期間: 1業務は3〜4週間、1〜2業務は4〜6週間

## 提案・デモリンク
公開デモがある施策は、提案本文に関連デモURLを入れる。例: 問い合わせ一次回答は `/inquiry-routing`、見積書は `/quote-generator`、社内検索/RAGは `/data-search`、承認は `/approval-workflow`、管理画面は `/custom-management`。

## 議事録要約・アクション抽出
第一候補はCircleback等の高精度な会議文字起こし/議事録SaaS。文字起こし、話者分離、要約、アクション、Webhook連携まで含めて実装が早い。OpenAIのgpt-4o-transcribe/Whisper系APIは、独自UIや自社録音データ処理を作る必要がある場合の選択肢として扱う。

## リスク表現
「発生可能性: 中」を並べると導入障害に見えやすい。リスクは隠さず、列名を「管理方針」にして「初期対策で低減」「運用で管理」「重点管理」「月次確認」のように、対策込みで表現する。

## 自動生成の品質ゲート
未置換プレースホルダー、禁止語、施策欠落、数値根拠不足を検知したら送付しない。無料版と違い、一般論だけのレポート、抽象的な提案、顧客が次に動けない資料は有償品質として不可。
$kb$,
  array['有償レポート', '品質基準', '価格', 'デモリンク', 'Circleback', '品質ゲート'],
  'executive/ai-consulting/有償版_詳細レポート設計書_v1.0.md; supabase/functions/process-paid-diagnosis/index.ts',
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
