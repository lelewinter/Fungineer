# Tech-Debt & Dead-Config Audit (Round 2, verified)

- **Date:** 2026-06-05
- **Author:** Technical Director (subagente não-interativo)
- **Scope:** `frontend/` (PixiJS v8 + Vite + TS), post-#73 refactor
- **Method:** Every claim below is verified by `grep` against `.ts` source. "0 usos"
  means zero references outside the definition file `frontend/src/state/GameConfig.ts`.
  No dynamic/computed access exists (`grep "GameConfig\["` → 0 hits), so static
  reference counting is conclusive — there is no hidden indirection.

> Premissas assumidas (subagente não-interativo, sem perguntar):
> - "Não referenciado em `.ts`" = morto para o runtime. Documentação `.md` e
>   o espelho Godot `GameConfig.gd` não contam como uso de runtime.
> - O alvo "remoção segura" são apenas chaves de um design que NÃO existe mais.
>   Chaves de zonas que existem mas cujo código duplica os valores localmente são
>   tratadas como DÍVIDA (drift), não como lixo — removê-las apagaria a fonte-da-
>   verdade pretendida.

---

## 1. Dead GameConfig keys — verified, safe to remove

### 1a. CONFIRMED DEAD — old lane-runner Extraction design (SAFE REMOVAL)

`frontend/src/scenes/runs/ExtractionScene.ts:1-19` documents the real scene: it is a
**Boulder Dash** digging level (`Cell = 'dirt' | 'empty' | 'rock' | 'fuel' | 'wall'`,
falling rocks, fuel goal). It is NOT a lane runner. It reads exactly one Extraction
key: `EXTRACTION_RUN_TIMER` (line 43). The unrelated `EXTRACTION_RADIUS` belongs to
`frontend/src/run/ExtractionPoint.ts` (the hub extraction circle) and is live.

The entire "Extraction Zone (Lane Runner)" block in `GameConfig.ts:194-209` — except
`EXTRACTION_RUN_TIMER` — is dead. These reference a design that no longer ships and
have **0 usages**:

| Key | GameConfig.ts line | Usos | Verdict |
|---|---|---|---|
| `EXTRACTION_BONUS_TIME` | 196 | 0 | DEAD — safe remove |
| `EXTRACTION_LANE_COUNT` | 197 | 0 | DEAD — safe remove |
| `EXTRACTION_LANE_H` | 198 | 0 | DEAD — safe remove |
| `EXTRACTION_SCROLL_START` | 199 | 0 | DEAD — safe remove |
| `EXTRACTION_SCROLL_END` | 200 | 0 | DEAD — safe remove |
| `EXTRACTION_LANE_SWITCH_DUR` | 201 | 0 | DEAD — safe remove |
| `EXTRACTION_SPAWN_IVRL_START` | 202 | 0 | DEAD — safe remove |
| `EXTRACTION_SPAWN_IVRL_END` | 203 | 0 | DEAD — safe remove |
| `EXTRACTION_DEBUFF_SMOKE` | 204 | 0 | DEAD — safe remove |
| `EXTRACTION_DEBUFF_SLOW` | 205 | 0 | DEAD — safe remove |
| `EXTRACTION_DEBUFF_EMP` | 206 | 0 | DEAD — safe remove |
| `EXTRACTION_DEBUFF_WIRE` | 207 | 0 | DEAD — safe remove |
| `EXTRACTION_SPARK_TICK` | 208 | 0 | DEAD — safe remove |
| `EXTRACTION_SPARK_DMG` | 209 | 0 | DEAD — safe remove |

**15 keys total** are dead in/around this block (the 14 above + `EXTRACTION_BONUS_TIME`).
The Round-2 suspicion is correct and verified. Recommended action: delete these 15
lines and the now-misleading `// Extraction Zone (Lane Runner)` comment; rename the
surviving `EXTRACTION_RUN_TIMER` into the generic "run timers" block. This is low-risk
(`as const` object, no spread/iteration, no dynamic access) and reversible via git.

KEPT (live, do not remove): `EXTRACTION_RUN_TIMER` (ExtractionScene.ts:43),
`EXTRACTION_RADIUS` (ExtractionPoint.ts:52,60).

### 1b. CAUTION — broader "0-usage" keys that are DRIFT, not garbage

A full sweep of all `GameConfig` keys found **~75 keys with 0 external references**.
Critically, these are NOT all deletable. Most belong to zones that DO ship but whose
scene code **bypasses GameConfig and hardcodes the same numbers locally**. Example,
`frontend/src/scenes/runs/InfeccaoScene.ts`:

- Reads from GameConfig: only `VIEWPORT_WIDTH/HEIGHT` and `INFECTION_RUN_TIMER` (lines 32-33, 44).
- Redefines everything else locally: `PLAYER_SPEED = 80` (:41), `GHOST_SPEED = 60` (:42),
  `POWER_TIME = 6` (:43), grid sizes, etc.
- Meanwhile `INFECTION_PLAYER_HP`, `INFECTION_SPREAD_INTERVAL*`, `INFECTION_BIOMASS_RATE_*`,
  `INFECTION_CURE_TIME_*` (GameConfig.ts:219-235) sit unused.

Same pattern verified in: `CircuitoScene.ts` (only reads `CIRCUIT_RUN_TIMER`; all 8
`CIRCUIT_SENTINEL_*/PLATE_*/PLAYER_HP` dead), `SacrificeScene.ts` (only `SACRIFICE_RUN_TIMER`;
`PLAYER_SPEED=200` at :28, `HUB_ENEMY_SPEED=110` at :38 shadow dead `SACRIFICE_*`),
`MAZE_*` (all 8 dead — Labirinto hardcodes), `FIELD_CAPTURE_*/SIGNAL/RECAPTURE` (dead).

The `STEALTH_*` block is *partially* wired: `run/stealth/*` reads `STEALTH_AGENT_SPEED_MAX`,
`STEALTH_SOUND_RADIUS_MIN/MAX` (Agent.ts), but `STEALTH_VISION_LENGTH`, `STEALTH_CAMERA_*`,
`STEALTH_PATROL_SPEED`, `STEALTH_CHASE_SPEED`, `STEALTH_DETECTION_TIME` are dead — the
scene computes/hardcodes them. This is the worst-of-both: a config that is half source-
of-truth and half lie.

Also flagged dead and worth a design decision (not in this report's remove list):
`WAVE_1_*`/`WAVE_2_*` (HordasScene is a Vampire-Survivors mode with its own `hordas/config.ts`,
not a wave/horde counter — the old wave keys appear obsolete like the lane-runner ones),
`PARTY_FORMATION_SPACING`, `DRAG_DEAD_ZONE`, `TECH_FRAGMENTS_BASE_REWARD`, `HACK_PUZZLE_TIME`,
`HACK_TERMINAL_RADIUS`, `DEBUG_SHOW_RANGES`.

> **Director's call:** Only the **1a lane-runner block** is approved for blind deletion.
> The **1b drift keys** must be resolved by *rewiring the scene to read GameConfig*
> (preferred — restores the project's stated "no magic gameplay numbers in scene code"
> rule) OR by an explicit decision to delete the keys and accept local constants. Do
> not silently delete 1b — that discards the intended balance source-of-truth.

---

## 2. Architecture state — post-#73

### What #73 modularized well

- **Hordas extracted into a module** (`frontend/src/scenes/runs/hordas/`):
  - `config.ts` (137 lines) — all Hordas tuning in one place.
  - `entities.ts` (59) — data types + `rand`.
  - `separation.ts` (88) — **spatial-hash** crowd separation (`SEP_CELL=34`), the right
    structure for 110 concurrent enemies (`ENEMY_CAP`).
  - `HordasRenderer.ts` (361) — layered immediate-mode Graphics, static background drawn
    once (`bgStatic`), only moving layers redrawn per frame.
  - `HordasScene.ts` (810) consumes them and uses **object pools** (`projPool`, `gemPool`,
    lines 110-111) to avoid per-frame allocation. This is the reference-quality scene.
- **Shared run framework** `frontend/src/scenes/runs/RunFrame.ts` (`buildHud`,
  `buildEndOverlay`) is adopted by **all 11 run scenes** — HUD/end-overlay scaffolding is
  no longer duplicated. Good consolidation.
- **Run-timer centralization**: every scene reads `*_RUN_TIMER` from GameConfig; no scene
  hardcodes its run length anymore (verified — `grep "const TIMER" | grep -v GameConfig` → 0).

### What still duplicates / is inconsistent

- **Config ownership is split-brain.** Hordas tuning lives in `hordas/config.ts`; every
  *other* zone hardcodes tuning as local `const`s inside the scene file while parallel keys
  rot in `GameConfig.ts` (see §1b). There is no single, consistently-applied rule for where
  a gameplay number lives. This is the dominant architectural debt post-#73.
- **No shared per-frame rendering helper.** Each scene re-implements the
  `graphics.clear(); <redraw everything>` immediate-mode loop independently. Clear counts:
  Sacrifice 5, Infeccao/Torres 4, six scenes at 3. Only Hordas separates static vs. dynamic
  layers; others clear-and-redraw layers that rarely change (e.g. maze walls, corridors).
- **Only Hordas pools.** Pooling (`pool/Pool`) appears in `HordasScene.ts` only. Other
  scenes with spawning entities (Sacrifice drones, Field signals, Infeccao ghosts) allocate
  ad hoc. Lower entity counts make this tolerable today, not free.

### Mobile performance budget — where it is at risk

Target context: 480x854 portrait, PixiJS WebGL on mid-tier mobile (60 fps → 16.6 ms/frame).

1. **Fill-rate from full-layer redraws (medium risk).** The clear+redraw pattern across
   10+ scenes re-tessellates and re-uploads geometry every frame even for static content
   (maze grids in `InfeccaoScene.ts:375`, corridors/chambers in `SacrificeScene.ts:581-603`).
   On mid-tier GPUs this is the most likely 60-fps offender outside Hordas. Mitigation:
   adopt Hordas' static-vs-dynamic layer split as a shared helper; mark static layers
   `cacheAsTexture`/draw-once.
2. **Hordas worst case (managed, monitor).** `ENEMY_CAP=110` + projectiles + separation is
   the heaviest scene, but it is the *only* one with a spatial hash + pooling, so it is the
   best-prepared. Watch separation cost as cap scales; `SEP_CELL` is tuned for 34px cells.
3. **GC churn in non-pooled scenes (low–medium).** Per-frame `new Graphics()` / array
   allocation in spawn-heavy scenes risks GC hitches (frame spikes, not average fps). Extend
   pooling beyond Hordas where entity counts grow.

No formal frame/memory budget document was found in `docs/architecture/`. Recommendation:
ratify explicit budgets (frame ≤16.6 ms, draw calls, peak texture memory) so these risks
become measurable rather than asserted. `run-framework-refactor.md` and
`impl-spec-movement-input.md` exist but do not set numeric perf budgets.

---

## 3. Top-5 technical debt (prioritized: effort × risk)

| # | Debt | Why it matters | Effort | Risk if ignored |
|---|---|---|---|---|
| 1 | **Config split-brain / drift** — ~75 GameConfig keys unused while scenes hardcode the same numbers locally (§1b). Balance source-of-truth is unreliable. | Designers can't trust GameConfig; tuning edits silently do nothing; the "no magic numbers" rule is violated everywhere except Hordas. | **L** (rewire each zone scene to read its keys, or formally delete) | **High** — every future balance pass is error-prone. |
| 2 | **Dead lane-runner keys (§1a)** — 15 keys for a deleted design. | Misleads readers into thinking Extraction is a lane runner; pollutes the central tuning file. | **S** (delete 15 lines, fix comment) | **Low**, but cheap to fix now — do it first as a quick win. |
| 3 | **No shared per-frame render helper / static-layer caching** | Fill-rate + redraw cost is the top mobile-fps risk (§2.1). Each scene reinvents redraw, none (except Hordas) caches static layers. | **M** (extract a layered-render helper from Hordas; apply to grid/wall/corridor layers) | **Medium** — fps dips on mid-tier devices; hard to retrofit later across 10 scenes. |
| 4 | **Pooling only in Hordas** | GC hitches in spawn-heavy scenes (Sacrifice, Field, Infeccao). | **M** (generalize the Hordas pool into a reusable utility) | **Medium** — intermittent frame spikes, worsens as content grows. |
| 5 | **No ratified mobile perf budget** | Perf risks above are asserted, not measured; no gate to catch regressions. | **S–M** (write budget ADR + wire a simple frame/draw-call counter) | **Medium** — regressions ship unnoticed until late. |

### Recommended sequencing
1. Quick win: delete §1a dead keys (#2). Zero behavior change, reversible, removes a documented lie.
2. Ratify perf budget (#5) so #3/#4 have a target.
3. Decide config ownership policy (#1): **recommend rewiring scenes to read GameConfig**,
   matching the Hordas/config.ts model and the project's own stated rule. This is the
   highest-value structural fix.
4. Extract shared render/pool helpers from Hordas (#3, #4) and roll out per scene.

---

## Anchors (real files)
- `frontend/src/state/GameConfig.ts` — all keys; §1 line numbers cited inline.
- `frontend/src/scenes/runs/ExtractionScene.ts:1-19,43` — proves Boulder Dash, not lane runner.
- `frontend/src/run/ExtractionPoint.ts:52,60` — live `EXTRACTION_RADIUS`.
- `frontend/src/scenes/runs/hordas/{config,entities,separation,HordasRenderer}.ts` — #73 module.
- `frontend/src/scenes/runs/HordasScene.ts:108-111` — object pools.
- `frontend/src/scenes/runs/RunFrame.ts` — shared HUD/end overlay (all 11 scenes).
- `frontend/src/scenes/runs/InfeccaoScene.ts:32-44` & `CircuitoScene.ts:43` &
  `SacrificeScene.ts:28,38,136` — drift evidence (scenes hardcode; keys rot).
- `frontend/src/run/stealth/*` — partial STEALTH_* wiring.
