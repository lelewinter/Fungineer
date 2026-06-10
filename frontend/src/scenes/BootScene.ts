import { Container, Graphics, Text } from 'pixi.js';
import { Scene } from '../core/Scene';
import { Color } from '../core/Color';
import { GameConfig } from '../state/GameConfig';
import { HubState } from '../state/HubState';

/**
 * BootScene — a telinha de "ligando o jogo".
 *
 * E uma cena de placeholder (provisoria) do esqueleto inicial do projeto: so
 * mostra o logo FUNGINEER pulsando sobre uma grade, enquanto o jogo "acorda".
 * Em producao a StartScene e o ponto de entrada; esta cena fica de reserva.
 *
 * Como toda cena (Scene), ela tem um ciclo de vida: enter() monta os elementos
 * na tela uma vez, e update() roda a cada quadro para animar.
 */
export class BootScene extends Scene {
  private title!: Text;
  private subtitle!: Text;
  // Tempo total acumulado (em segundos) desde que a cena entrou — usado para
  // animar a pulsacao do titulo.
  private elapsed = 0;

  /** Monta o fundo, a grade e os textos uma unica vez ao entrar na cena. */
  override async enter(): Promise<void> {
    const W = GameConfig.VIEWPORT_WIDTH;
    const H = GameConfig.VIEWPORT_HEIGHT;
    const variant = HubState.getVariantData();

    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill(Color.hex(variant.bg));
    this.root.addChild(bg);

    // Grade de fundo: linhas verticais e horizontais a cada 32px.
    const grid = new Graphics();
    const step = 32;
    for (let x = 0; x <= W; x += step) grid.moveTo(x, 0).lineTo(x, H);
    for (let y = 0; y <= H; y += step) grid.moveTo(0, y).lineTo(W, y);
    grid.stroke({ color: Color.hex(variant.grid), width: 1, alpha: 0.5 });
    this.root.addChild(grid);

    const stack = new Container();
    stack.x = W / 2;
    stack.y = H / 2;
    this.root.addChild(stack);

    this.title = new Text({
      text: 'FUNGINEER',
      style: {
        fontFamily: '"Rubik", system-ui, sans-serif',
        fontSize: 36,
        fontWeight: '900',
        fill: Color.hex(variant.accent),
        align: 'center',
        letterSpacing: 4,
      },
    });
    this.title.anchor.set(0.5);
    this.title.y = -40;
    stack.addChild(this.title);

    this.subtitle = new Text({
      text: 'Phase 1 — scaffold ok\nPixiJS port booting…',
      style: {
        fontFamily: '"Rubik", system-ui, sans-serif',
        fontSize: 16,
        fill: Color.hex(variant.ink),
        align: 'center',
      },
    });
    this.subtitle.anchor.set(0.5);
    this.subtitle.y = 10;
    stack.addChild(this.subtitle);

    const footer = new Text({
      text: `${W} × ${H} • PixiJS v8`,
      style: {
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        fontSize: 11,
        fill: Color.hex(variant.cool_light),
        align: 'center',
      },
    });
    footer.anchor.set(0.5, 1);
    footer.x = W / 2;
    footer.y = H - 24;
    this.root.addChild(footer);
  }

  /** A cada quadro: faz o titulo "respirar" (alpha indo e voltando). */
  override update(dt: number): void {
    // dt e o delta time (tempo do ultimo quadro), entao a animacao fica suave
    // independente da taxa de quadros.
    this.elapsed += dt;
    const pulse = 0.85 + 0.15 * Math.sin(this.elapsed * 2.4);
    if (this.title) this.title.alpha = pulse;
  }
}
