import { Container, Graphics } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
import { ZONES } from '../../state/Zones';
import type { Vec2 } from '../../core/types';
import { RunJuice } from '../../run/fx/RunJuice';
import { buildHud, buildEndOverlay, bindDrag, type RunHud, type DragInput } from './RunFrame';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;
const ZONE = ZONES[0]!;

const FOREST = Color.hex(Color.rgb(0.38, 0.82, 0.47));

const TOP = 50;
const FIELD = { x: 6, y: TOP, w: VW - 12, h: VH - TOP - 10 };

const PLAYER_R = 12;
const PLAYER_HP = 100;
const PLAYER_SPEED = 235;

const FIRE_INTERVAL = 0.3;
const PROJ_SPEED = 380;
const PROJ_LIFE = 1.2;

const ROBOT_R = 9;
const ROBOT_GRAB_DMG = 16;
const ROBOT_CAP = 28;
const SPAWN_START = 1.6;
const SPAWN_MIN = 0.5;

const HARVEST_TIME = 1.7;
const FUNGI_ON_FIELD = 5;
const GOAL = 8;

interface Robot { pos: Vec2; speed: number; spark: number }
interface Proj { pos: Vec2; vel: Vec2; life: number }
interface Fungus { pos: Vec2; phase: number; harvest: number }

/** HORDAS — the AI's automated forest. Dr. Paulo enters alone with an
 *  improvised bio-chem weapon that short-circuits the gardener-bots sent to
 *  grab him. He fires constantly, except while crouched harvesting a fungus —
 *  when he's defenceless. Harvest the quota, then run for extraction. */
export class HordasScene extends Scene {
  private content = new Container();
  private bg = new Graphics();
  private floraG = new Graphics();
  private fungusG = new Graphics();
  private robotG = new Graphics();
  private projG = new Graphics();
  private playerG = new Graphics();
  private extractG = new Graphics();
  private hud!: RunHud;
  private drag!: DragInput;
  private juice!: RunJuice;

  private player: Vec2 = { x: VW / 2, y: VH * 0.62 };
  private hp = PLAYER_HP;
  private fireTimer = 0;
  private robots: Robot[] = [];
  private projs: Proj[] = [];
  private fungi: Fungus[] = [];
  private harvested = 0;
  private harvestIdx = -1;
  private hurtFlash = 0;
  private spawnTimer = SPAWN_START;
  private elapsed = 0;
  private extractOpen = false;
  private extractPos: Vec2 = { x: VW / 2, y: TOP + 30 };
  private ended = false;

  override async enter(): Promise<void> {
    this.buildForest();
    this.content.addChild(this.bg, this.floraG, this.fungusG, this.extractG, this.projG, this.robotG, this.playerG);
    this.root.addChild(this.content);

    for (let i = 0; i < FUNGI_ON_FIELD; i++) this.spawnFungus();

    this.juice = new RunJuice(this.root, { accent: FOREST, shakeTarget: this.content, ambient: 40 });

    this.hud = buildHud(ZONE);
    this.root.addChild(this.hud.container);
    this.hud.setStatus('colhendo');

    this.drag = bindDrag(this.app.pixi.canvas, this.app.world, this.player);

    audioManager.playMusic('res://assets/audio/music/battle.wav', { loop: true, volume: 0.32, fadeMs: 500 }).catch(() => undefined);
  }

  override exit(): void {
    audioManager.stopMusic(300);
    this.drag.cleanup();
    this.juice.destroy();
  }

  override update(dt: number): void {
    const d = Math.min(dt, 1 / 30);
    this.juice.update(d);
    if (this.ended) return;
    this.elapsed += d;
    this.hurtFlash = Math.max(0, this.hurtFlash - d * 3);

    this.movePlayer(d);
    this.updateHarvest(d);
    this.updateFire(d);
    this.updateProjectiles(d);
    this.updateRobots(d);

    if (this.extractOpen && Math.hypot(this.player.x - this.extractPos.x, this.player.y - this.extractPos.y) < 26) {
      this.end(true);
      return;
    }

    this.draw();
    this.hud.setTimer(this.elapsed);
    this.hud.setScore(this.extractOpen ? '→ EXTRAÇÃO' : `fungos ${this.harvested}/${GOAL}`);
    this.hud.setHealth(this.hp / PLAYER_HP);
  }

  // ── Player ────────────────────────────────────────────────────────────────
  private movePlayer(dt: number): void {
    if (!this.drag.dragging) return;
    const dx = this.drag.pos.x - this.player.x;
    const dy = this.drag.pos.y - this.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return;
    const step = Math.min(dist, PLAYER_SPEED * dt);
    this.player.x += (dx / dist) * step;
    this.player.y += (dy / dist) * step;
    this.player.x = Math.max(FIELD.x + PLAYER_R, Math.min(FIELD.x + FIELD.w - PLAYER_R, this.player.x));
    this.player.y = Math.max(FIELD.y + PLAYER_R, Math.min(FIELD.y + FIELD.h - PLAYER_R, this.player.y));
  }

  private get harvesting(): boolean { return this.harvestIdx >= 0; }

  private updateHarvest(dt: number): void {
    // Standing on a fungus harvests it; moving off cancels.
    let onIdx = -1;
    for (let i = 0; i < this.fungi.length; i++) {
      const f = this.fungi[i]!;
      if (Math.hypot(f.pos.x - this.player.x, f.pos.y - this.player.y) < PLAYER_R + 14) { onIdx = i; break; }
    }
    if (onIdx < 0) { this.harvestIdx = -1; return; }
    if (this.harvestIdx !== onIdx) { this.harvestIdx = onIdx; this.fungi[onIdx]!.harvest = 0; }
    const f = this.fungi[onIdx]!;
    f.harvest += dt;
    if (f.harvest >= HARVEST_TIME) {
      this.harvested += 1;
      this.juice.pop(f.pos.x, f.pos.y, FOREST);
      this.juice.flash(FOREST, 0.10, 0.2);
      this.fungi.splice(onIdx, 1);
      this.harvestIdx = -1;
      if (this.harvested >= GOAL && !this.extractOpen) this.openExtraction();
      else this.spawnFungus();
    }
  }

  private openExtraction(): void {
    this.extractOpen = true;
    // Place the extraction beacon at the top edge, away from the player.
    this.extractPos = { x: this.player.x < VW / 2 ? FIELD.x + FIELD.w - 40 : FIELD.x + 40, y: FIELD.y + 36 };
    this.hud.setStatus('extração aberta');
    this.juice.alarm(FOREST);
  }

  // ── Bio-chem weapon (auto-fire, except while harvesting) ───────────────────
  private updateFire(dt: number): void {
    this.fireTimer -= dt;
    if (this.harvesting) return; // crouched, defenceless
    if (this.fireTimer > 0) return;
    const target = this.nearestRobot();
    if (!target) return;
    this.fireTimer = FIRE_INTERVAL;
    const dx = target.pos.x - this.player.x;
    const dy = target.pos.y - this.player.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.projs.push({
      pos: { x: this.player.x, y: this.player.y },
      vel: { x: (dx / dist) * PROJ_SPEED, y: (dy / dist) * PROJ_SPEED },
      life: PROJ_LIFE,
    });
    audioManager.playSfx('res://assets/audio/sfx/ui/Click_03.wav', 0.18);
  }

  private nearestRobot(): Robot | null {
    let best: Robot | null = null;
    let bd = Infinity;
    for (const r of this.robots) {
      if (r.spark > 0) continue;
      const dd = (r.pos.x - this.player.x) ** 2 + (r.pos.y - this.player.y) ** 2;
      if (dd < bd) { bd = dd; best = r; }
    }
    return best;
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i]!;
      p.life -= dt;
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      if (p.life <= 0 || p.pos.x < 0 || p.pos.x > VW || p.pos.y < TOP || p.pos.y > VH) {
        this.projs.splice(i, 1);
        continue;
      }
      for (const r of this.robots) {
        if (r.spark > 0) continue;
        if (Math.hypot(r.pos.x - p.pos.x, r.pos.y - p.pos.y) < ROBOT_R + 4) {
          r.spark = 0.32; // short-circuited
          this.projs.splice(i, 1);
          this.juice.burst(r.pos.x, r.pos.y, { count: 9, color: 0x9fffe0, speed: 150, life: 0.3, size: 1.8 });
          break;
        }
      }
    }
  }

  // ── Gardener-bots ──────────────────────────────────────────────────────────
  private updateRobots(dt: number): void {
    // Escalating spawns.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.robots.length < ROBOT_CAP) {
      this.spawnRobot();
      const ramp = Math.max(SPAWN_MIN, SPAWN_START - this.elapsed * 0.012 - (this.extractOpen ? 0.6 : 0));
      this.spawnTimer = ramp;
    }

    for (let i = this.robots.length - 1; i >= 0; i--) {
      const r = this.robots[i]!;
      if (r.spark > 0) {
        r.spark -= dt;
        if (r.spark <= 0) this.robots.splice(i, 1);
        continue;
      }
      const dx = this.player.x - r.pos.x;
      const dy = this.player.y - r.pos.y;
      const dist = Math.hypot(dx, dy) || 1;
      r.pos.x += (dx / dist) * r.speed * dt;
      r.pos.y += (dy / dist) * r.speed * dt;
      if (dist < PLAYER_R + ROBOT_R) {
        // Grabbed him.
        this.hp -= ROBOT_GRAB_DMG;
        this.hurtFlash = 1;
        this.juice.hurt(this.player.x, this.player.y);
        this.robots.splice(i, 1);
        if (this.hp <= 0) { this.hp = 0; this.end(false); return; }
      }
    }
  }

  private spawnRobot(): void {
    const edge = Math.floor(Math.random() * 4);
    const rand = (a: number, b: number): number => a + Math.random() * (b - a);
    let pos: Vec2;
    if (edge === 0) pos = { x: rand(FIELD.x, FIELD.x + FIELD.w), y: FIELD.y + 4 };
    else if (edge === 1) pos = { x: rand(FIELD.x, FIELD.x + FIELD.w), y: FIELD.y + FIELD.h - 4 };
    else if (edge === 2) pos = { x: FIELD.x + 4, y: rand(FIELD.y, FIELD.y + FIELD.h) };
    else pos = { x: FIELD.x + FIELD.w - 4, y: rand(FIELD.y, FIELD.y + FIELD.h) };
    this.robots.push({ pos, speed: 64 + Math.random() * 28 + this.elapsed * 0.25, spark: 0 });
  }

  private spawnFungus(): void {
    let tries = 24;
    while (tries-- > 0) {
      const x = FIELD.x + 26 + Math.random() * (FIELD.w - 52);
      const y = FIELD.y + 26 + Math.random() * (FIELD.h - 52);
      if (Math.hypot(x - this.player.x, y - this.player.y) > 70) {
        this.fungi.push({ pos: { x, y }, phase: Math.random() * Math.PI * 2, harvest: 0 });
        return;
      }
    }
  }

  // ── Forest art ──────────────────────────────────────────────────────────────
  private buildForest(): void {
    // Canopy-light gradient: lighter at the top, deep forest floor below.
    const steps = 30;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const c = Color.rgb(0.04 + t * 0.02, 0.10 + t * 0.10, 0.06 + t * 0.05);
      this.bg.rect(0, TOP + (FIELD.h * i) / steps, VW, FIELD.h / steps + 1).fill(Color.hex(c));
    }
    // Soft god-rays slanting from the canopy.
    for (const sx of [VW * 0.2, VW * 0.55, VW * 0.82]) {
      this.bg.poly([sx, TOP, sx + 26, TOP, sx - 50, VH, sx - 90, VH]).fill({ color: 0xbfffd0, alpha: 0.03 });
    }
    // The AI tends it in neat rows — manicured clusters of cultivated flora.
    const rng = (n: number): number => ((Math.sin(n * 127.1) * 43758.5) % 1 + 1) % 1;
    let seed = 0;
    for (let ry = TOP + 40; ry < VH - 30; ry += 64) {
      for (let rx = 24; rx < VW - 16; rx += 52) {
        seed++;
        const jx = rx + (rng(seed) - 0.5) * 14;
        const jy = ry + (rng(seed * 2) - 0.5) * 14;
        const tone = [0x1c3a22, 0x24472a, 0x2a3a4a][seed % 3]!;
        // little bush
        this.floraG.circle(jx, jy, 6 + rng(seed * 3) * 4).fill({ color: tone, alpha: 0.85 });
        // a bloom on some
        if (rng(seed * 5) > 0.55) {
          const bloom = [0xff8fc4, 0xffd36b, 0xb78fff, 0x7fe0ff][seed % 4]!;
          this.floraG.circle(jx, jy - 3, 2.4).fill({ color: bloom, alpha: 0.8 });
        }
      }
    }
    // Field border — a living hedge.
    this.bg.rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h).stroke({ color: 0x2c5a36, width: 2, alpha: 0.6 });
  }

  private draw(): void {
    const t = this.elapsed;

    // Fungi — glowing harvestable mushrooms; the one being harvested fills a ring.
    this.fungusG.clear();
    for (let i = 0; i < this.fungi.length; i++) {
      const f = this.fungi[i]!;
      const pulse = 0.6 + 0.4 * Math.sin(t * 3 + f.phase);
      this.fungusG.circle(f.pos.x, f.pos.y, 16).fill({ color: FOREST, alpha: 0.10 * pulse });
      // stem + cap
      this.fungusG.rect(f.pos.x - 2, f.pos.y, 4, 9).fill({ color: 0xe6e0c8, alpha: 0.9 });
      this.fungusG.ellipse(f.pos.x, f.pos.y, 9, 6).fill({ color: FOREST, alpha: 0.95 });
      this.fungusG.ellipse(f.pos.x, f.pos.y - 1, 4, 2.6).fill({ color: 0xffffff, alpha: 0.6 * pulse });
      if (this.harvestIdx === i) {
        const prog = Math.min(1, f.harvest / HARVEST_TIME);
        this.fungusG.arc(f.pos.x, f.pos.y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog, false)
          .stroke({ color: 0xfff0a0, width: 3, alpha: 0.95 });
      }
    }

    // Extraction beacon.
    this.extractG.clear();
    if (this.extractOpen) {
      const p = 0.5 + 0.5 * Math.sin(t * 5);
      this.extractG.circle(this.extractPos.x, this.extractPos.y, 22 + p * 5).stroke({ color: FOREST, width: 2, alpha: 0.5 });
      this.extractG.circle(this.extractPos.x, this.extractPos.y, 13).fill({ color: FOREST, alpha: 0.3 + 0.3 * p });
      this.extractG.circle(this.extractPos.x, this.extractPos.y, 6).fill({ color: 0xffffff, alpha: 0.8 });
    }

    // Projectiles — bio-chem darts.
    this.projG.clear();
    for (const p of this.projs) {
      this.projG.circle(p.pos.x, p.pos.y, 3).fill({ color: 0x9fffe0, alpha: 0.95 });
      this.projG.circle(p.pos.x, p.pos.y, 5).fill({ color: 0x9fffe0, alpha: 0.25 });
    }

    // Gardener-bots.
    this.robotG.clear();
    for (const r of this.robots) {
      if (r.spark > 0) {
        // short-circuiting: erratic spark
        const j = (Math.random() - 0.5) * 6;
        this.robotG.rect(r.pos.x - 6 + j, r.pos.y - 6, 12, 12).fill({ color: 0x9fffe0, alpha: 0.7 });
        continue;
      }
      this.robotG.rect(r.pos.x - ROBOT_R, r.pos.y - ROBOT_R + 2, ROBOT_R * 2, ROBOT_R * 2 - 2).fill({ color: 0x4a5560 });
      this.robotG.rect(r.pos.x - ROBOT_R, r.pos.y - ROBOT_R + 2, ROBOT_R * 2, ROBOT_R * 2 - 2).stroke({ color: 0x7a8694, width: 1, alpha: 0.6 });
      // little claws
      this.robotG.moveTo(r.pos.x - ROBOT_R, r.pos.y - 4).lineTo(r.pos.x - ROBOT_R - 4, r.pos.y - 7)
        .moveTo(r.pos.x + ROBOT_R, r.pos.y - 4).lineTo(r.pos.x + ROBOT_R + 4, r.pos.y - 7)
        .stroke({ color: 0x8a96a4, width: 1.5, alpha: 0.7 });
      // red sensor eye
      const blink = 0.6 + 0.4 * Math.sin(t * 6 + r.pos.x);
      this.robotG.circle(r.pos.x, r.pos.y, 2.6).fill({ color: 0xff3a3a, alpha: 0.6 + 0.4 * blink });
    }

    // Paulo — fires upright; crouches (no weapon) while harvesting.
    this.playerG.clear();
    const pc = this.hurtFlash > 0.4 ? 0xff5a5a : FOREST;
    if (this.harvesting) {
      // crouched, exposed — a warning ring pulses.
      const wp = 0.5 + 0.5 * Math.sin(t * 9);
      this.playerG.circle(this.player.x, this.player.y, PLAYER_R + 6).stroke({ color: 0xffcf4d, width: 2, alpha: 0.4 + 0.4 * wp });
      this.playerG.ellipse(this.player.x, this.player.y + 2, PLAYER_R, PLAYER_R * 0.7).fill({ color: pc, alpha: 0.95 });
    } else {
      this.playerG.circle(this.player.x, this.player.y, PLAYER_R + 4).fill({ color: pc, alpha: 0.2 });
      this.playerG.circle(this.player.x, this.player.y, PLAYER_R).fill({ color: pc, alpha: 0.95 });
      this.playerG.circle(this.player.x, this.player.y, PLAYER_R - 4).fill({ color: 0xffffff, alpha: 0.65 });
      // muzzle: a small barrel pointing at the nearest robot
      const tgt = this.nearestRobot();
      if (tgt) {
        const a = Math.atan2(tgt.pos.y - this.player.y, tgt.pos.x - this.player.x);
        this.playerG.moveTo(this.player.x, this.player.y).lineTo(this.player.x + Math.cos(a) * (PLAYER_R + 8), this.player.y + Math.sin(a) * (PLAYER_R + 8))
          .stroke({ color: 0x9fffe0, width: 3, alpha: 0.8 });
      }
    }
  }

  private end(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
    if (victory && this.harvested > 0) {
      HubState.depositFlow('biomassa_adaptativa', this.harvested);
    }
    HubState.onRunEnded(victory);
    this.root.addChild(buildEndOverlay({
      zone: ZONE,
      victory,
      rewardLabel: `+${this.harvested} Biomassa — fungos extraídos`,
      failLabel: 'Capturado pelos jardineiros.',
    }));
  }
}
