-- Painel de Veículos — carga inicial dos 28 usuários (rode uma vez no SQL Editor; rodar de novo não duplica)
-- Senha provisória de todos: Trocar@123 (troca obrigatória no primeiro acesso)
do $$
declare r record; uid uuid; senha text := 'Trocar@123';
begin
  for r in select * from (values
    ('Clara Cristine Fonseca','claracf','usuario'),
    ('Ester dos Santos Tozetti','esterst','usuario'),
    ('Izabella Pauletti Correa','izabellapc','usuario'),
    ('Julia Oliveira Bitencourt','juliaob','usuario'),
    ('Maria Gabriella Mendes Pandolfi','mariagmp','usuario'),
    ('Moroni Miguel Pereira da Silva','moronimps','usuario'),
    ('Siria Maria Silva','siriams','usuario'),
    ('Aline Nunes Francisco','alinenf','usuario'),
    ('Ana Carolina Baptista Sampaio Lemos','anacbsl','usuario'),
    ('Andrea da Silva Barbosa Duarte','andreasbd','supervisora'),
    ('Andreia Sedano','andreias','usuario'),
    ('Caio Oliveira Bordoni','caioob','usuario'),
    ('Kellysson Figueiredo de Souza','kellyssonfs','usuario'),
    ('Macieli Jastrow Soares','macielijs','usuario'),
    ('Marina Muniz Santos','marinams','usuario'),
    ('Paulo Lucas dos Santos Silva','paulolss','usuario'),
    ('Rodrigo da Fonseca Poubel','rodrigofp','usuario'),
    ('Eduarda Cardoso Rodrigues de Oliveira','eduardacro','usuario'),
    ('Fernanda Rodrigues Martins','fernandarm','usuario'),
    ('Andrios Lima Moura','andrioslm','usuario'),
    ('Paulo Sergio Pessoa Brandao','paulospb','administrador'),
    ('Hilton Antonio Guedes Queiroz','hiltonagq','usuario'),
    ('Kaio Arcanjo de Araujo','kaioaa','usuario'),
    ('Yago Fragoso do Nascimento','yagofn','usuario'),
    ('Diogo Coura Belo','diogocb','usuario'),
    ('Lais da Silva Tardym Imperiano','laissti','usuario'),
    ('Miriam Nogueira Brandao','miriamnb','usuario'),
    ('Ramon Lyrio Martins','ramonlm','usuario')
  ) as t(nome, usuario, perfil) loop
    select id into uid from auth.users where email = r.usuario || '@painel-vmbyd.local';
    if uid is null then
      uid := gen_random_uuid();
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token)
      values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
        r.usuario || '@painel-vmbyd.local', crypt(senha, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('nome', r.nome), now(), now(),
        '', '', '', '');
      insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), uid::text, uid,
        jsonb_build_object('sub', uid::text, 'email', r.usuario || '@painel-vmbyd.local', 'email_verified', true),
        'email', now(), now(), now());
    end if;
    if not exists (select 1 from public.profiles where id = uid) then
      insert into public.profiles (id, nome_completo, usuario, cargo, perfil, ativo, deve_trocar_senha, criado_por)
      values (uid, r.nome, r.usuario, '', r.perfil::perfil_t, true, true, null);
      insert into public.user_audit_log (acao, alvo_id, executor_id) values ('criou', uid, null);
    end if;
  end loop;
end $$;

select usuario, nome_completo, perfil, ativo from public.profiles order by nome_completo;
