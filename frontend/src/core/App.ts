import { Application, Container } from 'pixi.js';
import { GameConfig } from '../state/GameConfig';
import { CRTFilter } from './filters/CRTFilter';

/** Heuristic: pointer-coarse OR small low-DPR screens get the lighter CRT.
 *  The full CRT shader is fine on desktop but eats ~30% frame budget on a
 *  midrange Android in WebGL 1 software-rasterised contexts. */
function isLowPowerDevice(): boolean {
  try {
    if (window.matchMedia?.('(pointer: coarse)').matches) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export class App {
  readonly pixi: Application;
  readonly stage: Container;
  readonly world: Container;
  readonly crt: CRTFilter | null;

  private constructor(pixi: Application) {
    this.pixi = pixi;
    this.stage = pixi.stage;
    this.world = new Container();
    this.world.label = 'WorldRoot';
    this.stage.addChild(this.world);

    // CRT intensity: heavy on desktop, ~0 on mobile (still attached so the
    // overall colour pipeline matches, but the heavy effects fold out).
    if (isLowPowerDevice()) {
      this.crt = null;
    } else {
      this.crt = new CRTFilter({
        viewportW: GameConfig.VIEWPORT_WIDTH,
        viewportH: GameConfig.VIEWPORT_HEIGHT,
        intensity: 1.0,
      });
      this.world.filters = [this.crt];
      this.world.filterArea = this.pixi.screen;
      const crt = this.crt;
      this.pixi.ticker.add(() => crt.tick());
    }

    // Cap ticker to 60fps — Pixi defaults to "unlimited", which on a 120 Hz
    // display burns CPU/battery for no visible benefit.
    this.pixi.ticker.maxFPS = 60;

    window.addEventListener('resize', () => this.fit());
    // Mobile URL-bar collapse changes the layout viewport; visualViewport
    // fires its own resize and is the source of truth on iOS/Android.
    window.visualViewport?.addEventListener('resize', () => this.fit());
    this.fit();
  }

  static async create(host: HTMLElement): Promise<App> {
    const pixi = new Application();
    await pixi.init({
      background: '#0a0a14',
      antialias: false,
      resizeTo: window,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: 'webgl',
      powerPreference: 'high-performance',
    });
    host.appendChild(pixi.canvas);
    return new App(pixi);
  }

  /** Letterbox the 480×854 stage inside the canvas. */
  fit(): void {
    const w = this.pixi.screen.width;
    const h = this.pixi.screen.height;
    const scale = Math.min(w / GameConfig.VIEWPORT_WIDTH, h / GameConfig.VIEWPORT_HEIGHT);
    this.world.scale.set(scale);
    this.world.x = (w - GameConfig.VIEWPORT_WIDTH * scale) / 2;
    this.world.y = (h - GameConfig.VIEWPORT_HEIGHT * scale) / 2;
  }
}
