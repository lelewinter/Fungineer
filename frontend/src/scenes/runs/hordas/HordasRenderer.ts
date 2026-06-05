// ============================================================================
// HORDAS — DESENHO DA ARENA E DO HUD (renderer)
// ----------------------------------------------------------------------------
// Toda a parte de "pintar a tela" da fase Hordas mora aqui. A cena (HordasScene)
// cuida da LOGICA (quem se move, quem leva dano, quanto XP cai); este arquivo so
// cuida de DESENHAR o resultado: jogador, inimigos, dardos, gemas, plantas,
// nodulos, explosoes, a grade de fundo e os textos do HUD.
//
// Separar "pensar" de "desenhar" deixa cada parte menor e mais facil de ler.
// O renderer nao decide nada do jogo — ele apenas le os dados atuais (atraves
// da interface HordasView) e os transforma em pixels nos objetos Graphics.
//
// Em PixiJS, cada Graphics e como uma folha de desenho: a cada frame nos
// limpamos a folha (clear) e redesenhamos tudo na posicao nova. Isso e normal
// num jogo em tempo real.
// ============================================================================

import { Container, Graphics, Text } from 'pixi.js';
import { Color } from '../../../core/Color';
import { FontFamily, TextColor } from '../../../core/typography';
import type { DragInput } from '../RunFrame';
import {
  AURA, FOREST, GRID, HARVEST_TIME, ORBIT, PLANTS, PLANT_TYPES,
  PLAYER_R, SHADOW, TAU, TOP, VH, VW, JOY_MAX,
} from './config';
import type { Enemy, Gem, Node, Nova, Plant, Proj } from './entities';

/**
 * "Janela de leitura" para o renderer: tudo o que ele precisa saber sobre o
 * estado do jogo para desenhar um frame. A HordasScene preenche estes campos
 * naturalmente, entao ela "encaixa" nesta interface sem nenhum trabalho extra.
 */
export interface HordasView {
  elapsed: number;
  player: { x: number; y: number };
  facing: number;
  hp: number;
  maxHp: number;
  hurtFlash: number;
  channeling: boolean;
  extractOpen: boolean;
  extractPos: { x: number; y: number };
  level: number;
  xp: number;
  xpNext: number;
  reward: number;
  rewardMult: number;
  orbitAngle: number;
  weapons: Record<'dart' | 'aura' | 'orbit' | 'nova', number>;
  buffs: Record<'red' | 'blue' | 'green' | 'gold' | 'purple' | 'orange', number>;
  enemies: Enemy[];
  projs: Proj[];
  gems: Gem[];
  novas: Nova[];
  plants: Plant[];
  nodes: Node[];
  boss: Enemy | null;
  drag: DragInput;
  joyOrigin: { x: number; y: number };
  // Modificadores de buff (calculados pela cena) que afetam o tamanho do desenho.
  areaMult: number;
  // Acha o inimigo mais proximo (a cena ja tem essa busca pronta).
  nearestEnemy(): Enemy | null;
}

export class HordasRenderer {
  // ── Camadas de desenho do MUNDO (movem junto com a camera) ────────────────
  readonly bgStatic = new Graphics();  // gradiente calmo + vinheta (desenhado uma vez so)
  readonly gridG = new Graphics();     // grade que rola (redesenhada por frame)
  readonly auraG = new Graphics();
  readonly extractG = new Graphics();
  readonly nodeG = new Graphics();
  readonly plantG = new Graphics();
  readonly gemG = new Graphics();
  readonly enemyG = new Graphics();
  readonly novaG = new Graphics();
  readonly projG = new Graphics();
  readonly orbitG = new Graphics();
  readonly playerG = new Graphics();

  // ── Camadas de TELA (HUD fixo, nao se mexe com a camera) ──────────────────
  readonly xpG = new Graphics();
  readonly joyG = new Graphics();
  readonly pointerG = new Graphics();
  readonly levelText: Text;
  readonly rewardText: Text;
  readonly buffText: Text;

  // Buffer reaproveitado para montar o texto de buffs sem criar lixo por frame.
  private readonly buffParts: string[] = [];

  constructor() {
    this.levelText = new Text({
      text: 'Nv 1',
      style: { fontFamily: FontFamily.mono, fontSize: 13, fill: TextColor.white, fontWeight: '700', dropShadow: SHADOW },
    });
    this.levelText.x = 8;
    this.levelText.y = TOP + 4;

    this.rewardText = new Text({
      text: '',
      style: { fontFamily: FontFamily.mono, fontSize: 13, fill: TextColor.amber, fontWeight: '700', dropShadow: SHADOW },
    });
    this.rewardText.anchor.set(1, 0);
    this.rewardText.x = VW - 8;
    this.rewardText.y = TOP + 4;

    this.buffText = new Text({
      text: '',
      style: { fontFamily: FontFamily.mono, fontSize: 12, fill: TextColor.bio, fontWeight: '700', dropShadow: SHADOW },
    });
    this.buffText.x = 8;
    this.buffText.y = TOP + 30;
  }

  /** Coloca as camadas do mundo dentro do container da camera, na ordem certa. */
  attachWorldLayers(camera: Container): void {
    camera.addChild(
      this.auraG, this.extractG, this.nodeG, this.plantG, this.gemG, this.enemyG,
      this.novaG, this.projG, this.orbitG, this.playerG,
    );
  }

  /** Coloca o HUD de tela (XP, textos, joystick, setas) no overlay. */
  attachOverlayLayers(overlay: Container): void {
    overlay.addChild(this.pointerG, this.xpG, this.levelText, this.rewardText, this.buffText, this.joyG);
  }

  // ── Conversao mundo -> tela (a camera segue o jogador no centro) ──────────
  private sx(view: HordasView, wx: number): number { return wx + (VW / 2 - view.player.x); }
  private sy(view: HordasView, wy: number): number { return wy + (VH / 2 - view.player.y); }

  /** Fundo fixo: um degrade escuro de cima para baixo + uma vinheta sutil.
   *  Desenhado uma unica vez (nao muda durante a partida). */
  buildBackground(): void {
    const steps = 26;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const c = Color.rgb(0.03 + t * 0.015, 0.075 + t * 0.06, 0.05 + t * 0.035);
      this.bgStatic.rect(0, (VH * i) / steps, VW, VH / steps + 1).fill(Color.hex(c));
    }
    for (let k = 0; k < 6; k++) {
      const inset = k * 7;
      this.bgStatic.rect(inset, inset, VW - inset * 2, VH - inset * 2).stroke({ color: 0x000000, width: 8, alpha: 0.05 });
    }
  }

  /** Grade de fundo que rola conforme o jogador anda, dando sensacao de movimento. */
  private drawGrid(view: HordasView): void {
    this.gridG.clear();
    const camX = view.player.x - VW / 2;
    const camY = view.player.y - VH / 2;
    // O resto da divisao posiciona a primeira linha de modo que a grade pareca
    // infinita e continua, em vez de "pular" quando andamos uma celula inteira.
    const sx = -(((camX % GRID) + GRID) % GRID);
    const sy = -(((camY % GRID) + GRID) % GRID);
    for (let x = sx; x <= VW; x += GRID) this.gridG.moveTo(x, 0).lineTo(x, VH);
    for (let y = sy; y <= VH; y += GRID) this.gridG.moveTo(0, y).lineTo(VW, y);
    this.gridG.stroke({ color: 0x2c5a36, width: 1, alpha: 0.10 });
  }

  /** Desenha o mundo inteiro (chamado uma vez por frame). */
  drawWorld(view: HordasView): void {
    const t = view.elapsed;
    this.drawGrid(view);

    // Aura de esporos ao redor do jogador (so se a arma estiver ativa).
    this.auraG.clear();
    if (view.weapons.aura > 0) {
      const r = AURA.r[view.weapons.aura - 1]! * view.areaMult;
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      this.auraG.circle(view.player.x, view.player.y, r).fill({ color: FOREST, alpha: 0.05 + 0.04 * pulse });
      this.auraG.circle(view.player.x, view.player.y, r).stroke({ color: FOREST, width: 1.5, alpha: 0.25 + 0.15 * pulse });
    }

    // Nodulos de biomassa — vagens ambar; o que esta sendo coletado mostra um anel de progresso.
    this.nodeG.clear();
    for (const nd of view.nodes) {
      const pulse = 0.6 + 0.4 * Math.sin(t * 2.5 + nd.phase);
      this.nodeG.circle(nd.pos.x, nd.pos.y, 20).fill({ color: 0xffd36b, alpha: 0.08 * pulse });
      for (let k = 0; k < 3; k++) {
        const a = nd.phase + (k / 3) * TAU;
        this.nodeG.circle(nd.pos.x + Math.cos(a) * 5, nd.pos.y + Math.sin(a) * 5, 5).fill({ color: 0xe0a83a, alpha: 0.95 });
      }
      this.nodeG.circle(nd.pos.x, nd.pos.y, 4).fill({ color: 0xfff0c0, alpha: 0.9 });
      if (nd.progress > 0) {
        const prog = Math.min(1, nd.progress / HARVEST_TIME);
        this.nodeG.arc(nd.pos.x, nd.pos.y, 22, -Math.PI / 2, -Math.PI / 2 + TAU * prog, false)
          .stroke({ color: 0xfff0a0, width: 3.5, alpha: 0.95 });
      }
    }

    // Plantas de buff.
    this.plantG.clear();
    for (const p of view.plants) {
      const def = PLANTS[p.type];
      const heal = p.type === 'orange';  // o cogumelo de cura brilha mais
      const pulse = 0.6 + 0.4 * Math.sin(t * 3 + p.phase);
      // Halo: maior e mais intenso no cogumelo laranja brilhante.
      this.plantG.circle(p.pos.x, p.pos.y, heal ? 22 : 17).fill({ color: def.color, alpha: (heal ? 0.22 : 0.12) * pulse });
      this.plantG.circle(p.pos.x, p.pos.y, heal ? 22 : 17).stroke({ color: def.color, width: heal ? 2 : 1.5, alpha: heal ? 0.6 : 0.4 });
      this.plantG.rect(p.pos.x - 2, p.pos.y, 4, 9).fill({ color: 0xe6e0c8, alpha: 0.9 });
      this.plantG.ellipse(p.pos.x, p.pos.y, heal ? 10 : 9, heal ? 7 : 6).fill({ color: def.color, alpha: 0.95 });
      this.plantG.ellipse(p.pos.x, p.pos.y - 1, 4, 2.6).fill({ color: 0xffffff, alpha: 0.7 * pulse });
      // Cruzinha branca de "vida" no chapeu do cogumelo de cura.
      if (heal) {
        this.plantG.rect(p.pos.x - 3.2, p.pos.y - 1, 6.4, 2).fill({ color: 0xffffff, alpha: 0.95 });
        this.plantG.rect(p.pos.x - 1, p.pos.y - 3.2, 2, 6.4).fill({ color: 0xffffff, alpha: 0.95 });
      }
    }

    // Farol de extracao (so aparece quando a extracao abre).
    this.extractG.clear();
    if (view.extractOpen) {
      const p = 0.5 + 0.5 * Math.sin(t * 5);
      this.extractG.circle(view.extractPos.x, view.extractPos.y, 22 + p * 5).stroke({ color: FOREST, width: 2, alpha: 0.5 });
      this.extractG.circle(view.extractPos.x, view.extractPos.y, 13).fill({ color: FOREST, alpha: 0.3 + 0.3 * p });
      this.extractG.circle(view.extractPos.x, view.extractPos.y, 6).fill({ color: 0xffffff, alpha: 0.8 });
    }

    // Gemas de XP.
    this.gemG.clear();
    for (const g of view.gems) {
      const big = g.value >= 5;
      const col = big ? 0xffd36b : 0x9fffe0;
      this.gemG.circle(g.pos.x, g.pos.y, big ? 4.5 : 3).fill({ color: col, alpha: 0.95 });
      this.gemG.circle(g.pos.x, g.pos.y, big ? 7 : 5).fill({ color: col, alpha: 0.2 });
    }

    // Inimigos. O boss tem desenho especial (com barra de vida).
    this.enemyG.clear();
    for (const e of view.enemies) {
      const c = e.flash > 0 ? 0xffffff : e.color;  // pisca branco ao levar dano
      if (e.kind === 'boss') {
        this.enemyG.circle(e.pos.x, e.pos.y, e.r + 4).fill({ color: 0xff3a3a, alpha: 0.12 });
        this.enemyG.rect(e.pos.x - e.r, e.pos.y - e.r, e.r * 2, e.r * 2).fill({ color: c });
        this.enemyG.rect(e.pos.x - e.r, e.pos.y - e.r, e.r * 2, e.r * 2).stroke({ color: 0xffb0c0, width: 2, alpha: 0.7 });
        this.enemyG.circle(e.pos.x, e.pos.y, 5).fill({ color: 0xff3a3a });
        const w = e.r * 2;
        this.enemyG.rect(e.pos.x - e.r, e.pos.y - e.r - 7, w, 3).fill({ color: 0x301015, alpha: 0.9 });
        this.enemyG.rect(e.pos.x - e.r, e.pos.y - e.r - 7, w * (e.hp / e.maxHp), 3).fill({ color: 0xff5a6a, alpha: 0.95 });
        continue;
      }
      this.enemyG.rect(e.pos.x - e.r, e.pos.y - e.r + 2, e.r * 2, e.r * 2 - 2).fill({ color: c });
      this.enemyG.rect(e.pos.x - e.r, e.pos.y - e.r + 2, e.r * 2, e.r * 2 - 2).stroke({ color: 0x7a8694, width: 1, alpha: 0.6 });
      this.enemyG.moveTo(e.pos.x - e.r, e.pos.y - 4).lineTo(e.pos.x - e.r - 4, e.pos.y - 7)
        .moveTo(e.pos.x + e.r, e.pos.y - 4).lineTo(e.pos.x + e.r + 4, e.pos.y - 7)
        .stroke({ color: 0x8a96a4, width: 1.5, alpha: 0.7 });
      const blink = 0.6 + 0.4 * Math.sin(t * 6 + e.pos.x);  // "olho" vermelho piscando
      this.enemyG.circle(e.pos.x, e.pos.y, 2.6).fill({ color: 0xff3a3a, alpha: 0.6 + 0.4 * blink });
    }

    // Aneis de explosao (nova).
    this.novaG.clear();
    for (const nv of view.novas) {
      this.novaG.circle(nv.x, nv.y, nv.r).stroke({ color: FOREST, width: 3, alpha: 0.6 * (nv.life / 0.45) });
    }

    // Dardos.
    this.projG.clear();
    for (const p of view.projs) {
      this.projG.circle(p.pos.x, p.pos.y, 3).fill({ color: 0x9fffe0, alpha: 0.95 });
      this.projG.circle(p.pos.x, p.pos.y, 5).fill({ color: 0x9fffe0, alpha: 0.25 });
    }

    // Bulbos orbitais girando ao redor do jogador.
    this.orbitG.clear();
    if (view.weapons.orbit > 0) {
      const lv = view.weapons.orbit;
      const count = ORBIT.count[lv - 1]!;
      const r = ORBIT.r[lv - 1]!;
      for (let b = 0; b < count; b++) {
        const a = view.orbitAngle + (b / count) * TAU;
        const bx = view.player.x + Math.cos(a) * r;
        const by = view.player.y + Math.sin(a) * r;
        this.orbitG.circle(bx, by, 7).fill({ color: FOREST, alpha: 0.9 });
        this.orbitG.circle(bx, by, 4).fill({ color: 0xffffff, alpha: 0.7 });
      }
    }

    // Paulo (jogador). Um anel de alerta pulsa enquanto ele coleta (exposto).
    this.playerG.clear();
    const pc = view.hurtFlash > 0.4 ? 0xff5a5a : FOREST;
    const px = view.player.x;
    const py = view.player.y;
    if (view.channeling) {
      const wp = 0.5 + 0.5 * Math.sin(t * 9);
      this.playerG.circle(px, py, PLAYER_R + 7).stroke({ color: 0xffcf4d, width: 2.5, alpha: 0.4 + 0.45 * wp });
    }
    this.playerG.circle(px, py, PLAYER_R + 4).fill({ color: pc, alpha: 0.2 });
    this.playerG.circle(px, py, PLAYER_R).fill({ color: pc, alpha: 0.95 });
    this.playerG.circle(px, py, PLAYER_R - 4).fill({ color: 0xffffff, alpha: 0.65 });
    // Quando nao esta coletando, uma "mira" aponta para o inimigo mais proximo.
    if (!view.channeling) {
      const tgt = view.nearestEnemy();
      const a = tgt ? Math.atan2(tgt.pos.y - py, tgt.pos.x - px) : view.facing;
      this.playerG.moveTo(px, py).lineTo(px + Math.cos(a) * (PLAYER_R + 8), py + Math.sin(a) * (PLAYER_R + 8))
        .stroke({ color: 0x9fffe0, width: 3, alpha: 0.8 });
    }
  }

  /** Desenha o HUD fixo de tela: barra de XP, nivel, recompensa, buffs, setas e joystick. */
  drawHudOverlay(view: HordasView): void {
    // Barra de XP no topo.
    this.xpG.clear();
    const x = 8;
    const w = VW - 16;
    const y = TOP + 22;
    this.xpG.rect(x, y, w, 5).fill({ color: 0x09140f, alpha: 0.92 });
    this.xpG.rect(x, y, w * Math.max(0, Math.min(1, view.xp / view.xpNext)), 5).fill({ color: FOREST, alpha: 0.98 });
    this.xpG.rect(x, y, w, 5).stroke({ color: 0x0a0d0e, width: 1, alpha: 0.6 });
    this.levelText.text = `Nv ${view.level}`;

    // Medidor de recompensa — cresce com o tempo e a sobre-coleta, para tentar o jogador a ficar.
    this.rewardText.text = `BIOMASSA ${view.reward}  ×${view.rewardMult.toFixed(1)}`;

    // Buffs ativos como texto com contagem regressiva (usa buffer reaproveitado).
    const parts = this.buffParts;
    parts.length = 0;
    for (const type of PLANT_TYPES) {
      if (view.buffs[type] > 0) parts.push(`${PLANTS[type].short} ${Math.ceil(view.buffs[type])}s`);
    }
    this.buffText.text = parts.join('   ');

    // Setas que apontam para o farol de extracao / boss quando estao fora da tela.
    this.pointerG.clear();
    if (view.extractOpen) this.drawPointer(view, view.extractPos.x, view.extractPos.y, FOREST);
    if (view.boss) this.drawPointer(view, view.boss.pos.x, view.boss.pos.y, 0xff5a6a);

    // Joystick flutuante (so aparece enquanto o dedo esta na tela).
    this.joyG.clear();
    if (view.drag.dragging) {
      const ox = view.joyOrigin.x;
      const oy = view.joyOrigin.y;
      const dx = view.drag.pos.x - ox;
      const dy = view.drag.pos.y - oy;
      const len = Math.hypot(dx, dy) || 1;
      const clamp = Math.min(len, JOY_MAX);
      const tx = ox + (dx / len) * clamp;
      const ty = oy + (dy / len) * clamp;
      this.joyG.circle(ox, oy, JOY_MAX).stroke({ color: FOREST, width: 2, alpha: 0.18 });
      this.joyG.circle(ox, oy, 6).fill({ color: FOREST, alpha: 0.25 });
      this.joyG.circle(tx, ty, 16).fill({ color: FOREST, alpha: 0.35 });
    }
  }

  /** Desenha uma seta na borda da tela apontando para um alvo que esta fora dela.
   *  Se o alvo ja estiver visivel, nao desenha nada. */
  private drawPointer(view: HordasView, wx: number, wy: number, color: number): void {
    const m = 26;
    const px = this.sx(view, wx);
    const py = this.sy(view, wy);
    if (px >= m && px <= VW - m && py >= TOP + m && py <= VH - m) return;
    const cx = VW / 2;
    const cy = VH / 2;
    const ang = Math.atan2(py - cy, px - cx);
    const ex = Math.max(m, Math.min(VW - m, px));
    const ey = Math.max(TOP + m, Math.min(VH - m, py));
    const s = 9;
    this.pointerG
      .poly([
        ex + Math.cos(ang) * s, ey + Math.sin(ang) * s,
        ex + Math.cos(ang + 2.4) * s, ey + Math.sin(ang + 2.4) * s,
        ex + Math.cos(ang - 2.4) * s, ey + Math.sin(ang - 2.4) * s,
      ])
      .fill({ color, alpha: 0.9 });
  }
}
