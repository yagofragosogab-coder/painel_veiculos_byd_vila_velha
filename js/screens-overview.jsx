/* Visão geral (§5.2) e Alertas (§5.5) */
function VisaoGeral({ mobile, go }) {
  const { AlertRow, StageStrip, Panel, DeliveryRow, BarList, WeekStat, SyncStatus, Skeleton, Button } = DSNS;
  const q = useQuery(() => ds.dashboard(), []);
  const D = q.data;
  const grupos = React.useMemo(() => {
    if (!D) return [];
    const by = (t) => D.alerts.filter((a) => a.tipo === t);
    const amanha = by('critico');
    const out = [];
    if (amanha.length) out.push({ sev: 'critico', n: amanha.length, txt: (amanha.length === 1 ? 'carro com entrega em até 48h ainda não chegou' : 'carros com entrega em até 48h ainda não chegaram') + ' na loja', f: 'critico' });
    const hoje = by('hoje_nao_pronto'); if (hoje.length) out.push({ sev: 'alto', n: hoje.length, txt: (hoje.length === 1 ? 'carro com entrega hoje ainda não está pronto' : 'carros com entrega hoje ainda não estão prontos'), f: 'hoje_nao_pronto' });
    const venc = by('previsao_vencida'); if (venc.length) out.push({ sev: 'alto', n: venc.length, txt: (venc.length === 1 ? 'carro passou da previsão e ainda não chegou' : 'carros passaram da previsão e ainda não chegaram'), f: 'previsao_vencida' });
    const par = by('parado'); if (par.length) out.push({ sev: 'medio', n: par.length, txt: (par.length === 1 ? 'carro parado' : 'carros parados') + ' há mais de 5 dias na mesma etapa', f: 'parado' });
    const sp = by('sem_pds'); if (sp.length) out.push({ sev: 'medio', n: sp.length, txt: (sp.length === 1 ? 'chassi da agenda não existe' : 'chassis da agenda não existem') + ' na base PDS', f: 'sem_pds' });
    return out;
  }, [D]);
  if (q.error) return <LoadError />;
  const col = mobile ? '1fr' : 'minmax(0,1.15fr) minmax(0,1fr)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 16 : 24 }}>
      <PageTitle mobile={mobile} sub={D ? <SyncStatus compact {...D.sync} /> : null}>Visão geral</PageTitle>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, font: 'var(--type-h3)' }}>Onde está cada carro no processo</h2>
        {D ? <StageStrip vertical={mobile} counts={D.counts} onSelect={(e) => go('lista', { etapa: e })} /> : <Skeleton height={mobile ? 340 : 132} radius={12} />}
      </section>
      <div style={{ display: 'grid', gridTemplateColumns: col, gap: mobile ? 16 : 24, alignItems: 'start' }}>
        <Panel title="Entregas de hoje e amanhã" icon="calendar-check" action={<Button size="sm" variant="ghost" iconRight="chevron-right" onClick={() => go('lista', { filtro: 'hoje' })}>Ver lista</Button>}>
          {!D ? <Skeleton height={180} /> : D.entregas.length ? <div>{D.entregas.map((v) => {
            const s = v.schedule; const hoje = s.data_hora_entrega.getDate() === ds.NOW.getDate();
            const sit = v.etapa === 'pronto' ? 'pronto' : v.etapa === 'preparacao' ? 'preparacao' : v.etapa === 'loja' ? 'loja' : v.etapa === 'entregue' ? 'entregue' : 'naochegou';
            return <DeliveryRow key={v.chassi} hora={ds.fmtHora(s.data_hora_entrega)} dia={hoje ? 'Hoje' : 'Amanhã'} modelo={v.modelo} cor={v.cor} cliente={s.cliente} situacao={sit} onClick={() => go('detalhe', { chassi: v.chassi })} />;
          })}</div> : <div style={{ color: 'var(--text-2)' }}>Nenhuma entrega hoje nem amanhã.</div>}
        </Panel>
        <Panel title="Onde estão os carros na loja" icon="map-pin">
          {!D ? <Skeleton height={240} /> : <BarList items={D.porLocal} onSelect={(it) => go('lista', { local: it.label })} />}
        </Panel>
      </div>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, font: 'var(--type-h3)' }}>Como foi a semana</h2>
        {!D ? <Skeleton height={130} radius={12} /> :
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, minmax(0,1fr))', gap: 12 }}>
            <WeekStat label="Carros recebidos na loja" value={D.semana.recebidos} previous={D.anterior.recebidos} onClick={() => go('lista', { etapa: 'loja' })} />
            <WeekStat label="Carros entregues" value={D.semana.entregues} previous={D.anterior.entregues} onClick={() => go('lista', { etapa: 'entregue' })} />
            <WeekStat label="Média de dias entre chegar e entregar" value={D.semana.media} previous={D.anterior.media} unit="dias" goodWhen="down" />
          </div>}
      </section>
    </div>
  );
}

function Alertas({ mobile, go, params }) {
  const { AlertRow, FilterChips, EmptyState } = DSNS;
  const q = useQuery(() => ds.alerts(), []);
  const [tipo, setTipo] = React.useState(params && params.tipo || null);
  if (q.error) return <LoadError />;
  const all = q.data || [];
  const sevOf = (a) => a.tipo === 'critico' ? 'critico' : a.sev === 1 ? 'alto' : 'medio';
  const TIPOS = [
    { id: 'critico', label: 'Entrega em até 48h', icon: 'siren' },
    { id: 'hoje_nao_pronto', label: 'Entrega hoje', icon: 'calendar-clock' },
    { id: 'previsao_vencida', label: 'Previsão vencida', icon: 'truck' },
    { id: 'parado', label: 'Parado há +5 dias', icon: 'clock-alert' },
    { id: 'sem_pds', label: 'Sem PDS', icon: 'file-question' }
  ].map((t) => Object.assign(t, { count: all.filter((a) => a.tipo === t.id).length })).filter((t) => t.count);
  const list = tipo ? all.filter((a) => a.tipo === tipo) : all;
  return (
    <div>
      <PageTitle mobile={mobile} sub="Do mais urgente ao menos urgente. Toque para abrir o carro.">Alertas</PageTitle>
      {q.loading ? <CardsSkeleton /> : !all.length ? <EmptyState tone="ok" icon="circle-check" title="Tudo em dia ✓">Nenhum carro precisa de atenção agora.</EmptyState> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FilterChips value={tipo} onChange={setTipo} options={TIPOS} />
          {list.map((a, i) => a.vehicle
            ? <AlertRow key={i} severity={sevOf(a)} onClick={() => go('detalhe', { chassi: a.vehicle.chassi })} detail={nomeCarro(a.vehicle) + ' · final ' + a.vehicle.chassi.slice(-8) + (a.vehicle.schedule ? ' · ' + a.vehicle.schedule.cliente : '')}>{a.frase}</AlertRow>
            : <AlertRow key={i} severity="medio" onClick={() => go('pendencias')} detail={'Chassi ' + a.issue.chassi_bruto + ' · ' + a.issue.detalhe}>{a.frase}</AlertRow>)}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { VisaoGeral, Alertas });
