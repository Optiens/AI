-- AI diagnosis officer session-level usage and estimated cost.
-- Stores aggregate metadata only. Do not store raw transcripts or diagnosis memo text here.

create table if not exists public.ai_diagnosis_officer_sessions (
  id bigserial primary key,
  session_id text not null unique,
  mode text not null default 'demo',
  ticket_number text,
  model text,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  response_count integer not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer not null default 0,
  text_input_tokens integer not null default 0,
  text_output_tokens integer not null default 0,
  audio_input_tokens integer not null default 0,
  audio_output_tokens integer not null default 0,
  cached_input_tokens integer not null default 0,
  cached_text_input_tokens integer not null default 0,
  cached_audio_input_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 6) not null default 0,
  estimated_cost_jpy integer,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_diagnosis_officer_sessions
  add column if not exists cached_text_input_tokens integer not null default 0,
  add column if not exists cached_audio_input_tokens integer not null default 0;

alter table public.ai_diagnosis_officer_sessions enable row level security;

drop policy if exists "ai_diagnosis_officer_sessions_service_role_all"
  on public.ai_diagnosis_officer_sessions;
create policy "ai_diagnosis_officer_sessions_service_role_all"
  on public.ai_diagnosis_officer_sessions for all
  to service_role
  using (true)
  with check (true);

create index if not exists idx_ai_diagnosis_officer_sessions_created_at
  on public.ai_diagnosis_officer_sessions (created_at desc);

create index if not exists idx_ai_diagnosis_officer_sessions_mode_created_at
  on public.ai_diagnosis_officer_sessions (mode, created_at desc);

create index if not exists idx_ai_diagnosis_officer_sessions_ticket_number
  on public.ai_diagnosis_officer_sessions (ticket_number)
  where ticket_number is not null;

revoke all privileges on table public.ai_diagnosis_officer_sessions from anon, authenticated;
grant select, insert, update, delete on table public.ai_diagnosis_officer_sessions to service_role;

revoke all privileges on sequence public.ai_diagnosis_officer_sessions_id_seq from anon, authenticated;
grant usage, select on sequence public.ai_diagnosis_officer_sessions_id_seq to service_role;

comment on table public.ai_diagnosis_officer_sessions is
  'AI診断官β版のセッション単位usage・推定原価ログ。文字起こし本文や診断メモ本文は保存しない。';
comment on column public.ai_diagnosis_officer_sessions.estimated_cost_usd is
  'OpenAI Realtime/Text usageから算出した概算API原価USD。請求確定値ではない。';
