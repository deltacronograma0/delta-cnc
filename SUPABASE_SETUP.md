# Sincronizacao online do CP - DELTA

O aplicativo usa uma linha unica em `delta_app_state` para compartilhar maquinas, equipes e utilizadores entre os gestores.

## 1. Criar a tabela

No Supabase, abra **SQL Editor**, cole e execute:

```sql
create table if not exists public.delta_app_state (
  id text primary key,
  machines jsonb not null default '[]'::jsonb,
  teams jsonb not null default '[]'::jsonb,
  users jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.delta_app_state enable row level security;

drop policy if exists "delta state authenticated access" on public.delta_app_state;
create policy "delta state authenticated access"
  on public.delta_app_state
  for all
  to authenticated
  using (true)
  with check (true);

alter table public.delta_app_state replica identity full;
alter publication supabase_realtime add table public.delta_app_state;
```

## 2. Criar o armazenamento dos PDFs

No mesmo **SQL Editor**, execute este bloco para criar o bucket privado usado pelas ordens de serviço:

```sql
insert into storage.buckets (id, name, public)
values ('delta-pdfs', 'delta-pdfs', false)
on conflict (id) do nothing;

drop policy if exists "delta pdf authenticated access" on storage.objects;
create policy "delta pdf authenticated access"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'delta-pdfs')
  with check (bucket_id = 'delta-pdfs');
```

O bucket deve permanecer **privado**. O aplicativo usa URLs assinadas temporarias para abrir cada PDF.

## 3. Ativar acesso anonimo

Em **Authentication > Providers**, ative **Anonymous Sign-Ins**. O app usa uma sessao anonima apenas para que a politica RLS permita a sincronizacao; a tela de acesso do aplicativo continua controlando os perfis internos.

## 4. Conectar o app

Em **Project Settings > API**, copie:

- Project URL
- Publishable key ou anon key

No app, abra **Definicoes**, preencha os dois campos de Supabase e clique em **Conectar e sincronizar**.

A chave `service_role` nunca deve ser colocada no navegador.
