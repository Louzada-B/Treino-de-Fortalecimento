document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initTheme();
  initCountdown();
  initRegistrar();
  initHistorico();
  initRelatorio();
  initModal();
  setTodayDate();
  await carregarDados();
  renderDashboard();
});

async function carregarDados() {
  mostrarLoading(true);
  await fetchSessoes();
  mostrarLoading(false);
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
function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('page-' + btn.dataset.page).classList.add('active');
      if (btn.dataset.page === 'dashboard') { carregarDados().then(renderDashboard); }
      if (btn.dataset.page === 'historico') { carregarDados().then(() => renderHistorico()); }
    });
  });
}

// ── COUNTDOWN ────────────────────────────────────────────────
function initCountdown() {
  const days = daysUntilRace();
  document.getElementById('days-num').textContent = days;
  const total = Math.ceil((RACE_DATE - PLAN_START) / 86400000);
  const pct   = Math.min(100, Math.round((total - days) / total * 100));
  document.getElementById('countdown-bar').style.width = pct + '%';
  const ph = currentPhase();
  document.getElementById('phase-badge').textContent = ph.nome + ' — ' + ph.desc;
}

// ── DASHBOARD ────────────────────────────────────────────────
function renderDashboard() {
  const db     = getDB();
  const feitos = db.filter(x => x.tipo !== 'skip');
  const pul    = db.filter(x => x.tipo === 'skip');
  const mins   = feitos.reduce((a,x) => a + (parseInt(x.duracao)||0), 0);
  const sem    = new Set(db.map(x => Math.floor(new Date(x.data) / (7*86400000)))).size;

  document.getElementById('m-feitos').textContent  = feitos.length;
  document.getElementById('m-pulados').textContent = pul.length;
  document.getElementById('m-minutos').textContent = mins;
  document.getElementById('m-semanas').textContent = sem;

  const cA = db.filter(x=>x.tipo==='A').length;
  const cB = db.filter(x=>x.tipo==='B').length;
  document.getElementById('cnt-a').textContent = cA+'/7';
  document.getElementById('cnt-b').textContent = cB+'/7';
  document.getElementById('bar-a').style.width = Math.min(100,Math.round(cA/7*100))+'%';
  document.getElementById('bar-b').style.width = Math.min(100,Math.round(cB/7*100))+'%';
  const tot = cA+cB+pul.length;
  document.getElementById('adh-val').textContent = tot>0 ? Math.round((cA+cB)/tot*100)+'%' : '--%';

  const cCasa = db.filter(x=>x.tipo==='CASA').length;
  document.getElementById('m-casa').textContent = cCasa;

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
      const s=db.find(x=>x.data===ds);
      let cls='day-dot'; if(s) cls+=s.tipo==='A'?' done-a':s.tipo==='B'?' done-b':' skip';
      wHtml+=`<div class="${cls}" title="${ds}">${days[d]}</div>`;
    }
    wHtml+='</div></div>';
  }
  wEl.innerHTML = wHtml;

  // last loads
  const lEl   = document.getElementById('last-loads');
  const ults  = feitos.slice(-3).reverse();
  if (!ults.length) { lEl.innerHTML='<div class="empty">Nenhuma sessão registrada ainda</div>'; return; }
  lEl.innerHTML = ults.map(s => {
    const exs = s.exercicios || {};
    const lista = Object.entries(exs).map(([k,serArr]) => {
      const ex = EXERCICIOS_INFO[k]; if(!ex) return '';
      const resumo = Array.isArray(serArr)
        ? serArr.map((v,i)=>`S${i+1}:${v||'—'}`).join(' ')
        : (serArr||'—');
      return `${ex.nome}: ${resumo} ${ex.unidade}`;
    }).filter(Boolean).join(' · ');
    return `<div class="load-item">
      <div class="load-date">${fmtDate(s.data)}</div>
      <div class="load-body">
        <div class="load-title">
          <span class="badge badge-${s.tipo.toLowerCase()}">${s.tipo==='A'?'TREINO A':'TREINO B'}</span>
          ${s.duracao?`<span style="font-size:11px;color:var(--text-3)">${s.duracao}min</span>`:''}
          ${s.feeling?`<span class="badge badge-feel">${s.feeling}</span>`:''}
        </div>
        <div class="load-detail">${lista||'<em style="opacity:.5">Sem cargas registradas</em>'}</div>
      </div>
    </div>`;
  }).join('');
}

// ── TREINO & REGISTRO UNIFICADO ──────────────────────────────
function initRegistrar() {
  document.getElementById('reg-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('reg-tipo').addEventListener('change', renderTreinoRegistro);
  renderTreinoRegistro();
}

function renderTreinoRegistro() {
  const tipo = document.getElementById('reg-tipo').value;
  const el   = document.getElementById('treino-registro-content');

  if (tipo === 'CASA') {
    const t   = TREINOS['CASA'];
    const wup = WARMUP['B']; // usa aquecimento do B (gato-vaca etc já estão nos exercícios)
    let html  = '';

    html += `<div class="fase-block"><span class="fase-tag">TREINO ESPECIAL</span><span class="fase-desc">Ativação em casa — sem equipamento. Lombar em recuperação.</span></div>`;

    html += `<div class="card">
      <div class="card-header"><h2>${t.nome}</h2><span class="card-sub">${t.desc}</span></div>`;

    t.exercicios.forEach((id, idx) => {
      const e    = EXERCICIOS_CASA[id];
      const db   = getDB();
      const ult  = db.filter(x => x.tipo === 'CASA').slice(-1)[0];
      const prevArr = ult?.exercicios?.[id];
      const prev    = Array.isArray(prevArr) ? prevArr : [];
      const numSer  = parseInt(e.series) || 3;

      html += `<div class="ex-reg-block">
        <div class="ex-reg-header">
          <span class="ex-reg-num">${String(idx+1).padStart(2,'0')}</span>
          <div class="ex-reg-info">
            <div class="ex-reg-name">${e.nome}</div>
            <div class="ex-reg-meta">${e.musculos.join(' · ')}</div>
          </div>
          <div class="ex-reg-pills">
            <span class="ex-pill highlight">${e.series} séries</span>
            <span class="ex-pill">${e.reps}</span>
            <span class="ex-pill">${e.descanso} desc.</span>
          </div>
          <button class="btn-info" onclick="openModalCasa('${id}')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Como fazer
          </button>
        </div>
        <div class="series-grid">
          <div class="series-col-header"><span>Série</span><span>Reps</span><span>${e.unidade}</span>${prev.length ? '<span class="prev-label">anterior</span>' : ''}</div>`;

      for (let s = 0; s < numSer; s++) {
        const prevVal = prev[s] || '';
        html += `<div class="series-row">
          <span class="series-num">S${s+1}</span>
          <input type="number" class="series-reps" id="rep-${id}-${s}" placeholder="${e.reps.split(' ')[0] || '—'}" min="1" step="1">
          <input type="number" class="series-peso" id="peso-${id}-${s}" placeholder="${prevVal || '—'}" min="0" step="1">
          ${prev.length ? `<span class="series-prev">${prevVal || '—'}</span>` : ''}
        </div>`;
      }
      html += '</div></div>';
    });

    html += `
      <div class="form-row" style="margin-top:1.25rem;padding-top:1.25rem;border-top:1px solid var(--border)">
        <div class="form-group" style="margin-bottom:0"><label>Duração (min)</label><input type="number" id="reg-duracao" placeholder="Ex: 30" min="1" max="120"></div>
        <div class="form-group" style="margin-bottom:0"><label>Como foi?</label>
          <select id="reg-feeling">
            <option value="">— opcional —</option>
            <option value="ótimo">💪 Ótimo</option>
            <option value="bom">👍 Bom</option>
            <option value="ok">😐 Ok</option>
            <option value="pesado">😓 Pesado</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-top:12px"><label>Observações</label><textarea id="reg-obs" rows="2" placeholder="Ex: lombar melhorando, sem dores..."></textarea></div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="salvarSessao()">Salvar sessão</button>
        <button class="btn btn-ghost" onclick="limparForm()">Limpar</button>
      </div>
    </div>`;

    el.innerHTML = html;
    return;
  }

  if (tipo === 'skip') {
    el.innerHTML = `
      <div class="card">
        <div class="form-group"><label>Motivo (opcional)</label><textarea id="skip-motivo" rows="3" placeholder="Ex: cansaço, agenda cheia, dor..."></textarea></div>
        <div class="form-actions">
          <button class="btn btn-primary" onclick="salvarSessao()">Salvar</button>
          <button class="btn btn-ghost" onclick="limparForm()">Limpar</button>
        </div>
      </div>`;
    return;
  }

  const t   = TREINOS[tipo];
  const wup = WARMUP[tipo];
  const db  = getDB();
  const ult = db.filter(x => x.tipo === tipo).slice(-1)[0];
  const ph  = currentPhase();

  let html = '';

  // fase
  html += `<div class="fase-block"><span class="fase-tag">FASE ATUAL</span><span class="fase-desc">${ph.nome} — ${ph.desc}</span></div>`;

  // aquecimento
  html += `<div class="warmup-card warm">
    <div class="warmup-title"><span>🔥</span> Aquecimento (8–10 min)</div>`;
  wup.aquecimento.forEach((item,i) => {
    html += `<div class="warmup-item"><span class="warmup-num">${i+1}</span>
      <div class="warmup-item-info">
        <div class="warmup-item-name">${item.nome}</div>
        <div class="warmup-item-detail">${item.detalhe}</div>
      </div></div>`;
  });
  html += '</div>';

  // exercícios com registro por série
  html += `<div class="card">
    <div class="card-header"><h2>${t.nome}</h2><span class="card-sub">${t.desc}</span></div>`;

  t.exercicios.forEach((id, idx) => {
    const e      = EXERCICIOS_INFO[id];
    const prog   = getProgressao(id);
    const numSer = prog ? prog.series : (parseInt(e.series) || 3);
    const prevArr = ult?.exercicios?.[id];
    const prev    = Array.isArray(prevArr) ? prevArr : [];

    // badge de recomendação semanal
    const recBadge = prog ? `
      <div class="rec-block">
        <span class="rec-label">SEMANA ${currentWeekNumber()}</span>
        <span class="rec-carga">${prog.carga_ref}</span>
        <span class="rec-reps">${prog.series} séries · ${prog.reps}</span>
        ${prog.obs ? `<span class="rec-obs">${prog.obs}</span>` : ''}
      </div>` : '';

    html += `<div class="ex-reg-block" id="exb-${id}">
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
        <button class="btn-info" onclick="openModal('${id}')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Como fazer
        </button>
      </div>
      ${recBadge}
      <div class="series-grid">
        <div class="series-col-header"><span>Série</span><span>Reps</span><span>${e.unidade}</span>${prev.length ? '<span class="prev-label">anterior</span>' : ''}</div>`;

    for (let s = 0; s < numSer; s++) {
      const prevVal = prev[s] || '';
      html += `<div class="series-row">
        <span class="series-num">S${s+1}</span>
        <input type="number" class="series-reps" id="rep-${id}-${s}" placeholder="${prog ? prog.reps.split('/')[s] || prog.reps.split('–')[0] || '—' : '—'}" min="1" step="1">
        <input type="number" class="series-peso" id="peso-${id}-${s}" placeholder="${prevVal || '—'}" min="0" step="0.5">
        ${prev.length ? `<span class="series-prev">${prevVal || '—'} ${prevVal ? e.unidade : ''}</span>` : ''}
      </div>`;
    }

    html += `</div></div>`;
  });

  // campos finais + botões dentro do mesmo card
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

  // alongamento
  html += `<div class="warmup-card cool">
    <div class="warmup-title"><span>❄️</span> Alongamento final (5 min)</div>`;
  wup.alongamento.forEach((item,i) => {
    html += `<div class="warmup-item"><span class="warmup-num">${i+1}</span>
      <div class="warmup-item-info">
        <div class="warmup-item-name">${item.nome}</div>
        <div class="warmup-item-detail">${item.detalhe}</div>
      </div></div>`;
  });
  html += '</div>';

  el.innerHTML = html;
}

async function salvarSessao() {
  const data = document.getElementById('reg-date').value;
  const tipo = document.getElementById('reg-tipo').value;
  if (!data) { toast('Selecione a data','error'); return; }

  const exs = {};
  const exerciciosDoTipo = tipo === 'CASA' ? TREINOS['CASA'].exercicios : (tipo !== 'skip' ? TREINOS[tipo].exercicios : []);
  if (exerciciosDoTipo.length) {
    exerciciosDoTipo.forEach(id => {
      const e      = EXERCICIOS_INFO[id];
      const numSer = parseInt(e.series) || 3;
      const arr    = [];
      for (let s=0;s<numSer;s++) {
        arr.push(document.getElementById(`peso-${id}-${s}`)?.value || '');
      }
      // salva reps também em paralelo
      const repsArr = [];
      for (let s=0;s<numSer;s++) {
        repsArr.push(document.getElementById(`rep-${id}-${s}`)?.value || '');
      }
      exs[id] = arr;
      exs[id+'_reps'] = repsArr;
    });
  }

  const sess = {
    id: Date.now(), data, tipo, exercicios: exs,
    duracao: document.getElementById('reg-duracao')?.value || '',
    feeling: document.getElementById('reg-feeling')?.value || '',
    obs: tipo==='skip'
      ? (document.getElementById('skip-motivo')?.value||'')
      : (document.getElementById('reg-obs')?.value||''),
  };

  const db  = getDB();
  const idx = db.findIndex(x => x.data===data && x.tipo===tipo);
  if (idx>=0) db[idx]=sess; else db.push(sess);
  db.sort((a,b)=>a.data.localeCompare(b.data));
  saveDB(db);
  mostrarLoading(true);
  const ok = await upsertSessao(sess);
  mostrarLoading(false);
  if (ok) {
    toast('Sessão salva ✓');
  } else {
    toast('Salvo localmente (sem conexão)', 'error');
  }
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
      document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderHistorico(btn.dataset.filter);
    });
  });
}

function renderHistorico(filtro='todos') {
  const el   = document.getElementById('hist-list');
  let data   = [...getDB()].reverse();
  if (filtro!=='todos') data=data.filter(x=>x.tipo===filtro);
  if (!data.length) { el.innerHTML='<div class="empty">Nenhuma sessão encontrada</div>'; return; }

  el.innerHTML = data.map(s => {
    const exs   = s.exercicios || {};
    const lista = Object.entries(exs)
      .filter(([k]) => !k.endsWith('_reps'))
      .map(([k,v]) => {
        const ex = EXERCICIOS_INFO[k]; if(!ex) return '';
        const resumo = Array.isArray(v)
          ? v.map((x,i)=>`S${i+1}:${x||'—'}`).join(' ')
          : (v||'—');
        return `${ex.nome}: ${resumo} ${ex.unidade}`;
      }).filter(Boolean).join(' · ');

    const d     = new Date(s.data+'T12:00:00');
    const badge = s.tipo==='skip' ?'<span class="badge badge-skip">PULADO</span>'
                : s.tipo==='A'    ?'<span class="badge badge-a">TREINO A</span>'
                : s.tipo==='CASA' ?'<span class="badge badge-casa">TREINO CASA</span>'
                :                  '<span class="badge badge-b">TREINO B</span>';
    return `<div class="hist-item">
      <div class="hist-date"><span>${d.toLocaleDateString('pt-BR',{weekday:'short'})}</span><strong>${d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</strong></div>
      <div class="hist-body">
        <div class="hist-title">
          ${badge}
          ${s.duracao?`<span style="font-size:11px;color:var(--text-3)">${s.duracao}min</span>`:''}
          ${s.feeling?`<span class="badge badge-feel">${s.feeling}</span>`:''}
          <button class="btn-danger" onclick="deletarSessao(${s.id})">✕</button>
        </div>
        ${lista?`<div class="hist-detail">${lista}</div>`:''}
        ${s.obs?`<div class="hist-obs">"${s.obs}"</div>`:''}
      </div>
    </div>`;
  }).join('');
}

async function deletarSessao(id) {
  if (!confirm('Remover este registro?')) return;
  mostrarLoading(true);
  await deleteSessao(id);
  mostrarLoading(false);
  saveDB(getDB().filter(x=>x.id!==id));
  renderHistorico(document.querySelector('.filter-btn.active')?.dataset.filter||'todos');
  toast('Registro removido');
}

// ── RELATÓRIO ────────────────────────────────────────────────
function initRelatorio() {
  const mon=getWeekStart(0), sun=new Date(mon); sun.setDate(sun.getDate()+6);
  document.getElementById('rel-inicio').value = mon.toISOString().split('T')[0];
  document.getElementById('rel-fim').value    = sun.toISOString().split('T')[0];
  document.getElementById('btn-relatorio').addEventListener('click', ()=>gerarRelatorio(true));
  document.getElementById('btn-preview').addEventListener('click',   ()=>gerarRelatorio(false));
  document.getElementById('btn-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('rel-texto').textContent).then(()=>toast('Copiado ✓'));
  });
}

function buildRelatorio(ini, fim) {
  const db     = getDB().filter(x=>x.data>=ini&&x.data<=fim);
  const feitos = db.filter(x=>x.tipo!=='skip');
  const pul    = db.filter(x=>x.tipo==='skip');
  const sep    = '─'.repeat(52);
  let txt = `RELATÓRIO SEMANAL — PLANO DE FORTALECIMENTO\n${sep}\n`;
  txt += `Atleta  : Bruno Elias Lopes Louzada\nProva   : NB42k · 21km · 12/07/2026\n`;
  txt += `Período : ${new Date(ini+'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(fim+'T12:00:00').toLocaleDateString('pt-BR')}\n`;
  txt += `Gerado  : ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}\n`;
  txt += `Dias p/ prova : ${daysUntilRace()}\nFase atual    : ${currentPhase().nome}\n${sep}\n\n`;
  txt += `RESUMO\n  Treinos : ${feitos.length}  Pulados : ${pul.length}  Tempo : ${feitos.reduce((a,x)=>a+(parseInt(x.duracao)||0),0)} min  Adesão : ${db.length>0?Math.round(feitos.length/db.length*100):0}%\n\n`;

  if (!db.length) { txt+='Nenhuma sessão registrada neste período.\n'; return txt; }

  txt += `SESSÕES DETALHADAS\n${sep}\n`;
  db.forEach(s => {
    txt += `\n▸ ${fmtDateLong(s.data).toUpperCase()}\n`;
    if (s.tipo==='skip') {
      txt+=`  Status: PULADO\n`; if(s.obs) txt+=`  Motivo: ${s.obs}\n`;
    } else {
      txt+=`  Treino ${s.tipo} — ${s.tipo==='A'?'Quadril & Glúteo':'Core & Lombar'}\n`;
      if(s.duracao) txt+=`  Duração : ${s.duracao} min\n`;
      if(s.feeling) txt+=`  Sensação: ${s.feeling}\n`;
      const exs=s.exercicios||{};
      Object.entries(exs).filter(([k])=>!k.endsWith('_reps')).forEach(([k,v])=>{
        const ex=EXERCICIOS_INFO[k]; if(!ex) return;
        const repsArr=exs[k+'_reps']||[];
        if(Array.isArray(v)) {
          txt+=`  · ${ex.nome}:\n`;
          v.forEach((peso,i)=>{
            const r=repsArr[i]||''; const p=peso||'—';
            txt+=`      Série ${i+1}: ${r?r+' reps · ':''}${p} ${ex.unidade}\n`;
          });
        }
      });
      if(s.obs) txt+=`  Obs: ${s.obs}\n`;
    }
  });

  const all=getDB();
  txt+=`\n${sep}\nACUMULADO\n  Treinos A: ${all.filter(x=>x.tipo==='A').length}  Treinos B: ${all.filter(x=>x.tipo==='B').length}  Pulados: ${all.filter(x=>x.tipo==='skip').length}  Total: ${all.filter(x=>x.tipo!=='skip').reduce((a,x)=>a+(parseInt(x.duracao)||0),0)} min\n`;
  return txt;
}

function gerarRelatorio(dl=true) {
  const ini=document.getElementById('rel-inicio').value;
  const fim=document.getElementById('rel-fim').value;
  if(!ini||!fim){toast('Selecione o período','error');return;}
  const txt=buildRelatorio(ini,fim);
  document.getElementById('rel-texto').textContent=txt;
  document.getElementById('preview-card').style.display='block';
  if(dl){
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain;charset=utf-8'}));
    a.download=`relatorio_bruno_${ini}_${fim}.txt`; a.click();
    toast('Relatório baixado ✓');
  }
}

// ── MODAL ────────────────────────────────────────────────────
function initModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeModal(); });
}

function openModal(id) {
  const e=EXERCICIOS_INFO[id]; if(!e) return;
  document.getElementById('modal-title').textContent=e.nome;
  document.getElementById('modal-video-link').href=e.video;
  document.getElementById('modal-musculos').innerHTML=e.musculos.map(m=>`<span class="modal-tag">${m}</span>`).join('');
  document.getElementById('modal-steps').innerHTML=e.passos.map((p,i)=>`<li data-n="${i+1}">${p}</li>`).join('');
  document.getElementById('modal-dica').textContent=e.dica;
  document.getElementById('modal-prescricao').innerHTML=`
    <div class="modal-pres-item"><strong>${e.series}</strong>séries</div>
    <div class="modal-pres-item"><strong>${e.reps}</strong>${e.unidade.includes('seg')?'segundos':e.unidade==='reps'?'reps':'reps'}</div>
    <div class="modal-pres-item"><strong>${e.descanso}</strong>descanso</div>
    <div class="modal-pres-item"><strong>${e.carga_inicial}</strong>ref. inicial</div>`;
  document.getElementById('modal-overlay').classList.add('open');
}

function openModalCasa(id) {
  const e = EXERCICIOS_CASA[id]; if(!e) return;
  document.getElementById('modal-title').textContent = e.nome;
  document.getElementById('modal-video-link').href = e.video;
  document.getElementById('modal-musculos').innerHTML = e.musculos.map(m=>`<span class="modal-tag">${m}</span>`).join('');
  document.getElementById('modal-steps').innerHTML = e.passos.map((p,i)=>`<li data-n="${i+1}">${p}</li>`).join('');
  document.getElementById('modal-dica').textContent = e.dica;
  document.getElementById('modal-prescricao').innerHTML = `
    <div class="modal-pres-item"><strong>${e.series}</strong>séries</div>
    <div class="modal-pres-item"><strong>${e.reps}</strong>reps</div>
    <div class="modal-pres-item"><strong>${e.descanso}</strong>descanso</div>
    <div class="modal-pres-item"><strong>Peso do corpo</strong>sem carga</div>`;
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ── UTIL ─────────────────────────────────────────────────────
function setTodayDate() {
  const el=document.getElementById('today-date');
  if(el) el.textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
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
