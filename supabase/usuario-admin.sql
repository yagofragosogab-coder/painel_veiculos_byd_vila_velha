-- Usuário técnico "admin" (não é uma pessoa). Senha provisória Trocar@123, troca obrigatória no 1º acesso.
do $$
declare uid uuid;
begin
  select id into uid from auth.users where email = 'admin@painel-vmbyd.local';
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'admin@painel-vmbyd.local', crypt('Trocar@123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"nome":"Administrador do Sistema"}'::jsonb, now(), now(),
      '', '', '', '');
    insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid::text, uid,
      jsonb_build_object('sub', uid::text, 'email', 'admin@painel-vmbyd.local', 'email_verified', true),
      'email', now(), now(), now());
  end if;
  if not exists (select 1 from public.profiles where id = uid) then
    insert into public.profiles (id, nome_completo, usuario, cargo, perfil, ativo, deve_trocar_senha, criado_por)
    values (uid, 'Administrador do Sistema', 'admin', 'Conta técnica', 'administrador', true, true, null);
    insert into public.user_audit_log (acao, alvo_id, executor_id) values ('criou', uid, null);
  end if;
end $$;

select usuario, nome_completo, perfil, ativo from public.profiles where usuario = 'admin';
