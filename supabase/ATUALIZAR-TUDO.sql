-- =====================================================================
-- Painel de Veículos — ATUALIZAÇÃO COMPLETA (v2 parte B + v3 + v4)
-- ANTES: rode sozinha a linha abaixo (Parte A), em uma query separada:
--   alter type etapa_t add value if not exists 'lavagem' after 'loja';
-- DEPOIS: cole ESTE arquivo inteiro numa New query e clique em Run.
-- =====================================================================

-- ===== v2: lavagem, bateria, serviços, Felipe =====

alter table public.vehicles add column if not exists bateria_recebimento smallint check (bateria_recebimento between 0 and 100);
alter table public.profiles add column if not exists pode_agendar_servicos boolean not null default false;

create table if not exists public.servicos (
  id bigint generated always as identity primary key,
  chassi text not null references public.vehicles(chassi),
  tipo text not null check (tipo in ('insulfilme','emplacamento')),
  cliente_nome text not null default '',
  cpf text not null default '',
  pelicula text check (pelicula is null or pelicula in ('nano','comum')),
  tonalidade text not null default '',
  valor numeric(10,2),
  data_entrega date,
  proposta_path text,
  status text not null default 'pendente' check (status in ('pendente','concluido','cancelado')),
  criado_por uuid references public.profiles(id),
  criado_por_nome text not null default '',
  criado_em timestamptz not null default now(),
  concluido_por_nome text,
  concluido_em timestamptz
);
create index if not exists servicos_chassi_idx on public.servicos(chassi);
alter table public.servicos enable row level security;
drop policy if exists sv_sel on public.servicos; create policy sv_sel on public.servicos for select using (public.is_ativo());

create or replace function public.pode_agendar() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and ativo and (perfil in ('administrador','supervisora') or pode_agendar_servicos))
$$;

-- Recebimento: agora pede o percentual de bateria
drop function if exists public.confirmar_chegada(text);
create or replace function public.confirmar_chegada(p_chassi text, p_bateria int) returns void language plpgsql security definer set search_path = public as $$
declare v public.vehicles;
begin
  v := public._carro(p_chassi);
  if v.etapa <> 'previsto' then raise exception 'Esse carro já chegou na loja.'; end if;
  if p_bateria is null or p_bateria < 0 or p_bateria > 100 then raise exception 'Digite a bateria de 0 a 100%%.'; end if;
  update public.vehicles set etapa = 'loja', etapa_desde = now(), chegada_loja_em = now(), status_localizacao = 'Estacionamento da loja (sujo)', bateria_recebimento = p_bateria where chassi = v.chassi;
  perform public._evento(v.chassi, 'etapa', 'Confirmou a chegada na loja (bateria ' || p_bateria || '%)', 'etapa', 'previsto', 'loja');
end $$;

-- Na loja → Lavagem em andamento (transporte até o lava a jato)
create or replace function public.enviar_lavagem(p_chassi text) returns void language plpgsql security definer set search_path = public as $$
declare v public.vehicles;
begin
  v := public._carro(p_chassi);
  if v.etapa <> 'loja' then raise exception 'O carro precisa estar na loja para ir à lavagem.'; end if;
  update public.vehicles set etapa = 'lavagem', etapa_desde = now(), status_localizacao = 'Deixado para lavar no Shopping Praia da Costa' where chassi = v.chassi;
  perform public._evento(v.chassi, 'etapa', 'Levou o carro para a lavagem', 'etapa', 'loja', 'lavagem');
end $$;

-- Lavagem → Em preparação (carro voltou limpo para a loja)
create or replace function public.comecar_preparacao(p_chassi text, p_preparador uuid) returns void language plpgsql security definer set search_path = public as $$
declare v public.vehicles; p public.profiles;
begin
  v := public._carro(p_chassi);
  if v.etapa <> 'lavagem' then raise exception 'O carro precisa voltar da lavagem antes da preparação.'; end if;
  select * into p from public.profiles where id = coalesce(p_preparador, auth.uid()) and ativo;
  if p.id is null then raise exception 'Escolha um preparador ativo.'; end if;
  update public.vehicles set etapa = 'preparacao', etapa_desde = now(), preparador_id = p.id, status_localizacao = 'Estacionamento da loja (limpo e pronto para preparo)' where chassi = v.chassi;
  perform public._evento(v.chassi, 'etapa', 'Carro voltou limpo da lavagem e começou a preparação (preparador: ' || p.nome_completo || ')', 'etapa', 'lavagem', 'preparacao');
end $$;

create or replace function public.voltar_etapa(p_chassi text, p_motivo text) returns void language plpgsql security definer set search_path = public as $$
declare v public.vehicles; nova etapa_t; labels jsonb := '{"previsto":"Previsto","loja":"Na loja","lavagem":"Lavagem em andamento","preparacao":"Em preparação","pronto":"Pronto","entregue":"Entregue"}';
begin
  if not public.is_gestor() then raise exception 'Só a Supervisora ou o Administrador podem voltar uma etapa.'; end if;
  if length(trim(coalesce(p_motivo,''))) < 3 then raise exception 'Escreva o motivo em poucas palavras.'; end if;
  v := public._carro(p_chassi);
  nova := case v.etapa when 'loja' then 'previsto' when 'lavagem' then 'loja' when 'preparacao' then 'lavagem' when 'pronto' then 'preparacao' when 'entregue' then 'pronto' else null end;
  if nova is null then raise exception 'Esse carro já está na primeira etapa.'; end if;
  update public.vehicles set etapa = nova, etapa_desde = now(),
    status_localizacao = case when nova = 'previsto' then null else status_localizacao end,
    chegada_loja_em = case when nova = 'previsto' then null else chegada_loja_em end,
    preparador_id = case when nova in ('previsto','loja','lavagem') then null else preparador_id end,
    entregador_nome = case when v.etapa = 'entregue' then null else entregador_nome end
  where chassi = v.chassi;
  perform public._evento(v.chassi, 'etapa', 'Voltou de "' || (labels->>v.etapa::text) || '" para "' || (labels->>nova::text) || '"', 'etapa', v.etapa::text, nova::text, trim(p_motivo));
end $$;

-- Serviços terceirizados
create or replace function public.agendar_servico(p_chassi text, p_tipo text, p_cliente text, p_cpf text, p_pelicula text, p_tonalidade text, p_valor numeric, p_data date, p_proposta text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v public.vehicles; me public.profiles; sid bigint; rot text := case p_tipo when 'insulfilme' then 'Insulfilme' else 'Emplacamento' end;
begin
  if not public.pode_agendar() then raise exception 'Você não tem permissão para agendar serviços. Fale com o Administrador.'; end if;
  v := public._carro(p_chassi);
  select * into me from public.eu();
  if p_tipo not in ('insulfilme','emplacamento') then raise exception 'Escolha o serviço.'; end if;
  if p_data is null then raise exception 'Escolha a data do serviço.'; end if;
  if p_tipo = 'insulfilme' and coalesce(p_pelicula,'') not in ('nano','comum') then raise exception 'Escolha a película: nano ou comum.'; end if;
  insert into public.servicos(chassi, tipo, cliente_nome, cpf, pelicula, tonalidade, valor, data_entrega, proposta_path, criado_por, criado_por_nome)
  values (v.chassi, p_tipo, trim(coalesce(p_cliente,'')), trim(coalesce(p_cpf,'')), case when p_tipo = 'insulfilme' then p_pelicula end, trim(coalesce(p_tonalidade,'')), p_valor, p_data, nullif(p_proposta,''), me.id, me.nome_completo)
  returning id into sid;
  perform public._evento(v.chassi, 'servico', 'Agendou ' || lower(rot) || ' para ' || to_char(p_data, 'DD/MM'));
  return sid;
end $$;

create or replace function public.concluir_servico(p_id bigint) returns void language plpgsql security definer set search_path = public as $$
declare s public.servicos; v public.vehicles; me public.profiles;
begin
  select * into s from public.servicos where id = p_id for update;
  if s.id is null then raise exception 'Serviço não encontrado.'; end if;
  if s.status <> 'pendente' then raise exception 'Esse serviço já foi concluído ou cancelado.'; end if;
  v := public._carro(s.chassi);
  if s.tipo = 'insulfilme' and v.etapa not in ('preparacao','pronto','entregue') then
    raise exception 'O insulfilme só pode ser aplicado com o carro limpo. Espere o carro voltar da lavagem.';
  end if;
  select * into me from public.eu();
  update public.servicos set status = 'concluido', concluido_por_nome = me.nome_completo, concluido_em = now() where id = p_id;
  perform public._evento(s.chassi, 'servico', case s.tipo when 'insulfilme' then 'Insulfilme concluído' else 'Emplacamento concluído' end);
end $$;

create or replace function public.cancelar_servico(p_id bigint) returns void language plpgsql security definer set search_path = public as $$
declare s public.servicos;
begin
  if not public.pode_agendar() then raise exception 'Você não tem permissão para cancelar serviços.'; end if;
  select * into s from public.servicos where id = p_id;
  update public.servicos set status = 'cancelado' where id = p_id and status = 'pendente';
  perform public._evento(s.chassi, 'servico', case s.tipo when 'insulfilme' then 'Cancelou o insulfilme' else 'Cancelou o emplacamento' end);
end $$;

create or replace function public.set_pode_agendar(p_id uuid, p_valor boolean) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_gestor() then raise exception 'Só a Supervisora ou o Administrador mudam essa permissão.'; end if;
  update public.profiles set pode_agendar_servicos = p_valor where id = p_id;
end $$;

grant execute on function public.confirmar_chegada(text, int), public.enviar_lavagem, public.comecar_preparacao, public.voltar_etapa,
  public.agendar_servico, public.concluir_servico, public.cancelar_servico, public.set_pode_agendar, public.pode_agendar to authenticated;

do $$ begin alter publication supabase_realtime add table public.servicos; exception when others then null; end $$;

-- Propostas (anexos) — pasta privada no Storage
insert into storage.buckets(id, name, public) values ('propostas', 'propostas', false) on conflict (id) do nothing;
drop policy if exists propostas_ins on storage.objects;
create policy propostas_ins on storage.objects for insert to authenticated with check (bucket_id = 'propostas' and public.pode_agendar());
drop policy if exists propostas_sel on storage.objects;
create policy propostas_sel on storage.objects for select to authenticated using (bucket_id = 'propostas' and public.is_ativo());

-- Usuário Felipe (agenda emplacamento e insulfilme). Senha provisória Trocar@123.
do $$
declare uid uuid;
begin
  select id into uid from auth.users where email = 'felipe@painel-vmbyd.local';
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', 'felipe@painel-vmbyd.local', crypt('Trocar@123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"nome":"Felipe"}'::jsonb, now(), now(), '', '', '', '');
    insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid::text, uid, jsonb_build_object('sub', uid::text, 'email', 'felipe@painel-vmbyd.local', 'email_verified', true), 'email', now(), now(), now());
  end if;
  if not exists (select 1 from public.profiles where id = uid) then
    insert into public.profiles (id, nome_completo, usuario, cargo, perfil, ativo, deve_trocar_senha, pode_agendar_servicos)
    values (uid, 'Felipe', 'felipe', 'Emplacamento', 'usuario', true, true, true);
    insert into public.user_audit_log (acao, alvo_id, executor_id) values ('criou', uid, null);
  end if;
end $$;


-- ===== v3: Movimentação + colunas novas da HUB =====
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

-- ===== v4: permissões (administradores e temporários) =====
-- =====================================================================
-- Painel de Veículos — v4: permissões
-- • Todos os usuários ativos podem tudo no fluxo (etapas, voltar etapa, local, serviços).
-- • Só ADMINISTRADORES: enviar planilhas, pendências e gestão de usuários.
-- • Administradores: yagofn, paulospb, andreasbd (+ conta técnica admin).
-- • Administrador pode tornar outro usuário administrador, permanente ou até uma data.
-- =====================================================================
alter table public.profiles add column if not exists admin_ate timestamptz;

alter table public.user_audit_log drop constraint if exists user_audit_log_acao_check;
alter table public.user_audit_log add constraint user_audit_log_acao_check
  check (acao in ('criou','inativou','reativou','redefiniu a senha de','tornou administrador','removeu administrador de'));

-- Administrador "de verdade" = perfil administrador/supervisora e (sem prazo ou prazo ainda valendo)
create or replace function public.is_gestor() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and ativo
    and perfil in ('administrador','supervisora') and (admin_ate is null or admin_ate > now()))
$$;

-- Serviços: qualquer usuário ativo agenda
create or replace function public.pode_agendar() returns boolean language sql stable security definer set search_path = public as $$
  select public.is_ativo()
$$;

-- Voltar etapa: qualquer usuário ativo (com motivo, fica no histórico)
create or replace function public.voltar_etapa(p_chassi text, p_motivo text) returns void language plpgsql security definer set search_path = public as $$
declare v public.vehicles; nova etapa_t; labels jsonb := '{"previsto":"Previsto","loja":"Na loja","lavagem":"Lavagem em andamento","preparacao":"Em preparação","pronto":"Pronto","entregue":"Entregue"}';
begin
  if not public.is_ativo() then raise exception 'Seu acesso está desligado.'; end if;
  if length(trim(coalesce(p_motivo,''))) < 3 then raise exception 'Escreva o motivo em poucas palavras.'; end if;
  v := public._carro(p_chassi);
  nova := case v.etapa when 'loja' then 'previsto' when 'lavagem' then 'loja' when 'preparacao' then 'lavagem' when 'pronto' then 'preparacao' when 'entregue' then 'pronto' else null end;
  if nova is null then raise exception 'Esse carro já está na primeira etapa.'; end if;
  update public.vehicles set etapa = nova, etapa_desde = now(),
    status_localizacao = case when nova = 'previsto' then null else status_localizacao end,
    chegada_loja_em = case when nova = 'previsto' then null else chegada_loja_em end,
    preparador_id = case when nova in ('previsto','loja','lavagem') then null else preparador_id end,
    entregador_nome = case when v.etapa = 'entregue' then null else entregador_nome end
  where chassi = v.chassi;
  perform public._evento(v.chassi, 'etapa', 'Voltou de "' || (labels->>v.etapa::text) || '" para "' || (labels->>nova::text) || '"', 'etapa', v.etapa::text, nova::text, trim(p_motivo));
end $$;

-- Tornar / remover administrador (p_ate = null → permanente)
create or replace function public.set_admin(p_id uuid, p_on boolean, p_ate timestamptz default null) returns void language plpgsql security definer set search_path = public as $$
declare me public.profiles; alvo public.profiles;
begin
  if not public.is_gestor() then raise exception 'Só administradores podem mudar isso.'; end if;
  select * into me from public.eu();
  select * into alvo from public.profiles where id = p_id;
  if alvo.id is null then raise exception 'Usuário não encontrado.'; end if;
  if alvo.id = me.id and not p_on then raise exception 'Você não pode tirar o seu próprio acesso de administrador.'; end if;
  if p_on and p_ate is not null and p_ate <= now() then raise exception 'Escolha uma data no futuro.'; end if;
  if p_on then
    update public.profiles set perfil = case when perfil = 'supervisora' then 'supervisora' else 'administrador' end, admin_ate = p_ate where id = p_id;
    insert into public.user_audit_log(acao, alvo_id, executor_id) values ('tornou administrador', p_id, me.id);
  else
    update public.profiles set perfil = 'usuario', admin_ate = null where id = p_id;
    insert into public.user_audit_log(acao, alvo_id, executor_id) values ('removeu administrador de', p_id, me.id);
  end if;
end $$;
grant execute on function public.set_admin, public.voltar_etapa, public.pode_agendar, public.is_gestor to authenticated;

-- Administradores fixos
update public.profiles set perfil = 'administrador', admin_ate = null where usuario in ('yagofn','paulospb','admin');
update public.profiles set perfil = 'supervisora', admin_ate = null where usuario = 'andreasbd';
-- Todos os outros ficam como usuário comum
update public.profiles set perfil = 'usuario', admin_ate = null where usuario not in ('yagofn','paulospb','admin','andreasbd');

notify pgrst, 'reload schema';
select usuario, nome_completo, perfil, admin_ate from public.profiles where perfil <> 'usuario' order by usuario;
