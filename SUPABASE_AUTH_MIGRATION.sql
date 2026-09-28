begin;

create table if not exists public.delta_user_roles (
  email text primary key,
  role text not null check (role in ('Editor', 'Administrador')),
  created_at timestamptz not null default now()
);

alter table public.delta_user_roles enable row level security;

with role_candidates(email, role) as (
  select lower(item.payload->>'email'), item.payload->>'role'
  from public.delta_app_state state
  cross join lateral jsonb_array_elements(coalesce(state.users, '[]'::jsonb)) as item(payload)
  where state.id = 'main'
  union all
  select lower(payload->>'email'), payload->>'role'
  from public.delta_users
), normalized_roles as (
  select distinct on (email)
    email,
    case when role = 'Administrador' then 'Administrador' else 'Editor' end as role
  from role_candidates
  where email is not null and email <> ''
  order by email, (role = 'Administrador') desc
)
insert into public.delta_user_roles(email, role)
select email, role from normalized_roles
on conflict (email) do update
set role = case
  when public.delta_user_roles.role = 'Administrador' or excluded.role = 'Administrador' then 'Administrador'
  else 'Editor'
end;

create or replace function public.delta_has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.delta_user_roles roles
    where lower(roles.email) = lower(auth.jwt()->>'email')
      and roles.role = required_role
  );
$$;

revoke all on function public.delta_has_role(text) from public;
grant execute on function public.delta_has_role(text) to authenticated;
revoke all on public.delta_user_roles from anon, authenticated;
grant select on public.delta_user_roles to authenticated;

drop policy if exists "delta role self or admin read" on public.delta_user_roles;
create policy "delta role self or admin read"
  on public.delta_user_roles
  for select
  to authenticated
  using (
    lower(email) = lower(auth.jwt()->>'email')
    or public.delta_has_role('Administrador')
  );

grant select on public.delta_app_state to anon, authenticated;
grant insert, update, delete on public.delta_app_state to authenticated;
drop policy if exists "delta state authenticated access" on public.delta_app_state;
drop policy if exists "delta app state public read" on public.delta_app_state;
drop policy if exists "delta app state editor write" on public.delta_app_state;
create policy "delta app state public read"
  on public.delta_app_state
  for select
  to anon, authenticated
  using (true);
create policy "delta app state editor write"
  on public.delta_app_state
  for all
  to authenticated
  using (public.delta_has_role('Editor') or public.delta_has_role('Administrador'))
  with check (public.delta_has_role('Editor') or public.delta_has_role('Administrador'));

update public.delta_users
set payload = payload - 'pass',
    updated_at = now()
where payload ? 'pass';

alter table public.delta_app_state drop column if exists users;
revoke all on table public.delta_machines, public.delta_teams, public.delta_users from anon, authenticated, public;

insert into storage.buckets (id, name, public)
values ('delta-pdfs', 'delta-pdfs', false)
on conflict (id) do update set public = false;

drop policy if exists "delta pdf authenticated access" on storage.objects;
drop policy if exists "delta pdf editor access" on storage.objects;
create policy "delta pdf editor access"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'delta-pdfs'
    and (public.delta_has_role('Editor') or public.delta_has_role('Administrador'))
  )
  with check (
    bucket_id = 'delta-pdfs'
    and (public.delta_has_role('Editor') or public.delta_has_role('Administrador'))
  );

commit;
