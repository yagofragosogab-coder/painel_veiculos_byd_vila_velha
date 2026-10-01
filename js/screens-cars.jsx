/* Buscar (§5.3), Lista de carros (§5.4), Cadastrar veículo (§5.7) */
function cardProps(v, highlights) {
  return {
    modelo: v.modelo, versao: v.versao, cor: v.cor, chassi: v.chassi, etapa: v.etapa, localizacao: v.localizacao_label,
    comQuem: v.com_quem, entrega: v.etapa !== 'entregue' ? entregaTxt(v) : null, tags: v.tags, alerta: null,
    atualizadoPor: v.atualizado_por_nome, atualizadoCargo: v.atualizado_por_cargo, atualizadoEm: ds.fmt(v.atualizado_em),
    highlight: highlights && highlights[v.chassi] ? 'Atualizado por ' + primeiroNome(highlights[v.chassi]) + ' agora' : null
  };
}

function CameraSheet({ onClose, onRead, mobile }) {
  const { Dialog, Button } = DSNS;
  const [erro, setErro] = React.useState(null);
  React.useEffect(() => {
    if (!window.Html5Qrcode) { setErro('O leitor não carregou. Digite o chassi.'); return; }
    const leitor = new Html5Qrcode('pv-leitor', { formatsToSupport: [Html5QrcodeSupportedFormats.CODE_39, Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.DATA_MATRIX, Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
    let parou = false;
    leitor.start({ facingMode: 'environment' }, { fps: 10, qrbox: (w, h) => ({ width: Math.floor(w * 0.85), height: Math.floor(Math.min(h, w) * 0.35) }) }, (texto) => {
      const m = String(texto).toUpperCase().replace(/[^A-Z0-9]/g, '').match(/[A-HJ-NPR-Z0-9]{17}/);
      if (m && !parou) { parou = true; leitor.stop().catch(() => {}); onRead(m[0]); }
    }, () => {}).catch(() => setErro('Não conseguimos abrir a câmera. Permita o uso da câmera no navegador ou digite o chassi.'));
    return () => { parou = true; try { if (leitor.isScanning) leitor.stop().catch(() => {}); } catch (e) {} };
  }, []);
  return (
    <Dialog mobile={mobile} title="Ler o código de barras do chassi" icon="scan-barcode" onClose={onClose}
      actions={<Button variant="secondary" icon="keyboard" onClick={onClose}>Digitar o chassi</Button>}>
      <div id="pv-leitor" style={{ width: '100%', minHeight: 220, borderRadius: 12, overflow: 'hidden', background: 'var(--byd-preto)' }} />
      {erro ? <div style={{ color: 'var(--danger-fg)', fontWeight: 700 }}>{erro}</div> : <div>Aponte para a etiqueta da porta ou do para-brisa. A leitura é automática.</div>}
    </Dialog>
  );
}

function Buscar({ mobile, go, highlights }) {
  const { SearchField, Button, VehicleCard, EmptyState, Banner } = DSNS;
  const [q, setQ] = React.useState('');
  const [cam, setCam] = React.useState(false);
  const [res, setRes] = React.useState(null);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => ds.subscribe(() => setTick((t) => t + 1)), []);
  React.useEffect(() => { let a = true; if (q.trim().length < 3) { setRes(null); return; } ds.vehicles.search(q).then((r) => a && setRes(r)); return () => { a = false; }; }, [q, tick]);
  const pareceChassi = /^[A-Za-z0-9 ]{10,}$/.test(q.trim()) && /\d/.test(q);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageTitle mobile={mobile} right={<Button variant="secondary" icon="plus" onClick={() => go('cadastrar')}>Novo veículo</Button>}>Buscar carro</PageTitle>
      <SearchField value={q} onChange={setQ} onScan={() => setCam(true)} />
      {res === null ? <div style={{ color: 'var(--text-2)' }}>Digite o chassi completo ou os últimos 6 a 8 números. Também dá para buscar pelo nome do cliente ou pelo modelo.</div> : null}
      {res && res.length ? <div style={{ color: 'var(--text-2)' }}>{res.length === 1 ? '1 carro encontrado' : res.length + ' carros encontrados'}</div> : null}
      {res && res.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(2, minmax(0,1fr))', gap: 12 }}>
          {res.slice(0, 20).map((v) => <VehicleCard key={v.chassi} {...cardProps(v, highlights)} onClick={() => go('detalhe', { chassi: v.chassi })} />)}
        </div>
      ) : null}
      {res && !res.length ? (
        <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
          <EmptyState icon="search-x" title="Chassi não encontrado" action={<Button icon="plus" onClick={() => go('cadastrar', { chassi: pareceChassi ? q : '' })}>Cadastrar veículo</Button>}>Nada com “{q}”. Confira os números. Se o carro é novo e ainda não está na planilha, cadastre aqui.</EmptyState>
        </div>
      ) : null}
      {cam ? <CameraSheet mobile={mobile} onClose={() => setCam(false)} onRead={(c) => { setCam(false); setQ(c); }} /> : null}
    </div>
  );
}

const LISTA_FILTROS = [
  { id: 'previsto', label: 'Previsto', icon: 'calendar-clock' }, { id: 'loja', label: 'Na loja', icon: 'warehouse' },
  { id: 'preparacao', label: 'Em preparação', icon: 'wrench' }, { id: 'pronto', label: 'Pronto', icon: 'circle-check' },
  { id: 'entregue', label: 'Entregue (7 dias)', icon: 'key-round' }, { id: 'hoje', label: 'Entregas de hoje', icon: 'calendar-check' },
  { id: 'manual', label: 'Cadastro manual pendente', icon: 'pencil-line' }
];

function Lista({ mobile, go, params, highlights, toast }) {
  const { FilterChips, Select, Button, VehicleCard, EmptyState, StageBadge, ColorSwatch, Tag } = DSNS;
  const q = useQuery(() => ds.vehicles.listFlow(), []);
  const [f, setF] = React.useState(params && (params.etapa || params.filtro) || null);
  const [loc, setLoc] = React.useState(params && params.local || '');
  if (q.error) return <LoadError />;
  const all = q.data || [];
  const test = (v, id) => ['previsto', 'loja', 'preparacao', 'pronto', 'entregue'].includes(id) ? v.etapa === id
    : id === 'hoje' ? !!(v.schedule && v.schedule.data_hora_entrega && ds.fmtData(v.schedule.data_hora_entrega) === ds.fmtData(ds.NOW))
    : id === 'alerta' ? v.alerts.length > 0 : id === 'manual' ? v.manual_pendente : true;
  const opts = LISTA_FILTROS.map((o) => Object.assign({}, o, { count: all.filter((v) => test(v, o.id)).length }));
  const list = all.filter((v) => (!f || test(v, f)) && (!loc || v.status_localizacao === loc));
  function excel() {
    const rows = list.map((v) => ({ Chassi: v.chassi, Modelo: v.modelo, 'Versão': v.versao, Cor: v.cor, Etapa: ds.ETAPA_LABEL[v.etapa], 'Onde está': v.localizacao_label, 'Com quem está': v.com_quem || '', 'Previsão de chegada na loja': ds.fmt(v.previsao_chegada_loja), 'Entrega': v.schedule && v.schedule.data_hora_entrega ? ds.fmt(v.schedule.data_hora_entrega) : '', Cliente: v.schedule ? v.schedule.cliente : '', Vendedor: v.schedule ? v.schedule.vendedor : '', 'Acessórios': v.schedule ? v.schedule.acessorios : '', Selos: v.tags.map((t) => t.label).join('; '), Alertas: v.alerts.map((a) => a.frase).join('; '), 'Atualizado por – Nome': v.atualizado_por_nome, 'Atualizado por – Cargo': v.atualizado_por_cargo || '—', 'Atualizado em': ds.fmt(v.atualizado_em) }));
    if (window.XLSX) { const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Carros'); XLSX.writeFile(wb, 'painel-veiculos-' + ds.fmtData(ds.NOW).replace(/\//g, '-') + '.xlsx'); }
    toast('Pronto! Baixamos o Excel com ' + rows.length + (rows.length === 1 ? ' carro.' : ' carros.'));
  }
  const th = { textAlign: 'left', padding: '12px 14px', font: 'var(--type-label)', color: 'var(--text-2)', borderBottom: '1px solid var(--border-default)', whiteSpace: 'nowrap', background: 'var(--surface-sunken)' };
  const td = { padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'top' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageTitle mobile={mobile} sub={'Carros na loja, em preparação, prontos, agendados e entregues nos últimos 7 dias'} right={<Button variant="secondary" icon="download" onClick={excel} disabled={!list.length}>Baixar Excel</Button>}>Lista de carros</PageTitle>
      <FilterChips value={f} onChange={setF} options={opts} />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select value={loc} onChange={setLoc} placeholder="Onde está: todos os locais" options={ds.LOCALIZACOES} style={{ flex: mobile ? '1 1 100%' : '0 1 420px' }} />
        {loc || f ? <Button variant="ghost" icon="x" onClick={() => { setLoc(''); setF(null); }}>Limpar filtros</Button> : null}
        <span style={{ color: 'var(--text-2)', marginLeft: mobile ? 0 : 'auto' }}>{list.length === 1 ? '1 carro' : list.length + ' carros'}</span>
      </div>
      {q.loading ? <CardsSkeleton /> : !list.length ? (
        <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 12 }}><EmptyState icon="car-front" title="Nenhum carro aqui" action={<Button variant="secondary" icon="x" onClick={() => { setLoc(''); setF(null); }}>Ver todos</Button>}>Nenhum carro com esse filtro agora.</EmptyState></div>
      ) : mobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{list.map((v) => <VehicleCard key={v.chassi} {...cardProps(v, highlights)} onClick={() => go('detalhe', { chassi: v.chassi })} />)}</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--type-body)' }}>
            <thead><tr>{['Carro', 'Chassi', 'Situação', 'Onde está', 'Com quem está', 'Entrega', 'Atualizado por', 'Atualizado em'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{list.map((v) => {
              const hl = highlights && highlights[v.chassi];
              return (
                <tr key={v.chassi} onClick={() => go('detalhe', { chassi: v.chassi })} style={{ cursor: 'pointer', background: hl ? 'var(--surface-accent-soft)' : undefined, transition: 'background .4s' }}
                  onMouseEnter={(e) => { if (!hl) e.currentTarget.style.background = 'var(--slate-50)'; }} onMouseLeave={(e) => { if (!hl) e.currentTarget.style.background = ''; }}>
                  <td style={td}><div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}><ColorSwatch cor={v.cor} size={14} />{nomeCarro(v)}</div>{v.versao ? <div style={{ color: 'var(--text-2)' }}>{v.versao}</div> : null}
                    {hl ? <div style={{ color: 'var(--info-fg)', fontWeight: 700, fontSize: 14 }}>Atualizado por {primeiroNome(hl)} agora</div> : null}</td>
                  <td style={Object.assign({}, td, { font: 'var(--fw-regular) 15px/1.3 var(--font-mono)', color: 'var(--text-2)', whiteSpace: 'nowrap' })}>{v.chassi.slice(0, 9)}<b style={{ color: 'var(--text-1)' }}>{v.chassi.slice(9)}</b></td>
                  <td style={td}><div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}><StageBadge etapa={v.etapa} />{v.manual_pendente ? <Tag tone="warn" icon="pencil-line">Manual pendente</Tag> : null}</div></td>
                  <td style={Object.assign({}, td, { maxWidth: 220 })}>{v.localizacao_label}</td>
                  <td style={td}>{v.com_quem || '—'}</td>
                  <td style={Object.assign({}, td, { whiteSpace: 'nowrap' })}>{v.schedule && v.schedule.data_hora_entrega ? <><b>{ds.fmtDia(v.schedule.data_hora_entrega)} {ds.fmtHora(v.schedule.data_hora_entrega)}</b><div style={{ color: 'var(--text-2)' }}>{v.schedule.cliente}</div></> : '—'}</td>
                  <td style={td}>{v.atualizado_por_nome}<div style={{ color: 'var(--text-2)' }}>{v.atualizado_por_cargo || '—'}</div></td>
                  <td style={Object.assign({}, td, { whiteSpace: 'nowrap', color: 'var(--text-2)' })}>{ds.fmt(v.atualizado_em)}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Cadastrar({ mobile, go, params, toast }) {
  const { TextField, Select, Button, Panel, Banner } = DSNS;
  const [chassi, setChassi] = React.useState(params && params.chassi ? ds.normChassi(params.chassi) : '');
  const [modelo, setModelo] = React.useState(''); const [modeloOutro, setModeloOutro] = React.useState('');
  const [cor, setCor] = React.useState(''); const [corOutro, setCorOutro] = React.useState('');
  const [versao, setVersao] = React.useState(''); const [prev, setPrev] = React.useState('');
  const [err, setErr] = React.useState({}); const [busy, setBusy] = React.useState(false);
  const opts = useQuery(() => ds.vehicles.options(), []);
  const o = opts.data || { modelos: [], cores: [] };
  function salvar() {
    const e = {}; const ce = ds.validarChassi(chassi); if (ce) e.chassi = ce;
    const m = modelo === 'Outro' ? modeloOutro : modelo; const c = cor === 'Outro' ? corOutro : cor;
    if (!m) e.modelo = 'Escolha o modelo do carro.'; if (!c) e.cor = 'Escolha a cor do carro.';
    setErr(e); if (Object.keys(e).length) return;
    setBusy(true);
    ds.vehicles.create({ chassi, modelo: m, cor: c, versao, previsao: prev ? new Date(prev + 'T12:00') : null }).then((v) => {
      toast('Pronto! O ' + nomeCarro(v) + ' foi cadastrado e está como “Previsto”.'); go('detalhe', { chassi: v.chassi }, true);
    }, (er) => { setBusy(false); if (er.code === 'existe') { toast(er.message, 'info'); go('detalhe', { chassi: ds.normChassi(chassi) }, true); } else setErr({ [er.code]: er.message }); });
  }
  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageTitle mobile={mobile} sub="Use quando o carro ainda não apareceu na planilha PDS.">Cadastrar veículo</PageTitle>
      <Panel>
        <TextField label="Chassi" required mono value={chassi} onChange={(v) => setChassi(v.toUpperCase())} maxLength={20} error={err.chassi} hint={chassi ? ds.normChassi(chassi).length + ' de 17 caracteres' : '17 letras e números, sem I, O ou Q'} />
        <Select label="Modelo" required value={modelo} onChange={setModelo} options={o.modelos.concat(['Outro'])} error={err.modelo} />
        {modelo === 'Outro' ? <TextField label="Qual modelo?" required value={modeloOutro} onChange={setModeloOutro} /> : null}
        <Select label="Cor" required value={cor} onChange={setCor} options={o.cores.map((c) => ({ value: c, label: corTxt(c) })).concat([{ value: 'Outro', label: 'Outro' }])} error={err.cor} />
        {cor === 'Outro' ? <TextField label="Qual cor?" required value={corOutro} onChange={setCorOutro} /> : null}
        <TextField label="Versão (opcional)" value={versao} onChange={setVersao} placeholder="Ex.: GS" />
        <TextField label="Previsão de chegada na loja (opcional)" type="date" value={prev} onChange={setPrev} />
      </Panel>
      <div style={{ display: 'flex', gap: 8, flexDirection: mobile ? 'column-reverse' : 'row' }}>
        <Button variant="secondary" onClick={() => go('back')}>Cancelar</Button>
        <Button icon="plus" loading={busy} onClick={salvar} size={mobile ? 'lg' : 'md'} fullWidth={mobile}>Cadastrar veículo</Button>
      </div>
    </div>
  );
}

Object.assign(window, { Buscar, Lista, Cadastrar, cardProps });
