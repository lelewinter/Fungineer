# Fungineer

> Um cientista maluco lidera os últimos humanos da Terra em um apocalipse dominado por IAs.
> Construa um foguete peça por peça raideando zonas perigosas —
> mas sua única ação em qualquer zona é **mover o personagem**.

---

## O Jogo

As IAs tomaram o planeta. Você é o cientista mais improvável do apocalipse —
otimista, absurdo, e absolutamente convicto de que um foguete artesanal vai funcionar.

A base de resistência é o hub. De lá, você escolhe qual zona raidar, coleta recursos,
e volta (se sobreviver) para colocar mais uma peça no foguete.
O foguete crescendo na tela é a âncora emocional do jogo — progresso concreto, visível, esperançoso.

**A restrição central:** em qualquer zona, o único input é mover o personagem.
Não há botão de ataque, habilidade ativada ou interação direta.
Posicionamento é o jogo. O que "mover" significa muda completamente de zona para zona.

---

## Zonas

| Zona | Mecânica central |
|------|-----------------|
| **Hordas** | Squad de 4, combate automático radial, rescate de personagens |
| **Stealth** | Evitar cones de detecção e raio sonoro das IAs |
| **Circuito** | Placas coloridas em sequência, sentinelas patrulhando |
| **Extração** | Coletar recursos com parede autoscroll avançando |
| **Campo** | Capturar e defender zonas contra reconquistadores |
| **Infecção** | Conter propagação de nós infectados, curar aliados |
| **Labirinto** | Navegação procedural com inimigos rastreadores |
| **Sacrifício** | Câmaras com coleta cronometrada, invasores do hub |

---

## Stack

| Camada | Tecnologia | Deploy |
|---|---|---|
| **Frontend** | PixiJS v8 + Vite + TypeScript | Cloudflare Pages |
| **Backend** | FastAPI + SQLite (Python 3.11+) | Railway |

O projeto começou em Godot 4.6 e foi portado para PixiJS na PR #13. A árvore
Godot legacy foi removida do repositório — consulte o histórico do git para
referência caso precise olhar o código original.

---

## Estrutura do projeto

```
frontend/         PixiJS + Vite (UI, gameplay, runs)
  public/assets/  symlink → ../../assets (arte/áudio compartilhados)
  src/
    core/         App, SceneManager, ApiClient, filtros (CRT), typography
    state/        GameConfig, GameState, HubState, SaveService, Zones, Characters
    scenes/       HubScene, WorldMapScene, runs/{Hordas,FieldControl,Sacrifice,Stub}
    run/          BaseCharacter, BaseEnemy, Party, DragController, Wave, Powers
    ui/           Modal, PixiButton, run/HUD, hub/*

backend/          FastAPI service (save/load + healthcheck)
  main.py         endpoints
  requirements.txt
  Procfile        (Railway)

assets/           arte + áudio (servidos via symlink em frontend/public/assets)
design/           GDDs, lore, conceito
docs/             documentação técnica
```

---

## Rodar localmente

### Pré-requisitos
- Node 20+
- Python 3.11+

### Frontend
```bash
cd frontend
npm install
cp .env.example .env       # opcional — só se quiser remote save/load
# .env: VITE_API_URL=http://localhost:8000
npm run dev                # abre http://localhost:5173
```

Comandos disponíveis:
- `npm run dev` — Vite dev server com hot reload
- `npm run build` — produção em `frontend/dist/`
- `npm run preview` — serve o build local em `:4173`
- `npm run typecheck` — `tsc --noEmit`

### Backend (opcional — só pra save remoto)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # opcional
uvicorn main:app --reload --port 8000
```

Endpoints:
- `GET  /healthz` — liveness
- `GET  /docs` — Swagger UI
- `POST /api/state/save` — `{ "slot_id": "default", "state": {...} }`
- `GET  /api/state/{slot_id}` — restore
- `DELETE /api/state/{slot_id}` — wipe

O frontend funciona **sem** o backend — quando `VITE_API_URL` está vazio
a persistência cai pra localStorage só. Liga o backend só se quiser save
cross-device ou backup remoto.

---

## Deploy

### Frontend → Cloudflare Pages

1. **Conecta o repo no dashboard** do Cloudflare Pages.
2. **Build settings**:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `frontend`
3. **Environment variables** (Production e Preview):
   - `VITE_API_URL` = URL do backend no Railway (ex: `https://fungineer-api.up.railway.app`)
     — deixa vazio se ainda não tem backend no ar; o jogo cai pra localStorage.
4. **Deploy** — Cloudflare publica em `https://<projeto>.pages.dev` e em
   PR previews automaticamente.

Notas:
- O symlink `frontend/public/assets → ../../assets` precisa funcionar no
  build do Cloudflare. Pages usa Linux nos builders → symlink resolve normal.
  Se algum asset não aparecer no deploy, mover `assets/` pra dentro de `frontend/public/`.
- As 6 WAVs de zona pesam ~100MB — considere converter pra OGG/MP3 antes
  do deploy de produção (Pages tem limite de 25MB por arquivo).

### Backend → Railway

1. **New project** → conecta o repo → escolhe o serviço.
2. **Settings → root directory**: `backend`.
3. **Procfile** já está pronto: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. **Variables**:
   - `FRONTEND_URL` = URL do Cloudflare Pages (ex: `https://fungineer.pages.dev`)
   - (opcional) `FUNGINEER_DB` = `/data/fungineer.db` se você anexar um Volume
     persistente em `/data` — sem isso, o save reseta a cada deploy.
5. **Deploy**. Anota o domínio público — esse vira o `VITE_API_URL` no Cloudflare.

Pra produção real, recomendo trocar SQLite por Postgres (Railway oferece
plugin) e fazer o `_db()` em `backend/main.py` apontar pro `DATABASE_URL`.
O scaffold atual já tá pronto pra isso — só trocar o context manager.

---

## Infraestrutura de desenvolvimento

Este projeto usa o **[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)**
como base — um sistema de 48 agentes especializados (design, programação, QA, narrativa, produção)
que coordenam o desenvolvimento através do Claude Code.

---

*Roguelike anthology · Mobile-first · PixiJS v8*
