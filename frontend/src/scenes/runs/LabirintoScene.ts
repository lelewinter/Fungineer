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
const ZONE = ZONES[6]!;

const STEP_TIME = 0.16;
const TIMER = 90;

// '#' wall, '.' floor, 'F' fragment box, 'X' slot, '*' fragment-on-slot, '@' player, '+' player-on-slot
const LEVELS: string[][] = [
  [
    '#########',
    '#.......#',
    '#.#.#.#.#',
    '#.F.X.F.#',
    '#.......#',
    '#.X.@.X.#',
    '#.......#',
    '#.F.X.F.#',
    '#.#.#.#.#',
    '#.......#',
    '#########',
  ],
];

type Tile = '#' | '.' | 'X';
interface Box { x: number; y: number }

/** LABIRINTO — Sokoban. Push fragmentos estruturais into the receptors.
 *  One push at a time, can't pull. Solve the room to bank fragments. */
export class LabirintoScene extends Scene {
  private content = new Container();
  private bg = new Graphics();
  private mapG = new Graphics();
  private boxG = new Graphics();
  private playerG = new Graphics();
  private statusLabel!: Text;
  private hud!: RunHud;
  private juice!: RunJuice;

  private tiles: Tile[][] = [];
  private boxes: Box[] = [];
  private slots: Array<{ x: number; y: number }> = [];
  private px = 0;
  private py = 0;
  private cols = 0;
  private rows = 0;
  private tile = 28;
  private offsetX = 0;
  private offsetY = 0;
  private moveCooldown = 0;
  private dragVec = { x: 0, y: 0 };
  private dragging = false;
  private pointerStart = { x: 0, y: 0 };
  private elapsed = 0;
  private timeLeft = TIMER;
  private banked = 0;
  private ended = false;
  private cleanup: (() => void) | null = null;

  override async enter(): Promise<void> {
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x06080a });
    this.content.addChild(this.bg);
    this.root.addChild(this.content);

    this.parseLevel(LEVELS[0]!);
    this.tile = Math.floor(Math.min((VH - 200) / this.rows, (VW - 32) / this.cols));
    this.offsetX = Math.floor((VW - this.cols * this.tile) / 2);
    this.offsetY = 80;

    this.content.addChild(this.mapG, this.boxG, this.playerG);

    this.juice = new RunJuice(this.root, { accent: Color.hex(ZONE.accent_color), shakeTarget: this.content, ambient: 22 });

    this.hud = buildHud(ZONE);
    this.root.addChild(this.hud.container);
    this.hud.setStatus('roteamento de carga');

    this.statusLabel = new Text({
      text: 'arraste para empurrar',
      style: { fontFamily: FontFamily.mono, fontSize: 10, fill: TextColor.muted, letterSpacing: 1 },
    });
    this.statusLabel.anchor.set(0.5);
    this.statusLabel.x = VW / 2;
    this.statusLabel.y = VH - 50;
    this.root.addChild(this.statusLabel);

    // An undelivered manifest, frozen on a hub terminal.
    const manifest = new Text({
      text: 'MANIFESTO #7741 · DESTINATÁRIO NÃO CATEGORIZADO',
      style: { fontFamily: FontFamily.mono, fontSize: 8, fill: 0x6b5a3a, letterSpacing: 1 },
    });
    manifest.anchor.set(0.5);
    manifest.x = VW / 2;
    manifest.y = 50;
    this.root.addChild(manifest);

    this.bindPointer();
    this.drawMap();

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
    if (this.timeLeft <= 0) { this.end(false); return; }

    this.moveCooldown -= d;
    if (this.moveCooldown <= 0 && this.dragging) {
      const dx = this.dragVec.x;
      const dy = this.dragVec.y;
      if (Math.hypot(dx, dy) > 16) {
        let mx = 0; let my = 0;
        if (Math.abs(dx) > Math.abs(dy)) mx = dx > 0 ? 1 : -1;
        else my = dy > 0 ? 1 : -1;
        this.tryStep(mx, my);
        this.moveCooldown = STEP_TIME;
      }
    }

    // Check solved.
    let onSlot = 0;
    for (const b of this.boxes) {
      if (this.slots.some((s) => s.x === b.x && s.y === b.y)) onSlot += 1;
    }
    this.banked = onSlot;
    if (onSlot >= this.slots.length) { this.end(true); return; }

    this.draw();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`depósitos ${onSlot}/${this.slots.length}`);
    this.hud.setHealth(onSlot / this.slots.length);
  }

  private parseLevel(rows: string[]): void {
    this.rows = rows.length;
    this.cols = rows[0]!.length;
    this.tiles = [];
    this.boxes = [];
    this.slots = [];
    for (let r = 0; r < this.rows; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < this.cols; c++) {
        const ch = rows[r]![c]!;
        if (ch === '#') row.push('#');
        else if (ch === 'X' || ch === '*' || ch === '+') {
          row.push('X');
          this.slots.push({ x: c, y: r });
        } else row.push('.');
        if (ch === 'F' || ch === '*') this.boxes.push({ x: c, y: r });
        if (ch === '@' || ch === '+') { this.px = c; this.py = r; }
      }
      this.tiles.push(row);
    }
  }

  private tile_(c: number, r: number): Tile {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return '#';
    return this.tiles[r]![c]!;
  }

  private boxAt(c: number, r: number): Box | undefined {
    return this.boxes.find((b) => b.x === c && b.y === r);
  }

  private tryStep(mx: number, my: number): void {
    const nx = this.px + mx;
    const ny = this.py + my;
    if (this.tile_(nx, ny) === '#') return;
    const b = this.boxAt(nx, ny);
    if (b) {
      const bx = b.x + mx;
      const by = b.y + my;
      if (this.tile_(bx, by) === '#') return;
      if (this.boxAt(bx, by)) return;
      const wasOnSlot = this.slots.some((s) => s.x === b.x && s.y === b.y);
      b.x = bx; b.y = by;
      const nowOnSlot = this.slots.some((s) => s.x === bx && s.y === by);
      if (nowOnSlot && !wasOnSlot) {
        this.juice.pop(this.offsetX + bx * this.tile + this.tile / 2, this.offsetY + by * this.tile + this.tile / 2);
      }
    }
    this.px = nx; this.py = ny;
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
    const onUp = (): void => {
      // commit one final step on release if the gesture clearly went one way.
      if (this.dragging && Math.hypot(this.dragVec.x, this.dragVec.y) > 16 && this.moveCooldown <= 0) {
        const dx = this.dragVec.x;
        const dy = this.dragVec.y;
        let mx = 0; let my = 0;
        if (Math.abs(dx) > Math.abs(dy)) mx = dx > 0 ? 1 : -1;
        else my = dy > 0 ? 1 : -1;
        this.tryStep(mx, my);
      }
      this.dragging = false;
      this.dragVec = { x: 0, y: 0 };
    };
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

  private drawMap(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.mapG.clear();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = this.offsetX + c * this.tile;
        const y = this.offsetY + r * this.tile;
        const t = this.tiles[r]![c]!;
        if (t === '#') {
          // FLOW cargo-bay door panel with a directional chevron.
          this.mapG.rect(x, y, this.tile, this.tile).fill({ color: 0x1f2127 });
          this.mapG.rect(x + 2, y + 2, this.tile - 4, this.tile - 4).fill({ color: 0x2c3038 });
          this.mapG.poly([x + this.tile * 0.34, y + this.tile * 0.34, x + this.tile * 0.52, y + this.tile * 0.5, x + this.tile * 0.34, y + this.tile * 0.66])
            .stroke({ color: 0x3c434c, width: 1.5, alpha: 0.55 });
        } else if (t === '.') {
          this.mapG.rect(x, y, this.tile, this.tile).fill({ color: 0x101418 });
        } else if (t === 'X') {
          // Cargo deposit station — recessed bay with a hazard-stripe frame.
          this.mapG.rect(x, y, this.tile, this.tile).fill({ color: 0x101418 });
          this.mapG.rect(x + 4, y + 4, this.tile - 8, this.tile - 8).fill({ color: 0x16191e });
          this.mapG.rect(x + 3, y + 3, this.tile - 6, this.tile - 6).stroke({ color: 0xb8a13a, width: 2, alpha: 0.55 });
          this.mapG.circle(x + this.tile / 2, y + this.tile / 2, this.tile * 0.16)
            .stroke({ color: accent, width: 2, alpha: 0.85 });
        }
      }
    }
  }

  private draw(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.boxG.clear();
    for (const b of this.boxes) {
      const x = this.offsetX + b.x * this.tile;
      const y = this.offsetY + b.y * this.tile;
      const onSlot = this.slots.some((s) => s.x === b.x && s.y === b.y);
      const color = onSlot ? accent : 0x8e7d5a;
      this.boxG.rect(x + 3, y + 3, this.tile - 6, this.tile - 6).fill({ color, alpha: 0.95 });
      this.boxG.rect(x + 6, y + 6, this.tile - 12, this.tile - 12).fill({ color: 0xffffff, alpha: onSlot ? 0.4 : 0.18 });
      // Cargo-container label stripe.
      this.boxG.rect(x + 5, y + this.tile / 2 - 2, this.tile - 10, 4).fill({ color: 0x000000, alpha: 0.28 });
    }
    const px = this.offsetX + this.px * this.tile + this.tile / 2;
    const py = this.offsetY + this.py * this.tile + this.tile / 2;
    this.playerG.clear();
    this.playerG.circle(px, py, this.tile * 0.34).fill({ color: accent, alpha: 0.25 });
    this.playerG.circle(px, py, this.tile * 0.26).fill({ color: accent });
    this.playerG.circle(px, py, this.tile * 0.14).fill({ color: 0xffffff });
  }

  private end(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
    if (victory && this.banked > 0) {
      HubState.depositFlow('fragmentos_estruturais', this.banked);
    }
    HubState.onRunEnded(victory);
    this.root.addChild(buildEndOverlay({
      zone: ZONE,
      victory,
      rewardLabel: `+${this.banked} Frag. Estruturais — entregas concluídas`,
      failLabel: 'Rota de contenção ativada. Saída bloqueada.',
    }));
  }
}
