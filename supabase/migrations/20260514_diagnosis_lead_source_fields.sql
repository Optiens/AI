-- Track which demo/page prompted a free diagnosis lead.
ALTER TABLE public.diagnosis_leads
  ADD COLUMN IF NOT EXISTS lead_source text,
  ADD COLUMN IF NOT EXISTS lead_source_detail text,
  ADD COLUMN IF NOT EXISTS entry_referrer text;

COMMENT ON COLUMN public.diagnosis_leads.lead_source IS 'Optional lead source selected in the diagnosis form.';
COMMENT ON COLUMN public.diagnosis_leads.lead_source_detail IS 'Optional detail about the demo, article, referrer, or introduction that prompted the lead.';
COMMENT ON COLUMN public.diagnosis_leads.entry_referrer IS 'Browser referrer captured on the diagnosis form, when available.';

CREATE INDEX IF NOT EXISTS idx_diagnosis_leads_lead_source
  ON public.diagnosis_leads (lead_source);
