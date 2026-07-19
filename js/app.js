document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initApp();
});

function resetarTelaLogin() {
  const iniciaisEl = document.getElementById('login-initials');
  if (iniciaisEl) {
    iniciaisEl.textContent = '?';
    iniciaisEl.style.background = 'var(--bg-4)';
    iniciaisEl.style.color = 'var(--text-2)';
    iniciaisEl.style.fontSize = '14px';
  }
  const nomeEl = document.querySelector('.login-brand .brand-name');
  if (nomeEl) nomeEl.textContent = 'Plano de Treino';
  const subEl = document.querySelector('.login-brand .brand-sub');
  if (subEl) subEl.textContent = 'Faça login para continuar';
  // Reseta botão de login
  const btnLogin = document.getElementById('btn-login');
  if (btnLogin) { btnLogin.textContent = 'Entrar'; btnLogin.disabled = false; }
  // Limpa campos
  const emailEl = document.getElementById('login-email');
  if (emailEl) emailEl.value = '';
  const passEl = document.getElementById('login-password');
  if (passEl) passEl.value = '';
  const errEl = document.getElementById('login-error');
  if (errEl) errEl.textContent = '';
}

async function initApp() {
  resetarTelaLogin();
  initLoginForm();
  const logado = await restoreSession();
  if (logado) {
    mostrarApp();
  } else {
    document.getElementById('login-overlay').style.display = 'flex';
  }
}

async function mostrarApp() {
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('main-app').style.display = 'grid';
  const perfil = getPerfilUsuario();
  if (perfil) {
    // Atualiza nome e iniciais APENAS no sidebar (não na tela de login)
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      const iniciaisEl = sidebar.querySelector('.brand-initials');
      if (iniciaisEl) iniciaisEl.textContent = perfil.iniciais;
      const nomeEl = sidebar.querySelector('.brand-name');
      if (nomeEl) nomeEl.textContent = perfil.nome;
      const subEl = sidebar.querySelector('.brand-sub');
      if (subEl) subEl.textContent = 'Plano de Fortalecimento';
    }
    const badge = document.getElementById('user-badge');
    if (badge) badge.textContent = '';
    document.title = `Plano de Treino · ${perfil.nome}`;

    // Esconde race card para Ritieli
    const raceCard = document.querySelector('.race-card');
    if (raceCard) raceCard.style.display = isRitieli() ? 'none' : '';
  }
  initNav();
  initLogout();
  initModal();
  setTodayDate();
  mostrarLoading(true);
  await Promise.all([carregarDados(), carregarTreinos()]);
  mostrarLoading(false);
  initCountdown();
  initRegistrar();
  initHistorico();
  initRelatorio();
  initEvolucao();
  renderDashboard();
}

async function carregarDados() {
  mostrarLoading(true);
  await fetchSessoes();
  mostrarLoading(false);
}

function initLoginForm() {
  const overlay = document.getElementById('login-overlay');
  overlay.style.display = 'none';

  document.getElementById('btn-login').addEventListener('click', async () => {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl    = document.getElementById('login-error');
    errEl.textContent = '';

    if (!email || !password) { errEl.textContent = 'Preencha e-mail e senha.'; return; }

    const btn = document.getElementById('btn-login');
    btn.textContent = 'Entrando...';
    btn.disabled = true;

    try {
      await loginSupabase(email, password);
      await mostrarApp();
    } catch(e) {
      errEl.textContent = 'E-mail ou senha incorretos.';
      btn.textContent = 'Entrar';
      btn.disabled = false;
    }
  });

  // Enter no campo de senha
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-login').click();
  });
}

function mostrarLoading(show) {
  let el = document.getElementById('loading-bar');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-bar';
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;height:3px;background:var(--accent);z-index:9999;transition:opacity 0.3s';
    document.body.appendChild(el);
  }
  el.style.opacity = show ? '1' : '0';
}

// ── NAV ──────────────────────────────────────────────────────
function initLogout() {
  const btn = document.getElementById('btn-logout');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!confirm('Deseja sair?')) return;
    logoutLocal();
    document.getElementById('main-app').style.display = 'none';
    resetarTelaLogin();
    document.getElementById('login-overlay').style.display = 'flex';
  });
}

function initNav() {
  console.log('initNav executado. Botões encontrados:', document.querySelectorAll('.nav-btn').length);
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('CLIQUE detectado na aba:', btn.dataset.page);
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('page-' + btn.dataset.page).classList.add('active');
      if (btn.dataset.page === 'dashboard') { carregarDados().then(renderDashboard); }
      if (btn.dataset.page === 'historico') { carregarDados().then(() => renderHistorico()); }
      if (btn.dataset.page === 'evolucao') {
        console.log('Chamando carregarEvolucao...');
        carregarEvolucao();
      }
    });
  });
}

// ── TEMA ─────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('runner_tema') || 'dark';
  if (saved === 'light') document.body.classList.add('light');
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    localStorage.setItem('runner_tema', isLight ? 'light' : 'dark');
  });
}

// ── COUNTDOWN ────────────────────────────────────────────────
function initCountdown() {
  if (isRitieli()) {
    const week = currentWeekNumberRitieli();
    document.getElementById('phase-badge').textContent = `Semana ${week} de 7 — Plano da Ritieli`;
    return;
  }
  const days = daysUntilRace();
  document.getElementById('days-num').textContent = days;
  const total = Math.ceil((RACE_DATE - getPlanStart()) / 86400000);
  const pct = Math.min(100, Math.round((total - days) / total * 100));
  document.getElementById('countdown-bar').style.width = pct + '%';
  const ph = currentPhase();
  document.getElementById('phase-badge').textContent = ph.nome + ' — ' + ph.desc;
}

// ── DASHBOARD ────────────────────────────────────────────────
function renderDashboard() {
  const db     = getDB();
  const planStartStr3 = getPlanStart().toISOString().split('T')[0];
  const dbFiltrado = db.filter(x => x.data >= planStartStr3);
  const feitos = dbFiltrado.filter(x => x.tipo !== 'skip');
  const pul    = dbFiltrado.filter(x => x.tipo === 'skip');
  const mins   = feitos.reduce((a,x) => a + (parseInt(x.duracao)||0), 0);
  const sem    = new Set(dbFiltrado.map(x => Math.floor(new Date(x.data) / (7*86400000)))).size;

  document.getElementById('m-feitos').textContent  = feitos.length;
  document.getElementById('m-pulados').textContent = pul.length;
  document.getElementById('m-minutos').textContent = mins;
  document.getElementById('m-semanas').textContent = sem;

  const cA = db.filter(x => x.tipo==='A').length;
  const cB = db.filter(x => x.tipo==='B').length;
  const cCasa = db.filter(x => x.tipo==='CASA').length;
  const metaSessoes = isRitieli() ? 7 : 13;
  // Filtrar sessões apenas do ciclo atual (após plan_start)
  const planStart = getPlanStart();
  const planStartStr = planStart.toISOString().split('T')[0];
  const dbCicloAtual = db.filter(x => x.data >= planStartStr);
  const cA_ciclo = dbCicloAtual.filter(x => x.tipo==='A').length;
  const cB_ciclo = dbCicloAtual.filter(x => x.tipo==='B').length;
  document.getElementById('cnt-a').textContent = cA_ciclo+'/'+metaSessoes;
  document.getElementById('cnt-b').textContent = cB_ciclo+'/'+metaSessoes;
  document.getElementById('bar-a').style.width = Math.min(100,Math.round(cA_ciclo/metaSessoes*100))+'%';
  document.getElementById('bar-b').style.width = Math.min(100,Math.round(cB_ciclo/metaSessoes*100))+'%';
  // Atualiza nomes dos grupos conforme o usuário
  const treinosAtivos = getTreinosAtivos();
  const labelA = document.getElementById('prog-label-a');
  const labelB = document.getElementById('prog-label-b');
  if (labelA) labelA.textContent = treinosAtivos['A']?.desc || 'Treino A';
  if (labelB) labelB.textContent = treinosAtivos['B']?.desc || 'Treino B';

  // Atualizar subtítulo do progresso
  const planoSub = document.getElementById('plano-sub');
  if (planoSub && !isRitieli()) planoSub.textContent = '13 semanas · 26 sessões';
  if (planoSub && isRitieli()) planoSub.textContent = '7 semanas · 14 sessões';
  const casaBlock = document.getElementById('m-casa');
  if (casaBlock) {
    casaBlock.textContent = cCasa;
    const extraBlock = casaBlock.closest('.extra-block');
    if (extraBlock) extraBlock.style.display = isRitieli() ? 'none' : '';
  }
  const tot = cA+cB+pul.length;
  const feitos_ciclo = cA_ciclo + cB_ciclo;
  const tot_ciclo = feitos_ciclo + dbFiltrado.filter(x=>x.tipo==='skip').length;
  document.getElementById('adh-val').textContent = tot_ciclo>0 ? Math.round(feitos_ciclo/tot_ciclo*100)+'%' : '--%';

  // week view
  const wEl  = document.getElementById('week-view');
  const days = ['D','S','T','Q','Q','S','S'];
  let wHtml  = '';
  for (let w=3;w>=0;w--) {
    const start = getWeekStart(w);
    wHtml += `<div class="week-row"><span class="week-label">${start.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span><div class="day-dots">`;
    for (let d=0;d<7;d++) {
      const dt=new Date(start); dt.setDate(dt.getDate()+d);
      const ds=dt.toISOString().split('T')[0];
      const s=dbFiltrado.find(x=>x.data===ds);
      let cls='day-dot';
      if (s) cls += s.tipo==='A' ? ' done-a' : s.tipo==='B' ? ' done-b' : s.tipo==='CASA' ? ' done-casa' : ' skip';
      wHtml += `<div class="${cls}" title="${ds}">${days[d]}</div>`;
    }
    wHtml += '</div></div>';
  }
  wEl.innerHTML = wHtml;

  // last loads
  const lEl  = document.getElementById('last-loads');
  const ults = feitos.slice(-3).reverse(); // feitos já vem de dbFiltrado
  if (!ults.length) { lEl.innerHTML='<div class="empty">Nenhuma sessão registrada ainda</div>'; return; }
  lEl.innerHTML = ults.map(s => {
    const exs   = s.exercicios || {};
    const lista = Object.entries(exs).filter(([k]) => !k.endsWith('_reps')).map(([k,v]) => {
      const ex = getExercicioInfo(k) || allExercises().find(e => e.id===k); if(!ex) return '';
      const resumo = Array.isArray(v) ? v.map((x,i)=>`S${i+1}:${x||'—'}`).join(' ') : (v||'—');
      return `${ex.nome}: ${resumo} ${ex.unidade}`;
    }).filter(Boolean).join(' · ');
    const badge = s.tipo==='A' ? '<span class="badge badge-a">TREINO A</span>'
                : s.tipo==='B' ? '<span class="badge badge-b">TREINO B</span>'
                : s.tipo==='CASA' ? '<span class="badge badge-casa">TREINO CASA</span>'
                : '<span class="badge badge-skip">PULADO</span>';
    return `<div class="load-item">
      <div class="load-date">${fmtDate(s.data)}</div>
      <div class="load-body">
        <div class="load-title">${badge}${s.duracao?`<span style="font-size:11px;color:var(--text-3)">${s.duracao}min</span>`:''}${s.feeling?`<span class="badge badge-feel">${s.feeling}</span>`:''}</div>
        <div class="load-detail">${lista||'<em style="opacity:.5">Sem cargas registradas</em>'}</div>
      </div>
    </div>`;
  }).join('');
}

// ── TREINO & REGISTRO ────────────────────────────────────────
function initRegistrar() {
  document.getElementById('reg-date').value = new Date().toISOString().split('T')[0];

  // Preencher select com treinos do banco
  const select = document.getElementById('reg-tipo');
  const treinosAtivos = getTreinosAtivos();
  // Remover opções antigas exceto skip
  Array.from(select.options).forEach(opt => {
    if (opt.value !== 'skip') opt.remove();
  });
  // Adicionar treinos do banco na ordem A, B + CASA para Bruno
  const ordem = Object.keys(treinosAtivos).sort();
  ordem.forEach(tipo => {
    const t = treinosAtivos[tipo];
    const opt = document.createElement('option');
    opt.value = tipo;
    opt.textContent = `${t.nome} — ${t.desc}`;
    select.insertBefore(opt, select.querySelector('option[value="skip"]'));
  });

  document.getElementById('reg-tipo').addEventListener('change', renderTreinoRegistro);
  renderTreinoRegistro();
}

function renderTreinoRegistro() {
  const tipo = document.getElementById('reg-tipo').value;
  const el   = document.getElementById('treino-registro-content');

  if (tipo === 'skip') {
    el.innerHTML = `<div class="card">
      <div class="form-group"><label>Motivo (opcional)</label><textarea id="skip-motivo" rows="3" placeholder="Ex: cansaço, agenda cheia, dor..."></textarea></div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="salvarSessao()">Salvar</button>
        <button class="btn btn-ghost" onclick="limparForm()">Limpar</button>
      </div>
    </div>`;
    return;
  }

  const treinosAtivos = getTreinosAtivos();
  const t   = treinosAtivos[tipo];
  const wup = getWarmupAtivo(tipo === 'CASA' ? 'B' : tipo);
  const db  = getDB();
  const ult = db.filter(x => x.tipo === tipo).slice(-1)[0];
  const ph  = currentPhase();
  const exInfoMap = tipo === 'CASA' ? EXERCICIOS_CASA : DB_EXERCICIOS;

  let html = '';

  // fase
  const faseLabel = tipo === 'CASA' ? 'TREINO ESPECIAL' : 'FASE ATUAL';
  const faseDesc  = tipo === 'CASA' ? 'Ativação em casa — sem equipamento.' : `${ph.nome} — ${ph.desc}`;
  html += `<div class="fase-block"><span class="fase-tag">${faseLabel}</span><span class="fase-desc">${faseDesc}</span></div>`;

  // aquecimento (só A e B)
  if (wup && tipo !== 'CASA') {
    html += `<div class="warmup-card warm"><div class="warmup-title"><span>🔥</span> Aquecimento (8–10 min)</div>`;
    wup.aquecimento.forEach((item,i) => {
      html += `<div class="warmup-item"><span class="warmup-num">${i+1}</span><div class="warmup-item-info"><div class="warmup-item-name">${item.nome}</div><div class="warmup-item-detail">${item.detalhe}</div></div></div>`;
    });
    html += '</div>';
  }

  // exercícios
  html += `<div class="card"><div class="card-header"><h2>${t.nome}</h2><span class="card-sub">${t.desc}</span></div>`;

  t.exercicios.forEach((id, idx) => {
    const e       = exInfoMap[id];
    const prog    = tipo !== 'CASA' ? getProgressaoAtiva(id) : null;
    const numSer  = prog ? prog.series : (parseInt(e.series) || 3);

    // Esconde exercício se series=0 (ainda não chegou a semana dele)
    if (numSer === 0) return;

    const prevArr = ult?.exercicios?.[id];
    const prev    = Array.isArray(prevArr) ? prevArr : [];

    const recBadge = prog ? `<div class="rec-block">
      <span class="rec-label">SEMANA ${isRitieli() ? currentWeekNumberRitieli() : currentWeekNumber()}</span>
      <span class="rec-carga">${prog.carga_ref}</span>
      <span class="rec-reps">${prog.series} séries · ${prog.reps}</span>
      ${prog.obs ? `<span class="rec-obs">${prog.obs}</span>` : ''}
    </div>` : '';

    const modalFn = tipo === 'CASA' ? `openModalCasa('${id}')` : `openModal('${id}')`;

    html += `<div class="ex-reg-block">
      <div class="ex-reg-header">
        <span class="ex-reg-num">${String(idx+1).padStart(2,'0')}</span>
        <div class="ex-reg-info">
          <div class="ex-reg-name">${e.nome}</div>
          <div class="ex-reg-meta">${e.musculos.join(' · ')}</div>
        </div>
        <div class="ex-reg-pills">
          <span class="ex-pill highlight">${numSer} séries</span>
          <span class="ex-pill">${prog ? prog.reps : e.reps}</span>
          <span class="ex-pill">${e.descanso} desc.</span>
        </div>
        <button class="btn-info" onclick="${modalFn}">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Como fazer
        </button>
      </div>
      ${recBadge}
      <div class="series-grid">
        <div class="series-col-header"><span>Série</span><span>Reps</span><span>${e.unidade}</span>${prev.length ? '<span class="prev-label">anterior</span>' : ''}</div>`;

    for (let s = 0; s < numSer; s++) {
      const prevVal = prev[s] || '';
      // Preenche reps sugeridas automaticamente
      const repSugerida = prog
        ? (prog.reps.split('/')[s] || prog.reps.split('–')[0] || prog.reps).replace(/[^0-9]/g, '')
        : e.reps.replace(/[^0-9]/g, '');
      html += `<div class="series-row">
        <span class="series-num">S${s+1}</span>
        <input type="number" class="series-reps" id="rep-${id}-${s}" value="${repSugerida}" min="1" step="1">
        <input type="number" class="series-peso" id="peso-${id}-${s}" placeholder="${prevVal || '—'}" min="0" step="0.5">
        ${prev.length ? `<span class="series-prev">${prevVal || '—'} ${prevVal ? e.unidade : ''}</span>` : ''}
      </div>`;
    }
    html += `</div></div>`;
  });

  // campos finais
  html += `
    <div class="form-row" style="margin-top:1.25rem;padding-top:1.25rem;border-top:1px solid var(--border)">
      <div class="form-group" style="margin-bottom:0"><label>Duração (min)</label><input type="number" id="reg-duracao" placeholder="Ex: 52" min="1" max="120"></div>
      <div class="form-group" style="margin-bottom:0"><label>Como foi?</label>
        <select id="reg-feeling">
          <option value="">— opcional —</option>
          <option value="ótimo">💪 Ótimo</option>
          <option value="bom">👍 Bom</option>
          <option value="ok">😐 Ok</option>
          <option value="pesado">😓 Pesado</option>
          <option value="horrível">💀 Horrível</option>
        </select>
      </div>
    </div>
    <div class="form-group" style="margin-top:12px"><label>Observações</label><textarea id="reg-obs" rows="2" placeholder="Ex: lombar ok, glúteo esquerdo mais fraco..."></textarea></div>
    <div class="form-actions">
      <button class="btn btn-primary" onclick="salvarSessao()">Salvar sessão</button>
      <button class="btn btn-ghost" onclick="limparForm()">Limpar</button>
    </div>
  </div>`;

  // alongamento (só A e B)
  if (wup && tipo !== 'CASA') {
    html += `<div class="warmup-card cool"><div class="warmup-title"><span>❄️</span> Alongamento final (5 min)</div>`;
    wup.alongamento.forEach((item,i) => {
      html += `<div class="warmup-item"><span class="warmup-num">${i+1}</span><div class="warmup-item-info"><div class="warmup-item-name">${item.nome}</div><div class="warmup-item-detail">${item.detalhe}</div></div></div>`;
    });
    html += '</div>';
  }

  el.innerHTML = html;
}

async function salvarSessao() {
  const data = document.getElementById('reg-date').value;
  const tipo = document.getElementById('reg-tipo').value;
  if (!data) { toast('Selecione a data','error'); return; }

  const exs = {};
  const exInfoMap = tipo === 'CASA' ? EXERCICIOS_CASA : DB_EXERCICIOS;
  const treinosAtivos = getTreinosAtivos();
  const exercicios = tipo !== 'skip' ? treinosAtivos[tipo]?.exercicios || [] : [];

  exercicios.forEach(id => {
    const e      = exInfoMap[id];
    const numSer = parseInt(e?.series) || 3;
    const arr    = [], repsArr = [];
    for (let s=0;s<numSer;s++) {
      arr.push(document.getElementById(`peso-${id}-${s}`)?.value || '');
      repsArr.push(document.getElementById(`rep-${id}-${s}`)?.value || '');
    }
    exs[id] = arr;
    exs[id+'_reps'] = repsArr;
  });

  const sess = {
    id: Date.now(), data, tipo, exercicios: exs,
    duracao: document.getElementById('reg-duracao')?.value || '',
    feeling: document.getElementById('reg-feeling')?.value || '',
    obs: tipo==='skip' ? (document.getElementById('skip-motivo')?.value||'') : (document.getElementById('reg-obs')?.value||''),
  };

  const db  = getDB();
  const idx = db.findIndex(x => x.data===data && x.tipo===tipo);
  if (idx>=0) db[idx]=sess; else db.push(sess);
  db.sort((a,b) => a.data.localeCompare(b.data));
  saveDB(db);

  mostrarLoading(true);
  const ok = await upsertSessao(sess);
  mostrarLoading(false);

  if (ok) { toast('Sessão salva ✓'); } else { toast('Salvo localmente (sem conexão)', 'error'); }
  limparForm();
}

function limparForm() {
  document.getElementById('reg-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('reg-tipo').value = 'A';
  renderTreinoRegistro();
}

// ── HISTÓRICO ────────────────────────────────────────────────
function initHistorico() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderHistorico(btn.dataset.filter);
    });
  });
}

function renderHistorico(filtro='todos') {
  const el  = document.getElementById('hist-list');
  const planStartStr2 = getPlanStart().toISOString().split('T')[0];
  let data  = [...getDB()].filter(x => x.data >= planStartStr2).reverse();
  if (filtro !== 'todos') data = data.filter(x => x.tipo === filtro);
  if (!data.length) { el.innerHTML='<div class="empty">Nenhuma sessão encontrada</div>'; return; }

  el.innerHTML = data.map(s => {
    const exs   = s.exercicios || {};
    const lista = Object.entries(exs).filter(([k]) => !k.endsWith('_reps')).map(([k,v]) => {
      const ex = getExercicioInfo(k) || allExercises().find(e => e.id===k); if(!ex) return '';
      const resumo = Array.isArray(v) ? v.map((x,i) => `S${i+1}:${x||'—'}`).join(' ') : (v||'—');
      const ser = s.exercicios?.[k+'_reps'];
      return `${ex.nome}: ${resumo} ${ex.unidade}`;
    }).filter(Boolean).join(' · ');

    const d     = new Date(s.data+'T12:00:00');
    const badge = s.tipo==='skip'  ? '<span class="badge badge-skip">PULADO</span>'
                : s.tipo==='A'     ? '<span class="badge badge-a">TREINO A</span>'
                : s.tipo==='B'     ? '<span class="badge badge-b">TREINO B</span>'
                : s.tipo==='CASA'  ? '<span class="badge badge-casa">TREINO CASA</span>'
                :                    '<span class="badge badge-skip">OUTRO</span>';

    return `<div class="hist-item">
      <div class="hist-date"><span>${d.toLocaleDateString('pt-BR',{weekday:'short'})}</span><strong>${d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</strong></div>
      <div class="hist-body">
        <div class="hist-title">
          ${badge}
          ${s.duracao ? `<span style="font-size:11px;color:var(--text-3)">${s.duracao}min</span>` : ''}
          ${s.feeling ? `<span class="badge badge-feel">${s.feeling}</span>` : ''}
          <button class="btn-danger" onclick="deletarSessao(${s.id})">✕</button>
        </div>
        ${lista ? `<div class="hist-detail">${lista}</div>` : ''}
        ${s.obs ? `<div class="hist-obs">"${s.obs}"</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function deletarSessao(id) {
  if (!confirm('Remover este registro?')) return;
  mostrarLoading(true);
  await deleteSessao(id);
  mostrarLoading(false);
  saveDB(getDB().filter(x => x.id !== id));
  renderHistorico(document.querySelector('.filter-btn.active')?.dataset.filter || 'todos');
  toast('Registro removido');
}

// ── RELATÓRIO ────────────────────────────────────────────────
function initRelatorio() {
  const mon = getWeekStart(0), sun = new Date(mon); sun.setDate(sun.getDate()+6);
  document.getElementById('rel-inicio').value = mon.toISOString().split('T')[0];
  document.getElementById('rel-fim').value    = sun.toISOString().split('T')[0];
  document.getElementById('btn-relatorio').addEventListener('click', () => gerarRelatorio(true));
  document.getElementById('btn-preview').addEventListener('click',   () => gerarRelatorio(false));
  document.getElementById('btn-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('rel-texto').textContent).then(() => toast('Copiado ✓'));
  });
}

function buildRelatorio(ini, fim) {
  const db     = getDB().filter(x => x.data>=ini && x.data<=fim);
  const planStartStr3 = getPlanStart().toISOString().split('T')[0];
  const dbFiltrado = db.filter(x => x.data >= planStartStr3);
  const feitos = dbFiltrado.filter(x => x.tipo !== 'skip');
  const pul    = dbFiltrado.filter(x => x.tipo === 'skip');
  const sep    = '─'.repeat(52);
  let txt = `RELATÓRIO SEMANAL — PLANO DE FORTALECIMENTO\n${sep}\n`;
  const perfil = getPerfilUsuario();
  txt += `Atleta  : ${perfil?.nome || 'Atleta'}\n`;
  if (!isRitieli()) txt += `Prova   : NB42k · 21km · 12/07/2026\n`;
  txt += `Período : ${new Date(ini+'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(fim+'T12:00:00').toLocaleDateString('pt-BR')}\n`;
  txt += `Gerado  : ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}\n`;
  txt += `Dias p/ prova : ${daysUntilRace()}\nFase atual    : ${currentPhase().nome}\n${sep}\n\n`;
  txt += `RESUMO\n  Treinos : ${feitos.length}  Pulados : ${pul.length}  Tempo : ${feitos.reduce((a,x)=>a+(parseInt(x.duracao)||0),0)} min  Adesão : ${db.length>0?Math.round(feitos.length/db.length*100):0}%\n\n`;

  if (!db.length) { txt += 'Nenhuma sessão registrada neste período.\n'; return txt; }

  txt += `SESSÕES DETALHADAS\n${sep}\n`;
  db.forEach(s => {
    txt += `\n▸ ${fmtDateLong(s.data).toUpperCase()}\n`;
    if (s.tipo==='skip') {
      txt += `  Status: PULADO\n`; if(s.obs) txt += `  Motivo: ${s.obs}\n`;
    } else {
      const label = s.tipo==='A' ? 'Quadril & Glúteo' : s.tipo==='B' ? 'Core & Lombar' : 'Treino Casa';
      txt += `  Treino ${s.tipo} — ${label}\n`;
      if(s.duracao) txt += `  Duração : ${s.duracao} min\n`;
      if(s.feeling) txt += `  Sensação: ${s.feeling}\n`;
      const exs = s.exercicios || {};
      Object.entries(exs).filter(([k]) => !k.endsWith('_reps')).forEach(([k,v]) => {
        const ex = allExercises().find(e => e.id===k); if(!ex) return;
        const repsArr = exs[k+'_reps'] || [];
        if (Array.isArray(v)) {
          txt += `  · ${ex.nome}:\n`;
          v.forEach((peso, i) => {
            const r = repsArr[i] || ''; const p = peso || '—';
            txt += `      Série ${i+1}: ${r ? r+' reps · ' : ''}${p} ${ex.unidade}\n`;
          });
        }
      });
      if(s.obs) txt += `  Obs: ${s.obs}\n`;
    }
  });

  const all = getDB();
  txt += `\n${sep}\nACUMULADO\n`;
  txt += `  Treinos A: ${all.filter(x=>x.tipo==='A').length}  Treinos B: ${all.filter(x=>x.tipo==='B').length}  Casa: ${all.filter(x=>x.tipo==='CASA').length}  Pulados: ${all.filter(x=>x.tipo==='skip').length}  Total: ${all.filter(x=>x.tipo!=='skip').reduce((a,x)=>a+(parseInt(x.duracao)||0),0)} min\n`;
  return txt;
}

function gerarRelatorio(dl=true) {
  const ini = document.getElementById('rel-inicio').value;
  const fim = document.getElementById('rel-fim').value;
  if (!ini || !fim) { toast('Selecione o período','error'); return; }
  const txt = buildRelatorio(ini, fim);
  document.getElementById('rel-texto').textContent = txt;
  document.getElementById('preview-card').style.display = 'block';
  if (dl) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], {type:'text/plain;charset=utf-8'}));
    const nomeArq = (getPerfilUsuario()?.nome || 'atleta').toLowerCase().replace(/\s+/g, '_');
    a.download = `relatorio_${nomeArq}_${ini}_${fim}.txt`;
    a.click();
    toast('Relatório baixado ✓');
  }
}

// ── MODAL ────────────────────────────────────────────────────
function initModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => { if(e.target===e.currentTarget) closeModal(); });
}

function openModal(id) {
  const e = DB_EXERCICIOS[id] || EXERCICIOS_CASA[id]; if(!e) return;
  preencherModal(e);
}

function openModalCasa(id) {
  const e = EXERCICIOS_CASA[id]; if(!e) return;
  preencherModal(e);
}

function preencherModal(e) {
  document.getElementById('modal-title').textContent = e.nome;
  document.getElementById('modal-video-link').href = e.video;
  document.getElementById('modal-musculos').innerHTML = e.musculos.map(m => `<span class="modal-tag">${m}</span>`).join('');
  document.getElementById('modal-steps').innerHTML = e.passos.map((p,i) => `<li data-n="${i+1}">${p}</li>`).join('');
  document.getElementById('modal-dica').textContent = e.dica;
  document.getElementById('modal-prescricao').innerHTML = `
    <div class="modal-pres-item"><strong>${e.series}</strong>séries</div>
    <div class="modal-pres-item"><strong>${e.reps}</strong>reps/tempo</div>
    <div class="modal-pres-item"><strong>${e.descanso}</strong>descanso</div>
    <div class="modal-pres-item"><strong>${e.carga_inicial}</strong>ref. inicial</div>`;
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ── UTIL ─────────────────────────────────────────────────────
function setTodayDate() {
  const el = document.getElementById('today-date');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
}

// ── EVOLUÇÃO ─────────────────────────────────────────────────
let graficoInstancia = null;

function initEvolucao() {
  document.getElementById('btn-novo-registro').addEventListener('click', () => {
    document.getElementById('form-evolucao').style.display = 'block';
    document.getElementById('ev-data').value = new Date().toISOString().split('T')[0];
    document.getElementById('btn-novo-registro').style.display = 'none';
  });

  // Toggle galeria
  document.getElementById('btn-toggle-galeria').addEventListener('click', () => {
    const content = document.getElementById('galeria-content');
    const btn     = document.getElementById('btn-toggle-galeria');
    const aberta  = content.style.display === 'block';
    content.style.display = aberta ? 'none' : 'block';
    btn.textContent = aberta ? 'Expandir' : 'Recolher';
  });

  document.getElementById('btn-cancelar-evolucao').addEventListener('click', () => {
    document.getElementById('form-evolucao').style.display = 'none';
    document.getElementById('btn-novo-registro').style.display = '';
    limparFormEvolucao();
  });

  document.getElementById('btn-salvar-evolucao').addEventListener('click', salvarEvolucao);

  // Preview de fotos
  document.querySelectorAll('.foto-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const slot = e.target.dataset.slot;
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.querySelector(`#slot-${slot} .foto-preview`);
        const placeholder = document.querySelector(`#slot-${slot} .foto-placeholder`);
        preview.src = ev.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  });

  // Modal de foto
  document.getElementById('foto-modal-close').addEventListener('click', () => {
    document.getElementById('foto-overlay').classList.remove('open');
  });
  document.getElementById('foto-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) document.getElementById('foto-overlay').classList.remove('open');
  });
}

async function getSignedUrl(path) {
  try {
    const url = `${SUPA_URL}/storage/v1/object/sign/fotos-progresso/${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...supaHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 3600 })
    });
    const data = await res.json();
    console.log('getSignedUrl response:', JSON.stringify(data));
    if (data.signedURL) return `${SUPA_URL}/storage/v1${data.signedURL}`;
    if (data.signedUrl) return `${SUPA_URL}/storage/v1${data.signedUrl}`;
    // Tenta formato alternativo da API
    if (data.data?.signedURL) return `${SUPA_URL}/storage/v1${data.data.signedURL}`;
    return null;
  } catch(e) {
    console.error('getSignedUrl error:', e);
    return null;
  }
}

async function carregarEvolucao() {
  console.log('PASSO 1: iniciando carregarEvolucao');
  mostrarLoading(true);
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/evolucao?order=data.desc`, { headers: supaHeaders() });
    const registros = await res.json();
    console.log('PASSO 2: registros:', registros.length);

    const ids = registros.map(r => r.id).join(',');
    let fotos = [];
    if (ids) {
      const fRes = await fetch(`${SUPA_URL}/rest/v1/fotos_progresso?evolucao_id=in.(${ids})`, { headers: supaHeaders() });
      fotos = await fRes.json();
      console.log('PASSO 3: fotos encontradas:', fotos.length, JSON.stringify(fotos));
    }

    const fotosComUrl = [];
    for (const f of fotos) {
      const signedUrl = await getSignedUrl(f.storage_path);
      console.log('PASSO 4: URL gerada para', f.storage_path, '=', signedUrl);
      fotosComUrl.push({ ...f, signedUrl });
    }

    renderGrafico(registros);
    renderGaleria(registros, fotosComUrl);
    renderEvolucaoList(registros, fotosComUrl);
    console.log('PASSO 5: concluído');
  } catch(e) {
    console.error('ERRO em carregarEvolucao:', e.message);
  }
  mostrarLoading(false);
}

function renderGrafico(registros) {
  const canvas = document.getElementById('grafico-peso');
  const empty  = document.getElementById('grafico-empty');

  const comPeso = [...registros].filter(r => r.peso).reverse();

  if (!comPeso.length) {
    canvas.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  canvas.style.display = 'block';
  empty.style.display = 'none';

  const labels = comPeso.map(r => new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }));
  const pesos  = comPeso.map(r => r.peso);

  if (graficoInstancia) graficoInstancia.destroy();

  const isDark = !document.body.classList.contains('light');
  const textColor  = isDark ? '#9a9890' : '#5a5a56';
  const gridColor  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const lineColor  = isDark ? '#d4f542' : '#5a8a00';

  graficoInstancia = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Peso (kg)',
        data: pesos,
        borderColor: lineColor,
        backgroundColor: isDark ? 'rgba(212,245,66,0.08)' : 'rgba(90,138,0,0.08)',
        borderWidth: 2,
        pointBackgroundColor: lineColor,
        pointRadius: 4,
        tension: 0.3,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `${ctx.parsed.y} kg` } }
      },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: {
          ticks: { color: textColor, callback: v => v + ' kg' },
          grid: { color: gridColor },
        }
      }
    }
  });
}

function renderEvolucaoList(registros, fotos) {
  const el = document.getElementById('evolucao-list');
  renderGaleria(registros, fotos);
  if (!registros.length) { el.innerHTML = '<div class="empty">Nenhum registro ainda</div>'; return; }

  el.innerHTML = registros.map(r => {
    const fotosReg = fotos.filter(f => f.evolucao_id === r.id);
    const fotosHtml = fotosReg.map(f => {
      const url = f.signedUrl || '';
      if (!url) return '';
      return `<div class="ev-foto-thumb" onclick="verFoto('${url}')">
        <img src="${url}" alt="foto" onerror="this.parentElement.style.display='none'">
      </div>`;
    }).join('');

    return `<div class="ev-item">
      <div class="ev-item-header">
        <span class="ev-data">${new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}</span>
        ${r.peso ? `<span class="ev-peso">${r.peso} kg</span>` : ''}
        <button class="btn-danger" onclick="deletarEvolucao(${r.id})">✕</button>
      </div>
      ${r.medidas ? `<div class="ev-medidas">${r.medidas}</div>` : ''}
      ${fotosHtml ? `<div class="ev-fotos">${fotosHtml}</div>` : ''}
    </div>`;
  }).join('');
}

function renderGaleria(registros, fotos) {
  const el = document.getElementById('galeria-grid');
  if (!el) return;

  // Agrupar fotos por registro ordenado por data (crescente)
  const registrosComFotos = [...registros]
    .reverse()
    .filter(r => fotos.some(f => f.evolucao_id === r.id));

  if (!registrosComFotos.length) {
    el.innerHTML = '<div class="empty">Nenhuma foto registrada ainda</div>';
    return;
  }

  el.innerHTML = registrosComFotos.map(r => {
    const fotosReg = fotos.filter(f => f.evolucao_id === r.id);
    const dataFmt  = new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });
    const pesoStr  = r.peso ? ` · ${r.peso}kg` : '';

    const fotosHtml = fotosReg.map(f => {
      const url = f.signedUrl || '';
      if (!url) return '';
      return `<div class="galeria-foto" onclick="verFoto('${url}')">
        <img src="${url}" alt="foto" loading="lazy" onerror="this.parentElement.style.display='none'">
      </div>`;
    }).join('');

    return `<div class="galeria-grupo">
      <div class="galeria-data">${dataFmt}${pesoStr}</div>
      <div class="galeria-fotos">${fotosHtml}</div>
    </div>`;
  }).join('');
}

async function salvarEvolucao() {
  const data  = document.getElementById('ev-data').value;
  const peso  = document.getElementById('ev-peso').value;
  const medidas = document.getElementById('ev-medidas').value;

  if (!data) { toast('Selecione a data', 'error'); return; }

  mostrarLoading(true);

  try {
    // Salvar registro
    const res = await fetch(`${SUPA_URL}/rest/v1/evolucao`, {
      method: 'POST',
      headers: { ...supaHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify({
        user_id: currentUser.id,
        data, peso: peso || null,
        medidas: medidas || null,
      })
    });
    const [registro] = await res.json();

    // Upload das fotos
    const inputs = document.querySelectorAll('.foto-input');
    for (const input of inputs) {
      if (!input.files[0]) continue;
      const file = input.files[0];
      const ext  = file.name.split('.').pop();
      const path = `${currentUser.id}/${registro.id}_slot${input.dataset.slot}.${ext}`;

      await fetch(`${SUPA_URL}/storage/v1/object/fotos-progresso/${path}`, {
        method: 'POST',
        headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + currentToken, 'Content-Type': file.type },
        body: file,
      });

      // Salvar referência no banco
      await fetch(`${SUPA_URL}/rest/v1/fotos_progresso`, {
        method: 'POST',
        headers: supaHeaders(),
        body: JSON.stringify({ user_id: currentUser.id, evolucao_id: registro.id, storage_path: path })
      });
    }

    toast('Registro salvo ✓');
    document.getElementById('form-evolucao').style.display = 'none';
    document.getElementById('btn-novo-registro').style.display = '';
    limparFormEvolucao();
    carregarEvolucao();
  } catch(e) {
    console.error(e);
    toast('Erro ao salvar', 'error');
  }

  mostrarLoading(false);
}

async function deletarEvolucao(id) {
  if (!confirm('Remover este registro e as fotos?')) return;
  mostrarLoading(true);
  await fetch(`${SUPA_URL}/rest/v1/evolucao?id=eq.${id}`, { method: 'DELETE', headers: supaHeaders() });
  toast('Registro removido');
  carregarEvolucao();
  mostrarLoading(false);
}

function verFoto(url) {
  document.getElementById('foto-modal-img').src = url;
  document.getElementById('foto-overlay').classList.add('open');
}

function limparFormEvolucao() {
  document.getElementById('ev-peso').value = '';
  document.getElementById('ev-medidas').value = '';
  document.querySelectorAll('.foto-input').forEach(i => i.value = '');
  document.querySelectorAll('.foto-preview').forEach(i => { i.style.display='none'; i.src=''; });
  document.querySelectorAll('.foto-placeholder').forEach(i => i.style.display='');
}
