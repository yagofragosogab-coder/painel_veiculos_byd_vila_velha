/* Serviços terceirizados (insulfilme e emplacamento) no detalhe do veículo */
const SERV_NOME = { insulfilme: 'Insulfilme', emplacamento: 'Emplacamento' };
const LIMPO = ['preparacao', 'pronto', 'entregue'];
const brl = (n) => n == null ? '—' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const mascaraCpf = (s) => { const d = String(s || '').replace(/\D/g, '').slice(0, 11); return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4'); };
const cpfOculto = (s) => { const d = String(s || '').replace(/\D/g, ''); return d.length === 11 ? '***.' + d.slice(3, 6) + '.***-' + d.slice(9) : (s ? '***' : '—'); };

function textoWhatsapp(v, x) {
  const L = ['Nome Cliente: ' + (x.cliente_nome || ''), 'CPF: ' + (x.cpf || ''), 'Modelo carro: ' + (v.modelo || '').toLowerCase(), 'Chassi: ' + v.chassi, 'Cor: ' + (v.cor || '').toLowerCase(), 'Qual serviço: ' + SERV_NOME[x.tipo].toLowerCase()];
  if (x.tipo === 'insulfilme') { L.push('Se tiver película: nano ou comum: ' + (x.pelicula || '')); L.push('Tonalidade: ' + (x.tonalidade || '')); }
  L.push('valor: ' + brl(x.valor)); L.push('Data de entrega: ' + ds.fmtDia(x.data_entrega)); if (x.proposta_path) L.push('Proposta: anexada no Painel de Veículos');
  return L.join('\n');
}

function ServicosBloco({ v, mobile, toast }) {
  const { Panel, Button, Tag, Dialog, TextField, Select, OptionList, Icon } = DSNS;
  const pode = ds.servicos.podeAgendar();
  const [dlg, setDlg] = React.useState(null);
  const [conf, setConf] = React.useState(null);
  const [f, setF] = React.useState({});
  const [err, setErr] = React.useState({});
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef(null);
  const set = (k, val) => setF(Object.assign({}, f, { [k]: val }));
  const nome = nomeCarro(v);
  function abrirNovo(tipo) { setErr({}); setF({ tipo: tipo || '', cliente: v.schedule ? v.schedule.cliente : '', cpf: '', pelicula: '', tonalidade: '', valor: '', data: '', arquivo: null }); setDlg('novo'); }
  function salvar() {
    setBusy(true); setErr({});
    ds.servicos.agendar(Object.assign({ chassi: v.chassi }, f)).then(() => { setBusy(false); setDlg(null); toast('Pronto! ' + SERV_NOME[f.tipo] + ' do ' + nome + ' agendado para ' + f.data.split('-').reverse().slice(0, 2).join('/') + '.'); },
      (e) => { setBusy(false); setErr({ [e.code === 'erro' ? 'geral' : e.code]: e.message }); });
  }
  function concluir(x) { ds.servicos.concluir(x.id).then(() => { setConf(null); toast('Pronto! ' + SERV_NOME[x.tipo] + ' do ' + nome + ' concluído. Todos já estão vendo.'); }, (e) => { setConf(null); toast(e.message, 'danger'); }); }
  function copiar(x) { const t = textoWhatsapp(v, x); try { navigator.clipboard.writeText(t); toast('Texto copiado. Cole no WhatsApp.'); } catch (e) { window.prompt('Copie o texto:', t); } }
  function abrirProposta(x) { ds.servicos.propostaUrl(x.proposta_path).then((u) => window.open(u, '_blank'), (e) => toast(e.message, 'danger')); }
  const lista = v.servicos || [];
  return (
    <Panel title="Serviços (insulfilme e emplacamento)" icon="clipboard-list" action={pode ? <Button size="sm" variant="secondary" icon="calendar-plus" onClick={() => abrirNovo('')}>Agendar serviço</Button> : null}>
      {(v.servicos_a_agendar || []).map((tp) => (
        <div key={'a-' + tp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: 14, borderRadius: 10, border: '1px solid var(--danger-border)', background: 'var(--danger-bg)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <b style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger-fg)' }}><Icon name="calendar-plus" size={20} />{SERV_NOME[tp]} a agendar</b>
            <span style={{ color: 'var(--text-1)' }}>Pedido na agenda de entrega{v.schedule && v.schedule.cliente ? ' · ' + v.schedule.cliente : ''}. Ainda sem data.</span>
          </div>
          {pode ? <Button size="sm" icon="calendar-plus" onClick={() => abrirNovo(tp)}>Agendar {SERV_NOME[tp].toLowerCase()}</Button> : <span style={{ color: 'var(--text-2)', fontWeight: 700 }}>Aguardando quem agenda</span>}
        </div>
      ))}
      {!lista.length && !(v.servicos_a_agendar || []).length ? <div style={{ color: 'var(--text-2)' }}>{pode ? 'Nenhum serviço agendado. Toque em “Agendar serviço”.' : 'Nenhum serviço agendado para este carro.'}</div> : null}
      {lista.map((x) => {
        const ok = x.status === 'concluido';
        const bloqueado = x.tipo === 'insulfilme' && !LIMPO.includes(v.etapa);
        return (
          <div key={x.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 10, border: '1px solid ' + (ok ? 'var(--ok-border)' : 'var(--warn-border)'), background: ok ? 'var(--ok-bg)' : 'var(--warn-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <b style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--type-h3)' }}><Icon name={x.tipo === 'insulfilme' ? 'sun-dim' : 'id-card'} size={20} />{SERV_NOME[x.tipo]}</b>
              <Tag tone={ok ? 'ok' : 'warn'} icon={ok ? 'circle-check' : 'clock'}>{ok ? 'Concluído' : 'Pendente · ' + ds.fmtDia(x.data_entrega)}</Tag>
            </div>
            <InfoGrid cols={mobile ? 2 : 3} items={[['Cliente', x.cliente_nome], ['CPF', pode ? x.cpf : cpfOculto(x.cpf)], [x.tipo === 'emplacamento' ? 'Emplacamento agendado para' : 'Insulfilme agendado para', ds.fmtData(x.data_entrega)]].concat(x.tipo === 'insulfilme' ? [['Película', x.pelicula === 'nano' ? 'Nano' : 'Comum'], ['Tonalidade', x.tonalidade]] : []).concat([['Valor', 'R$ ' + brl(x.valor)], ['Agendado por', x.criado_por_nome]]).concat(ok ? [['Concluído por', x.concluido_por_nome + ' · ' + ds.fmt(x.concluido_em)]] : [])} />
            {!ok && bloqueado ? <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--warn-fg)', fontWeight: 700 }}><Icon name="droplets" size={18} />Só pode aplicar com o carro limpo. Espere voltar da lavagem.</div> : null}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!ok ? <Button size="sm" variant="success" icon="check" disabled={bloqueado} onClick={() => setConf(x)}>Marcar como concluído</Button> : null}
              {x.proposta_path ? <Button size="sm" variant="secondary" icon="paperclip" onClick={() => abrirProposta(x)}>Ver proposta</Button> : null}
              {pode ? <Button size="sm" variant="ghost" icon="copy" onClick={() => copiar(x)}>Copiar para WhatsApp</Button> : null}
              {pode && !ok ? <Button size="sm" variant="ghost" icon="x" onClick={() => ds.servicos.cancelar(x.id).then(() => toast(SERV_NOME[x.tipo] + ' cancelado.'), (e) => toast(e.message, 'danger'))}>Cancelar</Button> : null}
            </div>
          </div>
        );
      })}

      {dlg === 'novo' ? (
        <Dialog mobile={mobile} icon="calendar-plus" title={'Agendar serviço · ' + nome} onClose={() => setDlg(null)}
          actions={<><Button variant="secondary" onClick={() => setDlg(null)}>Cancelar</Button><Button icon="check" loading={busy} disabled={!f.tipo} onClick={salvar}>Agendar</Button></>}>
          <OptionList value={f.tipo} onChange={(t) => set('tipo', t)} options={[{ value: 'insulfilme', label: 'Insulfilme', icon: 'sun-dim' }, { value: 'emplacamento', label: 'Emplacamento', icon: 'id-card' }]} />
          {f.tipo === 'insulfilme' && !LIMPO.includes(v.etapa) ? <div style={{ color: 'var(--warn-fg)', fontWeight: 700 }}>Atenção: o insulfilme só pode ser aplicado depois que o carro voltar limpo da lavagem.</div> : null}
          {f.tipo === 'emplacamento' ? <div style={{ color: 'var(--text-2)' }}>O emplacamento pode ser feito antes da lavagem.</div> : null}
          {f.tipo ? <>
            <TextField label="Nome do cliente" value={f.cliente} onChange={(t) => set('cliente', t)} />
            <TextField label="CPF" value={f.cpf} inputMode="numeric" onChange={(t) => set('cpf', mascaraCpf(t))} placeholder="000.000.000-00" />
            {f.tipo === 'insulfilme' ? <>
              <Select label="Película" required value={f.pelicula} onChange={(t) => set('pelicula', t)} options={[{ value: 'comum', label: 'Comum' }, { value: 'nano', label: 'Nano' }]} error={err.pelicula} />
              <TextField label="Tonalidade" value={f.tonalidade} onChange={(t) => set('tonalidade', t.toUpperCase())} placeholder="Ex.: G20" />
            </> : null}
            <TextField label="Valor (R$)" value={f.valor} inputMode="numeric" onChange={(t) => set('valor', t)} placeholder="500,00" />
            <TextField label={f.tipo === 'emplacamento' ? 'Data agendada do emplacamento' : 'Data agendada do insulfilme'} required type="date" value={f.data} onChange={(t) => set('data', t)} error={err.data} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ font: 'var(--type-label)' }}>Proposta (PDF ou foto)</span>
              <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={(e) => set('arquivo', e.target.files && e.target.files[0] || null)} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><Button size="sm" variant="secondary" icon="paperclip" onClick={() => fileRef.current.click()}>{f.arquivo ? 'Trocar arquivo' : 'Anexar proposta'}</Button>{f.arquivo ? <span style={{ color: 'var(--text-2)', wordBreak: 'break-all' }}>{f.arquivo.name}</span> : null}</div>
              {err.arquivo ? <div style={{ color: 'var(--danger-fg)' }}>{err.arquivo}</div> : null}
            </div>
          </> : null}
          {err.geral || err.tipo ? <div style={{ color: 'var(--danger-fg)', fontWeight: 700 }}>{err.geral || err.tipo}</div> : null}
        </Dialog>
      ) : null}
      {conf ? (
        <Dialog mobile={mobile} icon="check" tone="ok" title={SERV_NOME[conf.tipo] + ' do ' + nome + ' foi concluído?'} onClose={() => setConf(null)}
          actions={<><Button variant="secondary" onClick={() => setConf(null)}>Cancelar</Button><Button variant="success" icon="check" onClick={() => concluir(conf)}>Sim, concluído</Button></>}>
          Vamos registrar que <b>{ds.auth.current().nome_completo}</b> concluiu o serviço agora. Todos vão ver.
        </Dialog>
      ) : null}
    </Panel>
  );
}

Object.assign(window, { ServicosBloco });
