function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const NEXT = {
  previsto: {
    label: 'Confirmar chegada',
    icon: 'map-pin-check',
    verb: 'confirmarChegada'
  },
  loja: {
    label: 'Levar para lavagem',
    icon: 'droplets',
    verb: 'enviarLavagem'
  },
  lavagem: {
    label: 'Voltou da lavagem · começar preparação',
    icon: 'play',
    verb: 'comecarPreparacao'
  },
  preparacao: {
    label: 'Carro pronto',
    icon: 'circle-check',
    verb: 'carroPronto'
  },
  pronto: {
    label: 'Entregar ao cliente',
    icon: 'key-round',
    verb: 'entregar'
  }
};
function InfoGrid({
  items,
  cols
}) {
  return React.createElement("dl", {
    style: {
      margin: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(' + cols + ', minmax(0,1fr))',
      gap: '12px 20px'
    }
  }, items.map(([k, v]) => React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, React.createElement("dt", {
    style: {
      color: 'var(--text-2)',
      fontSize: 'var(--fs-label)'
    }
  }, k), React.createElement("dd", {
    style: {
      margin: 0,
      fontWeight: 700
    }
  }, v || '—'))));
}
const AVARIA_TIPOS = ['Risco', 'Amassado', 'Trinca ou quebra', 'Peça solta ou faltando', 'Mancha ou pintura danificada', 'Vidro trincado', 'Farol ou lanterna danificado', 'Roda ou pneu danificado', 'Estofado ou interior danificado', 'Outro'];
const AVARIA_LOCAIS = ['Para-choque dianteiro', 'Para-choque traseiro', 'Capô', 'Teto', 'Tampa do porta-malas', 'Porta dianteira esquerda', 'Porta dianteira direita', 'Porta traseira esquerda', 'Porta traseira direita', 'Para-lama dianteiro esquerdo', 'Para-lama dianteiro direito', 'Lateral traseira esquerda', 'Lateral traseira direita', 'Para-brisa', 'Vidro traseiro', 'Retrovisor esquerdo', 'Retrovisor direito', 'Roda dianteira esquerda', 'Roda dianteira direita', 'Roda traseira esquerda', 'Roda traseira direita', 'Interior', 'Outro'];
const avariaVazia = () => ({ tipo: '', local: '', obs: '' });
const avariasPreenchidas = (l) => (l || []).filter((a) => (a.obs || '').trim());
function avariasErro(lista) {
  for (let i = 0; i < lista.length; i++) {
    const a = lista[i], n = lista.length > 1 ? ' (avaria ' + (i + 1) + ')' : '';
    if (!a.tipo) return 'Escolha o tipo da avaria' + n + '.';
    if (!a.local) return 'Escolha o local da avaria' + n + '.';
    if ((a.tipo === 'Outro' || a.local === 'Outro') && !a.obs.trim()) return 'Você escolheu "Outro". Descreva a avaria no campo de texto' + n + '.';
  }
  return null;
}
function avariaTxt(a) {
  if (a.tipo === 'Outro' && a.local === 'Outro') return a.obs || 'Avaria';
  const tipo = a.tipo === 'Outro' ? (a.obs || 'Outro') : a.tipo;
  const local = a.local === 'Outro' ? 'local descrito' : a.local;
  return tipo + ' — ' + local;
}
function AvariaEditor({ value, onChange, opcional }) {
  const { TextField } = DSNS;
  const txt = (Array.isArray(value) && value[0] && value[0].obs) || '';
  return React.createElement(TextField, {
    label: opcional ? "Avaria (se tiver)" : "Avaria",
    required: !opcional,
    value: txt,
    onChange: x => onChange([{ tipo: 'Outro', local: 'Outro', obs: x.slice(0, 300) }]),
    placeholder: "Ex.: risco na porta traseira direita",
    hint: opcional ? "Escreva qual é a avaria e onde fica. Se não tiver avaria, deixe em branco." : "Escreva qual é a avaria e onde fica."
  });
}
function Detalhe({
  mobile,
  go,
  params,
  user,
  toast,
  highlights
}) {
  const {
    Panel,
    StageBadge,
    Tag,
    ColorSwatch,
    ChassiText,
    StageTimeline,
    OptionList,
    Button,
    HistoryList,
    ControlFields,
    ActionBar,
    Dialog,
    Select,
    TextField,
    Banner,
    Icon,
    Skeleton
  } = DSNS;
  const chassi = params.chassi;
  const q = useQuery(() => ds.vehicles.get(chassi), [chassi]);
  const ev = useQuery(() => ds.vehicles.events(chassi), [chassi]);
  const users = useQuery(() => ds.users.list(), []);
  const [loc, setLoc] = React.useState(null);
  const [dlg, setDlg] = React.useState(null);
  const [prep, setPrep] = React.useState(user.id);
  const [entregador, setEntregador] = React.useState('');
  const [motivo, setMotivo] = React.useState('');
  const [bateria, setBateria] = React.useState('');
  const [sitCheg, setSitCheg] = React.useState([]);
  const [avarias, setAvarias] = React.useState([avariaVazia()]);
  const [err, setErr] = React.useState(null);
  const v = q.data;
  React.useEffect(() => {
    if (v) setLoc(v.status_localizacao);
  }, [v && v.status_localizacao]);
  if (q.error) return React.createElement(LoadError, null);
  if (q.loading || !v) return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, React.createElement(Skeleton, {
    height: 40,
    width: "60%"
  }), React.createElement(Skeleton, {
    height: 100,
    radius: 12
  }), React.createElement(Skeleton, {
    height: 240,
    radius: 12
  }));
  const gestor = user.perfil !== 'usuario';
  const nx = NEXT[v.etapa];
  const hl = highlights && highlights[v.chassi];
  const nome = nomeCarro(v);
  function abrir() {
    setErr(null);
    setBateria('');
    setSitCheg([]);
    setAvarias([avariaVazia()]);
    if (v.etapa === 'pronto') setEntregador(v.schedule ? v.schedule.entregador_sugerido : '');
    setDlg('next');
  }
  function executar() {
    const fn = ds.vehicles[nx.verb];
    const avOk = avariasPreenchidas(avarias);
    if (nx.verb === 'confirmarChegada') { const ea = avariasErro(avOk); if (ea) { setErr(ea); return; } }
    const p = nx.verb === 'confirmarChegada' ? fn(v.chassi, bateria, sitCheg, avOk) : nx.verb === 'comecarPreparacao' ? fn(v.chassi, prep) : nx.verb === 'entregar' ? fn(v.chassi, entregador) : fn(v.chassi);
    p.then(nv => {
      setDlg(null);
      const msg = {
        loja: 'Chegada confirmada! O ' + nome + ' chegou com ' + nv.bateria_recebimento + '% de bateria e está no ' + nv.status_localizacao + '.',
        lavagem: 'Pronto! O ' + nome + ' está com lavagem em andamento.',
        preparacao: 'Pronto! O ' + nome + ' agora está em preparação com ' + primeiroNome(nv.preparador_nome) + '.',
        pronto: 'Pronto! O ' + nome + ' está pronto para entrega.',
        entregue: 'Pronto! O ' + nome + ' foi entregue ao cliente.'
      };
      toast(msg[nv.etapa]);
    }, e => setErr(e.message));
  }
  function salvarAvaria() {
    const avOk = avariasPreenchidas(avarias); if (!avOk.length) { setErr('Escreva qual é a avaria e onde fica.'); return; }
    const ea = avariasErro(avOk); if (ea) { setErr(ea); return; }
    ds.vehicles.registrarAvaria(v.chassi, avOk).then(() => { setDlg(null); setAvarias([avariaVazia()]); toast('Avaria registrada no ' + nome + '. Todos já conseguem ver.'); }, e => setErr(e.message));
  }
  function voltar() {
    ds.vehicles.voltarEtapa(v.chassi, motivo).then(nv => {
      setDlg(null);
      setMotivo('');
      toast('O ' + nome + ' voltou para “' + ds.ETAPA_LABEL[nv.etapa] + '”.');
    }, e => setErr(e.message));
  }
  function salvarLocal() {
    ds.vehicles.setLocalizacao(v.chassi, loc).then(() => toast('Pronto! O ' + nome + ' agora está em: ' + loc + '.'), e => toast(e.message, 'danger'));
  }
  const datas = {};
  (ev.data || []).slice().reverse().forEach(e => {
    if (e.tipo === 'etapa' && e.valor_novo) datas[e.valor_novo] = ds.fmtDia(e.criado_em) + ' ' + ds.fmtHora(e.criado_em);
  });
  if (v.etapa === 'previsto' && v.previsao_chegada_loja) datas.previsto = 'prev. ' + ds.fmtDia(v.previsao_chegada_loja);
  const historico = (ev.data || []).map(e => ({
    oque: e.oque,
    quem: e.usuario_nome,
    cargo: e.usuario_cargo,
    quando: ds.fmt(e.criado_em),
    origem: e.origem,
    motivo: e.motivo
  }));
  const primary = nx ? React.createElement(Button, {
    size: "lg",
    fullWidth: true,
    icon: nx.icon,
    onClick: abrir
  }, nx.label) : null;
  const locMudou = loc && loc !== v.status_localizacao;
  const blocoOnde = React.createElement(Panel, {
    title: "Onde est\xE1",
    icon: "map-pin"
  }, v.etapa === 'previsto' ? React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      borderRadius: 8,
      background: 'var(--surface-sunken)'
    }
  }, React.createElement(Icon, {
    name: "truck",
    size: 22,
    color: "var(--text-2)"
  }), React.createElement("div", null, React.createElement("b", null, ds.LOC_HUB), React.createElement("div", {
    style: {
      color: 'var(--text-2)'
    }
  }, "Voc\xEA poder\xE1 escolher o local depois de confirmar a chegada."))) : React.createElement(React.Fragment, null, React.createElement(OptionList, {
    options: ds.LOCALIZACOES,
    value: loc,
    onChange: setLoc
  }), React.createElement(Button, {
    icon: "save",
    disabled: !locMudou,
    onClick: salvarLocal,
    fullWidth: mobile
  }, locMudou ? 'Salvar novo local' : 'Salvar')), React.createElement("div", {
    style: {
      paddingTop: 12,
      borderTop: '1px solid var(--border-subtle)'
    }
  }, React.createElement(ControlFields, {
    localizacao: v.localizacao_label,
    nome: v.atualizado_por_nome,
    cargo: v.atualizado_por_cargo,
    em: ds.fmt(v.atualizado_em),
    columns: mobile ? 1 : 2
  })));
  const s = v.schedule;
  const blocoEntrega = React.createElement(Panel, {
    title: "Entrega",
    icon: "calendar-check"
  }, s ? React.createElement(InfoGrid, {
    cols: mobile ? 1 : 2,
    items: [['Cliente', s.cliente], ['Data e hora', s.data_hora_entrega ? ds.DIAS[s.data_hora_entrega.getDay()] + ' ' + ds.fmt(s.data_hora_entrega) : 'Sem data na agenda'], ['Vendedor', s.vendedor], ['Acessórios', s.acessorios]]
  }) : React.createElement("div", {
    style: {
      color: 'var(--text-2)'
    }
  }, "Este carro ainda n\xE3o est\xE1 na agenda de entregas."));
  const blocoQuem = React.createElement(Panel, {
    title: "Com quem est\xE1",
    icon: "user-round"
  }, React.createElement(InfoGrid, {
    cols: mobile ? 1 : 2,
    items: [['Preparador', v.preparador_nome], ['Entregador', v.entregador_nome || (s ? s.entregador_sugerido + ' (da agenda)' : null)]]
  }));
  const blocoInfo = React.createElement(Panel, {
    title: "Dados do carro",
    icon: "car-front"
  }, React.createElement(InfoGrid, {
    cols: 2,
    items: [['Recebido no HUB em', ds.fmtData(v.recebido_hub_em)], ['Previsão de chegada na loja', v.flag_data_invalida ? 'Data inválida na origem' : ds.fmtData(v.previsao_chegada_loja)], ['Chegou na loja em', v.chegada_loja_em ? ds.fmt(v.chegada_loja_em) : null], ['Dias na loja', v.dias_na_loja != null ? String(v.dias_na_loja) : null], ['Bateria na chegada', v.bateria_recebimento != null ? v.bateria_recebimento + '%' : null], ['Bateria no HUB', v.bateria_hub != null ? v.bateria_hub + '%' : null], ['Placa', v.placa], ['Loja (SETOR na HUB)', v.setor]].concat(v.mov ? [['Transferência (Movimentação)', v.mov.status || '—'], ['Chamado', v.mov.chamado], ['Pedido em', ds.fmtData(v.mov.data_solicitacao)], ['Previsão de chegada em VV', ds.fmtData(v.mov.previsao_entrega)], ['Entregue em VV?', v.mov.entregue_vv === true ? 'Sim' + (v.mov.data_entrega ? ' · ' + ds.fmtData(v.mov.data_entrega) : '') : v.mov.entregue_vv === false ? 'Não' : '—'], ['Vendedor (Movimentação)', v.mov.vendedor]].concat(v.mov.observacao ? [['Observação', v.mov.observacao]] : []) : [])
  }));
  const blocoServ = React.createElement(ServicosBloco, {
    v: v,
    mobile: mobile,
    toast: toast
  });
  const blocoHist = React.createElement(Panel, {
    title: "Hist\xF3rico",
    icon: "history"
  }, ev.data ? React.createElement(HistoryList, {
    items: historico
  }) : React.createElement(Skeleton, {
    height: 120
  }));
  return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      paddingBottom: mobile && nx ? 0 : 0
    }
  }, !mobile ? React.createElement("div", null, React.createElement(Button, {
    variant: "ghost",
    icon: "chevron-left",
    size: "sm",
    onClick: () => go('back')
  }, "Voltar")) : null, hl ? React.createElement(Banner, {
    tone: "info",
    icon: "radio",
    title: 'Atualizado por ' + hl + ' agora'
  }, "A tela j\xE1 mostra a mudan\xE7a.") : null, React.createElement("header", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, React.createElement(ColorSwatch, {
    cor: v.cor,
    size: mobile ? 22 : 26
  }), React.createElement("h1", {
    style: {
      margin: 0,
      font: mobile ? 'var(--type-h2)' : 'var(--type-h1)'
    }
  }, nome, v.versao ? React.createElement("span", {
    style: {
      fontWeight: 400,
      color: 'var(--text-2)'
    }
  }, " \xB7 ", v.versao) : null)), React.createElement(ChassiText, {
    chassi: v.chassi,
    copy: true,
    size: "lg"
  }), v.bateria_recebimento != null ? React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontWeight: 700,
      color: v.bateria_recebimento < 30 ? 'var(--danger-fg)' : 'var(--text-1)'
    }
  }, React.createElement(Icon, {
    name: v.bateria_recebimento < 30 ? 'battery-low' : v.bateria_recebimento < 70 ? 'battery-medium' : 'battery-full',
    size: 22
  }), "Bateria na chegada: ", v.bateria_recebimento, "%") : null, (v.situacao_chegada || []).length ? React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRadius: 8, background: 'var(--warn-bg)', color: 'var(--warn-fg)', border: '1px solid var(--warn-border)' } }, React.createElement("b", { style: { display: 'flex', alignItems: 'center', gap: 6 } }, React.createElement(Icon, { name: "clipboard-list", size: 20 }), "Situa\xE7\xE3o na chegada"), v.situacao_chegada.map(t => React.createElement("span", { key: t }, "\u2022 ", t))) : null, (v.avarias || []).length ? React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRadius: 8, background: 'var(--danger-bg)', color: 'var(--danger-fg)', border: '1px solid var(--danger-border)' } }, React.createElement("b", { style: { display: 'flex', alignItems: 'center', gap: 6 } }, React.createElement(Icon, { name: "shield-alert", size: 20 }), v.avarias.length === 1 ? 'Avaria registrada' : v.avarias.length + ' avarias registradas'), v.avarias.map((a, i) => React.createElement("div", { key: i, style: { display: 'flex', flexDirection: 'column' } }, React.createElement("span", { style: { fontWeight: 700 } }, "\u2022 ", avariaTxt(a)), a.obs && a.tipo !== 'Outro' ? React.createElement("span", { style: { color: 'var(--text-1)' } }, a.obs) : null, a.local === 'Outro' && a.tipo !== 'Outro' ? null : null, React.createElement("span", { style: { color: 'var(--text-2)', fontSize: 14 } }, (a.por || '') + (a.em ? ' · ' + ds.fmt(new Date(a.em)) : ''))))) : null, v.etapa !== 'previsto' && v.etapa !== 'entregue' ? React.createElement("div", null, React.createElement(Button, { variant: "secondary", size: "sm", icon: "shield-alert", onClick: () => { setErr(null); setAvarias([avariaVazia()]); setDlg('avaria'); } }, "Registrar avaria")) : null, React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, React.createElement(StageBadge, {
    etapa: v.etapa_view || v.etapa,
    size: "lg"
  }), v.tags.map((t, i) => React.createElement(Tag, _extends({
    key: i
  }, t), t.label)))), React.createElement(Panel, null, React.createElement(StageTimeline, {
    etapa: v.etapa_view || v.etapa,
    datas: datas
  })), mobile ? React.createElement(React.Fragment, null, blocoOnde, blocoServ, blocoEntrega, blocoQuem, blocoInfo, blocoHist, v.etapa !== 'previsto' ? React.createElement(Button, {
    variant: "ghost",
    icon: "undo-2",
    onClick: () => {
      setErr(null);
      setDlg('voltar');
    }
  }, "Voltar uma etapa") : null) : React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)',
      gap: 16,
      alignItems: 'start'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, blocoOnde, blocoServ, blocoHist), React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, nx ? React.createElement(Panel, {
    title: "Pr\xF3ximo passo",
    icon: "arrow-right-circle"
  }, primary, v.etapa === 'loja' ? null : null) : React.createElement(Panel, {
    title: "Entregue",
    icon: "key-round"
  }, React.createElement("div", {
    style: {
      color: 'var(--text-2)'
    }
  }, "Este carro j\xE1 foi entregue ao cliente.")), v.etapa !== 'previsto' ? React.createElement(Button, {
    variant: "ghost",
    icon: "undo-2",
    onClick: () => {
      setErr(null);
      setDlg('voltar');
    }
  }, "Voltar uma etapa") : null, blocoEntrega, blocoQuem, blocoInfo)), mobile && nx ? React.createElement("div", {
    style: {
      position: 'sticky',
      bottom: -16,
      zIndex: 9,
      margin: '0 -16px -16px'
    }
  }, React.createElement(ActionBar, {
    sticky: false,
    hint: "Pr\xF3ximo passo"
  }, primary)) : null, dlg === 'next' ? React.createElement(Dialog, {
    mobile: mobile,
    icon: nx.icon,
    tone: v.etapa === 'pronto' ? 'ok' : 'neutral',
    onClose: () => setDlg(null),
    title: {
      previsto: 'O ' + nome + ' chegou na loja?',
      loja: 'Levar o ' + nome + ' para a lavagem?',
      lavagem: 'O ' + nome + ' voltou limpo da lavagem?',
      preparacao: 'O ' + nome + ' está pronto?',
      pronto: 'Entregar o ' + nome + (s ? ' para ' + s.cliente : '') + '?'
    }[v.etapa],
    actions: React.createElement(React.Fragment, null, React.createElement(Button, {
      variant: "secondary",
      onClick: () => setDlg(null)
    }, "Cancelar"), React.createElement(Button, {
      variant: v.etapa === 'pronto' ? 'success' : 'primary',
      icon: "check",
      onClick: executar
    }, {
      previsto: 'Sim, chegou',
      loja: 'Sim, levar',
      lavagem: 'Sim, começar preparação',
      preparacao: 'Sim, está pronto',
      pronto: 'Sim, entregar'
    }[v.etapa]))
  }, v.etapa === 'previsto' ? React.createElement(React.Fragment, null, React.createElement("div", null, "Vamos registrar que ", React.createElement("b", null, user.nome_completo), " recebeu o carro agora. Ele vai para \u201CEstacionamento da loja (sujo)\u201D."), React.createElement(TextField, {
    label: "Bateria na chegada (%)",
    required: true,
    inputMode: "numeric",
    maxLength: 3,
    value: bateria,
    onChange: x => setBateria(x.replace(/\D/g, '')),
    placeholder: "Ex.: 82",
    hint: "Veja no painel do carro e digite s\xF3 o n\xFAmero."
  }), React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
    React.createElement("div", { style: { font: 'var(--type-label)' } }, "Situa\xE7\xE3o na chegada (marque se tiver)"),
    ['Veículo sujo e sujeito a constatação de avaria após ser lavado', 'Faltando chave reserva', 'Faltando manual'].map(t => { const on = sitCheg.includes(t); return React.createElement("button", { key: t, type: "button", role: "checkbox", "aria-checked": on,
      onClick: () => setSitCheg(a => on ? a.filter(x => x !== t) : a.concat([t])),
      style: { display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '10px 14px', textAlign: 'left', background: on ? 'var(--warn-bg)' : 'var(--surface-card)', border: (on ? 2 : 1) + 'px solid ' + (on ? 'var(--warn-solid)' : 'var(--border-default)'), margin: on ? 0 : 1, borderRadius: 'var(--radius-md)', cursor: 'pointer', font: 'var(--type-body)', color: 'var(--text-1)' } },
      React.createElement("span", { style: { width: 24, height: 24, flex: 'none', borderRadius: 6, border: '2px solid ' + (on ? 'var(--warn-solid)' : 'var(--border-strong)'), background: on ? 'var(--warn-solid)' : '#fff', display: 'grid', placeItems: 'center', color: '#fff' } }, on ? React.createElement(Icon, { name: "check", size: 16, strokeWidth: 3 }) : null),
      React.createElement("span", { style: { flex: 1, fontWeight: on ? 700 : 400 } }, t)); }),
    React.createElement("div", { style: { color: 'var(--text-2)', fontSize: 14 } }, "Pode marcar mais de uma. Se estiver tudo certo, deixe em branco.")), React.createElement(AvariaEditor, { value: avarias, onChange: x => { setAvarias(x); setErr(null); }, opcional: true })) : null, v.etapa === 'loja' ? React.createElement("div", null, "O carro vai para \u201CDeixado para lavar no Shopping Praia da Costa\u201D. ", (v.servicos || []).some(x => x.tipo === 'emplacamento' && x.status === 'pendente') ? 'Lembrete: o emplacamento pode ser feito antes da lavagem.' : '') : null, v.etapa === 'lavagem' ? React.createElement(Select, {
    label: "Quem vai preparar?",
    value: prep,
    onChange: setPrep,
    options: (users.data || []).filter(u => u.ativo).map(u => ({
      value: u.id,
      label: u.nome_completo + (u.id === user.id ? ' (você)' : '')
    }))
  }) : null, v.etapa === 'preparacao' ? React.createElement("div", null, "Confira se a prepara\xE7\xE3o e os acess\xF3rios (", s ? s.acessorios : 'nenhum na agenda', ") est\xE3o feitos.", v.servicos_pendentes ? ' Atenção: ainda há ' + v.servicos_pendentes + ' serviço(s) pendente(s).' : '') : null, v.etapa === 'pronto' ? React.createElement(TextField, {
    label: "Quem est\xE1 entregando?",
    value: entregador,
    onChange: setEntregador,
    hint: s ? 'Veio da agenda. Mude se for outra pessoa.' : null
  }) : null, React.createElement("div", {
    style: {
      color: 'var(--text-2)'
    }
  }, "Se for engano, d\xE1 para voltar a etapa depois (com um motivo)."), err ? React.createElement("div", {
    style: {
      color: 'var(--danger-fg)',
      fontWeight: 700
    }
  }, err) : null) : null, dlg === 'avaria' ? React.createElement(Dialog, { mobile: mobile, icon: "shield-alert", tone: "danger", onClose: () => setDlg(null), title: 'Registrar avaria no ' + nome, actions: React.createElement(React.Fragment, null, React.createElement(Button, { variant: "secondary", onClick: () => setDlg(null) }, "Cancelar"), React.createElement(Button, { variant: "danger", icon: "check", onClick: salvarAvaria }, "Salvar avaria")) }, React.createElement("div", null, "Use quando achar uma avaria depois da chegada, por exemplo depois da lavagem."), React.createElement(AvariaEditor, { value: avarias || [avariaVazia()], onChange: x => { setAvarias(x); setErr(null); } }), err ? React.createElement("div", { style: { color: 'var(--danger-fg)', fontWeight: 700 } }, err) : null) : null, dlg === 'voltar' ? React.createElement(Dialog, {
    mobile: mobile,
    icon: "undo-2",
    tone: "danger",
    onClose: () => setDlg(null),
    title: 'Voltar o ' + nome + ' para “' + ds.ETAPA_LABEL[['previsto', 'loja', 'lavagem', 'preparacao', 'pronto', 'entregue'][['previsto', 'loja', 'lavagem', 'preparacao', 'pronto', 'entregue'].indexOf(v.etapa) - 1]] + '”?',
    actions: React.createElement(React.Fragment, null, React.createElement(Button, {
      variant: "secondary",
      onClick: () => setDlg(null)
    }, "Cancelar"), React.createElement(Button, {
      variant: "danger",
      icon: "undo-2",
      onClick: voltar
    }, "Voltar etapa"))
  }, React.createElement(TextField, {
    label: "Motivo",
    required: true,
    value: motivo,
    onChange: setMotivo,
    placeholder: "Ex.: cliente pediu para trocar a cor",
    error: err
  })) : null);
}
Object.assign(window, {
  Detalhe
});