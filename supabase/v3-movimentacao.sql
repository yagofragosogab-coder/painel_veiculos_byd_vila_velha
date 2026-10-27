-- =====================================================================
-- Painel de Veículos — v3: planilha MOVIMENTAÇÃO DE VEÍCULOS (HUB → Vila Velha)
-- + colunas novas da HUB (PLACA, SETOR, % BATERIA BYD).
-- Rode DEPOIS do v2-servicos-lavagem.sql.
-- =====================================================================
alter table public.vehicles add column if not exists placa text not null default '';
alter table public.vehicles add column if not exists setor text not null default '';
alter table public.vehicles add column if not exists bateria_hub smallint;
alter table public.vehicles drop constraint if exists vehicles_origem_cadastro_check;
alter table public.vehicles add constraint vehicles_origem_cadastro_check check (origem_cadastro in ('pds','manual','mov'));
alter table public.import_runs drop constraint if exists import_runs_fonte_check;
alter table public.import_runs add constraint import_runs_fonte_check check (fonte in ('pds','agenda','mov'));

create table if not exists public.movimentacoes (
  chassi text primary key,
  status text not null default '',
  vendedor text not null default '',
  data_solicitacao date,
  chamado text not null default '',
  previsao_entrega date,
  data_entrega date,
  entregue_vv boolean,
  observacao text not null default '',
  aba_origem text not null default '',
  origem_hash text,
  atualizado_em timestamptz not null default now()
);
alter table public.movimentacoes enable row level security;
drop policy if exists mv_sel on public.movimentacoes; create policy mv_sel on public.movimentacoes for select using (public.is_ativo());
do $$ begin alter publication supabase_realtime add table public.movimentacoes; exception when others then null; end $$;

create or replace function public.importar_iniciar(p_fonte text, p_arquivo text) returns bigint
language plpgsql security definer set search_path = public as $$
declare rid bigint;
begin
  if not public.is_gestor() then raise exception 'Só a Supervisora ou o Administrador enviam planilhas.'; end if;
  if p_fonte not in ('pds','agenda','mov') then raise exception 'Fonte inválida.'; end if;
  insert into public.import_runs(fonte, arquivo) values (p_fonte, p_arquivo) returning id into rid;
  return rid;
end $$;

-- HUB: agora grava também placa, setor e % bateria do HUB
create or replace function public.importar_pds_lote(p_run bigint, p_rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb; ex public.vehicles; ins int := 0; upd int := 0; igu int := 0;
begin
  if not public.is_gestor() then raise exception 'Sem permissão.'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    select * into ex from public.vehicles where chassi = r->>'chassi';
    if ex.chassi is null then
      insert into public.vehicles(chassi, modelo, versao, cor, recebido_hub_em, previsao_chegada_loja, flag_data_invalida, origem_hash, origem_cadastro, encontrado_ultima_carga, etapa, etapa_desde, atualizado_por_nome, atualizado_em, placa, setor, bateria_hub)
      values (r->>'chassi', coalesce(nullif(r->>'modelo',''),'—'), coalesce(r->>'versao',''), coalesce(r->>'cor',''),
        nullif(r->>'recebido_hub_em','')::date, nullif(r->>'previsao_chegada_loja','')::date, coalesce((r->>'flag_data_invalida')::boolean,false),
        r->>'hash', 'pds', true, 'previsto', coalesce(nullif(r->>'recebido_hub_em','')::timestamptz, now()), 'Planilha PDS', now(),
        coalesce(r->>'placa',''), coalesce(r->>'setor',''), nullif(r->>'bateria_hub','')::smallint);
      ins := ins + 1;
    elsif ex.origem_hash is not distinct from r->>'hash' then
      igu := igu + 1;
    else
      update public.vehicles set modelo = coalesce(nullif(r->>'modelo',''), modelo), versao = coalesce(r->>'versao',''), cor = coalesce(nullif(r->>'cor',''), cor),
        recebido_hub_em = nullif(r->>'recebido_hub_em','')::date, previsao_chegada_loja = nullif(r->>'previsao_chegada_loja','')::date,
        flag_data_invalida = coalesce((r->>'flag_data_invalida')::boolean,false), origem_hash = r->>'hash', encontrado_ultima_carga = true,
        placa = coalesce(r->>'placa',''), setor = coalesce(r->>'setor',''), bateria_hub = nullif(r->>'bateria_hub','')::smallint,
        origem_cadastro = case when origem_cadastro = 'mov' then 'pds' else origem_cadastro end,
        confirmado_pds_em = case when origem_cadastro = 'manual' and confirmado_pds_em is null then now() else confirmado_pds_em end
      where chassi = ex.chassi;
      if ex.origem_cadastro = 'manual' and ex.confirmado_pds_em is null then
        insert into public.vehicle_events(chassi, tipo, oque, usuario_nome, origem) values (ex.chassi, 'confirmado_pds', 'Cadastro manual confirmado pela planilha PDS', 'Planilha PDS', 'pds');
      elsif ex.etapa <> 'previsto' then
        insert into public.vehicle_events(chassi, tipo, oque, usuario_nome, origem) values (ex.chassi, 'atualizado_pds', 'Atualizado pela planilha PDS', 'Planilha PDS', 'pds');
      end if;
      upd := upd + 1;
    end if;
  end loop;
  return jsonb_build_object('inseridas', ins, 'atualizadas', upd, 'inalteradas', igu);
end $$;

-- MOVIMENTAÇÃO: um registro por chassi (o mais recente). Carro que não está na HUB entra como "mov".
create or replace function public.importar_mov_lote(p_run bigint, p_rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb; ex public.movimentacoes; tem_v boolean; ins int := 0; upd int := 0; igu int := 0;
begin
  if not public.is_gestor() then raise exception 'Sem permissão.'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    select exists(select 1 from public.vehicles where chassi = r->>'chassi') into tem_v;
    if not tem_v then
      insert into public.vehicles(chassi, modelo, cor, origem_cadastro, encontrado_ultima_carga, etapa, etapa_desde, atualizado_por_nome, atualizado_em, setor)
      values (r->>'chassi', coalesce(nullif(r->>'modelo',''),'—'), coalesce(r->>'cor',''), 'mov', false, 'previsto', now(), 'Planilha Movimentação', now(), 'VILA VELHA');
      insert into public.vehicle_events(chassi, tipo, oque, usuario_nome, origem) values (r->>'chassi', 'importado', 'Entrou pela planilha Movimentação (não está na HUB)', 'Planilha Movimentação', 'pds');
    end if;
    select * into ex from public.movimentacoes where chassi = r->>'chassi';
    if ex.chassi is not null and ex.origem_hash is not distinct from r->>'hash' then igu := igu + 1; continue; end if;
    insert into public.movimentacoes(chassi, status, vendedor, data_solicitacao, chamado, previsao_entrega, data_entrega, entregue_vv, observacao, aba_origem, origem_hash, atualizado_em)
    values (r->>'chassi', coalesce(r->>'status',''), coalesce(r->>'vendedor',''), nullif(r->>'data_solicitacao','')::date, coalesce(r->>'chamado',''),
      nullif(r->>'previsao_entrega','')::date, nullif(r->>'data_entrega','')::date, nullif(r->>'entregue_vv','')::boolean, coalesce(r->>'observacao',''), coalesce(r->>'aba_origem',''), r->>'hash', now())
    on conflict (chassi) do update set status = excluded.status, vendedor = excluded.vendedor, data_solicitacao = excluded.data_solicitacao, chamado = excluded.chamado,
      previsao_entrega = excluded.previsao_entrega, data_entrega = excluded.data_entrega, entregue_vv = excluded.entregue_vv, observacao = excluded.observacao,
      aba_origem = excluded.aba_origem, origem_hash = excluded.origem_hash, atualizado_em = now();
    if ex.chassi is null then ins := ins + 1; else upd := upd + 1;
      insert into public.vehicle_events(chassi, tipo, oque, usuario_nome, origem) values (r->>'chassi', 'movimentacao', 'Atualizado pela planilha Movimentação (' || coalesce(nullif(r->>'status',''),'sem status') || ')', 'Planilha Movimentação', 'pds');
    end if;
  end loop;
  return jsonb_build_object('inseridas', ins, 'atualizadas', upd, 'inalteradas', igu);
end $$;

grant execute on function public.importar_iniciar, public.importar_pds_lote, public.importar_mov_lote to authenticated;
notify pgrst, 'reload schema';
select 'ok' as resultado;
