-- =====================================================================
-- Painel de Veículos — importação das planilhas pela tela (sem Edge Function)
-- Rode no SQL Editor depois do schema.sql. Só Administrador/Supervisora podem chamar.
-- O navegador lê o .xlsx, limpa as linhas e manda em lotes; o banco faz o merge por hash
-- e NUNCA mexe em etapa, localização, preparador ou entregador.
-- =====================================================================

create or replace function public.importar_iniciar(p_fonte text, p_arquivo text) returns bigint
language plpgsql security definer set search_path = public as $$
declare rid bigint;
begin
  if not public.is_gestor() then raise exception 'Só a Supervisora ou o Administrador enviam planilhas.'; end if;
  if p_fonte not in ('pds','agenda') then raise exception 'Fonte inválida.'; end if;
  insert into public.import_runs(fonte, arquivo) values (p_fonte, p_arquivo) returning id into rid;
  return rid;
end $$;

-- p_rows: [{chassi, modelo, versao, cor, recebido_hub_em, previsao_chegada_loja, flag_data_invalida, hash}]
create or replace function public.importar_pds_lote(p_run bigint, p_rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb; ex public.vehicles; ins int := 0; upd int := 0; igu int := 0; tem_agenda boolean;
begin
  if not public.is_gestor() then raise exception 'Sem permissão.'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    select * into ex from public.vehicles where chassi = r->>'chassi';
    if ex.chassi is null then
      insert into public.vehicles(chassi, modelo, versao, cor, recebido_hub_em, previsao_chegada_loja, flag_data_invalida, origem_hash, origem_cadastro, encontrado_ultima_carga, etapa, etapa_desde, atualizado_por_nome, atualizado_em)
      values (r->>'chassi', coalesce(nullif(r->>'modelo',''),'—'), coalesce(r->>'versao',''), coalesce(r->>'cor',''),
        nullif(r->>'recebido_hub_em','')::date, nullif(r->>'previsao_chegada_loja','')::date, coalesce((r->>'flag_data_invalida')::boolean,false),
        r->>'hash', 'pds', true, 'previsto', coalesce(nullif(r->>'recebido_hub_em','')::timestamptz, now()), 'Planilha PDS', now());
      ins := ins + 1;
    elsif ex.origem_hash is not distinct from r->>'hash' then
      if not ex.encontrado_ultima_carga then update public.vehicles set encontrado_ultima_carga = true where chassi = ex.chassi; end if;
      igu := igu + 1;
    else
      update public.vehicles set modelo = coalesce(nullif(r->>'modelo',''), modelo), versao = coalesce(r->>'versao',''), cor = coalesce(nullif(r->>'cor',''), cor),
        recebido_hub_em = nullif(r->>'recebido_hub_em','')::date, previsao_chegada_loja = nullif(r->>'previsao_chegada_loja','')::date,
        flag_data_invalida = coalesce((r->>'flag_data_invalida')::boolean,false), origem_hash = r->>'hash', encontrado_ultima_carga = true,
        confirmado_pds_em = case when origem_cadastro = 'manual' and confirmado_pds_em is null then now() else confirmado_pds_em end
      where chassi = ex.chassi;
      if ex.origem_cadastro = 'manual' and ex.confirmado_pds_em is null then
        insert into public.vehicle_events(chassi, tipo, oque, usuario_nome, origem) values (ex.chassi, 'confirmado_pds', 'Cadastro manual confirmado pela planilha PDS', 'Planilha PDS', 'pds');
      else
        select exists(select 1 from public.schedules where chassi = ex.chassi) into tem_agenda;
        if ex.etapa <> 'previsto' or tem_agenda then
          insert into public.vehicle_events(chassi, tipo, oque, usuario_nome, origem) values (ex.chassi, 'atualizado_pds', 'Atualizado pela planilha PDS', 'Planilha PDS', 'pds');
        end if;
      end if;
      upd := upd + 1;
    end if;
  end loop;
  return jsonb_build_object('inseridas', ins, 'atualizadas', upd, 'inalteradas', igu);
end $$;

-- p_rows: [{chassi, data_hora_entrega, cliente, vendedor, acessorios, entregador_sugerido, situacao_agenda, aba_origem, hash, resumo}]
create or replace function public.importar_agenda_lote(p_run bigint, p_rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb; ex public.schedules; tem_v boolean; ins int := 0; upd int := 0; igu int := 0; quando text;
begin
  if not public.is_gestor() then raise exception 'Sem permissão.'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    select exists(select 1 from public.vehicles where chassi = r->>'chassi') into tem_v;
    if not tem_v then
      insert into public.import_issues(run_id, fonte, chassi_bruto, tipo, detalhe) values (p_run, 'agenda', r->>'chassi', 'sem_correspondencia', coalesce(r->>'resumo','Está na agenda mas não existe na base PDS.'))
      on conflict do nothing;
    end if;
    select * into ex from public.schedules where chassi = r->>'chassi';
    if ex.id is not null and ex.origem_hash is not distinct from r->>'hash' then igu := igu + 1; continue; end if;
    insert into public.schedules(chassi, data_hora_entrega, cliente, vendedor, acessorios, entregador_sugerido, situacao_agenda, aba_origem, origem_hash, atualizado_em)
    values (r->>'chassi', nullif(r->>'data_hora_entrega','')::timestamptz, coalesce(r->>'cliente',''), coalesce(r->>'vendedor',''), coalesce(r->>'acessorios',''),
      coalesce(r->>'entregador_sugerido',''), coalesce(r->>'situacao_agenda',''), coalesce(r->>'aba_origem',''), r->>'hash', now())
    on conflict (chassi) do update set data_hora_entrega = excluded.data_hora_entrega, cliente = excluded.cliente, vendedor = excluded.vendedor, acessorios = excluded.acessorios,
      entregador_sugerido = excluded.entregador_sugerido, situacao_agenda = excluded.situacao_agenda, aba_origem = excluded.aba_origem, origem_hash = excluded.origem_hash, atualizado_em = now();
    if ex.id is null then ins := ins + 1; else upd := upd + 1; end if;
    if tem_v then
      quando := coalesce(to_char((nullif(r->>'data_hora_entrega','')::timestamptz) at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI'), 'sem data');
      insert into public.vehicle_events(chassi, tipo, oque, usuario_nome, origem)
      values (r->>'chassi', 'agenda', case when ex.id is null then 'Entrega agendada para ' || quando else 'Atualizado pela planilha Agenda (entrega ' || quando || ')' end, 'Agenda', 'agenda');
    end if;
  end loop;
  return jsonb_build_object('inseridas', ins, 'atualizadas', upd, 'inalteradas', igu);
end $$;

-- p_issues: [{chassi_bruto, tipo, detalhe}]
create or replace function public.importar_pendencias(p_run bigint, p_fonte text, p_issues jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_gestor() then raise exception 'Sem permissão.'; end if;
  insert into public.import_issues(run_id, fonte, chassi_bruto, tipo, detalhe)
  select p_run, p_fonte, x->>'chassi_bruto', (x->>'tipo')::issue_t, coalesce(x->>'detalhe','') from jsonb_array_elements(p_issues) x
  on conflict do nothing;
end $$;

-- p_vistos: todos os chassis lidos nesta carga PDS (para marcar "não encontrado na última carga"). null na agenda.
create or replace function public.importar_finalizar(p_run bigint, p_status text, p_stats jsonb, p_erro text default null, p_vistos text[] default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_gestor() then raise exception 'Sem permissão.'; end if;
  if p_vistos is not null and p_status = 'ok' then
    update public.vehicles set encontrado_ultima_carga = false
    where origem_cadastro = 'pds' and encontrado_ultima_carga and not (chassi = any(p_vistos));
  end if;
  update public.import_runs set status = p_status, erro = p_erro, finalizado_em = now(),
    lidas = coalesce((p_stats->>'lidas')::int,0), inseridas = coalesce((p_stats->>'inseridas')::int,0), atualizadas = coalesce((p_stats->>'atualizadas')::int,0),
    inalteradas = coalesce((p_stats->>'inalteradas')::int,0), rejeitadas = coalesce((p_stats->>'rejeitadas')::int,0)
  where id = p_run;
end $$;

grant execute on function public.importar_iniciar, public.importar_pds_lote, public.importar_agenda_lote, public.importar_pendencias, public.importar_finalizar to authenticated;
