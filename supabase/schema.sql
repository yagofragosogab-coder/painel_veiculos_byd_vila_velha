-- =====================================================================
-- Painel de Veículos — Vitória Motors BYD Vila Velha
-- Schema Supabase (Postgres). Rode inteiro no SQL Editor, uma vez.
-- =====================================================================

create extension if not exists pgcrypto;

do $$ begin
  create type perfil_t as enum ('administrador','supervisora','usuario');
exception when duplicate_object then null; end $$;
do $$ begin
  create type etapa_t as enum ('previsto','loja','preparacao','pronto','entregue');
exception when duplicate_object then null; end $$;
do $$ begin
  create type origem_t as enum ('usuario','pds','agenda','sistema');
exception when duplicate_object then null; end $$;
do $$ begin
  create type issue_t as enum ('invalido','duplicado','sem_correspondencia','data_invalida');
exception when duplicate_object then null; end $$;

-- ---------- Tabelas ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  nome_completo text not null,
  usuario text not null unique,
  cargo text not null default '',
  perfil perfil_t not null default 'usuario',
  ativo boolean not null default true,
  deve_trocar_senha boolean not null default true,
  criado_por uuid null,              -- null = sistema (carga inicial)
  criado_em timestamptz not null default now()
);

create table if not exists public.config (
  chave text primary key,
  valor jsonb not null
);
insert into public.config(chave, valor) values ('dias_parado', '5'::jsonb), ('dias_manual_pendente', '7'::jsonb)
on conflict (chave) do nothing;

create table if not exists public.vehicles (
  chassi text primary key check (chassi ~ '^[A-HJ-NPR-Z0-9]{17}$'),
  marca text not null default 'BYD',
  modelo text not null,
  versao text not null default '',
  cor text not null default '',
  recebido_hub_em date,
  previsao_chegada_loja date,
  flag_data_invalida boolean not null default false,
  encontrado_ultima_carga boolean not null default true,
  origem_hash text,
  origem_cadastro text not null default 'pds' check (origem_cadastro in ('pds','manual')),
  cadastrado_por_id uuid references public.profiles(id),
  cadastrado_em timestamptz,
  confirmado_pds_em timestamptz,
  etapa etapa_t not null default 'previsto',
  etapa_desde timestamptz not null default now(),
  chegada_loja_em timestamptz,
  status_localizacao text check (status_localizacao is null or status_localizacao in (
    'Estacionamento da loja (sujo)',
    'Estacionamento da loja (venda cancelada)',
    'Showroom',
    'Deixado para lavar no Shopping Praia da Costa',
    'Estacionamento da loja (limpo e pronto para preparo)',
    'Carro em exposição (evento)',
    'Carro emprestado para outra loja')),
  preparador_id uuid references public.profiles(id),
  entregador_nome text,
  atualizado_por_id uuid references public.profiles(id),
  atualizado_por_nome text not null default 'Planilha PDS',
  atualizado_por_cargo text not null default '',
  atualizado_em timestamptz not null default now()
);
create index if not exists vehicles_etapa_idx on public.vehicles(etapa);
create index if not exists vehicles_chegada_idx on public.vehicles(chegada_loja_em);

create table if not exists public.schedules (
  id bigint generated always as identity primary key,
  chassi text not null unique,
  data_hora_entrega timestamptz,
  cliente text not null default '',
  vendedor text not null default '',
  acessorios text not null default '',
  entregador_sugerido text not null default '',
  situacao_agenda text not null default '',
  aba_origem text not null default '',
  origem_hash text,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.vehicle_events (
  id bigint generated always as identity primary key,
  chassi text not null,
  tipo text not null,
  oque text not null,
  campo text,
  valor_anterior text,
  valor_novo text,
  usuario_id uuid,
  usuario_nome text not null,
  usuario_cargo text not null default '',
  origem origem_t not null,
  motivo text,
  criado_em timestamptz not null default now()
);
create index if not exists vehicle_events_chassi_idx on public.vehicle_events(chassi, criado_em desc);

create table if not exists public.user_audit_log (
  id bigint generated always as identity primary key,
  acao text not null check (acao in ('criou','inativou','reativou','redefiniu a senha de')),
  alvo_id uuid not null references public.profiles(id),
  executor_id uuid references public.profiles(id),   -- null = sistema
  criado_em timestamptz not null default now()
);

create table if not exists public.import_runs (
  id bigint generated always as identity primary key,
  fonte text not null check (fonte in ('pds','agenda')),
  arquivo text not null,
  iniciado_em timestamptz not null default now(),
  finalizado_em timestamptz,
  lidas int not null default 0,
  inseridas int not null default 0,
  atualizadas int not null default 0,
  inalteradas int not null default 0,
  rejeitadas int not null default 0,
  status text not null default 'rodando' check (status in ('rodando','ok','falhou')),
  erro text
);

create table if not exists public.import_issues (
  id bigint generated always as identity primary key,
  run_id bigint references public.import_runs(id),
  fonte text not null,
  chassi_bruto text not null,
  tipo issue_t not null,
  detalhe text not null default '',
  resolvido boolean not null default false,
  resolvido_por text,
  resolvido_em timestamptz,
  vinculado text,
  criado_em timestamptz not null default now()
);
create unique index if not exists import_issues_aberta_uq on public.import_issues(fonte, chassi_bruto, tipo) where not resolvido;

-- ---------- Logs imutáveis ----------
create or replace function public.bloquear_alteracao() returns trigger language plpgsql as $$
begin raise exception 'Este registro não pode ser alterado nem apagado.'; end $$;
drop trigger if exists vehicle_events_imutavel on public.vehicle_events;
create trigger vehicle_events_imutavel before update or delete on public.vehicle_events for each row execute function public.bloquear_alteracao();
drop trigger if exists user_audit_imutavel on public.user_audit_log;
create trigger user_audit_imutavel before update or delete on public.user_audit_log for each row execute function public.bloquear_alteracao();

-- ---------- Funções de apoio ----------
create or replace function public.eu() returns public.profiles language sql stable security definer set search_path = public as $$
  select * from public.profiles where id = auth.uid() and ativo
$$;
create or replace function public.is_ativo() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and ativo)
$$;
create or replace function public.is_gestor() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and ativo and perfil in ('administrador','supervisora'))
$$;

create or replace function public._evento(p_chassi text, p_tipo text, p_oque text, p_campo text default null, p_ant text default null, p_novo text default null, p_motivo text default null)
returns void language plpgsql security definer set search_path = public as $$
declare me public.profiles;
begin
  select * into me from public.eu();
  if me.id is null then raise exception 'Entre de novo para continuar.'; end if;
  insert into public.vehicle_events(chassi, tipo, oque, campo, valor_anterior, valor_novo, usuario_id, usuario_nome, usuario_cargo, origem, motivo)
  values (p_chassi, p_tipo, p_oque, p_campo, p_ant, p_novo, me.id, me.nome_completo, me.cargo, 'usuario', p_motivo);
  update public.vehicles set atualizado_por_id = me.id, atualizado_por_nome = me.nome_completo, atualizado_por_cargo = me.cargo, atualizado_em = now() where chassi = p_chassi;
end $$;

create or replace function public._carro(p_chassi text) returns public.vehicles language plpgsql security definer set search_path = public as $$
declare v public.vehicles;
begin
  if not public.is_ativo() then raise exception 'Seu acesso está desligado.'; end if;
  select * into v from public.vehicles where chassi = upper(replace(p_chassi,' ','')) for update;
  if v.chassi is null then raise exception 'Não achamos esse carro.'; end if;
  return v;
end $$;

-- ---------- Ações do fluxo ----------
create or replace function public.confirmar_chegada(p_chassi text) returns void language plpgsql security definer set search_path = public as $$
declare v public.vehicles;
begin
  v := public._carro(p_chassi);
  if v.etapa <> 'previsto' then raise exception 'Esse carro já chegou na loja.'; end if;
  update public.vehicles set etapa = 'loja', etapa_desde = now(), chegada_loja_em = now(), status_localizacao = 'Estacionamento da loja (sujo)' where chassi = v.chassi;
  perform public._evento(v.chassi, 'etapa', 'Confirmou a chegada na loja', 'etapa', 'previsto', 'loja');
end $$;

create or replace function public.comecar_preparacao(p_chassi text, p_preparador uuid) returns void language plpgsql security definer set search_path = public as $$
declare v public.vehicles; p public.profiles;
begin
  v := public._carro(p_chassi);
  if v.etapa <> 'loja' then raise exception 'Primeiro confirme a chegada do carro na loja.'; end if;
  select * into p from public.profiles where id = coalesce(p_preparador, auth.uid()) and ativo;
  if p.id is null then raise exception 'Escolha um preparador ativo.'; end if;
  update public.vehicles set etapa = 'preparacao', etapa_desde = now(), preparador_id = p.id where chassi = v.chassi;
  perform public._evento(v.chassi, 'etapa', 'Começou a preparação (preparador: ' || p.nome_completo || ')', 'etapa', 'loja', 'preparacao');
end $$;

create or replace function public.carro_pronto(p_chassi text) returns void language plpgsql security definer set search_path = public as $$
declare v public.vehicles;
begin
  v := public._carro(p_chassi);
  if v.etapa <> 'preparacao' then raise exception 'O carro precisa estar em preparação.'; end if;
  update public.vehicles set etapa = 'pronto', etapa_desde = now() where chassi = v.chassi;
  perform public._evento(v.chassi, 'etapa', 'Marcou o carro como pronto', 'etapa', 'preparacao', 'pronto');
end $$;

create or replace function public.entregar(p_chassi text, p_entregador text) returns void language plpgsql security definer set search_path = public as $$
declare v public.vehicles;
begin
  v := public._carro(p_chassi);
  if v.etapa <> 'pronto' then raise exception 'O carro precisa estar pronto.'; end if;
  if coalesce(trim(p_entregador),'') = '' then raise exception 'Diga quem entregou o carro.'; end if;
  update public.vehicles set etapa = 'entregue', etapa_desde = now(), entregador_nome = trim(p_entregador) where chassi = v.chassi;
  perform public._evento(v.chassi, 'etapa', 'Entregou ao cliente (entregador: ' || trim(p_entregador) || ')', 'etapa', 'pronto', 'entregue');
end $$;

create or replace function public.voltar_etapa(p_chassi text, p_motivo text) returns void language plpgsql security definer set search_path = public as $$
declare v public.vehicles; nova etapa_t; labels jsonb := '{"previsto":"Previsto","loja":"Na loja","preparacao":"Em preparação","pronto":"Pronto","entregue":"Entregue"}';
begin
  if not public.is_gestor() then raise exception 'Só a Supervisora ou o Administrador podem voltar uma etapa.'; end if;
  if length(trim(coalesce(p_motivo,''))) < 3 then raise exception 'Escreva o motivo em poucas palavras.'; end if;
  v := public._carro(p_chassi);
  nova := case v.etapa when 'loja' then 'previsto' when 'preparacao' then 'loja' when 'pronto' then 'preparacao' when 'entregue' then 'pronto' else null end;
  if nova is null then raise exception 'Esse carro já está na primeira etapa.'; end if;
  update public.vehicles set etapa = nova, etapa_desde = now(),
    status_localizacao = case when nova = 'previsto' then null else status_localizacao end,
    chegada_loja_em = case when nova = 'previsto' then null else chegada_loja_em end,
    preparador_id = case when nova in ('previsto','loja') then null else preparador_id end,
    entregador_nome = case when v.etapa = 'entregue' then null else entregador_nome end
  where chassi = v.chassi;
  perform public._evento(v.chassi, 'etapa', 'Voltou de "' || (labels->>v.etapa::text) || '" para "' || (labels->>nova::text) || '"', 'etapa', v.etapa::text, nova::text, trim(p_motivo));
end $$;

create or replace function public.set_localizacao(p_chassi text, p_loc text) returns void language plpgsql security definer set search_path = public as $$
declare v public.vehicles;
begin
  v := public._carro(p_chassi);
  if v.etapa = 'previsto' then raise exception 'Confirme a chegada antes de mudar o local.'; end if;
  update public.vehicles set status_localizacao = p_loc where chassi = v.chassi;
  perform public._evento(v.chassi, 'localizacao', 'Mudou o local para ' || p_loc, 'status_localizacao', v.status_localizacao, p_loc);
end $$;

create or replace function public.cadastrar_veiculo(p_chassi text, p_modelo text, p_cor text, p_versao text default '', p_previsao date default null)
returns text language plpgsql security definer set search_path = public as $$
declare c text := upper(regexp_replace(coalesce(p_chassi,''), '\s', '', 'g')); me public.profiles;
begin
  select * into me from public.eu();
  if me.id is null then raise exception 'Seu acesso está desligado.'; end if;
  if length(c) <> 17 then raise exception 'O chassi tem 17 caracteres e você digitou %. Confira e tente de novo.', length(c); end if;
  if c !~ '^[A-HJ-NPR-Z0-9]{17}$' then raise exception 'Chassi não usa as letras I, O ou Q. Confira e tente de novo.'; end if;
  if exists(select 1 from public.vehicles where chassi = c) then raise exception 'EXISTE'; end if;
  if coalesce(trim(p_modelo),'') = '' then raise exception 'Escolha o modelo do carro.'; end if;
  if coalesce(trim(p_cor),'') = '' then raise exception 'Escolha a cor do carro.'; end if;
  insert into public.vehicles(chassi, modelo, versao, cor, previsao_chegada_loja, origem_cadastro, cadastrado_por_id, cadastrado_em, encontrado_ultima_carga, etapa, etapa_desde, atualizado_por_id, atualizado_por_nome, atualizado_por_cargo)
  values (c, trim(p_modelo), trim(coalesce(p_versao,'')), upper(trim(p_cor)), p_previsao, 'manual', me.id, now(), false, 'previsto', now(), me.id, me.nome_completo, me.cargo);
  perform public._evento(c, 'cadastro', 'Cadastrou o veículo manualmente');
  return c;
end $$;

create or replace function public.resolver_pendencia(p_id bigint, p_vinculo text default null) returns void language plpgsql security definer set search_path = public as $$
declare me public.profiles; i public.import_issues; c text := upper(regexp_replace(coalesce(p_vinculo,''), '\s', '', 'g'));
begin
  if not public.is_gestor() then raise exception 'Só a Supervisora ou o Administrador resolvem pendências.'; end if;
  select * into me from public.eu();
  select * into i from public.import_issues where id = p_id;
  if c <> '' then
    if not exists(select 1 from public.vehicles where chassi = c) then raise exception 'Não achamos esse chassi no sistema. Confira ou cadastre o veículo.'; end if;
    update public.schedules set chassi = c where chassi = i.chassi_bruto and not exists(select 1 from public.schedules where chassi = c);
  end if;
  update public.import_issues set resolvido = true, resolvido_por = me.usuario, resolvido_em = now(), vinculado = nullif(c,'') where id = p_id;
end $$;

create or replace function public.set_cargo(p_id uuid, p_cargo text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_gestor() then raise exception 'Só a Supervisora ou o Administrador editam o cargo.'; end if;
  update public.profiles set cargo = trim(coalesce(p_cargo,'')) where id = p_id;
end $$;

create or replace function public.marcar_senha_trocada() returns void language sql security definer set search_path = public as $$
  update public.profiles set deve_trocar_senha = false where id = auth.uid();
$$;

-- ---------- Segurança (RLS) ----------
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.schedules enable row level security;
alter table public.vehicle_events enable row level security;
alter table public.user_audit_log enable row level security;
alter table public.import_runs enable row level security;
alter table public.import_issues enable row level security;
alter table public.config enable row level security;

drop policy if exists p_sel on public.profiles;        create policy p_sel on public.profiles for select using (public.is_ativo() or id = auth.uid());
drop policy if exists v_sel on public.vehicles;        create policy v_sel on public.vehicles for select using (public.is_ativo());
drop policy if exists s_sel on public.schedules;       create policy s_sel on public.schedules for select using (public.is_ativo());
drop policy if exists e_sel on public.vehicle_events;  create policy e_sel on public.vehicle_events for select using (public.is_ativo());
drop policy if exists a_sel on public.user_audit_log;  create policy a_sel on public.user_audit_log for select using (public.is_gestor());
drop policy if exists r_sel on public.import_runs;     create policy r_sel on public.import_runs for select using (public.is_ativo());
drop policy if exists i_sel on public.import_issues;   create policy i_sel on public.import_issues for select using (public.is_ativo());
drop policy if exists c_sel on public.config;          create policy c_sel on public.config for select using (public.is_ativo());
-- Sem políticas de INSERT/UPDATE/DELETE: toda escrita do app passa pelas funções acima (security definer)
-- ou pelas Edge Functions (service role).

revoke update, delete on public.vehicle_events, public.user_audit_log from anon, authenticated;
grant execute on function public.confirmar_chegada, public.comecar_preparacao, public.carro_pronto, public.entregar, public.voltar_etapa,
  public.set_localizacao, public.cadastrar_veiculo, public.resolver_pendencia, public.set_cargo, public.marcar_senha_trocada to authenticated;
revoke execute on function public._evento, public._carro from anon, authenticated;

-- ---------- Tempo real ----------
do $$ begin
  alter publication supabase_realtime add table public.vehicles, public.schedules, public.vehicle_events, public.import_runs, public.import_issues, public.profiles;
exception when others then null; end $$;

-- ---------- Storage (bucket das planilhas) ----------
insert into storage.buckets(id, name, public) values ('ingestao', 'ingestao', false) on conflict (id) do nothing;
