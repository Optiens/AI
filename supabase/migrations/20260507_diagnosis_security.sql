-- 無料診断のセキュリティ強化（v2.1）
-- - メール認証（ダブルオプトイン）
-- - IPレート制限用のログテーブル
-- - 月次上限カウント用のステータス拡張

-- ===== diagnosis_leads テーブル拡張 =====
ALTER TABLE diagnosis_leads
  ADD COLUMN IF NOT EXISTS verification_token TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS slides_url TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submission_ip INET;

-- status の運用値（既存のものを拡張）:
-- 'pending_verification'  : メール認証待ち（フォーム送信直後）
-- 'verified'              : メール認証完了（処理キュー入り）
-- 'processing'            : Edge Function 処理中
-- 'completed'             : Slides生成・送付完了
-- 'manual_review'         : バリデーション失敗、手動レビュー待ち
-- 'limit_exceeded'        : 月次上限到達
-- 'rejected'              : スパム判定で拒否

-- index 追加
CREATE INDEX IF NOT EXISTS idx_diagnosis_leads_verification_token ON diagnosis_leads(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_diagnosis_leads_status ON diagnosis_leads(status);
CREATE INDEX IF NOT EXISTS idx_diagnosis_leads_created_at ON diagnosis_leads(created_at DESC);

-- ===== 送信ログテーブル（IPレート制限用）=====
CREATE TABLE IF NOT EXISTS submission_log (
  id BIGSERIAL PRIMARY KEY,
  ip INET NOT NULL,
  email TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 'success' / 'spam_honeypot' / 'spam_timing' / 'spam_turnstile' / 'rate_limited'
  result TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submission_log_ip_created ON submission_log(ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submission_log_created ON submission_log(created_at DESC);

-- ===== レート制限関数 =====
-- 同一IPからの直近N時間以内の送信件数を返す
CREATE OR REPLACE FUNCTION submission_count_by_ip(
  p_ip INET,
  p_hours INTEGER DEFAULT 24
) RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM submission_log
  WHERE ip = p_ip
    AND created_at >= now() - (p_hours || ' hours')::INTERVAL
    AND result = 'success';
$$ LANGUAGE SQL STABLE;

-- ===== 月次完了件数取得関数 =====
-- 当月の verified（=実需）件数を返す
CREATE OR REPLACE FUNCTION monthly_verified_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM diagnosis_leads
  WHERE status IN ('verified', 'processing', 'completed', 'manual_review')
    AND verified_at IS NOT NULL
    AND verified_at >= date_trunc('month', now() AT TIME ZONE 'Asia/Tokyo')
    AND verified_at < date_trunc('month', now() AT TIME ZONE 'Asia/Tokyo') + INTERVAL '1 month';
$$ LANGUAGE SQL STABLE;

-- ===== コメント =====
COMMENT ON TABLE submission_log IS 'フォーム送信全件のログ（成功・スパム・レート制限を記録）。攻撃監視と異常検知に使用';
COMMENT ON COLUMN diagnosis_leads.verification_token IS 'メール認証用の一時トークン（一度使ったらNULLに）';
COMMENT ON COLUMN diagnosis_leads.verified_at IS 'メール認証完了日時。月次上限カウントはこのカラムを参照';
COMMENT ON COLUMN diagnosis_leads.submission_ip IS 'フォーム送信元IP。異常検知用';
