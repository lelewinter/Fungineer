# impl-spec-collect-feel.md

**Task refs:** 010 / #020 — "Feel Pass: collect feedback + win/loss juice"
**Date:** 2026-06-05
**Status:** READY TO IMPLEMENT

---

## 1. Context & Existing Modules

### What already exists

| Module | Path | Relevant surface |
|---|---|---|
| `ResourceItem` | `frontend/src/run/ResourceItem.ts` | Emits `collected` Signal, already calls `audioManager.playSfx('…/Complete_01.wav', 0.45)` and `juice.shake(0.08, 18)` on collect |
| `juice` (global) | `frontend/src/run/fx/Juice.ts` | `shake(amount, vibrateMs)`, `bind(camera)`, `update(dt)` — camera-pivot based, no particles |
| `Juice` (core) | `frontend/src/core/Juice.ts` | `addTrauma`, `shake`, `vibrate` — singleton without camera binding, no particles |
| `RunJuice` | `frontend/src/run/fx/RunJuice.ts` | Per-scene kit: `pop(x,y,color?)`, `hurt()`, `jump()`, `alarm()`, `victoryFx()`, `defeatFx()` — already does burst+flash+shake+sfx combos |
| `FXSystem` | `frontend/src/run/fx/FXSystem.ts` | Generic particle pool: `burst(x,y,BurstOpts)`, `update(dt)`, `destroy()` |
| `ScreenFX` | `frontend/src/run/fx/ScreenFX.ts` | `flash(color,alpha,life)`, `edges(color,amount)`, `shockwave(color,life)` |
| `DamageNumbers` | `frontend/src/run/fx/DamageNumbers.ts` | `spawnDamageNumber(world, pos, value, color)` — floating text pool, ~0.7s ttl |
| `audioManager` | `frontend/src/core/AudioManager.ts` | `playSfx(res:// path, volume)` — falls back to `SfxSynth` if file missing |
| `GameConfig` | `frontend/src/state/GameConfig.ts` | Single source of truth for all numeric constants; `as const` object |

### Key gap identified

`ResourceItem.update()` (line 75-76) already fires a shake and SFX on collect but has **no particle burst, no floating "+1" number, and no zone-accent colour**. The SFX path (`Complete_01.wav`) is hardcoded. `RunJuice.pop()` already assembles burst+flash+shake+sfx into one call but is not wired to `ResourceItem.collected`.

`RunJuice.victoryFx()` and `defeatFx()` already exist but zones that do not instantiate `RunJuice` (e.g. zones using the global `juice` singleton instead) have no shake/flash on win/loss.

---

## 2. Design Goals (task 010/#020)

1. **Collect feedback** — spore particle burst + floating "+1" text + SFX every time a `ResourceItem` is collected.
2. **Victory/defeat feel** — screen shake + flash (green tint for win, red for loss).
3. **Shared, not per-zone** — one implementation path used by every zone that has `ResourceItem`. No copy-paste per scene.
4. **Data-driven** — all intensities in `GameConfig`; designers tune without touching code.

---

## 3. Architecture Decision

### 3.1 Collect FX: extend `RunJuice.pop()` into a dedicated `collectFx()`

`RunJuice` is already the per-scene game-feel kit shared by the run zones. The right home for collect feel is a new method `RunJuice.collectFx(x, y)` that is a superset of the existing `pop()` — it adds the floating "+1" number on top.

The floating number reuses `spawnDamageNumber` from `DamageNumbers.ts` with a fixed `value=1` and a distinct gold colour (`COLLECT_NUMBER_COLOR`). This avoids creating a new pool.

`ResourceItem` itself must not know about `RunJuice` (it is a data-layer entity). The zone scene subscribes to `item.collected` and calls `juice.collectFx(item.position.x, item.position.y)`. The existing inline `audioManager.playSfx` and `juice.shake` calls inside `ResourceItem.update()` are removed — the zone's `RunJuice` call takes over entirely.

### 3.2 Victory/defeat: add `victoryFx()` / `defeatFx()` call-sites in every zone

`RunJuice.victoryFx()` and `defeatFx()` already exist with the right behaviour. Zones that do not yet call them must be updated to do so. No new logic is needed — only wiring.

### 3.3 Victory/defeat for zones without `RunJuice`

Zones that use the global `juice` singleton (from `fx/Juice.ts`) instead of `RunJuice` fall back to a thin wrapper: a new static helper `collectFeel.victoryFx()` / `collectFeel.defeatFx()` in a new file `frontend/src/run/fx/CollectFeel.ts`. It calls the global `juice.shake(...)` and `audioManager.playSfx(...)`. If a zone already has `RunJuice`, it calls `runJuice.victoryFx()` directly — the helper is only for zones that do not.

---

## 4. Files to Create

### 4.1 `frontend/src/run/fx/CollectFeel.ts` (NEW)

Thin module of shared statics used by zones that do NOT have a `RunJuice` instance. Zones with `RunJuice` call `runJuice.collectFx()` directly.

```ts
// Implements: task 010/#020 — feel pass, collect + win/loss
import { audioManager } from '../../core/AudioManager';
import { Juice } from './Juice'; // global per-scene juice (fx/Juice.ts), not core/Juice.ts
import { GameConfig } from '../../state/GameConfig';

export const CollectFeel = {
  /** Shake + SFX for zones that have no RunJuice (minimal fallback). */
  victoryFx(): void {
    Juice.shake(
      GameConfig.COLLECT_FEEL_VICTORY_TRAUMA,
      GameConfig.COLLECT_FEEL_VICTORY_VIBRATE_MS,
    );
    audioManager.playSfx(
      'res://assets/audio/sfx/ui/Complete_01.wav',
      GameConfig.COLLECT_FEEL_VICTORY_SFX_VOLUME,
    );
  },

  defeatFx(): void {
    Juice.shake(
      GameConfig.COLLECT_FEEL_DEFEAT_TRAUMA,
      GameConfig.COLLECT_FEEL_DEFEAT_VIBRATE_MS,
    );
    audioManager.playSfx(
      'res://assets/audio/sfx/game/hit_02.wav',
      GameConfig.COLLECT_FEEL_DEFEAT_SFX_VOLUME,
    );
  },
} as const;
```

---

## 5. Files to Alter

### 5.1 `frontend/src/state/GameConfig.ts`

Add a new `// ── Collect Feel FX ──` block before `// ── Debug ──`:

```ts
// ── Collect Feel FX ─────────────────────────────────────────────────────────
// Particle burst at collect point.
COLLECT_FEEL_BURST_COUNT: 12,
COLLECT_FEEL_BURST_SPEED: 160,
COLLECT_FEEL_BURST_LIFE: 0.48,
COLLECT_FEEL_BURST_SIZE: 2.4,
// Spore colour used when no zone accent is available (gold, matches resource).
COLLECT_FEEL_BURST_COLOR: 0xffd070,
// Floating "+1" text colour (brighter gold, distinct from damage numbers).
COLLECT_FEEL_NUMBER_COLOR: 0xffe455,
// Screen shake trauma added on collect (small — frequent event, must not fatigue).
COLLECT_FEEL_SHAKE_TRAUMA: 0.07,
COLLECT_FEEL_SHAKE_VIBRATE_MS: 10,
// SFX volume for the pickup sound.
COLLECT_FEEL_SFX_VOLUME: 0.45,
// Victory juice (RunJuice.victoryFx already has values; these are for fallback).
COLLECT_FEEL_VICTORY_TRAUMA: 0.30,
COLLECT_FEEL_VICTORY_VIBRATE_MS: 50,
COLLECT_FEEL_VICTORY_SFX_VOLUME: 0.80,
// Defeat juice (same — fallback only).
COLLECT_FEEL_DEFEAT_TRAUMA: 0.55,
COLLECT_FEEL_DEFEAT_VIBRATE_MS: 120,
COLLECT_FEEL_DEFEAT_SFX_VOLUME: 0.80,
```

**Design rationale for `COLLECT_FEEL_SHAKE_TRAUMA: 0.07`:** collection is the most frequent reward event (~4 items per run). The existing inline `juice.shake(0.08, 18)` (ResourceItem line 76) is the right baseline; we set the config value to `0.07` to allow a slight reduction now that burst + number already reinforce the moment. Designers can raise it if it feels flat.

### 5.2 `frontend/src/run/fx/RunJuice.ts`

Add one import and one public method. No existing method is changed.

**New import at the top** (add alongside existing DamageNumbers import):

```ts
import { spawnDamageNumber } from './DamageNumbers';
import type { RunWorld } from '../RunWorld';
```

**New field** (after `private reduced = false;`):

```ts
private world: RunWorld | null = null;
```

**New method on `RunJuice` constructor** — add optional `world` parameter:

```ts
// Constructor signature change:
constructor(root: Container, opts: RunJuiceOpts, world?: RunWorld) {
  // ... existing body unchanged ...
  this.world = world ?? null;
}
```

**New public method** (add after `pop()`):

```ts
/**
 * Collect feedback: spore burst + floating "+1" + shake + SFX.
 * Implements task 010/#020 — "feel pass".
 *
 * @param x  World-space X of the collected item.
 * @param y  World-space Y of the collected item.
 * @param accentColor  Zone accent override; defaults to zone accent.
 */
collectFx(x: number, y: number, accentColor?: number): void {
  const color = accentColor ?? this.accent;
  this.burst(x, y, {
    count: GameConfig.COLLECT_FEEL_BURST_COUNT,
    color,
    speed: GameConfig.COLLECT_FEEL_BURST_SPEED,
    life: GameConfig.COLLECT_FEEL_BURST_LIFE,
    size: GameConfig.COLLECT_FEEL_BURST_SIZE,
  });
  this.flash(color, 0.09, 0.13);
  this.shake(
    GameConfig.COLLECT_FEEL_SHAKE_TRAUMA,
    GameConfig.COLLECT_FEEL_SHAKE_VIBRATE_MS,
  );
  if (this.world) {
    spawnDamageNumber(
      this.world,
      { x, y },
      1,
      GameConfig.COLLECT_FEEL_NUMBER_COLOR,
    );
  }
  audioManager.playSfx(
    'res://assets/audio/sfx/ui/Complete_01.wav',
    GameConfig.COLLECT_FEEL_SFX_VOLUME,
  );
}
```

**Why pass `RunWorld`?** `spawnDamageNumber` requires `world.fxLayer` (a PixiJS Container) to parent the text node. The world is available at zone construction time.

### 5.3 `frontend/src/run/ResourceItem.ts`

Remove the two inline feedback calls that `collectFx` now replaces:

```ts
// REMOVE these two lines (currently lines 75-76):
audioManager.playSfx('res://assets/audio/sfx/ui/Complete_01.wav', 0.45);
juice.shake(0.08, 18);
```

Also remove the unused imports `audioManager` and `juice` if no other callsite in the file references them after this removal.

The `collected` Signal already fires with the resource type — zones listen and call `runJuice.collectFx(item.position.x, item.position.y)`.

### 5.4 Zone scenes (caller side — existing files, minimal edits)

Every zone that owns `ResourceItem` instances must wire the signal. The pattern is identical in each zone:

```ts
// In the zone scene, wherever ResourceItem is constructed:
const item = new ResourceItem(party, type);
item.collected.on((_type) => {
  this.juice.collectFx(item.position.x, item.position.y);
});
world.items.push(item);
world.itemsLayer.addChild(item.node);
```

Zones must also call `victoryFx` / `defeatFx` at the appropriate state transition. Zones with `RunJuice` call `this.juice.victoryFx()` / `this.juice.defeatFx()` directly. Zones using only the global `Juice` singleton import `CollectFeel` and call `CollectFeel.victoryFx()` / `CollectFeel.defeatFx()`.

To find which zone scenes need these edits, grep for `ResourceItem` constructor calls:

```
grep -r "new ResourceItem" frontend/src/
```

And for victory/defeat state transitions:

```
grep -r "RunState.VICTORY\|RunState.DEFEAT\|victoryFx\|defeatFx" frontend/src/run/
```

---

## 6. TypeScript Signatures Summary

```ts
// frontend/src/run/fx/RunJuice.ts  (altered)
class RunJuice {
  constructor(root: Container, opts: RunJuiceOpts, world?: RunWorld);
  collectFx(x: number, y: number, accentColor?: number): void;
  // (existing methods unchanged)
  victoryFx(): void;
  defeatFx(): void;
}

// frontend/src/run/fx/CollectFeel.ts  (new)
const CollectFeel: {
  victoryFx(): void;
  defeatFx(): void;
};
```

---

## 7. Intensity Reference Table

All values live in `GameConfig`. Designer tuning guide:

| Key | Default | Effect |
|---|---|---|
| `COLLECT_FEEL_BURST_COUNT` | 12 | Number of spore particles per collect |
| `COLLECT_FEEL_BURST_SPEED` | 160 | Particle launch speed (px/s) |
| `COLLECT_FEEL_BURST_LIFE` | 0.48 | Particle lifetime (s) |
| `COLLECT_FEEL_BURST_SIZE` | 2.4 | Particle radius (px) |
| `COLLECT_FEEL_BURST_COLOR` | 0xffd070 | Fallback burst colour (gold) |
| `COLLECT_FEEL_NUMBER_COLOR` | 0xffe455 | "+1" text colour (bright gold) |
| `COLLECT_FEEL_SHAKE_TRAUMA` | 0.07 | Trauma added on collect (0..1) |
| `COLLECT_FEEL_SHAKE_VIBRATE_MS` | 10 | Haptic pulse on collect (ms) |
| `COLLECT_FEEL_SFX_VOLUME` | 0.45 | Pickup SFX volume |
| `COLLECT_FEEL_VICTORY_TRAUMA` | 0.30 | Trauma for fallback victory shake |
| `COLLECT_FEEL_VICTORY_VIBRATE_MS` | 50 | Haptic for fallback victory |
| `COLLECT_FEEL_VICTORY_SFX_VOLUME` | 0.80 | Victory SFX volume |
| `COLLECT_FEEL_DEFEAT_TRAUMA` | 0.55 | Trauma for fallback defeat shake |
| `COLLECT_FEEL_DEFEAT_VIBRATE_MS` | 120 | Haptic for fallback defeat |
| `COLLECT_FEEL_DEFEAT_SFX_VOLUME` | 0.80 | Defeat SFX volume |

The zone accent colour (passed as `RunJuice`'s `opts.accent`) overrides `COLLECT_FEEL_BURST_COLOR` automatically — spores match the zone's visual identity.

---

## 8. Dependency & Change Map

```
GameConfig.ts
  └── new COLLECT_FEEL_* keys (14 values)

frontend/src/run/fx/CollectFeel.ts   [NEW]
  ├── imports: fx/Juice.ts (global juice), core/AudioManager.ts, state/GameConfig.ts
  └── exports: CollectFeel (victoryFx, defeatFx)

frontend/src/run/fx/RunJuice.ts      [ALTERED]
  ├── new import: ./DamageNumbers (spawnDamageNumber), ../RunWorld
  ├── new field: world: RunWorld | null
  ├── constructor: adds optional world param
  └── new method: collectFx(x, y, accentColor?)

frontend/src/run/ResourceItem.ts     [ALTERED]
  ├── remove: audioManager.playSfx(...) inline call
  ├── remove: juice.shake(...) inline call
  └── remove: now-unused imports (audioManager, juice) if applicable

Zone scenes (caller)                 [ALTERED — wiring only]
  ├── item.collected.on → runJuice.collectFx(x, y)
  └── state transition → runJuice.victoryFx() / defeatFx()
      OR CollectFeel.victoryFx() / defeatFx() for juice-only zones
```

---

## 9. What Is NOT Changed

- `FXSystem.ts` — `burst()` already supports all required `BurstOpts`; no new particle shapes needed.
- `ScreenFX.ts` — existing `flash()` is sufficient for collect highlight.
- `DamageNumbers.ts` — `spawnDamageNumber` is reused as-is; "+1" is just `value=1` with a different colour.
- `AudioManager.ts` — `playSfx` API is already adequate; `Complete_01.wav` fallback is already in `SfxSynth`.
- `RunWorld.ts` — no changes; `fxLayer` already exists.
- Game design values (collect time, radius) — unchanged.

---

## 10. Out of Scope / Escalation Notes

- **New SFX asset for collect** — current spec reuses `Complete_01.wav`. If the sound designer provides a dedicated pickup sound (e.g. `pickup_scrap.wav`), only `GameConfig.ts` needs a new key; `RunJuice.collectFx()` reads the path from config. Raise with game-designer.
- **Collect number animation variant** — `spawnDamageNumber` produces an upward-float; if the designer wants a scale-pop instead, a new `spawnCollectNumber` in `DamageNumbers.ts` should be specced separately.
- **Victory/defeat flash colour** — `RunJuice.victoryFx()` uses `this.accent` (zone colour) and `defeatFx()` uses hard-coded `0xff2f3d` (red). These are already established values in `RunJuice`; this spec does not change them. Raise with game-designer if a different colour is wanted.
