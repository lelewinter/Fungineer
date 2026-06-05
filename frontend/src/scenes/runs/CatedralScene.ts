// ============================================================================
// CATEDRAL — A FASE DA PIRAMIDE ISOMETRICA (estilo Q*bert)
// ----------------------------------------------------------------------------
// O que e esta fase, em palavras simples:
//   - Ha uma piramide vista "de cima e de lado" (isometrica), feita de degraus
//     em forma de losango. Voce comeca no topo dela.
//   - Tocar num degrau vizinho faz o personagem pular ate ele e ACENDE aquele
//     degrau (coletando uma reliquia). O objetivo e acender TODOS os degraus.
//   - De tempos em tempos caem "ameacas" (sondas do ARGOS) que descem pela
//     piramide saltando de degrau em degrau. Se uma cair em cima de voce, perde.
//   - Acender tudo vence; ficar com 70%+ aceso quando o tempo acaba tambem vence.
//
// Como se encaixa no jogo:
//   - E uma fase de raid. Usa a moldura compartilhada do RunFrame (HUD, tela de
//     fim). Ao vencer, deposita "fragmentos_estruturais" no bunker.
//
// A classe CatedralScene continua exportada deste mesmo arquivo, entao nada
// quebra para quem usa esta fase.
// ============================================================================

import { Container, Graphics } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
import { ZONES } from '../../state/Zones';
import { RunJuice } from '../../run/fx/RunJuice';
import { buildHud, buildEndOverlay, type RunHud } from './RunFrame';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;
const ZONE = ZONES[10]!;

// ── Tamanhos e tempos ────────────────────────────────────────────────────────
const PYRAMID_SIZE = 6;      // numero de fileiras da piramide
const TILE_W = 56;           // largura do losango de um degrau
const TILE_H = 40;           // altura do losango (face de cima)
const TILE_DEPTH = 22;       // profundidade das faces laterais (o "degrau" 3D)
const HOP_TIME = 0.18;       // duracao da animacao de pulo, em segundos
const TIMER = GameConfig.CATEDRAL_RUN_TIMER;            // duracao da fase em segundos
const DROP_INTERVAL = 3.5;   // intervalo base entre o surgimento de ameacas

// Um degrau da piramide: so guarda se ja foi aceso.
interface TileCell { lit: boolean }
// Uma ameaca descendo: posicao na grade (row/col), tempo no degrau e se esta caindo.
interface Hazard { row: number; col: number; t: number; falling: boolean }

/** Fase da piramide: pule entre degraus para acender todos, fugindo das sondas
 *  que descem. Veja o bloco no topo do arquivo. */
export class CatedralScene extends Scene {
  private content = new Container();
  private bg = new Graphics();
  private pyramidG = new Graphics();
  private hazardsG = new Graphics();
  private playerG = new Graphics();
  private hud!: RunHud;
  private juice!: RunJuice;

  private tiles: TileCell[][] = [];   // grade triangular de degraus [fileira][coluna]
  private row = 0;                     // fileira atual do jogador
  private col = 0;                     // coluna atual do jogador
  private fromXY = { x: 0, y: 0 };     // ponto de onde o pulo comeca (tela)
  private toXY = { x: 0, y: 0 };       // ponto onde o pulo termina (tela)
  private hopAnim = 1;                 // progresso do pulo: 0 = comecando, 1 = parado
  private hazards: Hazard[] = [];      // sondas descendo a piramide
  private nextDrop = 2;                // segundos ate a proxima sonda surgir
  private elapsed = 0;
  private timeLeft = TIMER;
  private litCount = 0;                // quantos degraus ja foram acesos
  private totalTiles = 0;             // total de degraus da piramide
  private ended = false;
  private originX = VW / 2;            // posicao na tela do degrau do topo
  private originY = 130;
  private cleanup: (() => void) | null = null;  // remove os listeners de toque ao sair

  /** Monta a piramide, posiciona o jogador no topo, o HUD e os toques. */
  override async enter(): Promise<void> {
    const accent = Color.hex(ZONE.accent_color);
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x080606 });
    // Halo suave atras da piramide (varios circulos quase transparentes).
    for (let i = 12; i > 0; i--) {
      this.bg.circle(VW / 2, VH * 0.45, i * 16).fill({ color: accent, alpha: 0.012 });
    }
    // Cenario de catedral (so enfeite): arcos nas laterais e uma rosacea no alto.
    for (const ax of [VW * 0.12, VW * 0.88]) {
      this.bg.moveTo(ax - 16, VH).lineTo(ax - 16, 190)
        .quadraticCurveTo(ax, 120, ax + 16, 190).lineTo(ax + 16, VH)
        .fill({ color: 0x130d10, alpha: 0.7 });
    }
    this.bg.circle(VW / 2, 64, 24).fill({ color: accent, alpha: 0.06 });
    this.bg.circle(VW / 2, 64, 24).stroke({ color: accent, width: 1.5, alpha: 0.22 });
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      this.bg.moveTo(VW / 2, 64).lineTo(VW / 2 + Math.cos(a) * 24, 64 + Math.sin(a) * 24)
        .stroke({ color: accent, width: 1, alpha: 0.16 });
    }
    this.content.addChild(this.bg);
    this.root.addChild(this.content);

    // Monta a piramide: a fileira r tem r+1 degraus (1, 2, 3, ... no topo p/ base).
    for (let r = 0; r < PYRAMID_SIZE; r++) {
      const row: TileCell[] = [];
      for (let c = 0; c <= r; c++) { row.push({ lit: false }); this.totalTiles += 1; }
      this.tiles.push(row);
    }
    // O jogador comeca no topo, que ja conta como aceso.
    this.row = 0; this.col = 0;
    this.tiles[0]![0]!.lit = true;
    this.litCount = 1;
    const start = this.tileCenter(0, 0);
    this.fromXY = { ...start };
    this.toXY = { ...start };

    this.content.addChild(this.pyramidG, this.hazardsG, this.playerG);

    this.juice = new RunJuice(this.root, { accent: Color.hex(ZONE.accent_color), shakeTarget: this.content, ambient: 24 });

    this.hud = buildHud(ZONE);
    this.root.addChild(this.hud.container);
    this.hud.setStatus('liturgia');

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

  /** Quadro a quadro: avanca a animacao de pulo e move/checa as ameacas. */
  override update(dt: number): void {
    const d = Math.min(dt, 1 / 30); // limita o delta time contra travadas
    this.juice.update(d);
    if (this.ended) return;
    this.elapsed += d;
    this.timeLeft -= d;
    // Acabou o tempo: vence se 70% ou mais dos degraus estiverem acesos.
    if (this.timeLeft <= 0) { this.end(this.litCount >= this.totalTiles * 0.7); return; }

    // Avanca a animacao de pulo do jogador rumo a 1 (parado).
    if (this.hopAnim < 1) this.hopAnim = Math.min(1, this.hopAnim + d / HOP_TIME);

    // De tempos em tempos surge uma nova sonda no topo da piramide.
    this.nextDrop -= d;
    if (this.nextDrop <= 0) {
      this.hazards.push({ row: 0, col: 0, t: 0, falling: true });
      this.nextDrop = DROP_INTERVAL + Math.random();
    }

    // Sondas descem saltando: a cada HOP_TIME, cada uma desce uma fileira
    // escolhendo entre o ramo da esquerda ou da direita aleatoriamente.
    const alive: Hazard[] = [];
    for (const h of this.hazards) {
      h.t += d;
      if (h.t >= HOP_TIME) {
        h.t = 0;
        const dirRight = Math.random() < 0.5;
        const nr = h.row + 1;
        const nc = h.col + (dirRight ? 1 : 0);
        if (nr >= PYRAMID_SIZE) continue; // passou da base: some
        h.row = nr;
        h.col = nc;
        // Sonda caiu no mesmo degrau do jogador (parado): perdeu.
        if (h.row === this.row && h.col === this.col && this.hopAnim >= 1) {
          const p = this.tileCenter(this.row, this.col);
          this.juice.hurt(p.x, p.y - 18);
          this.end(false);
          return;
        }
      }
      alive.push(h);
    }
    this.hazards = alive;

    if (this.litCount >= this.totalTiles) { this.end(true); return; } // acendeu tudo: venceu

    this.draw();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`relíquias ${this.litCount}/${this.totalTiles}`);
    this.hud.setHealth(this.litCount / this.totalTiles);
  }

  /** Converte uma posicao (fileira, coluna) da grade para o ponto na tela onde
   *  o centro daquele degrau e desenhado. Cada fileira desce e desloca meia
   *  largura para a esquerda, formando o visual de piramide isometrica. */
  private tileCenter(row: number, col: number): { x: number; y: number } {
    const rowOffset = -row * (TILE_W / 2);
    const x = this.originX + col * TILE_W + rowOffset;
    const y = this.originY + row * (TILE_H + TILE_DEPTH * 0.6);
    return { x, y };
  }

  /** Liga o toque na tela: ao tocar perto de um degrau vizinho, pula para ele. */
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
    const onTap = (e: PointerEvent): void => {
      if (this.hopAnim < 1) return; // ignora toques enquanto ainda esta pulando
      const p = toLocal(e);
      // Os 4 degraus vizinhos possiveis (diagonais) a partir da posicao atual.
      const neighbors = [
        { r: this.row - 1, c: this.col - 1 },  // cima-esquerda
        { r: this.row - 1, c: this.col },      // cima-direita
        { r: this.row + 1, c: this.col },      // baixo-esquerda
        { r: this.row + 1, c: this.col + 1 },  // baixo-direita
      ];
      // Entre os vizinhos validos, escolhe o mais proximo do toque.
      let best: { r: number; c: number } | null = null;
      let bestDist = 999;
      for (const n of neighbors) {
        if (n.r < 0 || n.r >= PYRAMID_SIZE) continue;  // fora da piramide
        if (n.c < 0 || n.c > n.r) continue;            // coluna invalida nessa fileira
        const ctr = this.tileCenter(n.r, n.c);
        const dd = Math.hypot(ctr.x - p.x, ctr.y - p.y);
        if (dd < bestDist) { bestDist = dd; best = { r: n.r, c: n.c }; }
      }
      // So pula se o toque foi razoavelmente perto de um degrau (60 px).
      if (best && bestDist < 60) {
        this.fromXY = this.tileCenter(this.row, this.col);
        this.toXY = this.tileCenter(best.r, best.c);
        this.row = best.r; this.col = best.c;
        this.hopAnim = 0; // dispara a animacao de pulo
        this.juice.jump(this.toXY.x, this.toXY.y - 18);
        // Acende o degrau de destino se ainda nao estava aceso.
        const tile = this.tiles[this.row]![this.col]!;
        if (!tile.lit) {
          tile.lit = true;
          this.litCount += 1;
          this.juice.pop(this.toXY.x, this.toXY.y - 18);
        }
      }
    };
    canvas.addEventListener('pointerdown', onTap);
    this.cleanup = (): void => {
      canvas.removeEventListener('pointerdown', onTap);
    };
  }

  /** Redesenha a piramide, as sondas e o jogador (chamado todo quadro). */
  private draw(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.pyramidG.clear();
    for (let r = 0; r < PYRAMID_SIZE; r++) {
      for (let c = 0; c <= r; c++) {
        const ctr = this.tileCenter(r, c);
        const x = ctr.x; const y = ctr.y;
        const tile = this.tiles[r]![c]!;
        // Os 4 cantos do losango (face de cima) do degrau.
        const top = { x, y: y - TILE_H / 2 };
        const right = { x: x + TILE_W / 2, y };
        const bottom = { x, y: y + TILE_H / 2 };
        const left = { x: x - TILE_W / 2, y };
        // Face de cima: degraus apagados variam levemente de tom (efeito mosaico antigo).
        const j = (((r * 7 + c * 13) % 7) - 3) * 0.012;
        const unlit = Color.hex(Color.rgb(0.165 + j, 0.125 + j, 0.094 + j * 0.6));
        this.pyramidG
          .moveTo(top.x, top.y).lineTo(right.x, right.y)
          .lineTo(bottom.x, bottom.y).lineTo(left.x, left.y).lineTo(top.x, top.y)
          .fill({ color: tile.lit ? accent : unlit, alpha: tile.lit ? 0.85 : 1 });
        // Faces laterais (esquerda e direita) que dao a sensacao de profundidade.
        this.pyramidG
          .moveTo(left.x, left.y).lineTo(bottom.x, bottom.y)
          .lineTo(bottom.x, bottom.y + TILE_DEPTH).lineTo(left.x, left.y + TILE_DEPTH)
          .lineTo(left.x, left.y).fill({ color: 0x1a140e });
        this.pyramidG
          .moveTo(bottom.x, bottom.y).lineTo(right.x, right.y)
          .lineTo(right.x, right.y + TILE_DEPTH).lineTo(bottom.x, bottom.y + TILE_DEPTH)
          .lineTo(bottom.x, bottom.y).fill({ color: 0x100a06 });
        // Outline
        this.pyramidG
          .moveTo(top.x, top.y).lineTo(right.x, right.y)
          .lineTo(bottom.x, bottom.y).lineTo(left.x, left.y).lineTo(top.x, top.y)
          .stroke({ color: 0x000000, width: 1, alpha: 0.5 });
      }
    }

    // Sondas (ameacas).
    this.hazardsG.clear();
    for (const h of this.hazards) {
      const c = this.tileCenter(h.row, h.col);
      // Sonda do ARGOS: capsula metalica com um sensor vermelho que pisca.
      this.hazardsG.ellipse(c.x, c.y - 18, 7, 9).fill({ color: 0x5b6a78, alpha: 0.95 });
      this.hazardsG.ellipse(c.x, c.y - 18, 7, 9).stroke({ color: 0xff3a3a, width: 1.5, alpha: 0.8 });
      const blink = 0.5 + 0.5 * Math.sin(this.elapsed * 8 + h.col);
      this.hazardsG.circle(c.x, c.y - 23, 2.4).fill({ color: 0xff2424, alpha: 0.6 + 0.4 * blink });
    }

    // Jogador: interpola entre o degrau de origem e o de destino, somando um
    // arco vertical (Math.sin) que da o efeito de "pulinho" no meio do caminho.
    const t = this.hopAnim;
    const x = this.fromXY.x + (this.toXY.x - this.fromXY.x) * t;
    const y = this.fromXY.y + (this.toXY.y - this.fromXY.y) * t;
    const arc = Math.sin(t * Math.PI) * 16;
    this.playerG.clear();
    this.playerG.circle(x, y - 18 - arc, 11).fill({ color: accent, alpha: 0.3 });
    this.playerG.circle(x, y - 18 - arc, 8).fill({ color: accent });
    this.playerG.circle(x, y - 18 - arc, 5).fill({ color: 0xffffff });
  }

  /** Encerra a fase (uma vez so): efeito de fim, recompensa se venceu, avisa o
   *  HubState e mostra a tela de fim. */
  private end(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
    const reward = victory ? this.litCount : 0;
    if (victory && reward > 0) {
      // Nao existe um recurso "reliquias"; depositamos como fragmentos_estruturais
      // (1 fragmento a cada 4 degraus acesos), tematicamente equivalente.
      HubState.depositFlow('fragmentos_estruturais', Math.ceil(reward / 4));
    }
    HubState.onRunEnded(victory);
    this.root.addChild(buildEndOverlay({
      zone: ZONE,
      victory,
      rewardLabel: `+${Math.ceil(reward / 4)} Relíquias — padrão ressonante completo`,
      failLabel: 'Probe de ARGOS. Padrão interrompido.',
    }));
  }
}
