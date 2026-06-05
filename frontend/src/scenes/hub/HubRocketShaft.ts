import { Color, type RGBA } from '../../core/Color';
import { HubState, ROCKET_RECIPE } from '../../state/HubState';
import { type DrawCtx } from './HubDrawKit';

/**
 * HubRocketShaft — desenho do foguete (o "casulo") no meio do bunker.
 *
 * No centro do corte do bunker existe um poco vertical (shaft) que atravessa
 * varios andares. Dentro dele cresce o foguete que a colonia esta montando peca
 * por peca para escapar. Quanto mais pecas o jogador construiu, mais do foguete
 * aparece "pronto" (colorido) em vez de cinza.
 *
 * Este arquivo so DESENHA o foguete. O clique no poco e tratado pelo
 * HubRenderer (que abre o painel do foguete). Separamos este desenho do resto
 * porque ele e grande e tem geometria propria (nariz, corpo em 4 secoes, asas,
 * chamas), entao fica mais facil de ler isolado.
 */

/** Medidas do poco, calculadas pelo HubRenderer a partir do layout do hub. */
export interface ShaftMetrics {
  /** Largura de uma coluna da grade do bunker. */
  readonly cellWidth: number;
  /** Altura da faixa de superficie (o ceu, no topo). */
  readonly surfaceH: number;
  /** Altura de um andar subterraneo. */
  readonly floorH: number;
}

/** Desenha o foguete inteiro dentro do poco (colunas 2-3, andares 2-5). */
export function drawRocketShaft(ctx: DrawCtx, m: ShaftMetrics): void {
  const { g } = ctx;
  const built = HubState.rocket_pieces_built;
  const total = ROCKET_RECIPE.length;
  // progress: fracao do foguete ja construida (0 a 1).
  const progress = built / Math.max(1, total);
  const t = ctx.elapsedMs;

  const shaftX = m.cellWidth * 2;
  const shaftY = m.surfaceH;
  const shaftW = m.cellWidth * 2;
  const shaftH = m.floorH * 4;
  const cx = shaftX + shaftW * 0.5;

  // Fundo escuro do poco (o vazio onde o foguete fica).
  g.rect(shaftX, shaftY, shaftW, shaftH)
    .fill(Color.hex(Color.rgb(0.03, 0.02, 0.015)));

  // Linhas fracas separando os andares dentro do poco.
  for (let f = 1; f < 4; f++) {
    const ly = shaftY + f * m.floorH;
    g.moveTo(shaftX, ly).lineTo(shaftX + shaftW, ly)
      .stroke({ color: Color.hex(Color.rgb(0.14, 0.11, 0.09)), width: 1, alpha: 0.6 });
  }

  // Geometria do foguete (nariz no topo, corpo no meio, asas embaixo).
  const topY = shaftY + 16;
  const bottomY = shaftY + shaftH - 20;
  const totalH = bottomY - topY;
  const bodyW = 52;
  const noseH = totalH * 0.13;
  const noseEnd = topY + noseH;
  const finH = totalH * 0.10;
  const finTop = bottomY - finH;
  const bodyH = finTop - noseEnd;
  const bodyLeft = cx - bodyW * 0.5;
  const bodyRight = cx + bodyW * 0.5;

  // Onde termina a parte construida (medida do topo do corpo para baixo).
  const buildY = noseEnd + bodyH * (1 - progress);

  const purple: RGBA = Color.rgb(0.72, 0.45, 0.85);
  const cyan: RGBA = Color.rgb(0.30, 0.78, 0.72);
  const amber: RGBA = Color.rgb(0.91, 0.58, 0.23);
  const earth: RGBA = Color.rgb(0.55, 0.35, 0.20);
  const gray: RGBA = { r: 0.35, g: 0.32, b: 0.28, a: 1 };

  // Andaimes (postes atras do foguete).
  const poleX1 = shaftX + 11;
  const poleX2 = shaftX + shaftW - 11;
  g.moveTo(poleX1, topY - 6).lineTo(poleX1, bottomY + 10)
    .stroke({ color: Color.hex(gray), width: 2, alpha: 0.38 });
  g.moveTo(poleX2, topY - 6).lineTo(poleX2, bottomY + 10)
    .stroke({ color: Color.hex(gray), width: 2, alpha: 0.38 });
  // Travessas em cada divisa de andar.
  for (let f = 0; f <= 4; f++) {
    const barY = shaftY + f * m.floorH;
    g.moveTo(poleX1, barY).lineTo(poleX1 + 16, barY)
      .stroke({ color: Color.hex(gray), width: 1.5, alpha: 0.30 });
    g.moveTo(poleX2 - 16, barY).lineTo(poleX2, barY)
      .stroke({ color: Color.hex(gray), width: 1.5, alpha: 0.30 });
  }

  // Cone do nariz — colorido (roxo) so depois da 1a peca; senao cinza.
  const noseColor = built >= 1 ? purple : gray;
  g.poly([cx, topY, bodyRight, noseEnd, bodyLeft, noseEnd])
    .fill(Color.hex(noseColor));
  const strokeC: RGBA = { r: noseColor.r * 0.75, g: noseColor.g * 0.75, b: noseColor.b * 0.75, a: 1 };
  g.poly([cx, topY, bodyRight, noseEnd, bodyLeft, noseEnd])
    .stroke({ color: Color.hex(strokeC), width: 1.5 });

  // Corpo — 4 secoes, cada uma e uma peca do foguete (indices 1-4).
  const sectionH = bodyH / 4;
  for (let i = 0; i < 4; i++) {
    const sy = noseEnd + i * sectionH;
    const pieceIdx = i + 1;
    const isBuilt = pieceIdx < built;     // peca ja pronta -> ciano cheio
    const isNext = pieceIdx === built;    // proxima peca -> ciano "fraco"
    let c: RGBA;
    if (isBuilt) {
      c = cyan;
    } else if (isNext) {
      c = { r: cyan.r * 0.55 + gray.r * 0.45, g: cyan.g * 0.55 + gray.g * 0.45, b: cyan.b * 0.55 + gray.b * 0.45, a: 1 };
    } else {
      c = gray;
    }
    g.rect(bodyLeft, sy, bodyW, sectionH).fill(Color.hex(c));
    g.rect(bodyLeft, sy, bodyW, sectionH)
      .stroke({ color: Color.hex(Color.rgb(0.12, 0.18, 0.15)), width: 1 });

    if (isBuilt) {
      // Linhas de chapeamento (detalhe so nas secoes prontas).
      for (let s = 1; s < 4; s++) {
        const ly = sy + sectionH * s / 4;
        g.moveTo(bodyLeft + 4, ly).lineTo(bodyRight - 4, ly)
          .stroke({ color: Color.hex(cyan), width: 0.8, alpha: 0.50 });
      }
      // Vigia (janela redonda) nas secoes do meio.
      if (i === 1 || i === 2) {
        const ph = 0.5 + 0.5 * Math.abs(Math.sin(t * 0.003 + i * 1.3));
        g.circle(cx, sy + sectionH * 0.5, 5.5)
          .fill({ color: Color.hex(Color.rgb(0.85, 0.92, 0.78)), alpha: ph });
        g.circle(cx, sy + sectionH * 0.5, 3)
          .fill({ color: 0xffffff, alpha: 0.55 * ph });
      }
    }
  }

  // Solda animada na fronteira entre o construido e o que falta.
  if (built > 0 && built < total) {
    const dashPulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.006));
    g.moveTo(bodyLeft - 5, buildY).lineTo(bodyRight + 5, buildY)
      .stroke({ color: Color.hex(amber), width: 1.8, alpha: 0.9 * dashPulse });
    g.circle(cx - 15, buildY, 2.4).fill({ color: Color.hex(amber), alpha: dashPulse });
    g.circle(cx + 15, buildY, 2.0).fill({ color: Color.hex(amber), alpha: 1 - dashPulse });
  }

  // Asas (engine fins) — terrosas so depois da 5a peca; senao cinza.
  const finColor = built >= 5 ? earth : gray;
  g.poly([bodyLeft, finTop, shaftX + 16, bottomY - 4, bodyLeft, finTop + finH * 0.55])
    .fill(Color.hex(finColor));
  g.poly([bodyRight, finTop, shaftX + shaftW - 16, bottomY - 4, bodyRight, finTop + finH * 0.55])
    .fill(Color.hex(finColor));

  // Brilho na base e jatos de chama (so quando ja ha pecas / motor pronto).
  if (built > 0) {
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(t * 0.002));
    g.ellipse(cx, bottomY, 18 + pulse * 10, 8)
      .fill({ color: Color.hex(amber), alpha: 0.22 * pulse });
    if (built >= 5) {
      for (let j = 0; j < 5; j++) {
        const fx = cx + (j - 2) * 7;
        const fLen = 10 + Math.abs(Math.sin(t * 0.004 + j * 0.9)) * 9;
        const fa: RGBA = { r: amber.r * pulse, g: amber.g * pulse, b: amber.b * pulse, a: 1 };
        g.moveTo(fx, bottomY).lineTo(fx + Math.sin(j * 1.4) * 2, bottomY + fLen)
          .stroke({ color: Color.hex(fa), width: 2.5 });
      }
    }
  }

  // Moldura do poco por cima de tudo.
  g.rect(shaftX, shaftY, shaftW, shaftH)
    .stroke({ color: Color.hex(Color.rgb(0.52, 0.46, 0.36)), width: 1.5, alpha: 0.9 });
}
