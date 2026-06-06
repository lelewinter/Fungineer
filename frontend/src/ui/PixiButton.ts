// ============================================================================
// PixiButton — o botão padrão do jogo (agora sobre o @pixi/ui).
//
// O que faz: desenha um botão "gostoso de apertar". Tem sombra (parece levantado
// da tela), realça a borda quando o mouse passa por cima (e o bloom global do
// CinematicPipeline faz essa borda BRILHAR), e encolhe um pouquinho ao ser
// pressionado, como um botão físico de verdade. Ao clicar, toca um som e avisa
// quem o criou (via callback onClick).
//
// Implementação: estende o FancyButton do ecossistema (@pixi/ui), que cuida da
// máquina de estados (normal / hover / pressionado / desabilitado) e das
// animações de transição. Nós só fornecemos a "cara" de cada estado e o texto.
// A API pública (construtor com opts, setLabel) é a MESMA de antes, então todas
// as telas e janelas que usam este botão continuam funcionando sem mudanças.
// ============================================================================
import { Graphics, Rectangle, Text } from 'pixi.js';
import { FancyButton } from '@pixi/ui';
import { audioManager } from '../core/AudioManager';
import { FontFamily, TextColor } from '../core/typography';

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
  /** false → skips the click sound (useful for variant selectors that double-trigger). */
  silent?: boolean;
}

/** Desenha a "cara" do botão (sombra + corpo + borda) num Graphics. O mesmo
 *  formato é usado para os estados normal e hover — só mudam cor e brilho —, o
 *  que mantém o tamanho (bounds) estável entre os estados. */
function makeFace(opts: Required<Omit<ButtonOpts, 'silent' | 'label' | 'onClick'>>, hover: boolean): Graphics {
  const { width: w, height: h } = opts;
  const r = Math.min(10, h * 0.28);
  const fill = hover ? opts.hoverFill : opts.fill;
  const accent = opts.textColor;
  const borderColor = hover ? accent : 0x86998a;
  const g = new Graphics();

  // Sombra abaixo do botão — dá o "relevo" físico.
  g.roundRect(0, 3, w, h, r).fill({ color: 0x000000, alpha: 0.45 });
  // Corpo: base, brilho superior, sombreado inferior e borda.
  g.roundRect(0, 0, w, h, r).fill({ color: fill })
    .roundRect(1.5, 1.5, w - 3, h * 0.5, r - 1).fill({ color: 0xffffff, alpha: hover ? 0.12 : 0.06 })
    .roundRect(1.5, h * 0.6, w - 3, h * 0.4 - 1.5, r - 1).fill({ color: 0x000000, alpha: 0.16 })
    .roundRect(0, 0, w, h, r).stroke({ color: borderColor, width: hover ? 2 : 1.5, alpha: hover ? 1 : 0.9 });
  // No hover, uma borda interna acesa: o bloom global transforma isso em glow.
  if (hover) g.roundRect(2, 2, w - 4, h - 4, r - 1).stroke({ color: accent, width: 1.5, alpha: 0.5 });
  return g;
}

/** O botão padrão. É um FancyButton (logo, um Container), então pode ser
 *  posicionado e adicionado a qualquer tela como qualquer outro elemento. */
export class PixiButton extends FancyButton {
  private readonly labelText: Text;
  private readonly silent: boolean;

  constructor(opts: ButtonOpts) {
    const full = {
      fill: 0x213a29,
      hoverFill: 0x2e5038,
      textColor: TextColor.ink,
      fontSize: 15,
      ...opts,
    } as Required<Omit<ButtonOpts, 'silent'>>;

    const label = new Text({
      text: full.label,
      style: {
        fontFamily: FontFamily.body,
        fontSize: full.fontSize,
        fill: full.textColor,
        fontWeight: '700',
        letterSpacing: 0.4,
        // Drop shadow keeps the label legible over busy/low-contrast art.
        dropShadow: { color: 0x000000, alpha: 0.6, blur: 2, distance: 1, angle: Math.PI / 2 },
      },
    });

    super({
      defaultView: makeFace(full, false),
      hoverView: makeFace(full, true),
      pressedView: makeFace(full, true),
      text: label,
      // Origem no canto superior esquerdo (como o botão antigo): os chamadores
      // posicionam por x/y do topo-esquerda e contam com width/height.
      anchorX: 0,
      anchorY: 0,
      // O ecossistema anima as transições entre estados (o "aperto" tátil).
      animations: {
        default: { props: { scale: { x: 1, y: 1 } }, duration: 120 },
        hover: { props: { scale: { x: 1, y: 1 } }, duration: 120 },
        pressed: { props: { scale: { x: 0.94, y: 0.94 } }, duration: 70 },
      },
    });

    this.labelText = label;
    this.silent = opts.silent ?? false;

    // Área clicável estável, do tamanho do botão (independe de sombra/escala).
    this.hitArea = new Rectangle(0, 0, full.width, full.height);

    this.onPress.connect(() => {
      if (!this.silent) audioManager.playSfx('res://assets/audio/sfx/ui/Click_03.wav', 0.4);
      opts.onClick();
    });
  }

  /** Troca o texto do botão depois de criado (ex.: "SILENCIAR" → "ATIVAR SOM"). */
  setLabel(text: string): void {
    this.labelText.text = text;
  }
}
