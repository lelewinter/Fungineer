import { Application, Container } from 'pixi.js';
import { GameConfig } from '../state/GameConfig';
import { CRTFilter } from './filters/CRTFilter';

export class App {
  readonly pixi: Application;
  readonly stage: Container;
  readonly world: Container;
  readonly crt: CRTFilter;

  private constructor(pixi: Application) {
    this.pixi = pixi;
    this.stage = pixi.stage;
    this.world = new Container();
    this.world.label = 'WorldRoot';
    this.stage.addChild(this.world);

    this.crt = new CRTFilter({
      viewportW: GameConfig.VIEWPORT_WIDTH,
      viewportH: GameConfig.VIEWPORT_HEIGHT,
      intensity: 0.25,
    });
    this.world.filters = [this.crt];
    this.world.filterArea = this.pixi.screen;
    this.pixi.ticker.add(() => this.crt.tick());

    window.addEventListener('resize', () => this.fit());
    window.visualViewport?.addEventListener('resize', () => this.fit());
    this.fit();
  }

  static async create(host: HTMLElement): Promise<App> {
    const pixi = new Application();
    await pixi.init({
      background: '#0a0a14',
      antialias: false,
      resizeTo: host,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: 'webgl',
    });
    host.appendChild(pixi.canvas);
    pixi.canvas.style.width = '100%';
    pixi.canvas.style.height = '100%';
    return new App(pixi);
  }

  /** Fit landscape views, but stretch portrait screens to remove mobile dead area. */
  fit(): void {
    const w = this.pixi.screen.width;
    const h = this.pixi.screen.height;
    const scaleX = w / GameConfig.VIEWPORT_WIDTH;
    const scaleY = h / GameConfig.VIEWPORT_HEIGHT;
    if (h >= w) {
      this.world.scale.set(scaleX, scaleY);
      this.world.x = 0;
      this.world.y = 0;
      return;
    }

    const scale = Math.min(scaleX, scaleY);
    this.world.scale.set(scale);
    this.world.x = (w - GameConfig.VIEWPORT_WIDTH * scale) / 2;
    this.world.y = (h - GameConfig.VIEWPORT_HEIGHT * scale) / 2;
  }
}
