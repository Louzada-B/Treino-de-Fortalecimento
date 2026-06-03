// ── CONSTANTES ─────────────────────────────────────────────
const RACE_DATE  = new Date('2026-07-12T08:00:00');
const PLAN_START = new Date('2026-05-25T00:00:00');

// ── PROGRESSÃO SEMANAL ──────────────────────────────────────
// Cada exercício tem prescrição específica por semana (1 a 7)
// series / reps / carga_ref = referência de carga recomendada
// obs = instrução especial da semana (joelho, foco, etc)
const PROGRESSAO = {
  a1: [
    { semana:1, series:3, reps:'10/8/6',    carga_ref:'15→20→30 kg cada lado', obs:'' },
    { semana:2, series:3, reps:'10/8/6',    carga_ref:'15→20→30 kg cada lado', obs:'' },
    { semana:3, series:3, reps:'10/8/6',    carga_ref:'20→30→40 kg cada lado', obs:'+10% de carga' },
    { semana:4, series:3, reps:'10/8/6',    carga_ref:'20→35→45 kg cada lado', obs:'+10% de carga' },
    { semana:5, series:4, reps:'10/8/6/6',  carga_ref:'25→35→45→50 kg cada lado', obs:'+1 série. Pico de carga.' },
    { semana:6, series:4, reps:'10/8/6/6',  carga_ref:'25→40→50→55 kg cada lado', obs:'Semana de pico.' },
    { semana:7, series:2, reps:'8/6',        carga_ref:'20→30 kg cada lado', obs:'Descarga pré-prova. Carga reduzida.' },
  ],
  a2: [
    { semana:1, series:3, reps:'15–20',  carga_ref:'50 kg — foco na contração', obs:'Pausa de 1 seg aberto. Sinta no glúteo lateral.' },
    { semana:2, series:3, reps:'15–20',  carga_ref:'50 kg', obs:'Se sentiu no lugar certo, mantém 50kg.' },
    { semana:3, series:3, reps:'15–20',  carga_ref:'55–60 kg', obs:'+10% de carga.' },
    { semana:4, series:3, reps:'15–20',  carga_ref:'60–65 kg', obs:'+10% de carga.' },
    { semana:5, series:4, reps:'15–20',  carga_ref:'65 kg', obs:'+1 série. Exercício prioritário contra banda IT.' },
    { semana:6, series:4, reps:'15–20',  carga_ref:'65–70 kg', obs:'Semana de pico.' },
    { semana:7, series:2, reps:'15',     carga_ref:'55 kg', obs:'Descarga pré-prova.' },
  ],
  a3: [
    { semana:1, series:3, reps:'12',  carga_ref:'40 kg', obs:'Na máquina. Pausa 2 seg no topo.' },
    { semana:2, series:3, reps:'12',  carga_ref:'40 kg', obs:'Consolida a execução antes de aumentar.' },
    { semana:3, series:3, reps:'12',  carga_ref:'50 kg', obs:'+10kg.' },
    { semana:4, series:3, reps:'12',  carga_ref:'60 kg', obs:'+10kg.' },
    { semana:5, series:4, reps:'12',  carga_ref:'65 kg', obs:'+1 série.' },
    { semana:6, series:4, reps:'12',  carga_ref:'70 kg', obs:'Semana de pico.' },
    { semana:7, series:2, reps:'10',  carga_ref:'50 kg', obs:'Descarga pré-prova.' },
  ],
  a4: [
    { semana:1, series:3, reps:'12',  carga_ref:'10 kg — descida em 4 seg', obs:'⚠️ Dor no joelho direito. 10kg nas 3 séries. Descida lenta 4 seg.' },
    { semana:2, series:3, reps:'12',  carga_ref:'10 kg — descida em 4 seg', obs:'⚠️ Mantém 10kg até joelho confirmar ausência de dor.' },
    { semana:3, series:3, reps:'12',  carga_ref:'12–14 kg', obs:'Só aumenta se joelho estiver 100% sem dor.' },
    { semana:4, series:3, reps:'12',  carga_ref:'14–16 kg', obs:'+10% se joelho ok.' },
    { semana:5, series:3, reps:'12',  carga_ref:'16–18 kg', obs:'+10% se joelho ok.' },
    { semana:6, series:3, reps:'12',  carga_ref:'18–20 kg', obs:'Semana de pico.' },
    { semana:7, series:2, reps:'10',  carga_ref:'12 kg', obs:'Descarga pré-prova.' },
  ],
  a5: [
    { semana:1, series:3, reps:'15',  carga_ref:'20 kg nas 3 séries', obs:'' },
    { semana:2, series:3, reps:'15',  carga_ref:'20 kg nas 3 séries', obs:'Consolida antes de aumentar.' },
    { semana:3, series:3, reps:'15',  carga_ref:'25 kg', obs:'+5kg.' },
    { semana:4, series:3, reps:'15',  carga_ref:'25–30 kg', obs:'+5kg.' },
    { semana:5, series:3, reps:'15',  carga_ref:'30 kg', obs:'' },
    { semana:6, series:3, reps:'15',  carga_ref:'30–35 kg', obs:'Semana de pico.' },
    { semana:7, series:2, reps:'12',  carga_ref:'20 kg', obs:'Descarga pré-prova.' },
  ],
  b1: [
    { semana:1, series:3, reps:'35 seg',   carga_ref:'Peso do corpo', obs:'Foco em forma perfeita.' },
    { semana:2, series:3, reps:'40 seg',   carga_ref:'Peso do corpo', obs:'+5 seg.' },
    { semana:3, series:3, reps:'45 seg',   carga_ref:'Peso do corpo', obs:'+5 seg.' },
    { semana:4, series:3, reps:'50 seg',   carga_ref:'Peso do corpo', obs:'+5 seg.' },
    { semana:5, series:3, reps:'50 seg',   carga_ref:'Peso do corpo', obs:'Evolui para prancha com elevação de perna se 50 seg ficar fácil.' },
    { semana:6, series:3, reps:'50–60 seg',carga_ref:'Peso do corpo', obs:'Semana de pico.' },
    { semana:7, series:2, reps:'35 seg',   carga_ref:'Peso do corpo', obs:'Descarga pré-prova.' },
  ],
  b2: [
    { semana:1, series:3, reps:'10 cada lado', carga_ref:'Peso do corpo', obs:'Lombar colada no chão o tempo todo.' },
    { semana:2, series:3, reps:'10 cada lado', carga_ref:'Peso do corpo', obs:'Confirma lombar no chão. Movimento lento.' },
    { semana:3, series:3, reps:'12 cada lado', carga_ref:'Peso do corpo', obs:'+2 reps.' },
    { semana:4, series:3, reps:'12 cada lado', carga_ref:'Peso do corpo', obs:'' },
    { semana:5, series:3, reps:'15 cada lado', carga_ref:'Peso do corpo', obs:'+3 reps.' },
    { semana:6, series:3, reps:'15 cada lado', carga_ref:'Peso do corpo', obs:'Semana de pico.' },
    { semana:7, series:2, reps:'10 cada lado', carga_ref:'Peso do corpo', obs:'Descarga pré-prova.' },
  ],
  b3: [
    { semana:1, series:3, reps:'12',  carga_ref:'14 kg nas 3 séries', obs:'' },
    { semana:2, series:3, reps:'12',  carga_ref:'14 kg nas 3 séries', obs:'Consolida a execução.' },
    { semana:3, series:3, reps:'12',  carga_ref:'16 kg', obs:'+2kg.' },
    { semana:4, series:3, reps:'12',  carga_ref:'18 kg', obs:'+2kg.' },
    { semana:5, series:4, reps:'12',  carga_ref:'20 kg', obs:'+1 série.' },
    { semana:6, series:4, reps:'12',  carga_ref:'22 kg', obs:'Semana de pico.' },
    { semana:7, series:2, reps:'10',  carga_ref:'16 kg', obs:'Descarga pré-prova.' },
  ],
  b4: [
    { semana:1, series:3, reps:'15',  carga_ref:'20 kg na máquina', obs:'Foco na contração entre as escápulas.' },
    { semana:2, series:3, reps:'15',  carga_ref:'20 kg', obs:'Mantém e consolida a execução.' },
    { semana:3, series:3, reps:'15',  carga_ref:'22 kg', obs:'+2kg.' },
    { semana:4, series:3, reps:'15',  carga_ref:'24 kg', obs:'+2kg.' },
    { semana:5, series:3, reps:'15',  carga_ref:'26 kg', obs:'' },
    { semana:6, series:3, reps:'15',  carga_ref:'28 kg', obs:'Semana de pico.' },
    { semana:7, series:2, reps:'12',  carga_ref:'20 kg', obs:'Descarga pré-prova.' },
  ],
  b5: [
    { semana:1, series:3, reps:'20 passos', carga_ref:'30 kg cada mão', obs:'Tronco estável. Não inclinar para os lados.' },
    { semana:2, series:3, reps:'20 passos', carga_ref:'30 kg cada mão', obs:'Consolida a execução.' },
    { semana:3, series:3, reps:'20 passos', carga_ref:'32 kg cada mão', obs:'+2kg.' },
    { semana:4, series:3, reps:'20 passos', carga_ref:'34 kg cada mão', obs:'+2kg.' },
    { semana:5, series:3, reps:'20 passos', carga_ref:'36 kg cada mão', obs:'' },
    { semana:6, series:3, reps:'20 passos', carga_ref:'38 kg cada mão', obs:'Semana de pico.' },
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

// ── EXERCÍCIOS COMPLETOS ────────────────────────────────────
const EXERCICIOS_INFO = {
  a1: {
    id:'a1', treino:'A', nome:'Agachamento com barra', unidade:'kg cada lado',
    musculos:['Quadríceps','Glúteo máximo','Isquiotibiais','Core'],
    series:'3', reps:'10', descanso:'90 seg', carga_inicial:'15→20→30 kg cada lado',
    video:'https://www.youtube.com/results?search_query=agachamento+com+barra+execucao+correto',
    passos:[
      'Posicione a barra na parte superior das costas (trapézio), não no pescoço.',
      'Pés na largura dos ombros, levemente abertos para fora (30–45°).',
      'Desça controlado por 2–3 seg, joelhos acompanhando a direção dos pés — não colabam para dentro.',
      'Desça até a coxa ficar paralela ao chão ou um pouco abaixo.',
      'Suba empurrando o chão, expire na subida. Lombar neutra durante todo o movimento.',
    ],
    dica:'Com 1,95m você tem alavancas longas — é normal o tronco inclinar um pouco mais. Não force ficar ereto demais. O importante é lombar neutra e joelhos alinhados.',
  },
  a2: {
    id:'a2', treino:'A', nome:'Abdução de quadril (máquina sentado)', unidade:'kg',
    musculos:['Glúteo médio','Glúteo mínimo','Tensor da fáscia lata'],
    series:'3', reps:'15–20', descanso:'60 seg', carga_inicial:'50 kg — foco na contração',
    video:'https://www.youtube.com/results?search_query=abdução+de+quadril+máquina+sentado',
    passos:[
      'Sente-se na máquina com as costas retas encostadas no apoio.',
      'Pés apoiados, joelhos a 90°. Almofadas nas partes externas dos joelhos/coxas.',
      'Abra as pernas controlado até o máximo da amplitude sem compensar com o tronco.',
      'PAUSA de 1 segundo na posição aberta — sinta a contração no glúteo lateral.',
      'Feche lentamente (3 seg) — não deixe a máquina bater.',
    ],
    dica:'Este é o exercício mais importante para PREVENIR a recidiva da síndrome da banda IT. Priorize a contração, não a carga. Deve queimar no glúteo lateral.',
  },
  a3: {
    id:'a3', treino:'A', nome:'Hip thrust (máquina)', unidade:'kg',
    musculos:['Glúteo máximo','Isquiotibiais','Core'],
    series:'3', reps:'12', descanso:'90 seg', carga_inicial:'40 kg',
    video:'https://www.youtube.com/results?search_query=hip+thrust+máquina+execução',
    passos:[
      'Ajuste o banco para que, sentado, os ombros fiquem na borda acolchoada.',
      'Pés apoiados no chão, na largura dos ombros. Joelhos a 90° quando o quadril estiver em cima.',
      'Empurre o quadril para CIMA contraindo o glúteo — o corpo fica reto como uma prancha.',
      'PAUSA de 2 segundos no topo — esprema o glúteo ao máximo.',
      'Desça controlado sem deixar o quadril tocar o chão entre as reps.',
    ],
    dica:'A lombar NÃO dobra neste exercício. Se sentir dor lombar, diminua a carga ou ajuste o posicionamento. O movimento é 100% no quadril.',
  },
  a4: {
    id:'a4', treino:'A', nome:'Cadeira extensora unilateral', unidade:'kg',
    musculos:['Quadríceps (foco no VMO — vasto medial)'],
    series:'3', reps:'12 cada perna', descanso:'60 seg', carga_inicial:'10 kg — descida lenta 4 seg',
    video:'https://www.youtube.com/results?search_query=cadeira+extensora+unilateral+execução',
    passos:[
      'Ajuste o banco para que o joelho fique alinhado com o eixo da máquina.',
      'Use apenas uma perna por vez. A outra fica relaxada ao lado.',
      'Estenda a perna controlado até quase reto — não trave o joelho no final.',
      'PAUSA de 1 seg no topo, contraindo o quadríceps.',
      'Desça em 4 segundos — fase excêntrica lenta protege o joelho.',
    ],
    dica:'⚠️ Joelho direito sensível. Mantém 10kg com descida lenta até ausência total de dor. Não aumente a carga enquanto houver qualquer desconforto.',
  },
  a5: {
    id:'a5', treino:'A', nome:'Panturrilha unilateral em pé', unidade:'kg',
    musculos:['Gastrocnêmio','Sóleo','Tendão de Aquiles'],
    series:'3', reps:'15 cada pé', descanso:'60 seg', carga_inicial:'20 kg nas 3 séries',
    video:'https://www.youtube.com/results?search_query=panturrilha+unilateral+em+pé+execução',
    passos:[
      'Fique em pé apoiando a ponta do pé no degrau ou borda de uma plataforma.',
      'Segure algum apoio para equilíbrio. Use apenas uma perna.',
      'Desça o calcanhar abaixo do nível do apoio — sinta o alongamento.',
      'Suba até o máximo elevando o calcanhar — PAUSA de 1 seg no topo.',
      'Desça em 3 segundos. Não quique no fundo.',
    ],
    dica:'Para corrida, a panturrilha é a "mola" da propulsão. Unilateral detecta desequilíbrios — se um lado for muito mais fraco, foque nele primeiro.',
  },
  b1: {
    id:'b1', treino:'B', nome:'Prancha frontal', unidade:'segundos',
    musculos:['Core (transverso do abdômen)','Glúteo','Estabilizadores da coluna'],
    series:'3', reps:'35–45 seg', descanso:'45 seg', carga_inicial:'Peso do corpo',
    video:'https://www.youtube.com/results?search_query=prancha+frontal+execução+correta',
    passos:[
      'Apoie nos antebraços e pontas dos pés. Cotovelos abaixo dos ombros.',
      'Corpo reto da cabeça ao calcanhar — não deixe o quadril subir ou afundar.',
      'Contraia o abdômen como se fosse levar um soco. Respire normalmente.',
      'Olhe para o chão, pescoço neutro.',
      'Se sentir dor lombar, reduza o tempo ou apoie os joelhos.',
    ],
    dica:'Se conseguir mais de 50 seg com boa forma, evolua para prancha com elevação alternada de perna.',
  },
  b2: {
    id:'b2', treino:'B', nome:'Dead bug', unidade:'reps',
    musculos:['Transverso do abdômen','Multífidos (lombar)','Iliopsoas'],
    series:'3', reps:'10 cada lado', descanso:'60 seg', carga_inicial:'Peso do corpo',
    video:'https://www.youtube.com/results?search_query=dead+bug+exercicio+execução+lombar',
    passos:[
      'Deite de costas. Braços apontados para o teto. Quadril e joelhos a 90° no ar.',
      'LOMBAR COLADA NO CHÃO — este é o ponto mais crítico do exercício.',
      'Desce o braço direito para trás e a perna esquerda para frente SIMULTANEAMENTE.',
      'Mantém a lombar no chão. Se ela descolar, reduza a amplitude.',
      'Volta ao centro e repete com o lado oposto.',
    ],
    dica:'Este exercício estabiliza a lombar em vez de flexioná-la. Exatamente o que você precisa para correr sem sobrecarregar a região lombar.',
  },
  b3: {
    id:'b3', treino:'B', nome:'Remada unilateral apoiada no banco', unidade:'kg',
    musculos:['Latíssimo do dorso','Romboides','Bíceps','Core'],
    series:'3', reps:'12 cada lado', descanso:'75 seg', carga_inicial:'14 kg nas 3 séries',
    video:'https://www.youtube.com/results?search_query=remada+unilateral+banco+execução',
    passos:[
      'Apoie o joelho e a mão do MESMO lado no banco. Corpo paralelo ao chão.',
      'Segure o halter com a outra mão. Lombar reta e neutra.',
      'Puxe o halter em direção ao quadril. O cotovelo vai para trás e para cima.',
      'Não gire o tronco — o movimento é só do braço.',
      'Desça o halter completamente antes de puxar de novo.',
    ],
    dica:'Posição horizontal descarrega completamente a coluna. A remada mais indicada para quem tem histórico de dor lombar.',
  },
  b4: {
    id:'b4', treino:'B', nome:'Voador inverso (rear delt fly)', unidade:'kg',
    musculos:['Deltoide posterior','Romboides','Trapézio médio'],
    series:'3', reps:'15', descanso:'60 seg', carga_inicial:'20 kg na máquina',
    video:'https://www.youtube.com/results?search_query=voador+inverso+halter+execução+rear+delt',
    passos:[
      'Em pé, incline o tronco para frente uns 45°. Joelhos levemente dobrados.',
      'Segure um halter leve em cada mão, braços pendurados com cotovelos levemente dobrados.',
      'Abra os braços para os lados como asas, levantando até a altura dos ombros.',
      'PAUSA de 1 seg no topo — sinta o aperto entre as escápulas.',
      'Desça controlado. Não use impulso.',
    ],
    dica:'Músculos fracos na parte posterior do ombro fazem o corredor afundar o tronco na segunda metade da corrida. Esse exercício corrige isso.',
  },
  b5: {
    id:'b5', treino:'B', nome:"Farmer's carry", unidade:'kg cada mão',
    musculos:['Core lateral','Trapézio','Antebraços','Glúteo','Estabilizadores do tornozelo'],
    series:'3', reps:'20 passos', descanso:'60 seg', carga_inicial:'30 kg cada mão',
    video:'https://www.youtube.com/results?search_query=farmers+carry+execução+correto',
    passos:[
      'Pegue um halter em cada mão, fique em pé.',
      'Ombros para trás e para baixo. Lombar neutra. Abdômen levemente contraído.',
      'Caminhe 20 passos em linha reta com passadas normais.',
      'Não deixe os halteres puxar os ombros para baixo ou o tronco inclinar para os lados.',
      'Respire normalmente durante toda a caminhada.',
    ],
    dica:'Treina a estabilidade lateral do tronco — exatamente o que evita que o quadril afunde no impacto de cada passada.',
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
    focus:['Prancha frontal','Dead bug','Remada unilateral','Voador inverso',"Farmer's carry"],
    exercicios:['b1','b2','b3','b4','b5'],
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

// ── STORAGE ─────────────────────────────────────────────────
function getDB() { try { return JSON.parse(localStorage.getItem('runner_bruno_v2') || '[]'); } catch { return []; } }
function saveDB(d) { localStorage.setItem('runner_bruno_v2', JSON.stringify(d)); }

// ── HELPERS ─────────────────────────────────────────────────
function daysUntilRace() {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.max(0, Math.ceil((RACE_DATE - today) / 86400000));
}
function weekNumber(date) { return Math.floor((new Date(date) - PLAN_START) / (7*86400000)); }
function currentPhase() {
  const w = currentWeekNumber();
  return FASES.find(f => f.semanas.includes(w)) || { nome:'Plano encerrado', desc:'Boa prova!' };
}
function fmtDate(ds) { return new Date(ds+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}); }
function fmtDateLong(ds) { return new Date(ds+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}); }
function getWeekStart(offset=0) { const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay()-offset*7); return d; }
function allExercises() { return Object.values(EXERCICIOS_INFO); }
function toast(msg, type='success') {
  const el = document.createElement('div');
  el.className=`toast ${type}`; el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 2500);
}
