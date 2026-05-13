-- Store the reason a diagnosis lead moved to manual review or retry.
ALTER TABLE diagnosis_leads
  ADD COLUMN IF NOT EXISTS last_error TEXT;

COMMENT ON COLUMN diagnosis_leads.last_error IS '診断自動生成の失敗理由。manual_review / quota_retry_pending の原因確認用。';
