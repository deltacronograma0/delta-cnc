-- DELTA CNC: sincronizacao profissional por registros
-- Execute no Supabase SQL Editor. Este script nao apaga a tabela antiga.

create table if not exists public.delta_machines (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.delta_teams (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.delta_users (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.delta_machines enable row level security;
alter table public.delta_teams enable row level security;
alter table public.delta_users enable row level security;

drop policy if exists "delta machines authenticated access" on public.delta_machines;
create policy "delta machines authenticated access"
  on public.delta_machines for all to authenticated
  using (true) with check (true);

drop policy if exists "delta teams authenticated access" on public.delta_teams;
create policy "delta teams authenticated access"
  on public.delta_teams for all to authenticated
  using (true) with check (true);

drop policy if exists "delta users authenticated access" on public.delta_users;
create policy "delta users authenticated access"
  on public.delta_users for all to authenticated
  using (true) with check (true);

alter publication supabase_realtime add table public.delta_machines;
alter publication supabase_realtime add table public.delta_teams;
alter publication supabase_realtime add table public.delta_users;

-- Migracao inicial: copia o snapshot atual sem alterar a tabela delta_app_state.
insert into public.delta_machines (id, payload)
select item->>'id', item
from public.delta_app_state,
  jsonb_array_elements(machines) as item
where id = 'main' and item->>'id' is not null
on conflict (id) do nothing;

insert into public.delta_teams (id, payload)
select coalesce(item->>'id', md5(item::text)), item
from public.delta_app_state,
  jsonb_array_elements(teams) as item
where id = 'main'
on conflict (id) do nothing;

insert into public.delta_users (id, payload)
select coalesce(item->>'email', md5(item::text)), item
from public.delta_app_state,
  jsonb_array_elements(users) as item
where id = 'main'
on conflict (id) do nothing;
