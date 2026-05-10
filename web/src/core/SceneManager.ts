import { Ticker } from 'pixi.js';
import type { App } from './App';
import type { Scene } from './Scene';

class SceneManager {
  private app: App | null = null;
  private current: Scene | null = null;
  private tickerHandler: ((tk: Ticker) => void) | null = null;

  attach(app: App): void {
    this.app = app;
  }

  getCurrent(): Scene | null {
    return this.current;
  }

  async replace(next: Scene): Promise<void> {
    if (!this.app) throw new Error('SceneManager not attached');

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
  }
}

export const sceneManager = new SceneManager();
