// ── CONSTANTES ─────────────────────────────────────────────
const RACE_DATE  = new Date('2026-07-12T08:00:00');
const PLAN_START = new Date('2026-05-25T00:00:00');

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

  // ── TREINO A ──

  a1: {
    id: 'a1', treino: 'A',
    nome: 'Agachamento com barra',
    unidade: 'kg cada lado',
    musculos: ['Quadríceps', 'Glúteo máximo', 'Isquiotibiais', 'Core'],
    series: '3', reps: '10', descanso: '90 seg',
    carga_inicial: '40 kg cada lado',
    video: 'https://www.youtube.com/results?search_query=agachamento+com+barra+execucao+correto',
    passos: [
      'Posicione a barra na parte superior das costas (trapézio), não no pescoço.',
      'Pés na largura dos ombros, levemente abertos para fora (30–45°).',
      'Desça controlado por 2–3 seg, joelhos acompanhando a direção dos pés — não colabam para dentro.',
      'Desça até a coxa ficar paralela ao chão ou um pouco abaixo.',
      'Suba empurrando o chão, expire na subida. Lombar neutra durante todo o movimento.',
    ],
    dica: 'Com 1,95m você tem alavancas longas — é normal o tronco inclinar um pouco mais. Não force ficar ereto demais. O importante é lombar neutra e joelhos alinhados.',
  },

  a2: {
    id: 'a2', treino: 'A',
    nome: 'Abdução de quadril (máquina sentado)',
    unidade: 'kg',
    musculos: ['Glúteo médio', 'Glúteo mínimo', 'Tensor da fáscia lata'],
    series: '3', reps: '15–20', descanso: '60 seg',
    carga_inicial: 'Leve — foco na contração',
    video: 'https://www.youtube.com/results?search_query=abdução+de+quadril+máquina+sentado',
    passos: [
      'Sente-se na máquina com as costas retas encostadas no apoio.',
      'Pés apoiados, joelhos a 90°. Almofadas nas partes externas dos joelhos/coxas.',
      'Abra as pernas controlado até o máximo da amplitude sem compensar com o tronco.',
      'PAUSA de 1 segundo na posição aberta — sinta a contração no glúteo lateral.',
      'Feche lentamente (3 seg) — não deixe a máquina bater.',
    ],
    dica: 'Este é o exercício mais importante para PREVENIR a recidiva da síndrome da banda IT. Priorize a contração, não a carga. Deve queimar no glúteo lateral.',
  },

  a3: {
    id: 'a3', treino: 'A',
    nome: 'Hip thrust (máquina)',
    unidade: 'kg',
    musculos: ['Glúteo máximo', 'Isquiotibiais', 'Core'],
    series: '3', reps: '12', descanso: '90 seg',
    carga_inicial: 'Moderada — sem dor lombar',
    video: 'https://www.youtube.com/results?search_query=hip+thrust+máquina+execução',
    passos: [
      'Ajuste o banco para que, sentado, os ombros fiquem na borda acolchoada.',
      'Pés apoiados no chão, na largura dos ombros. Joelhos a 90° quando o quadril estiver em cima.',
      'Empurre o quadril para CIMA contraindo o glúteo — o corpo fica reto como uma prancha.',
      'PAUSA de 2 segundos no topo — esprema o glúteo ao máximo.',
      'Desça controlado sem deixar o quadril tocar o chão entre as reps.',
    ],
    dica: 'A lombar NÃO dobra neste exercício. Se sentir dor lombar, diminua a carga ou ajuste o posicionamento. O movimento é 100% no quadril.',
  },

  a4: {
    id: 'a4', treino: 'A',
    nome: 'Cadeira extensora unilateral',
    unidade: 'kg',
    musculos: ['Quadríceps (foco no VMO — vasto medial)'],
    series: '3', reps: '12 cada perna', descanso: '60 seg',
    carga_inicial: 'Leve — unilateral exige menos que bilateral',
    video: 'https://www.youtube.com/results?search_query=cadeira+extensora+unilateral+execução',
    passos: [
      'Ajuste o banco para que o joelho fique alinhado com o eixo da máquina.',
      'Use apenas uma perna por vez. A outra fica relaxada ao lado.',
      'Estenda a perna controlado até quase reto — não trave o joelho no final.',
      'PAUSA de 1 seg no topo, contraindo o quadríceps.',
      'Desça em 3 segundos — a fase excêntrica (descida) é onde o músculo mais cresce.',
    ],
    dica: 'O VMO (a "gota" interna do quadríceps) é o estabilizador da patela. Fazer unilateral revela diferença de força entre as pernas — comum após síndrome da banda IT.',
  },

  a5: {
    id: 'a5', treino: 'A',
    nome: 'Panturrilha unilateral em pé',
    unidade: 'kg',
    musculos: ['Gastrocnêmio', 'Sóleo', 'Tendão de Aquiles'],
    series: '3', reps: '15 cada pé', descanso: '60 seg',
    carga_inicial: 'Peso do corpo ou leve halter na mão',
    video: 'https://www.youtube.com/results?search_query=panturrilha+unilateral+em+pé+execução',
    passos: [
      'Fique em pé apoiando a ponta do pé no degrau ou borda de uma plataforma.',
      'Segure algum apoio para equilíbrio. Use apenas uma perna.',
      'Desça o calcanhar abaixo do nível do apoio — sinta o alongamento.',
      'Suba até o máximo elevando o calcanhar — PAUSA de 1 seg no topo.',
      'Desça em 3 segundos. Não quique no fundo.',
    ],
    dica: 'Para corrida, a panturrilha é a "mola" da propulsão. Unilateral detecta desequilíbrios — se um lado for muito mais fraco, foque nele primeiro.',
  },

  // ── TREINO B ──

  b1: {
    id: 'b1', treino: 'B',
    nome: 'Prancha frontal',
    unidade: 'segundos',
    musculos: ['Core (transverso do abdômen)', 'Glúteo', 'Estabilizadores da coluna'],
    series: '3', reps: '35–45 seg', descanso: '45 seg',
    carga_inicial: 'Peso do corpo',
    video: 'https://www.youtube.com/results?search_query=prancha+frontal+execução+correta',
    passos: [
      'Apoie nos antebraços e pontas dos pés. Cotovelos abaixo dos ombros.',
      'Corpo reto da cabeça ao calcanhar — não deixe o quadril subir ou afundar.',
      'Contraia o abdômen como se fosse levar um soco. Respire normalmente.',
      'Olhe para o chão, pescoço neutro.',
      'Se sentir dor lombar, reduza o tempo ou apoie os joelhos — a forma é mais importante que a duração.',
    ],
    dica: 'Se conseguir mais de 45 seg com boa forma, evolua para prancha com elevação alternada de perna em vez de aumentar o tempo.',
  },

  b2: {
    id: 'b2', treino: 'B',
    nome: 'Dead bug',
    unidade: 'reps',
    musculos: ['Transverso do abdômen', 'Multífidos (lombar)', 'Iliopsoas'],
    series: '3', reps: '10 cada lado', descanso: '60 seg',
    carga_inicial: 'Peso do corpo',
    video: 'https://www.youtube.com/results?search_query=dead+bug+exercicio+execução+lombar',
    passos: [
      'Deite de costas. Braços apontados para o teto. Quadril e joelhos a 90° no ar.',
      'LOMBAR COLADA NO CHÃO — este é o ponto mais crítico do exercício.',
      'Desce o braço direito para trás (próximo à cabeça) e a perna esquerda para frente SIMULTANEAMENTE.',
      'Mantém a lombar no chão. Se ela descolar, você foi longe demais — reduza a amplitude.',
      'Volta ao centro e repete com o lado oposto (braço esquerdo + perna direita).',
    ],
    dica: 'Diferente do abdominal, este exercício NÃO flex iona a lombar — ele a estabiliza. Exatamente o que você precisa para correr sem sobrecarregar a região lombar.',
  },

  b3: {
    id: 'b3', treino: 'B',
    nome: 'Remada unilateral apoiada no banco',
    unidade: 'kg',
    musculos: ['Latíssimo do dorso', 'Romboides', 'Bíceps', 'Core'],
    series: '3', reps: '12 cada lado', descanso: '75 seg',
    carga_inicial: 'Moderada — postura é prioridade',
    video: 'https://www.youtube.com/results?search_query=remada+unilateral+banco+execução',
    passos: [
      'Apoie o joelho e a mão do MESMO lado no banco. Corpo paralelo ao chão.',
      'Segure o halter com a outra mão. Lombar reta e neutra — não arredonde.',
      'Puxe o halter em direção ao quadril (não ao peito). O cotovelo vai para trás e para cima.',
      'Não gire o tronco — o movimento é só do braço.',
      'Desça o halter completamente (braço esticado) antes de puxar de novo.',
    ],
    dica: 'Este exercício é seguro para sua lombar pois a posição horizontal descarrega completamente a coluna. É a remada mais indicada para quem tem histórico de dor lombar.',
  },

  b4: {
    id: 'b4', treino: 'B',
    nome: 'Voador inverso (rear delt fly)',
    unidade: 'kg',
    musculos: ['Deltoide posterior', 'Romboides', 'Trapézio médio'],
    series: '3', reps: '15', descanso: '60 seg',
    carga_inicial: '4–8 kg — muito leve',
    video: 'https://www.youtube.com/results?search_query=voador+inverso+halter+execução+rear+delt',
    passos: [
      'Em pé, incline o tronco para frente uns 45°. Joelhos levemente dobrados.',
      'Segure um halter leve em cada mão, braços pendurados com cotovelos levemente dobrados.',
      'Abra os braços para os lados como asas, levantando até a altura dos ombros.',
      'PAUSA de 1 seg no topo — sinta o aperto entre as escápulas.',
      'Desça controlado. Não use impulso — é muito comum usar carga alta e perder o movimento.',
    ],
    dica: 'Músculos fracos na parte posterior do ombro fazem o corredor "afundar" o tronco na parte final da corrida. Esse exercício corrige isso. Carga é MUITO leve mesmo.',
  },

  b5: {
    id: 'b5', treino: 'B',
    nome: "Farmer's carry",
    unidade: 'kg cada mão',
    musculos: ['Core lateral', 'Trapézio', 'Antebraços', 'Glúteo', 'Estabilizadores do tornozelo'],
    series: '3', reps: '20 passos', descanso: '60 seg',
    carga_inicial: '12–15 kg cada mão',
    video: 'https://www.youtube.com/results?search_query=farmers+carry+execução+correto',
    passos: [
      'Pegue um halter em cada mão, fique em pé.',
      'Ombros para trás e para baixo. Lombar neutra. Abdômen levemente contraído.',
      'Caminhe 20 passos em linha reta com passadas normais — não arraste os pés.',
      'Não deixe os halteres puxar os ombros para baixo ou o tronco inclinar para os lados.',
      'Respire normalmente durante toda a caminhada.',
    ],
    dica: 'Parece simples mas é um dos exercícios mais transferíveis para corrida que existem. Treina a estabilidade lateral do tronco — exatamente o que evita que o quadril "afunde" no impacto de cada passada.',
  },
};

// ── TREINOS ORGANIZADOS ─────────────────────────────────────
const TREINOS = {
  A: {
    nome: 'Treino A',
    desc: 'Quadril, glúteo e estabilidade de joelho',
    focus: ['Agachamento com barra','Abdução de quadril','Hip thrust','Cadeira extensora','Panturrilha'],
    exercicios: ['a1','a2','a3','a4','a5'],
  },
  B: {
    nome: 'Treino B',
    desc: 'Core, estabilidade lombar e cadeia posterior',
    focus: ['Prancha frontal','Dead bug','Remada unilateral','Voador inverso',"Farmer's carry"],
    exercicios: ['b1','b2','b3','b4','b5'],
  },
};

const FASES = [
  { semanas:[1,2], nome:'Fase 1 — Estabilidade e ativação', desc:'Cargas leves. Foco em técnica e ativação muscular.' },
  { semanas:[3,4], nome:'Fase 1 — Progresso inicial',       desc:'+10–15% de carga. Mantendo qualidade de execução.' },
  { semanas:[5,6], nome:'Fase 2 — Força funcional',         desc:'Pico de carga. Adiciona 1 série no glúteo.' },
  { semanas:[7],   nome:'Fase 3 — Descarga pré-prova',      desc:'Volume reduzido. Corpo descansa para a NB42k.' },
];

// ── STORAGE ─────────────────────────────────────────────────
function getDB() { try { return JSON.parse(localStorage.getItem('runner_bruno_v2') || '[]'); } catch { return []; } }
function saveDB(d) { localStorage.setItem('runner_bruno_v2', JSON.stringify(d)); }

// ── HELPERS ─────────────────────────────────────────────────
function daysUntilRace() {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.max(0, Math.ceil((RACE_DATE - today) / 86400000));
}
function weekNumber(date) { return Math.floor((new Date(date) - PLAN_START) / (7 * 86400000)); }
function currentPhase() {
  const w = weekNumber(new Date()) + 1;
  return FASES.find(f => f.semanas.includes(w)) || { nome:'Plano encerrado', desc:'Boa prova!' };
}
function fmtDate(ds) { return new Date(ds + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }); }
function fmtDateLong(ds) { return new Date(ds + 'T12:00:00').toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' }); }
function getWeekStart(offset=0) { const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay()-offset*7); return d; }
function allExercises() { return Object.values(EXERCICIOS_INFO); }
function toast(msg, type='success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
