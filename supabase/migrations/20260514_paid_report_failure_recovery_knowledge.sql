-- Knowledge entry: paid report generation failure recovery SOP.

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
) values (
  'paid-report-failure-recovery-sop',
  '有償レポート生成失敗時の手動復旧SOP',
  'operations',
  'COO / CTO',
  'internal',
  'operational',
  '有償版AI活用診断のレポート生成が manual_review になった時、顧客へ重複送付せず、再実行・個別対応・返金を判断するための手順。',
  $body$
## 目的
有償版AI活用診断は、人間の事前チェックなしで自動生成・自動送付する。ただし、品質ゲート、API障害、Google Slides/Drive権限、メール送信、入力不足で失敗した場合は、顧客へ不完全な資料を送らず `manual_review` に落とす。

このSOPは、`manual_review` に落ちた有償リードを、重複送付を避けながら復旧するための手順。

## 対象ステータス
- `manual_review`: 自動生成または送信が失敗し、人間の確認が必要
- `processing`: 長時間止まっている場合は障害扱い
- `paid`: 入金済みだが有償レポート生成が未実行
- `report_created`: 資料生成後、送付前で止まっている可能性

## 最初に見る場所
1. 管理画面 `/admin/leads` で `manual_review` またはエラーありのリードを開く
2. 詳細画面 `/admin/leads/{id}` で `last_error` を確認する
3. Supabase `diagnosis_leads` の `slides_url`, `sent_at`, `report_sent_at`, `last_error`, `status` を確認する
4. 必要に応じて Vercel Logs, Supabase Edge Function Logs, Resend, Google Drive/Slides 権限を確認する

## 送付済み判定
- `report_sent_at` あり: 原則、顧客へ送付済み。再送は重複に注意し、再送理由を `admin_notes` に残す
- `slides_url` あり、`report_sent_at` なし: Slides作成後、メール送信で止まった可能性。URLの共有権限を確認してから送付処理を再実行する
- `slides_url` なし、`report_sent_at` なし: 顧客へ未送付。再実行または返金判断に進む

## 復旧手順
1. `/admin/leads/{id}` を開く
2. `last_error` を読み、原因を分類する
   - 入力不足: 会社名、業種、課題、メール、IT環境情報を補正
   - 品質ゲートNG: 禁止語、未置換プレースホルダー、提案7本の欠落、数値根拠不足を確認
   - API/環境変数: OpenAI, Supabase, Google Service Account, Resend, Vercel env を確認
   - Google Slides/Drive: テンプレID、出力フォルダID、Service Account権限を確認
3. 入力データまたは環境を修正する
4. 管理画面の「有償レポート生成・送付」をクリックして強制再実行する
5. 成功後、`status=report_sent`, `slides_url`, `report_sent_at` を確認する
6. `admin_notes` に原因、修正内容、再実行日時を残す

## 返金または個別対応へ切り替える基準
- 同一リードで再実行が2回失敗した
- 24時間以内に復旧見込みがない
- Google Slides/Drive権限やOpenAI障害が長引いている
- 自動生成結果が品質ゲートを通らない
- 顧客からキャンセルまたは返金希望が来た

返金時は、`status=cancelled` に変更し、`admin_notes` に返金理由、返金日、freee側の処理IDを残す。顧客には「自動生成処理が正常に完了しなかったため返金する」と簡潔に伝え、長い言い訳を書かない。

## 顧客連絡方針
- 未送付の段階では、内部エラーの詳細を顧客に説明しない
- 納品予定を超える場合は、遅延連絡または返金を優先する
- 送付済みの可能性がある場合は、重複メールを送る前に `report_sent_at` と Resend ログを確認する

## 記録する項目
- 発生日時
- 対象リードID / 申込番号
- `last_error`
- 修正内容
- 再実行結果
- 顧客連絡の有無
- 返金した場合は freee の返金取引または対応メモ

## 検索キーワード
有償レポート, 詳細版, manual_review, レポート生成失敗, 復旧, 返金, report_sent, slides_url, last_error, Google Slides, Resend, Edge Function
$body$,
  array[
    '有償レポート',
    '詳細版',
    'manual_review',
    '復旧',
    '返金',
    'SOP',
    'Google Slides',
    'Resend'
  ],
  'migration',
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
