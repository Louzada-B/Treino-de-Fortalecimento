// ── CONSTANTES ─────────────────────────────────────────────
const RACE_DATE  = new Date('2026-07-12T08:00:00');
const PLAN_START = new Date('2026-05-25T00:00:00');

// ── SUPABASE CONFIG ─────────────────────────────────────────
const SUPA_URL = 'https://bpucodlhjnrvhxztilwp.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwdWNvZGxoam5ydmh4enRpbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODk4NjgsImV4cCI6MjA5NjQ2NTg2OH0.1BCqH3fkuRXBjkyyJ0et8xQbw05ipOXoxq8BkhZbFRA';

let currentToken = null;
let currentUser  = null;

function supaHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPA_KEY,
    'Authorization': 'Bearer ' + (currentToken || SUPA_KEY),
  };
}

// ── DADOS DE TREINO (carregados do banco) ───────────────────
let DB_EXERCICIOS = {};
let DB_PROGRESSAO = {};
let DB_WARMUP     = {};
let TREINOS_DB    = {};

async function carregarTreinos() {
  try {
    const [exRes, progRes, wupRes] = await Promise.all([
      fetch(`${SUPA_URL}/rest/v1/exercicios?order=id.asc`, { headers: supaHeaders() }),
      fetch(`${SUPA_URL}/rest/v1/progressao?order=exercicio_id.asc,semana.asc`, { headers: supaHeaders() }),
      fetch(`${SUPA_URL}/rest/v1/warmup?order=treino.asc,tipo.asc,ordem.asc`, { headers: supaHeaders() }),
    ]);

    const exercicios = await exRes.json();
    const progressao = await progRes.json();
    const warmup     = await wupRes.json();

    // Montar DB_EXERCICIOS
    DB_EXERCICIOS = {};
    exercicios.forEach(e => {
      DB_EXERCICIOS[e.id] = {
        id: e.id, treino: e.treino, nome: e.nome, unidade: e.unidade,
        musculos: e.musculos || [], series: e.series, reps: e.reps,
        descanso: e.descanso, carga_inicial: e.carga_inicial,
        video: e.video, passos: e.passos || [], dica: e.dica,
      };
    });

    // Montar DB_PROGRESSAO
    DB_PROGRESSAO = {};
    progressao.forEach(p => {
      if (!DB_PROGRESSAO[p.exercicio_id]) DB_PROGRESSAO[p.exercicio_id] = [];
      DB_PROGRESSAO[p.exercicio_id].push({
        semana: p.semana, series: p.series, reps: p.reps,
        carga_ref: p.carga_ref, obs: p.obs || '',
      });
    });

    // Montar DB_WARMUP
    DB_WARMUP = {};
    warmup.forEach(w => {
      const key = w.treino;
      if (!DB_WARMUP[key]) DB_WARMUP[key] = { aquecimento: [], alongamento: [] };
      DB_WARMUP[key][w.tipo].push({ nome: w.nome, detalhe: w.detalhe });
    });

    // Montar TREINOS_DB
    const treinosMap = {};
    Object.values(DB_EXERCICIOS).forEach(e => {
      if (!treinosMap[e.treino]) treinosMap[e.treino] = [];
      treinosMap[e.treino].push(e.id);
    });

    TREINOS_DB = {};
    const nomes = { A: 'Treino A', B: 'Treino B' };
    const descs = {
      A: isRitieli() ? 'Membros inferiores e glúteo' : 'Quadril, glúteo e estabilidade de joelho',
      B: isRitieli() ? 'Membros superiores e core'  : 'Core, estabilidade lombar e cadeia posterior',
    };
    Object.keys(treinosMap).forEach(t => {
      TREINOS_DB[t] = {
        nome: nomes[t] || t,
        desc: descs[t] || '',
        exercicios: treinosMap[t].sort(),
      };
    });

    console.log(`Treinos carregados: ${Object.keys(DB_EXERCICIOS).length} exercícios`);
    return true;
  } catch(e) {
    console.error('Erro ao carregar treinos:', e);
    return false;
  }
}

function getExercicioInfo(id) {
  return DB_EXERCICIOS[id] || null;
}

function getProgressaoAtiva(id) {
  const prog = DB_PROGRESSAO[id];
  if (!prog) return null;
  const week = isRitieli() ? currentWeekNumberRitieli() : currentWeekNumber();
  return prog.find(p => p.semana === week) || prog[prog.length - 1];
}

function getWarmupAtivo(tipo) {
  return DB_WARMUP[tipo] || { aquecimento: [], alongamento: [] };
}

function getTreinosAtivos() {
  // Adiciona CASA apenas para Bruno
  if (!isRitieli()) {
    return { ...TREINOS_DB, CASA: TREINOS_CASA };
  }
  return TREINOS_DB;
}

function allExercises() {
  return [...Object.values(DB_EXERCICIOS), ...Object.values(EXERCICIOS_CASA)];
}

// ── TREINO CASA (mantido no código — só para Bruno) ─────────
const TREINOS_CASA = {
  nome: 'Treino Casa', desc: 'Ativação, panturrilha e mobilidade lombar — sem equipamento',
  exercicios: ['c1','c2','c3','c4','c5','c6','c7','c8'],
};

const EXERCICIOS_CASA = {
  c1: { id:'c1', treino:'CASA', nome:'Clamshell (sem carga)', unidade:'reps', musculos:['Glúteo médio','Glúteo mínimo'], series:'3', reps:'15 cada lado', descanso:'30 seg', carga_inicial:'Peso do corpo', video:'https://www.youtube.com/results?search_query=clamshell+exercicio+gluteo', passos:['Deita de lado no chão, joelhos dobrados a 90°, pés juntos.','Abre o joelho de cima como uma concha abrindo — sem deixar o quadril girar para trás.','Pausa de 1 seg no topo sentindo o glúteo lateral.','Fecha controlado. Não deixa o pé de cima sair do lugar.','Faz as 15 reps e troca de lado.'], dica:'Se tiver elástico em casa, coloca acima dos joelhos para aumentar a dificuldade sem precisar de peso.' },
  c2: { id:'c2', treino:'CASA', nome:'Ponte glútea com pausa', unidade:'reps', musculos:['Glúteo máximo','Isquiotibiais','Core'], series:'3', reps:'15', descanso:'45 seg', carga_inicial:'Peso do corpo', video:'https://www.youtube.com/results?search_query=ponte+glutea+execucao+correta', passos:['Deita de costas, joelhos dobrados, pés apoiados no chão na largura dos ombros.','Empurra o quadril para cima contraindo o glúteo até o corpo ficar reto.','PAUSA de 2 segundos no topo — esprema o glúteo ao máximo.','Desce controlado sem encostar completamente o quadril no chão entre as reps.','Lombar não arqueia — o movimento é todo no quadril.'], dica:'Para progredir sem peso, tenta unilateral: uma perna esticada no ar enquanto empurra com a outra.' },
  c3: { id:'c3', treino:'CASA', nome:'Abdução em pé sem carga', unidade:'reps', musculos:['Glúteo médio','Glúteo mínimo'], series:'3', reps:'20 cada lado', descanso:'30 seg', carga_inicial:'Peso do corpo', video:'https://www.youtube.com/results?search_query=abdução+quadril+em+pé+sem+peso', passos:['Fica em pé segurando numa parede ou cadeira para equilíbrio.','Levanta a perna para o lado controlado até uns 45° — sem inclinar o tronco.','Pausa de 1 seg no topo sentindo o glúteo lateral.','Desce devagar. Não deixa a perna cair.','Faz as 20 reps e troca de lado.'], dica:'Movimento lento vale mais do que amplitude grande.' },
  c4: { id:'c4', treino:'CASA', nome:'Elevação na ponta dos pés (unilateral)', unidade:'reps', musculos:['Gastrocnêmio','Sóleo','Tendão de Aquiles'], series:'3', reps:'15 cada pé', descanso:'30 seg', carga_inicial:'Peso do corpo', video:'https://www.youtube.com/results?search_query=elevação+panturrilha+unilateral+sem+peso', passos:['Fica em pé segurando numa parede ou cadeira. Usa apenas uma perna.','Se tiver um degrau, apoia a ponta do pé nele para ter amplitude maior.','Sobe na ponta do pé até o máximo. Pausa de 1 seg no topo.','Desce devagar em 3 segundos, calcanhar abaixo do nível do apoio se possível.','Não quique no fundo.'], dica:'Sem degrau funciona bem também. O importante é a amplitude e a descida controlada.' },
  c5: { id:'c5', treino:'CASA', nome:'Elevação no calcanhar (unilateral)', unidade:'reps', musculos:['Tibial anterior','Estabilizadores do tornozelo'], series:'3', reps:'15 cada pé', descanso:'30 seg', carga_inicial:'Peso do corpo', video:'https://www.youtube.com/results?search_query=tibial+anterior+exercicio+calcanhar', passos:['Fica em pé encostado na parede para equilíbrio. Usa apenas uma perna.','Levanta a ponta do pé do chão ficando apoiado só no calcanhar.','Sobe até o máximo que conseguir. Pausa de 1 seg.','Desce controlado.','Vai sentir o músculo na frente da canela trabalhar.'], dica:'Músculo muito importante para corrida — controla o impacto a cada passada.' },
  c6: { id:'c6', treino:'CASA', nome:'Gato-vaca', unidade:'reps', musculos:['Multífidos','Eretor da espinha','Mobilidade torácica'], series:'3', reps:'10', descanso:'30 seg', carga_inicial:'Peso do corpo', video:'https://www.youtube.com/results?search_query=gato+vaca+mobilidade+coluna', passos:['De quatro no chão, mãos abaixo dos ombros, joelhos abaixo do quadril.','VACA: arqueia a coluna para baixo, cabeça e bumbum para cima. Inspira.','GATO: curva a coluna para cima, cabeça e bumbum para baixo. Expira.','Movimento lento e contínuo, respirando em cada posição.','Não força — é mobilidade, não força.'], dica:'Excelente para soltar a lombar travada. Quanto mais devagar, melhor.' },
  c7: { id:'c7', treino:'CASA', nome:'90/90 de quadril', unidade:'segundos', musculos:['Piriforme','Rotadores externos do quadril'], series:'2', reps:'40 seg cada lado', descanso:'20 seg', carga_inicial:'Peso do corpo', video:'https://www.youtube.com/results?search_query=alongamento+90+90+quadril', passos:['Senta no chão com uma perna dobrada a 90° na frente e outra dobrada a 90° atrás.','Fica ereto, sem curvar a lombar.','Sente o alongamento profundo no quadril e glúteo da perna da frente.','Respira fundo e relaxa a cada expiração.','Troca de lado após 40 segundos.'], dica:'Um dos melhores alongamentos para quem teve banda IT.' },
  c8: { id:'c8', treino:'CASA', nome:'Figura 4 deitado', unidade:'segundos', musculos:['Piriforme','Glúteo médio'], series:'2', reps:'40 seg cada lado', descanso:'20 seg', carga_inicial:'Peso do corpo', video:'https://www.youtube.com/results?search_query=alongamento+figura+4+piriforme+deitado', passos:['Deita de costas, joelhos dobrados, pés no chão.','Cruza o tornozelo direito no joelho esquerdo — forma um número 4.','Puxa a perna esquerda em direção ao peito segurando atrás da coxa.','Sente o alongamento no glúteo e quadril da perna cruzada.','Respira fundo e relaxa. Troca de lado.'], dica:'Alivia diretamente a tensão no piriforme.' },
};

// ── PERFIS DE USUÁRIO ────────────────────────────────────────
const USUARIOS = {
  'brunoellouzada@gmail.com':  { nome: 'Bruno Elias',     iniciais: 'BEL', plano: 'BRUNO'   },
  'ritielihermes@gmail.com':   { nome: 'Ritieli Hermes',  iniciais: 'RH',  plano: 'RITIELI' },
};

function getPerfilUsuario() {
  return currentUser ? (USUARIOS[currentUser.email] || { nome: currentUser.email, iniciais: '?', plano: 'BRUNO' }) : null;
}

function isRitieli() {
  return currentUser?.email === 'ritielihermes@gmail.com';
}

// ── AUTH ────────────────────────────────────────────────────
async function loginSupabase(email, password) {
  const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || 'Erro ao fazer login');
  currentToken = data.access_token;
  currentUser  = data.user;
  localStorage.setItem('runner_token', currentToken);
  localStorage.setItem('runner_user', JSON.stringify(currentUser));
  return data;
}

async function restoreSession() {
  const token = localStorage.getItem('runner_token');
  const user  = localStorage.getItem('runner_user');
  if (!token || !user) return false;
  currentToken = token;
  currentUser  = JSON.parse(user);
  try {
    const res = await fetch(`${SUPA_URL}/auth/v1/user`, {
      headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) { logoutLocal(); return false; }
    return true;
  } catch { return false; }
}

function logoutLocal() {
  currentToken = null; currentUser = null;
  localStorage.removeItem('runner_token');
  localStorage.removeItem('runner_user');
  localStorage.removeItem('runner_bruno_v2');
}

// ── STORAGE (sessões) ────────────────────────────────────────
function getDBKey() { return currentUser ? `runner_db_${currentUser.id}` : 'runner_bruno_v2'; }
function getDB() { try { return JSON.parse(localStorage.getItem(getDBKey()) || '[]'); } catch { return []; } }
function saveDB(d) { localStorage.setItem(getDBKey(), JSON.stringify(d)); }

async function fetchSessoes() {
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/sessoes?order=data.asc`, { headers: supaHeaders() });
    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    const db = rows.map(r => ({ id: r.id, data: r.data, tipo: r.tipo, exercicios: r.exercicios || {}, duracao: r.duracao || '', feeling: r.feeling || '', obs: r.obs || '' }));
    saveDB(db);
    return db;
  } catch(e) { console.error('Supabase fetch error:', e); return getDB(); }
}

async function upsertSessao(sess) {
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/sessoes`, {
      method: 'POST',
      headers: { ...supaHeaders(), 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ id: sess.id, data: sess.data, tipo: sess.tipo, exercicios: sess.exercicios, duracao: sess.duracao, feeling: sess.feeling, obs: sess.obs, user_id: currentUser?.id })
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch(e) { console.error('Supabase upsert error:', e); return false; }
}

async function deleteSessao(id) {
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/sessoes?id=eq.${id}`, { method: 'DELETE', headers: supaHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch(e) { console.error('Supabase delete error:', e); return false; }
}

// ── SEMANAS ─────────────────────────────────────────────────
function currentWeekNumber() {
  return Math.min(7, Math.max(1, Math.floor((new Date() - PLAN_START) / (7*86400000)) + 1));
}

function getPlanStartRitieli() {
  let stored = localStorage.getItem('ritieli_plan_start');
  if (!stored) {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    stored = hoje.toISOString();
    localStorage.setItem('ritieli_plan_start', stored);
  }
  return new Date(stored);
}

function currentWeekNumberRitieli() {
  const start = getPlanStartRitieli();
  return Math.min(7, Math.max(1, Math.floor((new Date() - start) / (7*86400000)) + 1));
}

// ── FASE ────────────────────────────────────────────────────
const FASES = [
  { semanas:[1,2], nome:'Fase 1 — Estabilidade e ativação', desc:'Cargas leves. Foco em técnica e ativação muscular.' },
  { semanas:[3,4], nome:'Fase 1 — Progresso inicial',       desc:'+10–15% de carga. Mantendo qualidade de execução.' },
  { semanas:[5,6], nome:'Fase 2 — Força funcional',         desc:'Pico de carga. Adiciona 1 série nos exercícios principais.' },
  { semanas:[7],   nome:'Fase 3 — Descarga pré-prova',      desc:'Volume reduzido. Corpo descansa para a NB42k.' },
];

function currentPhase() {
  const w = currentWeekNumber();
  return FASES.find(f => f.semanas.includes(w)) || { nome:'Plano encerrado', desc:'Boa prova!' };
}

// ── HELPERS ─────────────────────────────────────────────────
function daysUntilRace() {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.max(0, Math.ceil((RACE_DATE - today) / 86400000));
}
function fmtDate(ds) { return new Date(ds+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}); }
function fmtDateLong(ds) { return new Date(ds+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}); }
function getWeekStart(offset=0) { const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay()-offset*7); return d; }
function toast(msg, type='success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
