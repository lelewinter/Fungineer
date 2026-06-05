# RunScene Migration Runbook

**Date:** 2026-06-05
**Author:** lead-programmer
**Scope:** Incremental migration of zone scenes to the `RunScene` abstract base class.
**Depends on:** `docs/architecture/run-framework-refactor.md` (architecture plan, Round 1)

---

## Premise / Assumptions (non-interactive agent)

1. The intended Circuito timer is **90 s** (matching `GameConfig.CIRCUIT_RUN_TIMER`). Commit a8d65da already fixed the scene to read from `GameConfig`, so the discrepancy is resolved.
2. `StubRunScene` is **excluded** from migration — it is a teaser placeholder, not a gameplay zone.
3. Each migration commit touches **exactly one scene file**. The game must be manually playtested in that zone before merging.
4. `RunScene.ts` (the new base class) does not exist yet; Step 0 creates it before any zone migration.
5. `bindDrag` from `RunFrame.ts` remains available but is superseded by `RunScene.bindPointerEvents()` during migration. Both paths are valid; `bindDrag` is not deleted.

---

## 0. State of the Codebase Post-#73

### What #73 changed (verified by `git show a8d65da --stat` and diff)

| Change | Detail |
|---|---|
| `HordasScene.ts` split | Logic stays in `HordasScene.ts`; config extracted to `hordas/config.ts`, entity types to `hordas/entities.ts`, spatial hash to `hordas/separation.ts`, drawing to `hordas/HordasRenderer.ts`. Public surface (`HordasScene` export) unchanged. |
| `CircuitoScene.ts` L43 | `const TIMER = 60` → `const TIMER = GameConfig.CIRCUIT_RUN_TIMER` (now reads 90). |
| `CircuitoScene.ts` L188 | `hud.setHealth(1 - this.collected / GOAL)` → `hud.setHealth(this.collected / GOAL)` (bar now fills on progress, not drains). |
| `StealthScene.ts` L39 | `const TIMER = 50` → `const TIMER = GameConfig.STEALTH_RUN_TIMER`. |
| `GameConfig.ts` | Added `STEALTH_RUN_TIMER: 50`, `CORDILHEIRA_RUN_TIMER: 75`, `TORRES_RUN_TIMER: 80`, `CATEDRAL_RUN_TIMER: 90`, `LABIRINTO_RUN_TIMER: 90`. |

### Remaining hardcoded timer (post-#73, still open)

`INFECCAO_RUN_TIMER` exists in `GameConfig` but `InfeccaoScene.ts` L44 already reads it — confirmed clean.

### What has NOT changed yet (post-#73 state)

- No `RunScene` base class exists. All 11 zones still extend `Scene` directly.
- `RunFrame.ts` is unchanged and stable.
- `FieldControlScene` and `SacrificeScene` still have custom HUD markup, `setTimeout` auto-navigate, and call `GameState.startRun/endRun`.
- `HordasScene.ts` still extends `Scene` (not yet a candidate for this runbook — it is complex).
- `hud.setHealth` in `ExtractionScene.ts` is still inverted (L122: `1 - this.banked / FUEL_GOAL`).

---

## 1. Candidate Selection: Which Zone is First?

### Evaluation matrix

| Zone | LOC | Input model | Uses bindDrag | Custom HUD | Custom end overlay | Special state | Score (lower = simpler) |
|---|---|---|---|---|---|---|---|
| `CircuitoScene` | 250 | drag (bindDrag) | YES | NO | NO | none | **1** |
| `StealthScene` | 261 | drag (bindDrag) | YES | NO | NO | none | **2** |
| `CatedralScene` | ~310 | tap only | NO | NO | NO | grid state | 3 |
| `CordilheiraScene` | ~320 | drag (bindPointer) | NO | NO | NO | path state | 4 |
| `ExtractionScene` | ~380 | joystick/drag | partial | NO | NO | lane system | 5 |
| `InfeccaoScene` | ~420 | tap | NO | NO | NO | grid + spread | 6 |
| `LabirintoScene` | ~450 | drag | NO | NO | NO | maze gen | 7 |
| `TorresScene` | ~480 | drag | NO | NO | NO | tower AI | 8 |
| `HordasScene` | ~810+modules | joystick | YES | NO | NO | weapon/level sys | 9 |
| `FieldControlScene` | unknown | drag | NO | CUSTOM | setTimeout | GameState calls | 10 |
| `SacrificeScene` | unknown | drag | NO | CUSTOM | setTimeout | GameState calls | 11 |

**First zone: `CircuitoScene`** — shortest file, already uses `bindDrag` from RunFrame (identical to what `RunScene.bindPointerEvents` wraps), no edge cases in HUD or overlay, no extra state systems.

**Second zone: `StealthScene`** — identical structural profile to Circuito, one extra nuance: passes `shakeTarget: this.content` to `RunJuice`, requiring a `buildJuice()` override.

---

## 2. Step 0 — Create `RunScene.ts` (prerequisite, no zone changes)

**File to create:** `frontend/src/scenes/runs/RunScene.ts`

This is the exact class designed in `run-framework-refactor.md` §2. Copy it verbatim. Reproduced here for unambiguous reference:

```typescript
// frontend/src/scenes/runs/RunScene.ts

import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
import { RunJuice } from '../../run/fx/RunJuice';
import { Scene } from '../../core/Scene';
import type { ZoneData } from '../../state/Zones';
import { buildHud, buildEndOverlay, type RunHud } from './RunFrame';

/** Maximum dt passed to update logic. Prevents spiral-of-death on tab resume. */
const MAX_DT = 1 / 30;

/**
 * Abstract base for every zone run scene.
 *
 * Subclass responsibilities:
 *   - Declare `protected readonly zone: ZoneData` and assign it.
 *   - Implement `onEnter(): Promise<void> | void` — build world content only.
 *   - Implement `onUpdate(dt: number): void` — game logic; dt is already capped.
 *   - Optionally override `onExit(): void` — release non-canvas resources.
 *   - Call `this.endRun(victory, payload?)` when the run concludes.
 *
 * The base class handles: delta capping, juice.update(), music start/stop,
 * HUD construction, run-end overlay, HubState bookkeeping.
 */
export abstract class RunScene extends Scene {
  protected abstract readonly zone: ZoneData;

  protected hud!: RunHud;
  protected juice!: RunJuice;
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
  protected onExit(): void { /* optional override */ }

  // ── Shared helpers ────────────────────────────────────────────────────────

  /**
   * Call when the run concludes (victory or defeat).
   * Triggers juice feedback, HubState bookkeeping, and the end overlay.
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
   * Override to pass a custom shakeTarget or ambient level.
   * Default: no shakeTarget, ambient 24.
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

**Verification after Step 0:** `npx tsc --noEmit` must pass. No zone file is touched.

---

## 3. Exact Diff — `CircuitoScene` Migration

### 3.1 What gets removed (lines deleted from `CircuitoScene.ts`)

**Imports removed:**

```typescript
// REMOVE these two lines (handled by RunScene base class):
import { audioManager } from '../../core/AudioManager';
// The following import loses 'bindDrag', 'type RunHud', 'type DragInput':
import { buildHud, buildEndOverlay, bindDrag, type RunHud, type DragInput } from './RunFrame';
```

**Class declaration changed:**

```typescript
// BEFORE:
import { Scene } from '../../core/Scene';
// ...
export class CircuitoScene extends Scene {

// AFTER:
import { RunScene } from './RunScene';
// ...
export class CircuitoScene extends RunScene {
```

**Fields removed (now on base class):**

```typescript
// REMOVE:
  private hud!: RunHud;
  private drag!: DragInput;
  private juice!: RunJuice;
  private ended = false;
```

`RunScene` already declares `protected hud`, `protected juice`, `protected ended`. The `drag` field becomes a scene-local cleanup function:

```typescript
// ADD (private, scene-local):
  private cleanupDrag!: () => void;
```

**`enter()` → `onEnter()` transformation:**

```typescript
// BEFORE (enter — 45 lines, lines 71-114):
override async enter(): Promise<void> {
  const accent = Color.hex(ZONE.accent_color);
  this.bg.rect(0, 0, VW, VH).fill({ color: 0x02080a });
  // ... background lines ...
  this.bg.rect(this.boundaryRect.x, this.boundaryRect.y, this.boundaryRect.w, this.boundaryRect.h)
    .stroke({ color: accent, width: 2, alpha: 0.6 });
  this.content.addChild(this.bg, this.trailG, this.nodeG, this.headG);
  this.root.addChild(this.content);
  // ... lore text ...

  this.spawnNodes(4);

  this.drag = bindDrag(this.app.pixi.canvas, this.app.world, this.head); // <-- REMOVE this line

  this.juice = new RunJuice(this.root, { accent: Color.hex(ZONE.accent_color), shakeTarget: this.content, ambient: 30 }); // <-- REMOVE

  this.hud = buildHud(ZONE);        // <-- REMOVE
  this.root.addChild(this.hud.container); // <-- REMOVE
  this.hud.setStatus('roteamento micótico');

  if (ZONE.music) {                 // <-- REMOVE entire block
    audioManager.playMusic(ZONE.music, { loop: true, volume: 0.3, fadeMs: 400 }).catch(() => undefined);
  }
}

// AFTER (onEnter — world setup only):
protected override async onEnter(): Promise<void> {
  const accent = Color.hex(ZONE.accent_color);
  this.bg.rect(0, 0, VW, VH).fill({ color: 0x02080a });
  // ... background lines unchanged ...
  this.bg.rect(this.boundaryRect.x, this.boundaryRect.y, this.boundaryRect.w, this.boundaryRect.h)
    .stroke({ color: accent, width: 2, alpha: 0.6 });
  this.content.addChild(this.bg, this.trailG, this.nodeG, this.headG);
  this.root.addChild(this.content);
  // ... lore text unchanged ...

  this.spawnNodes(4);

  // bindPointerEvents replaces the old bindDrag call
  this.cleanupDrag = this.bindPointerEvents(
    (pos) => { this.drag.x = pos.x; this.drag.y = pos.y; },
    (pos) => { this.drag.x = pos.x; this.drag.y = pos.y; },
    () => undefined,
  );

  this.hud.setStatus('roteamento micótico'); // hud is already built by base class
}
```

Wait — `CircuitoScene` uses `this.drag.pos.x / this.drag.pos.y` via the `DragInput` object from `bindDrag`. The cleanest migration preserves the `pos` object the `update()` already reads. Replace the `DragInput` field with a plain coordinate object:

```typescript
// REPLACE private field:
// private drag!: DragInput;        <- REMOVE
  private dragPos: { x: number; y: number } = { x: VW / 2, y: VH / 2 };
  private cleanupDrag!: () => void;

// In onEnter():
  this.cleanupDrag = this.bindPointerEvents(
    (pos) => { this.dragPos.x = pos.x; this.dragPos.y = pos.y; },
    (pos) => { this.dragPos.x = pos.x; this.dragPos.y = pos.y; },
    () => undefined,
  );

// In onUpdate() — replace all `this.drag.pos.x` with `this.dragPos.x` (2 occurrences, lines 136-137):
    const dx = this.dragPos.x - this.head.x;
    const dy = this.dragPos.y - this.head.y;
```

**`exit()` → `onExit()` transformation:**

```typescript
// BEFORE (exit — 4 lines, lines 117-121):
override exit(): void {
  audioManager.stopMusic(300);  // <-- REMOVE (base class does this)
  this.drag.cleanup();          // <-- REPLACE
  this.juice.destroy();         // <-- REMOVE (base class does this)
}

// AFTER:
protected override onExit(): void {
  this.cleanupDrag();
}
```

**`update()` → `onUpdate()` transformation:**

```typescript
// BEFORE (update — 66 lines, lines 124-189):
override update(dt: number): void {
  const d = Math.min(dt, 1 / 30);  // <-- REMOVE (base class does this)
  this.juice.update(d);             // <-- REMOVE (base class does this)
  if (this.ended) return;           // <-- REMOVE (base class does this)
  this.elapsed += d;
  this.timeLeft -= d;
  // ... rest of logic unchanged using local `d` ...
}

// AFTER (signature change only, body unchanged from line 3 onward):
protected override onUpdate(d: number): void {
  this.elapsed += d;
  this.timeLeft -= d;
  if (this.timeLeft <= 0) { this.end(this.collected >= GOAL / 2); return; }
  // ... rest of logic unchanged, `d` is already the capped delta ...
}
```

**`end()` → `endRun()` call:**

```typescript
// BEFORE (end() — 15 lines, lines 235-249):
private end(victory: boolean): void {
  if (this.ended) return;
  this.ended = true;
  if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
  if (victory && this.collected > 0) {
    HubState.depositFlow('nucleo_logico', this.collected);
  }
  HubState.onRunEnded(victory);
  this.root.addChild(buildEndOverlay({
    zone: ZONE,
    victory,
    rewardLabel: `+${this.collected} Núcleo Lógico — relés ativados`,
    failLabel: 'Loop de ressonância. Circuito destruído.',
  }));
}

// AFTER:
private end(victory: boolean): void {
  if (victory && this.collected > 0) {
    HubState.depositFlow('nucleo_logico', this.collected);
  }
  this.endRun(victory, {
    rewardLabel: `+${this.collected} Núcleo Lógico — relés ativados`,
    failLabel: 'Loop de ressonância. Circuito destruído.',
  });
}
```

Note: `HubState` import is still needed for `depositFlow`. Keep it. Remove `buildEndOverlay` from the `RunFrame` import (no longer called directly). The import line becomes:

```typescript
// BEFORE:
import { buildHud, buildEndOverlay, bindDrag, type RunHud, type DragInput } from './RunFrame';

// AFTER: remove entirely (RunScene provides everything)
// RunFrame is not imported directly in the migrated scene.
```

**`buildJuice()` override — REQUIRED for CircuitoScene:**

`CircuitoScene` passes `shakeTarget: this.content` and `ambient: 30` to `RunJuice`. The base class defaults to `shakeTarget: null` and `ambient: 24`. Add this override:

```typescript
protected override buildJuice(): RunJuice {
  return new RunJuice(this.root, {
    accent: this.accentHex(),
    shakeTarget: this.content,
    ambient: 30,
  });
}
```

This must be placed after `private content = new Container()` is declared so `this.content` is initialized before `enter()` calls `buildJuice()`. It is safe: `content` is a class-field initializer, which runs before any method calls.

### 3.2 Complete before/after summary for `CircuitoScene.ts`

| Aspect | Before | After |
|---|---|---|
| Extends | `Scene` | `RunScene` |
| Imports | `Scene`, `audioManager`, `buildHud`, `buildEndOverlay`, `bindDrag`, `RunHud`, `DragInput`, `RunJuice` | `RunScene`, `RunJuice` (for buildJuice override), `HubState` (still needed for depositFlow) |
| Fields removed | `hud: RunHud`, `drag: DragInput`, `juice: RunJuice`, `ended: boolean` | — |
| Fields added | `dragPos: {x,y}`, `cleanupDrag: () => void` | — |
| `enter()` | 45 lines: builds world, bindDrag, buildHud, music | Removed |
| `onEnter()` | — | ~38 lines: world setup + `bindPointerEvents` + `hud.setStatus` |
| `buildJuice()` | — | Override: passes `shakeTarget: this.content, ambient: 30` |
| `exit()` | Calls `stopMusic`, `drag.cleanup()`, `juice.destroy()` | Removed |
| `onExit()` | — | Calls `cleanupDrag()` |
| `update()` | Caps dt, calls juice.update, checks ended, then logic | Removed |
| `onUpdate(d)` | — | Pure logic, dt already capped |
| `end()` | 15 lines, guards `ended`, calls juice fx, HubState, buildEndOverlay | 6 lines, calls `depositFlow` then `this.endRun(...)` |
| Lines saved | — | ~25 lines removed (delta cap, music lifecycle, HUD setup, overlay boilerplate) |

### 3.3 Lines in `onUpdate` that reference `this.drag.pos`

Two occurrences (current lines 136-137 in the file):

```typescript
// Current:
const dx = this.drag.pos.x - this.head.x;
const dy = this.drag.pos.y - this.head.y;

// After rename:
const dx = this.dragPos.x - this.head.x;
const dy = this.dragPos.y - this.head.y;
```

These are the **only** references to `this.drag` in the scene.

---

## 4. Exact Diff — `StealthScene` Migration (Zone 2)

`StealthScene` is structurally identical to `CircuitoScene`. The differences:

1. `this.playerPos` is both the initial drag target AND gets mutated by the scene's own movement logic. The drag only sets the target; the actual position is updated in `onUpdate`. This is the same pattern as Circuito (`this.head` vs `this.drag.pos`). Replace `this.drag.pos` → `this.dragPos` as above.
2. `shakeTarget: this.content, ambient: 28` (different ambient value from Circuito's 30).

**Changes parallel to CircuitoScene:**

| Aspect | StealthScene specifics |
|---|---|
| `extends` | `Scene` → `RunScene` |
| `buildJuice()` override | `shakeTarget: this.content, ambient: 28` |
| `onEnter()` | Remove 7 lines at end (juice, buildHud, bindDrag, music block); add `bindPointerEvents`, keep `hud.setStatus('infiltração micótica')` |
| `onExit()` | `cleanupDrag()` only (remove stopMusic + juice.destroy) |
| `onUpdate(d)` | Remove first 3 lines (cap, juice.update, ended check) |
| `end()` | Same pattern: keep `depositFlow('ai_components', this.banked)`, replace `buildEndOverlay` call with `this.endRun(...)` |
| `this.drag.pos.x/y` | 2 occurrences in `onUpdate` (lines ~141-142) → `this.dragPos.x/y` |

**One nuance in StealthScene not in Circuito:**

`StealthScene.enter()` calls `bindDrag(this.app.pixi.canvas, this.app.world, this.playerPos)` passing `this.playerPos` as the initial position. `bindDrag` stores and mutates that reference. After migration, `dragPos` is a separate object; `playerPos` stays as the scene's authoritative position. The initial value of `dragPos` should match `playerPos`:

```typescript
private dragPos: { x: number; y: number } = { x: VW / 2, y: VH / 2 };
// (same initial value as playerPos — correct)
```

---

## 5. Checklist of Manual Verification — Post-Migration (per zone)

Perform this checklist after migrating each zone, before merging the commit.

### A. Build gate (automated, must pass first)

- [ ] `npx tsc --noEmit` exits 0.
- [ ] `npm run build` (Vite) exits 0 with no TS errors.

### B. Boot and navigate (1 min)

- [ ] App loads to hub without console errors.
- [ ] Selecting the migrated zone from the hub navigates to it.
- [ ] Zone name and accent color appear correctly in the HUD top bar.
- [ ] HUD timer shows the correct starting value (CircuitoScene: 90 s; StealthScene: 50 s).
- [ ] Music starts playing on zone entry.

### C. Gameplay — core loop (5–10 min)

**CircuitoScene:**
- [ ] Drag/touch moves the snake head toward the finger.
- [ ] Collecting a relay (rele) increments the `relés X/14` score display.
- [ ] Collecting a relay grows the trail (visually).
- [ ] Speed increases noticeably after 3+ collections.
- [ ] Health bar fills (not drains) as relays are collected.
- [ ] Self-collision (touching own trail) triggers defeat.
- [ ] Hitting the boundary frame triggers defeat.
- [ ] Collecting all 14 relays triggers victory.
- [ ] Run ending at time-out with >= 7 collected triggers victory; with < 7 triggers defeat.

**StealthScene:**
- [ ] Drag/touch moves the player blob toward the finger.
- [ ] Touching a smaller hexagon blob absorbs it and increases player radius.
- [ ] Touching a predator (larger red circle) triggers immediate defeat.
- [ ] Player radius shown in score: `sinal X/32`.
- [ ] Health bar fills as player grows.
- [ ] Reaching radius 32 triggers victory before timer expires.
- [ ] Timer reaching 0 with radius >= 32 triggers victory; < 32 triggers defeat.
- [ ] Player speed decreases as radius grows (not constant).

### D. End overlay (both zones)

- [ ] Victory overlay shows "MISSÃO CUMPRIDA" and the reward label.
- [ ] Defeat overlay shows "RUN PERDIDA" and the fail label.
- [ ] "Voltar ao bunker" button navigates back to hub.
- [ ] No JavaScript errors in console after overlay appears.

### E. Quit flow

- [ ] The ✕ quit button in the top-left is present and responsive.
- [ ] Tapping it shows the quit-confirm dialog.
- [ ] "Desistir" navigates to hub and registers a failed run.
- [ ] "Continuar" closes the dialog and resumes the game.

### F. Audio lifecycle

- [ ] Music stops when navigating back to hub via the end overlay.
- [ ] Music stops when quitting via the ✕ button.
- [ ] No audio "double play" if the zone is re-entered immediately.

### G. Re-entry (regression)

- [ ] Navigate to zone → play briefly → go to hub → navigate to zone again.
- [ ] Second entry shows a fresh game (timer reset, no state from previous run).
- [ ] No memory leaks visible in browser DevTools Memory tab after 2 cycles (heap size should not grow unboundedly).

### H. Reduced-motion (accessibility)

- [ ] With `prefers-reduced-motion: reduce` set in OS/browser, screen shake does not occur.
- [ ] Gameplay and overlay are otherwise unaffected.

---

## 6. Recommended Zone Migration Order

After CircuitoScene and StealthScene are verified, proceed in this order:

| Step | Zone | Why |
|---|---|---|
| 3 | `CatedralScene` | Tap-only input (no drag state), flat internal structure, short (~310 LOC). No `bindDrag` at all — `onExit` is empty after migration. |
| 4 | `CordilheiraScene` | Drag input via manual `bindPointer` — the first use of `bindPointerEvents()` replacing the per-scene copy. Good validation of that helper. |
| 5 | `ExtractionScene` | Adds one complexity: `hud.setHealth` is still inverted in current code (tracked in refactor doc). Fix the inversion as part of this migration step. Use GameConfig.EXTRACTION_RUN_TIMER. |
| 6 | `InfeccaoScene` | `hud.setHealth` denominator bug (uses COLS*ROWS instead of initial pellet count). Fix as part of migration. Confirm INFECTION_RUN_TIMER is already read from GameConfig (confirmed post-#73). |
| 7 | `LabirintoScene` | Maze generation state — no extra bugs flagged, moderate complexity. |
| 8 | `TorresScene` | Tower AI update loop — longest of the straightforward scenes. |
| 9 | `HordasScene` | Already split into modules by #73 (~810 LOC in scene file). Large but internally cleaner. Stub `onUpdate` with existing body first, then extract weapon systems in follow-up commits. |
| 10 | `FieldControlScene` | Custom HUD, setTimeout auto-navigate, GameState calls. Requires design decision on GameState intent before migrating. Do last among the two hard cases. |
| 11 | `SacrificeScene` | Same issues as FieldControlScene. Coordinate together. |

### Rationale for deferring FieldControlScene / SacrificeScene

These two zones have an unresolved design question: they call `GameState.startRun()` / `GameState.endRun()` which none of the other 9 zones do. If those calls have side-effects (persistence, analytics), migrating without clarifying intent could silently change behavior. This requires a game-designer sign-off per the risk register in the architecture doc.

---

## 7. Risk Register (migration-specific)

| Risk | When | Mitigation |
|---|---|---|
| `buildJuice()` called before `this.content` field is initialized | Step 0 class authoring | Not a risk: class fields are initialized in declaration order before `enter()` is called. `buildJuice()` is called from `enter()`. Safe. |
| `dragPos` initial value differs from `playerPos` | StealthScene migration | Both are `{ x: VW/2, y: VH/2 }`. Verify by inspection before committing. |
| `hud.setStatus()` called before `onEnter()` | Wrong call order in `onEnter` | Call `hud.setStatus` inside `onEnter` after world setup; `hud` is guaranteed non-null because `RunScene.enter()` builds it before calling `onEnter()`. |
| `HubState.depositFlow` missing from migrated `end()` | Developer forgets the pre-endRun call | Checklist item D covers reward label; also verify `HubState` import is not removed. |
| `ended` guard removed twice — once in `end()` (now `endRun()`), once missed | `end()` was previously guarded internally | `endRun()` in the base class has the guard: `if (this.ended) return`. The per-scene `end()` can drop its own guard if it delegates entirely to `endRun()`. Verify the call sites — CircuitoScene's `end()` is called in two places in `onUpdate`. |

---

*Runbook ready for execution. Begin with Step 0 (create RunScene.ts), verify tsc, then proceed to CircuitoScene.*
