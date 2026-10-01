/* Detalhe do veículo (§5.6) */
const NEXT = {
  previsto: { label: 'Confirmar chegada', icon: 'map-pin-check', verb: 'confirmarChegada' },
  loja: { label: 'Começar preparação', icon: 'play', verb: 'comecarPreparacao' },
  preparacao: { label: 'Carro pronto', icon: 'circle-check', verb: 'carroPronto' },
  pronto: { label: 'Entregar ao cliente', icon: 'key-round', verb: 'entregar' }
};

function InfoGrid({ items, cols }) {
  return (
    <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', minmax(0,1fr))', gap: '12px 20px' }}>
      {items.map(([k, v]) => <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><dt style={{ color: 'var(--text-2)', fontSize: 'var(--fs-label)' }}>{k}</dt><dd style={{ margin: 0, fontWeight: 700 }}>{v || '—'}</dd></div>)}
    </dl>
  );
}

function Detalhe({ mobile, go, params, user, toast, highlights }) {
  const { Panel, StageBadge, Tag, ColorSwatch, ChassiText, StageTimeline, OptionList, Button, HistoryList, ControlFields, ActionBar, Dialog, Select, TextField, Banner, Icon, Skeleton } = DSNS;
  const chassi = params.chassi;
  const q = useQuery(() => ds.vehicles.get(chassi), [chassi]);
  const ev = useQuery(() => ds.vehicles.events(chassi), [chassi]);
  const users = useQuery(() => ds.users.list(), []);
  const [loc, setLoc] = React.useState(null);
  const [dlg, setDlg] = React.useState(null);
  const [prep, setPrep] = React.useState(user.id);
  const [entregador, setEntregador] = React.useState('');
  const [motivo, setMotivo] = React.useState('');
  const [err, setErr] = React.useState(null);
  const v = q.data;
  React.useEffect(() => { if (v) setLoc(v.status_localizacao); }, [v && v.status_localizacao]);
  if (q.error) return <LoadError />;
  if (q.loading || !v) return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><Skeleton height={40} width="60%" /><Skeleton height={100} radius={12} /><Skeleton height={240} radius={12} /></div>;
  const gestor = user.perfil !== 'usuario';
  const nx = NEXT[v.etapa];
  const hl = highlights && highlights[v.chassi];
  const nome = nomeCarro(v);
  function abrir() { setErr(null); if (v.etapa === 'pronto') setEntregador(v.schedule ? v.schedule.entregador_sugerido : ''); setDlg('next'); }
  function executar() {
    const fn = ds.vehicles[nx.verb];
    const p = nx.verb === 'comecarPreparacao' ? fn(v.chassi, prep) : nx.verb === 'entregar' ? fn(v.chassi, entregador) : fn(v.chassi);
    p.then((nv) => {
      setDlg(null);
      const msg = { loja: 'Chegada confirmada! O ' + nome + ' está no ' + nv.status_localizacao + '. Mude o local se precisar.', preparacao: 'Pronto! O ' + nome + ' agora está em preparação com ' + primeiroNome(nv.preparador_nome) + '.', pronto: 'Pronto! O ' + nome + ' está pronto para entrega.', entregue: 'Pronto! O ' + nome + ' foi entregue ao cliente.' };
      toast(msg[nv.etapa]);
    }, (e) => setErr(e.message));
  }
  function voltar() { ds.vehicles.voltarEtapa(v.chassi, motivo).then((nv) => { setDlg(null); setMotivo(''); toast('O ' + nome + ' voltou para “' + ds.ETAPA_LABEL[nv.etapa] + '”.'); }, (e) => setErr(e.message)); }
  function salvarLocal() { ds.vehicles.setLocalizacao(v.chassi, loc).then(() => toast('Pronto! O ' + nome + ' agora está em: ' + loc + '.'), (e) => toast(e.message, 'danger')); }
  const datas = {};
  (ev.data || []).slice().reverse().forEach((e) => { if (e.tipo === 'etapa' && e.valor_novo) datas[e.valor_novo] = ds.fmtDia(e.criado_em) + ' ' + ds.fmtHora(e.criado_em); });
  if (v.etapa === 'previsto' && v.previsao_chegada_loja) datas.previsto = 'prev. ' + ds.fmtDia(v.previsao_chegada_loja);
  const historico = (ev.data || []).map((e) => ({ oque: e.oque, quem: e.usuario_nome, cargo: e.usuario_cargo, quando: ds.fmt(e.criado_em), origem: e.origem, motivo: e.motivo }));
  const primary = nx ? <Button size="lg" fullWidth icon={nx.icon} onClick={abrir}>{nx.label}</Button> : null;
  const locMudou = loc && loc !== v.status_localizacao;

  const blocoOnde = (
    <Panel title="Onde está" icon="map-pin">
      {v.etapa === 'previsto' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8, background: 'var(--surface-sunken)' }}><Icon name="truck" size={22} color="var(--text-2)" /><div><b>{ds.LOC_HUB}</b><div style={{ color: 'var(--text-2)' }}>Você poderá escolher o local depois de confirmar a chegada.</div></div></div>
      ) : (
        <>
          <OptionList options={ds.LOCALIZACOES} value={loc} onChange={setLoc} />
          <Button icon="save" disabled={!locMudou} onClick={salvarLocal} fullWidth={mobile}>{locMudou ? 'Salvar novo local' : 'Salvar'}</Button>
        </>
      )}
      <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}><ControlFields localizacao={v.localizacao_label} nome={v.atualizado_por_nome} cargo={v.atualizado_por_cargo} em={ds.fmt(v.atualizado_em)} columns={mobile ? 1 : 2} /></div>
    </Panel>
  );
  const s = v.schedule;
  const blocoEntrega = (
    <Panel title="Entrega" icon="calendar-check">
      {s ? <InfoGrid cols={mobile ? 1 : 2} items={[['Cliente', s.cliente], ['Data e hora', s.data_hora_entrega ? ds.DIAS[s.data_hora_entrega.getDay()] + ' ' + ds.fmt(s.data_hora_entrega) : 'Sem data na agenda'], ['Vendedor', s.vendedor], ['Acessórios', s.acessorios]]} />
        : <div style={{ color: 'var(--text-2)' }}>Este carro ainda não está na agenda de entregas.</div>}
    </Panel>
  );
  const blocoQuem = (
    <Panel title="Com quem está" icon="user-round">
      <InfoGrid cols={mobile ? 1 : 2} items={[['Preparador', v.preparador_nome], ['Entregador', v.entregador_nome || (s ? s.entregador_sugerido + ' (da agenda)' : null)]]} />
    </Panel>
  );
  const blocoInfo = (
    <Panel title="Dados do carro" icon="car-front">
      <InfoGrid cols={2} items={[['Recebido no HUB em', ds.fmtData(v.recebido_hub_em)], ['Previsão de chegada na loja', v.flag_data_invalida ? 'Data inválida na origem' : ds.fmtData(v.previsao_chegada_loja)], ['Chegou na loja em', v.chegada_loja_em ? ds.fmt(v.chegada_loja_em) : null], ['Dias na loja', v.dias_na_loja != null ? String(v.dias_na_loja) : null]]} />
    </Panel>
  );
  const blocoHist = <Panel title="Histórico" icon="history">{ev.data ? <HistoryList items={historico} /> : <Skeleton height={120} />}</Panel>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: mobile && nx ? 0 : 0 }}>
      {!mobile ? <div><Button variant="ghost" icon="chevron-left" size="sm" onClick={() => go('back')}>Voltar</Button></div> : null}
      {hl ? <Banner tone="info" icon="radio" title={'Atualizado por ' + hl + ' agora'}>A tela já mostra a mudança.</Banner> : null}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <ColorSwatch cor={v.cor} size={mobile ? 22 : 26} />
          <h1 style={{ margin: 0, font: mobile ? 'var(--type-h2)' : 'var(--type-h1)' }}>{nome}{v.versao ? <span style={{ fontWeight: 400, color: 'var(--text-2)' }}> · {v.versao}</span> : null}</h1>
        </div>
        <ChassiText chassi={v.chassi} copy size="lg" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><StageBadge etapa={v.etapa} size="lg" />{v.tags.map((t, i) => <Tag key={i} {...t}>{t.label}</Tag>)}</div>
      </header>
      <Panel><StageTimeline etapa={v.etapa} datas={datas} /></Panel>
      {mobile ? (
        <>{blocoOnde}{blocoEntrega}{blocoQuem}{blocoInfo}{blocoHist}{gestor && v.etapa !== 'previsto' ? <Button variant="ghost" icon="undo-2" onClick={() => { setErr(null); setDlg('voltar'); }}>Voltar uma etapa</Button> : null}</>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{blocoOnde}{blocoHist}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {nx ? <Panel title="Próximo passo" icon="arrow-right-circle">{primary}{v.etapa === 'loja' ? null : null}</Panel> : <Panel title="Entregue" icon="key-round"><div style={{ color: 'var(--text-2)' }}>Este carro já foi entregue ao cliente.</div></Panel>}
            {gestor && v.etapa !== 'previsto' ? <Button variant="ghost" icon="undo-2" onClick={() => { setErr(null); setDlg('voltar'); }}>Voltar uma etapa</Button> : null}
            {blocoEntrega}{blocoQuem}{blocoInfo}
          </div>
        </div>
      )}
      {mobile && nx ? <div style={{ position: 'sticky', bottom: -16, zIndex: 9, margin: '0 -16px -16px' }}><ActionBar sticky={false} hint="Próximo passo">{primary}</ActionBar></div> : null}

      {dlg === 'next' ? (
        <Dialog mobile={mobile} icon={nx.icon} tone={v.etapa === 'pronto' ? 'ok' : 'neutral'} onClose={() => setDlg(null)}
          title={{ previsto: 'O ' + nome + ' chegou na loja?', loja: 'Começar a preparação do ' + nome + '?', preparacao: 'O ' + nome + ' está pronto?', pronto: 'Entregar o ' + nome + (s ? ' para ' + s.cliente : '') + '?' }[v.etapa]}
          actions={<><Button variant="secondary" onClick={() => setDlg(null)}>Cancelar</Button><Button variant={v.etapa === 'pronto' ? 'success' : 'primary'} icon="check" onClick={executar}>{{ previsto: 'Sim, chegou', loja: 'Começar', preparacao: 'Sim, está pronto', pronto: 'Sim, entregar' }[v.etapa]}</Button></>}>
          {v.etapa === 'previsto' ? <div>Vamos registrar que <b>{user.nome_completo}</b> confirmou a chegada agora. O carro vai para “Estacionamento da loja (sujo)”.</div> : null}
          {v.etapa === 'loja' ? <Select label="Quem vai preparar?" value={prep} onChange={setPrep} options={(users.data || []).filter((u) => u.ativo).map((u) => ({ value: u.id, label: u.nome_completo + (u.id === user.id ? ' (você)' : '') }))} /> : null}
          {v.etapa === 'preparacao' ? <div>Confira se a preparação e os acessórios ({s ? s.acessorios : 'nenhum na agenda'}) estão feitos.</div> : null}
          {v.etapa === 'pronto' ? <TextField label="Quem está entregando?" value={entregador} onChange={setEntregador} hint={s ? 'Veio da agenda. Mude se for outra pessoa.' : null} /> : null}
          <div style={{ color: 'var(--text-2)' }}>Depois disso, só a Supervisora ou o Administrador pode voltar a etapa.</div>
          {err ? <div style={{ color: 'var(--danger-fg)', fontWeight: 700 }}>{err}</div> : null}
        </Dialog>
      ) : null}
      {dlg === 'voltar' ? (
        <Dialog mobile={mobile} icon="undo-2" tone="danger" onClose={() => setDlg(null)} title={'Voltar o ' + nome + ' para “' + ds.ETAPA_LABEL[['previsto', 'loja', 'preparacao', 'pronto', 'entregue'][['previsto', 'loja', 'preparacao', 'pronto', 'entregue'].indexOf(v.etapa) - 1]] + '”?'}
          actions={<><Button variant="secondary" onClick={() => setDlg(null)}>Cancelar</Button><Button variant="danger" icon="undo-2" onClick={voltar}>Voltar etapa</Button></>}>
          <TextField label="Motivo" required value={motivo} onChange={setMotivo} placeholder="Ex.: cliente pediu para trocar a cor" error={err} />
        </Dialog>
      ) : null}
    </div>
  );
}

Object.assign(window, { Detalhe });
