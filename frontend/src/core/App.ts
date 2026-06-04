import { Application, Container } from 'pixi.js';
import { GameConfig } from '../state/GameConfig';
import { CRTFilter } from './filters/CRTFilter';

export class App {
  readonly pixi: Application;
  readonly stage: Container;
  readonly world: Container;
  readonly crt: CRTFilter;

  private readonly host: HTMLElement;
  private lastW = -1;
  private lastH = -1;

  private constructor(pixi: Application, host: HTMLElement) {
    this.pixi = pixi;
    this.host = host;
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

    // We manage the renderer size ourselves instead of relying on Pixi's
    // `resizeTo`, because on mobile the visible area is driven by the browser
    // chrome (URL bar) through `visualViewport`, which does not reliably fire
    // `window.resize`. Listening to every relevant signal — and re-checking a
    // few times after load — keeps the canvas filling the actual viewport.
    const onResize = (): void => this.resize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);

    this.resize();
    // Catch the mobile browser settling its chrome / fonts loading in.
    requestAnimationFrame(onResize);
    for (const delay of [100, 300, 600, 1000]) {
      window.setTimeout(onResize, delay);
    }
  }

  static async create(host: HTMLElement): Promise<App> {
    const pixi = new Application();
    await pixi.init({
      background: '#0a0a14',
      antialias: false,
      width: host.clientWidth || window.innerWidth,
      height: host.clientHeight || window.innerHeight,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: 'webgl',
    });
    host.appendChild(pixi.canvas);
    pixi.canvas.style.width = '100%';
    pixi.canvas.style.height = '100%';
    return new App(pixi, host);
  }

  /** Resize the renderer to the real visible viewport, then re-fit the world. */
  private resize(): void {
    const vv = window.visualViewport;
    const w = Math.round(vv?.width ?? this.host.clientWidth ?? window.innerWidth);
    const h = Math.round(vv?.height ?? this.host.clientHeight ?? window.innerHeight);
    if (w <= 0 || h <= 0) return;
    if (w === this.lastW && h === this.lastH) return;
    this.lastW = w;
    this.lastH = h;

    this.pixi.renderer.resize(w, h);
    // `autoDensity` rewrites the canvas CSS size to explicit pixels on every
    // resize; force it back to fill its host so the canvas always covers the
    // visible viewport regardless of the renderer's internal dimensions.
    this.pixi.canvas.style.width = '100%';
    this.pixi.canvas.style.height = '100%';
    this.fit();
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
