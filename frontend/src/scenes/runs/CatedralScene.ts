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

const PYRAMID_SIZE = 6; // rows
const TILE_W = 56;
const TILE_H = 40;
const TILE_DEPTH = 22;
const HOP_TIME = 0.18;
const TIMER = 90;
const DROP_INTERVAL = 3.5;

interface TileCell { lit: boolean }
interface Hazard { row: number; col: number; t: number; falling: boolean }

/** CATEDRAL — Q*bert. Isometric pyramid; tap an adjacent tile to hop on it
 *  and light it (collect a relíquia). Falling hazards drop along the pyramid.
 *  Light every tile to win. */
export class CatedralScene extends Scene {
  private content = new Container();
  private bg = new Graphics();
  private pyramidG = new Graphics();
  private hazardsG = new Graphics();
  private playerG = new Graphics();
  private hud!: RunHud;
  private juice!: RunJuice;

  private tiles: TileCell[][] = [];
  private row = 0;
  private col = 0;
  private fromXY = { x: 0, y: 0 };
  private toXY = { x: 0, y: 0 };
  private hopAnim = 1;
  private hazards: Hazard[] = [];
  private nextDrop = 2;
  private elapsed = 0;
  private timeLeft = TIMER;
  private litCount = 0;
  private totalTiles = 0;
  private ended = false;
  private originX = VW / 2;
  private originY = 130;
  private cleanup: (() => void) | null = null;

  override async enter(): Promise<void> {
    const accent = Color.hex(ZONE.accent_color);
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x080606 });
    // Soft halo behind the pyramid.
    for (let i = 12; i > 0; i--) {
      this.bg.circle(VW / 2, VH * 0.45, i * 16).fill({ color: accent, alpha: 0.012 });
    }
    // Soaring nave: arch silhouettes flanking the pyramid + a rose window.
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

    for (let r = 0; r < PYRAMID_SIZE; r++) {
      const row: TileCell[] = [];
      for (let c = 0; c <= r; c++) { row.push({ lit: false }); this.totalTiles += 1; }
      this.tiles.push(row);
    }
    // Player starts at the apex.
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
    if (this.timeLeft <= 0) { this.end(this.litCount >= this.totalTiles * 0.7); return; }

    if (this.hopAnim < 1) this.hopAnim = Math.min(1, this.hopAnim + d / HOP_TIME);

    this.nextDrop -= d;
    if (this.nextDrop <= 0) {
      // Spawn hazard at apex, drifting down random branch.
      this.hazards.push({ row: 0, col: 0, t: 0, falling: true });
      this.nextDrop = DROP_INTERVAL + Math.random();
    }

    // Hazards descend along pyramid branches.
    const alive: Hazard[] = [];
    for (const h of this.hazards) {
      h.t += d;
      if (h.t >= HOP_TIME) {
        h.t = 0;
        const dirRight = Math.random() < 0.5;
        const nr = h.row + 1;
        const nc = h.col + (dirRight ? 1 : 0);
        if (nr >= PYRAMID_SIZE) continue;
        h.row = nr;
        h.col = nc;
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

    if (this.litCount >= this.totalTiles) { this.end(true); return; }

    this.draw();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`relíquias ${this.litCount}/${this.totalTiles}`);
    this.hud.setHealth(this.litCount / this.totalTiles);
  }

  private tileCenter(row: number, col: number): { x: number; y: number } {
    const rowOffset = -row * (TILE_W / 2);
    const x = this.originX + col * TILE_W + rowOffset;
    const y = this.originY + row * (TILE_H + TILE_DEPTH * 0.6);
    return { x, y };
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
    const onTap = (e: PointerEvent): void => {
      if (this.hopAnim < 1) return;
      const p = toLocal(e);
      // Try each of the 4 neighbors and hop to the one tapped (if exists).
      const neighbors = [
        { r: this.row - 1, c: this.col - 1, name: 'NW' },
        { r: this.row - 1, c: this.col,     name: 'NE' },
        { r: this.row + 1, c: this.col,     name: 'SW' },
        { r: this.row + 1, c: this.col + 1, name: 'SE' },
      ];
      let best: { r: number; c: number } | null = null;
      let bestDist = 999;
      for (const n of neighbors) {
        if (n.r < 0 || n.r >= PYRAMID_SIZE) continue;
        if (n.c < 0 || n.c > n.r) continue;
        const ctr = this.tileCenter(n.r, n.c);
        const dd = Math.hypot(ctr.x - p.x, ctr.y - p.y);
        if (dd < bestDist) { bestDist = dd; best = { r: n.r, c: n.c }; }
      }
      if (best && bestDist < 60) {
        this.fromXY = this.tileCenter(this.row, this.col);
        this.toXY = this.tileCenter(best.r, best.c);
        this.row = best.r; this.col = best.c;
        this.hopAnim = 0;
        this.juice.jump(this.toXY.x, this.toXY.y - 18);
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

  private draw(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.pyramidG.clear();
    for (let r = 0; r < PYRAMID_SIZE; r++) {
      for (let c = 0; c <= r; c++) {
        const ctr = this.tileCenter(r, c);
        const x = ctr.x; const y = ctr.y;
        const tile = this.tiles[r]![c]!;
        // Isometric diamond.
        const top = { x, y: y - TILE_H / 2 };
        const right = { x: x + TILE_W / 2, y };
        const bottom = { x, y: y + TILE_H / 2 };
        const left = { x: x - TILE_W / 2, y };
        // Top face — antique mosaic: each unlit tile slightly varies in tone.
        const j = (((r * 7 + c * 13) % 7) - 3) * 0.012;
        const unlit = Color.hex(Color.rgb(0.165 + j, 0.125 + j, 0.094 + j * 0.6));
        this.pyramidG
          .moveTo(top.x, top.y).lineTo(right.x, right.y)
          .lineTo(bottom.x, bottom.y).lineTo(left.x, left.y).lineTo(top.x, top.y)
          .fill({ color: tile.lit ? accent : unlit, alpha: tile.lit ? 0.85 : 1 });
        // Side faces
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

    // Hazards.
    this.hazardsG.clear();
    for (const h of this.hazards) {
      const c = this.tileCenter(h.row, h.col);
      // ARGOS audio-sampling probe: a metallic pod with a red sensor capsule.
      this.hazardsG.ellipse(c.x, c.y - 18, 7, 9).fill({ color: 0x5b6a78, alpha: 0.95 });
      this.hazardsG.ellipse(c.x, c.y - 18, 7, 9).stroke({ color: 0xff3a3a, width: 1.5, alpha: 0.8 });
      const blink = 0.5 + 0.5 * Math.sin(this.elapsed * 8 + h.col);
      this.hazardsG.circle(c.x, c.y - 23, 2.4).fill({ color: 0xff2424, alpha: 0.6 + 0.4 * blink });
    }

    // Player — hop interpolation with vertical arc.
    const t = this.hopAnim;
    const x = this.fromXY.x + (this.toXY.x - this.fromXY.x) * t;
    const y = this.fromXY.y + (this.toXY.y - this.fromXY.y) * t;
    const arc = Math.sin(t * Math.PI) * 16;
    this.playerG.clear();
    this.playerG.circle(x, y - 18 - arc, 11).fill({ color: accent, alpha: 0.3 });
    this.playerG.circle(x, y - 18 - arc, 8).fill({ color: accent });
    this.playerG.circle(x, y - 18 - arc, 5).fill({ color: 0xffffff });
  }

  private end(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
    const reward = victory ? this.litCount : 0;
    if (victory && reward > 0) {
      // No "reliquias" key — bank as fragmentos_estruturais thematically.
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
