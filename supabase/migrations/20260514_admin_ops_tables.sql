-- Admin operations tables for settings, audit logs, and editable knowledge.

create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.admin_audit_logs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  actor text not null default 'admin',
  action text not null,
  target_table text,
  target_id text,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text
);

create table if not exists public.knowledge_entries (
  id text primary key,
  title text not null,
  category text not null check (category in ('business', 'sales', 'operations', 'ai', 'hydroponics', 'brand', 'governance')),
  owner text not null default 'COO',
  visibility text not null default 'internal' check (visibility in ('internal', 'demo-safe')),
  maturity text not null default 'seed' check (maturity in ('seed', 'operational', 'demo-ready')),
  summary text not null default '',
  body text not null default '',
  tags text[] not null default '{}'::text[],
  source text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

create index if not exists idx_admin_audit_logs_created_at
  on public.admin_audit_logs (created_at desc);

create index if not exists idx_admin_audit_logs_target
  on public.admin_audit_logs (target_table, target_id);

create index if not exists idx_knowledge_entries_updated_at
  on public.knowledge_entries (updated_at desc);

alter table public.admin_settings enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.knowledge_entries enable row level security;

drop policy if exists "admin_settings_service_role_all" on public.admin_settings;
create policy "admin_settings_service_role_all"
  on public.admin_settings for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "admin_audit_logs_service_role_all" on public.admin_audit_logs;
create policy "admin_audit_logs_service_role_all"
  on public.admin_audit_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "knowledge_entries_service_role_all" on public.knowledge_entries;
create policy "knowledge_entries_service_role_all"
  on public.knowledge_entries for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

