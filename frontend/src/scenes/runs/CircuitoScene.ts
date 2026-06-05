// ============================================================================
// CIRCUITO — A FASE "COBRINHA" (estilo Snake / Tron Light-Cycles)
// ----------------------------------------------------------------------------
// O que e esta fase, em palavras simples:
//   - Voce controla uma "cabeca" que segue o seu dedo/mouse pelo tabuleiro.
//   - Atras dela vem um rastro (trail) que cresce a cada "rele" coletado, igual
//     ao corpo da cobrinha. Cada coleta tambem deixa voce um pouco mais rapido.
//   - Encostar no proprio rastro = curto-circuito e voce perde a run. Sair da
//     moldura do tabuleiro tambem mata.
//   - Coletar a meta de reles antes do tempo acabar vence a fase.
//
// Como se encaixa no jogo:
//   - E uma das fases de raid. Herda de RunScene (a base compartilhada das zonas)
//     que cuida do HUD do topo, da tela de fim, do ciclo de musica/juice e do
//     input de ponteiro. Ao vencer, deposita "nucleo_logico" no bunker.
//
// A classe CircuitoScene continua exportada deste mesmo arquivo (o resto do jogo
// importa ela daqui), entao nada quebra para quem usa esta fase.
// ============================================================================

import { Container, Graphics, Text } from 'pixi.js';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
import { ZONES } from '../../state/Zones';
import type { Vec2 } from '../../core/types';
import { RunJuice } from '../../run/fx/RunJuice';
import { RunScene } from './RunScene';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;
const ZONE = ZONES[2]!;

// ── Numeros de balanceamento e tamanhos (em pixels / segundos) ──────────────
const HEAD_R = 9;            // raio da cabeca da cobrinha
const BASE_SPEED = 170;      // velocidade inicial (pixels por segundo)
const SPEED_PER_NODE = 9;    // quanto a velocidade sobe a cada rele coletado
const TRAIL_SEG_DIST = 14;   // distancia entre dois pontos do rastro
const NODE_R = 9;            // raio visual do rele a coletar
const COLLECT_DIST = 22;     // distancia para "encostar" e coletar o rele
const TIMER = GameConfig.CIRCUIT_RUN_TIMER;            // duracao da fase em segundos
const TRAIL_GRACE_SEGS = 5;  // ignora os N segmentos mais novos do rastro na auto-colisao
const GOAL = 14;             // quantos reles coletar para vencer

/** Fase "cobrinha". A cabeca segue o dedo; o rastro cresce a cada coleta e
 *  encostar nele perde a run. Veja o bloco no topo do arquivo. */
export class CircuitoScene extends RunScene {
  protected readonly zone = ZONE;

  private content = new Container();
  private bg = new Graphics();
  private trailG = new Graphics();
  private nodeG = new Graphics();
  private headG = new Graphics();

  // Alvo do ponteiro (atualizado pelo bindPointerEvents) e a funcao que remove
  // os listeners ao sair.
  private dragPos: Vec2 = { x: VW / 2, y: VH / 2 };
  private cleanupDrag!: () => void;

  private head: Vec2 = { x: VW / 2, y: VH / 2 };  // posicao da cabeca, em coordenadas do jogo
  private trail: Vec2[] = [];        // pontos do rastro, do mais antigo (cauda) ao mais novo
  private trailTarget = 6;           // tamanho-alvo do rastro (cresce a cada coleta)
  private nodes: Vec2[] = [];        // reles disponiveis no tabuleiro
  private collected = 0;             // quantos reles ja foram coletados
  private timeLeft = TIMER;
  private elapsed = 0;
  // Retangulo jogavel: deixa uma margem em cima para nao colidir com o HUD.
  private boundaryRect = { x: 6, y: 50, w: VW - 12, h: VH - 60 };

  /** A base monta HUD/juice/musica; aqui so montamos o mundo e o input. */
  protected override onEnter(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x02080a });
    // Trilhas de placa de circuito ao fundo (apenas enfeite): linhas finas
    // horizontais e verticais espalhadas para dar o clima de placa-mae.
    for (let i = 0; i < 30; i++) {
      const y = 40 + Math.random() * (VH - 100);
      this.bg.rect(0, y, VW, 1).fill({ color: accent, alpha: 0.06 });
    }
    for (let i = 0; i < 16; i++) {
      const x = Math.random() * VW;
      this.bg.rect(x, 40, 1, VH - 60).fill({ color: accent, alpha: 0.06 });
    }
    // Moldura do tabuleiro (a borda que mata se voce a ultrapassar).
    this.bg.rect(this.boundaryRect.x, this.boundaryRect.y, this.boundaryRect.w, this.boundaryRect.h)
      .stroke({ color: accent, width: 2, alpha: 0.6 });
    this.content.addChild(this.bg, this.trailG, this.nodeG, this.headG);
    this.root.addChild(this.content);

    // Easter egg de lore: assinatura "NERVE" — Marcus desenhou estes condutos.
    const sig = new Text({
      text: 'M.CHEN · NERVE v2.4',
      style: { fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 7, fill: 0x2f6a54, letterSpacing: 1 },
    });
    sig.anchor.set(1, 1);
    sig.x = this.boundaryRect.x + this.boundaryRect.w - 4;
    sig.y = this.boundaryRect.y + this.boundaryRect.h - 4;
    this.content.addChild(sig);

    this.spawnNodes(4); // comeca com 4 reles no tabuleiro

    // Liga o arraste do dedo/mouse; "dragPos" vira o alvo que a cabeca persegue.
    this.cleanupDrag = this.bindPointerEvents(
      (pos) => { this.dragPos.x = pos.x; this.dragPos.y = pos.y; },
      (pos) => { this.dragPos.x = pos.x; this.dragPos.y = pos.y; },
      () => undefined,
    );

    this.hud.setStatus('roteamento micótico');
  }

  /** A base para a musica e destroi o juice; aqui so soltamos o input. */
  protected override onExit(): void {
    this.cleanupDrag();
  }

  /** O Circuito treme o conteudo do jogo (nao o root) e usa mais esporos. */
  protected override buildJuice(): RunJuice {
    return new RunJuice(this.root, { accent: this.accentHex(), shakeTarget: this.content, ambient: 30 });
  }

  /** Quadro a quadro: move a cabeca rumo ao dedo, checa colisoes e coletas.
   *  `d` ja vem limitado pela base e ela ja retornou cedo se a run acabou. */
  protected override onUpdate(d: number): void {
    this.elapsed += d;
    this.timeLeft -= d;
    // Acabou o tempo: vence se ja coletou pelo menos metade da meta.
    if (this.timeLeft <= 0) { this.end(this.collected >= GOAL / 2); return; }

    // Move a cabeca em direcao ao ponteiro; quanto mais reles, mais rapida ela fica.
    const speed = BASE_SPEED + this.collected * SPEED_PER_NODE;
    const dx = this.dragPos.x - this.head.x;
    const dy = this.dragPos.y - this.head.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) {
      const step = Math.min(dist, speed * d); // nunca passa do ponteiro num so quadro
      this.head.x += (dx / dist) * step;
      this.head.y += (dy / dist) * step;
    }

    // Bateu na moldura do tabuleiro? Perdeu.
    const b = this.boundaryRect;
    if (this.head.x < b.x + HEAD_R || this.head.x > b.x + b.w - HEAD_R ||
        this.head.y < b.y + HEAD_R || this.head.y > b.y + b.h - HEAD_R) {
      this.end(false);
      return;
    }

    // Deixa um ponto de rastro a cada TRAIL_SEG_DIST pixels percorridos e descarta
    // os pontos mais antigos quando o rastro passa do tamanho-alvo (a cauda "anda").
    const last = this.trail[this.trail.length - 1];
    if (!last || Math.hypot(this.head.x - last.x, this.head.y - last.y) > TRAIL_SEG_DIST) {
      this.trail.push({ x: this.head.x, y: this.head.y });
      while (this.trail.length > this.trailTarget) this.trail.shift();
    }

    // Auto-colisao: encostou no proprio rastro? Pulamos os segmentos mais novos
    // (logo atras da cabeca), senao a cobrinha se mataria sozinha sempre.
    for (let i = 0; i < this.trail.length - TRAIL_GRACE_SEGS; i++) {
      const seg = this.trail[i]!;
      if (Math.hypot(seg.x - this.head.x, seg.y - this.head.y) < HEAD_R + 4) {
        this.end(false);
        return;
      }
    }

    // Coleta de reles: para cada rele encostado, soma pontos, cresce o rastro e
    // repoe um novo rele no lugar (mantendo o tabuleiro sempre com alvos).
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i]!;
      if (Math.hypot(n.x - this.head.x, n.y - this.head.y) < COLLECT_DIST) {
        this.juice.pop(n.x, n.y);
        this.nodes.splice(i, 1);
        this.collected += 1;
        this.trailTarget += 4;
        if (this.collected >= GOAL) { this.end(true); return; }
        this.spawnNodes(1); // repoe o rele coletado
      }
    }

    this.draw();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`relés ${this.collected}/${GOAL}`);
    this.hud.setHealth(this.collected / GOAL);
  }

  /** Cria N reles em posicoes aleatorias dentro do tabuleiro, longe da cabeca
   *  (ate 20 tentativas por rele para nao nascer em cima do jogador). */
  private spawnNodes(n: number): void {
    const b = this.boundaryRect;
    for (let i = 0; i < n; i++) {
      let tries = 20;
      while (tries-- > 0) {
        const x = b.x + 24 + Math.random() * (b.w - 48);
        const y = b.y + 24 + Math.random() * (b.h - 48);
        if (Math.hypot(x - this.head.x, y - this.head.y) > 40) {
          this.nodes.push({ x, y });
          break;
        }
      }
    }
  }

  /** Redesenha rastro, reles e cabeca (chamado todo quadro). */
  private draw(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.trailG.clear();
    for (let i = 0; i < this.trail.length; i++) {
      const seg = this.trail[i]!;
      const t = i / Math.max(1, this.trail.length - 1);
      this.trailG.circle(seg.x, seg.y, 5 + t * 2).fill({ color: accent, alpha: 0.4 + 0.4 * t });
    }

    this.nodeG.clear();
    const pulse = 0.5 + 0.5 * Math.sin(this.elapsed * 3); // brilho pulsante dos reles
    for (const n of this.nodes) {
      // Rele desenhado como um losango (diamante) com nucleo branco.
      this.nodeG.circle(n.x, n.y, NODE_R + 3).fill({ color: 0xffffff, alpha: 0.08 * pulse });
      this.nodeG.poly([n.x, n.y - NODE_R, n.x + NODE_R, n.y, n.x, n.y + NODE_R, n.x - NODE_R, n.y]).fill({ color: accent, alpha: 0.85 });
      this.nodeG.poly([n.x, n.y - 3.5, n.x + 3.5, n.y, n.x, n.y + 3.5, n.x - 3.5, n.y]).fill({ color: 0xffffff });
    }

    this.headG.clear();
    this.headG.circle(this.head.x, this.head.y, HEAD_R + 4).fill({ color: accent, alpha: 0.25 });
    this.headG.circle(this.head.x, this.head.y, HEAD_R).fill({ color: 0xffffff });
    this.headG.circle(this.head.x, this.head.y, HEAD_R - 3).fill({ color: accent });
  }

  /** Encerra a fase: deposita recompensa se venceu e delega o resto (juice,
   *  HubState, overlay, guarda de chamada-dupla) ao endRun() da base. */
  private end(victory: boolean): void {
    if (this.ended) return; // protege contra deposito duplo
    if (victory && this.collected > 0) {
      HubState.depositFlow('nucleo_logico', this.collected);
    }
    this.endRun(victory, {
      rewardLabel: `+${this.collected} Núcleo Lógico — relés ativados`,
      failLabel: 'Loop de ressonância. Circuito destruído.',
    });
  }
}
