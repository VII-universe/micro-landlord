-- Micro-Landlord schema
-- Run this in Supabase SQL editor: https://supabase.com/dashboard

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  city text not null default '',
  type text not null default 'byt',
  rent_amount numeric not null default 0,
  status text not null default 'vacant' check (status in ('occupied','vacant','maintenance')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  lease_start date not null,
  lease_end date not null,
  rent_amount numeric not null default 0,
  deposit numeric not null default 0,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists rent_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  amount numeric not null,
  due_date date not null,
  paid_date date,
  status text not null default 'pending' check (status in ('paid','pending','overdue')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  cost numeric,
  reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS: allow all for now (add auth later)
alter table properties enable row level security;
alter table tenants enable row level security;
alter table rent_payments enable row level security;
alter table maintenance_requests enable row level security;

create policy "allow all" on properties for all using (true) with check (true);
create policy "allow all" on tenants for all using (true) with check (true);
create policy "allow all" on rent_payments for all using (true) with check (true);
create policy "allow all" on maintenance_requests for all using (true) with check (true);

-- Auto-mark overdue payments (run daily or via cron)
-- update rent_payments set status = 'overdue'
-- where status = 'pending' and due_date < current_date;
