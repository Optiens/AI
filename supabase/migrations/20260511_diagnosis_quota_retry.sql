-- ============================================================
-- AI診断レポート: OpenAI クォータ超過時の自動リトライ機構
-- ============================================================
--
-- 背景:
--   process-diagnosis Edge Function 内で OpenAI API が 429
--  （quota exceeded）を返した場合、status='quota_retry_pending'
--   に変更されると同時に顧客に遅延通知が自動送信される。
--   本マイグレーションでは pg_cron で翌日朝に自動再処理する。
--
-- フロー:
--   1. OpenAI 429 発生 → Edge Function が status='quota_retry_pending'
--      へ変更 + 顧客に遅延通知メール送信
--   2. 毎日 7:00 JST (= 22:00 UTC) に pg_cron が
--      'quota_retry_pending' を 'verified' に戻す
--   3. Database Webhook で再び Edge Function 起動 → 通常フロー
--
-- 適用方法:
--   Supabase Dashboard > SQL Editor で本ファイルを実行
--   （または supabase db push）
-- ============================================================

-- status 運用値拡張:
--   'quota_retry_pending' : OpenAI クォータ超過で待機中（翌朝の cron で 'verified' に戻り再処理）

-- ===== pg_cron 拡張を有効化（既に有効なら冪等） =====
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ===== 既存ジョブを削除（冪等のため） =====
DO $$
BEGIN
  PERFORM cron.unschedule('diagnosis-quota-retry');
EXCEPTION WHEN OTHERS THEN
  -- ジョブが存在しない場合は無視
  NULL;
END $$;

-- ===== ジョブ登録：毎日 22:00 UTC（= 翌日 07:00 JST） =====
SELECT cron.schedule(
  'diagnosis-quota-retry',
  '0 22 * * *',
  $$
  UPDATE public.diagnosis_leads
  SET status = 'verified',
      updated_at = NOW()
  WHERE status = 'quota_retry_pending'
    -- 24時間以上経過したものだけ再処理対象（短時間連続失敗の暴走防止）
    AND updated_at < NOW() - INTERVAL '6 hours';
  $$
);

-- ===== 監視用：手動でリトライ対象を確認するビュー =====
CREATE OR REPLACE VIEW v_diagnosis_quota_retry_queue AS
SELECT
  id,
  application_id,
  company_name,
  person_name,
  email,
  status,
  created_at,
  updated_at,
  NOW() - updated_at AS waiting_duration
FROM public.diagnosis_leads
WHERE status = 'quota_retry_pending'
ORDER BY created_at ASC;

-- ===== 動作確認用 SELECT（実行後、ジョブ登録を確認） =====
-- SELECT jobid, schedule, command FROM cron.job WHERE jobname = 'diagnosis-quota-retry';
-- SELECT * FROM v_diagnosis_quota_retry_queue;
