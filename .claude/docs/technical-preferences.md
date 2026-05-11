# Technical Preferences

<!-- All agents reference this file for project-specific standards and conventions. -->
<!-- Last major update: 2026-05-11 — Godot prototype retired, PixiJS port is the shipping stack (see ADR-002). -->

## Stack & Languages

- **Frontend**: PixiJS v8 + Vite + TypeScript 5.x — `frontend/`
- **Backend**: FastAPI + SQLite, Python 3.11+ — `backend/`
- **Rendering**: PixiJS WebGL renderer (Canvas2D fallback)
- **Audio**: Browser `AudioContext` via `frontend/src/core/AudioManager.ts`
- **PWA**: `vite-plugin-pwa` (injectManifest) + `workbox-window`
- **Hosting**: Cloudflare Pages (frontend) + Railway (backend)

## Naming Conventions

### TypeScript (frontend)

- **Classes / Types / Interfaces**: PascalCase (ex: `HubScene`, `HubRoom`, `BaseEnemy`)
- **Functions / methods / variables**: camelCase (ex: `onRoomClicked`, `zoneIndex`, `spawnWave`)
- **Constants**: UPPER_SNAKE_CASE (ex: `ROCKET_RECIPE`, `MAX_HEALTH`)
- **Signals / events**: past-tense camelCase (ex: `rocketPieceBuilt`, `waveCompleted`)
- **Files**: PascalCase matching the exported class (`HubScene.ts`),
  camelCase for utilities (`safeToReload.ts`)
- **Asset paths**: lowercase with hyphens, never spaces (`assets/art/ui/hub-bg.png`).
  In source, use the `res://assets/...` form so `AssetLoader` resolves to `/assets/...`.

### Python (backend)

- **Classes / Pydantic models**: PascalCase (`SaveStatePayload`)
- **Functions / variables**: snake_case (`save_state`, `slot_id`)
- **Constants**: UPPER_SNAKE_CASE (`DB_PATH`, `DEFAULT_ORIGINS`)
- **Files**: snake_case (`main.py`)

## Module Layout

### Frontend (`frontend/src/`)

- `core/` — `App`, `SceneManager`, `ApiClient`, filters, typography
- `state/` — `GameConfig`, `GameState`, `HubState`, `SaveService`, `Zones`,
  `Characters` (single source of truth, no engine coupling)
- `scenes/` — `HubScene`, `WorldMapScene`, `runs/*`
- `run/` — gameplay primitives (`BaseCharacter`, `BaseEnemy`, `Party`,
  `Powers`, drag controller, wave spawner)
- `ui/` — `Modal`, `PixiButton`, `run/HUD`, `hub/*`
- `pwa/` — service worker source + update orchestration

### Backend (`backend/`)

- Flat: `main.py` (FastAPI app + routes + DB helpers), `requirements.txt`,
  `Procfile`. Grow into `routes/` / `db/` only when warranted.

## Performance Budgets

- Frontend bundle (initial JS, gzipped): target < 350 KB
- Run scenes: maintain 60 fps on a 2020-class Android (Snapdragon 720G or above)
- Backend p95 latency on save/load: < 150 ms from a Railway edge

Not strictly enforced in CI yet; revisit when we have telemetry.

## Testing

- **Frontend typecheck**: `cd frontend && npm run typecheck` (must be clean
  before merge — also gated by `frontend-ci.yml`).
- **Frontend build**: `cd frontend && npm run build` (must succeed before
  merge — also gated by `frontend-ci.yml`).
- **Backend smoke**: FastAPI `TestClient` runs in `backend-ci.yml`. Add unit
  tests under `backend/tests/` for any new route or DB helper.
- **Frontend unit tests**: not yet wired. When added, use **Vitest** for
  business logic in `state/`, `run/power/`.
- **Manual playtest**: every PR that touches `run/` or `scenes/runs/`
  requires a one-zone playthrough on desktop + one on mobile (PWA).

## Forbidden / Out-of-Stack

- **Do not add** Godot, Unity, Unreal, Phaser, Three.js, React/Vue/Svelte,
  or any other game/UI framework without an ADR.
- **Do not introduce** ORMs in the backend yet (raw `sqlite3` is intentional
  for MVP). Revisit if we add multi-table relations.
- **Do not couple** the backend to gameplay schema — the save payload is
  opaque JSON on purpose.

## ADRs

- `docs/adr/adr-001-engine-choice.md` — **Superseded**. Original Godot decision.
- `docs/adr/adr-002-web-port.md` — Accepted. Current stack rationale.
- `docs/architecture/adr-pwa.md` — Accepted. PWA + service worker.
