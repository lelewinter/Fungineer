// ============================================================================
// EXTRACAO — A FASE DE ESCAVACAO COM PEDRAS QUE CAEM (estilo Boulder Dash)
// ----------------------------------------------------------------------------
// O que e esta fase, em palavras simples:
//   - A caverna e uma grade cheia de terra compacta. Voce arrasta numa direcao
//     para cavar e andar um quadradinho por vez naquele sentido.
//   - Espalhados pela terra ha tanques de combustivel; pisar neles coleta.
//   - Existem pedras: quando o quadrado embaixo de uma pedra fica vazio, ela CAI.
//     Se cair em cima de voce, voce e soterrado e perde a run. Da para empurrar
//     pedras de lado para um espaco vazio.
//   - Coletar a meta de combustivel antes do tempo vence a fase.
//
// Como se encaixa no jogo:
//   - E uma fase de raid. Usa a moldura compartilhada do RunFrame (HUD, tela de
//     fim). Ao vencer, deposita "combustivel_volatil" no bunker.
//
// A classe ExtractionScene continua exportada deste mesmo arquivo, entao nada
// quebra para quem usa esta fase.
// ============================================================================

import { Container, Graphics, Text } from 'pixi.js';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
import { ZONES } from '../../state/Zones';
import { RunJuice } from '../../run/fx/RunJuice';
import { RunScene } from './RunScene';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;
const ZONE = ZONES[3]!;

// ── Tamanhos e tempos ────────────────────────────────────────────────────────
const COLS = 12;                                       // colunas da grade
const TOP = 50;                                        // margem superior (HUD)
const FOOT = 90;                                       // margem inferior
const TILE = Math.floor(VW / COLS);                    // lado de cada quadrado, em pixels
const ROWS = Math.floor((VH - TOP - FOOT) / TILE);     // quantas linhas cabem
const STEP_TIME = 0.18;     // intervalo entre passos ao cavar (segundos)
const ROCK_FALL_TIME = 0.22; // tempo para uma pedra completar um passo de queda
const TIMER = GameConfig.EXTRACTION_RUN_TIMER;           // duracao da fase em segundos
const FUEL_GOAL = 8;        // tanques de combustivel para vencer

// O conteudo de um quadrado da grade.
type Cell = 'dirt' | 'empty' | 'rock' | 'fuel' | 'wall';

// Uma pedra em queda: sua coluna/linha atual e quanto tempo passou no passo.
interface FallState { col: number; row: number; t: number }

/** Fase de escavacao: cave pela terra coletando combustivel sem ser esmagado
 *  pelas pedras que caem. Veja o bloco no topo do arquivo. */
export class ExtractionScene extends RunScene {
  protected readonly zone = ZONE;

  private content = new Container();
  private bg = new Graphics();
  private gridG = new Graphics();
  private playerG = new Graphics();

  private grid: Cell[][] = [];      // a grade da caverna [linha][coluna]
  private px = 1;                    // coluna do jogador
  private py = 1;                    // linha do jogador
  private moveCooldown = 0;          // espera ate poder dar o proximo passo
  private dragVec = { x: 0, y: 0 };  // direcao/forca do arraste atual
  private dragging = false;
  private pointerStart = { x: 0, y: 0 };  // onde o arraste comecou
  private banked = 0;                // combustivel coletado
  private elapsed = 0;
  private timeLeft = TIMER;
  private falling: FallState[] = []; // pedras atualmente caindo

  private cleanup: (() => void) | null = null;

  /** A base monta HUD/juice/musica; aqui montamos a grade e os toques. */
  protected override onEnter(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x080604 });
    this.bg.rect(0, TOP - 2, VW, 2).fill({ color: accent, alpha: 0.4 });
    this.content.addChild(this.bg);
    this.root.addChild(this.content);

    this.buildGrid();

    this.content.addChild(this.gridG, this.playerG);

    this.hud.setStatus('escavação profunda');

    // Enfeite de lore: legenda de profundidade na margem esquerda (so visual).
    const legendStyle = { fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 7, fill: 0x6a5a44, letterSpacing: 1 };
    const top = new Text({ text: 'SUBNÍVEL −40m', style: legendStyle });
    top.x = 3; top.y = TOP + 4;
    const bottom = new Text({ text: 'PRÉ-OLÍMPIO −70m', style: legendStyle });
    bottom.x = 3; bottom.y = TOP + ROWS * TILE - 12;
    this.content.addChild(top, bottom);

    this.bindPointer();
  }

  /** A base para a musica e destroi o juice; aqui so soltamos o toque. */
  protected override onExit(): void {
    this.cleanup?.();
  }

  /** A Extracao treme o conteudo do jogo (nao o root). */
  protected override buildJuice(): RunJuice {
    return new RunJuice(this.root, { accent: this.accentHex(), shakeTarget: this.content, ambient: 20 });
  }

  /** Quadro a quadro: cava conforme o arraste e atualiza as pedras que caem. */
  protected override onUpdate(d: number): void {
    this.elapsed += d;
    this.timeLeft -= d;
    // Acabou o tempo: vence se ja coletou metade da meta.
    if (this.timeLeft <= 0) { this.end(this.banked >= FUEL_GOAL / 2); return; }

    // Passo de escavacao no ritmo de STEP_TIME, na direcao predominante do arraste
    // (so horizontal OU so vertical, o eixo de maior deslocamento).
    this.moveCooldown -= d;
    if (this.moveCooldown <= 0 && this.dragging) {
      const dx = this.dragVec.x;
      const dy = this.dragVec.y;
      if (Math.hypot(dx, dy) > 16) {
        let mx = 0;
        let my = 0;
        if (Math.abs(dx) > Math.abs(dy)) mx = dx > 0 ? 1 : -1;
        else my = dy > 0 ? 1 : -1;
        this.stepPlayer(mx, my);
        this.moveCooldown = STEP_TIME;
      }
    }

    this.updateRocks(d);

    if (this.banked >= FUEL_GOAL) { this.end(true); return; } // bateu a meta: venceu
    this.draw();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`comb ${this.banked}/${FUEL_GOAL}`);
    this.hud.setHealth(this.banked / FUEL_GOAL);
  }

  /** Liga o arraste: guarda a direcao do gesto, lida no update para cavar. */
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
    const onDown = (e: PointerEvent): void => {
      this.dragging = true;
      this.pointerStart = toLocal(e);
      this.dragVec = { x: 0, y: 0 };
    };
    const onMove = (e: PointerEvent): void => {
      if (!this.dragging) return;
      const p = toLocal(e);
      // dragVec = quanto o dedo se afastou do ponto inicial (direcao de escavacao).
      this.dragVec = { x: p.x - this.pointerStart.x, y: p.y - this.pointerStart.y };
    };
    const onUp = (): void => { this.dragging = false; this.dragVec = { x: 0, y: 0 }; };
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

  /** Cria a grade: bordas de "wall", interior de "dirt", uma entrada vazia e
   *  espalha pedras e tanques de combustivel aleatoriamente. */
  private buildGrid(): void {
    this.grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < COLS; c++) {
        if (r === 0 || c === 0 || c === COLS - 1 || r === ROWS - 1) row.push('wall');
        else row.push('dirt');
      }
      this.grid.push(row);
    }
    // Abre um espaco de entrada para o jogador nao comecar preso.
    this.setCell(1, 1, 'empty');

    // Espalha pedras (vao cair quando o quadrado abaixo ficar vazio).
    const rockCount = Math.floor(ROWS * COLS * 0.07);
    for (let i = 0; i < rockCount; i++) {
      const c = 1 + Math.floor(Math.random() * (COLS - 2));
      const r = 2 + Math.floor(Math.random() * (ROWS - 3));
      if (this.cell(c, r) === 'dirt') this.setCell(c, r, 'rock');
    }
    // Espalha os tanques de combustivel (alguns a mais que a meta, para folga).
    let placed = 0;
    while (placed < FUEL_GOAL + 3) {
      const c = 1 + Math.floor(Math.random() * (COLS - 2));
      const r = 2 + Math.floor(Math.random() * (ROWS - 3));
      if (this.cell(c, r) === 'dirt') { this.setCell(c, r, 'fuel'); placed += 1; }
    }
  }

  /** Tenta mover o jogador um quadrado na direcao (mx, my), tratando paredes,
   *  pedras empurraveis e a coleta de combustivel. */
  private stepPlayer(mx: number, my: number): void {
    const nx = this.px + mx;
    const ny = this.py + my;
    const target = this.cell(nx, ny);
    if (target === 'wall') return; // parede: nao anda
    if (target === 'rock') {
      // So da para empurrar pedra na horizontal, e so para um espaco livre/terra.
      if (my !== 0) return;
      const beyond = this.cell(nx + mx, ny);
      if (beyond !== 'empty' && beyond !== 'dirt') return;
      // Move a pedra um quadrado adiante e deixa o lugar dela vazio.
      this.setCell(nx + mx, ny, 'rock');
      this.setCell(nx, ny, 'empty');
    }
    if (target === 'fuel') {
      this.banked += 1;
      this.juice.pop(nx * TILE + TILE / 2, TOP + ny * TILE + TILE / 2);
    }
    // Esvazia o quadrado antigo, anda, e garante que o novo fica vazio (cavou).
    this.setCell(this.px, this.py, 'empty');
    this.px = nx; this.py = ny;
    this.setCell(this.px, this.py, 'empty');
  }

  /** Detecta e avanca as pedras que caem; uma pedra cai se o quadrado logo
   *  abaixo dela estiver vazio. Se cair no jogador, a run acaba. */
  private updateRocks(dt: number): void {
    // De baixo para cima: marca pedras com vazio embaixo para comecar a cair.
    for (let r = ROWS - 2; r >= 1; r--) {
      for (let c = 1; c < COLS - 1; c++) {
        if (this.cell(c, r) === 'rock' && this.cell(c, r + 1) === 'empty') {
          if (!this.falling.some((f) => f.col === c && f.row === r)) {
            this.falling.push({ col: c, row: r, t: 0 });
          }
        }
      }
    }
    // Avanca cada pedra que esta caindo, um passo por ROCK_FALL_TIME.
    const stillFalling: FallState[] = [];
    for (const f of this.falling) {
      f.t += dt;
      if (f.t >= ROCK_FALL_TIME) {
        const nr = f.row + 1;
        // Caiu no jogador? Soterrado, perdeu.
        if (nr === this.py && f.col === this.px) {
          this.juice.hurt(this.px * TILE + TILE / 2, TOP + this.py * TILE + TILE / 2);
          this.end(false);
          return;
        }
        if (this.cell(f.col, nr) === 'empty') {
          this.setCell(f.col, f.row, 'empty');
          this.setCell(f.col, nr, 'rock');
          // Se ainda ha vazio embaixo, continua caindo no proximo tick.
          if (this.cell(f.col, nr + 1) === 'empty') {
            stillFalling.push({ col: f.col, row: nr, t: 0 });
          }
        }
      } else {
        stillFalling.push(f); // ainda nao completou o passo de queda
      }
    }
    this.falling = stillFalling;
  }

  /** Le um quadrado da grade (fora dos limites conta como parede). */
  private cell(c: number, r: number): Cell {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return 'wall';
    return this.grid[r]![c]!;
  }
  /** Escreve um quadrado da grade (ignora se estiver fora dos limites). */
  private setCell(c: number, r: number, v: Cell): void {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    this.grid[r]![c] = v;
  }

  /** Redesenha toda a grade e o jogador (chamado todo quadro). */
  private draw(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.gridG.clear();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE;
        const y = TOP + r * TILE;
        const v = this.cell(c, r);
        if (v === 'wall') {
          this.gridG.rect(x, y, TILE, TILE).fill({ color: 0x1a1410 });
        } else if (v === 'dirt') {
          // Estratigrafia (so visual): a cor da terra muda conforme a profundidade.
          const strat = r < ROWS * 0.25 ? 0x2b2b30 : r < ROWS * 0.6 ? 0x3a2615 : 0x2e1d12;
          this.gridG.rect(x, y, TILE, TILE).fill({ color: strat });
          this.gridG.rect(x + 1, y + 1, TILE - 2, TILE - 2).fill({ color: 0x4a2f1a, alpha: 0.35 });
        } else if (v === 'empty') {
          this.gridG.rect(x, y, TILE, TILE).fill({ color: 0x080604 });
        } else if (v === 'rock') {
          this.gridG.rect(x, y, TILE, TILE).fill({ color: 0x080604 });
          this.gridG.circle(x + TILE / 2, y + TILE / 2, TILE * 0.4).fill({ color: 0x6e605a });
          this.gridG.circle(x + TILE / 2 - 2, y + TILE / 2 - 2, TILE * 0.18).fill({ color: 0x8e7d70, alpha: 0.6 });
        } else if (v === 'fuel') {
          this.gridG.rect(x, y, TILE, TILE).fill({ color: 0x2e1d12 });
          const pulse = 0.5 + 0.5 * Math.sin(this.elapsed * 4 + c + r); // brilho pulsante
          // Canister de composto volatil: um cilindro com uma faixa ambar.
          const cw = TILE * 0.42;
          const ch = TILE * 0.62;
          this.gridG.roundRect(x + TILE / 2 - cw / 2, y + TILE / 2 - ch / 2, cw, ch, 3).fill({ color: 0xc8821e, alpha: 0.95 });
          this.gridG.rect(x + TILE / 2 - cw / 2, y + TILE / 2 - 2, cw, 4).fill({ color: 0xffd070, alpha: 0.55 + 0.35 * pulse });
        }
      }
    }
    const px = this.px * TILE + TILE / 2;
    const py = TOP + this.py * TILE + TILE / 2;
    this.playerG.clear();
    this.playerG.circle(px, py, TILE * 0.42).fill({ color: accent, alpha: 0.2 });
    this.playerG.circle(px, py, TILE * 0.32).fill({ color: accent });
    this.playerG.circle(px, py, TILE * 0.18).fill({ color: 0xffffff });
  }

  /** Encerra a fase (uma vez so): efeito de fim, recompensa se venceu, avisa o
   *  HubState e mostra a tela de fim. */
  private end(victory: boolean): void {
    if (this.ended) return; // protege contra deposito duplo
    if (victory && this.banked > 0) {
      HubState.depositFlow('combustivel_volatil', this.banked);
    }
    this.endRun(victory, {
      rewardLabel: `+${this.banked} Combustível Volátil — canisters recuperados`,
      failLabel: 'Soterrado. Missão abortada.',
    });
  }
}
