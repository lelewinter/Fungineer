// ============================================================================
// STEALTH — A FASE DE INFILTRACAO "BOLHA QUE COME BOLHA" (estilo Agar.io)
// ----------------------------------------------------------------------------
// O que e esta fase, em palavras simples:
//   - Voce e uma bolha silenciosa se esgueirando dentro de um enxame da IA.
//   - Bolhas MENORES que voce sao presas: encostar nelas come e te faz crescer.
//   - Bolhas MAIORES (predadores/patrulhas) te devoram se voce encostar nelas.
//   - O detalhe esperto (marca do Agar.io): quanto MAIOR voce fica, mais LENTO
//     fica. Crescer ajuda a comer pequenos, mas tambem te deixa exposto.
//   - Atingir a massa-alvo (ou termina-la com massa suficiente) vence a fase.
//
// Como se encaixa no jogo:
//   - E uma fase de raid. Usa a moldura compartilhada do RunFrame (HUD, tela de
//     fim, bindDrag). Ao vencer, deposita "ai_components" no bunker.
//
// A classe StealthScene continua exportada deste mesmo arquivo, entao nada
// quebra para quem usa esta fase.
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
const ZONE = ZONES[1]!;

// ── Numeros de balanceamento ────────────────────────────────────────────────
const START_R = 8;          // raio inicial do jogador (massa de partida)
const MAX_BASE_SPEED = 240; // velocidade quando voce esta pequeno (pixels/seg)
const MIN_SPEED = 80;       // velocidade minima quando voce esta enorme
const TIMER = GameConfig.STEALTH_RUN_TIMER;           // duracao da fase em segundos
const GOAL_MASS = 32;       // raio-alvo para vencer

// Uma bolha do mapa: posicao, velocidade de deriva, raio e se e predadora.
interface Blob { pos: Vec2; vel: Vec2; r: number; predator: boolean }

/** Fase de infiltracao: cresca comendo bolhas menores e fuja das maiores; massa
 *  maior te deixa mais lento. Veja o bloco no topo do arquivo. */
export class StealthScene extends RunScene {
  protected readonly zone = ZONE;

  private content = new Container();
  private bg = new Graphics();
  private blobsG = new Graphics();
  private playerG = new Graphics();

  private dragPos: Vec2 = { x: VW / 2, y: VH / 2 };
  private cleanupDrag!: () => void;

  private playerPos: Vec2 = { x: VW / 2, y: VH / 2 };  // posicao do jogador
  private playerR = START_R;  // raio atual do jogador (sua "massa")
  private blobs: Blob[] = [];  // todas as bolhas do mapa (presas e predadores)
  private timeLeft = TIMER;
  private elapsed = 0;
  private banked = 0;          // recompensa acumulada (Fragmentos de IA)

  /** A base monta HUD/juice/musica; aqui montamos o mundo, as bolhas e o input. */
  protected override onEnter(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x040806 });
    // Poeira de fundo: pontinhos espalhados so para dar profundidade.
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * VW;
      const y = 40 + Math.random() * (VH - 60);
      this.bg.circle(x, y, 1).fill({ color: accent, alpha: 0.08 + Math.random() * 0.1 });
    }
    // Enfeite de lore: fantasma da grade de vigilancia do ARGOS — cameras em intervalos regulares.
    for (let gy = 100; gy < VH - 20; gy += 120) {
      for (let gx = 40; gx < VW; gx += 110) {
        this.bg.rect(gx - 1, gy - 8, 2, 5).fill({ color: accent, alpha: 0.10 });
        this.bg.circle(gx, gy, 4).stroke({ color: accent, width: 1, alpha: 0.12 });
      }
    }
    // Alguns sensores que falharam (desenhados como "X").
    for (const [dx, dy] of [[120, 220], [300, 560], [70, 700]]) {
      this.bg.moveTo(dx! - 4, dy! - 4).lineTo(dx! + 4, dy! + 4)
        .moveTo(dx! + 4, dy! - 4).lineTo(dx! - 4, dy! + 4)
        .stroke({ color: 0x665544, width: 1, alpha: 0.22 });
    }
    this.content.addChild(this.bg);
    this.root.addChild(this.content);

    // Easter egg de lore: o comentario que Marcus deixou no codigo do ARGOS — a
    // calibracao que tornou os humanos invisiveis a sua tolerancia.
    const mc = new Text({
      text: '// HUMAN-WRITTEN — DO NOT AUTO-REFACTOR. M.C.',
      style: { fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 7, fill: 0x3f5a52, letterSpacing: 0.5 },
    });
    mc.anchor.set(0.5);
    mc.x = VW / 2;
    mc.y = VH - 24;
    this.content.addChild(mc);

    // Semeia o mapa: muitas presas pequenas, algumas medias e poucos predadores grandes.
    for (let i = 0; i < 24; i++) this.spawnBlob(3 + Math.random() * 3, false);
    for (let i = 0; i < 6; i++)  this.spawnBlob(7 + Math.random() * 3, false);
    for (let i = 0; i < 4; i++)  this.spawnBlob(14 + Math.random() * 5, true);

    this.content.addChild(this.blobsG, this.playerG);

    this.hud.setStatus('infiltração micótica');

    this.cleanupDrag = this.bindPointerEvents(
      (pos) => { this.dragPos.x = pos.x; this.dragPos.y = pos.y; },
      (pos) => { this.dragPos.x = pos.x; this.dragPos.y = pos.y; },
      () => undefined,
    );
  }

  /** A base para a musica e destroi o juice; aqui so soltamos o input. */
  protected override onExit(): void {
    this.cleanupDrag();
  }

  /** Stealth treme o conteudo do jogo (nao o root) com ambiente um pouco menor. */
  protected override buildJuice(): RunJuice {
    return new RunJuice(this.root, { accent: this.accentHex(), shakeTarget: this.content, ambient: 28 });
  }

  /** Quadro a quadro: move o jogador, deriva as bolhas e resolve quem come quem. */
  protected override onUpdate(d: number): void {
    this.elapsed += d;
    this.timeLeft -= d;
    // Acabou o tempo: vence se ja atingiu a massa-alvo.
    if (this.timeLeft <= 0) { this.end(this.playerR >= GOAL_MASS); return; }

    // Velocidade cai conforme a massa cresce — a desvantagem classica do Agar.io.
    const speed = Math.max(MIN_SPEED, MAX_BASE_SPEED - (this.playerR - START_R) * 7);
    const dx = this.dragPos.x - this.playerPos.x;
    const dy = this.dragPos.y - this.playerPos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) {
      const step = Math.min(dist, speed * d);
      this.playerPos.x += (dx / dist) * step;
      this.playerPos.y += (dy / dist) * step;
    }
    // Mantem o jogador dentro da tela (sem encostar nas bordas).
    this.playerPos.x = Math.max(this.playerR, Math.min(VW - this.playerR, this.playerPos.x));
    this.playerPos.y = Math.max(50 + this.playerR, Math.min(VH - this.playerR, this.playerPos.y));

    // Deriva as bolhas; ao bater na borda da tela elas quicam (invertem a velocidade).
    for (const b of this.blobs) {
      b.pos.x += b.vel.x * d;
      b.pos.y += b.vel.y * d;
      if (b.pos.x < b.r || b.pos.x > VW - b.r) b.vel.x *= -1;
      if (b.pos.y < 50 + b.r || b.pos.y > VH - b.r) b.vel.y *= -1;
    }

    // Resolve as colisoes do jogador com cada bolha: comer ou ser comido.
    for (let i = this.blobs.length - 1; i >= 0; i--) {
      const b = this.blobs[i]!;
      const dd = Math.hypot(b.pos.x - this.playerPos.x, b.pos.y - this.playerPos.y);
      if (dd < this.playerR + b.r * 0.6) {
        if (this.playerR > b.r + 1) {
          // Voce e maior: come a bolha e cresce por AREA (raiz da soma das areas),
          // por isso bolhas pequenas dao pouco e grandes dao bastante crescimento.
          const a = this.playerR * this.playerR + b.r * b.r * 0.6;
          this.playerR = Math.sqrt(a);
          this.banked += Math.max(1, Math.floor(b.r / 3));
          this.juice.pop(b.pos.x, b.pos.y);
          this.blobs.splice(i, 1);
          // As vezes repoe uma presa pequena para o mapa nao ficar vazio.
          if (Math.random() < 0.5) this.spawnBlob(3 + Math.random() * 3, false);
        } else if (b.r > this.playerR + 1) {
          // A bolha e maior: ela te devora e a run acaba.
          this.juice.hurt(this.playerPos.x, this.playerPos.y);
          this.end(false);
          return;
        }
      }
    }

    if (this.playerR >= GOAL_MASS) { this.end(true); return; }

    this.draw();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`sinal ${Math.floor(this.playerR)}/${GOAL_MASS}`);
    this.hud.setHealth(this.playerR / GOAL_MASS);
  }

  /** Cria uma bolha com raio "r" em posicao aleatoria, com deriva aleatoria.
   *  Se cairia muito perto do jogador, desiste (para nao nascer em cima dele). */
  private spawnBlob(r: number, predator: boolean): void {
    const x = 40 + Math.random() * (VW - 80);
    const y = 80 + Math.random() * (VH - 140);
    if (Math.hypot(x - this.playerPos.x, y - this.playerPos.y) < 80) return;
    const sp = predator ? 35 + Math.random() * 25 : 20 + Math.random() * 30;
    const ang = Math.random() * Math.PI * 2;
    this.blobs.push({
      pos: { x, y },
      vel: { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp },
      r,
      predator,
    });
  }

  /** Devolve os 6 vertices de um hexagono (usado para desenhar fragmentos). */
  private hexPts(cx: number, cy: number, rad: number): number[] {
    const p: number[] = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      p.push(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    return p;
  }

  /** Redesenha as bolhas e o jogador (chamado todo quadro). */
  private draw(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.blobsG.clear();
    for (const b of this.blobs) {
      // "Perigo" = predador OU qualquer bolha maior que voce agora (pode te comer).
      const danger = b.predator || b.r > this.playerR;
      const color = danger ? 0xc24d4d : accent;
      this.blobsG.circle(b.pos.x, b.pos.y, b.r + 2).fill({ color, alpha: 0.15 });
      if (danger) {
        // Patrulha ativa do ARGOS — bolha solida e fria (circulo).
        this.blobsG.circle(b.pos.x, b.pos.y, b.r).fill({ color, alpha: 0.7 });
        this.blobsG.circle(b.pos.x, b.pos.y, Math.max(0, b.r - 3)).fill({ color: 0xffffff, alpha: 0.35 });
      } else {
        // Fragmento de dado dormente (presa) — desenhado como hexagono.
        this.blobsG.poly(this.hexPts(b.pos.x, b.pos.y, b.r)).fill({ color, alpha: 0.7 });
        this.blobsG.poly(this.hexPts(b.pos.x, b.pos.y, Math.max(0, b.r - 3))).fill({ color: 0xffffff, alpha: 0.3 });
      }
    }

    this.playerG.clear();
    this.playerG.circle(this.playerPos.x, this.playerPos.y, this.playerR + 4).fill({ color: accent, alpha: 0.18 });
    this.playerG.circle(this.playerPos.x, this.playerPos.y, this.playerR).fill({ color: accent, alpha: 0.95 });
    this.playerG.circle(this.playerPos.x, this.playerPos.y, Math.max(0, this.playerR - 4)).fill({ color: 0xffffff, alpha: 0.7 });
  }

  /** Encerra a fase (uma vez so): efeito de fim, deposita recompensa se venceu,
   *  avisa o HubState e mostra a tela de fim. */
  private end(victory: boolean): void {
    if (this.ended) return; // protege contra deposito duplo
    if (victory && this.banked > 0) {
      HubState.depositFlow('ai_components', this.banked);
    }
    this.endRun(victory, {
      rewardLabel: `+${this.banked} Fragmentos de IA — absorvidos`,
      failLabel: 'Sinal detectado. ARGOS limpou a rota.',
    });
  }
}
