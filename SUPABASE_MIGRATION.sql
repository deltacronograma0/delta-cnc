begin;

alter table public.delta_app_state
  add column if not exists updated_at timestamptz not null default now();

with seed_machines(payload) as (
  select jsonb_array_elements($machines$[
    {"id":"1001","equipe":"Felipe e Arthur","cliente":"AC COMUNICACAO VISUAL LTDA","maquina":"Fiber Split 50W + 4º Eixo + Estabilizador","linha":"Leve","inicio":"2026-09-17","previsao":"2026-09-18","entregaReal":"2026-09-18","statusManual":"automatico","obs":"OS: DM01 | Concluído com testes óticos e alinhamento de espelhos galvo de alta precisão em laboratório.","os":"DM01"},
    {"id":"1002","equipe":"Felipe e Arthur","cliente":"LAYSLA BRAGA DA SILVA","maquina":"FIBER SPLIT 50W","linha":"Leve","inicio":"2026-09-17","previsao":"2026-09-18","entregaReal":"","statusManual":"automatico","obs":"Em montagem de carcaça e testes de fonte laser.","os":"DM02"},
    {"id":"1003","equipe":"Equipe Beta","cliente":"JPX TECHNOLOGY LTDA","maquina":"Centro de Usinagem Easy 2030, Spindle 12cv","linha":"Pesada","inicio":"","previsao":"","entregaReal":"","statusManual":"automatico","obs":"Aguardando barramentos importados e revisão elétrica do painel CNC.","os":"DM03"},
    {"id":"1004","equipe":"Equipe Alfa","cliente":"METALURGICA SUL BRASIL","maquina":"Router CNC Industrial 1530","linha":"Pesada","inicio":"2026-09-02","previsao":"2026-09-12","entregaReal":"2026-09-11","statusManual":"automatico","obs":"Entregue com calibração a laser e trecho de teste completo.","os":"DM04"},
    {"id":"1005","equipe":"Carlos e Renato","cliente":"MÓVEIS PLANEJADOS ARTÍSTICA","maquina":"Router Wood PRO 1325 Spindle 6kw","linha":"Intermediária","inicio":"2026-09-10","previsao":"2026-09-22","entregaReal":"","statusManual":"automatico","obs":"Testes de vácuo em andamento e fixação da mesa.","os":"DM05"}
  ]$machines$::jsonb)
), machine_candidates(payload, priority) as (
  select payload, 10 from seed_machines
  union all select payload, 20 from public.delta_machines
  union all
  select item.payload, 30
  from public.delta_app_state s
  cross join lateral jsonb_array_elements(coalesce(s.machines, '[]'::jsonb)) as item(payload)
  where s.id = 'main'
), machine_value(value) as (
  select coalesce(jsonb_agg(payload order by payload->>'id'), '[]'::jsonb)
  from (
    select distinct on (payload->>'id') payload
    from machine_candidates
    where nullif(payload->>'id', '') is not null
    order by payload->>'id', priority desc
  ) merged
), seed_teams(payload) as (
  select jsonb_array_elements($teams$[
    {"id":"EQ-001","name":"Felipe e Arthur","tags":["Alta Performance","Linha Leve","Fibras Laser"]},
    {"id":"EQ-002","name":"Equipe Beta","tags":["Linha Pesada","Precisão CNC","Centros Usinagem"]},
    {"id":"EQ-003","name":"Equipe Alfa","tags":["Linha Pesada","Corte Plasma","Routers Alta Potência"]},
    {"id":"EQ-004","name":"Carlos e Renato","tags":["Linha Intermediária","Routers Madeira","Sistemas Vácuo"]}
  ]$teams$::jsonb)
), team_candidates(payload, priority) as (
  select payload, 10 from seed_teams
  union all select payload, 20 from public.delta_teams
  union all
  select item.payload, 30
  from public.delta_app_state s
  cross join lateral jsonb_array_elements(coalesce(s.teams, '[]'::jsonb)) as item(payload)
  where s.id = 'main'
), team_value(value) as (
  select coalesce(jsonb_agg(payload order by payload->>'id'), '[]'::jsonb)
  from (
    select distinct on (payload->>'id') payload
    from team_candidates
    where nullif(payload->>'id', '') is not null
    order by payload->>'id', priority desc
  ) merged
), seed_users(payload) as (
  select jsonb_array_elements($users$[
    {"email":"deltacronograma@gmail.com","role":"Administrador"},
    {"email":"producao@deltacnc.pt","role":"Editor"}
  ]$users$::jsonb)
), user_candidates(payload, priority) as (
  select payload, 10 from seed_users
  union all select payload, 20 from public.delta_users
  union all
  select item.payload, 30
  from public.delta_app_state s
  cross join lateral jsonb_array_elements(coalesce(s.users, '[]'::jsonb)) as item(payload)
  where s.id = 'main'
), user_value(value) as (
  select coalesce(jsonb_agg(payload order by lower(payload->>'email')), '[]'::jsonb)
  from (
    select distinct on (lower(payload->>'email')) payload
    from user_candidates
    where nullif(payload->>'email', '') is not null
    order by lower(payload->>'email'), priority desc
  ) merged
)
update public.delta_app_state s
set machines = machine_value.value,
    teams = team_value.value,
    users = user_value.value,
    updated_at = now()
from machine_value, team_value, user_value
where s.id = 'main';

commit;
