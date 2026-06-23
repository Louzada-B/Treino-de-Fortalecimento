// ── CONSTANTES ─────────────────────────────────────────────
const RACE_DATE  = new Date('2026-07-12T08:00:00');
const PLAN_START = new Date('2026-05-25T00:00:00');

// ── SUPABASE CONFIG ─────────────────────────────────────────
const SUPA_URL = 'https://bpucodlhjnrvhxztilwp.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwdWNvZGxoam5ydmh4enRpbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODk4NjgsImV4cCI6MjA5NjQ2NTg2OH0.1BCqH3fkuRXBjkyyJ0et8xQbw05ipOXoxq8BkhZbFRA';

// Token do usuário logado (atualizado após login)
let currentToken = null;
let currentUser  = null;

function supaHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPA_KEY,
    'Authorization': 'Bearer ' + (currentToken || SUPA_KEY),
  };
}

// ── PERFIS DE USUÁRIO ────────────────────────────────────────
const USUARIOS = {
  'brunoellouzada@gmail.com': {
    nome: 'Bruno Elias',
    iniciais: 'BEL',
    plano: 'BRUNO',
  },
  'ritielihermes@gmail.com': {
    nome: 'Ritieli Hermes',
    iniciais: 'RH',
    plano: 'RITIELI',
  },
};

function getPerfilUsuario() {
  return currentUser ? (USUARIOS[currentUser.email] || { nome: currentUser.email, iniciais: '?', plano: 'BRUNO' }) : null;
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
  // Valida o token
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

// ── STORAGE ─────────────────────────────────────────────────
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

// ── PROGRESSÃO SEMANAL ──────────────────────────────────────
const PROGRESSAO = {
  a1: [
    { semana:1, series:3, reps:'10/8/6', carga_ref:'15→20→30 kg cada lado', obs:'' },
    { semana:2, series:3, reps:'10/8/6', carga_ref:'15→20→30 kg cada lado', obs:'' },
    { semana:3, series:3, reps:'10/8/6', carga_ref:'15→20→25 kg cada lado', obs:'⚠️ Lombar crônica. Carga conservadora. Testa Smith machine se disponível.' },
    { semana:4, series:3, reps:'10/8/6', carga_ref:'20→25→30 kg cada lado', obs:'Aumenta só se lombar estiver 100% ok.' },
    { semana:5, series:3, reps:'10/8/6', carga_ref:'10→15→20 kg cada lado — barra guiada', obs:'⚠️ Coluna sensível. Barra guiada obrigatória. Sem aumento de carga.' },
    { semana:6, series:3, reps:'10/8/6', carga_ref:'10→15→20 kg cada lado — barra guiada', obs:'⚠️ Pré-prova. Mantém cargas conservadoras. Barra guiada.' },
    { semana:7, series:2, reps:'8/6', carga_ref:'20→30 kg cada lado', obs:'Descarga pré-prova. Carga reduzida.' },
  ],
  a2: [
    { semana:1, series:3, reps:'15–20', carga_ref:'50 kg — foco na contração', obs:'Pausa de 1 seg aberto. Sinta no glúteo lateral.' },
    { semana:2, series:3, reps:'15–20', carga_ref:'50 kg', obs:'' },
    { semana:3, series:3, reps:'15–20', carga_ref:'55 kg', obs:'+5kg.' },
    { semana:4, series:3, reps:'15–20', carga_ref:'60 kg', obs:'+5kg.' },
    { semana:5, series:3, reps:'15', carga_ref:'63 kg', obs:'Mantém 63kg. Sem série extra por ora.' },
    { semana:6, series:3, reps:'15', carga_ref:'63 kg', obs:'⚠️ Pré-prova. Mantém 63kg.' },
    { semana:7, series:2, reps:'15', carga_ref:'55 kg', obs:'Descarga pré-prova.' },
  ],
  a3: [
    { semana:1, series:3, reps:'12', carga_ref:'— (sem carga)', obs:'Aprende o movimento. Na máquina se disponível.' },
    { semana:2, series:3, reps:'12', carga_ref:'10 kg — 10 reps', obs:'⚠️ Dor na primeira sessão. 10kg, 10 reps. Pausa 2 seg no topo.' },
    { semana:3, series:3, reps:'10', carga_ref:'10 kg nas 3 séries', obs:'⚠️ Mantém 10kg. Foca na contração do glúteo e pausa.' },
    { semana:4, series:3, reps:'12', carga_ref:'20 kg', obs:'Aumenta se não houver dor lombar.' },
    { semana:5, series:3, reps:'10', carga_ref:'20 kg nas 3 séries', obs:'Mantém 20kg. Foca na execução.' },
    { semana:6, series:3, reps:'10', carga_ref:'20 kg nas 3 séries', obs:'⚠️ Pré-prova. Mantém 20kg.' },
    { semana:7, series:2, reps:'10', carga_ref:'20 kg', obs:'Descarga pré-prova.' },
  ],
  a4: [
    { semana:1, series:3, reps:'12', carga_ref:'10 kg — descida em 4 seg', obs:'⚠️ Dor no joelho direito. 10kg nas 3 séries. Descida lenta 4 seg.' },
    { semana:2, series:3, reps:'12', carga_ref:'10 kg — descida em 4 seg', obs:'⚠️ Mantém 10kg até joelho confirmar ausência de dor.' },
    { semana:3, series:3, reps:'12', carga_ref:'14 kg — descida 4 seg', obs:'Mantém 14kg se joelho ficou sem dor na semana 2.' },
    { semana:4, series:3, reps:'12', carga_ref:'16 kg', obs:'+2kg se joelho ok.' },
    { semana:5, series:3, reps:'12', carga_ref:'14 kg — descida 4 seg', obs:'Mantém 14kg. Descida lenta 4 seg.' },
    { semana:6, series:3, reps:'12', carga_ref:'14 kg — descida 4 seg', obs:'⚠️ Pré-prova. Mantém 14kg.' },
    { semana:7, series:2, reps:'10', carga_ref:'12 kg', obs:'Descarga pré-prova.' },
  ],
  a5: [
    { semana:1, series:3, reps:'15', carga_ref:'30 kg bilateral', obs:'Bilateral. Dois pés juntos.' },
    { semana:2, series:3, reps:'15', carga_ref:'30 kg bilateral', obs:'Bilateral.' },
    { semana:3, series:3, reps:'15', carga_ref:'30 kg bilateral', obs:'Bilateral.' },
    { semana:4, series:3, reps:'15', carga_ref:'30 kg bilateral', obs:'Bilateral.' },
    { semana:5, series:3, reps:'15', carga_ref:'30 kg bilateral', obs:'Bilateral. Mantém carga estável pré-prova.' },
    { semana:6, series:3, reps:'15', carga_ref:'30 kg bilateral', obs:'Bilateral. Semana de pico.' },
    { semana:7, series:2, reps:'12', carga_ref:'25 kg bilateral', obs:'Descarga pré-prova.' },
  ],
  b1: [
    { semana:1, series:3, reps:'35 seg', carga_ref:'Peso do corpo', obs:'' },
    { semana:2, series:3, reps:'40 seg', carga_ref:'Peso do corpo', obs:'+5 seg.' },
    { semana:3, series:3, reps:'45 seg', carga_ref:'Peso do corpo', obs:'+5 seg.' },
    { semana:4, series:3, reps:'50 seg', carga_ref:'Peso do corpo', obs:'+5 seg.' },
    { semana:5, series:3, reps:'50 seg', carga_ref:'Peso do corpo', obs:'+5 seg em relação à semana 4.' },
    { semana:6, series:3, reps:'55 seg', carga_ref:'Peso do corpo', obs:'Semana de pico.' },
    { semana:7, series:2, reps:'35 seg', carga_ref:'Peso do corpo', obs:'Descarga pré-prova.' },
  ],
  b2: [
    { semana:1, series:3, reps:'20 seg', carga_ref:'Peso do corpo', obs:'Lombar colada no chão. Começa com 20 seg.' },
    { semana:2, series:3, reps:'20 seg', carga_ref:'Peso do corpo', obs:'Consolida a posição.' },
    { semana:3, series:3, reps:'25 seg', carga_ref:'Peso do corpo', obs:'+5 seg.' },
    { semana:4, series:3, reps:'25 seg', carga_ref:'Peso do corpo', obs:'Mantém e consolida.' },
    { semana:5, series:3, reps:'25 seg', carga_ref:'Peso do corpo', obs:'Mantém 25 seg com boa execução.' },
    { semana:6, series:3, reps:'25 seg', carga_ref:'Peso do corpo', obs:'⚠️ Pré-prova. Mantém 25 seg.' },
    { semana:7, series:2, reps:'20 seg', carga_ref:'Peso do corpo', obs:'Descarga pré-prova.' },
  ],
  b3: [
    { semana:1, series:3, reps:'12', carga_ref:'12 kg nas 3 séries', obs:'' },
    { semana:2, series:3, reps:'12', carga_ref:'14 kg nas 3 séries', obs:'+2kg.' },
    { semana:3, series:3, reps:'12', carga_ref:'16 kg', obs:'+2kg.' },
    { semana:4, series:3, reps:'12', carga_ref:'18 kg', obs:'+2kg.' },
    { semana:5, series:3, reps:'12', carga_ref:'18 kg', obs:'Mantém 3 séries.' },
    { semana:6, series:3, reps:'12', carga_ref:'18 kg', obs:'⚠️ Pré-prova. Mantém 18kg.' },
    { semana:7, series:2, reps:'10', carga_ref:'16 kg', obs:'Descarga pré-prova.' },
  ],
  b4: [
    { semana:1, series:3, reps:'15', carga_ref:'20 kg na máquina', obs:'Foco na contração entre as escápulas.' },
    { semana:2, series:3, reps:'15', carga_ref:'25 kg nas 3 séries', obs:'Consolida 25kg com boa execução.' },
    { semana:3, series:3, reps:'15', carga_ref:'25 kg nas 3 séries', obs:'⚠️ Não aumenta carga. Consolida execução antes de progredir.' },
    { semana:4, series:3, reps:'15', carga_ref:'27 kg', obs:'+2kg.' },
    { semana:5, series:3, reps:'15', carga_ref:'25 kg', obs:'Mantém 25kg com boa execução.' },
    { semana:6, series:3, reps:'15', carga_ref:'25 kg', obs:'⚠️ Pré-prova. Mantém 25kg.' },
    { semana:7, series:2, reps:'12', carga_ref:'22 kg', obs:'Descarga pré-prova.' },
  ],
  b5: [
    { semana:1, series:3, reps:'20 passos', carga_ref:'20→30→30 kg cada mão', obs:'Tronco estável. Não inclinar para os lados.' },
    { semana:2, series:3, reps:'20 passos', carga_ref:'30 kg cada mão', obs:'Constante nas 3 séries.' },
    { semana:3, series:3, reps:'20 passos', carga_ref:'32 kg cada mão', obs:'+2kg.' },
    { semana:4, series:3, reps:'20 passos', carga_ref:'34 kg cada mão', obs:'+2kg.' },
    { semana:5, series:3, reps:'20 passos', carga_ref:'32 kg cada mão', obs:'Mantém 32kg.' },
    { semana:6, series:3, reps:'20 passos', carga_ref:'32 kg cada mão', obs:'⚠️ Pré-prova. Mantém 32kg.' },
    { semana:7, series:2, reps:'20 passos', carga_ref:'28 kg cada mão', obs:'Descarga pré-prova.' },
  ],
};

// ── AQUECIMENTO & ALONGAMENTO ───────────────────────────────
const WARMUP = {
  A: {
    aquecimento: [
      { nome: 'Clamshell com elástico',              detalhe: '15 reps cada lado — elástico acima dos joelhos' },
      { nome: 'Agachamento livre com pausa embaixo', detalhe: '10 reps — 3 seg no fundo, lombar neutra' },
      { nome: 'Leg swing frontal e lateral',         detalhe: '10 reps cada direção, cada perna — segure na parede' },
    ],
    alongamento: [
      { nome: 'Piriforme (figura 4 no chão)',  detalhe: '40 seg cada lado — deita de costas, cruza o tornozelo no joelho oposto' },
      { nome: 'Posterior deitado',             detalhe: '40 seg cada lado — puxa a perna esticada com as mãos' },
    ],
  },
  B: {
    aquecimento: [
      { nome: 'Gato-vaca',                        detalhe: '10 reps lentas — de quatro, alterna arqueamento e curvamento da coluna' },
      { nome: 'Bird-dog',                         detalhe: '10 reps cada lado — estende braço e perna opostos simultaneamente' },
      { nome: 'Ponte glútea com pausa de 2 seg',  detalhe: '10 reps — deitado, empurra quadril para cima e segura' },
    ],
    alongamento: [
      { nome: '90/90 de quadril no chão',           detalhe: '40 seg cada lado — uma perna 90° na frente, outra 90° atrás' },
      { nome: 'Posterior em pé apoiado no banco',   detalhe: '40 seg cada lado — apoia calcanhar no banco, inclina o tronco' },
    ],
  },
};

// ── EXERCÍCIOS PRINCIPAIS ───────────────────────────────────
const EXERCICIOS_INFO = {
  a1: {
    id:'a1', treino:'A', nome:'Agachamento com barra', unidade:'kg cada lado',
    musculos:['Quadríceps','Glúteo máximo','Isquiotibiais','Core'],
    series:'3', reps:'10/8/6', descanso:'90 seg', carga_inicial:'15→20→30 kg cada lado',
    video:'https://www.youtube.com/results?search_query=agachamento+com+barra+execucao+correto',
    passos:['Posicione a barra na parte superior das costas (trapézio), não no pescoço.','Pés na largura dos ombros, levemente abertos para fora (30–45°).','Desça controlado por 2–3 seg, joelhos acompanhando a direção dos pés.','Desça até a coxa ficar paralela ao chão ou um pouco abaixo.','Suba empurrando o chão, expire na subida. Lombar neutra durante todo o movimento.'],
    dica:'Com 1,95m você tem alavancas longas — é normal o tronco inclinar um pouco mais. O importante é lombar neutra e joelhos alinhados.',
  },
  a2: {
    id:'a2', treino:'A', nome:'Abdução de quadril (máquina sentado)', unidade:'kg',
    musculos:['Glúteo médio','Glúteo mínimo','Tensor da fáscia lata'],
    series:'3', reps:'15–20', descanso:'60 seg', carga_inicial:'50 kg — foco na contração',
    video:'https://www.youtube.com/results?search_query=abdução+de+quadril+máquina+sentado',
    passos:['Sente-se na máquina com as costas retas encostadas no apoio.','Pés apoiados, joelhos a 90°. Almofadas nas partes externas dos joelhos.','Abra as pernas controlado até o máximo da amplitude sem compensar com o tronco.','PAUSA de 1 segundo na posição aberta — sinta a contração no glúteo lateral.','Feche lentamente (3 seg) — não deixe a máquina bater.'],
    dica:'Este é o exercício mais importante para PREVENIR a recidiva da síndrome da banda IT. Priorize a contração, não a carga.',
  },
  a3: {
    id:'a3', treino:'A', nome:'Hip thrust (máquina)', unidade:'kg',
    musculos:['Glúteo máximo','Isquiotibiais','Core'],
    series:'3', reps:'10–12', descanso:'90 seg', carga_inicial:'10 kg',
    video:'https://www.youtube.com/results?search_query=hip+thrust+máquina+execução',
    passos:['Ajuste o banco para que os ombros fiquem na borda acolchoada.','Pés apoiados no chão, na largura dos ombros. Joelhos a 90° no topo.','Empurre o quadril para CIMA contraindo o glúteo — corpo fica reto.','PAUSA de 2 segundos no topo — esprema o glúteo ao máximo.','Desça controlado sem deixar o quadril tocar o chão entre as reps.'],
    dica:'⚠️ Movimento novo com dor inicial. A lombar NÃO dobra. O movimento é 100% no quadril. Começa leve e progride devagar.',
  },
  a4: {
    id:'a4', treino:'A', nome:'Cadeira extensora unilateral', unidade:'kg',
    musculos:['Quadríceps (foco no VMO — vasto medial)'],
    series:'3', reps:'12 cada perna', descanso:'60 seg', carga_inicial:'10 kg — descida lenta 4 seg',
    video:'https://www.youtube.com/results?search_query=cadeira+extensora+unilateral+execução',
    passos:['Ajuste o banco para que o joelho fique alinhado com o eixo da máquina.','Use apenas uma perna por vez.','Estenda a perna controlado até quase reto — não trave o joelho no final.','PAUSA de 1 seg no topo, contraindo o quadríceps.','Desça em 4 segundos — fase excêntrica lenta protege o joelho.'],
    dica:'⚠️ Joelho direito sensível. Descida em 4 seg obrigatória. Não aumenta carga enquanto houver qualquer desconforto.',
  },
  a5: {
    id:'a5', treino:'A', nome:'Panturrilha bilateral em pé', unidade:'kg',
    musculos:['Gastrocnêmio','Sóleo','Tendão de Aquiles'],
    series:'3', reps:'15', descanso:'60 seg', carga_inicial:'30 kg',
    video:'https://www.youtube.com/results?search_query=panturrilha+bilateral+em+pé+execução',
    passos:['Fique em pé com os dois pés na borda de um degrau ou plataforma, largura dos ombros.','Segure algum apoio para equilíbrio se necessário.','Desça os calcanhares abaixo do nível do apoio — sinta o alongamento nas duas panturrilhas.','Suba até o máximo elevando os calcanhares — PAUSA de 1 seg no topo.','Desça em 3 segundos. Não quique no fundo.'],
    dica:'Mudança para bilateral para proteger o pé esquerdo nas semanas finais antes da prova. Mesma qualidade de estímulo com menos risco.',
  },
  b1: {
    id:'b1', treino:'B', nome:'Prancha frontal', unidade:'segundos',
    musculos:['Core (transverso do abdômen)','Glúteo','Estabilizadores da coluna'],
    series:'3', reps:'45 seg', descanso:'45 seg', carga_inicial:'Peso do corpo',
    video:'https://www.youtube.com/results?search_query=prancha+frontal+execução+correta',
    passos:['Apoie nos antebraços e pontas dos pés. Cotovelos abaixo dos ombros.','Corpo reto da cabeça ao calcanhar — não deixe o quadril subir ou afundar.','Contraia o abdômen como se fosse levar um soco. Respire normalmente.','Olhe para o chão, pescoço neutro.','Se sentir dor lombar, reduza o tempo ou apoie os joelhos.'],
    dica:'Se conseguir mais de 55 seg com boa forma, evolua para prancha com elevação alternada de perna.',
  },
  b2: {
    id:'b2', treino:'B', nome:'Hollow body hold', unidade:'segundos',
    musculos:['Transverso do abdômen','Multífidos (lombar)','Iliopsoas','Quadríceps'],
    series:'3', reps:'25 seg', descanso:'45 seg', carga_inicial:'Peso do corpo',
    video:'https://www.youtube.com/results?search_query=hollow+body+hold+execução+core',
    passos:['Deita de costas, lombar completamente colada no chão.','Estica os braços atrás da cabeça e as pernas à frente, levantando ambos levemente do chão.','Corpo forma uma "casca" côncava — como uma banana de cabeça para baixo.','LOMBAR NO CHÃO o tempo todo. Se descolar, levanta mais as pernas.','Segura a posição respirando normalmente.'],
    dica:'Substituiu o dead bug por ser mais simples de coordenar. Trabalha os mesmos músculos. Se 25 seg ficar fácil, sobe para 30 seg.',
  },
  b3: {
    id:'b3', treino:'B', nome:'Remada unilateral apoiada no banco', unidade:'kg',
    musculos:['Latíssimo do dorso','Romboides','Bíceps','Core'],
    series:'3', reps:'12 cada lado', descanso:'75 seg', carga_inicial:'16 kg nas 3 séries',
    video:'https://www.youtube.com/results?search_query=remada+unilateral+banco+execução',
    passos:['Apoie o joelho e a mão do MESMO lado no banco. Corpo paralelo ao chão.','Segure o halter com a outra mão. Lombar reta e neutra.','Puxe o halter em direção ao quadril. O cotovelo vai para trás e para cima.','Não gire o tronco — o movimento é só do braço.','Desça o halter completamente antes de puxar de novo.'],
    dica:'Posição horizontal descarrega completamente a coluna. A remada mais indicada para quem tem histórico de dor lombar.',
  },
  b4: {
    id:'b4', treino:'B', nome:'Voador inverso (rear delt fly)', unidade:'kg',
    musculos:['Deltoide posterior','Romboides','Trapézio médio'],
    series:'3', reps:'15', descanso:'60 seg', carga_inicial:'25 kg na máquina',
    video:'https://www.youtube.com/results?search_query=voador+inverso+halter+execução+rear+delt',
    passos:['Em pé, incline o tronco para frente uns 45°. Joelhos levemente dobrados.','Segure um halter leve em cada mão, cotovelos levemente dobrados.','Abra os braços para os lados como asas, levantando até a altura dos ombros.','PAUSA de 1 seg no topo — sinta o aperto entre as escápulas.','Desça controlado. Não use impulso.'],
    dica:'⚠️ Não aumenta a carga ainda. Consolida 25kg com execução perfeita nas 3 séries antes de progredir.',
  },
  b5: {
    id:'b5', treino:'B', nome:"Farmer's carry", unidade:'kg cada mão',
    musculos:['Core lateral','Trapézio','Antebraços','Glúteo','Estabilizadores do tornozelo'],
    series:'3', reps:'20 passos', descanso:'60 seg', carga_inicial:'32 kg cada mão',
    video:'https://www.youtube.com/results?search_query=farmers+carry+execução+correto',
    passos:['Pegue um halter em cada mão, fique em pé.','Ombros para trás e para baixo. Lombar neutra. Abdômen levemente contraído.','Caminhe 20 passos em linha reta com passadas normais.','Não deixe os halteres puxar os ombros para baixo ou o tronco inclinar para os lados.','Respire normalmente durante toda a caminhada.'],
    dica:'Treina a estabilidade lateral do tronco — exatamente o que evita que o quadril afunde no impacto de cada passada na corrida.',
  },
};

// ── EXERCÍCIOS TREINO CASA ──────────────────────────────────
const EXERCICIOS_CASA = {
  c1: {
    id:'c1', treino:'CASA', nome:'Clamshell (sem carga)', unidade:'reps',
    musculos:['Glúteo médio','Glúteo mínimo'],
    series:'3', reps:'15 cada lado', descanso:'30 seg', carga_inicial:'Peso do corpo',
    video:'https://www.youtube.com/results?search_query=clamshell+exercicio+gluteo',
    passos:['Deita de lado no chão, joelhos dobrados a 90°, pés juntos.','Abre o joelho de cima como uma concha abrindo — sem deixar o quadril girar para trás.','Pausa de 1 seg no topo sentindo o glúteo lateral.','Fecha controlado. Não deixa o pé de cima sair do lugar.','Faz as 15 reps e troca de lado.'],
    dica:'Se tiver elástico em casa, coloca acima dos joelhos para aumentar a dificuldade sem precisar de peso.',
  },
  c2: {
    id:'c2', treino:'CASA', nome:'Ponte glútea com pausa', unidade:'reps',
    musculos:['Glúteo máximo','Isquiotibiais','Core'],
    series:'3', reps:'15', descanso:'45 seg', carga_inicial:'Peso do corpo',
    video:'https://www.youtube.com/results?search_query=ponte+glutea+execucao+correta',
    passos:['Deita de costas, joelhos dobrados, pés apoiados no chão na largura dos ombros.','Empurra o quadril para cima contraindo o glúteo até o corpo ficar reto.','PAUSA de 2 segundos no topo — esprema o glúteo ao máximo.','Desce controlado sem encostar completamente o quadril no chão entre as reps.','Lombar não arqueia — o movimento é todo no quadril.'],
    dica:'Para progredir sem peso, tenta unilateral: uma perna esticada no ar enquanto empurra com a outra.',
  },
  c3: {
    id:'c3', treino:'CASA', nome:'Abdução em pé sem carga', unidade:'reps',
    musculos:['Glúteo médio','Glúteo mínimo','Tensor da fáscia lata'],
    series:'3', reps:'20 cada lado', descanso:'30 seg', carga_inicial:'Peso do corpo',
    video:'https://www.youtube.com/results?search_query=abdução+quadril+em+pé+sem+peso',
    passos:['Fica em pé segurando numa parede ou cadeira para equilíbrio.','Levanta a perna para o lado controlado até uns 45° — sem inclinar o tronco.','Pausa de 1 seg no topo sentindo o glúteo lateral.','Desce devagar. Não deixa a perna cair.','Faz as 20 reps e troca de lado.'],
    dica:'Movimento lento vale mais do que amplitude grande. Sente o glúteo lateral trabalhando.',
  },
  c4: {
    id:'c4', treino:'CASA', nome:'Elevação na ponta dos pés (unilateral)', unidade:'reps',
    musculos:['Gastrocnêmio','Sóleo','Tendão de Aquiles'],
    series:'3', reps:'15 cada pé', descanso:'30 seg', carga_inicial:'Peso do corpo',
    video:'https://www.youtube.com/results?search_query=elevação+panturrilha+unilateral+sem+peso',
    passos:['Fica em pé segurando numa parede ou cadeira. Usa apenas uma perna.','Se tiver um degrau, apoia a ponta do pé nele para ter amplitude maior.','Sobe na ponta do pé até o máximo. Pausa de 1 seg no topo.','Desce devagar em 3 segundos, calcanhar abaixo do nível do apoio se possível.','Não quique no fundo — controla a descida.'],
    dica:'Sem degrau funciona bem também. O importante é a amplitude e a descida controlada.',
  },
  c5: {
    id:'c5', treino:'CASA', nome:'Elevação no calcanhar (unilateral)', unidade:'reps',
    musculos:['Tibial anterior','Estabilizadores do tornozelo'],
    series:'3', reps:'15 cada pé', descanso:'30 seg', carga_inicial:'Peso do corpo',
    video:'https://www.youtube.com/results?search_query=tibial+anterior+exercicio+calcanhar',
    passos:['Fica em pé encostado na parede para equilíbrio. Usa apenas uma perna.','Levanta a ponta do pé do chão ficando apoiado só no calcanhar.','Sobe até o máximo que conseguir. Pausa de 1 seg.','Desce controlado.','Vai sentir o músculo na frente da canela trabalhar — é o tibial anterior.'],
    dica:'Músculo muito importante para corrida — controla o impacto a cada passada e estabiliza o tornozelo.',
  },
  c6: {
    id:'c6', treino:'CASA', nome:'Gato-vaca', unidade:'reps',
    musculos:['Multífidos','Eretor da espinha','Mobilidade torácica'],
    series:'3', reps:'10', descanso:'30 seg', carga_inicial:'Peso do corpo',
    video:'https://www.youtube.com/results?search_query=gato+vaca+mobilidade+coluna',
    passos:['De quatro no chão, mãos abaixo dos ombros, joelhos abaixo do quadril.','VACA: arqueia a coluna para baixo, cabeça e bumbum para cima. Inspira.','GATO: curva a coluna para cima, cabeça e bumbum para baixo. Expira.','Movimento lento e contínuo, respirando em cada posição.','Não força — é mobilidade, não força.'],
    dica:'Excelente para soltar a lombar travada. Quanto mais devagar, melhor.',
  },
  c7: {
    id:'c7', treino:'CASA', nome:'90/90 de quadril', unidade:'segundos',
    musculos:['Piriforme','Rotadores externos do quadril','Glúteo médio'],
    series:'2', reps:'40 seg cada lado', descanso:'20 seg', carga_inicial:'Peso do corpo',
    video:'https://www.youtube.com/results?search_query=alongamento+90+90+quadril',
    passos:['Senta no chão com uma perna dobrada a 90° na frente e outra dobrada a 90° atrás.','Fica ereto, sem curvar a lombar.','Sente o alongamento profundo no quadril e glúteo da perna da frente.','Respira fundo e relaxa a cada expiração.','Troca de lado após 40 segundos.'],
    dica:'Um dos melhores alongamentos para quem teve banda IT. Faz com calma — quanto mais relaxar, mais profundo o alongamento.',
  },
  c8: {
    id:'c8', treino:'CASA', nome:'Figura 4 deitado', unidade:'segundos',
    musculos:['Piriforme','Glúteo médio','Rotadores do quadril'],
    series:'2', reps:'40 seg cada lado', descanso:'20 seg', carga_inicial:'Peso do corpo',
    video:'https://www.youtube.com/results?search_query=alongamento+figura+4+piriforme+deitado',
    passos:['Deita de costas, joelhos dobrados, pés no chão.','Cruza o tornozelo direito no joelho esquerdo — forma um número 4.','Puxa a perna esquerda em direção ao peito segurando atrás da coxa.','Sente o alongamento no glúteo e quadril da perna cruzada.','Respira fundo e relaxa. Troca de lado.'],
    dica:'Alivia diretamente a tensão no piriforme — músculo que quando tenso agrava dores lombares.',
  },
};

// ── TREINOS ORGANIZADOS ─────────────────────────────────────
const TREINOS = {
  A: {
    nome:'Treino A', desc:'Quadril, glúteo e estabilidade de joelho',
    focus:['Agachamento com barra','Abdução de quadril','Hip thrust','Cadeira extensora','Panturrilha'],
    exercicios:['a1','a2','a3','a4','a5'],
  },
  B: {
    nome:'Treino B', desc:'Core, estabilidade lombar e cadeia posterior',
    focus:['Prancha frontal','Hollow body hold','Remada unilateral','Voador inverso',"Farmer's carry"],
    exercicios:['b1','b2','b3','b4','b5'],
  },
  CASA: {
    nome:'Treino Casa', desc:'Ativação, panturrilha e mobilidade lombar — sem equipamento',
    focus:['Clamshell','Ponte glútea','Abdução em pé','Panturrilha','Calcanhar','Gato-vaca','90/90','Figura 4'],
    exercicios:['c1','c2','c3','c4','c5','c6','c7','c8'],
  },
};

const FASES = [
  { semanas:[1,2], nome:'Fase 1 — Estabilidade e ativação', desc:'Cargas leves. Foco em técnica e ativação muscular.' },
  { semanas:[3,4], nome:'Fase 1 — Progresso inicial',       desc:'+10–15% de carga. Mantendo qualidade de execução.' },
  { semanas:[5,6], nome:'Fase 2 — Força funcional',         desc:'Pico de carga. Adiciona 1 série nos exercícios principais.' },
  { semanas:[7],   nome:'Fase 3 — Descarga pré-prova',      desc:'Volume reduzido. Corpo descansa para a NB42k.' },
];

// ── HELPERS DE PROGRESSÃO ───────────────────────────────────
function currentWeekNumber() {
  return Math.min(7, Math.max(1, Math.floor((new Date() - PLAN_START) / (7*86400000)) + 1));
}
function getProgressao(exId) {
  const week = currentWeekNumber();
  const prog = PROGRESSAO[exId];
  if (!prog) return null;
  return prog.find(p => p.semana === week) || prog[prog.length - 1];
}

// ── HELPERS GERAIS ──────────────────────────────────────────
function daysUntilRace() {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.max(0, Math.ceil((RACE_DATE - today) / 86400000));
}
function currentPhase() {
  const w = currentWeekNumber();
  return FASES.find(f => f.semanas.includes(w)) || { nome:'Plano encerrado', desc:'Boa prova!' };
}
function fmtDate(ds) { return new Date(ds+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}); }
function fmtDateLong(ds) { return new Date(ds+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}); }
function getWeekStart(offset=0) { const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay()-offset*7); return d; }
function allExercises() { return [...Object.values(EXERCICIOS_INFO), ...Object.values(EXERCICIOS_CASA)]; }
function toast(msg, type='success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// ── PLANO RITIELI ────────────────────────────────────────────
const WARMUP_RITIELI = {
  A: {
    aquecimento: [
      { nome: 'Caminhada na esteira',              detalhe: '5 min a 5–6km/h — aquecimento geral' },
      { nome: 'Agachamento livre sem carga',        detalhe: '10 reps com pausa embaixo — ativa glúteo e quadríceps' },
      { nome: 'Abdução em pé sem carga',            detalhe: '10 reps cada lado — ativa glúteo médio' },
    ],
    alongamento: [
      { nome: 'Posterior deitado',   detalhe: '40 seg cada lado — puxa a perna esticada com as mãos' },
      { nome: 'Figura 4 deitado',    detalhe: '40 seg cada lado — cruza o tornozelo no joelho oposto' },
    ],
  },
  B: {
    aquecimento: [
      { nome: 'Caminhada na esteira',  detalhe: '5 min a 5–6km/h — aquecimento geral' },
      { nome: 'Rotação de ombros',     detalhe: '10 reps cada direção — mobiliza a articulação do ombro' },
      { nome: 'Gato-vaca',             detalhe: '10 reps lentas — mobilidade de coluna' },
    ],
    alongamento: [
      { nome: 'Alongamento de peitoral na parede', detalhe: '30 seg cada lado — apoia o braço na parede e gira o tronco' },
      { nome: 'Gato-vaca',                         detalhe: '10 reps lentas — relaxa a coluna após o treino' },
    ],
  },
};

const EXERCICIOS_RITIELI = {
  r_a1: {
    id:'r_a1', treino:'A', nome:'Leg press 45°', unidade:'kg',
    musculos:['Quadríceps','Glúteo máximo','Isquiotibiais'],
    series:'3', reps:'15', descanso:'60 seg', carga_inicial:'20–30 kg',
    video:'https://www.youtube.com/results?search_query=leg+press+45+execução+iniciante',
    passos:['Sente na máquina com as costas completamente apoiadas no encosto.','Pés na plataforma na largura dos ombros, levemente abertos para fora.','Solte os travas e desça a plataforma controlado até os joelhos formarem 90°.','Empurre a plataforma de volta sem travar os joelhos no final.','Respire: inspira descendo, expira empurrando.'],
    dica:'Não deixe os joelhos fecharem para dentro — eles devem apontar na mesma direção que os pés. Comece leve para aprender o movimento.',
  },
  r_a2: {
    id:'r_a2', treino:'A', nome:'Abdução de quadril (máquina sentado)', unidade:'kg',
    musculos:['Glúteo médio','Glúteo mínimo'],
    series:'3', reps:'20', descanso:'45 seg', carga_inicial:'30–40 kg',
    video:'https://www.youtube.com/results?search_query=abdução+de+quadril+máquina+sentado',
    passos:['Sente na máquina com as costas retas encostadas no apoio.','Almofadas nas partes externas dos joelhos.','Abra as pernas controlado até o máximo da amplitude.','PAUSA de 1 segundo aberto — sinta o glúteo lateral contrair.','Feche lentamente — não deixe a máquina bater.'],
    dica:'Foco na contração, não na carga. O glúteo médio é fundamental para o emagrecimento — é um dos maiores músculos do corpo.',
  },
  r_a3: {
    id:'r_a3', treino:'A', nome:'Cadeira extensora bilateral', unidade:'kg',
    musculos:['Quadríceps'],
    series:'3', reps:'15', descanso:'60 seg', carga_inicial:'15–20 kg',
    video:'https://www.youtube.com/results?search_query=cadeira+extensora+execução+correta',
    passos:['Ajuste o banco para que o joelho fique alinhado com o eixo da máquina.','Apoio acolchoado na frente dos tornozelos.','Estenda as pernas controlado até quase reto — não trave os joelhos.','PAUSA de 1 seg no topo contraindo o quadríceps.','Desça em 3 segundos — fase excêntrica importante.'],
    dica:'Bilateral é mais simples para quem está voltando. Depois de algumas semanas pode evoluir para unilateral.',
  },
  r_a4: {
    id:'r_a4', treino:'A', nome:'Mesa flexora bilateral', unidade:'kg',
    musculos:['Isquiotibiais','Glúteo'],
    series:'3', reps:'15', descanso:'60 seg', carga_inicial:'10–15 kg',
    video:'https://www.youtube.com/results?search_query=mesa+flexora+execução+correta',
    passos:['Deite de bruços na máquina com os joelhos alinhados ao eixo.','Apoio acolchoado atrás dos tornozelos.','Flexione as pernas trazendo os calcanhares em direção ao glúteo.','Pausa 1 seg no topo.','Desça controlado em 3 segundos.'],
    dica:'Carga bem leve no início — posterior de coxa costuma ser fraco em quem ficou parada. Não force amplitude além do confortável.',
  },
  r_a5: {
    id:'r_a5', treino:'A', nome:'Panturrilha bilateral em pé', unidade:'kg',
    musculos:['Gastrocnêmio','Sóleo'],
    series:'3', reps:'15', descanso:'45 seg', carga_inicial:'20 kg',
    video:'https://www.youtube.com/results?search_query=panturrilha+bilateral+em+pé+execução',
    passos:['Fique em pé com os dois pés na borda de um degrau ou plataforma.','Segure algum apoio para equilíbrio.','Desça os calcanhares abaixo do nível do apoio — sinta o alongamento.','Suba até o máximo — PAUSA de 1 seg no topo.','Desça em 3 segundos. Não quique no fundo.'],
    dica:'Panturrilhas são resistentes — não tenha medo de progredir a carga quando 15 reps ficarem fáceis.',
  },
  r_b1: {
    id:'r_b1', treino:'B', nome:'Crossover no cabo', unidade:'kg cada lado',
    musculos:['Peitoral','Deltoide anterior','Bíceps'],
    series:'3', reps:'12', descanso:'60 seg', carga_inicial:'5–8 kg cada lado',
    video:'https://www.youtube.com/results?search_query=crossover+cabo+execução+peitoral',
    passos:['Ajusta o cabo na altura do ombro ou acima. Fica no centro da máquina.','Segura as alças com os braços abertos, cotovelos levemente dobrados.','Traz os braços à frente cruzando levemente no centro.','PAUSA de 1 seg no cruzamento — sente o peitoral apertar.','Abre os braços controlado de volta. Não deixa o peso puxar.'],
    dica:'Carga muito leve no início. O movimento é o que importa — foca em sentir o peitoral contrair no cruzamento.',
  },
  r_b2: {
    id:'r_b2', treino:'B', nome:'Puxada frontal (pulley)', unidade:'kg',
    musculos:['Latíssimo do dorso','Romboides','Bíceps'],
    series:'3', reps:'12', descanso:'60 seg', carga_inicial:'20–25 kg',
    video:'https://www.youtube.com/results?search_query=puxada+frontal+pulley+execução+correta',
    passos:['Senta no banco com os joelhos presos sob o apoio. Segura a barra larga.','Inclina levemente o tronco para trás — uns 10–15°.','Puxa a barra até a altura do queixo ou parte superior do peitoral.','Pausa 1 seg embaixo sentindo as costas contrair.','Sobe controlado — não deixa o peso puxar os braços de volta.'],
    dica:'Pensa em puxar com os cotovelos, não com as mãos. Isso ativa melhor as costas e menos os bíceps.',
  },
  r_b3: {
    id:'r_b3', treino:'B', nome:'Desenvolvimento com halteres (sentado)', unidade:'kg cada lado',
    musculos:['Deltoide','Tríceps','Trapézio'],
    series:'3', reps:'12', descanso:'60 seg', carga_inicial:'4–6 kg cada lado',
    video:'https://www.youtube.com/results?search_query=desenvolvimento+halteres+sentado+execução',
    passos:['Senta no banco com encosto. Segura um halter em cada mão na altura dos ombros.','Palmas viradas para frente, cotovelos dobrados a 90°.','Empurra os halteres para cima até os braços ficarem quase esticados.','Desce controlado até a posição inicial.','Não trava os cotovelos no topo.'],
    dica:'Ombros são músculos pequenos — carga muito leve no início. Não compensa com o tronco inclinando para trás.',
  },
  r_b4: {
    id:'r_b4', treino:'B', nome:'Remada baixa no cabo', unidade:'kg',
    musculos:['Romboides','Trapézio médio','Latíssimo do dorso','Bíceps'],
    series:'3', reps:'12', descanso:'60 seg', carga_inicial:'20–25 kg',
    video:'https://www.youtube.com/results?search_query=remada+baixa+cabo+execução+correta',
    passos:['Senta na máquina com os pés apoiados. Segura a pegada neutra (palmas uma para a outra).','Mantém a lombar reta — não deixa curvar.','Puxa a alça em direção ao abdômen, cotovelos próximos ao corpo.','Pausa 1 seg contraindo as escápulas — "aperta" as costas.','Estende os braços controlado voltando à posição inicial.'],
    dica:'Ótimo exercício para postura. Foca em sentir as escápulas se aproximarem no final do movimento.',
  },
  r_b5: {
    id:'r_b5', treino:'B', nome:'Prancha frontal', unidade:'segundos',
    musculos:['Core (transverso do abdômen)','Glúteo','Estabilizadores da coluna'],
    series:'3', reps:'25–35 seg', descanso:'45 seg', carga_inicial:'Peso do corpo',
    video:'https://www.youtube.com/results?search_query=prancha+frontal+execução+correta+iniciante',
    passos:['Apoie nos antebraços e pontas dos pés. Cotovelos abaixo dos ombros.','Corpo reto da cabeça ao calcanhar — não deixe o quadril subir ou afundar.','Contraia o abdômen. Respire normalmente.','Olhe para o chão, pescoço neutro.','Se for difícil, apoia os joelhos no chão e progride aos poucos.'],
    dica:'Começa com 25 seg e vai aumentando 5 seg por semana. Qualidade sempre antes de duração.',
  },
};

const TREINOS_RITIELI = {
  A: {
    nome:'Treino A', desc:'Membros inferiores e glúteo',
    focus:['Leg press 45°','Abdução de quadril','Cadeira extensora','Mesa flexora','Panturrilha'],
    exercicios:['r_a1','r_a2','r_a3','r_a4','r_a5'],
  },
  B: {
    nome:'Treino B', desc:'Membros superiores e core',
    focus:['Crossover no cabo','Puxada frontal','Desenvolvimento','Remada baixa','Prancha'],
    exercicios:['r_b1','r_b2','r_b3','r_b4','r_b5'],
  },
};

const PROGRESSAO_RITIELI = {
  r_a1: [
    { semana:1, series:3, reps:'15', carga_ref:'20 kg', obs:'Aprende o movimento. Carga bem leve.' },
    { semana:2, series:3, reps:'15', carga_ref:'25 kg', obs:'+5kg se semana 1 estava fácil.' },
    { semana:3, series:3, reps:'15', carga_ref:'30 kg', obs:'+5kg.' },
    { semana:4, series:3, reps:'15', carga_ref:'35 kg', obs:'+5kg.' },
    { semana:5, series:3, reps:'12', carga_ref:'40 kg', obs:'Reduz reps, aumenta carga.' },
    { semana:6, series:3, reps:'12', carga_ref:'45 kg', obs:'+5kg.' },
    { semana:7, series:3, reps:'15', carga_ref:'35 kg', obs:'Volta volume.' },
  ],
  r_a2: [
    { semana:1, series:3, reps:'20', carga_ref:'30 kg', obs:'Foco na contração.' },
    { semana:2, series:3, reps:'20', carga_ref:'35 kg', obs:'+5kg.' },
    { semana:3, series:3, reps:'20', carga_ref:'40 kg', obs:'+5kg.' },
    { semana:4, series:3, reps:'20', carga_ref:'45 kg', obs:'+5kg.' },
    { semana:5, series:3, reps:'20', carga_ref:'50 kg', obs:'+5kg.' },
    { semana:6, series:3, reps:'20', carga_ref:'55 kg', obs:'+5kg.' },
    { semana:7, series:3, reps:'20', carga_ref:'45 kg', obs:'Mantém volume.' },
  ],
  r_a3: [
    { semana:1, series:3, reps:'15', carga_ref:'15 kg', obs:'Descida em 3 seg.' },
    { semana:2, series:3, reps:'15', carga_ref:'18 kg', obs:'+3kg.' },
    { semana:3, series:3, reps:'15', carga_ref:'20 kg', obs:'+2kg.' },
    { semana:4, series:3, reps:'15', carga_ref:'23 kg', obs:'+3kg.' },
    { semana:5, series:3, reps:'12', carga_ref:'25 kg', obs:'Reduz reps, aumenta carga.' },
    { semana:6, series:3, reps:'12', carga_ref:'28 kg', obs:'+3kg.' },
    { semana:7, series:3, reps:'15', carga_ref:'20 kg', obs:'Volta volume.' },
  ],
  r_a4: [
    { semana:1, series:3, reps:'15', carga_ref:'10 kg', obs:'Carga leve. Posterior costuma ser fraco.' },
    { semana:2, series:3, reps:'15', carga_ref:'12 kg', obs:'+2kg.' },
    { semana:3, series:3, reps:'15', carga_ref:'15 kg', obs:'+3kg.' },
    { semana:4, series:3, reps:'15', carga_ref:'17 kg', obs:'+2kg.' },
    { semana:5, series:3, reps:'12', carga_ref:'20 kg', obs:'Reduz reps, aumenta carga.' },
    { semana:6, series:3, reps:'12', carga_ref:'22 kg', obs:'+2kg.' },
    { semana:7, series:3, reps:'15', carga_ref:'15 kg', obs:'Volta volume.' },
  ],
  r_a5: [
    { semana:1, series:3, reps:'15', carga_ref:'20 kg', obs:'' },
    { semana:2, series:3, reps:'15', carga_ref:'22 kg', obs:'+2kg.' },
    { semana:3, series:3, reps:'15', carga_ref:'25 kg', obs:'+3kg.' },
    { semana:4, series:3, reps:'15', carga_ref:'27 kg', obs:'+2kg.' },
    { semana:5, series:3, reps:'15', carga_ref:'30 kg', obs:'+3kg.' },
    { semana:6, series:3, reps:'15', carga_ref:'32 kg', obs:'+2kg.' },
    { semana:7, series:3, reps:'15', carga_ref:'25 kg', obs:'Mantém.' },
  ],
  r_b1: [
    { semana:1, series:3, reps:'12', carga_ref:'5 kg cada lado', obs:'Muito leve. Foca no movimento.' },
    { semana:2, series:3, reps:'12', carga_ref:'6 kg cada lado', obs:'+1kg.' },
    { semana:3, series:3, reps:'12', carga_ref:'7 kg cada lado', obs:'+1kg.' },
    { semana:4, series:3, reps:'12', carga_ref:'8 kg cada lado', obs:'+1kg.' },
    { semana:5, series:3, reps:'12', carga_ref:'9 kg cada lado', obs:'+1kg.' },
    { semana:6, series:3, reps:'12', carga_ref:'10 kg cada lado', obs:'+1kg.' },
    { semana:7, series:3, reps:'12', carga_ref:'8 kg cada lado', obs:'Mantém.' },
  ],
  r_b2: [
    { semana:1, series:3, reps:'12', carga_ref:'20 kg', obs:'Puxa com os cotovelos.' },
    { semana:2, series:3, reps:'12', carga_ref:'23 kg', obs:'+3kg.' },
    { semana:3, series:3, reps:'12', carga_ref:'25 kg', obs:'+2kg.' },
    { semana:4, series:3, reps:'12', carga_ref:'28 kg', obs:'+3kg.' },
    { semana:5, series:3, reps:'12', carga_ref:'30 kg', obs:'+2kg.' },
    { semana:6, series:3, reps:'12', carga_ref:'32 kg', obs:'+2kg.' },
    { semana:7, series:3, reps:'12', carga_ref:'25 kg', obs:'Mantém.' },
  ],
  r_b3: [
    { semana:1, series:3, reps:'12', carga_ref:'4 kg cada lado', obs:'Ombros são pequenos. Começa leve.' },
    { semana:2, series:3, reps:'12', carga_ref:'5 kg cada lado', obs:'+1kg.' },
    { semana:3, series:3, reps:'12', carga_ref:'6 kg cada lado', obs:'+1kg.' },
    { semana:4, series:3, reps:'12', carga_ref:'7 kg cada lado', obs:'+1kg.' },
    { semana:5, series:3, reps:'12', carga_ref:'8 kg cada lado', obs:'+1kg.' },
    { semana:6, series:3, reps:'12', carga_ref:'8 kg cada lado', obs:'Mantém e consolida.' },
    { semana:7, series:3, reps:'12', carga_ref:'6 kg cada lado', obs:'Mantém.' },
  ],
  r_b4: [
    { semana:1, series:3, reps:'12', carga_ref:'20 kg', obs:'Foca nas escápulas.' },
    { semana:2, series:3, reps:'12', carga_ref:'23 kg', obs:'+3kg.' },
    { semana:3, series:3, reps:'12', carga_ref:'25 kg', obs:'+2kg.' },
    { semana:4, series:3, reps:'12', carga_ref:'28 kg', obs:'+3kg.' },
    { semana:5, series:3, reps:'12', carga_ref:'30 kg', obs:'+2kg.' },
    { semana:6, series:3, reps:'12', carga_ref:'32 kg', obs:'+2kg.' },
    { semana:7, series:3, reps:'12', carga_ref:'25 kg', obs:'Mantém.' },
  ],
  r_b5: [
    { semana:1, series:3, reps:'25 seg', carga_ref:'Peso do corpo', obs:'Começa apoiando nos joelhos se necessário.' },
    { semana:2, series:3, reps:'30 seg', carga_ref:'Peso do corpo', obs:'+5 seg.' },
    { semana:3, series:3, reps:'35 seg', carga_ref:'Peso do corpo', obs:'+5 seg.' },
    { semana:4, series:3, reps:'40 seg', carga_ref:'Peso do corpo', obs:'+5 seg.' },
    { semana:5, series:3, reps:'45 seg', carga_ref:'Peso do corpo', obs:'+5 seg.' },
    { semana:6, series:3, reps:'50 seg', carga_ref:'Peso do corpo', obs:'+5 seg.' },
    { semana:7, series:3, reps:'40 seg', carga_ref:'Peso do corpo', obs:'Mantém.' },
  ],
};

// Data de início do plano da Ritieli
const PLAN_START_RITIELI = new Date();
PLAN_START_RITIELI.setHours(0,0,0,0);

function currentWeekNumberRitieli() {
  return Math.min(7, Math.max(1, Math.floor((new Date() - PLAN_START_RITIELI) / (7*86400000)) + 1));
}

function getProgressaoRitieli(exId) {
  const week = currentWeekNumberRitieli();
  const prog = PROGRESSAO_RITIELI[exId];
  if (!prog) return null;
  return prog.find(p => p.semana === week) || prog[prog.length - 1];
}

function isRitieli() {
  return currentUser?.email === 'ritielihermes@gmail.com';
}

function getTreinosAtivos() {
  return isRitieli() ? TREINOS_RITIELI : TREINOS;
}

function getWarmupAtivo(tipo) {
  return isRitieli() ? WARMUP_RITIELI[tipo] : WARMUP[tipo];
}

function getExercicioInfo(id) {
  if (id.startsWith('r_')) return EXERCICIOS_RITIELI[id];
  if (id.startsWith('c_') || id.startsWith('c')) return EXERCICIOS_CASA[id];
  return EXERCICIOS_INFO[id];
}

function getProgressaoAtiva(id) {
  if (id.startsWith('r_')) return getProgressaoRitieli(id);
  return getProgressao(id);
}
