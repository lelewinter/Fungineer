import { Container, Graphics } from 'pixi.js';
import type { App } from '../../core/App';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { GameState, RunState } from '../../state/GameState';
import type { Vec2 } from '../../core/types';

interface ShadowRect {
  x: number; y: number; w: number; h: number;
}

/** Solo infiltrator for the Stealth zone. Speed determines sound radius;
 *  shadow rects (set by the run scene) dim the character. */
export class StealthAgent {
  readonly node = new Container();
  position: Vec2 = { x: 0, y: 0 };

  private body = new Graphics();
  private soundRing = new Graphics();
  private moveTarget: Vec2 = { x: 0, y: 0 };
  private dragActive = false;
  private velocity: Vec2 = { x: 0, y: 0 };
  private shadowRects: ShadowRect[] = [];
  private inputLocked = false;
  private app: App;

  private onDown = (e: PointerEvent): void => this.handleDown(e);
  private onMove = (e: PointerEvent): void => this.handleMove(e);
  private onUp = (e: PointerEvent): void => this.handleUp(e);

  constructor(app: App, start: Vec2) {
    this.app = app;
    this.position = { ...start };
    this.moveTarget = { ...start };
    this.node.addChild(this.soundRing);
    this.node.addChild(this.body);
    this.drawBody(false);

    const c = app.pixi.canvas;
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onUp);
  }

  destroy(): void {
    const c = this.app.pixi.canvas;
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('pointermove', this.onMove);
    c.removeEventListener('pointerup', this.onUp);
    c.removeEventListener('pointercancel', this.onUp);
    this.node.destroy({ children: true });
  }

  setShadowRects(rects: ShadowRect[]): void {
    this.shadowRects = rects;
  }

  /** Called by HackTerminal when a puzzle opens. */
  setInputLocked(locked: boolean): void {
    this.inputLocked = locked;
    if (locked) {
      this.dragActive = false;
      this.moveTarget = { ...this.position };
    }
  }

  private isPlaying(): boolean {
    return GameState.current_state === RunState.PLAYING;
  }

  private handleDown(_e: PointerEvent): void {
    if (this.inputLocked || !this.isPlaying()) return;
    this.dragActive = true;
    this.moveTarget = { ...this.position };
  }

  private handleMove(e: PointerEvent): void {
    if (!this.dragActive || this.inputLocked || !this.isPlaying()) return;
    const scale = this.app.world.scale.x || 1;
    this.moveTarget.x += e.movementX / scale;
    this.moveTarget.y += e.movementY / scale;
  }

  private handleUp(_e: PointerEvent): void {
    this.dragActive = false;
  }

  update(dt: number): void {
    if (!this.isPlaying()) return;
    if (!this.dragActive) this.moveTarget = { ...this.position };

    this.moveTarget.x = Math.max(30, Math.min(GameConfig.ARENA_WIDTH - 30, this.moveTarget.x));
    this.moveTarget.y = Math.max(30, Math.min(GameConfig.ARENA_HEIGHT - 30, this.moveTarget.y));

    const prevX = this.position.x;
    const prevY = this.position.y;
    const t = Math.min(1, GameConfig.DRAG_LERP_FACTOR * dt);
    this.position.x += (this.moveTarget.x - this.position.x) * t;
    this.position.y += (this.moveTarget.y - this.position.y) * t;
    this.velocity = dt > 0
      ? { x: (this.position.x - prevX) / dt, y: (this.position.y - prevY) / dt }
      : { x: 0, y: 0 };

    const inShadow = this.isInShadow();
    this.drawBody(inShadow);
    this.drawSoundRing();
    this.node.x = this.position.x;
    this.node.y = this.position.y;
  }

  getSpeed(): number {
    return Math.hypot(this.velocity.x, this.velocity.y);
  }

  getSoundRadius(): number {
    const t = Math.max(0, Math.min(1, this.getSpeed() / GameConfig.STEALTH_AGENT_SPEED_MAX));
    return GameConfig.STEALTH_SOUND_RADIUS_MIN
      + t * (GameConfig.STEALTH_SOUND_RADIUS_MAX - GameConfig.STEALTH_SOUND_RADIUS_MIN);
  }

  isInShadow(): boolean {
    for (const r of this.shadowRects) {
      if (this.position.x >= r.x && this.position.x <= r.x + r.w
        && this.position.y >= r.y && this.position.y <= r.y + r.h) return true;
    }
    return false;
  }

  private drawBody(inShadow: boolean): void {
    this.body.clear();
    const c = inShadow ? Color.rgb(0.1, 0.35, 0.65) : Color.rgb(0.25, 0.65, 1.0);
    this.body
      .circle(0, 0, 12).fill(Color.hex(c))
      .circle(0, -4, 6).fill({ color: 0xffffff, alpha: 0.7 });
    if (inShadow) {
      this.body.circle(0, 0, 15).stroke({ color: 0x4d8cff, width: 2, alpha: 0.55 });
    }
  }

  private drawSoundRing(): void {
    this.soundRing.clear();
    const sr = this.getSoundRadius();
    if (sr <= GameConfig.STEALTH_SOUND_RADIUS_MIN + 2) return;
    const alpha = Math.min(0.45, (sr - GameConfig.STEALTH_SOUND_RADIUS_MIN) / 60);
    this.soundRing.circle(0, 0, sr).stroke({ color: 0xffd933, width: 2, alpha });
  }
}
