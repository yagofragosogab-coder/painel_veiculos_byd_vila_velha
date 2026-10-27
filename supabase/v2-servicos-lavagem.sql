-- =====================================================================
-- Painel de Veículos — v2: etapa "Lavagem em andamento", bateria na chegada,
-- serviços terceirizados (insulfilme e emplacamento) e usuário Felipe.
-- PARTE A: rode SOZINHA primeiro (Run). Depois rode a PARTE B.
-- =====================================================================

-- ---------- PARTE A ----------
alter type etapa_t add value if not exists 'lavagem' after 'loja';

-- ---------- PARTE B ----------
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

notify pgrst, 'reload schema';
select 'ok' as resultado;
