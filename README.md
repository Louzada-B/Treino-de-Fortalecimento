# Plano de Treino · Bruno Elias Lopes Louzada

App web para acompanhamento do plano de fortalecimento muscular (7 semanas) — NB42k · 21km · 12/07/2026.

## Deploy: GitHub + Vercel

```bash
git init
git add .
git commit -m "primeiro commit"
git remote add origin https://github.com/Louzada-B/Treino-de-Fortalecimento.git
git branch -M main
git push -u origin main
```

Vercel: Add New Project → seleciona o repo → Deploy.

## Estrutura

```
runner-bruno/
├── index.html
├── css/style.css
├── js/
│   ├── data.js   ← treinos, progressão, Supabase, helpers
│   └── app.js    ← lógica do app
└── README.md
```

Dados sincronizados via Supabase. localStorage como fallback offline.
