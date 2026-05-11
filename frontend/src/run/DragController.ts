import type { App } from '../core/App';
import type { Party } from './Party';
import { GameConfig } from '../state/GameConfig';
import { GameState } from '../state/GameState';

/** Vampire-Survivors-style "follow the finger" controller.
 *
 *  While the pointer is down (or hovering on desktop), the party walks at a
 *  constant speed toward the finger's world-space position. There's no drag
 *  start/stop — the finger is the steering input. Releasing the pointer
 *  freezes movement.
 *
 *  Pointer position is mapped through the camera's transform so the
 *  destination tracks the world even as the camera scrolls. */
export class DragController {
  private app: App;
  private party: Party;
  private cameraNode: { x: number; y: number } | null;
  private pointerDown = false;
  private pointerWorld = { x: 0, y: 0 };
  private stillnessTimer = 0;
  private lastX = 0;
  private lastY = 0;
  private static readonly MOVE_THRESHOLD = 3;
  private static readonly STOP_RADIUS = 6;
  private static readonly MOVE_SPEED = 320; // world px / s

  // Listeners
  private onDown = (e: PointerEvent): void => this.handleDown(e);
  private onMove = (e: PointerEvent): void => this.handleMove(e);
  private onUp = (e: PointerEvent): void => this.handleUp(e);

  constructor(app: App, party: Party, cameraNode?: { x: number; y: number }) {
    this.app = app;
    this.party = party;
    this.cameraNode = cameraNode ?? null;
    this.pointerWorld = { ...party.anchor };
    const c = app.pixi.canvas;
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onUp);
    c.addEventListener('pointerleave', this.onUp);
  }

  destroy(): void {
    const c = this.app.pixi.canvas;
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('pointermove', this.onMove);
    c.removeEventListener('pointerup', this.onUp);
    c.removeEventListener('pointercancel', this.onUp);
    c.removeEventListener('pointerleave', this.onUp);
  }

  private isPlaying(): boolean {
    const s = GameState.current_state;
    return s === 'PLAYING' || s === 'BOSS_FIGHT';
  }

  private toWorld(e: PointerEvent): { x: number; y: number } {
    const rect = this.app.pixi.canvas.getBoundingClientRect();
    const scale = this.app.world.scale.x || 1;
    // CSS-pixel coords inside the canvas, then back through world fit + camera
    // pan so the finger maps to the arena cell currently under it.
    const cssX = (e.clientX - rect.left - this.app.world.x) / scale;
    const cssY = (e.clientY - rect.top - this.app.world.y) / scale;
    const camX = this.cameraNode?.x ?? 0;
    const camY = this.cameraNode?.y ?? 0;
    return { x: cssX - camX, y: cssY - camY };
  }

  private handleDown(e: PointerEvent): void {
    if (!this.isPlaying()) return;
    this.pointerDown = true;
    this.pointerWorld = this.toWorld(e);
  }

  private handleMove(e: PointerEvent): void {
    if (!this.isPlaying()) return;
    // Track the latest pointer position even when not pressed (cheap; just a
    // vec3 update). Movement is gated on `pointerDown` in update().
    this.pointerWorld = this.toWorld(e);
  }

  private handleUp(_e: PointerEvent): void {
    this.pointerDown = false;
  }

  update(dt: number): void {
    if (!this.isPlaying()) return;

    if (this.pointerDown) {
      const dx = this.pointerWorld.x - this.party.anchor.x;
      const dy = this.pointerWorld.y - this.party.anchor.y;
      const dist = Math.hypot(dx, dy);
      if (dist > DragController.STOP_RADIUS) {
        // Constant-speed walk toward the finger. Capped at the remaining
        // distance so we don't overshoot when the finger is close.
        const step = Math.min(dist, DragController.MOVE_SPEED * dt);
        this.party.anchor.x += (dx / dist) * step;
        this.party.anchor.y += (dy / dist) * step;
      }
    }

    this.party.anchor.x = Math.max(40, Math.min(GameConfig.ARENA_WIDTH - 40, this.party.anchor.x));
    this.party.anchor.y = Math.max(40, Math.min(GameConfig.ARENA_HEIGHT - 40, this.party.anchor.y));

    // Stillness tracking (Siege Mode)
    const moved = Math.hypot(this.party.anchor.x - this.lastX, this.party.anchor.y - this.lastY);
    this.lastX = this.party.anchor.x;
    this.lastY = this.party.anchor.y;
    if (moved < DragController.MOVE_THRESHOLD * dt * 60) {
      this.stillnessTimer += dt;
      if (this.stillnessTimer >= GameConfig.SIEGE_MODE_STILLNESS_TIME) GameState.siege_mode_active = true;
    } else {
      this.stillnessTimer = 0;
      GameState.siege_mode_active = false;
    }
  }
}
