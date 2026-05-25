// ── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initCountdown();
  initTreino();
  initRegistrar();
  initHistorico();
  initRelatorio();
  initModal();
  renderDashboard();
  setTodayDate();
});

// ── NAVEGAÇÃO ────────────────────────────────────────────────
function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('page-' + page).classList.add('active');
      if (page === 'dashboard') renderDashboard();
      if (page === 'historico') renderHistorico();
    });
  });
}

// ── COUNTDOWN ────────────────────────────────────────────────
function initCountdown() {
  const days = daysUntilRace();
  document.getElementById('days-num').textContent = days;
  const totalDays = Math.ceil((RACE_DATE - PLAN_START) / 86400000);
  const elapsed = totalDays - days;
  const pct = Math.min(100, Math.round(elapsed / totalDays * 100));
  document.getElementById('countdown-bar').style.width = pct + '%';
  const phase = currentPhase();
  document.getElementById('phase-badge').textContent = phase.nome + '\n' + phase.desc;
}

// ── DASHBOARD ────────────────────────────────────────────────
function renderDashboard() {
  const db = getDB();
  const feitos  = db.filter(x => x.tipo !== 'skip');
  const pulados = db.filter(x => x.tipo === 'skip');
  const semanas = new Set(db.map(x => Math.floor(new Date(x.data) / (7*86400000)))).size;
  const mins    = feitos.reduce((a,x) => a + (parseInt(x.duracao)||0), 0);

  document.getElementById('m-feitos').textContent  = feitos.length;
  document.getElementById('m-pulados').textContent = pulados.length;
  document.getElementById('m-semanas').textContent = semanas;
  document.getElementById('m-minutos').textContent = mins;

  const cntA = db.filter(x => x.tipo === 'A').length;
  const cntB = db.filter(x => x.tipo === 'B').length;
  document.getElementById('cnt-a').textContent = cntA + '/7';
  document.getElementById('cnt-b').textContent = cntB + '/7';
  document.getElementById('bar-a').style.width = Math.min(100, Math.round(cntA/7*100)) + '%';
  document.getElementById('bar-b').style.width = Math.min(100, Math.round(cntB/7*100)) + '%';
  const total = cntA + cntB + pulados.length;
  document.getElementById('adh-val').textContent = total > 0 ? Math.round((cntA+cntB)/total*100) + '%' : '--%';

  renderWeekView(db);
  renderLastLoads(db);
}

function renderWeekView(db) {
  const el = document.getElementById('week-view');
  const days = ['D','S','T','Q','Q','S','S'];
  let html = '';
  for (let w = 3; w >= 0; w--) {
    const start = getWeekStart(w);
    const label = start.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
    html += `<div class="week-row"><span class="week-label">${label}</span><div class="day-dots">`;
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start); dt.setDate(dt.getDate() + d);
      const ds = dt.toISOString().split('T')[0];
      const sess = db.find(x => x.data === ds);
      let cls = 'day-dot';
      if (sess) cls += sess.tipo==='A' ? ' done-a' : sess.tipo==='B' ? ' done-b' : ' skip';
      html += `<div class="${cls}" title="${ds}">${days[d]}</div>`;
    }
    html += '</div></div>';
  }
  el.innerHTML = html || '<div class="empty">Nenhum registro</div>';
}

function renderLastLoads(db) {
  const el = document.getElementById('last-loads');
  const feitos = db.filter(x => x.tipo !== 'skip').slice(-3).reverse();
  if (!feitos.length) { el.innerHTML = '<div class="empty">Nenhuma sessão registrada ainda</div>'; return; }
  let html = '';
  feitos.forEach(s => {
    const exs = s.exercicios || {};
    const lista = Object.entries(exs).filter(([,v]) => v)
      .map(([k,v]) => { const ex = EXERCICIOS_INFO[k]; return ex ? `${ex.nome}: <strong>${v}</strong> ${ex.unidade}` : ''; })
      .filter(Boolean).join(' &nbsp;·&nbsp; ');
    html += `<div class="load-item">
      <div class="load-date">${fmtDate(s.data)}</div>
      <div class="load-body">
        <div class="load-title">
          <span class="badge badge-${s.tipo.toLowerCase()}">${s.tipo==='A' ? 'TREINO A' : 'TREINO B'}</span>
          ${s.duracao ? `<span style="font-size:11px;color:var(--text-3)">${s.duracao}min</span>` : ''}
          ${s.feeling ? `<span class="badge badge-feel">${s.feeling}</span>` : ''}
        </div>
        <div class="load-detail">${lista || '<em style="opacity:.5">Sem cargas registradas</em>'}</div>
      </div>
    </div>`;
  });
  el.innerHTML = html;
}

// ── PLANO DE TREINO ──────────────────────────────────────────
function initTreino() {
  document.querySelectorAll('.ttab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ttab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTreino(btn.dataset.treino);
    });
  });
  renderTreino('A');
}

function renderTreino(tipo) {
  const t   = TREINOS[tipo];
  const wup = WARMUP[tipo];
  const ex  = t.exercicios.map(id => EXERCICIOS_INFO[id]);
  const phase = currentPhase();

  let html = '';

  // FASE ATUAL
  html += `<div class="fase-block">
    <span class="fase-tag">FASE ATUAL</span>
    <span class="fase-desc">${phase.nome} — ${phase.desc}</span>
  </div>`;

  // AQUECIMENTO
  html += `<div class="warmup-card warm">
    <div class="warmup-title"><span>🔥</span> Aquecimento (8–10 min)</div>`;
  wup.aquecimento.forEach((item, i) => {
    html += `<div class="warmup-item">
      <span class="warmup-num">${i+1}</span>
      <div class="warmup-item-info">
        <div class="warmup-item-name">${item.nome}</div>
        <div class="warmup-item-detail">${item.detalhe}</div>
      </div>
    </div>`;
  });
  html += '</div>';

  // EXERCÍCIOS
  html += `<div style="margin-bottom:1rem">`;
  ex.forEach((e, i) => {
    html += `<div class="ex-card">
      <div class="ex-card-header">
        <span class="ex-num">${String(i+1).padStart(2,'0')}</span>
        <div class="ex-info">
          <div class="ex-info-name">${e.nome}</div>
          <div class="ex-info-meta">${e.musculos.join(' · ')}</div>
        </div>
        <div class="ex-prescricao">
          <span class="ex-pill highlight">${e.series} séries</span>
          <span class="ex-pill">${e.reps} ${e.unidade.includes('seg') || e.unidade === 'reps' ? '' : 'reps'}</span>
          <span class="ex-pill">descanso ${e.descanso}</span>
        </div>
        <button class="btn-info" onclick="openModal('${e.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Como fazer
        </button>
      </div>
    </div>`;
  });
  html += '</div>';

  // ALONGAMENTO
  html += `<div class="warmup-card cool">
    <div class="warmup-title"><span>❄️</span> Alongamento final (5 min)</div>`;
  wup.alongamento.forEach((item, i) => {
    html += `<div class="warmup-item">
      <span class="warmup-num">${i+1}</span>
      <div class="warmup-item-info">
        <div class="warmup-item-name">${item.nome}</div>
        <div class="warmup-item-detail">${item.detalhe}</div>
      </div>
    </div>`;
  });
  html += '</div>';

  document.getElementById('treino-content').innerHTML = html;
}

// ── MODAL DE INSTRUÇÃO ───────────────────────────────────────
function initModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
}

function openModal(id) {
  const e = EXERCICIOS_INFO[id];
  if (!e) return;

  document.getElementById('modal-title').textContent = e.nome;
  document.getElementById('modal-video-link').href = e.video;

  document.getElementById('modal-musculos').innerHTML =
    e.musculos.map(m => `<span class="modal-tag">${m}</span>`).join('');

  document.getElementById('modal-steps').innerHTML =
    e.passos.map((p, i) => `<li data-n="${i+1}">${p}</li>`).join('');

  document.getElementById('modal-dica').textContent = e.dica;

  document.getElementById('modal-prescricao').innerHTML = `
    <div class="modal-pres-item"><strong>${e.series}</strong>séries</div>
    <div class="modal-pres-item"><strong>${e.reps}</strong>${e.unidade.includes('seg') ? 'segundos' : e.unidade === 'reps' ? 'repetições' : 'reps'}</div>
    <div class="modal-pres-item"><strong>${e.descanso}</strong>descanso</div>
    <div class="modal-pres-item"><strong>${e.carga_inicial}</strong>referência inicial</div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ── REGISTRAR ────────────────────────────────────────────────
function initRegistrar() {
  document.getElementById('reg-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('reg-tipo').addEventListener('change', updateForm);
  document.getElementById('btn-salvar').addEventListener('click', salvarSessao);
  document.getElementById('btn-limpar').addEventListener('click', limparForm);
  updateForm();
}

function updateForm() {
  const tipo = document.getElementById('reg-tipo').value;
  const exSec   = document.getElementById('reg-ex-section');
  const skipSec = document.getElementById('reg-skip-section');

  if (tipo === 'skip') {
    exSec.style.display = 'none'; skipSec.style.display = 'block';
    document.getElementById('tip-title').textContent = 'Dia pulado';
    document.getElementById('tip-desc').textContent  = 'Registre o motivo para acompanhar consistência.';
    document.getElementById('tip-focus').innerHTML   = '';
    return;
  }

  exSec.style.display = 'block'; skipSec.style.display = 'none';
  const t = TREINOS[tipo];
  document.getElementById('tip-title').textContent = t.nome;
  document.getElementById('tip-desc').textContent  = t.desc;
  document.getElementById('tip-focus').innerHTML   = '<ul>' + t.focus.map(f => `<li>${f}</li>`).join('') + '</ul>';

  const db = getDB();
  const ultimo = db.filter(x => x.tipo === tipo).slice(-1)[0];

  let html = '';
  t.exercicios.forEach(id => {
    const e    = EXERCICIOS_INFO[id];
    const prev = ultimo?.exercicios?.[id] || '';
    html += `<div class="ex-reg-row">
      <div>
        <div class="ex-reg-name">${e.nome}</div>
        <div class="ex-reg-unit">${e.unidade}</div>
      </div>
      <input type="number" id="ex-${id}" placeholder="${prev || '—'}" min="0" step="0.5">
      <input type="number" id="ser-${id}" placeholder="3" min="1" max="6">
      <input type="number" id="rep-${id}" placeholder="${e.reps}" min="1">
    </div>`;
  });
  document.getElementById('ex-list').innerHTML = html;
}

function salvarSessao() {
  const data = document.getElementById('reg-date').value;
  const tipo = document.getElementById('reg-tipo').value;
  if (!data) { toast('Selecione a data', 'error'); return; }

  const exs = {}, series = {}, reps = {};
  if (tipo !== 'skip') {
    TREINOS[tipo].exercicios.forEach(id => {
      const v = document.getElementById('ex-' + id)?.value;
      const s = document.getElementById('ser-' + id)?.value;
      const r = document.getElementById('rep-' + id)?.value;
      if (v) exs[id]    = v;
      if (s) series[id] = s;
      if (r) reps[id]   = r;
    });
  }

  const sess = {
    id: Date.now(), data, tipo, exercicios: exs, series, reps,
    duracao: document.getElementById('reg-duracao').value,
    feeling: document.getElementById('reg-feeling').value,
    obs: tipo === 'skip' ? document.getElementById('skip-motivo').value : document.getElementById('reg-obs').value,
  };

  const db  = getDB();
  const idx = db.findIndex(x => x.data === data && x.tipo === tipo);
  if (idx >= 0) db[idx] = sess; else db.push(sess);
  db.sort((a,b) => a.data.localeCompare(b.data));
  saveDB(db);
  toast('Sessão salva ✓');
  limparForm();
}

function limparForm() {
  document.getElementById('reg-date').value    = new Date().toISOString().split('T')[0];
  document.getElementById('reg-tipo').value    = 'A';
  document.getElementById('reg-duracao').value = '';
  document.getElementById('reg-feeling').value = '';
  document.getElementById('reg-obs').value     = '';
  document.getElementById('skip-motivo').value = '';
  updateForm();
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

function renderHistorico(filtro = 'todos') {
  const db  = getDB();
  const el  = document.getElementById('hist-list');
  let data  = [...db].reverse();
  if (filtro !== 'todos') data = data.filter(x => x.tipo === filtro);
  if (!data.length) { el.innerHTML = '<div class="empty">Nenhuma sessão encontrada</div>'; return; }

  let html = '';
  data.forEach(s => {
    const exs   = s.exercicios || {};
    const lista = Object.entries(exs).filter(([,v]) => v).map(([k,v]) => {
      const ex  = EXERCICIOS_INFO[k];
      const ser = s.series?.[k] ? s.series[k] + '×' : '';
      return ex ? `${ex.nome}: ${ser}${v} ${ex.unidade}` : '';
    }).filter(Boolean).join(' · ');

    const d      = new Date(s.data + 'T12:00:00');
    const dia    = d.toLocaleDateString('pt-BR', { weekday:'short' });
    const dtFmt  = d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
    const badge  = s.tipo==='skip' ? '<span class="badge badge-skip">PULADO</span>'
                 : s.tipo==='A'    ? '<span class="badge badge-a">TREINO A</span>'
                 :                   '<span class="badge badge-b">TREINO B</span>';

    html += `<div class="hist-item">
      <div class="hist-date"><span>${dia}</span><strong>${dtFmt}</strong></div>
      <div class="hist-body">
        <div class="hist-title">
          ${badge}
          ${s.duracao ? `<span style="font-size:11px;color:var(--text-3)">${s.duracao}min</span>` : ''}
          ${s.feeling ? `<span class="badge badge-feel">${s.feeling}</span>` : ''}
          <button class="btn-danger" onclick="deletarSessao(${s.id})">✕</button>
        </div>
        ${lista    ? `<div class="hist-detail">${lista}</div>`            : ''}
        ${s.obs    ? `<div class="hist-obs">"${s.obs}"</div>`             : ''}
      </div>
    </div>`;
  });
  el.innerHTML = html;
}

function deletarSessao(id) {
  if (!confirm('Remover este registro?')) return;
  saveDB(getDB().filter(x => x.id !== id));
  renderHistorico(document.querySelector('.filter-btn.active')?.dataset.filter || 'todos');
  toast('Registro removido');
}

// ── RELATÓRIO ────────────────────────────────────────────────
function initRelatorio() {
  const mon = getWeekStart(0);
  const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
  document.getElementById('rel-inicio').value = mon.toISOString().split('T')[0];
  document.getElementById('rel-fim').value    = sun.toISOString().split('T')[0];
  document.getElementById('btn-relatorio').addEventListener('click', () => gerarRelatorio(true));
  document.getElementById('btn-preview').addEventListener('click',   () => gerarRelatorio(false));
  document.getElementById('btn-copy').addEventListener('click',      copiarRelatorio);
}

function buildRelatorio(ini, fim) {
  const db     = getDB().filter(x => x.data >= ini && x.data <= fim);
  const feitos = db.filter(x => x.tipo !== 'skip');
  const pul    = db.filter(x => x.tipo === 'skip');
  const sep    = '─'.repeat(52);

  let txt = '';
  txt += `RELATÓRIO SEMANAL — PLANO DE FORTALECIMENTO\n`;
  txt += `${sep}\n`;
  txt += `Atleta  : Bruno Elias Lopes Louzada\n`;
  txt += `Prova   : NB42k · 21km · 12/07/2026\n`;
  txt += `Período : ${new Date(ini+'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(fim+'T12:00:00').toLocaleDateString('pt-BR')}\n`;
  txt += `Gerado  : ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}\n`;
  txt += `Dias p/ prova  : ${daysUntilRace()}\n`;
  txt += `Fase atual     : ${currentPhase().nome}\n`;
  txt += `${sep}\n\n`;

  txt += `RESUMO DA SEMANA\n`;
  txt += `  Treinos realizados : ${feitos.length}\n`;
  txt += `  Dias pulados       : ${pul.length}\n`;
  txt += `  Tempo total        : ${feitos.reduce((a,x)=>a+(parseInt(x.duracao)||0),0)} min\n`;
  txt += `  Adesão             : ${db.length > 0 ? Math.round(feitos.length/db.length*100) : 0}%\n\n`;

  if (!db.length) { txt += 'Nenhuma sessão registrada neste período.\n'; return txt; }

  txt += `SESSÕES DETALHADAS\n${sep}\n`;
  db.forEach(s => {
    txt += `\n▸ ${fmtDateLong(s.data).toUpperCase()}\n`;
    if (s.tipo === 'skip') {
      txt += `  Status: PULADO\n`;
      if (s.obs) txt += `  Motivo: ${s.obs}\n`;
    } else {
      const label = s.tipo==='A' ? 'Quadril & Glúteo' : 'Core & Lombar';
      txt += `  Treino ${s.tipo} — ${label}\n`;
      if (s.duracao) txt += `  Duração  : ${s.duracao} min\n`;
      if (s.feeling) txt += `  Sensação : ${s.feeling}\n`;
      const exs = s.exercicios || {};
      if (Object.values(exs).some(v=>v)) {
        txt += `  Cargas:\n`;
        Object.entries(exs).filter(([,v])=>v).forEach(([k,v]) => {
          const ex  = EXERCICIOS_INFO[k];
          const ser = s.series?.[k] ? `${s.series[k]} séries × ` : '';
          const rep = s.reps?.[k]   ? `${s.reps[k]} reps · `    : '';
          if (ex) txt += `    · ${ex.nome}: ${ser}${rep}${v} ${ex.unidade}\n`;
        });
      }
      if (s.obs) txt += `  Obs: ${s.obs}\n`;
    }
  });

  const all = getDB();
  txt += `\n${sep}\n`;
  txt += `ACUMULADO DO PLANO\n`;
  txt += `  Treinos A    : ${all.filter(x=>x.tipo==='A').length}\n`;
  txt += `  Treinos B    : ${all.filter(x=>x.tipo==='B').length}\n`;
  txt += `  Pulados      : ${all.filter(x=>x.tipo==='skip').length}\n`;
  txt += `  Total min    : ${all.filter(x=>x.tipo!=='skip').reduce((a,x)=>a+(parseInt(x.duracao)||0),0)}\n`;

  return txt;
}

function gerarRelatorio(download=true) {
  const ini = document.getElementById('rel-inicio').value;
  const fim = document.getElementById('rel-fim').value;
  if (!ini || !fim) { toast('Selecione o período','error'); return; }
  const txt = buildRelatorio(ini, fim);
  document.getElementById('rel-texto').textContent = txt;
  document.getElementById('preview-card').style.display = 'block';
  if (download) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], {type:'text/plain;charset=utf-8'}));
    a.download = `relatorio_bruno_${ini}_${fim}.txt`;
    a.click();
    toast('Relatório baixado ✓');
  }
}

function copiarRelatorio() {
  navigator.clipboard.writeText(document.getElementById('rel-texto').textContent)
    .then(() => toast('Copiado ✓'));
}

// ── UTIL ─────────────────────────────────────────────────────
function setTodayDate() {
  const el = document.getElementById('today-date');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
}
