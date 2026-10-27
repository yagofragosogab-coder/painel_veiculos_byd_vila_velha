function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function useIsMobile() {
  const q = '(max-width: 1023px)';
  const [m, setM] = React.useState(() => window.matchMedia(q).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const f = () => setM(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return m;
}
const {
  NAV_MOBILE,
  NAV_DESKTOP
} = DSNS;
function App() {
  const {
    AppHeader,
    BottomNav,
    Sidebar,
    Banner,
    Toast,
    SyncStatus,
    Icon,
    Spinner
  } = DSNS;
  const mobile = useIsMobile();
  const [boot, setBoot] = React.useState(true);
  const [user, setUser] = React.useState(null);
  const [nav, setNav] = React.useState({
    screen: 'buscar',
    params: {},
    stack: []
  });
  const [toastMsg, setToastMsg] = React.useState(null);
  const [hl, setHl] = React.useState({});
  const [offline, setOffline] = React.useState(!navigator.onLine);
  const [badges, setBadges] = React.useState({});
  const [retry, setRetry] = React.useState(0);
  const [sync, setSync] = React.useState(null);
  const scrollRef = React.useRef(null);
  const toastT = React.useRef(null);
  const toast = React.useCallback((m, tone) => {
    clearTimeout(toastT.current);
    setToastMsg({
      m,
      tone: tone || 'ok'
    });
    toastT.current = setTimeout(() => setToastMsg(null), 4500);
  }, []);
  const go = React.useCallback((screen, params, replace) => {
    setNav(n => {
      if (screen === 'back') {
        const st = n.stack.slice();
        const prev = st.pop() || {
          screen: user && user.perfil !== 'usuario' ? 'visao' : 'buscar',
          params: {}
        };
        return {
          screen: prev.screen,
          params: prev.params,
          stack: st
        };
      }
      const root = ['visao', 'buscar', 'lista', 'alertas', 'conta', 'pendencias', 'usuarios', 'logusuarios', 'cargas', 'agendamentos'].includes(screen) && !params;
      return {
        screen,
        params: params || {},
        stack: root ? [] : replace ? n.stack : n.stack.concat([{
          screen: n.screen,
          params: n.params
        }])
      };
    });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [user]);
  const refreshBadges = React.useCallback(() => {
    ds.issues.list().then(iss => setBadges(b => Object.assign({}, b, {
      pendencias: iss.filter(i => !i.resolvido).length
    }))).catch(() => {});
    ds.sync.status().then(setSync).catch(() => {});
  }, []);
  React.useEffect(() => {
    ds.auth.restore().then(u => {
      if (u) entrou(u);
      setBoot(false);
    }, () => setBoot(false));
    const t = setInterval(() => {
      if (ds.auth.current()) ds.sync.status().then(setSync).catch(() => {});
    }, 60000);
    return () => clearInterval(t);
  }, []);
  React.useEffect(() => ds.subscribe(e => {
    if (['vehicles', 'import_runs', 'import_issues', 'schedules', 'reconnect'].includes(e.table)) refreshBadges();
    if (e.remote && e.chassi) {
      setHl(h => Object.assign({}, h, {
        [e.chassi]: e.by
      }));
      setTimeout(() => setHl(h => {
        const o = Object.assign({}, h);
        delete o[e.chassi];
        return o;
      }), 9000);
    }
  }), []);
  React.useEffect(() => {
    const f = () => setRetry(r => r + 1);
    window.addEventListener('pv-retry', f);
    return () => window.removeEventListener('pv-retry', f);
  }, []);
  React.useEffect(() => {
    const on = () => {
      setOffline(false);
      toast('Conexão de volta. Tudo atualizado.');
      setRetry(r => r + 1);
    };
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  function entrou(u) {
    setUser(u);
    refreshBadges();
    setNav({
      screen: u.perfil === 'usuario' ? 'buscar' : 'visao',
      params: {},
      stack: []
    });
  }
  function logout() {
    ds.auth.signOut();
    setUser(null);
  }
  const shell = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--surface-page)',
    position: 'relative'
  };
  if (boot) return React.createElement("div", {
    style: Object.assign({}, shell, {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      color: 'var(--text-2)'
    })
  }, React.createElement(Spinner, {
    size: 28
  }), "Carregando\u2026");
  if (!user) return React.createElement("div", {
    style: Object.assign({}, shell, {
      overflow: 'auto'
    })
  }, React.createElement(Login, {
    mobile: mobile,
    onLogin: entrou
  }));
  if (user.deve_trocar_senha) return React.createElement("div", {
    style: Object.assign({}, shell, {
      overflow: 'auto'
    })
  }, React.createElement(TrocarSenha, {
    forced: true,
    mobile: mobile,
    user: user,
    onDone: () => {
      setUser(Object.assign({}, user, {
        deve_trocar_senha: false
      }));
      toast('Pronto! Sua senha foi criada.');
    }
  }));
  const gestor = user.perfil !== 'usuario';
  const P = {
    mobile,
    go,
    params: nav.params,
    user,
    toast,
    highlights: hl
  };
  const S = nav.screen;
  const screen = S === 'visao' ? React.createElement(VisaoGeral, P) : S === 'buscar' ? React.createElement(Buscar, P) : S === 'lista' ? React.createElement(Lista, _extends({
    key: JSON.stringify(nav.params)
  }, P)) : S === 'agendamentos' ? React.createElement(Lista, _extends({
    key: "agendamentos"
  }, P, {
    params: {
      etapa: 'agendamento'
    }
  })) : S === 'alertas_off' ? React.createElement(Alertas, _extends({
    key: JSON.stringify(nav.params)
  }, P)) : S === 'detalhe' ? React.createElement(Detalhe, _extends({
    key: nav.params.chassi
  }, P)) : S === 'cadastrar' ? React.createElement(Cadastrar, P) : S === 'conta' ? React.createElement(Conta, _extends({}, P, {
    onLogout: logout
  })) : S === 'pendencias' && gestor ? React.createElement(Pendencias, P) : S === 'usuarios' && gestor ? React.createElement(Usuarios, _extends({
    key: "u"
  }, P, {
    aba: "lista"
  })) : S === 'logusuarios' && gestor ? React.createElement(Usuarios, _extends({
    key: "l"
  }, P, {
    aba: "log"
  })) : S === 'cargas' && gestor ? React.createElement(Usuarios, _extends({
    key: "c"
  }, P, {
    aba: "cargas"
  })) : React.createElement(Buscar, P);
  const isDetail = S === 'detalhe' || S === 'cadastrar';
  const activeNav = isDetail ? nav.stack.length ? nav.stack[0].screen : 'buscar' : S === 'lista' && mobile ? 'visao' : S;
  const falhou = sync && (sync.pdsState === 'failed' || sync.agendaState === 'failed');
  const avisos = React.createElement(React.Fragment, null, offline ? React.createElement("div", {
    style: {
      padding: mobile ? '8px 12px 0' : '12px 32px 0'
    }
  }, React.createElement(Banner, {
    tone: "offline",
    title: "Sem internet"
  }, "Mostrando os \xFAltimos dados. Atualiza sozinho quando a conex\xE3o voltar.")) : null, falhou && gestor ? React.createElement("div", {
    style: {
      padding: mobile ? '8px 12px 0' : '12px 32px 0'
    }
  }, React.createElement(Banner, {
    tone: "danger",
    title: "A \xFAltima carga de planilha falhou",
    action: !mobile ? React.createElement("button", {
      onClick: () => go('cargas'),
      style: {
        minHeight: 40,
        padding: '0 12px',
        border: '1px solid currentColor',
        borderRadius: 8,
        background: 'transparent',
        color: 'inherit',
        font: 'var(--type-label)',
        cursor: 'pointer'
      }
    }, "Ver cargas") : null
  }, "Os dados de antes continuam valendo.")) : null);
  const toastEl = toastMsg ? React.createElement("div", {
    style: {
      position: 'fixed',
      left: 16,
      right: 16,
      bottom: mobile ? isDetail ? 100 : 88 : 24,
      display: 'flex',
      justifyContent: 'center',
      zIndex: 200,
      pointerEvents: 'none'
    }
  }, React.createElement("div", {
    style: {
      pointerEvents: 'auto'
    }
  }, React.createElement(Toast, {
    tone: toastMsg.tone,
    onClose: () => setToastMsg(null)
  }, toastMsg.m))) : null;
  if (mobile) {
    return React.createElement("div", {
      style: shell
    }, React.createElement(AppHeader, {
      mobile: true,
      back: isDetail ? 'Voltar' : null,
      onBack: () => go('back'),
      right: isDetail ? null : React.createElement("span", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--slate-200)',
          fontSize: 14,
          paddingRight: 8
        }
      }, React.createElement(Icon, {
        name: "circle-user-round",
        size: 20
      }), primeiroNome(user.nome_completo))
    }), avisos, React.createElement("main", {
      ref: scrollRef,
      key: retry,
      style: {
        flex: 1,
        overflow: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column'
      }
    }, screen), isDetail ? null : React.createElement(BottomNav, {
      active: activeNav,
      onChange: id => go(id),
      items: NAV_MOBILE.filter(i => i.id !== 'alertas')
    }), toastEl);
  }
  return React.createElement("div", {
    style: shell
  }, React.createElement(AppHeader, {
    right: React.createElement("span", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: 'var(--slate-200)'
      }
    }, React.createElement(Icon, {
      name: "circle-user-round",
      size: 22
    }), React.createElement("span", null, React.createElement("b", {
      style: {
        color: '#fff'
      }
    }, user.nome_completo), React.createElement("br", null), React.createElement("span", {
      style: {
        fontSize: 14
      }
    }, PERFIL_LABEL[user.perfil], user.cargo ? ' · ' + user.cargo : '')))
  }), React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: 'flex'
    }
  }, React.createElement(Sidebar, {
    items: NAV_DESKTOP.filter(i => i.id !== 'alertas').reduce((acc, i) => acc.concat(i.id === 'lista' ? [i, {
      id: 'agendamentos',
      label: 'Agendamentos',
      icon: 'clipboard-list'
    }] : [i]), []),
    active: activeNav,
    onChange: id => go(id),
    isAdmin: gestor,
    badges: badges,
    user: "Minha conta",
    footer: sync ? React.createElement("div", {
      style: {
        padding: '12px 14px 0',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 8
      }
    }, React.createElement(SyncStatus, _extends({
      compact: true
    }, sync))) : null
  }), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, avisos, React.createElement("main", {
    ref: scrollRef,
    key: retry,
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '28px 32px 48px'
    }
  }, React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max)',
      margin: '0 auto'
    }
  }, screen)))), toastEl);
}
function NaoConfigurado() {
  return React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 24
    }
  }, React.createElement("div", {
    style: {
      maxWidth: 560,
      background: '#fff',
      border: '1px solid var(--border-subtle)',
      borderRadius: 16,
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, React.createElement("h1", {
    style: {
      margin: 0,
      font: 'var(--type-h2)'
    }
  }, "Painel de Ve\xEDculos \u2014 falta conectar o banco"), React.createElement("p", {
    style: {
      margin: 0
    }
  }, "Abra ", React.createElement("b", {
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, "sistema/js/config.js"), " e preencha ", React.createElement("b", null, "SUPABASE_URL"), " e ", React.createElement("b", null, "SUPABASE_ANON_KEY"), " do seu projeto Supabase. O passo a passo est\xE1 em ", React.createElement("b", {
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, "sistema/LEIA-ME.md"), ".")));
}
const cfgOk = window.PAINEL_CONFIG && /^https:\/\//.test(window.PAINEL_CONFIG.SUPABASE_URL || '') && (window.PAINEL_CONFIG.SUPABASE_ANON_KEY || '').length > 20;
ReactDOM.createRoot(document.getElementById('root')).render(cfgOk ? React.createElement(App, null) : React.createElement(NaoConfigurado, null));