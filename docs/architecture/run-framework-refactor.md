# Run Framework Refactor Plan

**Date:** 2026-06-05  
**Author:** lead-programmer (code-review pass)  
**Scope:** `frontend/src/scenes/runs/` (11 zone scenes) + `frontend/src/run/` support files

---

## 1. Duplication Inventory

### 1.1 Pointer / input binding — copied verbatim in 7 of 11 zones

Every zone that uses a "swipe to move" input model has its own `private bindPointer(): void` method that contains an identical `toLocal(e: PointerEvent)` helper, wires up the four canvas events (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`), and stores a `cleanup: (() => void) | null` field that is called from `exit()`.

Affected files and lines:

| File | `bindPointer` | `toLocal` snippet |
|---|---|---|
| `ExtractionScene.ts` | L125–156 | L127–134 |
| `InfeccaoScene.ts` | L279–315 | L281–287 |
| `LabirintoScene.ts` | L209–252 | L211–218 |
| `TorresScene.ts` | L252–275 | L254–261 |
| `CordilheiraScene.ts` | L176–218 | L178–185 |
| `CatedralScene.ts` | L167–214 | L169–176 |
| `CordilheiraScene.ts` | L176–218 | L178–185 |

`FieldControlScene` and `SacrificeScene` duplicate a slightly different variant: they store bound arrow-function handlers as class fields (`this.onDown`, `this.onMove`, `this.onUp`) and call a matching `unbindPointer()` method. Their `screenToWorld(e)` helpers (FieldControlScene L224–233, SacrificeScene L364–371) are character-for-character identical.

`RunFrame.ts` already exports `bindDrag()` (L235–257), which does exactly the same canvas-event wiring. Three zones use it (`HordasScene`, `StealthScene`, `CircuitoScene`). The other seven re-implement the same logic.

### 1.2 Delta capping — copied in every zone update()

Every zone opens its `update(dt)` with:

```typescript
const d = Math.min(dt, 1 / 30);
this.juice.update(d);
if (this.ended) return;
```

The exact literal `1 / 30` appears in all 11 zones. This belongs on the base class.

### 1.3 Music lifecycle — near-identical in 9 of 11 zones

Eight zones in `exit()` call `audioManager.stopMusic(300)`. `FieldControlScene` and `SacrificeScene` use `250` instead (L109, L146 respectively). In `enter()`, eight zones call:

```typescript
if (ZONE.music) {
  audioManager.playMusic(ZONE.music, { loop: true, volume: 0.3, fadeMs: 400 }).catch(() => undefined);
}
```

`HordasScene` hardcodes the path as a string literal (`'res://assets/audio/music/battle.wav'`, L288) and omits the `if (ZONE.music)` guard. `FieldControlScene` does the same (`L104`). `SacrificeScene` uses `volume: 0.35` (L141) instead of `0.3`.

### 1.4 Run-end flow — two divergent patterns

**Pattern A — `buildEndOverlay` (8 zones):** Calls `HubState.onRunEnded(victory)`, then `this.root.addChild(buildEndOverlay({...}))`. The overlay's "back" button drives the scene transition manually.

**Pattern B — custom overlay + `setTimeout` (2 zones):** `FieldControlScene` and `SacrificeScene` skip `buildEndOverlay`, build their own inline end overlay via `showEndOverlay()`, and use `setTimeout(() => { void sceneManager.replace(new HubScene()); }, 2500)` to auto-navigate after 2.5 seconds. This means the player cannot linger; there is also no "give-up" button because these zones bypass the shared HUD entirely.

Additionally, `FieldControlScene` (L95, L117, L473) and `SacrificeScene` (L131, L154, L729) call `GameState.startRun()` / `GameState.endRun()` and guard on `RunState.PLAYING`. None of the other nine zones do. This is silent inconsistency in game-state bookkeeping.

### 1.5 HUD construction — two divergent patterns

Nine zones build the HUD via:

```typescript
this.hud = buildHud(ZONE);
this.root.addChild(this.hud.container);
```

`FieldControlScene` and `SacrificeScene` instead construct their own raw `hudLayer` container with naked `Text` objects, their own background `Graphics`, and their own `refreshHud()` method. This means:
- The shared quit-confirm button from `RunFrame.buildHud` is absent in these two zones (confirmed by inspecting `FieldControlScene.buildHud`, L172–197, and `SacrificeScene.buildHud`, L309–338).
- HUD font/color styling is duplicated and inconsistent (`FontFamily.display` vs `FontFamily.mono`, different fill colors, different `y` positions).

### 1.6 Hardcoded timer values not in GameConfig

The following zones declare a `const TIMER = N;` locally instead of reading from `GameConfig`:

| File | Line | Value | Missing GameConfig key |
|---|---|---|---|
| `CatedralScene.ts` | 20 | 90 | `CATEDRAL_RUN_TIMER` |
| `CircuitoScene.ts` | 22 | 60 | `CIRCUITO_RUN_TIMER` (config has `CIRCUIT_RUN_TIMER: 90` — discrepancy!) |
| `CordilheiraScene.ts` | 21 | 75 | `CORDILHEIRA_RUN_TIMER` |
| `ExtractionScene.ts` | 22 | 60 | (config has `EXTRACTION_RUN_TIMER: 60` — key exists but unused here) |
| `InfeccaoScene.ts` | 22 | 75 | `INFECCAO_RUN_TIMER` |
| `LabirintoScene.ts` | 17 | 90 | `LABIRINTO_RUN_TIMER` |
| `StealthScene.ts` | 19 | 50 | `STEALTH_RUN_TIMER` |
| `TorresScene.ts` | 24 | 80 | `TORRES_RUN_TIMER` |

Critical: `CircuitoScene` declares `TIMER = 60` (L22) but `GameConfig.CIRCUIT_RUN_TIMER` is `90` (GameConfig.ts L170). The scene runs 30 seconds shorter than the config implies.

`ExtractionScene` imports `GameConfig` but uses its own `TIMER = 60` constant on L22 rather than `GameConfig.EXTRACTION_RUN_TIMER` (which is also `60` — benign but still inconsistent).

### 1.7 Other hardcoded gameplay values in scene files

- `HordasScene.ts` L45–50: Enemy stat table (`ESTATS`) with concrete `hp`, `speed`, `dmg` values that should live in `GameConfig` or a JSON data file.
- `HordasScene.ts` L25–29: `PLAYER_R`, `BASE_HP`, `BASE_SPEED` hardcoded.
- `HordasScene.ts` L84–85: `BUFF_TIME = 7` hardcoded.
- `HordasScene.ts` L102–112: Weapon level tables (`DART`, `AURA`, `ORBIT`, `NOVA`) as inline const objects — these are tuning data, not code.
- `FieldControlScene.ts` L19–29: All enemy and zone constants (`PLAYER_SPEED`, `RECAPTURER_HP`, `SQUAD_DPS`, etc.) hardcoded locally.
- `SacrificeScene.ts` L20–42: All gameplay constants hardcoded locally.

### 1.8 Duplicated `hexPts` utility

`StealthScene.ts` L180–187 and `InfeccaoScene.ts` L317–324 contain character-identical `hexPts(cx, cy, rad)` implementations. This should be extracted to a shared geometry utility.

### 1.9 `hud.setHealth` semantic ambiguity

Several zones repurpose the health bar as a progress bar:
- `CircuitoScene.ts` L157: `setHealth(1 - this.collected / GOAL)` — inverted objective progress.
- `ExtractionScene.ts` L122: `setHealth(1 - this.banked / FUEL_GOAL)` — inverted progress (bar shrinks as you succeed).
- `InfeccaoScene.ts` L191: `setHealth(1 - this.pelletsLeft / (COLS * ROWS))` — denominator is total cells, not just pellets, so the bar always reads well below 1.

The `RunHud` interface (RunFrame.ts L18–23) does not document what `setHealth` semantically means; each zone interprets it differently.

---

## 2. Proposed Abstract Base Class

The following API covers the invariants shared by all 11 zones without over-abstracting the parts that differ. It introduces no new runtime dependencies.

```typescript
// frontend/src/scenes/runs/RunScene.ts

import { audioManager } from '../../core/AudioManager';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
import { RunJuice } from '../../run/fx/RunJuice';
import { Scene } from '../../core/Scene';
import type { ZoneData } from '../../state/Zones';
import {
  buildHud, buildEndOverlay, type RunHud,
} from './RunFrame';

/** Maximum dt passed to update logic. Prevents spiral-of-death on tab resume. */
const MAX_DT = 1 / 30;

/**
 * Abstract base for every zone run scene.
 *
 * Subclass responsibilities:
 *   - Declare `protected readonly zone: ZoneData` and assign it before super.enter().
 *   - Implement `onEnter(): Promise<void> | void` — build world, NOT lifecycle.
 *   - Implement `onUpdate(dt: number): void` — game logic only; `dt` is already capped.
 *   - Implement `onExit(): void` — release non-canvas resources (e.g., drag.cleanup()).
 *   - Call `this.endRun(victory, payload?)` when the run concludes.
 *
 * The base class handles: delta capping, juice.update(), music start/stop,
 * HUD construction, run-end overlay, HubState bookkeeping.
 */
export abstract class RunScene extends Scene {
  /** Each subclass must set this before enter() is called. */
  protected abstract readonly zone: ZoneData;

  protected hud!: RunHud;
  protected juice!: RunJuice;

  /** Set to true by endRun(); subclasses should check this before mutating state. */
  protected ended = false;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  override async enter(): Promise<void> {
    this.juice = this.buildJuice();
    this.hud = buildHud(this.zone);
    this.root.addChild(this.hud.container);
    this.startMusic();
    await this.onEnter();
  }

  override exit(): void {
    this.onExit();
    this.juice.destroy();
    audioManager.stopMusic(300);
  }

  override update(dt: number): void {
    const d = Math.min(dt, MAX_DT);
    this.juice.update(d);
    if (this.ended) return;
    this.onUpdate(d);
  }

  // ── Abstract hooks ────────────────────────────────────────────────────────

  /**
   * Build scene-specific content (world nodes, entities, timers).
   * Called once after the shared HUD and juice have been created.
   */
  protected abstract onEnter(): Promise<void> | void;

  /**
   * Per-frame game logic. `dt` is already capped to MAX_DT.
   * The base class has already returned early if `this.ended`.
   */
  protected abstract onUpdate(dt: number): void;

  /**
   * Release scene-specific resources (input listeners, etc.).
   * Called before juice.destroy() and audioManager.stopMusic().
   */
  protected onExit(): void { /* optional */ }

  // ── Shared helpers ────────────────────────────────────────────────────────

  /**
   * Call when the run concludes (victory or defeat).
   * Triggers juice feedback, HubState bookkeeping, and the end overlay.
   *
   * @param victory  Whether the player succeeded.
   * @param opts     Optional reward/fail label overrides for the overlay.
   */
  protected endRun(victory: boolean, opts?: { rewardLabel?: string; failLabel?: string }): void {
    if (this.ended) return;
    this.ended = true;
    if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
    HubState.onRunEnded(victory);
    this.root.addChild(buildEndOverlay({
      zone: this.zone,
      victory,
      rewardLabel: opts?.rewardLabel,
      failLabel: opts?.failLabel,
    }));
  }

  /**
   * Builds a RunJuice instance with the zone accent color.
   * Override to pass a custom shakeTarget or ambient level.
   */
  protected buildJuice(): RunJuice {
    return new RunJuice(this.root, {
      accent: this.accentHex(),
      shakeTarget: null,
      ambient: 24,
    });
  }

  /** Converts the zone's RGBA accent to a PixiJS hex number. */
  protected accentHex(): number {
    return Color.hex(this.zone.accent_color);
  }

  // ── Pointer input factory ─────────────────────────────────────────────────

  /**
   * Registers canvas pointer events and returns a cleanup function.
   * Replaces the per-scene bindPointer() + toLocal() boilerplate.
   *
   * @param onDown  Called on pointerdown with scene-space coords.
   * @param onMove  Called on pointermove (only if down) with scene-space coords.
   * @param onUp    Called on pointerup / pointercancel.
   * @returns       A function to deregister all listeners; call from onExit().
   */
  protected bindPointerEvents(
    onDown: (pos: { x: number; y: number }, e: PointerEvent) => void,
    onMove: (pos: { x: number; y: number }, e: PointerEvent) => void,
    onUp: (e: PointerEvent) => void,
  ): () => void {
    const canvas = this.app.pixi.canvas;
    let isDown = false;

    const toLocal = (e: PointerEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const scale = this.app.world.scale.x || 1;
      return {
        x: (e.clientX - rect.left - this.app.world.x) / scale,
        y: (e.clientY - rect.top - this.app.world.y) / scale,
      };
    };

    const handleDown = (e: PointerEvent): void => { isDown = true; onDown(toLocal(e), e); };
    const handleMove = (e: PointerEvent): void => { if (isDown) onMove(toLocal(e), e); };
    const handleUp   = (e: PointerEvent): void => { isDown = false; onUp(e); };

    canvas.addEventListener('pointerdown',  handleDown);
    canvas.addEventListener('pointermove',  handleMove);
    canvas.addEventListener('pointerup',    handleUp);
    canvas.addEventListener('pointercancel', handleUp);

    return (): void => {
      canvas.removeEventListener('pointerdown',  handleDown);
      canvas.removeEventListener('pointermove',  handleMove);
      canvas.removeEventListener('pointerup',    handleUp);
      canvas.removeEventListener('pointercancel', handleUp);
    };
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private startMusic(): void {
    if (!this.zone.music) return;
    audioManager.playMusic(this.zone.music, {
      loop: true, volume: 0.3, fadeMs: 400,
    }).catch(() => undefined);
  }
}
```

### What the base class eliminates

| Duplication | Before | After |
|---|---|---|
| `const d = Math.min(dt, 1/30); juice.update(d); if ended return` | 11 copies | 1 in `RunScene.update` |
| `if (ZONE.music) audioManager.playMusic(...)` | 11 copies (3 wrong) | 1 in `startMusic()` |
| `audioManager.stopMusic(300)` | 11 copies (2 use 250) | 1 in `exit()` |
| `buildHud(ZONE); root.addChild(hud.container)` | 9 copies | 1 in `enter()` |
| `if (ended) return; juice.victoryFx/defeatFx; HubState.onRunEnded; buildEndOverlay` | 9 copies | 1 in `endRun()` |
| 4-event canvas binding + `toLocal` | 7 copies | 1 in `bindPointerEvents()` |

`FieldControlScene` and `SacrificeScene` retain their custom HUD markup but can extend `RunScene`, skip `buildHud` (override `enter()` and not call `super.enter()` or override `onEnter()`), and still get the delta-capping, juice lifecycle, and music boilerplate for free.

---

## 3. Violations Found (file:line)

### Convention violations

| Severity | File | Line | Issue |
|---|---|---|---|
| HIGH | `CircuitoScene.ts` | 22 | `TIMER = 60` — `GameConfig.CIRCUIT_RUN_TIMER` is `90`. Scene silently runs 30s shorter than designer config. |
| HIGH | `FieldControlScene.ts` | 104 | Hardcoded music path `'res://assets/audio/music/zones/field_theme_1.wav'` — must move to `ZONES[4].music`. |
| HIGH | `SacrificeScene.ts` | 141 | Hardcoded music path `'res://assets/audio/music/zones/dungeon_theme_1.wav'` — must move to `ZONES[7].music`. |
| HIGH | `HordasScene.ts` | 288 | Hardcoded music path `'res://assets/audio/music/battle.wav'` — must move to `ZONES[0].music`. |
| MED | `ExtractionScene.ts` | 22 | `TIMER = 60` — `GameConfig.EXTRACTION_RUN_TIMER` exists and is `60`, but the scene ignores it. |
| MED | `CatedralScene.ts` | 20 | `TIMER = 90` — no corresponding key in `GameConfig`. |
| MED | `CircuitoScene.ts` | 21–24 | `TIMER`, `TRAIL_GRACE_SEGS`, `GOAL` hardcoded; only some circuit constants are in `GameConfig`. |
| MED | `CordilheiraScene.ts` | 21 | `TIMER = 75` hardcoded. |
| MED | `InfeccaoScene.ts` | 22 | `TIMER = 75` hardcoded. |
| MED | `LabirintoScene.ts` | 17 | `TIMER = 90` hardcoded. |
| MED | `StealthScene.ts` | 19 | `TIMER = 50` hardcoded. |
| MED | `TorresScene.ts` | 24 | `TIMER = 80` hardcoded. |
| MED | `HordasScene.ts` | 45–50 | `ESTATS` enemy stat table hardcoded — should be in `GameConfig` or a JSON data file under `assets/data/`. |
| MED | `HordasScene.ts` | 84 | `BUFF_TIME = 7` hardcoded — no `GameConfig` entry. |
| MED | `HordasScene.ts` | 102–112 | Weapon level tables (`DART`, `AURA`, `ORBIT`, `NOVA`) are tuning data inlined as code. |
| LOW | `FieldControlScene.ts` | 109 | `stopMusic(250)` — inconsistent with 9 other zones using `300`. |
| LOW | `SacrificeScene.ts` | 146 | `stopMusic(250)` — inconsistent. |

### Correctness/logic concerns

| Severity | File | Line | Issue |
|---|---|---|---|
| HIGH | `ExtractionScene.ts` | 122 | `hud.setHealth(1 - this.banked / FUEL_GOAL)` — bar starts full and drains as you collect fuel. Visual meaning is inverted; player reads a falling bar as losing health, not gaining progress. |
| HIGH | `CircuitoScene.ts` | 157 | `hud.setHealth(1 - this.collected / GOAL)` — same inverted-progress issue. |
| MED | `InfeccaoScene.ts` | 191 | `hud.setHealth(1 - this.pelletsLeft / (COLS * ROWS))` — denominator is all cells (221), not pellets eaten (much fewer). Bar is always near 0 and barely moves, giving no useful feedback. Should use initial pellet count as denominator. |
| MED | `FieldControlScene.ts` | 475 | `setTimeout(() => sceneManager.replace(new HubScene()), 2500)` — timeout is not cancelled if the scene is externally replaced (e.g., quit from another scene's give-up). Possible double-navigate. |
| MED | `SacrificeScene.ts` | 731 | Same `setTimeout` leak as FieldControlScene. |
| MED | `ExtractionScene.ts` | 99 | `this.end(this.banked >= FUEL_GOAL / 2)` — when time runs out, victory requires ≥4 fuel (half of `FUEL_GOAL=8`). But `FUEL_GOAL / 2` is a magic number; this threshold is not in `GameConfig`. |
| MED | `FieldControlScene.ts` + `SacrificeScene.ts` | multiple | Only these two zones call `GameState.startRun()` / `GameState.endRun()`. If those calls have side effects (persistence, analytics), the other 9 zones silently omit them. |
| LOW | `RunFrame.ts` | 131 | The give-up button calls `HubState.onRunEnded(false)` then navigates. `FieldControlScene` and `SacrificeScene` do not use `buildHud`, so they have no quit button at all — players cannot bail from those two zones. |
| LOW | `HordasScene.ts` | 563 | `this.hp = Math.min(this.maxHp, this.hp + 30)` — heal-on-level-up value `30` is hardcoded (no `GameConfig` key). |

---

## 4. Incremental Refactoring Plan

The plan is broken into six steps, each independently shippable and non-breaking. Steps 1–3 are purely additive (new file + no-op subclass usage); steps 4–6 migrate zones one at a time.

### Step 1 — Extract `RunScene` base class (new file, no zone changes)

1. Create `frontend/src/scenes/runs/RunScene.ts` with the API defined in Section 2.
2. No existing file is touched. Zero risk to the build.
3. Write a unit test that constructs a trivial `RunScene` subclass and verifies `update()` clamps `dt`, calls `juice.update()`, and returns early when `ended` is true.

### Step 2 — Fix the CircuitoScene timer discrepancy (1-line fix, high priority)

**File:** `CircuitoScene.ts` L22  
**Change:** `const TIMER = 60;` → `const TIMER = GameConfig.CIRCUIT_RUN_TIMER;`  
**Also update GameConfig:** Confirm whether the intended timer is 60 or 90 with the game designer, then align `GameConfig.CIRCUIT_RUN_TIMER` accordingly.

This is a gameplay correctness fix independent of the architectural refactor.

### Step 3 — Move hardcoded music paths into ZoneData (data fix)

**Files:** `ZONES` data source (wherever `ZONES[0]`, `ZONES[4]`, `ZONES[7]` are defined), then update:
- `HordasScene.ts` L288 → use `ZONE.music`
- `FieldControlScene.ts` L104 → use `ZONE.music`
- `SacrificeScene.ts` L141 → use `ZONE.music`

This decouples the scene code from asset paths and is independently verifiable.

### Step 4 — Add remaining timer constants to GameConfig

For each `const TIMER = N` in zones not yet covered:

```
CATEDRAL_RUN_TIMER: 90,
CORDILHEIRA_RUN_TIMER: 75,
INFECCAO_RUN_TIMER: 75,
LABIRINTO_RUN_TIMER: 90,
STEALTH_RUN_TIMER: 50,
TORRES_RUN_TIMER: 80,
```

Then replace the local constants one zone at a time, verifying the build after each.

### Step 5 — Migrate simple zones to RunScene (4 zones, low risk)

Migrate zones that have the simplest internal structure first. Recommended order:

1. `CircuitoScene` — already uses `bindDrag` from RunFrame; only needs `onEnter`/`onUpdate`/`onExit`.
2. `StealthScene` — same shape as Circuito.
3. `CatedralScene` — tap-only input, no drag loop.
4. `CordilheiraScene` — swipe input via `bindPointerEvents`.

**Migration template:**

```typescript
// Before:
export class CircuitoScene extends Scene {
  // ...
  override async enter() { /* 30+ lines */ }
  override exit() { audioManager.stopMusic(300); this.drag.cleanup(); this.juice.destroy(); }
  override update(dt) { const d = Math.min(dt, 1/30); this.juice.update(d); if (this.ended) return; /* logic */ }
  private end(v: boolean) { if (this.ended) return; this.ended = true; /* ... */ }
}

// After:
export class CircuitoScene extends RunScene {
  protected readonly zone = ZONES[2]!;
  // ...
  protected async onEnter() { /* world setup only; no music/hud/juice */ }
  protected onExit() { this.drag.cleanup(); }
  protected onUpdate(d: number) { /* pure game logic; no delta cap, no ended check */ }
  // end() becomes: this.endRun(victory, { rewardLabel: '...', failLabel: '...' });
}
```

### Step 6 — Migrate complex zones and fix custom HUDs

**Zones:** `FieldControlScene`, `SacrificeScene`, `ExtractionScene`, `InfeccaoScene`, `LabirintoScene`, `TorresScene`, `HordasScene`.

Key additional work:

- `FieldControlScene` and `SacrificeScene`: Replace their custom `buildHud()` with `buildHud(ZONE)` from RunFrame, or document explicitly why they need a different HUD and extract it to a dedicated factory. Also remove `GameState.startRun/endRun` inconsistency by either adding it to all zones or removing it (coordinate with game-designer for intent).
- `FieldControlScene` and `SacrificeScene`: Replace `setTimeout` auto-navigate with the standard overlay pattern used by the other 9 zones to eliminate the dangling-timeout risk.
- Fix `setHealth` semantics: `ExtractionScene` and `CircuitoScene` should use `setHealth(this.banked / FUEL_GOAL)` (progress bar grows) instead of inverted.
- `InfeccaoScene`: Fix `setHealth` denominator (L191) to use stored initial pellet count instead of `COLS * ROWS`.
- `HordasScene`: Extract `ESTATS` and weapon level tables to `assets/data/hordas_config.json` or GameConfig entries.

### Refactoring safeguards

- Each migration step is a separate commit with a single zone touched.
- The game must boot and the migrated zone must be manually playable before the commit is merged.
- `StubRunScene` does NOT extend `RunScene` — it is a teaser/placeholder, not a gameplay zone, and should remain as-is.
- `RunFrame.ts` remains unchanged throughout; it is already a stable shared module.

---

## 5. Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| `RunScene.exit()` destroys juice before `onExit()` cleans up drag listeners | Low | Reorder: call `onExit()` first, then `juice.destroy()`. |
| `endRun()` called twice (e.g., timer + collision in same frame) | Low | Already guarded by `if (this.ended) return`. |
| `GameState.startRun/endRun` intent unclear | Medium | Requires game-designer sign-off before removing from FieldControl/Sacrifice or adding to all zones. Treat as a separate task. |
| HordasScene is 1,163 lines — migration step is large | Medium | Do it last; stub `onUpdate` with the existing body in one commit, then extract weapon systems iteratively. |
