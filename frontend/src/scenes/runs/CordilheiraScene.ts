// ============================================================================
// CORDILHEIRA — A FASE DE ATRAVESSAR FAIXAS PERIGOSAS (estilo Frogger)
// ----------------------------------------------------------------------------
// O que e esta fase, em palavras simples:
//   - A tela e dividida em faixas horizontais. Faixas de "rua" tem ameacas
//     (rondas) deslizando para os lados; faixas "seguras" sao becos sem perigo.
//   - Voce arrasta para CIMA para pular uma faixa, ou para os LADOS para deslizar.
//   - Encostar numa ameaca enquanto esta numa faixa de rua = perde a run.
//   - Chegar na faixa do topo (telhado) conta uma travessia; faca 3 travessias
//     antes do tempo para vencer.
//
// Como se encaixa no jogo:
//   - E uma fase de raid. Usa a moldura compartilhada do RunFrame (HUD, tela de
//     fim). Ao vencer, deposita "scrap" no bunker.
//
// A classe CordilheiraScene continua exportada deste mesmo arquivo, entao nada
// quebra para quem usa esta fase.
// ============================================================================

import { Container, Graphics, Text } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { FontFamily, TextColor } from '../../core/typography';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
import { ZONES } from '../../state/Zones';
import { RunJuice } from '../../run/fx/RunJuice';
import { buildHud, buildEndOverlay, type RunHud } from './RunFrame';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;
const ZONE = ZONES[8]!;

// ── Tamanhos e tempos ────────────────────────────────────────────────────────
const TOP = 60;              // margem superior reservada para o HUD
const FOOT = 80;            // margem inferior
const ROW_H = 60;           // altura de cada faixa
const ROW_COUNT = Math.floor((VH - TOP - FOOT) / ROW_H);  // quantas faixas cabem
const HOP = 0.18;           // duracao da animacao de pulo, em segundos
const TIMER = 75;           // duracao da fase em segundos

// Uma ameaca numa faixa: sua posicao horizontal e sua largura.
interface Hazard { x: number; w: number }
// Uma faixa: posicao vertical, direcao e velocidade do trafego, suas ameacas e o tipo.
interface Lane { y: number; dir: 1 | -1; speed: number; hazards: Hazard[]; kind: 'road' | 'safe' | 'goal' }

/** Fase de travessia: pule e deslize entre faixas, fugindo das rondas, ate o
 *  telhado, 3 vezes. Veja o bloco no topo do arquivo. */
export class CordilheiraScene extends Scene {
  private content = new Container();
  private bg = new Graphics();
  private lanesG = new Graphics();
  private hazardsG = new Graphics();
  private playerG = new Graphics();
  private hud!: RunHud;
  private statusLabel!: Text;
  private juice!: RunJuice;

  private lanes: Lane[] = [];          // todas as faixas, de cima (goal) para baixo
  private px = VW / 2;                 // posicao horizontal do jogador
  private rowIdx = ROW_COUNT - 1;      // indice da faixa atual (comeca na de baixo)
  private hopAnim = 0;                 // progresso do pulo vertical: 0 = pulando, 1 = parado
  private fromY = 0;                   // altura de onde o pulo comeca
  private toY = 0;                     // altura onde o pulo termina
  private banked = 0;                  // travessias concluidas
  private elapsed = 0;
  private timeLeft = TIMER;
  private ended = false;
  private pointerStart = { x: 0, y: 0 };  // onde o arraste atual comecou
  private dragging = false;
  private cleanup: (() => void) | null = null;

  /** Monta as faixas (alternando rua/seguro), o HUD e os toques. */
  override async enter(): Promise<void> {
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x07070a });
    this.content.addChild(this.bg);
    this.root.addChild(this.content);

    // Monta as faixas alternando rua (par) e seguro (impar); a do topo e o objetivo.
    for (let i = 0; i < ROW_COUNT; i++) {
      const y = TOP + i * ROW_H;
      let kind: 'road' | 'safe' | 'goal' = i % 2 === 0 ? 'road' : 'safe';
      if (i === 0) kind = 'goal';
      const dir = (i % 2 === 0 ? 1 : -1) as 1 | -1;   // ruas alternam o sentido do trafego
      const speed = 40 + (ROW_COUNT - i) * 8;          // faixas mais altas sao mais rapidas
      const hazards: Hazard[] = [];
      if (kind === 'road') {
        // Espalha ameacas pela faixa com larguras e espacos aleatorios.
        let x = -Math.random() * 60;
        while (x < VW + 60) {
          const w = 30 + Math.random() * 40;
          hazards.push({ x, w });
          x += w + 50 + Math.random() * 60;
        }
      }
      this.lanes.push({ y, dir, speed, hazards, kind });
    }

    // Comeca parado no centro da faixa de baixo.
    this.fromY = this.toY = TOP + this.rowIdx * ROW_H + ROW_H / 2;

    this.content.addChild(this.lanesG, this.hazardsG, this.playerG);
    this.drawLanes();

    this.juice = new RunJuice(this.root, { accent: Color.hex(ZONE.accent_color), shakeTarget: this.content, ambient: 26 });

    this.hud = buildHud(ZONE);
    this.root.addChild(this.hud.container);
    this.hud.setStatus('travessia urbana');

    this.statusLabel = new Text({
      text: 'arraste para pular',
      style: { fontFamily: FontFamily.mono, fontSize: 10, fill: TextColor.muted, letterSpacing: 1 },
    });
    this.statusLabel.anchor.set(0.5);
    this.statusLabel.x = VW / 2;
    this.statusLabel.y = VH - 50;
    this.root.addChild(this.statusLabel);

    // Easter egg de lore: portas ainda de pe, numeros apenas (nunca explicados).
    const doorStyle = { fontFamily: FontFamily.mono, fontSize: 8, fill: 0x55504a };
    for (const [num, ry] of [['412', 0.4], ['419', 0.72]] as Array<[string, number]>) {
      const d = new Text({ text: num, style: doorStyle });
      d.anchor.set(1, 0.5);
      d.x = VW - 8;
      d.y = TOP + (VH - TOP - FOOT) * ry;
      this.content.addChild(d);
    }

    this.bindPointer();

    if (ZONE.music) {
      audioManager.playMusic(ZONE.music, { loop: true, volume: 0.3, fadeMs: 400 }).catch(() => undefined);
    }
  }

  /** Limpa musica, listeners de toque e efeitos ao sair da fase. */
  override exit(): void {
    audioManager.stopMusic(300);
    this.cleanup?.();
    this.juice.destroy();
  }

  /** Quadro a quadro: move as ameacas, anima o pulo, checa colisao e a chegada. */
  override update(dt: number): void {
    const d = Math.min(dt, 1 / 30); // limita o delta time contra travadas
    this.juice.update(d);
    if (this.ended) return;
    this.elapsed += d;
    this.timeLeft -= d;
    if (this.timeLeft <= 0) { this.end(false); return; } // tempo esgotado: perdeu

    // Move as ameacas no sentido da faixa; ao sair de um lado, reaparecem no outro.
    for (const lane of this.lanes) {
      for (const h of lane.hazards) {
        h.x += lane.dir * lane.speed * d;
        if (lane.dir > 0 && h.x > VW + 80) h.x = -h.w - 30;
        if (lane.dir < 0 && h.x < -h.w - 30) h.x = VW + 30;
      }
    }

    // Avanca a animacao de pulo rumo a 1 (parado).
    if (this.hopAnim < 1) {
      this.hopAnim = Math.min(1, this.hopAnim + d / HOP);
    }

    // Colisao: so morre se estiver PARADO numa faixa de rua e tocar uma ameaca.
    const currentLane = this.lanes[this.rowIdx];
    if (currentLane && currentLane.kind === 'road' && this.hopAnim >= 1) {
      const py = currentLane.y + ROW_H / 2;
      for (const h of currentLane.hazards) {
        if (this.px + 12 > h.x && this.px - 12 < h.x + h.w && Math.abs(py - this.playerY()) < 16) {
          this.juice.hurt(this.px, this.playerY());
          this.end(false);
          return;
        }
      }
    }

    // Chegou no telhado (faixa 0): conta travessia e volta ao inicio. 3 = vitoria.
    if (this.rowIdx === 0 && this.hopAnim >= 1) {
      this.juice.pop(this.px, this.playerY());
      this.banked += 1;
      this.rowIdx = ROW_COUNT - 1;
      this.fromY = TOP + this.rowIdx * ROW_H + ROW_H / 2;
      this.toY = this.fromY;
      this.hopAnim = 1;
      if (this.banked >= 3) { this.end(true); return; }
    }

    this.draw();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`travessias ${this.banked}/3`);
    this.hud.setHealth(this.banked / 3);
  }

  /** Altura atual do jogador na tela, interpolada durante a animacao de pulo. */
  private playerY(): number {
    return this.fromY + (this.toY - this.fromY) * this.hopAnim;
  }

  /** Liga o arraste: cima/baixo pula uma faixa; lados deslizam o jogador. */
  private bindPointer(): void {
    const canvas = this.app.pixi.canvas;
    // Converte a coordenada do clique do navegador para coordenadas do jogo.
    const toLocal = (e: PointerEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const scale = this.app.world.scale.x || 1;
      return {
        x: (e.clientX - rect.left - this.app.world.x) / scale,
        y: (e.clientY - rect.top - this.app.world.y) / scale,
      };
    };
    const onDown = (e: PointerEvent): void => { this.dragging = true; this.pointerStart = toLocal(e); };
    const onMove = (e: PointerEvent): void => {
      if (!this.dragging) return;
      const p = toLocal(e);
      const dx = p.x - this.pointerStart.x;
      const dy = p.y - this.pointerStart.y;
      // So reage se o arraste passou de 18 px e o jogador nao esta no meio de um pulo.
      if (Math.hypot(dx, dy) > 18 && this.hopAnim >= 1) {
        if (Math.abs(dy) > Math.abs(dx)) {
          // Gesto mais vertical: pula uma faixa para cima ou para baixo.
          const nextRow = Math.max(0, Math.min(ROW_COUNT - 1, this.rowIdx + (dy < 0 ? -1 : 1)));
          if (nextRow !== this.rowIdx) {
            this.fromY = this.playerY();
            this.toY = TOP + nextRow * ROW_H + ROW_H / 2;
            this.rowIdx = nextRow;
            this.hopAnim = 0;
            this.juice.jump(this.px, this.toY);
          }
        } else {
          // Gesto mais horizontal: desliza para o lado (limitado a tela).
          this.px = Math.max(16, Math.min(VW - 16, this.px + (dx > 0 ? 36 : -36)));
        }
        // "Reancorar" o gesto permite varios movimentos num arraste continuo.
        this.pointerStart = p;
      }
    };
    const onUp = (): void => { this.dragging = false; };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    this.cleanup = (): void => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }

  /** Desenha o fundo fixo das faixas (chamado uma vez; nao muda no jogo). */
  private drawLanes(): void {
    this.lanesG.clear();
    for (const lane of this.lanes) {
      let bgColor = 0x0c1216;
      if (lane.kind === 'road') bgColor = 0x14181f;
      if (lane.kind === 'goal') bgColor = 0x243410; // telhado — ceu aberto, mais claro
      this.lanesG.rect(0, lane.y, VW, ROW_H).fill({ color: bgColor });
      this.lanesG.rect(0, lane.y, VW, 1).fill({ color: 0xffffff, alpha: 0.08 });
      if (lane.kind === 'road') {
        // Faixa central tracejada da rua.
        for (let x = 0; x < VW; x += 24) {
          this.lanesG.rect(x, lane.y + ROW_H / 2 - 1, 12, 2).fill({ color: 0xffffff, alpha: 0.15 });
        }
      } else if (lane.kind === 'safe') {
        // Enfeite de lore: um varal ainda estendido no beco que ninguem buscou.
        const ly = lane.y + 14;
        this.lanesG.moveTo(16, ly).lineTo(VW - 16, ly).stroke({ color: 0x3a3a42, width: 1, alpha: 0.4 });
        const cloth = [0x6a7a8a, 0x8a6a5a, 0x5a6a6a, 0x7a7050];
        for (let cx = 36, k = 0; cx < VW - 30; cx += 48, k++) {
          this.lanesG.rect(cx, ly, 9, 13).fill({ color: cloth[k % cloth.length]!, alpha: 0.3 });
        }
      }
    }
  }

  /** Redesenha as ameacas (que se movem) e o jogador (chamado todo quadro). */
  private draw(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.hazardsG.clear();
    for (const lane of this.lanes) {
      for (const h of lane.hazards) {
        this.hazardsG.rect(h.x, lane.y + ROW_H * 0.28, h.w, ROW_H * 0.44)
          .fill({ color: 0xc24d4d, alpha: 0.9 })
          .stroke({ color: 0xffffff, width: 1, alpha: 0.4 });
      }
    }
    this.playerG.clear();
    const py = this.playerY();
    // "hop" vai de 0 a 1 e volta a 0 durante o pulo, criando o saltinho vertical.
    const hop = 1 - Math.abs(this.hopAnim * 2 - 1);
    const r = 12;
    this.playerG.circle(this.px, py - hop * 8, r + 3).fill({ color: accent, alpha: 0.22 });
    this.playerG.circle(this.px, py - hop * 8, r).fill({ color: accent });
    this.playerG.circle(this.px, py - hop * 8, r - 4).fill({ color: 0xffffff });
  }

  /** Encerra a fase (uma vez so): efeito de fim, recompensa se venceu, avisa o
   *  HubState e mostra a tela de fim. */
  private end(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
    if (victory && this.banked > 0) {
      // Nao existe um recurso "memorias_coletivas"; depositamos como scrap
      // (2 por travessia), tematicamente equivalente.
      HubState.depositFlow('scrap', this.banked * 2);
    }
    HubState.onRunEnded(victory);
    this.root.addChild(buildEndOverlay({
      zone: ZONE,
      victory,
      rewardLabel: `+${this.banked * 2} Memórias Coletivas — travessias concluídas`,
      failLabel: 'Bloqueado pela ronda. Recue.',
    }));
  }
}
