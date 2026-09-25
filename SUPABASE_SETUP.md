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

No app, abra **Definicoes**, preencha os dois campos de Supabase e clique em **Conectar e sincronizar** uma vez em cada computador ou celular. Depois disso, cada alteração salva é enviada automaticamente e as mudanças dos outros usuários chegam em tempo real. O botão **Sincronizar** fica apenas como conferência manual.

A chave `service_role` nunca deve ser colocada no navegador.

## 5. Sincronização profissional por registros

O modelo antigo guarda máquinas, equipes e utilizadores em uma única linha JSON. Para evitar que três gestores sobrescrevam alterações uns dos outros, execute o arquivo `supabase_normalized_migration.sql` no SQL Editor.

Esse script cria tabelas separadas e copia os dados atuais sem apagar `delta_app_state`. Depois de executar com sucesso, a aplicação passa a usar as tabelas separadas; `delta_app_state` permanece como backup histórico.

## 6. Controle definitivo de conflitos

Depois de executar a migração normalizada, execute também `supabase_concurrency_migration.sql`. Ela adiciona versão aos registros e cria operações atômicas no servidor. A ordem é obrigatória:

1. `supabase_normalized_migration.sql`
2. `supabase_concurrency_migration.sql`
3. Atualizar todos os celulares para a versão publicada pelo app

Quando essas duas migrações estiverem concluídas, uma alteração feita com dados antigos não poderá sobrescrever silenciosamente a alteração de outro gestor.

O app usa as funções `delta_save_record` e `delta_delete_record` para confirmar cada alteração no servidor antes de exibir o estado como sincronizado.
