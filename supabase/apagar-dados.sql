-- Painel de Veículos — APAGAR todos os dados de carros, agenda, serviços e cargas (mantém usuários).
-- Rode no SQL Editor. Não tem volta.
begin;
alter table public.vehicle_events disable trigger vehicle_events_imutavel;
truncate table public.vehicle_events, public.import_issues, public.import_runs, public.schedules restart identity;
do $$ begin execute 'truncate table public.servicos restart identity'; exception when undefined_table then null; end $$;
delete from public.vehicles;
alter table public.vehicle_events enable trigger vehicle_events_imutavel;
commit;
select (select count(*) from public.vehicles) as carros, (select count(*) from public.schedules) as agenda, (select count(*) from public.profiles) as usuarios_mantidos;
