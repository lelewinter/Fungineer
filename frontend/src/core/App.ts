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
      intensity: 1.0,
    });
    this.world.filters = [this.crt];
    this.world.filterArea = this.pixi.screen;
    this.pixi.ticker.add(() => this.crt.tick());

    window.addEventListener('resize', () => this.fit());
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
    });
    host.appendChild(pixi.canvas);
    return new App(pixi);
  }

  /** Letterbox the 480×854 stage inside the canvas. */
  fit(): void {
    const w = this.pixi.renderer.width / this.pixi.renderer.resolution;
    const h = this.pixi.renderer.height / this.pixi.renderer.resolution;
    const scale = Math.min(w / GameConfig.VIEWPORT_WIDTH, h / GameConfig.VIEWPORT_HEIGHT);
    this.world.scale.set(scale);
    this.world.x = (w - GameConfig.VIEWPORT_WIDTH * scale) / 2;
    this.world.y = (h - GameConfig.VIEWPORT_HEIGHT * scale) / 2;
  }
}
