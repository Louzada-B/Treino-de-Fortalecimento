# Plano de Treino · Bruno Elias Lopes Louzada

App web para acompanhamento do plano de fortalecimento muscular (7 semanas) com foco na preparação para a **NB42k · 21km · 12/07/2026**.

## Funcionalidades

- **Dashboard** — métricas, progresso das 14 sessões, calendário semanal e cargas recentes
- **Plano de Treino** — treinos A e B completos com aquecimento, exercícios prescritos (séries/reps/descanso) e alongamento final
- **Como fazer** — modal com músculo trabalhados, passo a passo de execução, dica personalizada e link de vídeo para cada exercício
- **Registrar Sessão** — carga, séries, reps e observações por exercício
- **Histórico** — lista completa com filtros por tipo
- **Relatório** — download em `.txt` com resumo semanal para envio ao treinador

---

## Deploy: GitHub + Vercel

### 1. GitHub

```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/SEU_USUARIO/runner-bruno.git
git push -u origin main
```

### 2. Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com o GitHub
2. **Add New Project** → selecione o repositório
3. Clique **Deploy** — sem configuração, é HTML puro

---

## Estrutura

```
runner-bruno/
├── index.html
├── css/style.css
├── js/
│   ├── data.js   ← treinos, exercícios, frases e helpers
│   └── app.js    ← lógica do app
└── README.md
```

**Dados salvos em `localStorage`** — use sempre o mesmo dispositivo/navegador.  
Toda semana baixe o `.txt` e envie ao treinador para análise.
