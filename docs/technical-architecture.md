---
tags: [fungineer, documentacao, tecnico, architecture]
date: 2026-05-11
tipo: documentacao
---

# Technical Architecture — Fungineer

**Version**: 2.0 (post-web-port)
**Date**: 2026-05-11
**Stack**: PixiJS v8 + Vite + TypeScript (frontend) · FastAPI + SQLite (backend)
**Supersedes**: 1.0 (Godot 4.6 — see ADR-002)

> The Godot 4.6 / GDScript architecture that this document used to describe
> was removed from the repo after the port (its history is preserved in git).
> The shipping runtime is everything below.

---

## High-Level Topology

```
┌──────────────────────────────────────────────────────────────┐
│  Browser / PWA (Cloudflare Pages)                            │
│                                                              │
│   index.html ──▶  main.ts ──▶  App (PixiJS) ──▶ SceneManager │
│                                              │               │
│                                              ├──▶ HubScene   │
│                                              ├──▶ WorldMap   │
│                                              └──▶ run/*      │
│                                                              │
│   Service worker (vite-plugin-pwa, injectManifest)           │
│   localStorage  ◀──── SaveService ────▶  fetch(VITE_API_URL) │
└────────────────────────────────────────────┬─────────────────┘
                                             │ HTTPS / CORS
                                             ▼
┌──────────────────────────────────────────────────────────────┐
│  FastAPI service (Railway) — backend/main.py                 │
│                                                              │
│   POST /api/state/save  ──▶  SQLite (save_slots)             │
│   GET  /api/state/{id}                                       │
│   DEL  /api/state/{id}                                       │
│   GET  /healthz                                              │
└──────────────────────────────────────────────────────────────┘
```

The backend is **optional**. When `VITE_API_URL` is empty (or unreachable),
the frontend persists exclusively to `localStorage`. Save state is opaque
JSON on the server — gameplay schema is owned 100% by the frontend.

---

## Architecture Principles

1. **Data-driven config.** All tunable values live in
   `frontend/src/state/GameConfig.ts`. No magic numbers in scene/run code.
2. **Single source of truth in `state/`.** `GameState`, `HubState`,
   `CharacterRegistry`, `Zones`, and `SaveService` are the persistence
   contract — scenes read/write them, never the other way around.
3. **Signal-based communication.** Cross-system events flow through
   `core/Signal.ts` (a lightweight typed pub/sub). No deep direct method
   calls between scenes and run systems.
4. **No physics for combat.** Damage, range, pickup, and detection use
   distance checks on `Container` positions. No physics engine — the
   "only-input-is-move" pillar means logical overlaps are sufficient.
5. **Scene-per-mode.** Each gameplay mode (`HordasScene`, `FieldControlScene`,
   `SacrificeScene`, `StubRunScene`) is its own Pixi scene class extending
   the `Scene` base. `SceneManager.replace()` is the only way to transition.
6. **Backend is opaque.** The FastAPI service treats the save payload as a
   black box — schema evolution doesn't require backend redeploys.

---

## Frontend Module Layout

```
frontend/
├── index.html                       Pixi mount + PWA meta + iOS tags
├── vite.config.ts                   Vite + vite-plugin-pwa (injectManifest)
├── tsconfig.json
├── public/
│   ├── _headers                     Cloudflare Pages cache rules
│   ├── pwa/                         icon.svg, icon-maskable.svg
│   └── assets → ../../assets        symlink to shared art/audio
└── src/
    ├── main.ts                      bootstrap: App → SceneManager → HubScene
    ├── core/
    │   ├── App.ts                   PixiJS Application wrapper, letterboxing
    │   ├── Scene.ts                 base class (analogous to a Pixi root node)
    │   ├── SceneManager.ts          single-active-scene state machine
    │   ├── ApiClient.ts             fetch wrapper for the FastAPI backend
    │   ├── AssetLoader.ts           texture/atlas/audio loading
    │   ├── AudioManager.ts          WebAudio + unlock-on-first-gesture
    │   ├── Signal.ts                typed pub/sub
    │   ├── filters/CRTFilter.ts     post-FX (auto-disabled on low-power)
    │   ├── tween.ts, hash.ts, types.ts, typography.ts, Color.ts
    │   └── ...
    ├── state/
    │   ├── GameConfig.ts            all tunable constants
    │   ├── GameState.ts             run state machine + signals
    │   ├── HubState.ts              persistent hub progress
    │   ├── HubData.ts               hub-related static data
    │   ├── CharacterRegistry.ts     character roster + unlocks
    │   ├── Zones.ts                 zone definitions (replaces data/zones.gd)
    │   └── SaveService.ts           localStorage + remote sync orchestration
    ├── scenes/
    │   ├── BootScene.ts             splash / first frame
    │   ├── WorldMapScene.ts         zone-select map
    │   ├── ZoneRoom.ts              hub→zone transition room
    │   ├── hub/                     HubScene, HubRenderer, HubNPCManager,
    │   │                            HubRocket, HubAudio
    │   └── runs/                    HordasScene, FieldControlScene,
    │                                SacrificeScene, SimpleRunScene,
    │                                StubRunScene
    ├── run/                         shared run primitives
    │   ├── BaseCharacter.ts         party member base class
    │   ├── BaseEnemy.ts             enemy base class
    │   ├── Party.ts                 4-character formation + drag-following
    │   ├── DragController.ts        pointer/touch → party move target
    │   ├── WaveSpawner.ts           enemy waves
    │   ├── Characters.ts, Enemies.ts, Projectiles.ts
    │   ├── ExperienceGem.ts, ExtractionPoint.ts, ItemSpawner.ts, ResourceItem.ts
    │   ├── RunWorld.ts              shared world container + camera follow
    │   ├── stealth/StealthAgent.ts  Stealth-mode detection cones
    │   ├── power/                   PowerManager + Powers definitions
    │   └── fx/                      DamageNumbers, Juice
    ├── pwa/
    │   ├── sw.ts                    service worker source (injectManifest)
    │   ├── registerSW.ts            registration + update orchestration
    │   ├── UpdateBanner.ts          DOM banner UI
    │   └── safeToReload.ts          scene-aware reload gate
    ├── ui/
    │   ├── Modal.ts, PixiButton.ts, ConfirmRaidDialog.ts
    │   ├── hub/                     HubTopBar, HubBottomBar, etc.
    │   └── run/HUD.ts
    └── data/
        └── LoreFragments.ts
```

---

## Scene Lifecycle

The `Scene` base + `SceneManager` is the analogue of Godot's scene tree:

```
SceneManager
  ├── attach(app)                     once at bootstrap
  ├── replace(newScene)               teardown old → enter new
  └── current ▸ Scene
                ├── enter(world)      build display tree
                ├── tick(dt)          per-frame update (Pixi ticker)
                └── exit()            tear down listeners, signals, children
```

Every scene is responsible for:
- Adding/removing its own display objects from `app.world`.
- Subscribing to and **unsubscribing from** signals it cares about.
- Calling `requestAnimationFrame` / `ticker.add` only via `enter()`-time
  registration and tearing it down in `exit()`.

Failure to clean up is the historical source of every "ghost listener" /
"ticker leak" bug — see commit `c0d936a` (HubTopBar/BottomBar teardown).

---

## State & Persistence

```
HubState (in-memory)  ──▶  SaveService  ──▶  localStorage (always)
                                        ──▶  FastAPI /api/state/save (when armed)
                                              │
                                              └──▶ SQLite save_slots(slot_id, state_json, updated_at)
```

- `saveService.load()` tries remote first, falls back to localStorage, then
  to defaults. Returns the source so `main.ts` can log it.
- `saveService.arm()` enables write-on-change after the initial hub mount,
  preventing the boot sequence from overwriting fresh remote data.
- `saveService.flush()` is called on `pagehide` for last-second persistence.
- The server stores **opaque JSON** — the frontend owns schema migrations.

---

## Run-mode Shape

A "run" is a single zone playthrough. Every mode shares:

- A `Party` (1–4 `BaseCharacter` instances, drag-followed via `DragController`).
- A `RunWorld` container that scrolls / camera-follows the party.
- A `WaveSpawner` or mode-specific spawner (timed enemy/resource emission).
- A `HUD` overlay (`ui/run/HUD.ts`) for HP, timer, and mode-specific gauges.
- A `PowerManager` (for modes that use the power system).
- An EXIT condition specific to the mode (boss kill, timer, extraction, etc.).

Mode-specific systems live next to the scene that owns them
(`run/stealth/StealthAgent.ts` is only used by stealth-flavoured runs).

---

## Rendering

- **Renderer**: PixiJS v8, WebGL (WebGPU preferred when available).
- **Resolution**: 480×854 logical viewport, letterboxed by `App.fit()` into
  whatever physical canvas the device gives us.
- **Filters**: `CRTFilter` on a `world` container; **auto-disabled** on
  `pointer: coarse` (mobile) to save ~30% frame budget.
- **Ticker**: capped to 60 FPS (`ticker.maxFPS = 60`) — 120 Hz displays
  would otherwise burn battery for no visible gain.
- **DPR**: capped at 2 to keep mobile fillrate sane.
- **Mobile viewport**: listens to both `resize` and `visualViewport.resize`
  so the URL-bar collapse on iOS/Android re-letterboxes properly.

---

## Backend (FastAPI)

`backend/main.py` is a flat module — intentional for MVP:

| Route | Method | Behavior |
|---|---|---|
| `/healthz` | GET | Liveness probe, returns `{status, service, time}` |
| `/` | GET | Documentation pointer (`/docs` for Swagger) |
| `/api/state/save` | POST | Upsert `{slot_id, state_json, updated_at}` into SQLite |
| `/api/state/{slot_id}` | GET | Return the latest state for `slot_id` or 404 |
| `/api/state/{slot_id}` | DELETE | Wipe a slot, 204 |

CORS allowlist:
- `http://localhost:{5173,4173}` and `127.0.0.1` equivalents (Vite dev/preview).
- `FRONTEND_URL` env var (e.g. `https://fungineer.pages.dev`).
- Regex `https://.*\.pages\.dev` covers Cloudflare preview deploys.

DB:
- Default: `fungineer.db` next to the process. Configurable via `FUNGINEER_DB`.
- Schema: a single `save_slots(slot_id PK, state_json TEXT, updated_at TEXT)`
  table created on startup if missing. Production should mount a Railway
  Volume at `/data` and set `FUNGINEER_DB=/data/fungineer.db`.
- Postgres-ready: only the `_db()` context manager needs to change. The
  `INSERT … ON CONFLICT … DO UPDATE` already works on both engines.

---

## CI / Deploy

- `.github/workflows/frontend-ci.yml` — `npm ci` → `typecheck` → `build`,
  uploads `frontend/dist` artifact.
- `.github/workflows/backend-ci.yml` — installs requirements, imports
  `main`, runs a `TestClient` smoke (save → load → delete).
- **Cloudflare Pages** builds the frontend from the dashboard (root
  directory `frontend`, build cmd `npm run build`, output `dist`).
- **Railway** runs the backend via `backend/Procfile`
  (`web: uvicorn main:app --host 0.0.0.0 --port $PORT`).

No CI publishes directly — the deploy targets pull from `main` themselves.

---

## Performance Budgets (current targets)

| Metric | Target | Notes |
|---|---|---|
| FPS (mobile, PWA) | 60 | Snapdragon 720G class, low-power profile |
| Active enemies | 60 on screen | Hordas peak; rest of zones lower |
| Initial JS bundle (gzipped) | < 350 KB | watch via `vite build` size report |
| Audio cache entries (SW) | 40 LRU | enforced in service worker |
| Backend p95 save latency | < 150 ms | from a Railway edge |

Pooling: `ExperienceGem`, `BaseEnemy`, `Projectiles` should be pooled via
their respective managers — verify before adding new spawn-heavy modes.

---

## Testing

- **TypeScript**: `npm run typecheck` (CI gate).
- **Backend smoke**: FastAPI `TestClient` runs in `backend-ci.yml`.
- **Unit tests**: not yet wired in CI. When added, use **Vitest** in
  `frontend/` and `pytest` in `backend/`.
- **Manual playtest**: required on desktop + mobile (PWA) for any PR
  touching `run/` or `scenes/runs/`.

---

## Known Gaps / Backlog

- Vitest setup for state/balance logic.
- WAV → OGG/MP3 conversion for zone music (Cloudflare 25 MB/file cap).
- iOS Safari PNG icon fallback for iOS ≤15 (currently SVG-only).
- Postgres migration path (config-only, when SQLite hits limits).
- Telemetry pipeline for playtest metrics — not started.
- The PWA reload gate (`safeToReload`) polls scene state every 200 ms;
  emit a signal instead when `SceneManager` grows one.
