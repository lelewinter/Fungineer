# Technical Preferences

<!-- All agents reference this file for project-specific standards and conventions. -->

## Stack

- **Frontend**: PixiJS v8 + TypeScript (Vite, ES2022 modules) — `frontend/`
- **Backend**: FastAPI + SQLite (Python 3.11+) — `backend/`
- **Rendering**: PixiJS WebGL renderer (Canvas2D fallback)
- **Audio**: Browser `AudioContext` via `frontend/src/core/AudioManager.ts`

## Naming Conventions (TypeScript)

- **Classes / types**: PascalCase (ex: `HubScene`, `HubRoom`)
- **Functions / methods / variables**: camelCase (ex: `onRoomClicked`, `zoneIndex`)
- **Constants**: UPPER_SNAKE_CASE (ex: `ROCKET_RECIPE`)
- **Signals**: camelCase past-tense (ex: `rocketPieceBuilt`)
- **Files**: PascalCase matching the exported class (ex: `HubScene.ts`)
- **Resources path**: `res://assets/...` resolved by `AssetLoader` to `/assets/...`

## Performance Budgets

Not yet configured. Use `/perf-profile` to set targets.

## Testing

- **Typecheck**: `cd frontend && npm run typecheck` (must be clean before merge)
- **Build**: `cd frontend && npm run build` (must succeed before merge)
- **Runtime tests**: not yet wired

## Forbidden Patterns / Allowed Libraries / ADRs

None configured. Use `/architecture-decision` to add entries as decisions are made.
