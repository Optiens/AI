# OpenAI クォータ監視・残高アラート設定手順

最終更新: 2026-05-11
担当: 代表

## 目的

AI 活用診断のレポート生成は OpenAI API（gpt-5.5）を呼び出している。
残高ゼロ時に 429 エラーが発生し、顧客レポートのお届けが遅延する。
本ドキュメントは **事故発生前にアラートで気付ける状態** を作るための設定手順。

## システム側の防御策（実装済）

このドキュメントが扱うのは「事前検知」。実装済みの自動回復機構は以下：

| 仕組み | ファイル | 役割 |
|---|---|---|
| 429 検出 | `supabase/functions/process-diagnosis/index.ts` | エラーが 429 系なら status='quota_retry_pending' に変更 |
| 顧客遅延通知 | 同上（`sendDelayNoticeEmail`）| 顧客に「翌日までにお届けします」と自動メール |
| 翌朝自動リトライ | `supabase/migrations/20260511_diagnosis_quota_retry.sql` | 毎日 7:00 JST に pg_cron が再処理 |

→ **再発時も 1 営業日以内に顧客に届く**ように自動化済み。とはいえ事前検知できるに越したことはないので以下を設定する。

---

## OpenAI ダッシュボードでのアラート設定

### Step 1: 使用上限（Spend limit）の設定

クレジットカードから自動チャージしている場合、想定外の高額請求を防ぐ。

1. https://platform.openai.com/account/limits にアクセス
2. **「Usage limits」** セクションへ
3. **「Set monthly budget」** に **¥10,000 相当（約 $65）** を入力
4. **「Set email notification threshold」** に **75%（約 $48）** を入力
5. 保存

→ 月額予算の 75% に到達した時点で代表のメール（OpenAI アカウントのメール）にアラートが届く。

### Step 2: アカウント残高の確認頻度ルール

月初に残高を確認するルーチンを設定：

- **毎月 1 日朝**（既存のチェックリスト [`CLAUDE.md`](../../CLAUDE.md) の月次タスクに統合）
- https://platform.openai.com/usage で前月使用額を確認
- 前月使用額の 1.5 倍を翌月の予算と仮定し、不足なら追加チャージ

### Step 3: Auto recharge（自動チャージ）の設定

残高がゼロになる前に自動で補充する：

1. https://platform.openai.com/account/billing にアクセス
2. **「Auto recharge」** をオン
3. **「Trigger threshold」**: $10
4. **「Recharge amount」**: $20
5. クレジットカードを登録（既に登録済の場合はスキップ）
6. 保存

→ 残高が $10 を下回ると自動で $20 補充される。これで「残高ゼロで止まる」事故はゼロに。

⚠ **注意**: Auto recharge は **クレジットカードへの自動課金が無制限に発生** するリスクがある。
Spend limit（Step 1）と組み合わせて月額上限も設定しておくこと。

---

## Optiens 内での状態確認方法

### ① 手動で「現在のリトライ待ち」を確認

Supabase SQL Editor で：

```sql
SELECT * FROM v_diagnosis_quota_retry_queue;
```

→ 現在 `quota_retry_pending` のリードと、待機時間が表示される。

### ② 当日のクォータエラー発生有無を確認

```sql
SELECT
  id, application_id, company_name, status, updated_at
FROM diagnosis_leads
WHERE status = 'quota_retry_pending'
   OR (status = 'completed' AND updated_at > NOW() - INTERVAL '1 day')
ORDER BY updated_at DESC;
```

### ③ pg_cron ジョブの登録確認

```sql
SELECT jobid, schedule, command, active
FROM cron.job
WHERE jobname = 'diagnosis-quota-retry';
```

---

## 緊急時の手動リトライ手順

cron が次に動くまで待てない（顧客に至急届けたい）場合：

```sql
-- 該当リードを即座に再処理対象にする
UPDATE diagnosis_leads
SET status = 'verified', updated_at = NOW()
WHERE id = 'XXX';  -- 対象 lead_id
```

→ Database Webhook が起動して Edge Function が即実行される。

---

## トラブルシュート

### Q: cron が動いていない
- `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;` で実行履歴確認
- Supabase の管理画面で pg_cron 拡張が有効か確認

### Q: アラートメールが来ない
- OpenAI アカウントのメールアドレスに **迷惑メールフィルタ**で振り分けられていないか確認
- gmail のフィルタ設定で `@openai.com` を許可リストに

### Q: 429 とは別のエラーで失敗している
- Supabase Edge Function のログ確認
- `status='manual_review'` のレコードを抽出して個別調査

---

## 関連
- 実装: `supabase/functions/process-diagnosis/index.ts`
- マイグレーション: `supabase/migrations/20260511_diagnosis_quota_retry.sql`
- 顧客向けフォーム: `src/pages/free-diagnosis.astro`
- API ハンドラ: `src/pages/api/free-diagnosis.ts`
