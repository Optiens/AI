-- Spot consultation ticket purchase, payment, and voucher issuance flow.

create table if not exists public.spot_ticket_orders (
  id bigserial primary key,
  order_id text not null unique,
  company_name text not null,
  person_name text not null,
  email text not null,
  phone text,
  invoice_name text,
  service_type text,
  ticket_count integer not null default 0,
  amount_jpy integer not null default 0,
  status text not null default 'pending_payment',
  notes text,
  freee_txn_id bigint,
  paid_at timestamptz,
  ticket_number text unique,
  ticket_issued_at timestamptz,
  redeem_company_name text,
  redeem_person_name text,
  redeem_email text,
  redeem_phone text,
  redeem_service_type text,
  request_detail text,
  preferred_schedule text,
  redeem_notes text,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.spot_ticket_orders enable row level security;

drop policy if exists "spot_ticket_orders_service_role_all" on public.spot_ticket_orders;
create policy "spot_ticket_orders_service_role_all"
  on public.spot_ticket_orders for all
  to service_role
  using (true)
  with check (true);

create index if not exists idx_spot_ticket_orders_status_created_at
  on public.spot_ticket_orders (status, created_at desc);

create index if not exists idx_spot_ticket_orders_pending_payment
  on public.spot_ticket_orders (status, amount_jpy, created_at)
  where status = 'pending_payment';

create unique index if not exists idx_spot_ticket_orders_freee_txn_id
  on public.spot_ticket_orders (freee_txn_id)
  where freee_txn_id is not null;

create index if not exists idx_spot_ticket_orders_ticket_number
  on public.spot_ticket_orders (ticket_number)
  where ticket_number is not null;

grant select, insert, update, delete on table public.spot_ticket_orders to service_role;
grant usage, select on sequence public.spot_ticket_orders_id_seq to service_role;

comment on table public.spot_ticket_orders is 'Spot consultation ticket purchase orders, freee payment matching, issued ticket numbers, and redemption requests.';
comment on column public.spot_ticket_orders.order_id is 'Public purchase order ID shown to customer. Used for payment notification token.';
comment on column public.spot_ticket_orders.status is 'quote_required, pending_payment, paid, ticket_issued, redeemed, cancelled, manual_review.';
comment on column public.spot_ticket_orders.ticket_number is 'Voucher-like ticket number sent after payment confirmation.';
comment on column public.spot_ticket_orders.freee_txn_id is 'Matched freee wallet transaction ID for bank-transfer payment.';
