import type { App } from '../core/App';
import type { Party } from './Party';
import { GameConfig } from '../state/GameConfig';
import { GameState } from '../state/GameState';

/** Translates pointer/touch events into party anchor movement.
 *  Pointer deltas (in CSS pixels) are scaled by the inverse of App.world.scale
 *  so movement feels 1:1 regardless of window letterboxing. */
export class DragController {
  private app: App;
  private party: Party;
  private dragActive = false;
  private moveTarget = { x: 0, y: 0 };
  private stillnessTimer = 0;
  private lastX = 0;
  private lastY = 0;
  private static MOVE_THRESHOLD = 3;

  // Listeners
  private onDown = (e: PointerEvent): void => this.handleDown(e);
  private onMove = (e: PointerEvent): void => this.handleMove(e);
  private onUp = (e: PointerEvent): void => this.handleUp(e);

  constructor(app: App, party: Party) {
    this.app = app;
    this.party = party;
    this.moveTarget = { ...party.anchor };
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

  private handleDown(_e: PointerEvent): void {
    if (!this.isPlaying()) return;
    this.dragActive = true;
    this.moveTarget = { ...this.party.anchor };
  }

  private handleMove(e: PointerEvent): void {
    if (!this.dragActive || !this.isPlaying()) return;
    const scale = this.app.world.scale.x || 1;
    this.moveTarget.x += e.movementX / scale;
    this.moveTarget.y += e.movementY / scale;
  }

  private handleUp(_e: PointerEvent): void {
    this.dragActive = false;
  }

  update(dt: number): void {
    if (!this.isPlaying()) {
      if (!this.dragActive) this.moveTarget = { ...this.party.anchor };
      return;
    }

    if (!this.dragActive) this.moveTarget = { ...this.party.anchor };

    this.moveTarget.x = Math.max(40, Math.min(GameConfig.ARENA_WIDTH - 40, this.moveTarget.x));
    this.moveTarget.y = Math.max(40, Math.min(GameConfig.ARENA_HEIGHT - 40, this.moveTarget.y));

    const t = Math.min(1, GameConfig.DRAG_LERP_FACTOR * dt);
    this.party.anchor.x += (this.moveTarget.x - this.party.anchor.x) * t;
    this.party.anchor.y += (this.moveTarget.y - this.party.anchor.y) * t;

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
