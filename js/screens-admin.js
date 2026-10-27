function Login({
  onLogin,
  mobile
}) {
  const {
    TextField,
    Button,
    Banner
  } = DSNS;
  const [u, setU] = React.useState('');
  const [p, setP] = React.useState('');
  const [err, setErr] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  function entrar(e) {
    e && e.preventDefault();
    setBusy(true);
    setErr(null);
    ds.auth.signIn(u, p).then(r => onLogin(r.user), er => {
      setBusy(false);
      setErr(er);
    });
  }
  return React.createElement("div", {
    style: {
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-page)'
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: mobile ? 16 : 40
    }
  }, React.createElement("form", {
    onSubmit: entrar,
    style: {
      width: '100%',
      maxWidth: 420,
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      background: '#fff',
      border: '1px solid var(--border-subtle)',
      borderRadius: 16,
      padding: mobile ? 24 : 36,
      boxShadow: 'var(--shadow-2)'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 4
    }
  }, React.createElement("h1", {
    style: {
      margin: 0,
      font: 'var(--type-h1)',
      color: 'var(--text-title)'
    }
  }, "Painel de Ve\xEDculos"), React.createElement("div", {
    style: {
      color: 'var(--text-2)'
    }
  }, "Vit\xF3ria Motors BYD \xB7 Vila Velha")), err && err.code === 'inativo' ? React.createElement(Banner, {
    tone: "danger",
    title: "Acesso desligado",
    icon: "user-x"
  }, err.message) : null, err && err.code === 'rede' ? React.createElement(Banner, {
    tone: "danger",
    title: "Sem conex\xE3o com o sistema",
    icon: "wifi-off"
  }, err.message) : null, React.createElement(TextField, {
    label: "Usu\xE1rio",
    value: u,
    onChange: v => setU(v.toLowerCase().trim()),
    placeholder: "Ex.: claracf",
    icon: "user-round",
    autoFocus: true
  }), React.createElement(TextField, {
    label: "Senha",
    type: "password",
    value: p,
    onChange: setP,
    error: err && err.code === 'invalido' ? err.message : null
  }), React.createElement(Button, {
    type: "submit",
    size: "lg",
    fullWidth: true,
    icon: "log-in",
    loading: busy
  }, "Entrar"), React.createElement("div", {
    style: {
      color: 'var(--text-2)',
      fontSize: 'var(--fs-label)'
    }
  }, "Esqueceu a senha? Fale com a Supervisora ou o Administrador."))), React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      padding: '8px 16px 24px'
    }
  }, React.createElement("img", {
    src: "assets/lockup-gab-vmbyd.png",
    alt: "Grupo \xC1guia Branca Divis\xE3o Com\xE9rcio | Vit\xF3ria Motors BYD",
    style: {
      width: mobile ? 260 : 360,
      maxWidth: '100%'
    }
  })));
}
function TrocarSenha({
  user,
  onDone,
  forced,
  mobile
}) {
  const {
    TextField,
    Button,
    Panel,
    Banner
  } = DSNS;
  const [a, setA] = React.useState('');
  const [n, setN] = React.useState('');
  const [c, setC] = React.useState('');
  const [err, setErr] = React.useState({});
  function salvar() {
    if (n !== c) {
      setErr({
        c: 'As duas senhas novas estão diferentes. Digite de novo.'
      });
      return;
    }
    ds.auth.changePassword(a, n).then(() => onDone(), e => setErr(e.code === 'atual' ? {
      a: e.message
    } : {
      n: e.message
    }));
  }
  const form = React.createElement(Panel, {
    title: forced ? null : 'Trocar senha',
    icon: "key-round"
  }, !forced ? React.createElement(TextField, {
    label: "Senha atual",
    type: "password",
    value: a,
    onChange: setA,
    error: err.a
  }) : null, React.createElement(TextField, {
    label: "Nova senha",
    type: "password",
    value: n,
    onChange: setN,
    hint: "Pelo menos 8 caracteres.",
    error: err.n
  }), React.createElement(TextField, {
    label: "Repita a nova senha",
    type: "password",
    value: c,
    onChange: setC,
    error: err.c
  }), React.createElement(Button, {
    icon: "check",
    onClick: salvar,
    fullWidth: mobile
  }, "Salvar nova senha"));
  if (!forced) return form;
  return React.createElement("div", {
    style: {
      minHeight: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      background: 'var(--surface-page)'
    }
  }, React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 440,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, React.createElement("h1", {
    style: {
      margin: 0,
      font: 'var(--type-h2)'
    }
  }, "Ol\xE1, ", primeiroNome(user.nome_completo), "! Crie sua senha"), React.createElement(Banner, {
    tone: "info",
    icon: "shield-check"
  }, "Este \xE9 seu primeiro acesso. Troque a senha provis\xF3ria por uma s\xF3 sua."), form));
}
const PERFIL_LABEL = {
  administrador: 'Administrador',
  supervisora: 'Supervisora',
  usuario: 'Usuário padrão'
};
function Conta({
  mobile,
  user,
  go,
  onLogout,
  toast
}) {
  const {
    Panel,
    Button,
    Icon
  } = DSNS;
  const gestor = user.perfil !== 'usuario';
  const Link = ({
    icon,
    label,
    to
  }) => React.createElement("button", {
    type: "button",
    onClick: () => go(to),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minHeight: 56,
      padding: '0 4px',
      border: 0,
      borderBottom: '1px solid var(--border-subtle)',
      background: 'transparent',
      font: 'var(--type-body)',
      fontWeight: 700,
      color: 'var(--text-1)',
      cursor: 'pointer',
      textAlign: 'left'
    }
  }, React.createElement(Icon, {
    name: icon,
    size: 22,
    color: "var(--text-2)"
  }), React.createElement("span", {
    style: {
      flex: 1
    }
  }, label), React.createElement(Icon, {
    name: "chevron-right",
    size: 20,
    color: "var(--text-2)"
  }));
  return React.createElement("div", {
    style: {
      maxWidth: 640,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, React.createElement(PageTitle, {
    mobile: mobile
  }, "Minha conta"), React.createElement(Panel, null, React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, React.createElement("b", {
    style: {
      font: 'var(--type-h3)'
    }
  }, user.nome_completo), React.createElement("span", {
    style: {
      color: 'var(--text-2)'
    }
  }, "Usu\xE1rio: ", React.createElement("b", {
    style: {
      color: 'var(--text-1)',
      fontFamily: 'var(--font-mono)'
    }
  }, user.usuario), " \xB7 ", PERFIL_LABEL[user.perfil], " \xB7 Cargo: ", user.cargo || '—'))), mobile ? React.createElement(Panel, {
    padding: "4px 16px"
  }, React.createElement(Link, {
    icon: "list",
    label: "Lista de carros",
    to: "lista"
  }), gestor ? React.createElement(React.Fragment, null, React.createElement(Link, {
    icon: "file-warning",
    label: "Pend\xEAncias",
    to: "pendencias"
  }), React.createElement(Link, {
    icon: "file-spreadsheet",
    label: "Cargas de planilha",
    to: "cargas"
  }), React.createElement(Link, {
    icon: "scroll-text",
    label: "Log de usu\xE1rios",
    to: "logusuarios"
  }), React.createElement(Link, {
    icon: "users",
    label: "Usu\xE1rios",
    to: "usuarios"
  })) : null) : null, React.createElement(TrocarSenha, {
    user: user,
    mobile: mobile,
    onDone: () => toast('Pronto! Sua senha foi trocada.')
  }), React.createElement(Button, {
    variant: "secondary",
    icon: "log-out",
    onClick: onLogout
  }, "Sair"));
}
const ISSUE = {
  invalido: ['Chassi inválido', 'circle-x', 'danger'],
  duplicado: ['Chassi duplicado', 'copy', 'warn'],
  sem_correspondencia: ['Sem correspondência na PDS', 'file-question', 'warn'],
  data_invalida: ['Data inválida na origem', 'calendar-x', 'danger']
};
function Pendencias({
  mobile,
  go,
  toast
}) {
  const {
    Panel,
    Tag,
    Button,
    FilterChips,
    EmptyState,
    Dialog,
    TextField
  } = DSNS;
  const q = useQuery(() => ds.issues.list(), []);
  const [f, setF] = React.useState(null);
  const [vinc, setVinc] = React.useState(null);
  const [ch, setCh] = React.useState('');
  const [err, setErr] = React.useState(null);
  const all = q.data || [];
  const abertas = all.filter(i => !i.resolvido);
  const opts = Object.keys(ISSUE).map(k => ({
    id: k,
    label: ISSUE[k][0],
    icon: ISSUE[k][1],
    count: abertas.filter(i => i.tipo === k).length
  })).filter(o => o.count);
  const list = (f ? all.filter(i => i.tipo === f) : all).sort((a, b) => a.resolvido - b.resolvido);
  function vincular() {
    ds.vehicles.get(ch).then(v => {
      if (!v) {
        setErr('Não achamos esse chassi no sistema. Confira ou cadastre o veículo.');
        return;
      }
      ds.issues.resolve(vinc.id, ch).then(() => {
        setVinc(null);
        toast('Pronto! A agenda foi ligada ao ' + nomeCarro(v) + '.');
      });
    });
  }
  return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, React.createElement(PageTitle, {
    mobile: mobile,
    sub: "Linhas das planilhas que o sistema n\xE3o conseguiu usar sozinho. Nada \xE9 descartado."
  }, "Pend\xEAncias"), opts.length ? React.createElement(FilterChips, {
    value: f,
    onChange: setF,
    options: opts
  }) : null, !abertas.length && !q.loading ? React.createElement(EmptyState, {
    tone: "ok",
    icon: "circle-check",
    title: "Nenhuma pend\xEAncia aberta"
  }, "As \xFAltimas cargas entraram sem problemas.") : null, React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'repeat(2, minmax(0,1fr))',
      gap: 12
    }
  }, list.map(i => {
    const t = ISSUE[i.tipo];
    return React.createElement(Panel, {
      key: i.id,
      style: {
        opacity: i.resolvido ? .7 : 1
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        flexWrap: 'wrap'
      }
    }, React.createElement(Tag, {
      tone: i.resolvido ? 'ok' : t[2],
      icon: i.resolvido ? 'check' : t[1]
    }, i.resolvido ? 'Resolvido' : t[0]), React.createElement("span", {
      style: {
        color: 'var(--text-2)',
        fontSize: 14
      }
    }, i.fonte === 'pds' ? 'Planilha PDS' : 'Agenda')), React.createElement("div", {
      style: {
        font: 'var(--fw-medium) 17px/1.3 var(--font-mono)',
        letterSpacing: '.04em',
        wordBreak: 'break-all'
      }
    }, i.chassi_bruto), React.createElement("div", {
      style: {
        textWrap: 'pretty'
      }
    }, i.detalhe), i.resolvido ? React.createElement("div", {
      style: {
        color: 'var(--text-2)',
        fontSize: 14
      }
    }, "Resolvido por ", i.resolvido_por, " em ", ds.fmt(i.resolvido_em), i.vinculado ? ' · ligado a ' + i.vinculado : '') : React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap'
      }
    }, i.tipo === 'sem_correspondencia' ? React.createElement(React.Fragment, null, React.createElement(Button, {
      size: "sm",
      icon: "link",
      onClick: () => {
        setErr(null);
        setCh('');
        setVinc(i);
      }
    }, "Vincular a um ve\xEDculo"), React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      icon: "plus",
      onClick: () => go('cadastrar', {
        chassi: i.chassi_bruto
      })
    }, "Cadastrar ve\xEDculo")) : null, i.tipo === 'data_invalida' || i.tipo === 'duplicado' ? React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      icon: "car-front",
      onClick: () => go('detalhe', {
        chassi: i.chassi_bruto
      })
    }, "Abrir carro") : null, React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      icon: "check",
      onClick: () => ds.issues.resolve(i.id).then(() => toast('Pendência marcada como resolvida.'))
    }, "Marcar como resolvida")));
  })), vinc ? React.createElement(Dialog, {
    mobile: mobile,
    icon: "link",
    title: "Ligar esta entrega a qual carro?",
    onClose: () => setVinc(null),
    actions: React.createElement(React.Fragment, null, React.createElement(Button, {
      variant: "secondary",
      onClick: () => setVinc(null)
    }, "Cancelar"), React.createElement(Button, {
      icon: "link",
      onClick: vincular
    }, "Vincular"))
  }, React.createElement("div", null, "Na agenda: ", React.createElement("b", {
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, vinc.chassi_bruto), ". Digite o chassi certo do carro no sistema."), React.createElement(TextField, {
    label: "Chassi do carro",
    mono: true,
    value: ch,
    onChange: setCh,
    error: err
  })) : null);
}
function Usuarios({
  mobile,
  user,
  toast,
  aba
}) {
  const {
    OptionList,
    TextField,
    Button,
    Switch,
    Panel,
    Dialog,
    Tag,
    Banner,
    Icon
  } = DSNS;
  const tab = aba || 'lista';
  const users = useQuery(() => ds.users.list(), []);
  const log = useQuery(() => ds.users.auditLog(), []);
  const runs = useQuery(() => ds.sync.runs(), []);
  const [busca, setBusca] = React.useState('');
  const [novo, setNovo] = React.useState(null);
  const [cargoDlg, setCargoDlg] = React.useState(null);
  const [reset, setReset] = React.useState(null);
  const [admDlg, setAdmDlg] = React.useState(null);
  const tabs = [['lista', 'Usuários', 'users'], ['log', 'Log de usuários', 'scroll-text'], ['cargas', 'Cargas de planilha', 'file-spreadsheet']];
  const list = (users.data || []).filter(u => !busca || (u.nome_completo + ' ' + u.usuario).toLowerCase().includes(busca.toLowerCase()));
  function criar() {
    ds.users.create(novo).then(p => {
      setNovo(null);
      toast('Pronto! ' + p.nome_completo + ' já pode entrar com o usuário ' + p.usuario + '.');
    }, e => setNovo(Object.assign({}, novo, {
      err: {
        [e.code]: e.message
      }
    })));
  }
  function toggle(u, on) {
    ds.users.setActive(u.id, on).then(() => toast(on ? 'Pronto! ' + u.usuario + ' pode entrar de novo.' : u.usuario + ' não consegue mais entrar. O nome continua no histórico.'), e => toast(e.message, 'danger'));
  }
  return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, React.createElement(PageTitle, {
    mobile: mobile,
    sub: tab === 'log' ? 'Quem criou, inativou, reativou ou mudou senha e permissões.' : tab === 'cargas' ? 'Envie as planilhas e veja o resultado de cada carga.' : null,
    right: tab === 'lista' ? React.createElement(Button, {
      icon: "user-plus",
      onClick: () => setNovo({
        nome: '',
        cargo: '',
        senha: ds.SENHA_PROVISORIA,
        err: {}
      })
    }, "Novo usu\xE1rio") : null
  }, tab === 'log' ? 'Log de usuários' : tab === 'cargas' ? 'Cargas de planilha' : 'Usuários'), tab === 'lista' ? React.createElement(React.Fragment, null, React.createElement(TextField, {
    icon: "search",
    value: busca,
    onChange: setBusca,
    placeholder: "Buscar por nome ou usu\xE1rio"
  }), React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12
    }
  }, list.map((u, i) => React.createElement("div", {
    key: u.id,
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'minmax(0,1.6fr) minmax(0,1fr) auto auto auto',
      alignItems: 'center',
      gap: mobile ? 8 : 16,
      padding: '12px 16px',
      borderTop: i ? '1px solid var(--border-subtle)' : 0,
      opacity: u.ativo ? 1 : .75
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, u.nome_completo, u.perfil !== 'usuario' ? React.createElement(Tag, {
    tone: "info",
    icon: "shield"
  }, PERFIL_LABEL[u.perfil]) : null, !u.ativo ? React.createElement(Tag, {
    tone: "neutral",
    icon: "user-x"
  }, "Inativo") : null), React.createElement("div", {
    style: {
      color: 'var(--text-2)'
    }
  }, React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, u.usuario), u.deve_trocar_senha ? ' · ainda não trocou a senha' : '')), React.createElement("button", {
    type: "button",
    onClick: () => setCargoDlg({
      u,
      cargo: u.cargo
    }),
    style: {
      justifySelf: 'start',
      minWidth: 0,
      maxWidth: '100%',
      flexWrap: 'wrap',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      minHeight: 44,
      padding: '0 8px',
      border: 0,
      background: 'transparent',
      color: 'var(--text-1)',
      font: 'var(--type-body)',
      cursor: 'pointer'
    }
  }, React.createElement("span", {
    style: {
      color: 'var(--text-2)'
    }
  }, "Cargo:"), " ", u.cargo || '—', " ", React.createElement(Icon, {
    name: "pencil",
    size: 16,
    color: "var(--text-accent)"
  })), u.perfil !== 'usuario' ? React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    icon: "shield-minus",
    disabled: u.id === user.id,
    onClick: () => setAdmDlg({
      u,
      remover: true
    })
  }, u.admin_ate ? 'Admin até ' + ds.fmtData(new Date(u.admin_ate)) : 'Administrador') : React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    icon: "shield-plus",
    onClick: () => setAdmDlg({
      u,
      tipo: 'sempre',
      ate: ''
    })
  }, "Tornar administrador"), React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    icon: "key-round",
    onClick: () => setReset(u)
  }, "Redefinir senha"), React.createElement(Switch, {
    checked: u.ativo,
    onChange: on => toggle(u, on),
    disabled: u.id === user.id
  }))))) : null, tab === 'log' ? React.createElement(Panel, null, React.createElement("div", {
    style: {
      color: 'var(--text-2)'
    }
  }, "Este log n\xE3o pode ser editado nem apagado."), (log.data || []).slice(0, 40).map(l => React.createElement("div", {
    key: l.id,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      padding: '8px 0',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, React.createElement(Icon, {
    name: {
      criou: 'user-plus',
      inativou: 'user-x',
      reativou: 'user-check'
    }[l.acao] || 'key-round',
    size: 18,
    color: "var(--text-2)"
  }), React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 15
    }
  }, l.frase)))) : null, tab === 'cargas' ? React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, React.createElement(EnviarPlanilha, {
    toast: toast
  }), (runs.data || []).map(r => React.createElement(Panel, {
    key: r.id
  }, React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8,
      flexWrap: 'wrap',
      alignItems: 'center'
    }
  }, React.createElement("b", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, React.createElement(Icon, {
    name: r.fonte === 'pds' ? 'file-spreadsheet' : 'calendar-days',
    size: 20
  }), r.fonte === 'pds' ? 'Base PDS (HUB Serra)' : r.fonte === 'mov' ? 'Movimentação de veículos' : 'Agenda de entrega', " \xB7 ", ds.fmt(r.iniciado_em)), React.createElement(Tag, {
    tone: r.status === 'ok' ? 'ok' : r.status === 'rodando' ? 'info' : 'danger',
    icon: r.status === 'ok' ? 'circle-check' : r.status === 'rodando' ? 'loader' : 'circle-x'
  }, r.status === 'ok' ? 'Deu certo' : r.status === 'rodando' ? 'Carregando…' : 'Falhou')), r.status !== 'falhou' ? React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      flexWrap: 'wrap',
      color: 'var(--text-2)'
    }
  }, [['Linhas lidas', r.lidas], ['Novas', r.inseridas], ['Atualizadas', r.atualizadas], ['Sem mudança', r.inalteradas], ['Com problema', r.rejeitadas]].map(([k, n]) => React.createElement("span", {
    key: k
  }, k, ": ", React.createElement("b", {
    style: {
      color: 'var(--text-1)'
    }
  }, n.toLocaleString('pt-BR'))))) : React.createElement(Banner, {
    tone: "danger",
    title: "A carga n\xE3o entrou"
  }, r.erro, ". Os dados anteriores continuam valendo."), React.createElement("div", {
    style: {
      color: 'var(--text-2)',
      fontFamily: 'var(--font-mono)',
      fontSize: 14,
      wordBreak: 'break-all'
    }
  }, r.arquivo)))) : null, novo ? React.createElement(Dialog, {
    mobile: mobile,
    icon: "user-plus",
    title: "Novo usu\xE1rio",
    onClose: () => setNovo(null),
    actions: React.createElement(React.Fragment, null, React.createElement(Button, {
      variant: "secondary",
      onClick: () => setNovo(null)
    }, "Cancelar"), React.createElement(Button, {
      icon: "check",
      onClick: criar
    }, "Cadastrar"))
  }, React.createElement(TextField, {
    label: "Nome completo",
    required: true,
    autoFocus: true,
    value: novo.nome,
    onChange: v => setNovo(Object.assign({}, novo, {
      nome: v
    })),
    error: novo.err.nome
  }), React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      borderRadius: 8,
      background: 'var(--surface-accent-soft)'
    }
  }, React.createElement(Icon, {
    name: "at-sign",
    size: 20,
    color: "var(--text-accent)"
  }), React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-2)'
    }
  }, "O usu\xE1rio vai ser"), React.createElement("b", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 18,
      color: 'var(--text-accent)'
    }
  }, ds.users.preview(novo.nome) || '…'))), React.createElement(TextField, {
    label: "Cargo (opcional)",
    value: novo.cargo,
    onChange: v => setNovo(Object.assign({}, novo, {
      cargo: v
    }))
  }), React.createElement(TextField, {
    label: "Senha provis\xF3ria",
    value: novo.senha,
    onChange: v => setNovo(Object.assign({}, novo, {
      senha: v
    })),
    hint: "A pessoa troca no primeiro acesso.",
    error: novo.err.senha
  })) : null, cargoDlg ? React.createElement(Dialog, {
    mobile: mobile,
    icon: "briefcase",
    title: 'Cargo de ' + cargoDlg.u.nome_completo,
    onClose: () => setCargoDlg(null),
    actions: React.createElement(React.Fragment, null, React.createElement(Button, {
      variant: "secondary",
      onClick: () => setCargoDlg(null)
    }, "Cancelar"), React.createElement(Button, {
      icon: "save",
      onClick: () => ds.users.setCargo(cargoDlg.u.id, cargoDlg.cargo).then(() => {
        setCargoDlg(null);
        toast('Cargo salvo.');
      })
    }, "Salvar"))
  }, React.createElement(TextField, {
    label: "Cargo",
    value: cargoDlg.cargo,
    onChange: v => setCargoDlg(Object.assign({}, cargoDlg, {
      cargo: v
    })),
    hint: "Deixe vazio se n\xE3o quiser mostrar. Aparece como \u201C\u2014\u201D."
  })) : null, admDlg && !admDlg.remover ? React.createElement(Dialog, {
    mobile: mobile,
    icon: "shield-plus",
    title: 'Tornar ' + admDlg.u.nome_completo + ' administrador?',
    onClose: () => setAdmDlg(null),
    actions: React.createElement(React.Fragment, null, React.createElement(Button, {
      variant: "secondary",
      onClick: () => setAdmDlg(null)
    }, "Cancelar"), React.createElement(Button, {
      icon: "shield-plus",
      onClick: () => ds.users_extra.setAdmin(admDlg.u.id, true, admDlg.tipo === 'ate' ? admDlg.ate : null).then(() => {
        setAdmDlg(null);
        toast('Pronto! ' + admDlg.u.usuario + ' agora é administrador' + (admDlg.tipo === 'ate' ? ' até ' + admDlg.ate.split('-').reverse().join('/') : '') + '.');
      }, e => toast(e.message, 'danger'))
    }, "Confirmar"))
  }, React.createElement("div", null, "Administrador pode enviar planilhas, ver pend\xEAncias e cadastrar, desligar e mudar usu\xE1rios."), React.createElement(OptionList, {
    value: admDlg.tipo,
    onChange: x => setAdmDlg(Object.assign({}, admDlg, {
      tipo: x
    })),
    options: [{
      value: 'sempre',
      label: 'Sem prazo',
      icon: 'infinity'
    }, {
      value: 'ate',
      label: 'Temporário, até uma data',
      icon: 'calendar-clock'
    }]
  }), admDlg.tipo === 'ate' ? React.createElement(TextField, {
    label: "Administrador at\xE9 (inclusive)",
    type: "date",
    value: admDlg.ate,
    onChange: x => setAdmDlg(Object.assign({}, admDlg, {
      ate: x
    })),
    hint: "No dia seguinte volta sozinho a ser usu\xE1rio comum."
  }) : null) : null, admDlg && admDlg.remover ? React.createElement(Dialog, {
    mobile: mobile,
    icon: "shield-minus",
    tone: "danger",
    title: 'Tirar o acesso de administrador de ' + admDlg.u.nome_completo + '?',
    onClose: () => setAdmDlg(null),
    actions: React.createElement(React.Fragment, null, React.createElement(Button, {
      variant: "secondary",
      onClick: () => setAdmDlg(null)
    }, "Cancelar"), React.createElement(Button, {
      variant: "danger",
      icon: "shield-minus",
      onClick: () => ds.users_extra.setAdmin(admDlg.u.id, false).then(() => {
        setAdmDlg(null);
        toast(admDlg.u.usuario + ' agora é usuário comum.');
      }, e => toast(e.message, 'danger'))
    }, "Tirar acesso"))
  }, "A pessoa continua usando o sistema normalmente, s\xF3 n\xE3o envia planilhas nem mexe em usu\xE1rios.") : null, reset ? React.createElement(Dialog, {
    mobile: mobile,
    icon: "key-round",
    tone: "danger",
    title: 'Redefinir a senha de ' + reset.usuario + '?',
    onClose: () => setReset(null),
    actions: React.createElement(React.Fragment, null, React.createElement(Button, {
      variant: "secondary",
      onClick: () => setReset(null)
    }, "Cancelar"), React.createElement(Button, {
      variant: "danger",
      icon: "key-round",
      onClick: () => ds.users.resetPassword(reset.id).then(s => {
        setReset(null);
        toast('Senha provisória de ' + reset.usuario + ': ' + s + '. Ela vai precisar trocar ao entrar.');
      })
    }, "Redefinir"))
  }, "A senha atual deixa de funcionar na hora. Vamos gerar uma senha provis\xF3ria para voc\xEA passar \xE0 pessoa.") : null);
}
function EnviarPlanilha({
  toast
}) {
  const {
    Panel,
    Button,
    Banner,
    Icon
  } = DSNS;
  const ref = React.useRef(null);
  const [prog, setProg] = React.useState(null);
  const [res, setRes] = React.useState(null);
  const [err, setErr] = React.useState(null);
  function escolher(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setErr(null);
    setRes(null);
    setProg({
      t: 'Começando…',
      p: 0
    });
    ds.sync.enviarPlanilha(f, (t, p) => setProg({
      t,
      p
    })).then(r => {
      setProg(null);
      setRes(r);
      toast('Pronto! A planilha ' + {
        pds: 'HUB SERRA',
        mov: 'Movimentação',
        agenda: 'Agenda'
      }[r.fonte] + ' entrou no sistema.');
    }, e2 => {
      setProg(null);
      setErr(e2.message || String(e2));
    });
  }
  return React.createElement(Panel, {
    title: "Enviar planilha",
    icon: "upload"
  }, React.createElement("div", {
    style: {
      color: 'var(--text-2)'
    }
  }, "Envie as 3 planilhas (.xlsx), nesta ordem: ", React.createElement("b", {
    style: {
      color: 'var(--text-1)'
    }
  }, "1. HUB SERRA"), " \xB7 ", React.createElement("b", {
    style: {
      color: 'var(--text-1)'
    }
  }, "2. MOVIMENTA\xC7\xC3O DE VE\xCDCULOS"), " \xB7 ", React.createElement("b", {
    style: {
      color: 'var(--text-1)'
    }
  }, "3. AGENDA DE ENTREGA"), ". O sistema reconhece qual \xE9 cada uma."), React.createElement("input", {
    ref: ref,
    type: "file",
    accept: ".xlsx",
    onChange: escolher,
    style: {
      display: 'none'
    }
  }), prog ? React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontWeight: 700
    }
  }, React.createElement(Icon, {
    name: "loader",
    size: 18
  }), prog.t), React.createElement("div", {
    style: {
      height: 10,
      borderRadius: 999,
      background: 'var(--surface-sunken)',
      overflow: 'hidden'
    }
  }, React.createElement("div", {
    style: {
      height: '100%',
      width: Math.round(prog.p * 100) + '%',
      background: 'var(--action-primary)',
      transition: 'width .3s'
    }
  })), React.createElement("div", {
    style: {
      color: 'var(--text-2)',
      fontSize: 14
    }
  }, "N\xE3o feche esta tela at\xE9 terminar.")) : React.createElement(Button, {
    icon: "upload",
    onClick: () => ref.current.click()
  }, "Escolher planilha"), res ? React.createElement(Banner, {
    tone: "ok",
    title: {
      pds: 'HUB SERRA',
      mov: 'Movimentação',
      agenda: 'Agenda'
    }[res.fonte] + ' carregada'
  }, "Lidas ", res.lidas.toLocaleString('pt-BR'), " \xB7 novas ", res.inseridas.toLocaleString('pt-BR'), " \xB7 atualizadas ", res.atualizadas.toLocaleString('pt-BR'), " \xB7 sem mudan\xE7a ", res.inalteradas.toLocaleString('pt-BR'), " \xB7 ", res.pendencias, " pend\xEAncias.") : null, err ? React.createElement(Banner, {
    tone: "danger",
    title: "A planilha n\xE3o entrou"
  }, err, " Os dados de antes continuam valendo.") : null);
}
Object.assign(window, {
  Login,
  TrocarSenha,
  Conta,
  Pendencias,
  Usuarios
});