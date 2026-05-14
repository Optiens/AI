-- Admin customer/project management, alert rules, and knowledge gap queue.

create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  lead_id text,
  company_name text not null,
  contact_name text,
  email text,
  industry text,
  status text not null default 'prospect' check (status in ('prospect', 'active', 'paused', 'churned', 'closed')),
  source text not null default 'admin',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.customer_projects (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  lead_id text,
  title text not null,
  project_type text not null default 'diagnosis' check (project_type in ('diagnosis', 'implementation', 'maintenance', 'support', 'other')),
  status text not null default 'lead' check (status in ('lead', 'proposal', 'active', 'waiting', 'done', 'paused', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  contract_amount_jpy integer not null default 0,
  monthly_amount_jpy integer not null default 0,
  owner text not null default 'CEO',
  next_action text,
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.customer_events (
  id bigserial primary key,
  customer_id uuid references public.customers(id) on delete cascade,
  project_id uuid references public.customer_projects(id) on delete cascade,
  event_type text not null default 'note',
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by text
);

create table if not exists public.admin_alert_rules (
  id text primary key,
  title text not null,
  area text not null,
  condition_key text not null,
  threshold numeric not null default 1,
  severity text not null default 'warn' check (severity in ('info', 'warn', 'critical')),
  enabled boolean not null default true,
  notify_email text,
  description text,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.admin_alert_events (
  id bigserial primary key,
  rule_id text references public.admin_alert_rules(id) on delete set null,
  triggered_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  severity text not null default 'warn' check (severity in ('info', 'warn', 'critical')),
  title text not null,
  detail text,
  target_href text,
  metadata jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by text
);

create table if not exists public.knowledge_gaps (
  id bigserial primary key,
  question text not null,
  status text not null default 'open' check (status in ('open', 'converted', 'dismissed')),
  source text not null default 'knowledge_query',
  suggested_category text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  answer_excerpt text,
  linked_knowledge_id text references public.knowledge_entries(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_customers_updated_at
  on public.customers (updated_at desc);

create index if not exists idx_customers_lead_id
  on public.customers (lead_id);

create index if not exists idx_customer_projects_customer_id
  on public.customer_projects (customer_id);

create index if not exists idx_customer_projects_due_date
  on public.customer_projects (due_date);

create index if not exists idx_customer_events_customer_id
  on public.customer_events (customer_id, occurred_at desc);

create index if not exists idx_admin_alert_rules_enabled
  on public.admin_alert_rules (enabled);

create index if not exists idx_admin_alert_events_status
  on public.admin_alert_events (status, triggered_at desc);

create index if not exists idx_knowledge_gaps_status
  on public.knowledge_gaps (status, created_at desc);

alter table public.customers enable row level security;
alter table public.customer_projects enable row level security;
alter table public.customer_events enable row level security;
alter table public.admin_alert_rules enable row level security;
alter table public.admin_alert_events enable row level security;
alter table public.knowledge_gaps enable row level security;

drop policy if exists "customers_service_role_all" on public.customers;
create policy "customers_service_role_all"
  on public.customers for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "customer_projects_service_role_all" on public.customer_projects;
create policy "customer_projects_service_role_all"
  on public.customer_projects for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "customer_events_service_role_all" on public.customer_events;
create policy "customer_events_service_role_all"
  on public.customer_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "admin_alert_rules_service_role_all" on public.admin_alert_rules;
create policy "admin_alert_rules_service_role_all"
  on public.admin_alert_rules for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "admin_alert_events_service_role_all" on public.admin_alert_events;
create policy "admin_alert_events_service_role_all"
  on public.admin_alert_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "knowledge_gaps_service_role_all" on public.knowledge_gaps;
create policy "knowledge_gaps_service_role_all"
  on public.knowledge_gaps for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant usage on schema public to service_role;
grant all on table public.customers to service_role;
grant all on table public.customer_projects to service_role;
grant all on table public.customer_events to service_role;
grant all on table public.admin_alert_rules to service_role;
grant all on table public.admin_alert_events to service_role;
grant all on table public.knowledge_gaps to service_role;
grant usage, select on sequence public.customer_events_id_seq to service_role;
grant usage, select on sequence public.admin_alert_events_id_seq to service_role;
grant usage, select on sequence public.knowledge_gaps_id_seq to service_role;
