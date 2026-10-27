function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function cardProps(v, highlights) {
  return {
    modelo: v.modelo,
    versao: v.versao,
    cor: v.cor,
    chassi: v.chassi,
    etapa: v.etapa_view || v.etapa,
    localizacao: v.localizacao_label,
    comQuem: v.com_quem,
    entrega: v.etapa !== 'entregue' ? entregaTxt(v) : null,
    tags: v.tags,
    alerta: null,
    atualizadoPor: v.atualizado_por_nome,
    atualizadoCargo: v.atualizado_por_cargo,
    atualizadoEm: ds.fmt(v.atualizado_em),
    highlight: highlights && highlights[v.chassi] ? 'Atualizado por ' + primeiroNome(highlights[v.chassi]) + ' agora' : null
  };
}
function CameraSheet({
  onClose,
  onRead,
  mobile
}) {
  const {
    Dialog,
    Button
  } = DSNS;
  const [erro, setErro] = React.useState(null);
  React.useEffect(() => {
    if (!window.Html5Qrcode) {
      setErro('O leitor não carregou. Digite o chassi.');
      return;
    }
    const leitor = new Html5Qrcode('pv-leitor', {
      formatsToSupport: [Html5QrcodeSupportedFormats.CODE_39, Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.DATA_MATRIX, Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false
    });
    let parou = false;
    leitor.start({
      facingMode: 'environment'
    }, {
      fps: 10,
      qrbox: (w, h) => ({
        width: Math.floor(w * 0.85),
        height: Math.floor(Math.min(h, w) * 0.35)
      })
    }, texto => {
      const m = String(texto).toUpperCase().replace(/[^A-Z0-9]/g, '').match(/[A-HJ-NPR-Z0-9]{17}/);
      if (m && !parou) {
        parou = true;
        leitor.stop().catch(() => {});
        onRead(m[0]);
      }
    }, () => {}).catch(() => setErro('Não conseguimos abrir a câmera. Permita o uso da câmera no navegador ou digite o chassi.'));
    return () => {
      parou = true;
      try {
        if (leitor.isScanning) leitor.stop().catch(() => {});
      } catch (e) {}
    };
  }, []);
  return React.createElement(Dialog, {
    mobile: mobile,
    title: "Ler o c\xF3digo de barras do chassi",
    icon: "scan-barcode",
    onClose: onClose,
    actions: React.createElement(Button, {
      variant: "secondary",
      icon: "keyboard",
      onClick: onClose
    }, "Digitar o chassi")
  }, React.createElement("div", {
    id: "pv-leitor",
    style: {
      width: '100%',
      minHeight: 220,
      borderRadius: 12,
      overflow: 'hidden',
      background: 'var(--byd-preto)'
    }
  }), erro ? React.createElement("div", {
    style: {
      color: 'var(--danger-fg)',
      fontWeight: 700
    }
  }, erro) : React.createElement("div", null, "Aponte para a etiqueta da porta ou do para-brisa. A leitura \xE9 autom\xE1tica."));
}
function Buscar({
  mobile,
  go,
  highlights
}) {
  const {
    SearchField,
    Button,
    VehicleCard,
    EmptyState,
    Banner
  } = DSNS;
  const [q, setQ] = React.useState('');
  const [cam, setCam] = React.useState(false);
  const [res, setRes] = React.useState(null);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => ds.subscribe(() => setTick(t => t + 1)), []);
  React.useEffect(() => {
    let a = true;
    if (q.trim().length < 3) {
      setRes(null);
      return;
    }
    ds.vehicles.search(q).then(r => a && setRes(r));
    return () => {
      a = false;
    };
  }, [q, tick]);
  const pareceChassi = /^[A-Za-z0-9 ]{10,}$/.test(q.trim()) && /\d/.test(q);
  return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, React.createElement(PageTitle, {
    mobile: mobile,
    right: React.createElement(Button, {
      variant: "secondary",
      icon: "plus",
      onClick: () => go('cadastrar')
    }, "Novo ve\xEDculo")
  }, "Buscar carro"), React.createElement(SearchField, {
    value: q,
    onChange: setQ,
    onScan: () => setCam(true)
  }), res === null ? React.createElement("div", {
    style: {
      color: 'var(--text-2)'
    }
  }, "Digite o chassi completo ou os \xFAltimos 6 a 8 n\xFAmeros. Tamb\xE9m d\xE1 para buscar pelo nome do cliente ou pelo modelo.") : null, res && res.length ? React.createElement("div", {
    style: {
      color: 'var(--text-2)'
    }
  }, res.length === 1 ? '1 carro encontrado' : res.length + ' carros encontrados') : null, res && res.length ? React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'repeat(2, minmax(0,1fr))',
      gap: 12
    }
  }, res.slice(0, 20).map(v => React.createElement(VehicleCard, _extends({
    key: v.chassi
  }, cardProps(v, highlights), {
    onClick: () => go('detalhe', {
      chassi: v.chassi
    })
  })))) : null, res && !res.length ? React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12
    }
  }, React.createElement(EmptyState, {
    icon: "search-x",
    title: "Chassi n\xE3o encontrado",
    action: React.createElement(Button, {
      icon: "plus",
      onClick: () => go('cadastrar', {
        chassi: pareceChassi ? q : ''
      })
    }, "Cadastrar ve\xEDculo")
  }, "Nada com \u201C", q, "\u201D. Confira os n\xFAmeros. Se o carro \xE9 novo e ainda n\xE3o est\xE1 na planilha, cadastre aqui.")) : null, cam ? React.createElement(CameraSheet, {
    mobile: mobile,
    onClose: () => setCam(false),
    onRead: c => {
      setCam(false);
      setQ(c);
    }
  }) : null);
}
const LISTA_FILTROS = [{
  id: 'previsto',
  label: 'Previsto',
  icon: 'calendar-clock'
}, {
  id: 'agendamento',
  label: 'Agendamento de serviços',
  icon: 'clipboard-list'
}, {
  id: 'loja',
  label: 'Na loja',
  icon: 'warehouse'
}, {
  id: 'lavagem',
  label: 'Lavagem em andamento',
  icon: 'droplets'
}, {
  id: 'preparacao',
  label: 'Em preparação',
  icon: 'wrench'
}, {
  id: 'pronto',
  label: 'Pronto',
  icon: 'circle-check'
}, {
  id: 'entregue',
  label: 'Entregue (7 dias)',
  icon: 'key-round'
}, {
  id: 'hoje',
  label: 'Entregas de hoje',
  icon: 'calendar-check'
}, {
  id: 'servico',
  label: 'Serviço pendente',
  icon: 'clipboard-list'
}, {
  id: 'manual',
  label: 'Cadastro manual pendente',
  icon: 'pencil-line'
}];
function Lista({
  mobile,
  go,
  params,
  highlights,
  toast
}) {
  const {
    FilterChips,
    Select,
    Button,
    VehicleCard,
    EmptyState,
    StageBadge,
    ColorSwatch,
    Tag
  } = DSNS;
  const q = useQuery(() => ds.vehicles.listFlow(), []);
  const [f, setF] = React.useState(params && (params.etapa || params.filtro) || null);
  const [loc, setLoc] = React.useState(params && params.local || '');
  if (q.error) return React.createElement(LoadError, null);
  const all = q.data || [];
  const test = (v, id) => ['previsto', 'agendamento', 'loja', 'lavagem', 'preparacao', 'pronto', 'entregue'].includes(id) ? (v.etapa_view || v.etapa) === id : id === 'hoje' ? !!(v.schedule && v.schedule.data_hora_entrega && ds.fmtData(v.schedule.data_hora_entrega) === ds.fmtData(ds.NOW)) : id === 'alerta' ? v.alerts.length > 0 : id === 'manual' ? v.manual_pendente : id === 'servico' ? v.servicos_pendentes > 0 : true;
  const opts = LISTA_FILTROS.map(o => Object.assign({}, o, {
    count: all.filter(v => test(v, o.id)).length
  }));
  const list = all.filter(v => (!f || test(v, f)) && (!loc || v.status_localizacao === loc));
  function excel() {
    const rows = list.map(v => ({
      Chassi: v.chassi,
      Modelo: v.modelo,
      'Versão': v.versao,
      Cor: v.cor,
      Etapa: ds.ETAPA_LABEL[v.etapa],
      'Onde está': v.localizacao_label,
      'Com quem está': v.com_quem || '',
      'Previsão de chegada na loja': ds.fmt(v.previsao_chegada_loja),
      'Entrega': v.schedule && v.schedule.data_hora_entrega ? ds.fmt(v.schedule.data_hora_entrega) : '',
      Cliente: v.schedule ? v.schedule.cliente : '',
      Vendedor: v.schedule ? v.schedule.vendedor : '',
      'Acessórios': v.schedule ? v.schedule.acessorios : '',
      Selos: v.tags.map(t => t.label).join('; '),
      Alertas: v.alerts.map(a => a.frase).join('; '),
      'Atualizado por – Nome': v.atualizado_por_nome,
      'Atualizado por – Cargo': v.atualizado_por_cargo || '—',
      'Atualizado em': ds.fmt(v.atualizado_em)
    }));
    if (window.XLSX) {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Carros');
      XLSX.writeFile(wb, 'painel-veiculos-' + ds.fmtData(ds.NOW).replace(/\//g, '-') + '.xlsx');
    }
    toast('Pronto! Baixamos o Excel com ' + rows.length + (rows.length === 1 ? ' carro.' : ' carros.'));
  }
  const th = {
    textAlign: 'left',
    padding: '12px 14px',
    font: 'var(--type-label)',
    color: 'var(--text-2)',
    borderBottom: '1px solid var(--border-default)',
    whiteSpace: 'nowrap',
    background: 'var(--surface-sunken)'
  };
  const td = {
    padding: '12px 14px',
    borderBottom: '1px solid var(--border-subtle)',
    verticalAlign: 'top'
  };
  return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, React.createElement(PageTitle, {
    mobile: mobile,
    sub: 'Carros na loja, em preparação, prontos, agendados e entregues nos últimos 7 dias',
    right: React.createElement(Button, {
      variant: "secondary",
      icon: "download",
      onClick: excel,
      disabled: !list.length
    }, "Baixar Excel")
  }, "Lista de carros"), React.createElement(FilterChips, {
    value: f,
    onChange: setF,
    options: opts
  }), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, React.createElement(Select, {
    value: loc,
    onChange: setLoc,
    placeholder: "Onde est\xE1: todos os locais",
    options: ds.LOCALIZACOES,
    style: {
      flex: mobile ? '1 1 100%' : '0 1 420px'
    }
  }), loc || f ? React.createElement(Button, {
    variant: "ghost",
    icon: "x",
    onClick: () => {
      setLoc('');
      setF(null);
    }
  }, "Limpar filtros") : null, React.createElement("span", {
    style: {
      color: 'var(--text-2)',
      marginLeft: mobile ? 0 : 'auto'
    }
  }, list.length === 1 ? '1 carro' : list.length + ' carros')), q.loading ? React.createElement(CardsSkeleton, null) : !list.length ? React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12
    }
  }, React.createElement(EmptyState, {
    icon: "car-front",
    title: "Nenhum carro aqui",
    action: React.createElement(Button, {
      variant: "secondary",
      icon: "x",
      onClick: () => {
        setLoc('');
        setF(null);
      }
    }, "Ver todos")
  }, "Nenhum carro com esse filtro agora.")) : mobile ? React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, list.map(v => React.createElement(VehicleCard, _extends({
    key: v.chassi
  }, cardProps(v, highlights), {
    onClick: () => go('detalhe', {
      chassi: v.chassi
    })
  })))) : React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      overflow: 'auto'
    }
  }, React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      font: 'var(--type-body)'
    }
  }, React.createElement("thead", null, React.createElement("tr", null, ['Carro', 'Chassi', 'Situação', 'Onde está', 'Com quem está', 'Entrega', 'Atualizado por', 'Atualizado em'].map(h => React.createElement("th", {
    key: h,
    style: th
  }, h)))), React.createElement("tbody", null, list.map(v => {
    const hl = highlights && highlights[v.chassi];
    return React.createElement("tr", {
      key: v.chassi,
      onClick: () => go('detalhe', {
        chassi: v.chassi
      }),
      style: {
        cursor: 'pointer',
        background: hl ? 'var(--surface-accent-soft)' : undefined,
        transition: 'background .4s'
      },
      onMouseEnter: e => {
        if (!hl) e.currentTarget.style.background = 'var(--slate-50)';
      },
      onMouseLeave: e => {
        if (!hl) e.currentTarget.style.background = '';
      }
    }, React.createElement("td", {
      style: td
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 700
      }
    }, React.createElement(ColorSwatch, {
      cor: v.cor,
      size: 14
    }), nomeCarro(v)), v.versao ? React.createElement("div", {
      style: {
        color: 'var(--text-2)'
      }
    }, v.versao) : null, hl ? React.createElement("div", {
      style: {
        color: 'var(--info-fg)',
        fontWeight: 700,
        fontSize: 14
      }
    }, "Atualizado por ", primeiroNome(hl), " agora") : null), React.createElement("td", {
      style: Object.assign({}, td, {
        font: 'var(--fw-regular) 15px/1.3 var(--font-mono)',
        color: 'var(--text-2)',
        whiteSpace: 'nowrap'
      })
    }, v.chassi.slice(0, 9), React.createElement("b", {
      style: {
        color: 'var(--text-1)'
      }
    }, v.chassi.slice(9))), React.createElement("td", {
      style: td
    }, React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'flex-start'
      }
    }, React.createElement(StageBadge, {
      etapa: v.etapa_view || v.etapa
    }), v.manual_pendente ? React.createElement(Tag, {
      tone: "warn",
      icon: "pencil-line"
    }, "Manual pendente") : null)), React.createElement("td", {
      style: Object.assign({}, td, {
        maxWidth: 220
      })
    }, v.localizacao_label), React.createElement("td", {
      style: td
    }, v.com_quem || '—'), React.createElement("td", {
      style: Object.assign({}, td, {
        whiteSpace: 'nowrap'
      })
    }, v.schedule && v.schedule.data_hora_entrega ? React.createElement(React.Fragment, null, React.createElement("b", null, ds.fmtDia(v.schedule.data_hora_entrega), " ", ds.fmtHora(v.schedule.data_hora_entrega)), React.createElement("div", {
      style: {
        color: 'var(--text-2)'
      }
    }, v.schedule.cliente)) : '—'), React.createElement("td", {
      style: td
    }, v.atualizado_por_nome, React.createElement("div", {
      style: {
        color: 'var(--text-2)'
      }
    }, v.atualizado_por_cargo || '—')), React.createElement("td", {
      style: Object.assign({}, td, {
        whiteSpace: 'nowrap',
        color: 'var(--text-2)'
      })
    }, ds.fmt(v.atualizado_em)));
  })))));
}
function Cadastrar({
  mobile,
  go,
  params,
  toast
}) {
  const {
    TextField,
    Select,
    Button,
    Panel,
    Banner
  } = DSNS;
  const [chassi, setChassi] = React.useState(params && params.chassi ? ds.normChassi(params.chassi) : '');
  const [modelo, setModelo] = React.useState('');
  const [modeloOutro, setModeloOutro] = React.useState('');
  const [cor, setCor] = React.useState('');
  const [corOutro, setCorOutro] = React.useState('');
  const [versao, setVersao] = React.useState('');
  const [prev, setPrev] = React.useState('');
  const [err, setErr] = React.useState({});
  const [busy, setBusy] = React.useState(false);
  const opts = useQuery(() => ds.vehicles.options(), []);
  const o = opts.data || {
    modelos: [],
    cores: []
  };
  function salvar() {
    const e = {};
    const ce = ds.validarChassi(chassi);
    if (ce) e.chassi = ce;
    const m = modelo === 'Outro' ? modeloOutro : modelo;
    const c = cor === 'Outro' ? corOutro : cor;
    if (!m) e.modelo = 'Escolha o modelo do carro.';
    if (!c) e.cor = 'Escolha a cor do carro.';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    ds.vehicles.create({
      chassi,
      modelo: m,
      cor: c,
      versao,
      previsao: prev ? new Date(prev + 'T12:00') : null
    }).then(v => {
      toast('Pronto! O ' + nomeCarro(v) + ' foi cadastrado e está como “Previsto”.');
      go('detalhe', {
        chassi: v.chassi
      }, true);
    }, er => {
      setBusy(false);
      if (er.code === 'existe') {
        toast(er.message, 'info');
        go('detalhe', {
          chassi: ds.normChassi(chassi)
        }, true);
      } else setErr({
        [er.code]: er.message
      });
    });
  }
  return React.createElement("div", {
    style: {
      maxWidth: 640,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, React.createElement(PageTitle, {
    mobile: mobile,
    sub: "Use quando o carro ainda n\xE3o apareceu na planilha PDS."
  }, "Cadastrar ve\xEDculo"), React.createElement(Panel, null, React.createElement(TextField, {
    label: "Chassi",
    required: true,
    mono: true,
    value: chassi,
    onChange: v => setChassi(v.toUpperCase()),
    maxLength: 20,
    error: err.chassi,
    hint: chassi ? ds.normChassi(chassi).length + ' de 17 caracteres' : '17 letras e números, sem I, O ou Q'
  }), React.createElement(Select, {
    label: "Modelo",
    required: true,
    value: modelo,
    onChange: setModelo,
    options: o.modelos.concat(['Outro']),
    error: err.modelo
  }), modelo === 'Outro' ? React.createElement(TextField, {
    label: "Qual modelo?",
    required: true,
    value: modeloOutro,
    onChange: setModeloOutro
  }) : null, React.createElement(Select, {
    label: "Cor",
    required: true,
    value: cor,
    onChange: setCor,
    options: o.cores.map(c => ({
      value: c,
      label: corTxt(c)
    })).concat([{
      value: 'Outro',
      label: 'Outro'
    }]),
    error: err.cor
  }), cor === 'Outro' ? React.createElement(TextField, {
    label: "Qual cor?",
    required: true,
    value: corOutro,
    onChange: setCorOutro
  }) : null, React.createElement(TextField, {
    label: "Vers\xE3o (opcional)",
    value: versao,
    onChange: setVersao,
    placeholder: "Ex.: GS"
  }), React.createElement(TextField, {
    label: "Previs\xE3o de chegada na loja (opcional)",
    type: "date",
    value: prev,
    onChange: setPrev
  })), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexDirection: mobile ? 'column-reverse' : 'row'
    }
  }, React.createElement(Button, {
    variant: "secondary",
    onClick: () => go('back')
  }, "Cancelar"), React.createElement(Button, {
    icon: "plus",
    loading: busy,
    onClick: salvar,
    size: mobile ? 'lg' : 'md',
    fullWidth: mobile
  }, "Cadastrar ve\xEDculo")));
}
Object.assign(window, {
  Buscar,
  Lista,
  Cadastrar,
  cardProps
});