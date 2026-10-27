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
