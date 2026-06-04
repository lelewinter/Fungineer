import { Container, Graphics, Text } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { FontFamily, TextColor } from '../../core/typography';
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

// ── Player ────────────────────────────────────────────────────────────────
const PLAYER_R = 12;
const BASE_HP = 100;
const BASE_SPEED = 230;
const BASE_PICKUP = 48;

// ── Enemies (gardener-bots) ─────────────────────────────────────────────────
const ENEMY_CAP = 76;
const SPAWN_START = 1.4;
const SPAWN_MIN = 0.32;
const TOUCH_CD = 0.6;

type EKind = 'sprout' | 'crawler' | 'brute' | 'boss';
interface EnemyStat { hp: number; speed: number; dmg: number; r: number; xp: number; color: number }
const ESTATS: Record<EKind, EnemyStat> = {
  sprout: { hp: 14, speed: 52, dmg: 6, r: 8, xp: 1, color: 0x4a5560 },
  crawler: { hp: 32, speed: 72, dmg: 8, r: 9, xp: 2, color: 0x5a6470 },
  brute: { hp: 96, speed: 34, dmg: 16, r: 14, xp: 5, color: 0x6a5560 },
  boss: { hp: 900, speed: 30, dmg: 24, r: 24, xp: 40, color: 0x7a4a5a },
};

interface Enemy {
  kind: EKind;
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  dmg: number;
  r: number;
  xp: number;
  color: number;
  flash: number;
  touchCd: number;
  orbitCd: number;
}

interface Proj { pos: Vec2; vel: Vec2; life: number; dmg: number; pierce: number; hit: Set<Enemy> }
interface Gem { pos: Vec2; vel: Vec2; value: number; t: number }
interface Nova { x: number; y: number; r: number; max: number; life: number }
interface Fungus { pos: Vec2; phase: number; harvest: number }

// ── Arsenal — Vampire-Survivors-style auto weapons (level 1..5) ──────────────
const MAXLV = 5;
const DART = {
  interval: [0.42, 0.34, 0.30, 0.26, 0.22],
  dmg: [7, 8, 9, 11, 13],
  count: [1, 1, 2, 2, 3],
  pierce: [0, 0, 0, 1, 1],
};
const PROJ_SPEED = 400;
const PROJ_LIFE = 1.1;
const AURA = { r: [46, 54, 62, 72, 84], dps: [10, 16, 22, 30, 40] };
const ORBIT = { count: [2, 2, 3, 4, 5], dmg: [8, 11, 13, 15, 18], r: [40, 44, 48, 52, 56] };
const NOVA = { cd: [4.0, 3.6, 3.2, 2.8, 2.4], dmg: [18, 24, 30, 38, 48], r: [90, 105, 120, 135, 150] };

type WeaponId = 'dart' | 'aura' | 'orbit' | 'nova';
type PassiveId = 'maxhp' | 'speed' | 'magnet' | 'power' | 'regen';

const WEAPON_NAME: Record<WeaponId, string> = {
  dart: 'Bio-dardo', aura: 'Névoa de esporos', orbit: 'Bulbos orbitais', nova: 'Explosão de pólen',
};
const WEAPON_DESC: Record<WeaponId, string> = {
  dart: 'Dispara no inimigo mais próximo. Sobe dano, cadência e projéteis.',
  aura: 'Esporos tóxicos corroem tudo ao seu redor, sem mirar.',
  orbit: 'Bulbos giram ao seu redor e esmagam quem chega perto.',
  nova: 'Pulsos de pólen explodem em área, empurrando a horda.',
};
const PASSIVE_NAME: Record<PassiveId, string> = {
  maxhp: 'Casca reforçada', speed: 'Passada leve', magnet: 'Esporo magnético', power: 'Toxina concentrada', regen: 'Micélio curativo',
};
const PASSIVE_DESC: Record<PassiveId, string> = {
  maxhp: '+25 vida máxima e cura na hora.',
  speed: '+22 de velocidade de movimento.',
  magnet: '+20 de raio de coleta de gemas.',
  power: '+15% de dano em todas as armas.',
  regen: '+0.8 de vida por segundo.',
};

interface Offer {
  kind: 'weapon' | 'passive' | 'heal';
  id?: WeaponId | PassiveId;
  name: string;
  desc: string;
  tag: string;
}

const GOAL = 6;
const FUNGI_ON_FIELD = 4;
const HARVEST_TIME = 1.7;

const rand = (a: number, b: number): number => a + Math.random() * (b - a);

/** HORDAS — the AI's automated forest, reborn as a Vampire-Survivors arena.
 *  Dr. Paulo enters alone; his bio-chem arsenal auto-fires while he only moves.
 *  Gardener-bots swarm in escalating hordes — kill them for XP gems, level up,
 *  and pick new weapons/upgrades from the card draft. Harvest the fungi quota
 *  (defenceless main gun while crouched) to call extraction, survive the
 *  Jardineiro-Mestre that comes to stop you, then run for the beacon. */
export class HordasScene extends Scene {
  private content = new Container();
  private bg = new Graphics();
  private floraG = new Graphics();
  private auraG = new Graphics();
  private fungusG = new Graphics();
  private extractG = new Graphics();
  private gemG = new Graphics();
  private novaG = new Graphics();
  private enemyG = new Graphics();
  private projG = new Graphics();
  private orbitG = new Graphics();
  private playerG = new Graphics();

  private overlay = new Container();
  private xpG = new Graphics();
  private levelText!: Text;

  private hud!: RunHud;
  private drag!: DragInput;
  private juice!: RunJuice;

  // Player state
  private player: Vec2 = { x: VW / 2, y: VH * 0.62 };
  private hp = BASE_HP;
  private maxHp = BASE_HP;
  private moveSpeed = BASE_SPEED;
  private pickupRadius = BASE_PICKUP;
  private damageMult = 1;
  private regen = 0;
  private hurtFlash = 0;

  // Progression
  private level = 1;
  private xp = 0;
  private xpNext = 5;
  private pendingLevels = 0;
  private kills = 0;
  private paused = false;

  // Arsenal
  private weapons: Record<WeaponId, number> = { dart: 1, aura: 0, orbit: 0, nova: 0 };
  private passives: Record<PassiveId, number> = { maxhp: 0, speed: 0, magnet: 0, power: 0, regen: 0 };
  private fireTimer = 0;
  private auraTimer = 0;
  private novaTimer = NOVA.cd[0]!;
  private orbitAngle = 0;

  // Entities
  private enemies: Enemy[] = [];
  private projs: Proj[] = [];
  private gems: Gem[] = [];
  private novas: Nova[] = [];
  private fungi: Fungus[] = [];

  // Run flow
  private harvested = 0;
  private harvestIdx = -1;
  private spawnTimer = SPAWN_START;
  private elapsed = 0;
  private extractOpen = false;
  private bossSpawned = false;
  private extractPos: Vec2 = { x: VW / 2, y: TOP + 36 };
  private ended = false;

  override async enter(): Promise<void> {
    this.buildForest();
    this.content.addChild(
      this.bg, this.floraG, this.auraG, this.fungusG, this.extractG,
      this.gemG, this.novaG, this.enemyG, this.projG, this.orbitG, this.playerG,
    );
    this.root.addChild(this.content);

    for (let i = 0; i < FUNGI_ON_FIELD; i++) this.spawnFungus();

    this.juice = new RunJuice(this.root, { accent: FOREST, shakeTarget: this.content, ambient: 40 });

    this.hud = buildHud(ZONE);
    this.root.addChild(this.hud.container);

    // XP bar + level readout — steady on root (not shaken with the field).
    this.overlay.zIndex = 90;
    this.levelText = new Text({
      text: 'Nv 1',
      style: { fontFamily: FontFamily.mono, fontSize: 11, fill: TextColor.ink, fontWeight: '700' },
    });
    this.levelText.x = 8;
    this.levelText.y = 48;
    this.overlay.addChild(this.xpG, this.levelText);
    this.root.addChild(this.overlay);

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
    if (this.ended || this.paused) return;
    this.elapsed += d;
    this.hurtFlash = Math.max(0, this.hurtFlash - d * 3);
    if (this.regen > 0 && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.regen * d);

    this.movePlayer(d);
    this.updateHarvest(d);

    // Arsenal.
    this.updateDart(d);
    this.updateAura(d);
    this.updateOrbit(d);
    this.updateNova(d);
    this.updateProjectiles(d);

    this.updateSpawns(d);
    this.updateEnemies(d);
    this.updateGems(d);
    this.updateNovaRings(d);

    if (this.extractOpen && Math.hypot(this.player.x - this.extractPos.x, this.player.y - this.extractPos.y) < 26) {
      this.end(true);
      return;
    }

    this.draw();
    this.drawXpBar();
    this.hud.setTimer(this.elapsed);
    this.hud.setScore(this.extractOpen ? '→ EXTRAÇÃO' : `☠ ${this.kills}`);
    this.hud.setStatus(`Nv ${this.level} · fungos ${this.harvested}/${GOAL}`);
    this.hud.setHealth(this.hp / this.maxHp);
  }

  // ── Player ────────────────────────────────────────────────────────────────
  private movePlayer(dt: number): void {
    if (!this.drag.dragging) return;
    const dx = this.drag.pos.x - this.player.x;
    const dy = this.drag.pos.y - this.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return;
    const step = Math.min(dist, this.moveSpeed * dt);
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
    this.extractPos = { x: this.player.x < VW / 2 ? FIELD.x + FIELD.w - 40 : FIELD.x + 40, y: FIELD.y + 40 };
    this.hud.setStatus('extração aberta');
    this.juice.alarm(FOREST);
    this.spawnBoss();
  }

  // ── XP / level-up ───────────────────────────────────────────────────────────
  private gainXp(v: number): void {
    this.xp += v;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level += 1;
      this.xpNext = Math.round(this.xpNext * 1.35 + 3);
      this.pendingLevels += 1;
    }
    if (this.pendingLevels > 0 && !this.paused) this.openLevelUp();
  }

  private buildOffers(): Offer[] {
    const pool: Offer[] = [];
    (Object.keys(this.weapons) as WeaponId[]).forEach((id) => {
      const lv = this.weapons[id];
      if (lv === 0) pool.push({ kind: 'weapon', id, name: WEAPON_NAME[id], desc: WEAPON_DESC[id], tag: 'NOVA ARMA' });
      else if (lv < MAXLV) pool.push({ kind: 'weapon', id, name: WEAPON_NAME[id], desc: WEAPON_DESC[id], tag: `Nível ${lv + 1}` });
    });
    (Object.keys(this.passives) as PassiveId[]).forEach((id) => {
      const lv = this.passives[id];
      if (lv < MAXLV) pool.push({ kind: 'passive', id, name: PASSIVE_NAME[id], desc: PASSIVE_DESC[id], tag: lv === 0 ? 'PASSIVA' : `Nível ${lv + 1}` });
    });
    // Fisher–Yates, take 3.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j]!, pool[i]!];
    }
    const picks = pool.slice(0, 3);
    while (picks.length < 3) picks.push({ kind: 'heal', name: 'Refúgio', desc: 'Recupera 30 de vida.', tag: 'CURA' });
    return picks;
  }

  private openLevelUp(): void {
    this.paused = true;
    const offers = this.buildOffers();
    const panel = new Container();
    panel.zIndex = 150;

    const dim = new Graphics();
    dim.rect(0, 0, VW, VH).fill({ color: 0x000000, alpha: 0.72 });
    panel.addChild(dim);

    const title = new Text({
      text: 'SUBIU DE NÍVEL',
      style: { fontFamily: FontFamily.body, fontSize: 20, fill: FOREST, fontWeight: '700', letterSpacing: 1.5 },
    });
    title.anchor.set(0.5);
    title.x = VW / 2;
    title.y = VH * 0.26;
    panel.addChild(title);

    const sub = new Text({
      text: 'Escolha uma melhoria — toque numa carta',
      style: { fontFamily: FontFamily.mono, fontSize: 12, fill: TextColor.muted },
    });
    sub.anchor.set(0.5);
    sub.x = VW / 2;
    sub.y = VH * 0.26 + 26;
    panel.addChild(sub);

    const cardW = 320;
    const cardH = 82;
    const gap = 14;
    const x0 = (VW - cardW) / 2;
    const y0 = VH * 0.36;
    offers.forEach((offer, i) => {
      panel.addChild(this.buildCard(offer, x0, y0 + i * (cardH + gap), cardW, cardH, () => {
        this.applyOffer(offer);
        panel.destroy({ children: true });
        this.pendingLevels = Math.max(0, this.pendingLevels - 1);
        if (this.pendingLevels > 0) this.openLevelUp();
        else this.paused = false;
      }));
    });

    this.root.addChild(panel);
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_03.wav', 0.5);
  }

  private buildCard(offer: Offer, x: number, y: number, w: number, h: number, onPick: () => void): Container {
    const card = new Container();
    card.x = x;
    card.y = y;

    const bg = new Graphics();
    const paint = (hover: boolean): void => {
      bg.clear();
      bg.roundRect(0, 0, w, h, 8)
        .fill({ color: hover ? 0x14241a : 0x0c1410, alpha: 0.98 })
        .stroke({ color: FOREST, width: hover ? 2 : 1.4, alpha: hover ? 1 : 0.7 });
    };
    paint(false);
    card.addChild(bg);

    const tag = new Text({
      text: offer.tag,
      style: { fontFamily: FontFamily.mono, fontSize: 10, fill: FOREST, fontWeight: '700', letterSpacing: 1 },
    });
    tag.x = 14;
    tag.y = 12;
    card.addChild(tag);

    const name = new Text({
      text: offer.name,
      style: { fontFamily: FontFamily.body, fontSize: 16, fill: TextColor.ink, fontWeight: '700' },
    });
    name.x = 14;
    name.y = 26;
    card.addChild(name);

    const desc = new Text({
      text: offer.desc,
      style: { fontFamily: FontFamily.mono, fontSize: 11, fill: TextColor.muted, wordWrap: true, wordWrapWidth: w - 28 },
    });
    desc.x = 14;
    desc.y = 48;
    card.addChild(desc);

    card.eventMode = 'static';
    card.cursor = 'pointer';
    card.on('pointerover', () => paint(true));
    card.on('pointerout', () => paint(false));
    card.on('pointertap', (e) => { e.stopPropagation(); audioManager.playSfx('res://assets/audio/sfx/ui/Click_03.wav', 0.4); onPick(); });
    return card;
  }

  private applyOffer(offer: Offer): void {
    if (offer.kind === 'heal') {
      this.hp = Math.min(this.maxHp, this.hp + 30);
    } else if (offer.kind === 'weapon') {
      const id = offer.id as WeaponId;
      this.weapons[id] = Math.min(MAXLV, this.weapons[id] + 1);
      if (id === 'nova' && this.weapons.nova === 1) this.novaTimer = NOVA.cd[0]!;
    } else {
      const id = offer.id as PassiveId;
      this.passives[id] = Math.min(MAXLV, this.passives[id] + 1);
      this.recomputeStats(id === 'maxhp');
    }
    this.juice.flash(FOREST, 0.14, 0.2);
  }

  private recomputeStats(healFromMaxHp: boolean): void {
    const prevMax = this.maxHp;
    this.maxHp = BASE_HP + this.passives.maxhp * 25;
    this.moveSpeed = BASE_SPEED + this.passives.speed * 22;
    this.pickupRadius = BASE_PICKUP + this.passives.magnet * 20;
    this.damageMult = 1 + this.passives.power * 0.15;
    this.regen = this.passives.regen * 0.8;
    if (healFromMaxHp) this.hp += this.maxHp - prevMax;
  }

  // ── Weapon: Bio-dart (auto-fire at nearest, paused while harvesting) ─────────
  private updateDart(dt: number): void {
    this.fireTimer -= dt;
    if (this.harvesting) return; // crouched, main gun stowed
    const lv = this.weapons.dart;
    if (lv === 0 || this.fireTimer > 0) return;
    const target = this.nearestEnemy();
    if (!target) return;
    this.fireTimer = DART.interval[lv - 1]!;
    const count = DART.count[lv - 1]!;
    const dmg = DART.dmg[lv - 1]! * this.damageMult;
    const pierce = DART.pierce[lv - 1]!;
    const base = Math.atan2(target.pos.y - this.player.y, target.pos.x - this.player.x);
    const spread = 0.26;
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * spread;
      this.projs.push({
        pos: { x: this.player.x, y: this.player.y },
        vel: { x: Math.cos(a) * PROJ_SPEED, y: Math.sin(a) * PROJ_SPEED },
        life: PROJ_LIFE, dmg, pierce, hit: new Set(),
      });
    }
    audioManager.playSfx('res://assets/audio/sfx/ui/Click_03.wav', 0.16);
  }

  private nearestEnemy(): Enemy | null {
    let best: Enemy | null = null;
    let bd = Infinity;
    for (const e of this.enemies) {
      const dd = (e.pos.x - this.player.x) ** 2 + (e.pos.y - this.player.y) ** 2;
      if (dd < bd) { bd = dd; best = e; }
    }
    return best;
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i]!;
      p.life -= dt;
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      if (p.life <= 0 || p.pos.x < FIELD.x || p.pos.x > FIELD.x + FIELD.w || p.pos.y < FIELD.y || p.pos.y > FIELD.y + FIELD.h) {
        this.projs.splice(i, 1);
        continue;
      }
      const inv = 1 / (Math.hypot(p.vel.x, p.vel.y) || 1);
      for (const e of this.enemies) {
        if (p.hit.has(e)) continue;
        if (Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y) < e.r + 4) {
          this.damageEnemy(e, p.dmg, p.vel.x * inv * 7, p.vel.y * inv * 7);
          p.hit.add(e);
          this.juice.burst(p.pos.x, p.pos.y, { count: 5, color: 0x9fffe0, speed: 130, life: 0.25, size: 1.6 });
          if (p.pierce <= 0) { this.projs.splice(i, 1); break; }
          p.pierce -= 1;
        }
      }
    }
  }

  // ── Weapon: spore aura (continuous AoE around player) ───────────────────────
  private updateAura(dt: number): void {
    const lv = this.weapons.aura;
    if (lv === 0) return;
    this.auraTimer -= dt;
    if (this.auraTimer > 0) return;
    const tick = 0.2;
    this.auraTimer = tick;
    const r = AURA.r[lv - 1]!;
    const dmg = AURA.dps[lv - 1]! * tick * this.damageMult;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]!;
      if (Math.hypot(e.pos.x - this.player.x, e.pos.y - this.player.y) < r + e.r) {
        this.damageEnemy(e, dmg, 0, 0);
      }
    }
  }

  // ── Weapon: orbiting bulbs (melee ring) ─────────────────────────────────────
  private updateOrbit(dt: number): void {
    const lv = this.weapons.orbit;
    if (lv === 0) { return; }
    this.orbitAngle += dt * 2.6;
    const count = ORBIT.count[lv - 1]!;
    const r = ORBIT.r[lv - 1]!;
    const dmg = ORBIT.dmg[lv - 1]! * this.damageMult;
    for (const e of this.enemies) e.orbitCd = Math.max(0, e.orbitCd - dt);
    for (let b = 0; b < count; b++) {
      const a = this.orbitAngle + (b / count) * Math.PI * 2;
      const bx = this.player.x + Math.cos(a) * r;
      const by = this.player.y + Math.sin(a) * r;
      for (const e of this.enemies) {
        if (e.orbitCd > 0) continue;
        if (Math.hypot(e.pos.x - bx, e.pos.y - by) < e.r + 7) {
          const inv = 1 / (Math.hypot(e.pos.x - this.player.x, e.pos.y - this.player.y) || 1);
          this.damageEnemy(e, dmg, (e.pos.x - this.player.x) * inv * 8, (e.pos.y - this.player.y) * inv * 8);
          e.orbitCd = 0.3;
        }
      }
    }
  }

  // ── Weapon: pollen nova (periodic expanding AoE) ────────────────────────────
  private updateNova(dt: number): void {
    const lv = this.weapons.nova;
    if (lv === 0) return;
    this.novaTimer -= dt;
    if (this.novaTimer > 0) return;
    this.novaTimer = NOVA.cd[lv - 1]!;
    const r = NOVA.r[lv - 1]!;
    const dmg = NOVA.dmg[lv - 1]! * this.damageMult;
    this.novas.push({ x: this.player.x, y: this.player.y, r: 0, max: r, life: 0.45 });
    for (const e of this.enemies) {
      const dist = Math.hypot(e.pos.x - this.player.x, e.pos.y - this.player.y);
      if (dist < r + e.r) {
        const inv = 1 / (dist || 1);
        this.damageEnemy(e, dmg, (e.pos.x - this.player.x) * inv * 16, (e.pos.y - this.player.y) * inv * 16);
      }
    }
    this.juice.shockwave(FOREST, 0.45);
    this.juice.shake(0.18, 14);
  }

  private updateNovaRings(dt: number): void {
    for (let i = this.novas.length - 1; i >= 0; i--) {
      const n = this.novas[i]!;
      n.life -= dt;
      n.r = n.max * (1 - n.life / 0.45);
      if (n.life <= 0) this.novas.splice(i, 1);
    }
  }

  // ── Damage / death ──────────────────────────────────────────────────────────
  private damageEnemy(e: Enemy, dmg: number, kx: number, ky: number): void {
    e.hp -= dmg;
    e.flash = 0.12;
    if (kx || ky) {
      e.pos.x = Math.max(FIELD.x, Math.min(FIELD.x + FIELD.w, e.pos.x + kx));
      e.pos.y = Math.max(FIELD.y, Math.min(FIELD.y + FIELD.h, e.pos.y + ky));
    }
    if (e.hp <= 0) this.killEnemy(e);
  }

  private killEnemy(e: Enemy): void {
    const idx = this.enemies.indexOf(e);
    if (idx < 0) return;
    this.enemies.splice(idx, 1);
    this.kills += 1;
    this.juice.burst(e.pos.x, e.pos.y, { count: e.kind === 'boss' ? 30 : 9, color: 0x9fffe0, speed: 170, life: 0.4, size: 2 });
    if (e.kind === 'boss') {
      this.juice.alarm(FOREST);
      // The Jardineiro-Mestre showers XP + a small biomass windfall.
      for (let i = 0; i < 8; i++) this.dropGem(e.pos.x + rand(-18, 18), e.pos.y + rand(-18, 18), 5);
      this.harvested += 2;
    } else {
      this.dropGem(e.pos.x, e.pos.y, e.xp);
    }
  }

  private dropGem(x: number, y: number, value: number): void {
    this.gems.push({ pos: { x, y }, vel: { x: rand(-40, 40), y: rand(-40, 40) }, value, t: 0 });
  }

  private updateGems(dt: number): void {
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i]!;
      g.t += dt;
      const dx = this.player.x - g.pos.x;
      const dy = this.player.y - g.pos.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < this.pickupRadius) {
        // Magnetised — accelerate toward Paulo.
        const pull = 240 + (1 - dist / this.pickupRadius) * 360;
        g.pos.x += (dx / dist) * pull * dt;
        g.pos.y += (dy / dist) * pull * dt;
      } else {
        // Initial pop, then settle.
        g.pos.x += g.vel.x * dt;
        g.pos.y += g.vel.y * dt;
        g.vel.x *= 0.88;
        g.vel.y *= 0.88;
      }
      if (dist < 14) {
        this.gainXp(g.value);
        this.gems.splice(i, 1);
        audioManager.playSfx('res://assets/audio/sfx/ui/Click_03.wav', 0.12);
      }
    }
  }

  // ── Enemies ───────────────────────────────────────────────────────────────
  private updateSpawns(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0 || this.enemies.length >= ENEMY_CAP) return;
    const burst = 1 + Math.floor(this.elapsed / 25);
    for (let i = 0; i < burst && this.enemies.length < ENEMY_CAP; i++) this.spawnEnemy();
    this.spawnTimer = Math.max(SPAWN_MIN, SPAWN_START - this.elapsed * 0.01 - (this.extractOpen ? 0.4 : 0));
  }

  private pickKind(): EKind {
    const r = Math.random();
    if (this.elapsed > 75 && r < 0.14) return 'brute';
    if (this.elapsed > 30 && r < 0.42) return 'crawler';
    return 'sprout';
  }

  private edgePos(): Vec2 {
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) return { x: rand(FIELD.x, FIELD.x + FIELD.w), y: FIELD.y + 4 };
    if (edge === 1) return { x: rand(FIELD.x, FIELD.x + FIELD.w), y: FIELD.y + FIELD.h - 4 };
    if (edge === 2) return { x: FIELD.x + 4, y: rand(FIELD.y, FIELD.y + FIELD.h) };
    return { x: FIELD.x + FIELD.w - 4, y: rand(FIELD.y, FIELD.y + FIELD.h) };
  }

  private spawnEnemy(): void {
    const kind = this.pickKind();
    const s = ESTATS[kind];
    // Hordes harden over time so the build has to keep pace.
    const hpScale = 1 + this.elapsed * 0.004;
    this.enemies.push({
      kind, pos: this.edgePos(),
      hp: s.hp * hpScale, maxHp: s.hp * hpScale,
      speed: s.speed + Math.random() * 16, dmg: s.dmg, r: s.r, xp: s.xp, color: s.color,
      flash: 0, touchCd: 0, orbitCd: 0,
    });
  }

  private spawnBoss(): void {
    if (this.bossSpawned) return;
    this.bossSpawned = true;
    const s = ESTATS.boss;
    this.enemies.push({
      kind: 'boss', pos: { x: VW / 2, y: FIELD.y + 6 },
      hp: s.hp, maxHp: s.hp, speed: s.speed, dmg: s.dmg, r: s.r, xp: s.xp, color: s.color,
      flash: 0, touchCd: 0, orbitCd: 0,
    });
  }

  private updateEnemies(dt: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]!;
      e.flash = Math.max(0, e.flash - dt);
      e.touchCd = Math.max(0, e.touchCd - dt);
      const dx = this.player.x - e.pos.x;
      const dy = this.player.y - e.pos.y;
      const dist = Math.hypot(dx, dy) || 1;
      e.pos.x += (dx / dist) * e.speed * dt;
      e.pos.y += (dy / dist) * e.speed * dt;
      if (dist < PLAYER_R + e.r && e.touchCd <= 0) {
        e.touchCd = TOUCH_CD;
        this.hp -= e.dmg;
        this.hurtFlash = 1;
        this.juice.hurt(this.player.x, this.player.y);
        if (this.hp <= 0) { this.hp = 0; this.end(false); return; }
      }
    }
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
    const steps = 30;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const c = Color.rgb(0.04 + t * 0.02, 0.10 + t * 0.10, 0.06 + t * 0.05);
      this.bg.rect(0, TOP + (FIELD.h * i) / steps, VW, FIELD.h / steps + 1).fill(Color.hex(c));
    }
    for (const sx of [VW * 0.2, VW * 0.55, VW * 0.82]) {
      this.bg.poly([sx, TOP, sx + 26, TOP, sx - 50, VH, sx - 90, VH]).fill({ color: 0xbfffd0, alpha: 0.03 });
    }
    const rng = (n: number): number => ((Math.sin(n * 127.1) * 43758.5) % 1 + 1) % 1;
    let seed = 0;
    for (let ry = TOP + 40; ry < VH - 30; ry += 64) {
      for (let rx = 24; rx < VW - 16; rx += 52) {
        seed++;
        const jx = rx + (rng(seed) - 0.5) * 14;
        const jy = ry + (rng(seed * 2) - 0.5) * 14;
        const tone = [0x1c3a22, 0x24472a, 0x2a3a4a][seed % 3]!;
        this.floraG.circle(jx, jy, 6 + rng(seed * 3) * 4).fill({ color: tone, alpha: 0.85 });
        if (rng(seed * 5) > 0.55) {
          const bloom = [0xff8fc4, 0xffd36b, 0xb78fff, 0x7fe0ff][seed % 4]!;
          this.floraG.circle(jx, jy - 3, 2.4).fill({ color: bloom, alpha: 0.8 });
        }
      }
    }
    this.bg.rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h).stroke({ color: 0x2c5a36, width: 2, alpha: 0.6 });
  }

  private drawXpBar(): void {
    this.xpG.clear();
    const x = 44;
    const w = VW - x - 8;
    const y = 52;
    this.xpG.rect(x, y, w, 4).fill({ color: 0x10201a, alpha: 0.9 });
    this.xpG.rect(x, y, w * Math.max(0, Math.min(1, this.xp / this.xpNext)), 4).fill({ color: FOREST, alpha: 0.95 });
    this.levelText.text = `Nv ${this.level}`;
  }

  private draw(): void {
    const t = this.elapsed;

    // Spore aura field (drawn beneath everything dynamic).
    this.auraG.clear();
    if (this.weapons.aura > 0) {
      const r = AURA.r[this.weapons.aura - 1]!;
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      this.auraG.circle(this.player.x, this.player.y, r).fill({ color: FOREST, alpha: 0.05 + 0.04 * pulse });
      this.auraG.circle(this.player.x, this.player.y, r).stroke({ color: FOREST, width: 1.5, alpha: 0.25 + 0.15 * pulse });
    }

    // Fungi.
    this.fungusG.clear();
    for (let i = 0; i < this.fungi.length; i++) {
      const f = this.fungi[i]!;
      const pulse = 0.6 + 0.4 * Math.sin(t * 3 + f.phase);
      this.fungusG.circle(f.pos.x, f.pos.y, 16).fill({ color: FOREST, alpha: 0.10 * pulse });
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

    // XP gems.
    this.gemG.clear();
    for (const g of this.gems) {
      const big = g.value >= 5;
      const col = big ? 0xffd36b : 0x9fffe0;
      this.gemG.circle(g.pos.x, g.pos.y, big ? 4.5 : 3).fill({ color: col, alpha: 0.95 });
      this.gemG.circle(g.pos.x, g.pos.y, big ? 7 : 5).fill({ color: col, alpha: 0.2 });
    }

    // Nova rings.
    this.novaG.clear();
    for (const n of this.novas) {
      this.novaG.circle(n.x, n.y, n.r).stroke({ color: FOREST, width: 3, alpha: 0.6 * (n.life / 0.45) });
    }

    // Enemies.
    this.enemyG.clear();
    for (const e of this.enemies) {
      const c = e.flash > 0 ? 0xffffff : e.color;
      if (e.kind === 'boss') {
        // Jardineiro-Mestre — a hulking warden with an HP collar.
        this.enemyG.circle(e.pos.x, e.pos.y, e.r + 4).fill({ color: 0xff3a3a, alpha: 0.12 });
        this.enemyG.rect(e.pos.x - e.r, e.pos.y - e.r, e.r * 2, e.r * 2).fill({ color: c });
        this.enemyG.rect(e.pos.x - e.r, e.pos.y - e.r, e.r * 2, e.r * 2).stroke({ color: 0xffb0c0, width: 2, alpha: 0.7 });
        this.enemyG.circle(e.pos.x, e.pos.y, 5).fill({ color: 0xff3a3a });
        // HP collar.
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
      const blink = 0.6 + 0.4 * Math.sin(t * 6 + e.pos.x);
      this.enemyG.circle(e.pos.x, e.pos.y, 2.6).fill({ color: 0xff3a3a, alpha: 0.6 + 0.4 * blink });
    }

    // Projectiles.
    this.projG.clear();
    for (const p of this.projs) {
      this.projG.circle(p.pos.x, p.pos.y, 3).fill({ color: 0x9fffe0, alpha: 0.95 });
      this.projG.circle(p.pos.x, p.pos.y, 5).fill({ color: 0x9fffe0, alpha: 0.25 });
    }

    // Orbiting bulbs.
    this.orbitG.clear();
    if (this.weapons.orbit > 0) {
      const lv = this.weapons.orbit;
      const count = ORBIT.count[lv - 1]!;
      const r = ORBIT.r[lv - 1]!;
      for (let b = 0; b < count; b++) {
        const a = this.orbitAngle + (b / count) * Math.PI * 2;
        const bx = this.player.x + Math.cos(a) * r;
        const by = this.player.y + Math.sin(a) * r;
        this.orbitG.circle(bx, by, 7).fill({ color: FOREST, alpha: 0.9 });
        this.orbitG.circle(bx, by, 4).fill({ color: 0xffffff, alpha: 0.7 });
      }
    }

    // Paulo.
    this.playerG.clear();
    const pc = this.hurtFlash > 0.4 ? 0xff5a5a : FOREST;
    if (this.harvesting) {
      const wp = 0.5 + 0.5 * Math.sin(t * 9);
      this.playerG.circle(this.player.x, this.player.y, PLAYER_R + 6).stroke({ color: 0xffcf4d, width: 2, alpha: 0.4 + 0.4 * wp });
      this.playerG.ellipse(this.player.x, this.player.y + 2, PLAYER_R, PLAYER_R * 0.7).fill({ color: pc, alpha: 0.95 });
    } else {
      this.playerG.circle(this.player.x, this.player.y, PLAYER_R + 4).fill({ color: pc, alpha: 0.2 });
      this.playerG.circle(this.player.x, this.player.y, PLAYER_R).fill({ color: pc, alpha: 0.95 });
      this.playerG.circle(this.player.x, this.player.y, PLAYER_R - 4).fill({ color: 0xffffff, alpha: 0.65 });
      const tgt = this.nearestEnemy();
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
      rewardLabel: `+${this.harvested} Biomassa — fungos extraídos · Nv ${this.level} · ☠ ${this.kills}`,
      failLabel: 'Capturado pelos jardineiros.',
    }));
  }
}
