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
const ZONE = ZONES[5]!;

const COLS = 13;
const ROWS = 17;
const TOP = 60;
const TILE = Math.floor(Math.min((VH - TOP - 90) / ROWS, VW / COLS));
const PLAYER_SPEED = 80; // px/s
const GHOST_SPEED = 60;
const POWER_TIME = 6;
const TIMER = 75;

// 1 = wall, 0 = corridor with pellet, 2 = power pellet
type Cell = 0 | 1 | 2 | -1; // -1 = eaten

const MAZE: Cell[][] = ((): Cell[][] => {
  const W = 1; const D = 0;
  const tmpl = [
    'WWWWWWWWWWWWW',
    'W...........W',
    'W.WW.W.W.WW.W',
    'WP..........W',
    'W.W.WWWWW.W.W',
    'W.W.........W',
    'W.W.WWWWW.W.W',
    'W...........W',
    'W.WWW.W.WWW.W',
    'W...........W',
    'W.W.W.W.W.W.W',
    'WP..........W',
    'W.WW.W.W.WW.W',
    'W...........W',
    'W.WWW.W.WWW.W',
    'W...........W',
    'WWWWWWWWWWWWW',
  ];
  return tmpl.map((line) => {
    const row: Cell[] = [];
    for (const ch of line) {
      if (ch === 'W') row.push(W as Cell);
      else if (ch === 'P') row.push(2 as Cell);
      else row.push(D as Cell);
    }
    return row;
  });
})();

interface Ghost { x: number; y: number; dir: { x: number; y: number }; scared: number }

/** INFECÇÃO — Pac-Man. Drag-direction grid maze. Eat biomass pellets (spores).
 *  Sterilization drones (ghosts) patrol; touch one and you're cleaned. Power
 *  pellets briefly let you eat them for bonus biomass. */
export class InfeccaoScene extends Scene {
  private content = new Container();
  private bg = new Graphics();
  private mazeG = new Graphics();
  private pelletG = new Graphics();
  private playerG = new Graphics();
  private ghostsG = new Graphics();
  private hud!: RunHud;
  private juice!: RunJuice;

  private cells: Cell[][] = MAZE.map((row) => row.slice());
  private px = 1;
  private py = 1;
  private pxOff = 0;
  private pyOff = 0;
  private dir: { x: number; y: number } = { x: 0, y: 0 };
  private nextDir: { x: number; y: number } = { x: 0, y: 0 };
  private ghosts: Ghost[] = [];
  private pelletsLeft = 0;
  private banked = 0;
  private power = 0;
  private timeLeft = TIMER;
  private elapsed = 0;
  private ended = false;
  private offsetX = 0;
  private offsetY = TOP;

  private pointerStart = { x: 0, y: 0 };
  private dragging = false;
  private cleanup: (() => void) | null = null;

  override async enter(): Promise<void> {
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x040806 });
    this.content.addChild(this.bg);
    this.root.addChild(this.content);

    this.offsetX = Math.floor((VW - COLS * TILE) / 2);
    // Find player start (first open cell from top-left).
    outer: for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (this.cells[r]![c] === 0) { this.px = c; this.py = r; break outer; }
      }
    }
    // Count pellets.
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (this.cells[r]![c] === 0 || this.cells[r]![c] === 2) this.pelletsLeft += 1;
    }
    // Eat starting tile.
    this.cells[this.py]![this.px] = -1;
    this.pelletsLeft -= 1;

    // Spawn 3 ghosts at the center-ish open cells.
    const center = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
    for (let i = 0; i < 3; i++) {
      const cx = Math.min(COLS - 2, Math.max(1, center.x + (i - 1)));
      const cy = center.y;
      if (this.cells[cy]![cx] === 1) continue;
      this.ghosts.push({ x: cx, y: cy, dir: { x: i === 0 ? 1 : (i === 1 ? -1 : 0), y: i === 2 ? 1 : 0 }, scared: 0 });
    }

    this.content.addChild(this.mazeG, this.pelletG, this.playerG, this.ghostsG);

    this.juice = new RunJuice(this.root, { accent: Color.hex(ZONE.accent_color), shakeTarget: this.content, ambient: 24 });

    this.drawMaze();
    this.hud = buildHud(ZONE);
    this.root.addChild(this.hud.container);
    this.hud.setStatus('propagação orgânica');

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

  private playerScreen(): { x: number; y: number } {
    return {
      x: this.offsetX + this.px * TILE + TILE / 2 + this.pxOff,
      y: this.offsetY + this.py * TILE + TILE / 2 + this.pyOff,
    };
  }

  override update(dt: number): void {
    const d = Math.min(dt, 1 / 30);
    this.juice.update(d);
    if (this.ended) return;
    this.elapsed += d;
    this.timeLeft -= d;
    this.power = Math.max(0, this.power - d);
    if (this.timeLeft <= 0) { this.end(this.banked > 0 && this.pelletsLeft <= 4); return; }

    // Player grid-step movement.
    this.tickPlayer(d);
    this.tickGhosts(d);

    // Player vs ghosts.
    for (const g of this.ghosts) {
      if (Math.hypot(g.x - (this.px + this.pxOff / TILE), g.y - (this.py + this.pyOff / TILE)) < 0.55) {
        if (g.scared > 0) {
          this.banked += 5;
          this.juice.pop(this.offsetX + g.x * TILE + TILE / 2, this.offsetY + g.y * TILE + TILE / 2);
          g.scared = 0;
          // respawn at center
          g.x = Math.floor(COLS / 2);
          g.y = Math.floor(ROWS / 2);
          g.dir = { x: 0, y: -1 };
        } else {
          const p = this.playerScreen();
          this.juice.hurt(p.x, p.y);
          this.end(false);
          return;
        }
      }
    }

    if (this.pelletsLeft <= 0) { this.end(true); return; }

    this.draw();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`biomassa ${this.banked}`);
    this.hud.setHealth(1 - this.pelletsLeft / (COLS * ROWS));
  }

  private tickPlayer(dt: number): void {
    const canEnter = (cx: number, cy: number): boolean =>
      cy >= 0 && cy < ROWS && cx >= 0 && cx < COLS && this.cells[cy]![cx] !== 1;

    // If aligned, allow turn.
    if (this.pxOff === 0 && this.pyOff === 0) {
      if (this.nextDir.x !== 0 || this.nextDir.y !== 0) {
        if (canEnter(this.px + this.nextDir.x, this.py + this.nextDir.y)) {
          this.dir = { ...this.nextDir };
        }
      }
      if (this.dir.x !== 0 || this.dir.y !== 0) {
        if (!canEnter(this.px + this.dir.x, this.py + this.dir.y)) {
          this.dir = { x: 0, y: 0 };
        }
      }
    }

    if (this.dir.x !== 0 || this.dir.y !== 0) {
      this.pxOff += this.dir.x * PLAYER_SPEED * dt;
      this.pyOff += this.dir.y * PLAYER_SPEED * dt;
      if (this.pxOff >= TILE) { this.px += 1; this.pxOff = 0; }
      else if (this.pxOff <= -TILE) { this.px -= 1; this.pxOff = 0; }
      if (this.pyOff >= TILE) { this.py += 1; this.pyOff = 0; }
      else if (this.pyOff <= -TILE) { this.py -= 1; this.pyOff = 0; }
    }

    // Eat pellet on entry.
    const v = this.cells[this.py]![this.px];
    if (v === 0) {
      this.cells[this.py]![this.px] = -1;
      this.pelletsLeft -= 1;
      this.banked += 1;
    } else if (v === 2) {
      this.cells[this.py]![this.px] = -1;
      this.pelletsLeft -= 1;
      this.banked += 2;
      this.power = POWER_TIME;
      for (const g of this.ghosts) g.scared = POWER_TIME;
      const p = this.playerScreen();
      this.juice.pop(p.x, p.y);
      this.juice.flash(0x4d7adb, 0.16, 0.3);
    }
  }

  private tickGhosts(dt: number): void {
    for (const g of this.ghosts) {
      g.scared = Math.max(0, g.scared - dt);
      // Pick a direction toward player (or away if scared) at integer positions.
      // We move ghosts on a per-step basis to keep it simple.
      const speed = (g.scared > 0 ? GHOST_SPEED * 0.6 : GHOST_SPEED) * dt / TILE;
      const cx = Math.round(g.x);
      const cy = Math.round(g.y);
      if (Math.abs(g.x - cx) < 0.05 && Math.abs(g.y - cy) < 0.05) {
        g.x = cx; g.y = cy;
        const options: Array<{ x: number; y: number }> = [];
        for (const dd of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
          const nx = cx + dd.x; const ny = cy + dd.y;
          if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && this.cells[ny]![nx] !== 1) {
            // Don't reverse unless dead-end.
            if (!(dd.x === -g.dir.x && dd.y === -g.dir.y)) options.push(dd);
          }
        }
        if (options.length === 0) g.dir = { x: -g.dir.x, y: -g.dir.y };
        else {
          // Greedy chase / flee.
          const tx = this.px;
          const ty = this.py;
          let best = options[0]!;
          let bestScore = Infinity;
          for (const o of options) {
            const dist = Math.hypot((cx + o.x) - tx, (cy + o.y) - ty);
            const score = g.scared > 0 ? -dist : dist;
            if (score < bestScore) { bestScore = score; best = o; }
          }
          g.dir = best;
        }
      }
      g.x += g.dir.x * speed;
      g.y += g.dir.y * speed;
    }
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
    };
    const onMove = (e: PointerEvent): void => {
      if (!this.dragging) return;
      const p = toLocal(e);
      const dx = p.x - this.pointerStart.x;
      const dy = p.y - this.pointerStart.y;
      if (Math.hypot(dx, dy) > 14) {
        if (Math.abs(dx) > Math.abs(dy)) this.nextDir = { x: dx > 0 ? 1 : -1, y: 0 };
        else this.nextDir = { x: 0, y: dy > 0 ? 1 : -1 };
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

  private hexPts(cx: number, cy: number, rad: number): number[] {
    const p: number[] = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      p.push(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    return p;
  }

  private drawMaze(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.mazeG.clear();
    // Datacenter raised-floor grid under the node topology.
    for (let gx = 0; gx <= COLS; gx++) {
      this.mazeG.moveTo(this.offsetX + gx * TILE, this.offsetY).lineTo(this.offsetX + gx * TILE, this.offsetY + ROWS * TILE)
        .stroke({ color: 0x0c3a30, width: 1, alpha: 0.22 });
    }
    for (let gy = 0; gy <= ROWS; gy++) {
      this.mazeG.moveTo(this.offsetX, this.offsetY + gy * TILE).lineTo(this.offsetX + COLS * TILE, this.offsetY + gy * TILE)
        .stroke({ color: 0x0c3a30, width: 1, alpha: 0.22 });
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.cells[r]![c] === 1) {
          const x = this.offsetX + c * TILE;
          const y = this.offsetY + r * TILE;
          this.mazeG.rect(x + 1, y + 1, TILE - 2, TILE - 2)
            .fill({ color: 0x0a1a14, alpha: 1 })
            .stroke({ color: accent, width: 1, alpha: 0.7 });
        }
      }
    }
  }

  private draw(): void {
    const accent = Color.hex(ZONE.accent_color);
    // Pellets.
    this.pelletG.clear();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = this.cells[r]![c];
        const cxp = this.offsetX + c * TILE + TILE / 2;
        const cyp = this.offsetY + r * TILE + TILE / 2;
        if (v === 0) {
          // Data node — hexagonal, matching NERVE's topology.
          this.pelletG.poly(this.hexPts(cxp, cyp, 2.8)).fill({ color: accent, alpha: 0.9 });
        } else if (v === 2) {
          const p = 0.5 + 0.5 * Math.sin(this.elapsed * 4);
          this.pelletG.poly(this.hexPts(cxp, cyp, 5 + p)).fill({ color: 0xffffff, alpha: 0.5 + 0.4 * p });
          this.pelletG.poly(this.hexPts(cxp, cyp, 5 + p)).stroke({ color: accent, width: 1.5, alpha: 0.9 });
        }
      }
    }

    // Player.
    const px = this.offsetX + this.px * TILE + TILE / 2 + this.pxOff;
    const py = this.offsetY + this.py * TILE + TILE / 2 + this.pyOff;
    this.playerG.clear();
    this.playerG.circle(px, py, TILE * 0.42).fill({ color: accent, alpha: 0.22 });
    this.playerG.circle(px, py, TILE * 0.32).fill({ color: accent });
    this.playerG.circle(px, py, TILE * 0.18).fill({ color: 0xffffff });

    // Ghosts.
    this.ghostsG.clear();
    for (const g of this.ghosts) {
      const gx = this.offsetX + g.x * TILE + TILE / 2;
      const gy = this.offsetY + g.y * TILE + TILE / 2;
      const scared = g.scared > 0;
      const color = scared ? 0x4d7adb : 0xc24d4d;
      this.ghostsG.circle(gx, gy, TILE * 0.38).fill({ color, alpha: 0.85 });
      this.ghostsG.circle(gx - 3, gy - 2, 2).fill({ color: 0xffffff });
      this.ghostsG.circle(gx + 3, gy - 2, 2).fill({ color: 0xffffff });
    }
  }

  private end(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
    if (victory && this.banked > 0) {
      HubState.depositFlow('biomassa_adaptativa', Math.ceil(this.banked / 4));
    }
    HubState.onRunEnded(victory);
    this.root.addChild(buildEndOverlay({
      zone: ZONE,
      victory,
      rewardLabel: `+${Math.ceil(this.banked / 4)} Biomassa Adaptativa — nós consumidos`,
      failLabel: 'Esterilizado. Protocolo NERVE ativo.',
    }));
  }
}
