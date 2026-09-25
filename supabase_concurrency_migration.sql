-- DELTA CNC: controle de concorrencia no servidor
-- Execute depois de supabase_normalized_migration.sql.
-- Nao apaga dados; apenas adiciona versionamento e operacoes atomicas.

alter table public.delta_machines
  add column if not exists version bigint not null default 1;
alter table public.delta_teams
  add column if not exists version bigint not null default 1;
alter table public.delta_users
  add column if not exists version bigint not null default 1;

create or replace function public.delta_save_record(
  p_collection text,
  p_id text,
  p_payload jsonb,
  p_expected_updated_at timestamptz,
  p_updated_by text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  table_name text;
  current_updated_at timestamptz;
  next_version bigint;
  result_row jsonb;
begin
  if p_collection not in ('machines', 'teams', 'users') then
    raise exception 'Colecao invalida';
  end if;

  table_name := 'delta_' || p_collection;
  execute format('select updated_at, version from public.%I where id = $1 for update', table_name)
    into current_updated_at, next_version
    using p_id;

  if current_updated_at is not null
     and p_expected_updated_at is not null
     and current_updated_at > p_expected_updated_at then
    raise exception 'CONFLICT: registro foi alterado por outro gestor';
  end if;

  next_version := coalesce(next_version, 0) + 1;
  execute format(
    'insert into public.%I (id, payload, updated_at, updated_by, version)
     values ($1, $2, now(), $3, $4)
     on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at, updated_by = excluded.updated_by, version = excluded.version
     returning jsonb_build_object(''id'', id, ''payload'', payload, ''updated_at'', updated_at, ''updated_by'', updated_by, ''version'', version)',
    table_name
  ) into result_row using p_id, p_payload, p_updated_by, next_version;

  return result_row;
end;
$$;

grant execute on function public.delta_save_record(text, text, jsonb, timestamptz, text) to authenticated;

create or replace function public.delta_delete_record(
  p_collection text,
  p_id text,
  p_expected_updated_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  table_name text;
  current_updated_at timestamptz;
begin
  if p_collection not in ('machines', 'teams', 'users') then
    raise exception 'Colecao invalida';
  end if;

  table_name := 'delta_' || p_collection;
  execute format('select updated_at from public.%I where id = $1 for update', table_name)
    into current_updated_at using p_id;

  if current_updated_at is not null
     and p_expected_updated_at is not null
     and current_updated_at > p_expected_updated_at then
    raise exception 'CONFLICT: registro foi alterado por outro gestor';
  end if;

  execute format('delete from public.%I where id = $1', table_name) using p_id;
end;
$$;

grant execute on function public.delta_delete_record(text, text, timestamptz) to authenticated;
