/* Login (§5.1), Minha conta (§5.10), Pendências (§5.8), Usuários (§5.9) */
function Login({ onLogin, mobile }) {
  const { TextField, Button, Banner } = DSNS;
  const [u, setU] = React.useState(''); const [p, setP] = React.useState('');
  const [err, setErr] = React.useState(null); const [busy, setBusy] = React.useState(false);
  function entrar(e) { e && e.preventDefault(); setBusy(true); setErr(null); ds.auth.signIn(u, p).then((r) => onLogin(r.user), (er) => { setBusy(false); setErr(er); }); }
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-page)' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: mobile ? 16 : 40 }}>
        <form onSubmit={entrar} style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 18, background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: mobile ? 24 : 36, boxShadow: 'var(--shadow-2)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h1 style={{ margin: 0, font: 'var(--type-h1)' }}>Painel de Veículos</h1>
            <div style={{ color: 'var(--text-2)' }}>Vitória Motors BYD · Vila Velha</div>
          </div>
          {err && err.code === 'inativo' ? <Banner tone="danger" title="Acesso desligado" icon="user-x">{err.message}</Banner> : null}
          {err && err.code === 'rede' ? <Banner tone="danger" title="Sem conexão com o sistema" icon="wifi-off">{err.message}</Banner> : null}
          <TextField label="Usuário" value={u} onChange={(v) => setU(v.toLowerCase().trim())} placeholder="Ex.: claracf" icon="user-round" autoFocus />
          <TextField label="Senha" type="password" value={p} onChange={setP} error={err && err.code === 'invalido' ? err.message : null} />
          <Button type="submit" size="lg" fullWidth icon="log-in" loading={busy}>Entrar</Button>
          <div style={{ color: 'var(--text-2)', fontSize: 'var(--fs-label)' }}>Esqueceu a senha? Fale com a Supervisora ou o Administrador.</div>
        </form>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 16px 24px' }}><img src="assets/lockup-gab-vmbyd.png" alt="Grupo Águia Branca Divisão Comércio | Vitória Motors BYD" style={{ width: mobile ? 260 : 360, maxWidth: '100%' }} /></div>
    </div>
  );
}

function TrocarSenha({ user, onDone, forced, mobile }) {
  const { TextField, Button, Panel, Banner } = DSNS;
  const [a, setA] = React.useState(''); const [n, setN] = React.useState(''); const [c, setC] = React.useState('');
  const [err, setErr] = React.useState({});
  function salvar() {
    if (n !== c) { setErr({ c: 'As duas senhas novas estão diferentes. Digite de novo.' }); return; }
    ds.auth.changePassword(a, n).then(() => onDone(), (e) => setErr(e.code === 'atual' ? { a: e.message } : { n: e.message }));
  }
  const form = (
    <Panel title={forced ? null : 'Trocar senha'} icon="key-round">
      {!forced ? <TextField label="Senha atual" type="password" value={a} onChange={setA} error={err.a} /> : null}
      <TextField label="Nova senha" type="password" value={n} onChange={setN} hint="Pelo menos 8 caracteres." error={err.n} />
      <TextField label="Repita a nova senha" type="password" value={c} onChange={setC} error={err.c} />
      <Button icon="check" onClick={salvar} fullWidth={mobile}>Salvar nova senha</Button>
    </Panel>
  );
  if (!forced) return form;
  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--surface-page)' }}>
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ margin: 0, font: 'var(--type-h2)' }}>Olá, {primeiroNome(user.nome_completo)}! Crie sua senha</h1>
        <Banner tone="info" icon="shield-check">Este é seu primeiro acesso. Troque a senha provisória por uma só sua.</Banner>
        {form}
      </div>
    </div>
  );
}

const PERFIL_LABEL = { administrador: 'Administrador', supervisora: 'Supervisora', usuario: 'Usuário padrão' };

function Conta({ mobile, user, go, onLogout, toast }) {
  const { Panel, Button, Icon } = DSNS;
  const gestor = user.perfil !== 'usuario';
  const Link = ({ icon, label, to }) => <button type="button" onClick={() => go(to)} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '0 4px', border: 0, borderBottom: '1px solid var(--border-subtle)', background: 'transparent', font: 'var(--type-body)', fontWeight: 700, color: 'var(--text-1)', cursor: 'pointer', textAlign: 'left' }}><Icon name={icon} size={22} color="var(--text-2)" /><span style={{ flex: 1 }}>{label}</span><Icon name="chevron-right" size={20} color="var(--text-2)" /></button>;
  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageTitle mobile={mobile}>Minha conta</PageTitle>
      <Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><b style={{ font: 'var(--type-h3)' }}>{user.nome_completo}</b><span style={{ color: 'var(--text-2)' }}>Usuário: <b style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{user.usuario}</b> · {PERFIL_LABEL[user.perfil]} · Cargo: {user.cargo || '—'}</span></div>
      </Panel>
      {mobile ? <Panel padding="4px 16px"><Link icon="list" label="Lista de carros" to="lista" />{gestor ? <><Link icon="file-warning" label="Pendências" to="pendencias" /><Link icon="users" label="Usuários" to="usuarios" /></> : null}</Panel> : null}
      <TrocarSenha user={user} mobile={mobile} onDone={() => toast('Pronto! Sua senha foi trocada.')} />
      <Button variant="secondary" icon="log-out" onClick={onLogout}>Sair</Button>
    </div>
  );
}

const ISSUE = { invalido: ['Chassi inválido', 'circle-x', 'danger'], duplicado: ['Chassi duplicado', 'copy', 'warn'], sem_correspondencia: ['Sem correspondência na PDS', 'file-question', 'warn'], data_invalida: ['Data inválida na origem', 'calendar-x', 'danger'] };

function Pendencias({ mobile, go, toast }) {
  const { Panel, Tag, Button, FilterChips, EmptyState, Dialog, TextField } = DSNS;
  const q = useQuery(() => ds.issues.list(), []);
  const [f, setF] = React.useState(null); const [vinc, setVinc] = React.useState(null); const [ch, setCh] = React.useState(''); const [err, setErr] = React.useState(null);
  const all = (q.data || []);
  const abertas = all.filter((i) => !i.resolvido);
  const opts = Object.keys(ISSUE).map((k) => ({ id: k, label: ISSUE[k][0], icon: ISSUE[k][1], count: abertas.filter((i) => i.tipo === k).length })).filter((o) => o.count);
  const list = (f ? all.filter((i) => i.tipo === f) : all).sort((a, b) => a.resolvido - b.resolvido);
  function vincular() {
    ds.vehicles.get(ch).then((v) => { if (!v) { setErr('Não achamos esse chassi no sistema. Confira ou cadastre o veículo.'); return; } ds.issues.resolve(vinc.id, ch).then(() => { setVinc(null); toast('Pronto! A agenda foi ligada ao ' + nomeCarro(v) + '.'); }); });
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageTitle mobile={mobile} sub="Linhas das planilhas que o sistema não conseguiu usar sozinho. Nada é descartado.">Pendências</PageTitle>
      {opts.length ? <FilterChips value={f} onChange={setF} options={opts} /> : null}
      {!abertas.length && !q.loading ? <EmptyState tone="ok" icon="circle-check" title="Nenhuma pendência aberta">As últimas cargas entraram sem problemas.</EmptyState> : null}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(2, minmax(0,1fr))', gap: 12 }}>
        {list.map((i) => {
          const t = ISSUE[i.tipo];
          return (
            <Panel key={i.id} style={{ opacity: i.resolvido ? .7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}><Tag tone={i.resolvido ? 'ok' : t[2]} icon={i.resolvido ? 'check' : t[1]}>{i.resolvido ? 'Resolvido' : t[0]}</Tag><span style={{ color: 'var(--text-2)', fontSize: 14 }}>{i.fonte === 'pds' ? 'Planilha PDS' : 'Agenda'}</span></div>
              <div style={{ font: 'var(--fw-medium) 17px/1.3 var(--font-mono)', letterSpacing: '.04em', wordBreak: 'break-all' }}>{i.chassi_bruto}</div>
              <div style={{ textWrap: 'pretty' }}>{i.detalhe}</div>
              {i.resolvido ? <div style={{ color: 'var(--text-2)', fontSize: 14 }}>Resolvido por {i.resolvido_por} em {ds.fmt(i.resolvido_em)}{i.vinculado ? ' · ligado a ' + i.vinculado : ''}</div> : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {i.tipo === 'sem_correspondencia' ? <><Button size="sm" icon="link" onClick={() => { setErr(null); setCh(''); setVinc(i); }}>Vincular a um veículo</Button><Button size="sm" variant="secondary" icon="plus" onClick={() => go('cadastrar', { chassi: i.chassi_bruto })}>Cadastrar veículo</Button></> : null}
                  {i.tipo === 'data_invalida' || i.tipo === 'duplicado' ? <Button size="sm" variant="secondary" icon="car-front" onClick={() => go('detalhe', { chassi: i.chassi_bruto })}>Abrir carro</Button> : null}
                  <Button size="sm" variant="ghost" icon="check" onClick={() => ds.issues.resolve(i.id).then(() => toast('Pendência marcada como resolvida.'))}>Marcar como resolvida</Button>
                </div>
              )}
            </Panel>
          );
        })}
      </div>
      {vinc ? <Dialog mobile={mobile} icon="link" title="Ligar esta entrega a qual carro?" onClose={() => setVinc(null)} actions={<><Button variant="secondary" onClick={() => setVinc(null)}>Cancelar</Button><Button icon="link" onClick={vincular}>Vincular</Button></>}>
        <div>Na agenda: <b style={{ fontFamily: 'var(--font-mono)' }}>{vinc.chassi_bruto}</b>. Digite o chassi certo do carro no sistema.</div>
        <TextField label="Chassi do carro" mono value={ch} onChange={setCh} error={err} />
      </Dialog> : null}
    </div>
  );
}

function Usuarios({ mobile, user, toast }) {
  const { TextField, Button, Switch, Panel, Dialog, Tag, Banner, Icon } = DSNS;
  const [tab, setTab] = React.useState('lista');
  const users = useQuery(() => ds.users.list(), []);
  const log = useQuery(() => ds.users.auditLog(), []);
  const runs = useQuery(() => ds.sync.runs(), []);
  const [busca, setBusca] = React.useState('');
  const [novo, setNovo] = React.useState(null);
  const [cargoDlg, setCargoDlg] = React.useState(null);
  const [reset, setReset] = React.useState(null);
  const tabs = [['lista', 'Usuários', 'users'], ['log', 'Log de usuários', 'scroll-text'], ['cargas', 'Cargas de planilha', 'file-spreadsheet']];
  const list = (users.data || []).filter((u) => !busca || (u.nome_completo + ' ' + u.usuario).toLowerCase().includes(busca.toLowerCase()));
  function criar() {
    ds.users.create(novo).then((p) => { setNovo(null); toast('Pronto! ' + p.nome_completo + ' já pode entrar com o usuário ' + p.usuario + '.'); }, (e) => setNovo(Object.assign({}, novo, { err: { [e.code]: e.message } })));
  }
  function toggle(u, on) { ds.users.setActive(u.id, on).then(() => toast(on ? 'Pronto! ' + u.usuario + ' pode entrar de novo.' : u.usuario + ' não consegue mais entrar. O nome continua no histórico.'), (e) => toast(e.message, 'danger')); }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageTitle mobile={mobile} right={tab === 'lista' ? <Button icon="user-plus" onClick={() => setNovo({ nome: '', cargo: '', senha: ds.SENHA_PROVISORIA, err: {} })}>Novo usuário</Button> : null}>Usuários</PageTitle>
      <div role="tablist" style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-default)', overflowX: 'auto' }}>
        {tabs.map(([id, l, ic]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, minHeight: 48, padding: '0 14px', border: 0, borderBottom: '3px solid ' + (tab === id ? 'var(--action-primary)' : 'transparent'), background: 'transparent', color: tab === id ? 'var(--text-accent)' : 'var(--text-2)', font: 'var(--fw-bold) 16px/1 var(--font-sans)', cursor: 'pointer' }}><Icon name={ic} size={18} />{l}</button>)}
      </div>
      {tab === 'lista' ? <>
        <TextField icon="search" value={busca} onChange={setBusca} placeholder="Buscar por nome ou usuário" />
        <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
          {list.map((u, i) => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'minmax(0,1.6fr) minmax(0,1fr) auto auto', alignItems: 'center', gap: mobile ? 8 : 16, padding: '12px 16px', borderTop: i ? '1px solid var(--border-subtle)' : 0, opacity: u.ativo ? 1 : .75 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{u.nome_completo}{u.perfil !== 'usuario' ? <Tag tone="info" icon="shield">{PERFIL_LABEL[u.perfil]}</Tag> : null}{!u.ativo ? <Tag tone="neutral" icon="user-x">Inativo</Tag> : null}</div>
                <div style={{ color: 'var(--text-2)' }}><span style={{ fontFamily: 'var(--font-mono)' }}>{u.usuario}</span>{u.deve_trocar_senha ? ' · ainda não trocou a senha' : ''}</div>
              </div>
              <button type="button" onClick={() => setCargoDlg({ u, cargo: u.cargo })} style={{ justifySelf: 'start', minWidth: 0, maxWidth: '100%', flexWrap: 'wrap', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 8px', border: 0, background: 'transparent', color: 'var(--text-1)', font: 'var(--type-body)', cursor: 'pointer' }}><span style={{ color: 'var(--text-2)' }}>Cargo:</span> {u.cargo || '—'} <Icon name="pencil" size={16} color="var(--text-accent)" /></button>
              <Button size="sm" variant="ghost" icon="key-round" onClick={() => setReset(u)}>Redefinir senha</Button>
              <Switch checked={u.ativo} onChange={(on) => toggle(u, on)} disabled={u.id === user.id} />
            </div>
          ))}
        </div>
      </> : null}
      {tab === 'log' ? <Panel>
        <div style={{ color: 'var(--text-2)' }}>Este log não pode ser editado nem apagado.</div>
        {(log.data || []).slice(0, 40).map((l) => <div key={l.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}><Icon name={{ criou: 'user-plus', inativou: 'user-x', reativou: 'user-check' }[l.acao] || 'key-round'} size={18} color="var(--text-2)" /><span style={{ fontFamily: 'var(--font-mono)', fontSize: 15 }}>{l.frase}</span></div>)}
      </Panel> : null}
      {tab === 'cargas' ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <EnviarPlanilha toast={toast} />
        {(runs.data || []).map((r) => (
          <Panel key={r.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <b style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name={r.fonte === 'pds' ? 'file-spreadsheet' : 'calendar-days'} size={20} />{r.fonte === 'pds' ? 'Base PDS (HUB Serra)' : 'Agenda de entrega'} · {ds.fmt(r.iniciado_em)}</b>
              <Tag tone={r.status === 'ok' ? 'ok' : r.status === 'rodando' ? 'info' : 'danger'} icon={r.status === 'ok' ? 'circle-check' : r.status === 'rodando' ? 'loader' : 'circle-x'}>{r.status === 'ok' ? 'Deu certo' : r.status === 'rodando' ? 'Carregando…' : 'Falhou'}</Tag>
            </div>
            {r.status !== 'falhou' ? <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', color: 'var(--text-2)' }}>{[['Linhas lidas', r.lidas], ['Novas', r.inseridas], ['Atualizadas', r.atualizadas], ['Sem mudança', r.inalteradas], ['Com problema', r.rejeitadas]].map(([k, n]) => <span key={k}>{k}: <b style={{ color: 'var(--text-1)' }}>{n.toLocaleString('pt-BR')}</b></span>)}</div>
              : <Banner tone="danger" title="A carga não entrou">{r.erro}. Os dados anteriores continuam valendo.</Banner>}
            <div style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 14, wordBreak: 'break-all' }}>{r.arquivo}</div>
          </Panel>
        ))}
      </div> : null}

      {novo ? <Dialog mobile={mobile} icon="user-plus" title="Novo usuário" onClose={() => setNovo(null)} actions={<><Button variant="secondary" onClick={() => setNovo(null)}>Cancelar</Button><Button icon="check" onClick={criar}>Cadastrar</Button></>}>
        <TextField label="Nome completo" required autoFocus value={novo.nome} onChange={(v) => setNovo(Object.assign({}, novo, { nome: v }))} error={novo.err.nome} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8, background: 'var(--surface-accent-soft)' }}><Icon name="at-sign" size={20} color="var(--text-accent)" /><div><div style={{ fontSize: 14, color: 'var(--text-2)' }}>O usuário vai ser</div><b style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--text-accent)' }}>{ds.users.preview(novo.nome) || '…'}</b></div></div>
        <TextField label="Cargo (opcional)" value={novo.cargo} onChange={(v) => setNovo(Object.assign({}, novo, { cargo: v }))} />
        <TextField label="Senha provisória" value={novo.senha} onChange={(v) => setNovo(Object.assign({}, novo, { senha: v }))} hint="A pessoa troca no primeiro acesso." error={novo.err.senha} />
      </Dialog> : null}
      {cargoDlg ? <Dialog mobile={mobile} icon="briefcase" title={'Cargo de ' + cargoDlg.u.nome_completo} onClose={() => setCargoDlg(null)} actions={<><Button variant="secondary" onClick={() => setCargoDlg(null)}>Cancelar</Button><Button icon="save" onClick={() => ds.users.setCargo(cargoDlg.u.id, cargoDlg.cargo).then(() => { setCargoDlg(null); toast('Cargo salvo.'); })}>Salvar</Button></>}>
        <TextField label="Cargo" value={cargoDlg.cargo} onChange={(v) => setCargoDlg(Object.assign({}, cargoDlg, { cargo: v }))} hint="Deixe vazio se não quiser mostrar. Aparece como “—”." />
      </Dialog> : null}
      {reset ? <Dialog mobile={mobile} icon="key-round" tone="danger" title={'Redefinir a senha de ' + reset.usuario + '?'} onClose={() => setReset(null)} actions={<><Button variant="secondary" onClick={() => setReset(null)}>Cancelar</Button><Button variant="danger" icon="key-round" onClick={() => ds.users.resetPassword(reset.id).then((s) => { setReset(null); toast('Senha provisória de ' + reset.usuario + ': ' + s + '. Ela vai precisar trocar ao entrar.'); })}>Redefinir</Button></>}>
        A senha atual deixa de funcionar na hora. Vamos gerar uma senha provisória para você passar à pessoa.
      </Dialog> : null}
    </div>
  );
}

function EnviarPlanilha({ toast }) {
  const { Panel, Button, Banner, Icon } = DSNS;
  const ref = React.useRef(null);
  const [prog, setProg] = React.useState(null);
  const [res, setRes] = React.useState(null);
  const [err, setErr] = React.useState(null);
  function escolher(e) {
    const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    setErr(null); setRes(null); setProg({ t: 'Começando…', p: 0 });
    ds.sync.enviarPlanilha(f, (t, p) => setProg({ t, p })).then((r) => { setProg(null); setRes(r); toast('Pronto! A planilha ' + (r.fonte === 'pds' ? 'PDS' : 'Agenda') + ' entrou no sistema.'); }, (e2) => { setProg(null); setErr(e2.message || String(e2)); });
  }
  return (
    <Panel title="Enviar planilha" icon="upload">
      <div style={{ color: 'var(--text-2)' }}>Escolha o arquivo .xlsx da <b style={{ color: 'var(--text-1)' }}>HUB SERRA</b> (base PDS) ou da <b style={{ color: 'var(--text-1)' }}>AGENDA DE ENTREGA</b>. O sistema reconhece qual é. Envie a PDS primeiro.</div>
      <input ref={ref} type="file" accept=".xlsx" onChange={escolher} style={{ display: 'none' }} />
      {prog ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}><Icon name="loader" size={18} />{prog.t}</div><div style={{ height: 10, borderRadius: 999, background: 'var(--surface-sunken)', overflow: 'hidden' }}><div style={{ height: '100%', width: Math.round(prog.p * 100) + '%', background: 'var(--action-primary)', transition: 'width .3s' }}></div></div><div style={{ color: 'var(--text-2)', fontSize: 14 }}>Não feche esta tela até terminar.</div></div>
        : <Button icon="upload" onClick={() => ref.current.click()}>Escolher planilha</Button>}
      {res ? <Banner tone="ok" title={(res.fonte === 'pds' ? 'Base PDS' : 'Agenda') + ' carregada'}>Lidas {res.lidas.toLocaleString('pt-BR')} · novas {res.inseridas.toLocaleString('pt-BR')} · atualizadas {res.atualizadas.toLocaleString('pt-BR')} · sem mudança {res.inalteradas.toLocaleString('pt-BR')} · {res.pendencias} pendências.</Banner> : null}
      {err ? <Banner tone="danger" title="A planilha não entrou">{err} Os dados de antes continuam valendo.</Banner> : null}
    </Panel>
  );
}

Object.assign(window, { Login, TrocarSenha, Conta, Pendencias, Usuarios });
