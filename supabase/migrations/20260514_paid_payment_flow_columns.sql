-- Paid AI diagnosis payment flow support columns.
-- These columns are required by:
-- - src/pages/api/payment-check.ts
-- - src/pages/api/payment-notify.ts
-- - src/pages/api/admin/lead-update.ts

ALTER TABLE public.diagnosis_leads
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS freee_txn_id BIGINT,
  ADD COLUMN IF NOT EXISTS voucher_note TEXT,
  ADD COLUMN IF NOT EXISTS report_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.diagnosis_leads.paid_at IS 'Paid diagnosis payment confirmation timestamp.';
COMMENT ON COLUMN public.diagnosis_leads.freee_txn_id IS 'Matched freee wallet transaction ID for bank-transfer payment.';
COMMENT ON COLUMN public.diagnosis_leads.voucher_note IS 'Internal note for referral-free or voucher-based paid diagnosis handling.';
COMMENT ON COLUMN public.diagnosis_leads.report_sent_at IS 'Timestamp when paid report delivery was marked sent.';

CREATE INDEX IF NOT EXISTS idx_diagnosis_leads_pending_payment
  ON public.diagnosis_leads (status, amount_jpy, created_at)
  WHERE status = 'pending_payment';

CREATE UNIQUE INDEX IF NOT EXISTS idx_diagnosis_leads_freee_txn_id
  ON public.diagnosis_leads (freee_txn_id)
  WHERE freee_txn_id IS NOT NULL;
