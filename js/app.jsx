/* Painel de Veículos — app real. Responsivo: celular (<1024px) ou computador. */
function useIsMobile() {
  const q = '(max-width: 1023px)';
  const [m, setM] = React.useState(() => window.matchMedia(q).matches);
  React.useEffect(() => { const mq = window.matchMedia(q); const f = () => setM(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, []);
  return m;
}

const { NAV_MOBILE, NAV_DESKTOP } = DSNS;
function App() {
  const { AppHeader, BottomNav, Sidebar, Banner, Toast, SyncStatus, Icon, Spinner } = DSNS;
  const mobile = useIsMobile();
  const [boot, setBoot] = React.useState(true);
  const [user, setUser] = React.useState(null);
  const [nav, setNav] = React.useState({ screen: 'buscar', params: {}, stack: [] });
  const [toastMsg, setToastMsg] = React.useState(null);
  const [hl, setHl] = React.useState({});
  const [offline, setOffline] = React.useState(!navigator.onLine);
  const [badges, setBadges] = React.useState({});
  const [retry, setRetry] = React.useState(0);
  const [sync, setSync] = React.useState(null);
  const scrollRef = React.useRef(null);
  const toastT = React.useRef(null);

  const toast = React.useCallback((m, tone) => { clearTimeout(toastT.current); setToastMsg({ m, tone: tone || 'ok' }); toastT.current = setTimeout(() => setToastMsg(null), 4500); }, []);
  const go = React.useCallback((screen, params, replace) => {
    setNav((n) => {
      if (screen === 'back') { const st = n.stack.slice(); const prev = st.pop() || { screen: user && user.perfil !== 'usuario' ? 'visao' : 'buscar', params: {} }; return { screen: prev.screen, params: prev.params, stack: st }; }
      const root = ['visao', 'buscar', 'lista', 'alertas', 'conta', 'pendencias', 'usuarios'].includes(screen) && !params;
      return { screen, params: params || {}, stack: root ? [] : replace ? n.stack : n.stack.concat([{ screen: n.screen, params: n.params }]) };
    });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [user]);

  const refreshBadges = React.useCallback(() => {
    ds.issues.list().then((iss) => setBadges((b) => Object.assign({}, b, { pendencias: iss.filter((i) => !i.resolvido).length }))).catch(() => {});
    ds.sync.status().then(setSync).catch(() => {});
  }, []);

  React.useEffect(() => {
    ds.auth.restore().then((u) => { if (u) entrou(u); setBoot(false); }, () => setBoot(false));
    const t = setInterval(() => { if (ds.auth.current()) ds.sync.status().then(setSync).catch(() => {}); }, 60000);
    return () => clearInterval(t);
  }, []);
  React.useEffect(() => ds.subscribe((e) => {
    if (['vehicles', 'import_runs', 'import_issues', 'schedules', 'reconnect'].includes(e.table)) refreshBadges();
    if (e.remote && e.chassi) { setHl((h) => Object.assign({}, h, { [e.chassi]: e.by })); setTimeout(() => setHl((h) => { const o = Object.assign({}, h); delete o[e.chassi]; return o; }), 9000); }
  }), []);
  React.useEffect(() => { const f = () => setRetry((r) => r + 1); window.addEventListener('pv-retry', f); return () => window.removeEventListener('pv-retry', f); }, []);
  React.useEffect(() => {
    const on = () => { setOffline(false); toast('Conexão de volta. Tudo atualizado.'); setRetry((r) => r + 1); };
    const off = () => setOffline(true);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  function entrou(u) { setUser(u); refreshBadges(); setNav({ screen: u.perfil === 'usuario' ? 'buscar' : 'visao', params: {}, stack: [] }); }
  function logout() { ds.auth.signOut(); setUser(null); }

  const shell = { height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface-page)', position: 'relative' };
  if (boot) return <div style={Object.assign({}, shell, { alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-2)' })}><Spinner size={28} />Carregando…</div>;
  if (!user) return <div style={Object.assign({}, shell, { overflow: 'auto' })}><Login mobile={mobile} onLogin={entrou} /></div>;
  if (user.deve_trocar_senha) return <div style={Object.assign({}, shell, { overflow: 'auto' })}><TrocarSenha forced mobile={mobile} user={user} onDone={() => { setUser(Object.assign({}, user, { deve_trocar_senha: false })); toast('Pronto! Sua senha foi criada.'); }} /></div>;

  const gestor = user.perfil !== 'usuario';
  const P = { mobile, go, params: nav.params, user, toast, highlights: hl };
  const S = nav.screen;
  const screen = S === 'visao' ? <VisaoGeral {...P} /> : S === 'buscar' ? <Buscar {...P} /> : S === 'lista' ? <Lista key={JSON.stringify(nav.params)} {...P} /> : S === 'alertas_off' ? <Alertas key={JSON.stringify(nav.params)} {...P} />
    : S === 'detalhe' ? <Detalhe key={nav.params.chassi} {...P} /> : S === 'cadastrar' ? <Cadastrar {...P} /> : S === 'conta' ? <Conta {...P} onLogout={logout} />
    : S === 'pendencias' && gestor ? <Pendencias {...P} /> : S === 'usuarios' && gestor ? <Usuarios {...P} /> : <Buscar {...P} />;
  const isDetail = S === 'detalhe' || S === 'cadastrar';
  const activeNav = isDetail ? (nav.stack.length ? nav.stack[0].screen : 'buscar') : S === 'lista' && mobile ? 'visao' : S;
  const falhou = sync && (sync.pdsState === 'failed' || sync.agendaState === 'failed');
  const avisos = <>
    {offline ? <div style={{ padding: mobile ? '8px 12px 0' : '12px 32px 0' }}><Banner tone="offline" title="Sem internet">Mostrando os últimos dados. Atualiza sozinho quando a conexão voltar.</Banner></div> : null}
    {falhou && gestor ? <div style={{ padding: mobile ? '8px 12px 0' : '12px 32px 0' }}><Banner tone="danger" title="A última carga de planilha falhou" action={!mobile ? <button onClick={() => go('usuarios')} style={{ minHeight: 40, padding: '0 12px', border: '1px solid currentColor', borderRadius: 8, background: 'transparent', color: 'inherit', font: 'var(--type-label)', cursor: 'pointer' }}>Ver cargas</button> : null}>Os dados de antes continuam valendo.</Banner></div> : null}
  </>;
  const toastEl = toastMsg ? <div style={{ position: 'fixed', left: 16, right: 16, bottom: mobile ? (isDetail ? 100 : 88) : 24, display: 'flex', justifyContent: 'center', zIndex: 200, pointerEvents: 'none' }}><div style={{ pointerEvents: 'auto' }}><Toast tone={toastMsg.tone} onClose={() => setToastMsg(null)}>{toastMsg.m}</Toast></div></div> : null;

  if (mobile) {
    return (
      <div style={shell}>
        <AppHeader mobile back={isDetail ? 'Voltar' : null} onBack={() => go('back')} right={isDetail ? null : <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--slate-200)', fontSize: 14, paddingRight: 8 }}><Icon name="circle-user-round" size={20} />{primeiroNome(user.nome_completo)}</span>} />
        {avisos}
        <main ref={scrollRef} key={retry} style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column' }}>{screen}</main>
        {isDetail ? null : <BottomNav active={activeNav} onChange={(id) => go(id)} items={NAV_MOBILE.filter((i) => i.id !== 'alertas')} />}
        {toastEl}
      </div>
    );
  }
  return (
    <div style={shell}>
      <AppHeader right={<span style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--slate-200)' }}><Icon name="circle-user-round" size={22} /><span><b style={{ color: '#fff' }}>{user.nome_completo}</b><br /><span style={{ fontSize: 14 }}>{PERFIL_LABEL[user.perfil]}{user.cargo ? ' · ' + user.cargo : ''}</span></span></span>} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Sidebar items={NAV_DESKTOP.filter((i) => i.id !== 'alertas')} active={activeNav} onChange={(id) => go(id)} isAdmin={gestor} badges={badges} user="Minha conta"
          footer={sync ? <div style={{ padding: '12px 14px 0', borderTop: '1px solid var(--border-subtle)', marginTop: 8 }}><SyncStatus compact {...sync} /></div> : null} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {avisos}
          <main ref={scrollRef} key={retry} style={{ flex: 1, overflow: 'auto', padding: '28px 32px 48px' }}><div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>{screen}</div></main>
        </div>
      </div>
      {toastEl}
    </div>
  );
}

function NaoConfigurado() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ maxWidth: 560, background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 style={{ margin: 0, font: 'var(--type-h2)' }}>Painel de Veículos — falta conectar o banco</h1>
        <p style={{ margin: 0 }}>Abra <b style={{ fontFamily: 'var(--font-mono)' }}>sistema/js/config.js</b> e preencha <b>SUPABASE_URL</b> e <b>SUPABASE_ANON_KEY</b> do seu projeto Supabase. O passo a passo está em <b style={{ fontFamily: 'var(--font-mono)' }}>sistema/LEIA-ME.md</b>.</p>
      </div>
    </div>
  );
}

const cfgOk = window.PAINEL_CONFIG && /^https:\/\//.test(window.PAINEL_CONFIG.SUPABASE_URL || '') && (window.PAINEL_CONFIG.SUPABASE_ANON_KEY || '').length > 20;
ReactDOM.createRoot(document.getElementById('root')).render(cfgOk ? <App /> : <NaoConfigurado />);
