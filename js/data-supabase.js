/* Painel de Veículos — dataService real (Supabase).
   Mesma assinatura do dataService simulado (ui_kits/painel/data.js). Requer supabase-js v2 e config.js. */
(function () {
  const cfg = window.PAINEL_CONFIG || {};
  if (!/^https:\/\//.test(cfg.SUPABASE_URL || '') || !window.supabase) { console.warn('Painel: config.js sem SUPABASE_URL/ANON_KEY'); return; }
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  const DOMINIO = 'painel-vmbyd.local';
  let ultimaSenha = null;
  const LOCALIZACOES = ['Estacionamento da loja (sujo)', 'Estacionamento da loja (venda cancelada)', 'Showroom', 'Deixado para lavar no Shopping Praia da Costa', 'Estacionamento da loja (limpo e pronto para preparo)', 'Carro em exposição (evento)', 'Carro emprestado para outra loja'];
  const LOC_HUB = 'No HUB / a caminho da loja';
  const ETAPA_LABEL = { previsto: 'Previsto', loja: 'Na loja', preparacao: 'Em preparação', pronto: 'Pronto', entregue: 'Entregue' };
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const TZ = 'America/Sao_Paulo';
  const pad = (n) => String(n).padStart(2, '0');
  const parts = (dt) => { const p = {}; new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(dt).forEach((x) => { p[x.type] = x.value; }); return p; };
  const fmt = (dt) => { if (!dt) return '—'; const p = parts(dt); return p.day + '/' + p.month + '/' + p.year + ' ' + p.hour + ':' + p.minute; };
  const fmtDia = (dt) => { if (!dt) return '—'; const p = parts(dt); return p.day + '/' + p.month; };
  const fmtHora = (dt) => { if (!dt) return '—'; const p = parts(dt); return p.hour + ':' + p.minute; };
  const fmtData = (dt) => { if (!dt) return '—'; const p = parts(dt); return p.day + '/' + p.month + '/' + p.year; };
  const diaKey = (dt) => { const p = parts(dt); return p.year + p.month + p.day; };
  const sameDay = (a, b) => a && b && diaKey(a) === diaKey(b);
  const toDate = (v) => (v ? new Date(String(v).length === 10 ? v + 'T12:00:00-03:00' : v) : null);
  const diasEntre = (a, b) => Math.floor((b - a) / 86400000);
  const semAcento = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normChassi = (s) => String(s || '').trim().toUpperCase().replace(/\s+/g, '');
  const CHASSI_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
  function gerarUsuario(nome, existentes) {
    const ps = semAcento(String(nome || '')).toLowerCase().trim().split(/\s+/).filter((p) => p && !['da', 'de', 'do', 'das', 'dos', 'e'].includes(p));
    if (!ps.length) return '';
    const base = (ps[0] + ps.slice(1).map((p) => p[0]).join('')).replace(/[^a-z0-9]/g, '');
    let u = base, n = 2; const ex = existentes || [];
    while (ex.includes(u)) u = base + (n++);
    return u;
  }
  function validarChassi(raw) {
    const c = normChassi(raw);
    if (!c) return 'Digite o chassi do carro.';
    if (c.length !== 17) return 'O chassi tem 17 caracteres e você digitou ' + c.length + '. Confira e tente de novo.';
    if (/[IOQ]/.test(c)) return 'Chassi não usa as letras I, O ou Q. Troque por 1 ou 0 e tente de novo.';
    if (!CHASSI_RE.test(c)) return 'O chassi só tem letras e números. Confira e tente de novo.';
    return null;
  }
  const senhaProvisoria = () => 'Byd' + Math.floor(1000 + Math.random() * 9000) + '!vv';
  const fail = (code, message) => Promise.reject(Object.assign(new Error(message), { code }));
  const sbErr = (e) => { const m = (e && (e.message || e.error_description)) || 'Não deu certo. Tente de novo.'; return Object.assign(new Error(m.replace(/^.*?ERROR:\s*/, '')), { code: 'erro' }); };
  const run = async (q) => { const { data, error } = await q; if (error) throw sbErr(error); return data; };

  /* ---------- cache ---------- */
  let session = null;
  const cache = { profiles: new Map(), schedules: new Map(), config: { dias_parado: 5, dias_manual_pendente: 7 }, loaded: false };
  async function loadRefs() {
    const [pr, sc, cf] = await Promise.all([run(sb.from('profiles').select('*')), run(sb.from('schedules').select('*')), run(sb.from('config').select('*'))]);
    cache.profiles = new Map(pr.map((p) => [p.id, p]));
    cache.schedules = new Map(sc.map((s) => [s.chassi, Object.assign({}, s, { data_hora_entrega: toDate(s.data_hora_entrega) })]));
    cf.forEach((c) => { cache.config[c.chave] = Number(c.valor); });
    cache.loaded = true;
  }
  const ensure = async () => { if (!cache.loaded) await loadRefs(); };
  const nomeDe = (id) => (cache.profiles.get(id) || {}).nome_completo || null;

  /* ---------- derivados (iguais ao protótipo) ---------- */
  function rowToV(r) {
    return Object.assign({}, r, {
      recebido_hub_em: toDate(r.recebido_hub_em), previsao_chegada_loja: toDate(r.previsao_chegada_loja), cadastrado_em: toDate(r.cadastrado_em),
      confirmado_pds_em: toDate(r.confirmado_pds_em), etapa_desde: toDate(r.etapa_desde), chegada_loja_em: toDate(r.chegada_loja_em), atualizado_em: toDate(r.atualizado_em)
    });
  }
  function alertasDo(v, s, NOW) {
    const out = [];
    if (v.etapa === 'entregue') return out;
    if (s && s.data_hora_entrega && v.etapa === 'previsto' && s.data_hora_entrega - NOW <= 48 * 3600000 && s.data_hora_entrega > NOW)
      out.push({ tipo: 'critico', sev: 0, frase: 'Entrega ' + (sameDay(s.data_hora_entrega, NOW) ? 'hoje' : sameDay(s.data_hora_entrega, new Date(NOW.getTime() + 86400000)) ? 'amanhã' : 'em ' + fmtDia(s.data_hora_entrega)) + ' às ' + fmtHora(s.data_hora_entrega) + ' e o carro ainda não chegou na loja' });
    const relevante = s || v.origem_cadastro === 'manual';
    if (relevante && v.etapa === 'previsto' && v.previsao_chegada_loja && v.previsao_chegada_loja < NOW)
      out.push({ tipo: 'previsao_vencida', sev: 1, frase: 'A previsão de chegada era ' + fmtDia(v.previsao_chegada_loja) + ' e o carro ainda não chegou na loja' });
    if (s && s.data_hora_entrega && sameDay(s.data_hora_entrega, NOW) && v.etapa !== 'pronto')
      out.push({ tipo: 'hoje_nao_pronto', sev: 1, frase: 'Entrega hoje às ' + fmtHora(s.data_hora_entrega) + ' e o carro ainda não está pronto' });
    if (v.etapa !== 'previsto' && v.etapa_desde && diasEntre(v.etapa_desde, NOW) > cache.config.dias_parado)
      out.push({ tipo: 'parado', sev: 2, frase: 'Parado há ' + diasEntre(v.etapa_desde, NOW) + ' dias em "' + ETAPA_LABEL[v.etapa] + '"' });
    return out;
  }
  function decorate(r) {
    const v = rowToV(r), NOW = new Date();
    const s = cache.schedules.get(v.chassi) || null;
    const emFluxo = v.etapa !== 'previsto' || !!s || v.origem_cadastro === 'manual';
    const alerts = [];
    const tags = [];
    if (s && s.data_hora_entrega && v.etapa !== 'entregue') tags.push({ label: 'Entrega agendada ' + fmtDia(s.data_hora_entrega) + ' ' + fmtHora(s.data_hora_entrega), tone: 'info', icon: 'calendar-check' });
    if (v.origem_cadastro === 'manual') tags.push(v.confirmado_pds_em ? { label: 'Confirmado pela PDS', tone: 'ok', icon: 'badge-check' } : { label: 'Cadastro manual', tone: 'warn', icon: 'pencil-line' });
    if (v.flag_data_invalida) tags.push({ label: 'Data inválida na origem', tone: 'danger', icon: 'calendar-x' });
    if (!emFluxo) tags.push({ label: 'Base PDS · ainda fora do fluxo da loja', tone: 'neutral', icon: 'file-spreadsheet' });
    if (!v.encontrado_ultima_carga && v.origem_cadastro === 'pds') tags.push({ label: 'Não encontrado na última carga', tone: 'neutral', icon: 'file-question' });
    const com = v.etapa === 'preparacao' || v.etapa === 'pronto' ? nomeDe(v.preparador_id) : v.etapa === 'entregue' ? v.entregador_nome : null;
    return Object.assign(v, {
      schedule: s, alerts: emFluxo ? alerts : [], tags, com_quem: com, _soBase: !emFluxo,
      manual_pendente: v.origem_cadastro === 'manual' && !v.confirmado_pds_em && v.cadastrado_em && diasEntre(v.cadastrado_em, NOW) > cache.config.dias_manual_pendente,
      localizacao_label: v.etapa === 'previsto' ? LOC_HUB : v.status_localizacao,
      dias_na_loja: v.chegada_loja_em ? diasEntre(v.chegada_loja_em, NOW) : null, preparador_nome: nomeDe(v.preparador_id)
    });
  }
  async function fluxoRows() {
    const desde = new Date(Date.now() - 14 * 86400000).toISOString();
    const agendados = Array.from(cache.schedules.keys());
    const [a, b] = await Promise.all([
      run(sb.from('vehicles').select('*').or('etapa.in.(loja,preparacao,pronto),and(etapa.eq.entregue,etapa_desde.gte.' + desde + '),and(etapa.eq.previsto,origem_cadastro.eq.manual)')),
      agendados.length ? run(sb.from('vehicles').select('*').eq('etapa', 'previsto').in('chassi', agendados.slice(0, 900))) : []
    ]);
    const m = new Map(); a.concat(b).forEach((r) => m.set(r.chassi, r));
    return Array.from(m.values()).map(decorate);
  }
  const noFluxo7 = (v) => v.etapa !== 'entregue' || diasEntre(v.etapa_desde, new Date()) <= 7;

  /* ---------- tempo real ---------- */
  const listeners = new Set();
  const emit = (e) => listeners.forEach((fn) => fn(e));
  let channel = null;
  function startRealtime() {
    if (channel) return;
    channel = sb.channel('painel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, (p) => {
        const n = p.new || {};
        emit({ table: 'vehicles', chassi: n.chassi, by: n.atualizado_por_nome, remote: !!(session && n.atualizado_por_id && n.atualizado_por_id !== session.id) });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => loadRefs().then(() => emit({ table: 'schedules' })))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadRefs().then(() => emit({ table: 'profiles' })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicle_events' }, (p) => emit({ table: 'vehicle_events', chassi: p.new.chassi }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'import_runs' }, () => emit({ table: 'import_runs' }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'import_issues' }, () => emit({ table: 'import_issues' }))
      .subscribe();
    window.addEventListener('online', () => loadRefs().then(() => emit({ table: 'reconnect' })));
  }

  async function profileFor(uid) { return run(sb.from('profiles').select('*').eq('id', uid).single()); }
  const rpc = async (fn, args) => { const { error } = await sb.rpc(fn, args); if (error) throw sbErr(error); };

  const dataService = {
    get NOW() { return new Date(); }, LOCALIZACOES, LOC_HUB, ETAPA_LABEL, DIAS, fmt, fmtDia, fmtHora, fmtData, gerarUsuario, validarChassi, normChassi,
    get SENHA_PROVISORIA() { return senhaProvisoria(); },
    sim: { erroAoCarregar: false },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    auth: {
      async restore() {
        ultimaSenha = null;
        const { data } = await sb.auth.getSession();
        if (!data.session) return null;
        try { const p = await profileFor(data.session.user.id); if (!p.ativo) { await sb.auth.signOut(); return null; } session = p; await loadRefs(); startRealtime(); return Object.assign({}, p); } catch (e) { return null; }
      },
      async signIn(usuario, senha) {
        const u = String(usuario || '').trim().toLowerCase();
        let data, error;
        try { ({ data, error } = await sb.auth.signInWithPassword({ email: u + '@' + DOMINIO, password: senha })); } catch (e) { error = e; }
        if (error && (/fetch|network|Failed/i.test(error.message || '') || error.status === 0 || error.name === 'AuthRetryableFetchError')) return fail('rede', 'Não conseguimos falar com o servidor. Confira a internet. Se continuar, avise o Administrador: o endereço do banco pode estar errado.');
        if (error) return /banned/i.test(error.message) ? fail('inativo', 'Seu acesso está desligado. Fale com a Supervisora ou o Administrador.') : fail('invalido', 'Usuário ou senha não conferem. Confira e tente de novo.');
        ultimaSenha = senha;
        const p = await profileFor(data.user.id);
        if (!p.ativo) { await sb.auth.signOut(); return fail('inativo', 'Seu acesso está desligado. Fale com a Supervisora ou o Administrador.'); }
        session = p; await loadRefs(); startRealtime();
        return { user: Object.assign({}, p) };
      },
      async signOut() { session = null; if (channel) { sb.removeChannel(channel); channel = null; } await sb.auth.signOut(); return true; },
      current() { return session ? Object.assign({}, session) : null; },
      async changePassword(atual, nova) {
        if (!session) return fail('sessao', 'Entre de novo.');
        if (!session.deve_trocar_senha) {
          const { error } = await sb.auth.signInWithPassword({ email: session.usuario + '@' + DOMINIO, password: atual });
          if (error) return fail('atual', 'A senha atual não confere.');
        }
        if (!nova || nova.length < 8) return fail('curta', 'A nova senha precisa ter pelo menos 8 caracteres.');
        const email = session.usuario + '@' + DOMINIO;
        const s0 = await sb.auth.getSession();
        if (!s0.data.session) {
          const senhaLogin = session.deve_trocar_senha ? ultimaSenha : atual;
          if (!senhaLogin) return fail('sessao', 'Sua sessão expirou. Saia, entre de novo com a senha provisória e troque a senha.');
          const re = await sb.auth.signInWithPassword({ email, password: senhaLogin });
          if (re.error) return fail('sessao', 'Sua sessão expirou. Saia, entre de novo e troque a senha.');
        }
        let { error } = await sb.auth.updateUser({ password: nova });
        if (error && /session missing|not authenticated|jwt/i.test(error.message || '') && ultimaSenha) {
          const re = await sb.auth.signInWithPassword({ email, password: session.deve_trocar_senha ? ultimaSenha : atual });
          if (!re.error) ({ error } = await sb.auth.updateUser({ password: nova }));
        }
        if (error) {
          const c = error.code || '', m = error.message || '';
          if (c === 'same_password' || /different|same/i.test(m)) return fail('curta', 'A nova senha precisa ser diferente da senha provisória (Trocar@123). Escolha outra.');
          if (c === 'weak_password' || /weak|least|characters/i.test(m)) return fail('curta', 'Essa senha é fraca. Use pelo menos 8 caracteres, com letras e números.');
          if (/reauth|nonce/i.test(m)) return fail('curta', 'Por segurança, saia e entre de novo antes de trocar a senha.');
          return fail('curta', 'Não deu para trocar a senha (' + m + '). Tente de novo.');
        }
        await rpc('marcar_senha_trocada'); session.deve_trocar_senha = false; ultimaSenha = nova; return true;
      }
    },
    vehicles: {
      async listFlow() { await ensure(); return (await fluxoRows()).filter(noFluxo7); },
      async search(q) {
        await ensure();
        const t = semAcento(String(q || '')).toUpperCase().replace(/\s+/g, '');
        if (t.length < 3) return [];
        let rows;
        if (/\d/.test(t)) rows = await run(sb.from('vehicles').select('*').ilike('chassi', '%' + t + '%').order('recebido_hub_em', { ascending: false, nullsFirst: false }).limit(30));
        else {
          const raw = String(q).trim();
          const porCliente = Array.from(cache.schedules.values()).filter((s) => semAcento(s.cliente || '').toUpperCase().includes(semAcento(raw).toUpperCase())).map((s) => s.chassi);
          const fluxo = (await fluxoRows()).filter((v) => semAcento(v.modelo).toUpperCase().replace(/\s+/g, '').includes(t)).map((v) => v.chassi);
          const ids = Array.from(new Set(porCliente.concat(fluxo))).slice(0, 60);
          rows = ids.length ? await run(sb.from('vehicles').select('*').in('chassi', ids)) : [];
        }
        return rows.map(decorate).sort((a, b) => (a._soBase - b._soBase));
      },
      async get(chassi) { await ensure(); const r = await run(sb.from('vehicles').select('*').eq('chassi', normChassi(chassi)).maybeSingle()); return r ? decorate(r) : null; },
      async events(chassi) { const r = await run(sb.from('vehicle_events').select('*').eq('chassi', normChassi(chassi)).order('criado_em', { ascending: false }).limit(200)); return r.map((e) => Object.assign(e, { criado_em: toDate(e.criado_em) })); },
      async options() {
        const fl = await fluxoRows();
        const base = ['Dolphin Mini', 'Dolphin GS', 'Song Pro', 'Song Plus', 'King', 'Yuan Pro', 'Seal'];
        const cores = ['BRANCO', 'CINZA', 'PRETO', 'AZUL', 'PRATA', 'VERDE'];
        const uniq = (arr) => Array.from(new Set(arr.filter((x) => x && x !== '—'))).sort();
        return { modelos: uniq(base.concat(fl.map((v) => v.modelo))), cores: uniq(cores.concat(fl.map((v) => v.cor))) };
      },
      async create({ chassi, modelo, cor, versao, previsao }) {
        const err = validarChassi(chassi); if (err) return fail('chassi', err);
        if (!modelo) return fail('modelo', 'Escolha o modelo do carro.'); if (!cor) return fail('cor', 'Escolha a cor do carro.');
        const p = previsao ? new Date(previsao.getTime() - previsao.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : null;
        const { error } = await sb.rpc('cadastrar_veiculo', { p_chassi: chassi, p_modelo: modelo, p_cor: cor, p_versao: versao || '', p_previsao: p });
        if (error) return /EXISTE/.test(error.message) ? fail('existe', 'Esse chassi já está no sistema. Abrimos o carro para você.') : fail('chassi', sbErr(error).message);
        return dataService.vehicles.get(chassi);
      },
      async confirmarChegada(c) { await rpc('confirmar_chegada', { p_chassi: c }); return dataService.vehicles.get(c); },
      async comecarPreparacao(c, prep) { await rpc('comecar_preparacao', { p_chassi: c, p_preparador: prep || session.id }); return dataService.vehicles.get(c); },
      async carroPronto(c) { await rpc('carro_pronto', { p_chassi: c }); return dataService.vehicles.get(c); },
      async entregar(c, ent) { await rpc('entregar', { p_chassi: c, p_entregador: ent }); return dataService.vehicles.get(c); },
      async voltarEtapa(c, motivo) { await rpc('voltar_etapa', { p_chassi: c, p_motivo: motivo }); return dataService.vehicles.get(c); },
      async setLocalizacao(c, loc) { await rpc('set_localizacao', { p_chassi: c, p_loc: loc }); return dataService.vehicles.get(c); }
    },
    async dashboard() {
      await ensure();
      const NOW = new Date(), all = await fluxoRows();
      const counts = { previsto: 0, loja: 0, preparacao: 0, pronto: 0, entregue: 0 };
      all.filter(noFluxo7).forEach((v) => counts[v.etapa]++);
      const naLoja = all.filter((v) => ['loja', 'preparacao', 'pronto'].includes(v.etapa));
      const porLocal = LOCALIZACOES.map((l) => ({ label: l, value: naLoja.filter((v) => v.status_localizacao === l).length }));
      const amanha = new Date(NOW.getTime() + 86400000);
      const entregas = all.filter((v) => v.schedule && v.schedule.data_hora_entrega && (sameDay(v.schedule.data_hora_entrega, NOW) || sameDay(v.schedule.data_hora_entrega, amanha))).sort((a, b) => a.schedule.data_hora_entrega - b.schedule.data_hora_entrega);
      const desde = new Date(NOW.getTime() - 14 * 86400000).toISOString();
      const recentes = (await run(sb.from('vehicles').select('chassi,etapa,etapa_desde,chegada_loja_em').gte('chegada_loja_em', desde))).map(rowToV);
      const semana = (ini, fim) => {
        const rec = recentes.filter((v) => v.chegada_loja_em >= ini && v.chegada_loja_em < fim).length;
        const ent = all.filter((v) => v.etapa === 'entregue' && v.etapa_desde >= ini && v.etapa_desde < fim && v.chegada_loja_em);
        const media = ent.length ? Math.round(ent.reduce((s, v) => s + (v.etapa_desde - v.chegada_loja_em) / 86400000, 0) / ent.length * 10) / 10 : 0;
        return { recebidos: rec, entregues: ent.length, media };
      };
      const d7 = new Date(NOW.getTime() - 7 * 86400000), d14 = new Date(NOW.getTime() - 14 * 86400000);
      return { counts, porLocal, entregas, alerts: [], semana: semana(d7, NOW), anterior: semana(d14, d7), sync: await dataService.sync.status() };
    },
    async alerts(pre) {
      await ensure();
      const all = Array.isArray(pre) ? pre : await fluxoRows();
      const out = [];
      all.forEach((v) => v.alerts.forEach((a) => out.push(Object.assign({ vehicle: v }, a))));
      const iss = await run(sb.from('import_issues').select('*').eq('tipo', 'sem_correspondencia').eq('resolvido', false));
      iss.forEach((i) => out.push({ tipo: 'sem_pds', sev: 3, frase: 'Chassi da agenda sem correspondência na base PDS', issue: i }));
      return out.sort((a, b) => a.sev - b.sev);
    },
    sync: {
      async status() {
        const r = await run(sb.from('import_runs').select('*').neq('status', 'rodando').order('iniciado_em', { ascending: false }).limit(20));
        const last = (f) => r.find((x) => x.fonte === f);
        const st = (x) => !x ? 'stale' : x.status === 'falhou' ? 'failed' : (Date.now() - new Date(x.iniciado_em) > 14 * 3600000 ? 'stale' : 'ok');
        const p = last('pds'), a = last('agenda');
        return { pdsAt: p ? fmtHora(new Date(p.iniciado_em)) : '--:--', pdsState: st(p), agendaAt: a ? fmtHora(new Date(a.iniciado_em)) : '--:--', agendaState: st(a) };
      },
      async enviarPlanilha(file, onProgress) { const r = await window.PainelImportador.importar(sb, file, onProgress); emit({ table: 'import_runs' }); emit({ table: 'vehicles' }); return r; },
      async runs() { return (await run(sb.from('import_runs').select('*').order('iniciado_em', { ascending: false }).limit(30))).map((x) => Object.assign(x, { iniciado_em: toDate(x.iniciado_em) })); }
    },
    issues: {
      async list() { return (await run(sb.from('import_issues').select('*').order('criado_em', { ascending: false }).limit(300))).map((i) => Object.assign(i, { resolvido_em: toDate(i.resolvido_em) })); },
      async resolve(id, chassiVinculado) { await rpc('resolver_pendencia', { p_id: id, p_vinculo: chassiVinculado || null }); emit({ table: 'import_issues' }); return true; }
    },
    users: {
      async list() { await loadRefs(); return Array.from(cache.profiles.values()).sort((a, b) => a.nome_completo.localeCompare(b.nome_completo)); },
      preview(nome) { return gerarUsuario(nome, Array.from(cache.profiles.values()).map((p) => p.usuario)); },
      async _admin(body) {
        const { data, error } = await sb.functions.invoke('admin-usuarios', { body });
        if (error) { let m = 'Não deu certo. Tente de novo.', code = 'erro'; try { const j = await error.context.json(); m = j.error.message; code = j.error.code; } catch (e) {} throw Object.assign(new Error(m), { code }); }
        await loadRefs(); emit({ table: 'profiles' }); return data;
      },
      async create({ nome, cargo, senha }) { return dataService.users._admin({ acao: 'criar', nome, cargo, senha }); },
      async setActive(id, ativo) { return dataService.users._admin({ acao: 'set_ativo', id, ativo }); },
      async resetPassword(id) { const senha = senhaProvisoria(); await dataService.users._admin({ acao: 'redefinir_senha', id, senha }); return senha; },
      async setCargo(id, cargo) { await rpc('set_cargo', { p_id: id, p_cargo: cargo }); await loadRefs(); emit({ table: 'profiles' }); return true; },
      async auditLog() {
        await ensure();
        const r = await run(sb.from('user_audit_log').select('*').order('criado_em', { ascending: false }).limit(300));
        const u = (id) => id ? ((cache.profiles.get(id) || {}).usuario || '?') : 'sistema';
        return r.map((a) => ({ id: a.id, acao: a.acao, criado_em: toDate(a.criado_em), frase: u(a.executor_id) + ' ' + a.acao + (a.acao.startsWith('redefiniu') ? ' ' : ' o usuário ') + u(a.alvo_id) + ' em ' + fmt(toDate(a.criado_em)) }));
      }
    },
    _setCargaFalhou() {}, _simulateRemote() {}
  };
  window.dataService = dataService;
})();
