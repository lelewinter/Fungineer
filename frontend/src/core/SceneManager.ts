import { Graphics, Ticker } from 'pixi.js';
import type { App } from './App';
import type { Scene } from './Scene';
import { Easing, tween } from './tween';

class SceneManager {
  private app: App | null = null;
  private current: Scene | null = null;
  private tickerHandler: ((tk: Ticker) => void) | null = null;
  private fadeOverlay: Graphics | null = null;
  private busy = false;

  attach(app: App): void {
    this.app = app;
    this.ensureFadeOverlay();
  }

  getCurrent(): Scene | null {
    return this.current;
  }

  private ensureFadeOverlay(): void {
    if (!this.app || this.fadeOverlay) return;
    const w = this.app.pixi.screen.width;
    const h = this.app.pixi.screen.height;
    this.fadeOverlay = new Graphics().rect(0, 0, w, h).fill(0x000000);
    this.fadeOverlay.alpha = 0;
    this.fadeOverlay.eventMode = 'none';
    this.fadeOverlay.zIndex = 9999;
    this.app.stage.sortableChildren = true;
    this.app.stage.addChild(this.fadeOverlay);
    const resize = (): void => {
      if (!this.app || !this.fadeOverlay) return;
      this.fadeOverlay.clear()
        .rect(0, 0, this.app.pixi.screen.width, this.app.pixi.screen.height)
        .fill(0x000000);
    };
    window.addEventListener('resize', resize);
  }

  async replace(next: Scene, opts: { fadeMs?: number } = {}): Promise<void> {
    if (!this.app) throw new Error('SceneManager not attached');
    if (this.busy) return;
    this.busy = true;
    try {
      const fadeMs = opts.fadeMs ?? 220;
      const overlay = this.fadeOverlay;

      if (this.current && overlay) {
        await tween({
          durationMs: fadeMs,
          ease: Easing.easeInCubic,
          onUpdate: (t) => { overlay.alpha = t; },
        });
      }

      if (this.current) {
        if (this.tickerHandler) {
          this.app.pixi.ticker.remove(this.tickerHandler);
          this.tickerHandler = null;
        }
        await this.current.exit();
        this.app.world.removeChild(this.current.root);
        this.current.root.destroy({ children: true });
        this.current = null;
      }

      next.bind(this.app);
      this.app.world.addChild(next.root);
      await next.enter();
      this.current = next;

      this.tickerHandler = (tk) => next.update(tk.deltaMS / 1000);
      this.app.pixi.ticker.add(this.tickerHandler);

      if (overlay) {
        await tween({
          durationMs: fadeMs,
          ease: Easing.easeOutCubic,
          onUpdate: (t) => { overlay.alpha = 1 - t; },
        });
        overlay.alpha = 0;
      }
    } finally {
      this.busy = false;
    }
  }
}

export const sceneManager = new SceneManager();
