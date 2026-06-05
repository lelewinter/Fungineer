# Implementation Spec: Unified MovementInput Layer

**Status**: Ready to code
**Author**: gameplay-programmer (non-interactive subagent)
**Date**: 2026-06-05
**Implements**: Central design constraint — "the ONLY input is move the character"

---

## 1. Current State Audit

### Files Examined

| File | Input Style | Issues Found |
|---|---|---|
| `frontend/src/run/DragController.ts` | Delta-drag (movementX/Y), lerp to target | MOVE_THRESHOLD hardcoded; no deadzone applied; pointer lost on pointerleave fires onUp but does NOT clear moveTarget snapshot; single-touch only assumed |
| `frontend/src/scenes/runs/RunFrame.ts` (`bindDrag`) | Absolute pointer position → dragging flag + pos | No smoothing; pos is raw pixel; used by StealthScene and CircuitoScene |
| `frontend/src/scenes/runs/HordasScene.ts` | Floating joystick built on top of `bindDrag`; offset locked on pointerdown | Has its own dead zone constants (JOY_DEAD=8, JOY_MAX=64) hardcoded at top of file; has its own velocity accumulator (MOVE_ACCEL=13 also hardcoded) |
| `frontend/src/scenes/runs/FieldControlScene.ts` | Absolute pointer → dragTarget; direct speed*dt movement in `movePlayer` | PLAYER_SPEED=200 hardcoded; no smoothing; dead zone only `if (dist < 4) return` |
| `frontend/src/scenes/runs/SacrificeScene.ts` | Same pattern as FieldControl | PLAYER_SPEED=200 hardcoded; dead zone `if (dist < 4) return` |
| `frontend/src/scenes/runs/ExtractionScene.ts` (Boulder Dash) | Own bindPointer; dragVec = current - start; directional quantization | No deadzone config; threshold 16 hardcoded; does not use RunFrame.bindDrag |
| `frontend/src/scenes/runs/InfeccaoScene.ts` (Pac-Man) | Same delta-from-start pattern; quantizes to 4-dir | Threshold 14 hardcoded |
| `frontend/src/scenes/runs/LabirintoScene.ts` (Sokoban) | Same delta-from-start; one-shot step on pointerup too | Threshold 16 hardcoded |
| `frontend/src/scenes/runs/CordilheiraScene.ts` (Frogger) | Same delta-from-start; quantizes to 2-axis swipe | Threshold 18 hardcoded |
| `frontend/src/scenes/runs/TorresScene.ts` (Donkey Kong) | Absolute drag pos stored directly; custom climb detection via dy | No dead zone; raw absolute position |
| `frontend/src/scenes/runs/CircuitoScene.ts` (Snake) | Uses `bindDrag`; moves head toward drag.pos with speed cap | dist > 0.5 only; no smoothing |
| `frontend/src/scenes/runs/StealthScene.ts` (Agar.io) | Uses `bindDrag`; moves toward drag.pos | Same dist > 0.5 guard |

### Root Problems

1. **Duplicate pointer boilerplate**: eight scenes each write their own
   `addEventListener('pointerdown/pointermove/pointerup/pointercancel')` blocks.
   Any fix (e.g., adding `pointerleave` or `visibilitychange`) must be applied
   in 8+ places.

2. **Hardcoded thresholds everywhere**: JOY_DEAD, MOVE_THRESHOLD,
   quantization thresholds (14, 16, 18 px), and velocity smoothing constants
   exist only in source, invisible to a tuning designer.

3. **No `visibilitychange` / `blur` handling**: if the user tab-switches or
   the OS interrupts (phone call), the drag stays `active = true` in several
   scenes. On resume the character teleports or continues moving.

4. **No multitouch guard**: all scenes track the first pointer implicitly.
   A second finger (accidental palm, notification swipe) can stomp the active
   gesture and create erratic movement.

5. **Semantic coupling**: `bindDrag` in RunFrame returns an absolute world
   coordinate. `DragController` uses `movementX/Y` deltas. HordasScene builds
   a floating joystick. These three semantics serve different zones but share
   no abstraction, making it hard to add per-zone feel tweaks.

6. **`DRAG_DEAD_ZONE`** exists in `GameConfig` (value: 5) but `DragController`
   uses its own private `MOVE_THRESHOLD = 3` and does not read the config key.
   The config value is orphaned.

---

## 2. Proposed Architecture

### 2.1 Core Concept: Two-Layer Model

```
PointerSurface (raw browser events)
        │
        ▼
MovementInput (unified layer — one per scene)
        │ emits: InputFrame each update()
        ▼
ZoneInterpreter (per-zone semantic adapter — replaces per-scene input code)
        │ emits: movement deltas, directions, or targets
        ▼
Scene update logic (unchanged — still reads a Vec2)
```

`MovementInput` is NOT a singleton. Each scene constructs one, configures it
for its semantic mode, and destroys it on `exit()`. This preserves the
scene-per-mode architecture described in `docs/technical-architecture.md`.

### 2.2 Semantic Modes

Each zone needs one of four interpretations:

| Mode | Who uses it | What the zone reads |
|---|---|---|
| `ABSOLUTE` | StealthScene, CircuitoScene (Snake) | `input.worldPos` — scene-space cursor position |
| `JOYSTICK` | HordasScene | `input.joystickVec` (unit vec scaled 0..1 by travel) |
| `LERP_TARGET` | FieldControlScene, SacrificeScene, DragController (party runs) | `input.lerpTarget` — world-space point to lerp toward |
| `SWIPE_DIR` | ExtractionScene, InfeccaoScene, LabirintoScene, CordilheiraScene | `input.swipeDir` — {x, y} in {-1, 0, 1}² committed each gesture |

TorresScene needs LERP_TARGET for horizontal and a hybrid `dragPos.y` for
climbing — it can use LERP_TARGET mode and derive the climb intent from the
raw `worldPos` that MovementInput always exposes regardless of mode.

---

## 3. Files to Create

### 3.1 `frontend/src/input/MovementInput.ts` (NEW)

This is the only new file. Everything else is modifications.

```typescript
import type { App } from '../core/App';
import type { Vec2 } from '../core/types';
import { GameConfig } from '../state/GameConfig';

// ── Semantic modes ──────────────────────────────────────────────────────────

export type InputMode =
  | 'ABSOLUTE'    // worldPos tracks finger in scene coordinates
  | 'JOYSTICK'    // joystickVec: unit direction * [0..1] magnitude from origin
  | 'LERP_TARGET' // lerpTarget: scene-space point to approach with lerp
  | 'SWIPE_DIR';  // swipeDir: committed {x,y} in {-1,0,1}² per gesture

export interface MovementInputConfig {
  mode: InputMode;

  /** World container whose .x/.y/.scale.x is used for CSS→scene coordinate
   *  conversion. Matches the App.world container pattern. */
  worldContainer: { x: number; y: number; scale: { x: number } };

  /** Optional extra Y offset (TorresScene camera scroll). Default: 0. */
  worldOffsetY?: number;

  /** Pixels of no-motion before the dead zone is exited.
   *  JOYSTICK mode uses this as the inner ring radius.
   *  SWIPE_DIR uses this as the minimum swipe magnitude.
   *  Defaults to GameConfig.INPUT_DEADZONE_PX. */
  deadzonePx?: number;

  /** JOYSTICK only: pixels from dead-zone edge to full-speed.
   *  Defaults to GameConfig.INPUT_JOY_MAX_PX. */
  joystickMaxPx?: number;

  /** LERP_TARGET only: lerp rate per second. Equivalent to DRAG_LERP_FACTOR.
   *  Defaults to GameConfig.DRAG_LERP_FACTOR. */
  lerpFactor?: number;

  /** SWIPE_DIR only: if true, a swipe is committed on pointerup as well.
   *  Useful for Sokoban-style one-step-per-release mechanics. Default: false. */
  commitOnUp?: boolean;

  /** How many frames to remember input after pointer is lost.
   *  Prevents single-frame gaps when Android chrome fires pointercancel on
   *  scroll-intercept. Default: GameConfig.INPUT_BUFFER_FRAMES. */
  bufferFrames?: number;
}

// The output the scene reads each frame.
export interface InputFrame {
  /** True while a pointer is held (or within buffer window). */
  active: boolean;

  /** Raw scene-space cursor position. Available in ALL modes.
   *  Useful for TorresScene hybrid logic without extra coupling. */
  worldPos: Vec2;

  /** JOYSTICK: direction unit-vector * magnitude [0..1]. Zero when inactive. */
  joystickVec: Vec2;

  /** ABSOLUTE / LERP_TARGET: scene coordinate to move toward. */
  lerpTarget: Vec2;

  /** SWIPE_DIR: {-1|0|1} per axis, only non-zero on the frame a swipe
   *  is committed. Zero every other frame. Scenes must consume + clear. */
  swipeDir: Vec2;

  /** Velocity of the smoothed lerpTarget (world px/s). Used by DragController
   *  for siege-mode stillness detection without replicating the calc. */
  velocity: Vec2;
}

export class MovementInput {
  private readonly cfg: Required<MovementInputConfig>;
  private readonly canvas: HTMLCanvasElement;

  // Pointer state
  private activePointerId: number | null = null;
  private pointerDown = false;
  private currentPos: Vec2 = { x: 0, y: 0 };
  private gestureOrigin: Vec2 = { x: 0, y: 0 }; // joystick origin / swipe start

  // Buffer
  private bufferCountdown = 0;

  // Smoothed outputs
  private smoothedTarget: Vec2 = { x: 0, y: 0 };
  private prevSmoothed: Vec2 = { x: 0, y: 0 };
  private velocity: Vec2 = { x: 0, y: 0 };

  // Committed swipe (consumed by scene in one frame)
  private pendingSwipe: Vec2 = { x: 0, y: 0 };

  // Listener refs for cleanup
  private readonly onDown = (e: PointerEvent): void => this.handleDown(e);
  private readonly onMove = (e: PointerEvent): void => this.handleMove(e);
  private readonly onUp   = (e: PointerEvent): void => this.handleUp(e);
  private readonly onVis  = (): void => this.handleVisibility();

  constructor(app: App, config: MovementInputConfig) {
    this.cfg = {
      worldOffsetY: 0,
      deadzonePx: GameConfig.INPUT_DEADZONE_PX,
      joystickMaxPx: GameConfig.INPUT_JOY_MAX_PX,
      lerpFactor: GameConfig.DRAG_LERP_FACTOR,
      commitOnUp: false,
      bufferFrames: GameConfig.INPUT_BUFFER_FRAMES,
      ...config,
    };
    this.canvas = app.pixi.canvas;

    this.canvas.addEventListener('pointerdown',   this.onDown);
    this.canvas.addEventListener('pointermove',   this.onMove);
    this.canvas.addEventListener('pointerup',     this.onUp);
    this.canvas.addEventListener('pointercancel', this.onUp);
    this.canvas.addEventListener('pointerleave',  this.onUp);
    document.addEventListener('visibilitychange', this.onVis);
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown',   this.onDown);
    this.canvas.removeEventListener('pointermove',   this.onMove);
    this.canvas.removeEventListener('pointerup',     this.onUp);
    this.canvas.removeEventListener('pointercancel', this.onUp);
    this.canvas.removeEventListener('pointerleave',  this.onUp);
    document.removeEventListener('visibilitychange', this.onVis);
  }

  // ── Update called once per scene frame ─────────────────────────────────────

  update(dt: number, initialPos?: Vec2): InputFrame {
    // Buffer countdown: keep "active" true for N frames after pointer is lost
    // to hide single-frame Android scroll-intercept glitches.
    const wasDown = this.pointerDown;
    if (!wasDown && this.bufferCountdown > 0) {
      this.bufferCountdown -= 1;
    }
    const active = wasDown || this.bufferCountdown > 0;

    // If not active, lerp back toward current entity position so the target
    // does not drift when movement resumes.
    if (!active && initialPos) {
      this.smoothedTarget = { ...initialPos };
    }

    // Velocity from smoothed delta (used externally for stillness detection)
    this.prevSmoothed = { ...this.smoothedTarget };

    let lerpTarget = { ...this.smoothedTarget };
    let joystickVec: Vec2 = { x: 0, y: 0 };
    const swipeDir = { ...this.pendingSwipe };
    this.pendingSwipe = { x: 0, y: 0 }; // consumed

    if (active) {
      const t = Math.min(1, this.cfg.lerpFactor * dt);
      switch (this.cfg.mode) {
        case 'LERP_TARGET':
        case 'ABSOLUTE': {
          this.smoothedTarget.x += (this.currentPos.x - this.smoothedTarget.x) * t;
          this.smoothedTarget.y += (this.currentPos.y - this.smoothedTarget.y) * t;
          lerpTarget = { ...this.smoothedTarget };
          break;
        }
        case 'JOYSTICK': {
          const dx = this.currentPos.x - this.gestureOrigin.x;
          const dy = this.currentPos.y - this.gestureOrigin.y;
          const len = Math.hypot(dx, dy);
          if (len > this.cfg.deadzonePx) {
            const mag = Math.min(1, (len - this.cfg.deadzonePx) /
              (this.cfg.joystickMaxPx - this.cfg.deadzonePx));
            joystickVec = { x: (dx / len) * mag, y: (dy / len) * mag };
          }
          break;
        }
        case 'SWIPE_DIR':
          // swipeDir is already set by handleMove / handleUp; nothing to do here.
          break;
      }
    }

    // Velocity in world px/s (for siege-mode, channeling exposure, etc.)
    if (dt > 0) {
      this.velocity = {
        x: (this.smoothedTarget.x - this.prevSmoothed.x) / dt,
        y: (this.smoothedTarget.y - this.prevSmoothed.y) / dt,
      };
    }

    return {
      active,
      worldPos: { ...this.currentPos },
      joystickVec,
      lerpTarget,
      swipeDir,
      velocity: { ...this.velocity },
    };
  }

  // ── Private event handlers ──────────────────────────────────────────────────

  private toScene(e: PointerEvent): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    const wc = this.cfg.worldContainer;
    const scale = wc.scale.x || 1;
    return {
      x: (e.clientX - rect.left - wc.x) / scale,
      y: (e.clientY - rect.top  - wc.y) / scale + (this.cfg.worldOffsetY ?? 0),
    };
  }

  private handleDown(e: PointerEvent): void {
    // First-pointer-wins: ignore additional fingers.
    if (this.activePointerId !== null && this.activePointerId !== e.pointerId) return;
    this.activePointerId = e.pointerId;
    this.pointerDown = true;
    this.bufferCountdown = 0;

    const p = this.toScene(e);
    this.currentPos = { ...p };
    this.gestureOrigin = { ...p };

    if (this.cfg.mode === 'LERP_TARGET' || this.cfg.mode === 'ABSOLUTE') {
      this.smoothedTarget = { ...p };
    }
  }

  private handleMove(e: PointerEvent): void {
    if (!this.pointerDown || e.pointerId !== this.activePointerId) return;
    this.currentPos = this.toScene(e);

    if (this.cfg.mode === 'SWIPE_DIR') {
      const dx = this.currentPos.x - this.gestureOrigin.x;
      const dy = this.currentPos.y - this.gestureOrigin.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= this.cfg.deadzonePx) {
        this.pendingSwipe = this.quantize(dx, dy);
        this.gestureOrigin = { ...this.currentPos }; // reset for continuous swipes
      }
    }
  }

  private handleUp(e: PointerEvent): void {
    if (e.pointerId !== this.activePointerId) return;
    this.pointerDown = false;
    this.activePointerId = null;
    this.bufferCountdown = this.cfg.bufferFrames;

    if (this.cfg.mode === 'SWIPE_DIR' && this.cfg.commitOnUp) {
      const dx = this.currentPos.x - this.gestureOrigin.x;
      const dy = this.currentPos.y - this.gestureOrigin.y;
      if (Math.hypot(dx, dy) >= this.cfg.deadzonePx) {
        this.pendingSwipe = this.quantize(dx, dy);
      }
    }
  }

  private handleVisibility(): void {
    // Page hidden (tab switch, OS interrupt): hard-cancel the gesture.
    if (document.hidden) {
      this.pointerDown = false;
      this.activePointerId = null;
      this.bufferCountdown = 0;
      this.pendingSwipe = { x: 0, y: 0 };
    }
  }

  private quantize(dx: number, dy: number): Vec2 {
    if (Math.abs(dx) >= Math.abs(dy)) return { x: dx > 0 ? 1 : -1, y: 0 };
    return { x: 0, y: dy > 0 ? 1 : -1 };
  }
}
```

---

## 4. Files to Modify

### 4.1 `frontend/src/state/GameConfig.ts`

Add the following keys in the `// ── Party ──` block, immediately after `DRAG_LERP_FACTOR`:

```typescript
// ── Movement Input (shared across all zones) ────────────────────────────────
INPUT_DEADZONE_PX: 10,
INPUT_JOY_MAX_PX: 64,
INPUT_BUFFER_FRAMES: 3,
INPUT_SWIPE_THRESHOLD_PX: 14,   // alias for deadzonePx in SWIPE_DIR mode
INPUT_LERP_DEADZONE_PX: 4,      // minimum dist to move toward lerpTarget

// Fix: replace the orphaned DRAG_DEAD_ZONE: 5 with the canonical key above.
// DRAG_DEAD_ZONE is removed (was never read anywhere; search confirmed zero usages).
```

Remove the orphaned entry:
```typescript
// DELETE THIS LINE:
DRAG_DEAD_ZONE: 5,
```

Rationale: `DRAG_DEAD_ZONE: 5` exists in GameConfig but is read by zero
callsites — confirmed by grep. `DragController` uses its own private
`MOVE_THRESHOLD = 3`. The new `INPUT_DEADZONE_PX` replaces both.

Also promote the HordasScene constants that are currently hardcoded:
```typescript
INPUT_JOY_DEAD_PX: 8,       // replaces HordasScene's JOY_DEAD = 8
INPUT_JOY_MAX_PX: 64,       // replaces HordasScene's JOY_MAX = 64
HORDAS_MOVE_ACCEL: 13,      // replaces HordasScene's MOVE_ACCEL = 13
```

### 4.2 `frontend/src/run/DragController.ts`

Replace the entire private `MOVE_THRESHOLD` constant and the raw pointer
boilerplate with `MovementInput`. The public API (`update(dt)`, `destroy()`)
stays unchanged so `Party` and run scenes are unaffected.

Key changes:
- Remove all `addEventListener` calls; construct `MovementInput` in LERP_TARGET mode.
- Remove the private `MOVE_THRESHOLD = 3` hardcode; read from `GameConfig.INPUT_DEADZONE_PX`.
- Replace the lerp calculation with `frame.lerpTarget` from `MovementInput.update()`.
- Replace stillness detection: use `Math.hypot(frame.velocity.x, frame.velocity.y)` instead of manually diffing last/current positions — the velocity is now pre-computed by MovementInput.
- Fix the `pointerleave` bug: previously `onUp` was called on `pointerleave`, correctly clearing `dragActive`, but `moveTarget` was never snapped to `party.anchor` before the lerp on the next frame. With MovementInput this is handled by the `initialPos` param in `update()`.

Constructor signature stays `(app: App, party: Party)`.

### 4.3 `frontend/src/scenes/runs/RunFrame.ts`

- **Remove** the `bindDrag` function and the `DragInput` interface entirely.
  All callers will be migrated to `MovementInput`.
- The `buildHud` and `buildEndOverlay` functions are untouched.

### 4.4 `frontend/src/scenes/runs/HordasScene.ts`

- Remove `drag!: DragInput` field; add `input!: MovementInput`.
- Replace the `bindDrag` call in `enter()` with:
  ```typescript
  this.input = new MovementInput(this.app, {
    mode: 'JOYSTICK',
    worldContainer: this.app.world,
  });
  ```
- Replace `this.drag.cleanup()` in `exit()` with `this.input.destroy()`.
- In `movePlayer(dt)`: replace the manual joystick math (the block using
  `JOY_DEAD`, `JOY_MAX`, `MOVE_ACCEL`) with `this.input.update(dt).joystickVec`.
  The velocity smoothing (`vel.x += (tvx - vel.x) * k`) remains in the scene
  because it is a gameplay property (the inertia gives the forest-run its
  distinct feel), NOT an input property. `MOVE_ACCEL` moves to `GameConfig.HORDAS_MOVE_ACCEL`.
- Remove the `prevDrag` / `joyOrigin` fields (handled internally by MovementInput).

### 4.5 `frontend/src/scenes/runs/FieldControlScene.ts`

- Remove the three private handler arrow functions (`onDown`, `onMove`, `onUp`).
- Remove `bindPointer` / `unbindPointer` methods.
- Add `private input!: MovementInput` field.
- `enter()`: `this.input = new MovementInput(this.app, { mode: 'LERP_TARGET', worldContainer: this.app.world });`
- `exit()`: `this.input.destroy();`
- `movePlayer(dt)`: change to read `this.input.update(dt, this.playerPos).lerpTarget`
  then use the existing speed*dt steering. Remove the `if (!this.dragging) return` guard;
  replace with `if (!frame.active) return`.
- `PLAYER_SPEED = 200` moves to `GameConfig.FIELD_PLAYER_SPEED: 200` in the
  Field Control Zone block.

### 4.6 `frontend/src/scenes/runs/SacrificeScene.ts`

Identical pattern to FieldControlScene:
- Remove `onDown`, `onMove`, `onUp`, `bindPointer`, `unbindPointer`.
- Add `MovementInput` in LERP_TARGET mode.
- `PLAYER_SPEED = 200` moves to `GameConfig.SACRIFICE_PLAYER_SPEED: 200`.

### 4.7 `frontend/src/scenes/runs/StealthScene.ts`

- Remove `drag!: DragInput`.
- Add `input!: MovementInput` in ABSOLUTE mode.
- The scene moves the player toward `drag.pos` at variable speed. Change
  `drag.pos` to `frame.lerpTarget` (lerpTarget in ABSOLUTE mode equals
  the smoothed worldPos, which is exactly the cursor-following behavior).
- The "player follows finger" feel is preserved because ABSOLUTE mode lerps
  the cursor position the same way the old `bindDrag` resolve did.
- `drag.dragging` check becomes `frame.active`.

### 4.8 `frontend/src/scenes/runs/CircuitoScene.ts`

Same as StealthScene:
- Remove `drag!: DragInput`; add `input!: MovementInput` in ABSOLUTE mode.
- `drag.pos` → `frame.lerpTarget`; `drag.dragging` → `frame.active`.
- The `dist > 0.5` guard is preserved in the scene; it is semantic, not input.

### 4.9 `frontend/src/scenes/runs/ExtractionScene.ts`

- Remove private `bindPointer` method and `cleanup` field.
- Add `private input!: MovementInput` in SWIPE_DIR mode with `deadzonePx: GameConfig.INPUT_SWIPE_THRESHOLD_PX`.
- `enter()`: `this.input = new MovementInput(this.app, { mode: 'SWIPE_DIR', worldContainer: this.app.world, deadzonePx: GameConfig.INPUT_SWIPE_THRESHOLD_PX });`
- `exit()`: `this.input.destroy();`
- `update(dt)`: replace the `if (this.moveCooldown <= 0 && this.dragging)` block:
  ```typescript
  const frame = this.input.update(d);
  if (this.moveCooldown <= 0 && (frame.swipeDir.x !== 0 || frame.swipeDir.y !== 0)) {
    this.stepPlayer(frame.swipeDir.x, frame.swipeDir.y);
    this.moveCooldown = STEP_TIME;
  }
  ```
- Remove `dragVec`, `dragging`, `pointerStart` fields.

### 4.10 `frontend/src/scenes/runs/InfeccaoScene.ts`

Same as ExtractionScene:
- SWIPE_DIR mode; threshold from `GameConfig.INPUT_SWIPE_THRESHOLD_PX`.
- Replace `this.nextDir` assignment from inside handleMove with reading
  `frame.swipeDir` in `tickPlayer`.
- Remove private `bindPointer`, `cleanup`, `dragging`, `pointerStart` fields.

### 4.11 `frontend/src/scenes/runs/LabirintoScene.ts`

- SWIPE_DIR mode with `commitOnUp: true` (preserves the one-step-on-release
  behavior currently in the manual `onUp` handler).
- Remove `bindPointer`, `cleanup`, `dragging`, `dragVec`, `pointerStart`.

### 4.12 `frontend/src/scenes/runs/CordilheiraScene.ts`

- SWIPE_DIR mode.
- The swipe threshold for Frogger can be slightly higher for comfort:
  `deadzonePx: GameConfig.INPUT_SWIPE_THRESHOLD_PX` (18 currently — set
  `INPUT_SWIPE_THRESHOLD_PX: 16` as a middle ground, or add a separate
  `INPUT_SWIPE_THRESHOLD_FROGGER_PX: 18` if the designer wants zone tuning).
- Premise: use the shared default. If playtesting shows Frogger needs a
  higher threshold it is a one-line GameConfig change.

### 4.13 `frontend/src/scenes/runs/TorresScene.ts`

- LERP_TARGET mode (`worldContainer` must include the cameraY offset via
  `worldOffsetY: this.cameraY`).
- **Complication**: `cameraY` changes every frame. `MovementInput.update()`
  accepts no dynamic offset parameter. Resolution: the `worldOffsetY` config
  is applied at coordinate conversion time (inside `toScene`). Since TorresScene
  updates `cameraY` before calling `input.update()`, the scene must
  **reconstruct** the MovementInput on camera change OR pass the offset via
  a mutable property.

  **Decision (premise)**: add a `setWorldOffsetY(y: number)` method to
  `MovementInput` that updates an internal field. TorresScene calls
  `this.input.setWorldOffsetY(this.cameraY)` at the top of its `update()`.
  This avoids reconstruction cost on every frame.

- Climbing intent: the scene reads `frame.worldPos.y` directly (always
  available regardless of mode) and compares to `this.worldPlayerY()` to
  detect upward drag, same logic as today but without reimplementing the
  coordinate conversion.

---

## 5. GameConfig Values to Add/Change

All new keys proposed for `frontend/src/state/GameConfig.ts`:

```typescript
// ── Movement Input ──────────────────────────────────────────────────────────
INPUT_DEADZONE_PX: 10,         // dead zone for all modes (was 5/3/8 scattered)
INPUT_JOY_DEAD_PX: 8,          // joystick inner ring (was JOY_DEAD in HordasScene)
INPUT_JOY_MAX_PX: 64,          // joystick full-speed radius (was JOY_MAX)
INPUT_BUFFER_FRAMES: 3,        // frames to hold active state after pointer lost
INPUT_SWIPE_THRESHOLD_PX: 16,  // minimum swipe distance to commit direction

// ── Field Control Zone (previously hardcoded) ──────────────────────────────
FIELD_PLAYER_SPEED: 200,       // was PLAYER_SPEED = 200 in FieldControlScene

// ── Sacrifice Zone (previously hardcoded) ─────────────────────────────────
SACRIFICE_PLAYER_SPEED: 200,   // was PLAYER_SPEED = 200 in SacrificeScene

// ── Hordas Zone (previously hardcoded) ────────────────────────────────────
HORDAS_MOVE_ACCEL: 13,         // velocity smoothing rate (was MOVE_ACCEL)
```

Keys to REMOVE from GameConfig:
```typescript
DRAG_DEAD_ZONE: 5,  // orphaned — zero callsites confirmed
```

---

## 6. TypeScript Interface Summary

### `MovementInput` (new, `frontend/src/input/MovementInput.ts`)

```typescript
constructor(app: App, config: MovementInputConfig)
update(dt: number, initialPos?: Vec2): InputFrame
setWorldOffsetY(y: number): void          // for TorresScene camera follow
destroy(): void
```

### `InputFrame` (exported from same file)

```typescript
interface InputFrame {
  active: boolean;
  worldPos: Vec2;       // raw scene cursor, always valid
  joystickVec: Vec2;    // JOYSTICK mode: direction*magnitude [0..1]
  lerpTarget: Vec2;     // LERP_TARGET / ABSOLUTE: smoothed cursor
  swipeDir: Vec2;       // SWIPE_DIR: {-1|0|1}² committed once per swipe
  velocity: Vec2;       // world px/s of lerpTarget; for stillness detection
}
```

### Updated `DragController` (no API change)

```typescript
constructor(app: App, party: Party)    // unchanged
update(dt: number): void               // unchanged — reads InputFrame internally
destroy(): void                        // unchanged
```

### Removed from `RunFrame.ts`

```typescript
// DELETED:
export interface DragInput { ... }
export function bindDrag(...): DragInput { ... }
```

---

## 7. Edge Cases and Decisions

### Multitouch

`MovementInput` uses first-pointer-wins: `activePointerId` is set on the
first `pointerdown` and all subsequent `pointermove`/`pointerup` events for
different pointer IDs are ignored until the active pointer is released.
This prevents a second finger (palm, notification swipe) from hijacking
movement.

Rationale: the game design explicitly states movement is the ONLY input. There
is no valid second-finger gesture in any zone. Discarding extra pointers is
therefore correct behavior, not a limitation.

### Pointer Lost (`pointerleave`, `pointercancel`, tab switch)

Three loss paths, all handled:

1. `pointercancel` / `pointerleave`: fires `handleUp` → `pointerDown = false`,
   `bufferCountdown = INPUT_BUFFER_FRAMES`. The scene keeps `active = true`
   for N frames (default 3 ≈ 50ms at 60fps), covering Android scroll-intercept
   false cancels.

2. `visibilitychange` (document hidden): hard reset. `pointerDown = false`,
   `bufferCountdown = 0`, `pendingSwipe` cleared. No buffer: the user
   actually left the page.

3. `pointerleave` on the canvas specifically: treated identically to
   `pointerup`. The pointer left the drawable area; character stops.

**Bug fixed from current code**: `DragController` calls `onUp` on
`pointerleave` (line 33), which sets `dragActive = false`, but on the next
`update()` call where `dragActive` is false, `moveTarget` is snapped to
`party.anchor` (line 73). This creates a one-frame snap. With MovementInput,
`initialPos` is passed every frame, so when `active` goes false the
`smoothedTarget` gracefully converges to the party's current position rather
than snapping.

### Frame Drop / Long Delta

Every existing scene already clamps `dt` to `1/30` (33ms cap). `MovementInput`
does NOT cap `dt` internally because:
- The lerp factor `t = min(1, factor * dt)` is naturally clamped to 1.0.
- Swipe direction is state-based (not delta-based), so frame drops do not
  cause missed or doubled inputs.
- Joystick velocity is read per-frame regardless of dt.

Scenes remain responsible for their own `dt` cap, as today.

### `DragController` and Siege Mode

`DragController.update()` currently computes stillness by diffing `lastX/Y`
against `party.anchor.x/y`. After refactor, it reads `frame.velocity` from
MovementInput, which is the world-space velocity of `lerpTarget` in px/s.

Comparison: `frame.velocity` magnitude against
`GameConfig.INPUT_DEADZONE_PX * 60` (converting the per-frame threshold to
px/s). This is more accurate than the current `moved < MOVE_THRESHOLD * dt * 60`
because it is based on the smoothed target velocity rather than the raw
anchor position, avoiding false "still" triggers when the lerp is converging.

### `DRAG_DEAD_ZONE: 5` Orphan

`grep` confirms zero callsites in `frontend/src/`. The key exists in
GameConfig but `DragController` uses its own private constant. It is safe to
remove and replace with `INPUT_DEADZONE_PX`.

### `pointerleave` vs Window Blur

`window.blur` is NOT listened to because in a fullscreen PWA it fires on
every system UI overlay (battery notification, etc.) and causes undesirable
interruptions. `visibilitychange` with `document.hidden` is the correct signal
for "user has actually left" and only fires when the tab/app goes background.

---

## 8. What MovementInput Does NOT Own

To keep the layer thin and testable, the following remain in each scene:

- **Clamp to arena bounds**: scenes know their bounds, MovementInput does not.
- **Game state guard** (`if (!isPlaying()) return`): `DragController` logic; not input.
- **Velocity smoothing for movement feel** (HordasScene MOVE_ACCEL inertia): gameplay math.
- **Grid quantization timing** (moveCooldown, STEP_TIME): puzzle-zone pacing.
- **Climbing detection** (TorresScene): derives from `frame.worldPos.y`, scene-owned.

---

## 9. Test Cases

When Vitest is wired in (see docs/technical-architecture.md Known Gaps):

```typescript
describe('MovementInput', () => {
  it('ignores second pointer ID while first is active');
  it('active stays true for INPUT_BUFFER_FRAMES after pointercancel');
  it('hard-resets on visibilitychange with document.hidden = true');
  it('joystickVec is zero inside deadzone');
  it('joystickVec magnitude reaches 1.0 at joystickMaxPx');
  it('swipeDir is zero between swipes and non-zero exactly one frame after commit');
  it('commitOnUp emits swipeDir on pointerup if distance >= deadzone');
  it('setWorldOffsetY changes coordinate conversion on next update');
  it('velocity is zero when active=false');
  it('lerpTarget converges toward initialPos when not active');
});
```

---

## 10. Rollout Order

This order minimizes the time any scene is in a broken state:

1. Add GameConfig keys (no side effects).
2. Create `frontend/src/input/MovementInput.ts` (new file, no existing code
   touched).
3. Refactor `DragController.ts` (lowest risk — API unchanged, only the
   main run mode uses it).
4. Refactor `FieldControlScene` and `SacrificeScene` (LERP_TARGET, simplest
   migration of the per-scene group).
5. Refactor `StealthScene` and `CircuitoScene` (ABSOLUTE / replace bindDrag).
6. Remove `bindDrag` from `RunFrame.ts` (safe after step 5).
7. Refactor `HordasScene` (JOYSTICK — most complex, own velocity accumulator
   must stay in scene).
8. Refactor `ExtractionScene`, `InfeccaoScene`, `LabirintoScene`,
   `CordilheiraScene` (SWIPE_DIR group, all similar).
9. Refactor `TorresScene` (LERP_TARGET + setWorldOffsetY).
10. Manual playtest on mobile PWA for each zone before committing the group.

---

## 11. Assumptions / Premisses Documentadas

(Non-interactive subagent premises — flag to game-designer or lead-programmer
if any of these are wrong.)

1. **`INPUT_DEADZONE_PX: 10`** is the harmonized default. The existing values
   were: DragController=3, FieldControl=4, Sacrifice=4, Frogger=18,
   Sokoban=16, PacMan=14, BoulderDash=16, Joystick=8. A value of 10 sits
   between the "free movement" scenes (4–8) and the "swipe" scenes (14–18).
   The SWIPE_DIR scenes get `INPUT_SWIPE_THRESHOLD_PX: 16` as their own key
   so they can be tuned independently.

2. **`INPUT_BUFFER_FRAMES: 3`** (≈50ms at 60fps) is chosen to cover Android's
   scroll-intercept `pointercancel` delay without creating noticeable lag.

3. **Floating joystick origin** (HordasScene) resets on each new
   `pointerdown`, identical to current behavior. This is correct for a
   Vampire-Survivors feel where the thumb rests wherever it lands.

4. **`commitOnUp: true`** for LabirintoScene (Sokoban). The current code has
   an explicit "commit one final step on release" block in `onUp`. This
   preserves that deliberate design decision.

5. **TorresScene `worldOffsetY`** is the only scene that requires a dynamic
   per-frame offset because its camera scrolls. All other scenes either have
   a static coordinate system or use a Pixi camera offset that is already
   baked into `app.world.y`.

6. **No haptic feedback** is added here. That is a separate concern for the
   ui-programmer or a future spec.

7. **`DRAG_DEAD_ZONE: 5` removal** is safe — zero callsites confirmed by grep
   before writing this spec.
