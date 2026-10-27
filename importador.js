/* Painel de Veículos — importador das planilhas no navegador (SheetJS).
   Mesmas regras da Edge Function importar-planilha; o merge acontece no banco (importacao.sql). */
(function () {
  const RE = /^[A-HJ-NPR-Z0-9]{17}$/;
  /* MARCA = BYD na planilha, mas não é carro BYD desta loja: Toyota Yaris e a marca Denza. */
  const FORA = /(^|\s)(DENZA|YARIS)(\s|$)/;
  const T = (s) => String(s == null ? '' : s).trim().toUpperCase().replace(/\s+/g, ' ');
  const N = (s) => T(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const CH = (s) => String(s == null ? '' : s).trim().toUpperCase().replace(/\s+/g, '');
  const pad = (n) => String(n).padStart(2, '0');
  async function sha1(s) { const b = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join(''); }
  function parseData(v) {
    if (v === null || v === undefined || v === '') return null;
    if (v instanceof Date) return isNaN(v) ? 'X' : v.getFullYear() + '-' + pad(v.getMonth() + 1) + '-' + pad(v.getDate());
    if (typeof v === 'number') { if (v < 30000 || v > 60000) return 'X'; return new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000).toISOString().slice(0, 10); }
    const s = String(v).trim(); if (!s || s === '?') return null;
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/); if (!m) return 'X';
    let y = +m[3]; if (m[3].length === 2) y += 2000; const mo = +m[2], d = +m[1];
    if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return 'X';
    return y + '-' + pad(mo) + '-' + pad(d);
  }
  function pctBat(v) {
    if (v === null || v === undefined || v === '') return null;
    let n = typeof v === 'number' ? v : parseFloat(String(v).replace('%', '').replace(',', '.'));
    if (isNaN(n)) return null; if (n > 0 && n <= 1 && String(v).indexOf('%') < 0) n = n * 100;
    n = Math.round(n); return n >= 0 && n <= 100 ? n : null;
  }
  function parseHora(v) {
    if (typeof v === 'number') { const min = Math.round((v % 1) * 1440); return pad(Math.floor(min / 60) % 24) + ':' + pad(min % 60); }
    const m = String(v == null ? '' : v).trim().match(/^(\d{1,2})[:hH](\d{2})?/); return m ? pad(+m[1]) + ':' + (m[2] || '00') : null;
  }

  function lerPDS(wb) {
    const ws = wb.Sheets['HUB SERRA']; if (!ws) throw new Error('Não achamos a aba "HUB SERRA" nesse arquivo.');
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 3, raw: true, defval: '' });
    const head = (rows[0] || []).map(N); const col = (n) => head.indexOf(n);
    const C = { chassi: col('CHASSI'), marca: col('MARCA'), veiculo: col('VEICULO'), modelo: col('MODELO'), cor: col('COR'), rec: col('DATA DE RECEBIMENTO'), saida: col('DATA DE SAIDA'), placa: col('PLACA'), setor: col('SETOR'), bat: head.findIndex((h) => h.includes('BATERIA')) };
    if (C.chassi < 0 || C.marca < 0) throw new Error('A linha 4 da aba HUB SERRA não tem as colunas CHASSI e MARCA.');
    const st = { lidas: 0, rejeitadas: 0 }, issues = [], por = new Map();
    for (let i = 1; i < rows.length; i++) {
      try {
        const r = rows[i]; if (T(r[C.marca]) !== 'BYD') continue;
        if (FORA.test(T(r[C.veiculo]))) continue;
        st.lidas++;
        const bruto = String(r[C.chassi] == null ? '' : r[C.chassi]); const chassi = CH(bruto);
        if (!RE.test(chassi)) { st.rejeitadas++; issues.push({ chassi_bruto: bruto.trim() || '(linha ' + (i + 4) + ' sem chassi)', tipo: 'invalido', detalhe: chassi.length !== 17 ? 'Tem ' + chassi.length + ' caracteres (precisa de 17). Linha ' + (i + 4) + '.' : 'Tem letra que não existe em chassi (I, O ou Q). Linha ' + (i + 4) + '.' }); continue; }
        const rec = parseData(r[C.rec]), sai = parseData(r[C.saida]);
        const reg = { chassi, modelo: T(r[C.veiculo]) || '—', versao: C.modelo >= 0 ? T(r[C.modelo]) : '', cor: T(r[C.cor]), recebido_hub_em: rec === 'X' ? null : rec, previsao_chegada_loja: sai === 'X' ? null : sai, flag_data_invalida: sai === null || sai === 'X', placa: C.placa >= 0 ? T(r[C.placa]) : '', setor: C.setor >= 0 ? T(r[C.setor]) : '', bateria_hub: C.bat >= 0 ? pctBat(r[C.bat]) : null, _mal: sai === 'X' ? String(r[C.saida]) : null, _l: i + 4 };
        const ant = por.get(chassi);
        if (ant) { issues.push({ chassi_bruto: chassi, tipo: 'duplicado', detalhe: 'Aparece mais de uma vez (linhas ' + ant._l + ' e ' + reg._l + '). Mantivemos a de recebimento mais recente.' }); if (String(reg.recebido_hub_em || '') <= String(ant.recebido_hub_em || '')) continue; }
        por.set(chassi, reg);
      } catch (e) { st.rejeitadas++; }
    }
    const linhas = [];
    por.forEach((r) => { if (r._mal) issues.push({ chassi_bruto: r.chassi, tipo: 'data_invalida', detalhe: 'DATA DE SAÍDA veio como "' + r._mal + '" (linha ' + r._l + '). A previsão ficou vazia.' }); delete r._mal; delete r._l; linhas.push(r); });
    return { linhas, issues, st };
  }

  const COLS = ['DATA', 'HORA', 'MODELO', 'COR', 'CHASSI', 'CLIENTE', 'VENDEDOR', 'ACESSORIOS', 'ENTREGADOR', 'STATUS', 'LOCALIZACAO'];
  function lerAgenda(wb) {
    const st = { lidas: 0, rejeitadas: 0 }, issues = [], agenda = new Map();
    const fmt = (iso) => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + ' ' + iso.slice(11, 16) : 'sem data';
    wb.SheetNames.forEach((aba) => {
      if (N(aba).includes('MODELO')) return;
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[aba], { header: 1, raw: true, defval: '' });
      const blocos = [];
      let ultimoMapa = { DATA: 0, HORA: 1, COR: 3, CHASSI: 4, CLIENTE: 5, VENDEDOR: 6, ACESSORIOS: 7, ENTREGADOR: 8, STATUS: 9, LOCALIZACAO: 10 };
      rows.forEach((r, i) => {
        const cells = r.map(N);
        if (cells.includes('CHASSI') || (cells.includes('DATA') && cells.includes('HORA'))) {
          /* Muitos blocos repetem só "DATA | HORA" no cabeçalho: herdamos as colunas do último cabeçalho completo da aba (ou o padrão A–L). */
          const map = Object.assign({}, ultimoMapa); cells.forEach((c, j) => { if (COLS.includes(c)) map[c] = j; });
          if (cells.includes('CHASSI')) ultimoMapa = map;
          blocos.push({ map, modelo: cells.includes('MODELO') ? cells.indexOf('MODELO') : (cells[2] === '' ? 2 : -1), linhas: [] });
        }
        else if (blocos.length) blocos[blocos.length - 1].linhas.push(i);
      });
      blocos.forEach((b) => {
        try {
          const dc = b.map.DATA != null ? b.map.DATA : 0; let dataBloco = null;
          for (const i of b.linhas) { const p = parseData(rows[i][dc]); if (p && p !== 'X') { dataBloco = p; break; } }
          for (const i of b.linhas) {
            const r = rows[i]; const bruto = String(r[b.map.CHASSI] == null ? '' : r[b.map.CHASSI]).trim(); if (!bruto) continue;
            const chassi = CH(bruto);
            if (!RE.test(chassi)) { if (/^[A-Z0-9]{10,}$/.test(chassi)) { st.rejeitadas++; issues.push({ chassi_bruto: bruto, tipo: 'invalido', detalhe: 'Aba "' + aba + '": chassi com ' + chassi.length + ' caracteres ou letra inválida.' }); } continue; }
            st.lidas++;
            const g = (k) => (b.map[k] !== undefined ? String(r[b.map[k]] == null ? '' : r[b.map[k]]).trim() : '');
            const hora = parseHora(r[b.map.HORA]) || '00:00';
            const reg = { chassi, data_hora_entrega: dataBloco ? dataBloco + 'T' + hora + ':00-03:00' : null, cliente: g('CLIENTE').toUpperCase(), vendedor: g('VENDEDOR'), acessorios: g('ACESSORIOS'), entregador_sugerido: g('ENTREGADOR'), situacao_agenda: g('STATUS') || g('LOCALIZACAO'), aba_origem: aba, _modelo: b.modelo >= 0 ? String(r[b.modelo] || '').trim() : '' };
            const ant = agenda.get(chassi);
            if (!ant || String(reg.data_hora_entrega || '') > String(ant.data_hora_entrega || '')) agenda.set(chassi, reg); // CONTATO nunca é lido (LGPD)
          }
        } catch (e) { st.rejeitadas++; }
      });
    });
    const linhas = [];
    agenda.forEach((r) => { r.resumo = 'Está na agenda (aba "' + r.aba_origem + '", entrega ' + fmt(r.data_hora_entrega) + ' · ' + (r.cliente || 'sem cliente') + (r._modelo ? ' · ' + r._modelo : '') + ') mas não existe na base PDS.'; delete r._modelo; linhas.push(r); });
    return { linhas, issues, st };
  }

  function lerMov(wb) {
    const st = { lidas: 0, rejeitadas: 0 }, issues = [], por = new Map();
    const normStatus = (x) => { const t = N(x); if (!t) return ''; if (/^SOL[IC]*TADO$|SOLCITADO/.test(t)) return 'SOLICITADO'; if (/GU[IN]*[CN]*HO/.test(t)) return 'GUINCHO EXTRA'; if (/TRANSITO/.test(t)) return 'EM TRANSITO'; if (/^EM VV/.test(t)) return 'EM VV'; if (/^SOLICITAR/.test(t)) return t.includes('NF') ? 'SOLICITAR COM NF' : 'SOLICITAR'; return t; };
    wb.SheetNames.forEach((aba) => {
      if (/^\s*20\d\d\s*$/.test(aba)) return; // aba de histórico (ex.: "2025") é ignorada
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[aba], { header: 1, raw: true, defval: '' });
      const hi = rows.slice(0, 6).findIndex((r) => r.map(N).includes('CHASSI')); if (hi < 0) return;
      const head = rows[hi].map(N); const c = (k) => head.findIndex((h) => h.includes(k));
      const C = { vend: c('VENDEDOR'), mod: c('MODELO'), ch: c('CHASSI'), cor: c('COR'), st: c('STATUS'), sol: c('DATA SOL'), cham: c('CHAMADO'), prev: c('PREVIS'), ent: c('DATA ENTREGA'), vv: c('ENTREGUE'), obs: c('OBSERV') };
      if (C.obs < 0) C.obs = C.vv >= 0 ? C.vv + 1 : -1;
      for (let i = hi + 1; i < rows.length; i++) {
        try {
          const r = rows[i]; const bruto = String(r[C.ch] == null ? '' : r[C.ch]).trim(); if (!bruto) continue;
          st.lidas++; const chassi = CH(bruto);
          if (!RE.test(chassi)) { st.rejeitadas++; issues.push({ chassi_bruto: bruto, tipo: 'invalido', detalhe: 'Movimentação, aba "' + aba + '", linha ' + (i + 1) + ': chassi com ' + chassi.length + ' caracteres ou letra inválida.' }); continue; }
          const d = (k) => { const p = C[k] >= 0 ? parseData(r[C[k]]) : null; return p === 'X' ? null : p; };
          const vv = C.vv >= 0 ? N(r[C.vv]) : '';
          por.set(chassi, { chassi, modelo: C.mod >= 0 ? T(r[C.mod]) : '', cor: C.cor >= 0 ? T(r[C.cor]) : '', vendedor: C.vend >= 0 ? T(r[C.vend]) : '', status: C.st >= 0 ? normStatus(r[C.st]) : '', data_solicitacao: d('sol'), chamado: C.cham >= 0 ? String(r[C.cham] || '').replace(/\.0$/, '').trim() : '', previsao_entrega: d('prev'), data_entrega: d('ent'), entregue_vv: vv === 'SIM' ? true : vv.startsWith('NAO') ? false : null, observacao: C.obs >= 0 ? String(r[C.obs] || '').trim() : '', aba_origem: aba });
        } catch (e) { st.rejeitadas++; }
      }
    });
    return { linhas: Array.from(por.values()), issues, st };
  }

  async function importar(sb, file, onProgress) {
    const prog = onProgress || function () {};
    prog('Lendo a planilha…', 0);
    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array', cellDates: false });
    const ehMov = wb.SheetNames.some((n) => { const rr = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '', range: 0 }).slice(0, 3); return rr.some((r) => r.some((c) => N(c).includes('MOVIMENTACAO DE VEICULOS'))); });
    const fonte = wb.Sheets['HUB SERRA'] ? 'pds' : ehMov ? 'mov' : wb.SheetNames.some((n) => !N(n).includes('MODELO')) ? 'agenda' : null;
    if (!fonte) throw new Error('Não reconhecemos esse arquivo. Envie a HUB SERRA, a MOVIMENTAÇÃO DE VEÍCULOS ou a AGENDA DE ENTREGA.');
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    const call = async (fn, args, tentativas) => {
      let ultimo;
      for (let t = 0; t < (tentativas || 4); t++) {
        try {
          const { data, error } = await sb.rpc(fn, args);
          if (!error) return data;
          ultimo = new Error(error.message);
          if (!/fetch|timeout|network|canceling statement|503|502|504/i.test(error.message || '')) throw ultimo;
        } catch (e) { ultimo = e; if (!/fetch|timeout|network|canceling statement/i.test(String(e.message || e))) throw e; }
        await espera(1500 * (t + 1));
      }
      throw new Error('A conexão caiu várias vezes seguidas (' + (ultimo && ultimo.message) + '). Confira a internet e envie de novo — o que já entrou não duplica.');
    };
    const run = await call('importar_iniciar', { p_fonte: fonte, p_arquivo: 'tela/' + file.name });
    const tot = { lidas: 0, inseridas: 0, atualizadas: 0, inalteradas: 0, rejeitadas: 0 };
    try {
      const res = fonte === 'pds' ? lerPDS(wb) : fonte === 'mov' ? lerMov(wb) : lerAgenda(wb);
      tot.lidas = res.st.lidas; tot.rejeitadas = res.st.rejeitadas;
      for (const r of res.linhas) {
        r.hash = await sha1(fonte === 'pds' ? [r.chassi, r.modelo, r.versao, r.cor, r.recebido_hub_em, r.previsao_chegada_loja, r.flag_data_invalida, r.placa, r.setor, r.bateria_hub].join('|') : fonte === 'mov' ? [r.chassi, r.status, r.vendedor, r.data_solicitacao, r.chamado, r.previsao_entrega, r.data_entrega, r.entregue_vv, r.observacao].join('|') : [r.chassi, r.data_hora_entrega, r.cliente, r.vendedor, r.acessorios, r.entregador_sugerido, r.situacao_agenda].join('|'));
      }
      const L = fonte === 'pds' ? 150 : 100;
      for (let i = 0; i < res.linhas.length; i += L) {
        prog((fonte === 'pds' ? 'Gravando carros' : fonte === 'mov' ? 'Gravando movimentações' : 'Gravando agenda') + ' (' + Math.min(i + L, res.linhas.length) + ' de ' + res.linhas.length + ')…', i / res.linhas.length);
        const s = await call(fonte === 'pds' ? 'importar_pds_lote' : fonte === 'mov' ? 'importar_mov_lote' : 'importar_agenda_lote', { p_run: run, p_rows: res.linhas.slice(i, i + L) });
        tot.inseridas += s.inseridas; tot.atualizadas += s.atualizadas; tot.inalteradas += s.inalteradas;
      }
      for (let i = 0; i < res.issues.length; i += 200) await call('importar_pendencias', { p_run: run, p_fonte: fonte, p_issues: res.issues.slice(i, i + 200) });
      prog('Finalizando…', 1);
      await call('importar_finalizar', { p_run: run, p_status: 'ok', p_stats: tot, p_vistos: null });
      return Object.assign({ fonte, pendencias: res.issues.length }, tot);
    } catch (e) {
      await call('importar_finalizar', { p_run: run, p_status: 'falhou', p_stats: tot, p_erro: String(e.message || e) }).catch(() => null);
      throw e;
    }
  }
  window.PainelImportador = { importar, _ler: { lerPDS, lerMov, lerAgenda } };
})();
