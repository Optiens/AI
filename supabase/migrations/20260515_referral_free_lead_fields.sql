-- Track referral-free paid diagnosis handling as explicit fields.

alter table public.diagnosis_leads
  add column if not exists is_referral_free boolean not null default false,
  add column if not exists referral_from text,
  add column if not exists referral_free_at timestamptz;

comment on column public.diagnosis_leads.is_referral_free is
  'True when a paid diagnosis was converted to referral-free handling.';
comment on column public.diagnosis_leads.referral_from is
  'Optional internal referral source for referral-free handling.';
comment on column public.diagnosis_leads.referral_free_at is
  'Timestamp when referral-free handling was applied.';
