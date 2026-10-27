-- Remove da base os veículos que não são BYD da loja (Toyota Yaris e marca Denza) e as pendências deles.
-- Só remove carros que ninguém mexeu ainda (etapa Previsto, sem agenda, sem cadastro manual).
delete from public.import_issues
where chassi_bruto in (select chassi from public.vehicles where modelo ~ '(^|\s)(DENZA|YARIS)(\s|$)');

delete from public.vehicles
where modelo ~ '(^|\s)(DENZA|YARIS)(\s|$)'
  and etapa = 'previsto' and origem_cadastro = 'pds'
  and not exists (select 1 from public.schedules s where s.chassi = vehicles.chassi);

select count(*) as restantes_denza_yaris from public.vehicles where modelo ~ '(^|\s)(DENZA|YARIS)(\s|$)';
