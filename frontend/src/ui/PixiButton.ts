// ============================================================================
// PixiButton — o botão padrão do jogo.
//
// O que faz: desenha um botão "gostoso de apertar". Ele tem sombra (para
// parecer levantado da tela), um brilho (glow) quando o mouse passa por cima,
// e encolhe um pouquinho ao ser pressionado, como um botão físico de verdade.
// Ao clicar, toca um som e avisa quem criou o botão (via callback onClick).
//
// Onde encaixa: praticamente todas as telas e janelas (modals) do jogo usam
// este botão — confirmar raid, fechar painel, escolher poder, etc.
// ============================================================================
import { Container, FederatedPointerEvent, Graphics, Rectangle, Text } from 'pixi.js';
import { audioManager } from '../core/AudioManager';
import { FontFamily, TextColor } from '../core/typography';
import { tween, Easing } from '../core/tween';

/** Opções de configuração que quem cria o botão pode passar. */
interface ButtonOpts {
  label: string;            // o texto escrito dentro do botão
  width: number;
  height: number;
  onClick: () => void;      // o que acontece quando o jogador clica
  fill?: number;            // cor de fundo normal
  hoverFill?: number;       // cor de fundo quando o mouse está em cima (hover)
  textColor?: number;
  fontSize?: number;
  /** false → skips the click click sound (useful for variant selectors that double-trigger). */
  silent?: boolean;
}

/** O botão padrão. É um `Container` do PixiJS, então pode ser posicionado e
 *  adicionado a qualquer tela como qualquer outro elemento visual. */
export class PixiButton extends Container {
  /** Everything visual lives on `face` so we can scale it around its centre
   *  for a tactile press without disturbing the button's anchor position. */
  private face = new Container();
  private shadow = new Graphics();
  private glow = new Graphics();
  private bg = new Graphics();
  private textNode: Text;
  private opts: Required<Omit<ButtonOpts, 'silent'>> & { silent: boolean };
  private hovering = false;       // mouse está em cima do botão?
  // Controla a animação de "aperto". Se um novo aperto começar, cancelamos o
  // anterior para os movimentos não brigarem entre si.
  private pressAbort: AbortController | null = null;

  constructor(opts: ButtonOpts) {
    super();
    // Junta as opções recebidas com valores padrão (defaults). O que o chamador
    // não informou usa o padrão; o que informou sobrescreve.
    this.opts = {
      fill: 0x213a29,
      hoverFill: 0x2e5038,
      textColor: TextColor.ink,
      fontSize: 15,
      silent: false,
      ...opts,
    };

    const w = this.opts.width;
    const h = this.opts.height;

    this.textNode = new Text({
      text: this.opts.label,
      style: {
        fontFamily: FontFamily.body,
        fontSize: this.opts.fontSize,
        fill: this.opts.textColor,
        fontWeight: '700',
        letterSpacing: 0.4,
        // Drop shadow keeps the label legible over busy/low-contrast art.
        dropShadow: {
          color: 0x000000,
          alpha: 0.6,
          blur: 2,
          distance: 1,
          angle: Math.PI / 2,
        },
      },
    });
    this.textNode.anchor.set(0.5);
    this.textNode.x = w / 2;
    this.textNode.y = h / 2;

    this.glow.alpha = 0;
    this.face.addChild(this.shadow, this.glow, this.bg, this.textNode);
    // Centre pivot so press-scaling grows/shrinks from the middle.
    this.face.pivot.set(w / 2, h / 2);
    this.face.position.set(w / 2, h / 2);
    this.addChild(this.face);

    this.eventMode = 'static'; // habilita o botão a receber eventos de mouse/toque
    this.cursor = 'pointer';
    // Stable hit area independent of the glow/shadow bounds and press scaling.
    // A "hit area" é a região clicável. Fixamos um retângulo do tamanho do botão
    // para que o brilho, a sombra e a animação de aperto não mexam onde o clique
    // é detectado.
    this.hitArea = new Rectangle(0, 0, w, h);

    // Reações aos eventos do ponteiro (mouse/toque):
    this.on('pointerover', () => { this.hovering = true; this.draw(); this.scaleTo(1.0); });   // entrou em cima
    this.on('pointerout', () => { this.hovering = false; this.draw(); this.scaleTo(1.0); });   // saiu de cima
    this.on('pointerdown', () => { this.scaleTo(0.93, 60); });                                 // pressionou: encolhe
    this.on('pointerup', () => { this.scaleTo(1.0, 150, Easing.easeOutCubic); });              // soltou: volta ao tamanho
    this.on('pointerupoutside', () => { this.scaleTo(1.0, 150); });                            // soltou fora: também volta
    this.on('pointertap', (e: FederatedPointerEvent) => {
      e.stopPropagation(); // impede que o clique "vaze" para o que está atrás do botão
      if (!this.opts.silent) audioManager.playSfx('res://assets/audio/sfx/ui/Click_03.wav', 0.4);
      this.opts.onClick();
    });
    this.draw();
  }

  /** Troca o texto do botão depois de criado (ex.: "SILENCIAR" → "ATIVAR SOM"). */
  setLabel(text: string): void {
    this.textNode.text = text;
  }

  /** Anima a escala do "rosto" do botão para dar a sensação de aperto.
   *  `target` é o tamanho final (1.0 = normal, 0.93 = levemente encolhido). */
  private scaleTo(target: number, durationMs = 110, ease = Easing.easeOutCubic): void {
    this.pressAbort?.abort();
    const ac = new AbortController();
    this.pressAbort = ac;
    const from = this.face.scale.x;
    void tween({
      durationMs,
      ease,
      signal: ac.signal,
      onUpdate: (t) => {
        // A button that closes its own panel on click is destroyed mid-press
        // tween; bail out before touching the freed Pixi node.
        if (this.destroyed || this.face.destroyed) return;
        const s = from + (target - from) * t;
        this.face.scale.set(s);
      },
    });
  }

  /** Limpeza: ao remover o botão da tela, cancela qualquer animação em
   *  andamento para não tentar mexer num elemento já destruído. */
  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.pressAbort?.abort();
    super.destroy(options);
  }

  /** Redesenha o visual do botão. Chamado sempre que o estado muda (hover, etc).
   *  Desenha em camadas: sombra embaixo, depois o corpo com brilhos sutis, a
   *  borda, e por fim o glow externo quando há hover. */
  private draw(): void {
    const w = this.opts.width;
    const h = this.opts.height;
    const r = Math.min(10, h * 0.28);
    const fill = this.hovering ? this.opts.hoverFill : this.opts.fill;
    const accent = this.opts.textColor;
    const borderColor = this.hovering ? accent : 0x86998a;

    // Drop shadow beneath the button — gives it physical lift.
    this.shadow.clear();
    this.shadow.roundRect(0, 3, w, h, r)
      .fill({ color: 0x000000, alpha: 0.45 });

    this.bg.clear();
    this.bg
      // Base.
      .roundRect(0, 0, w, h, r)
      .fill({ color: fill })
      // Top sheen.
      .roundRect(1.5, 1.5, w - 3, h * 0.5, r - 1)
      .fill({ color: 0xffffff, alpha: this.hovering ? 0.10 : 0.06 })
      // Bottom grounding shade.
      .roundRect(1.5, h * 0.6, w - 3, h * 0.4 - 1.5, r - 1)
      .fill({ color: 0x000000, alpha: 0.16 })
      // Border.
      .roundRect(0, 0, w, h, r)
      .stroke({ color: borderColor, width: this.hovering ? 2 : 1.5, alpha: this.hovering ? 1 : 0.9 });

    this.glow.clear();
    if (this.hovering) {
      // Outer glow halo.
      this.glow.roundRect(-4, -4, w + 8, h + 8, r + 3)
        .fill({ color: accent, alpha: 0.22 })
        .roundRect(-2, -2, w + 4, h + 4, r + 1)
        .fill({ color: accent, alpha: 0.12 });
      this.glow.alpha = 1;
    } else {
      this.glow.alpha = 0;
    }
  }
}
