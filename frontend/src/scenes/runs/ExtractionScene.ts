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
const ZONE = ZONES[3]!;

const COLS = 12;
const TOP = 50;
const FOOT = 90;
const TILE = Math.floor(VW / COLS);
const ROWS = Math.floor((VH - TOP - FOOT) / TILE);
const STEP_TIME = 0.18; // seconds per grid step (driven by drag direction)
const ROCK_FALL_TIME = 0.22;
const TIMER = 60;
const FUEL_GOAL = 8;

type Cell = 'dirt' | 'empty' | 'rock' | 'fuel' | 'wall';

interface FallState { col: number; row: number; t: number }

/** EXTRAÇÃO — Boulder Dash. The cavern is packed dirt; drag a direction to
 *  dig in that direction one tile at a time. Fuel tanks (Comb. Volátil)
 *  bank when stepped on. Rocks above empty tiles fall and crush you. */
export class ExtractionScene extends Scene {
  private content = new Container();
  private bg = new Graphics();
  private gridG = new Graphics();
  private playerG = new Graphics();
  private hud!: RunHud;
  private juice!: RunJuice;

  private grid: Cell[][] = [];
  private px = 1;
  private py = 1;
  private moveCooldown = 0;
  private dragVec = { x: 0, y: 0 };
  private dragging = false;
  private pointerStart = { x: 0, y: 0 };
  private banked = 0;
  private elapsed = 0;
  private timeLeft = TIMER;
  private ended = false;
  private falling: FallState[] = [];

  private cleanup: (() => void) | null = null;

  override async enter(): Promise<void> {
    const accent = Color.hex(ZONE.accent_color);
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x080604 });
    this.bg.rect(0, TOP - 2, VW, 2).fill({ color: accent, alpha: 0.4 });
    this.content.addChild(this.bg);
    this.root.addChild(this.content);

    this.buildGrid();

    this.content.addChild(this.gridG, this.playerG);

    this.juice = new RunJuice(this.root, { accent, shakeTarget: this.content, ambient: 20 });

    this.hud = buildHud(ZONE);
    this.root.addChild(this.hud.container);
    this.hud.setStatus('escavação');

    this.bindPointer();

    if (ZONE.music) {
      audioManager.playMusic(ZONE.music, { loop: true, volume: 0.3, fadeMs: 400 }).catch(() => undefined);
    }
  }

  override exit(): void {
    audioManager.stopMusic(300);
    this.cleanup?.();
    this.juice.destroy();
  }

  override update(dt: number): void {
    const d = Math.min(dt, 1 / 30);
    this.juice.update(d);
    if (this.ended) return;
    this.elapsed += d;
    this.timeLeft -= d;
    if (this.timeLeft <= 0) { this.end(this.banked >= FUEL_GOAL / 2); return; }

    // Player digging step driven by drag direction.
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

    if (this.banked >= FUEL_GOAL) { this.end(true); return; }
    this.draw();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`comb ${this.banked}/${FUEL_GOAL}`);
    this.hud.setHealth(1 - this.banked / FUEL_GOAL);
  }

  private bindPointer(): void {
    const canvas = this.app.pixi.canvas;
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
    // Carve an entry pocket so the player isn't trapped on tile 0.
    this.setCell(1, 1, 'empty');

    // Sprinkle rocks (will fall through empty tiles).
    const rockCount = Math.floor(ROWS * COLS * 0.07);
    for (let i = 0; i < rockCount; i++) {
      const c = 1 + Math.floor(Math.random() * (COLS - 2));
      const r = 2 + Math.floor(Math.random() * (ROWS - 3));
      if (this.cell(c, r) === 'dirt') this.setCell(c, r, 'rock');
    }
    // Place fuel chunks.
    let placed = 0;
    while (placed < FUEL_GOAL + 3) {
      const c = 1 + Math.floor(Math.random() * (COLS - 2));
      const r = 2 + Math.floor(Math.random() * (ROWS - 3));
      if (this.cell(c, r) === 'dirt') { this.setCell(c, r, 'fuel'); placed += 1; }
    }
  }

  private stepPlayer(mx: number, my: number): void {
    const nx = this.px + mx;
    const ny = this.py + my;
    const target = this.cell(nx, ny);
    if (target === 'wall') return;
    if (target === 'rock') {
      // Can only push horizontally into empty space.
      if (my !== 0) return;
      const beyond = this.cell(nx + mx, ny);
      if (beyond !== 'empty' && beyond !== 'dirt') return;
      if (beyond === 'dirt' || beyond === 'empty') {
        this.setCell(nx + mx, ny, 'rock');
        this.setCell(nx, ny, 'empty');
      } else return;
    }
    if (target === 'fuel') {
      this.banked += 1;
      this.juice.pop(nx * TILE + TILE / 2, TOP + ny * TILE + TILE / 2);
    }
    this.setCell(this.px, this.py, 'empty');
    this.px = nx; this.py = ny;
    this.setCell(this.px, this.py, 'empty');
  }

  private updateRocks(dt: number): void {
    // Detect rocks that should start falling (rock with empty directly below).
    for (let r = ROWS - 2; r >= 1; r--) {
      for (let c = 1; c < COLS - 1; c++) {
        if (this.cell(c, r) === 'rock' && this.cell(c, r + 1) === 'empty') {
          if (!this.falling.some((f) => f.col === c && f.row === r)) {
            this.falling.push({ col: c, row: r, t: 0 });
          }
        }
      }
    }
    // Tick falling rocks.
    const stillFalling: FallState[] = [];
    for (const f of this.falling) {
      f.t += dt;
      if (f.t >= ROCK_FALL_TIME) {
        const nr = f.row + 1;
        if (nr === this.py && f.col === this.px) {
          this.juice.hurt(this.px * TILE + TILE / 2, TOP + this.py * TILE + TILE / 2);
          this.end(false);
          return;
        }
        if (this.cell(f.col, nr) === 'empty') {
          this.setCell(f.col, f.row, 'empty');
          this.setCell(f.col, nr, 'rock');
          // Continue falling next tick.
          if (this.cell(f.col, nr + 1) === 'empty') {
            stillFalling.push({ col: f.col, row: nr, t: 0 });
          }
        }
      } else {
        stillFalling.push(f);
      }
    }
    this.falling = stillFalling;
  }

  private cell(c: number, r: number): Cell {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return 'wall';
    return this.grid[r]![c]!;
  }
  private setCell(c: number, r: number, v: Cell): void {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    this.grid[r]![c] = v;
  }

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
          this.gridG.rect(x, y, TILE, TILE).fill({ color: 0x3a2615 });
          this.gridG.rect(x + 1, y + 1, TILE - 2, TILE - 2).fill({ color: 0x4a2f1a, alpha: 0.6 });
        } else if (v === 'empty') {
          this.gridG.rect(x, y, TILE, TILE).fill({ color: 0x080604 });
        } else if (v === 'rock') {
          this.gridG.rect(x, y, TILE, TILE).fill({ color: 0x080604 });
          this.gridG.circle(x + TILE / 2, y + TILE / 2, TILE * 0.4).fill({ color: 0x6e605a });
          this.gridG.circle(x + TILE / 2 - 2, y + TILE / 2 - 2, TILE * 0.18).fill({ color: 0x8e7d70, alpha: 0.6 });
        } else if (v === 'fuel') {
          this.gridG.rect(x, y, TILE, TILE).fill({ color: 0x3a2615 });
          const pulse = 0.5 + 0.5 * Math.sin(this.elapsed * 4 + c + r);
          this.gridG.circle(x + TILE / 2, y + TILE / 2, TILE * 0.32).fill({ color: accent, alpha: 0.85 });
          this.gridG.circle(x + TILE / 2, y + TILE / 2, TILE * 0.18).fill({ color: 0xffffff, alpha: 0.5 + 0.3 * pulse });
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

  private end(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
    if (victory && this.banked > 0) {
      HubState.depositFlow('combustivel_volatil', this.banked);
    }
    HubState.onRunEnded(victory);
    this.root.addChild(buildEndOverlay({
      zone: ZONE,
      victory,
      rewardLabel: `+${this.banked} Comb. Volátil`,
      failLabel: 'Rocha caiu em cima.',
    }));
  }
}
