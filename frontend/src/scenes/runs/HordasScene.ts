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
const TAU = Math.PI * 2;

const FOREST = Color.hex(Color.rgb(0.38, 0.82, 0.47));
const SHADOW = { color: 0x000000, alpha: 0.85, blur: 3, distance: 1, angle: Math.PI / 2 } as const;

const TOP = 46;            // HUD strip height
const GRID = 48;           // scrolling background grid spacing

// ── Player ────────────────────────────────────────────────────────────────
const PLAYER_R = 12;
const BASE_HP = 100;
const BASE_SPEED = 240;
const BASE_PICKUP = 50;
const MOVE_ACCEL = 13;     // velocity-smoothing rate (continuous feel)
const JOY_DEAD = 8;        // joystick dead-zone (scene px)
const JOY_MAX = 64;        // joystick travel to full speed (scene px)

// ── Enemies (gardener-bots) — spawn in a ring around the player ──────────────
const ENEMY_CAP = 110;
const SPAWN_START = 1.1;
const SPAWN_MIN = 0.22;
const TOUCH_CD = 0.6;
const SPAWN_RING = 520;    // just outside the viewport
const DESPAWN_R = 900;     // cull wanderers beyond this
const SEPARATION = 0.5;    // anti-pile push strength

type EKind = 'sprout' | 'crawler' | 'brute' | 'boss';
interface EnemyStat { hp: number; speed: number; dmg: number; r: number; xp: number; color: number }
const ESTATS: Record<EKind, EnemyStat> = {
  sprout: { hp: 18, speed: 54, dmg: 7, r: 8, xp: 1, color: 0x4a5560 },
  crawler: { hp: 40, speed: 74, dmg: 10, r: 9, xp: 2, color: 0x5a6470 },
  brute: { hp: 130, speed: 36, dmg: 20, r: 14, xp: 5, color: 0x6a5560 },
  boss: { hp: 1400, speed: 32, dmg: 26, r: 24, xp: 40, color: 0x7a4a5a },
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
  pushX: number;
  pushY: number;
}

interface Proj { pos: Vec2; vel: Vec2; life: number; dmg: number; pierce: number; hit: Set<Enemy> }
interface Gem { pos: Vec2; vel: Vec2; value: number; t: number }
interface Nova { x: number; y: number; r: number; max: number; life: number }

// ── Buff plants — rare; walk over one for a short perk ──────────────────────
type PlantType = 'red' | 'blue' | 'green' | 'gold' | 'purple';
interface PlantDef { color: number; name: string; short: string }
const PLANTS: Record<PlantType, PlantDef> = {
  red: { color: 0xff5a5a, name: 'Carmesim', short: 'DANO' },
  blue: { color: 0x5ab0ff, name: 'Glacial', short: 'CADÊNCIA' },
  green: { color: 0x6dff9a, name: 'Veloz', short: 'VELOZ' },
  gold: { color: 0xffd36b, name: 'Áurea', short: 'ÍMÃ' },
  purple: { color: 0xc78fff, name: 'Esporal', short: 'ÁREA' },
};
const PLANT_TYPES: PlantType[] = ['red', 'blue', 'green', 'gold', 'purple'];
const BUFF_TIME = 7;
const PLANTS_NEARBY = 2;      // far fewer perks scattered around
const PLANT_DIST = { min: 300, max: 540 };
const PLANT_CULL_R = 760;
interface Plant { pos: Vec2; type: PlantType; phase: number }

// ── Biomass harvest nodes — the risky objective (channel to collect) ─────────
const HARVEST_NEARBY = 3;
const HARVEST_TIME = 2.6;     // seconds of exposed channelling per node
const HARVEST_DIST = { min: 220, max: 460 };
const HARVEST_DECAY = 0.7;    // progress lost per second when you step off
const HARVEST_VULN = 1.5;     // extra contact damage taken while channelling
const HARVEST_SURGE = 0.85;   // interval of the punishing add-spawn while channelling
const GOAL = 6;               // minimum to OPEN extraction (collecting more pays more)
interface Node { pos: Vec2; phase: number; progress: number }

// ── Arsenal — Vampire-Survivors-style auto weapons (level 1..5) ──────────────
const MAXLV = 5;
const DART = {
  interval: [0.42, 0.34, 0.30, 0.26, 0.22],
  dmg: [7, 8, 9, 11, 13],
  count: [1, 1, 2, 2, 3],
  pierce: [0, 0, 0, 1, 1],
};
const PROJ_SPEED = 400;
const PROJ_LIFE = 1.2;
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

const rand = (a: number, b: number): number => a + Math.random() * (b - a);

/** HORDAS — the AI's automated forest, an infinite Vampire-Survivors arena.
 *  Dr. Paulo only steers (floating joystick); his bio-chem arsenal auto-fires.
 *  Gardener-bots swarm in escalating hordes — kill them for XP, level up, and
 *  draft upgrades. The objective is risky: biomass nodes must be CHANNELLED
 *  (stand exposed, gun stowed, taking extra damage while the horde surges).
 *  Hitting the quota opens extraction, but the reward multiplier keeps climbing
 *  — stay and harvest more to bank more, at rising risk. */
export class HordasScene extends Scene {
  private content = new Container();         // shaken by RunJuice; holds bg + camera
  private bgStatic = new Graphics();         // calm gradient + vignette (drawn once)
  private gridG = new Graphics();            // scrolling grid (per frame)
  private camera = new Container();          // translated by -cam offset; holds the world

  private auraG = new Graphics();
  private extractG = new Graphics();
  private nodeG = new Graphics();
  private plantG = new Graphics();
  private gemG = new Graphics();
  private enemyG = new Graphics();
  private novaG = new Graphics();
  private projG = new Graphics();
  private orbitG = new Graphics();
  private playerG = new Graphics();

  private overlay = new Container();         // steady screen-space UI
  private xpG = new Graphics();
  private joyG = new Graphics();
  private pointerG = new Graphics();
  private levelText!: Text;
  private rewardText!: Text;
  private buffText!: Text;

  private hud!: RunHud;
  private drag!: DragInput;
  private juice!: RunJuice;

  // Player state (world coords; the world is unbounded)
  private player: Vec2 = { x: 0, y: 0 };
  private vel: Vec2 = { x: 0, y: 0 };
  private hp = BASE_HP;
  private maxHp = BASE_HP;
  private moveSpeed = BASE_SPEED;
  private pickupRadius = BASE_PICKUP;
  private damageMult = 1;
  private regen = 0;
  private hurtFlash = 0;
  private facing = 0;

  // Joystick
  private prevDrag = false;
  private joyOrigin: Vec2 = { x: 0, y: 0 };

  // Buffs (type → seconds remaining)
  private buffs: Record<PlantType, number> = { red: 0, blue: 0, green: 0, gold: 0, purple: 0 };

  // Progression
  private level = 1;
  private xp = 0;
  private xpNext = 8;
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
  private plants: Plant[] = [];
  private nodes: Node[] = [];

  // Run flow
  private harvested = 0;       // uncapped — more = more reward
  private channeling = false;
  private surgeTimer = 0;
  private spawnTimer = SPAWN_START;
  private elapsed = 0;
  private extractOpen = false;
  private bossSpawned = false;
  private boss: Enemy | null = null;
  private extractPos: Vec2 = { x: 0, y: 0 };
  private ended = false;

  override async enter(): Promise<void> {
    this.buildBackground();
    this.camera.addChild(
      this.auraG, this.extractG, this.nodeG, this.plantG, this.gemG, this.enemyG,
      this.novaG, this.projG, this.orbitG, this.playerG,
    );
    this.content.addChild(this.bgStatic, this.gridG, this.camera);
    this.root.addChild(this.content);

    for (let i = 0; i < HARVEST_NEARBY; i++) this.spawnNode();
    for (let i = 0; i < PLANTS_NEARBY; i++) this.spawnPlant();

    this.juice = new RunJuice(this.root, { accent: FOREST, shakeTarget: this.content, ambient: 22 });

    this.hud = buildHud(ZONE);
    this.root.addChild(this.hud.container);

    // Steady screen-space overlay — bright, shadowed text for legibility.
    this.overlay.zIndex = 90;
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
    this.overlay.addChild(this.pointerG, this.xpG, this.levelText, this.rewardText, this.buffText, this.joyG);
    this.root.addChild(this.overlay);

    this.drag = bindDrag(this.app.pixi.canvas, this.app.world, { x: VW / 2, y: VH / 2 });

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

    for (const t of PLANT_TYPES) if (this.buffs[t] > 0) this.buffs[t] = Math.max(0, this.buffs[t] - d);

    this.movePlayer(d);
    this.updateHarvest(d);

    this.updateDart(d);
    this.updateAura(d);
    this.updateOrbit(d);
    this.updateNova(d);
    this.updateProjectiles(d);

    this.updateSpawns(d);
    this.updateEnemies(d);
    this.updateGems(d);
    this.updateNovaRings(d);
    this.updatePlants();

    if (this.extractOpen && Math.hypot(this.player.x - this.extractPos.x, this.player.y - this.extractPos.y) < 28) {
      this.end(true);
      return;
    }

    this.camera.x = VW / 2 - this.player.x;
    this.camera.y = VH / 2 - this.player.y;

    this.draw();
    this.drawHudOverlay();
    this.hud.setTimer(this.elapsed);
    this.hud.setScore(`☠ ${this.kills}`);
    this.hud.setStatus(this.extractOpen ? 'extração aberta — colha mais!' : `coleta ${this.harvested}/${GOAL}`);
    this.hud.setHealth(this.hp / this.maxHp);
  }

  // ── World ↔ screen helpers ──────────────────────────────────────────────────
  private sx(wx: number): number { return wx + (VW / 2 - this.player.x); }
  private sy(wy: number): number { return wy + (VH / 2 - this.player.y); }

  // ── Buff-modified stats (perks are milder now) ──────────────────────────────
  private get atk(): number { return this.damageMult * (this.buffs.red > 0 ? 1.45 : 1); }
  private get fireMult(): number { return this.buffs.blue > 0 ? 0.7 : 1; }
  private get areaMult(): number { return this.buffs.purple > 0 ? 1.35 : 1; }
  private get effSpeed(): number { return this.moveSpeed * (this.buffs.green > 0 ? 1.35 : 1); }
  private get effPickup(): number { return this.pickupRadius + (this.buffs.gold > 0 ? 130 : 0); }

  // Reward multiplier climbs with time survived + over-harvest (push your luck).
  private get rewardMult(): number {
    return Math.min(3, 1 + this.elapsed / 100 + Math.max(0, this.harvested - GOAL) * 0.08);
  }
  private get reward(): number { return Math.round(this.harvested * this.rewardMult); }

  // ── Player — floating joystick, continuous motion ───────────────────────────
  private movePlayer(dt: number): void {
    if (this.drag.dragging && !this.prevDrag) this.joyOrigin = { ...this.drag.pos };
    this.prevDrag = this.drag.dragging;

    let tvx = 0;
    let tvy = 0;
    if (this.drag.dragging) {
      const dx = this.drag.pos.x - this.joyOrigin.x;
      const dy = this.drag.pos.y - this.joyOrigin.y;
      const len = Math.hypot(dx, dy);
      if (len > JOY_DEAD) {
        const mag = Math.min(1, (len - JOY_DEAD) / (JOY_MAX - JOY_DEAD));
        tvx = (dx / len) * this.effSpeed * mag;
        tvy = (dy / len) * this.effSpeed * mag;
      }
    }
    const k = Math.min(1, MOVE_ACCEL * dt);
    this.vel.x += (tvx - this.vel.x) * k;
    this.vel.y += (tvy - this.vel.y) * k;
    this.player.x += this.vel.x * dt;
    this.player.y += this.vel.y * dt;
  }

  // ── Biomass harvest — exposed channelling, the run's real risk ──────────────
  private updateHarvest(dt: number): void {
    // Cull far nodes (never the one being channelled) and top up nearby.
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i]!;
      const dist = Math.hypot(n.pos.x - this.player.x, n.pos.y - this.player.y);
      if (dist > PLANT_CULL_R && n.progress <= 0) { this.nodes.splice(i, 1); continue; }
      if (dist > PLAYER_R + 16) n.progress = Math.max(0, n.progress - dt * HARVEST_DECAY);
    }
    while (this.nodes.length < HARVEST_NEARBY) this.spawnNode();

    // The node we're standing on (if any) channels.
    let cur: Node | null = null;
    for (const n of this.nodes) {
      if (Math.hypot(n.pos.x - this.player.x, n.pos.y - this.player.y) <= PLAYER_R + 16) { cur = n; break; }
    }
    const startNow = cur !== null && !this.channeling;
    this.channeling = cur !== null;
    if (startNow) { this.juice.alarm(0xffb347); this.surgeTimer = 0; this.harvestSurge(4); }
    if (!cur) return;

    cur.progress += dt;
    // Time punishment — the AI floods reinforcements while you're pinned.
    this.surgeTimer -= dt;
    if (this.surgeTimer <= 0) { this.surgeTimer = HARVEST_SURGE; this.harvestSurge(2); }

    if (cur.progress >= HARVEST_TIME) {
      this.harvested += 1;
      this.nodes.splice(this.nodes.indexOf(cur), 1);
      this.channeling = false;
      this.juice.pop(VW / 2, VH / 2, 0xffd36b);
      this.juice.flash(0xffd36b, 0.16, 0.26);
      if (this.harvested >= GOAL && !this.extractOpen) this.openExtraction();
      this.spawnNode();
    }
  }

  private harvestSurge(count: number): void {
    for (let i = 0; i < count && this.enemies.length < ENEMY_CAP; i++) this.spawnEnemy(this.elapsed > 30 ? 'crawler' : 'sprout');
  }

  private spawnNode(): void {
    const a = Math.random() * TAU;
    const d = rand(HARVEST_DIST.min, HARVEST_DIST.max);
    this.nodes.push({ pos: { x: this.player.x + Math.cos(a) * d, y: this.player.y + Math.sin(a) * d }, phase: Math.random() * TAU, progress: 0 });
  }

  private openExtraction(): void {
    this.extractOpen = true;
    const a = Math.random() * TAU;
    this.extractPos = { x: this.player.x + Math.cos(a) * 280, y: this.player.y + Math.sin(a) * 280 };
    this.juice.alarm(FOREST);
    this.spawnBoss();
  }

  // ── XP / level-up (slower curve) ────────────────────────────────────────────
  private gainXp(v: number): void {
    this.xp += v;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level += 1;
      this.xpNext = Math.round(this.xpNext * 1.5 + 6);
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
    dim.rect(0, 0, VW, VH).fill({ color: 0x000000, alpha: 0.78 });
    dim.eventMode = 'static';
    panel.addChild(dim);

    const title = new Text({
      text: 'SUBIU DE NÍVEL',
      style: { fontFamily: FontFamily.body, fontSize: 22, fill: FOREST, fontWeight: '700', letterSpacing: 1.5, dropShadow: SHADOW },
    });
    title.anchor.set(0.5);
    title.x = VW / 2;
    title.y = VH * 0.25;
    panel.addChild(title);

    const sub = new Text({
      text: 'Escolha uma melhoria — toque numa carta',
      style: { fontFamily: FontFamily.mono, fontSize: 13, fill: TextColor.ink, dropShadow: SHADOW },
    });
    sub.anchor.set(0.5);
    sub.x = VW / 2;
    sub.y = VH * 0.25 + 28;
    panel.addChild(sub);

    const cardW = 322;
    const cardH = 86;
    const gap = 14;
    const x0 = (VW - cardW) / 2;
    const y0 = VH * 0.35;
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
        .fill({ color: hover ? 0x16291d : 0x0d1611, alpha: 0.99 })
        .stroke({ color: FOREST, width: hover ? 2.4 : 1.6, alpha: hover ? 1 : 0.8 });
    };
    paint(false);
    card.addChild(bg);

    const tag = new Text({
      text: offer.tag,
      style: { fontFamily: FontFamily.mono, fontSize: 11, fill: TextColor.amber, fontWeight: '700', letterSpacing: 1, dropShadow: SHADOW },
    });
    tag.x = 14;
    tag.y = 11;
    card.addChild(tag);

    const name = new Text({
      text: offer.name,
      style: { fontFamily: FontFamily.body, fontSize: 18, fill: TextColor.white, fontWeight: '700', dropShadow: SHADOW },
    });
    name.x = 14;
    name.y = 27;
    card.addChild(name);

    const desc = new Text({
      text: offer.desc,
      style: { fontFamily: FontFamily.mono, fontSize: 12, fill: TextColor.ink, wordWrap: true, wordWrapWidth: w - 28, dropShadow: SHADOW },
    });
    desc.x = 14;
    desc.y = 52;
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

  // ── Weapon: Bio-dart (stowed while channelling — that's the vulnerability) ───
  private updateDart(dt: number): void {
    this.fireTimer -= dt;
    if (this.channeling) return;
    const lv = this.weapons.dart;
    if (lv === 0 || this.fireTimer > 0) return;
    const target = this.nearestEnemy();
    if (!target) return;
    this.fireTimer = DART.interval[lv - 1]! * this.fireMult;
    const count = DART.count[lv - 1]!;
    const dmg = DART.dmg[lv - 1]! * this.atk;
    const pierce = DART.pierce[lv - 1]!;
    const base = Math.atan2(target.pos.y - this.player.y, target.pos.x - this.player.x);
    this.facing = base;
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
      if (p.life <= 0 || Math.hypot(p.pos.x - this.player.x, p.pos.y - this.player.y) > 600) {
        this.projs.splice(i, 1);
        continue;
      }
      const inv = 1 / (Math.hypot(p.vel.x, p.vel.y) || 1);
      for (const e of this.enemies) {
        if (p.hit.has(e)) continue;
        if (Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y) < e.r + 4) {
          this.damageEnemy(e, p.dmg, p.vel.x * inv * 7, p.vel.y * inv * 7);
          p.hit.add(e);
          this.juice.burst(this.sx(p.pos.x), this.sy(p.pos.y), { count: 5, color: 0x9fffe0, speed: 130, life: 0.25, size: 1.6 });
          if (p.pierce <= 0) { this.projs.splice(i, 1); break; }
          p.pierce -= 1;
        }
      }
    }
  }

  private updateAura(dt: number): void {
    const lv = this.weapons.aura;
    if (lv === 0) return;
    this.auraTimer -= dt;
    if (this.auraTimer > 0) return;
    const tick = 0.2;
    this.auraTimer = tick;
    const r = AURA.r[lv - 1]! * this.areaMult;
    const dmg = AURA.dps[lv - 1]! * tick * this.atk;
    for (const e of this.enemies) {
      if (Math.hypot(e.pos.x - this.player.x, e.pos.y - this.player.y) < r + e.r) {
        this.damageEnemy(e, dmg, 0, 0);
      }
    }
  }

  private updateOrbit(dt: number): void {
    const lv = this.weapons.orbit;
    if (lv === 0) return;
    this.orbitAngle += dt * 2.6;
    const count = ORBIT.count[lv - 1]!;
    const r = ORBIT.r[lv - 1]!;
    const dmg = ORBIT.dmg[lv - 1]! * this.atk;
    for (const e of this.enemies) e.orbitCd = Math.max(0, e.orbitCd - dt);
    for (let b = 0; b < count; b++) {
      const a = this.orbitAngle + (b / count) * TAU;
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

  private updateNova(dt: number): void {
    const lv = this.weapons.nova;
    if (lv === 0) return;
    this.novaTimer -= dt;
    if (this.novaTimer > 0) return;
    this.novaTimer = NOVA.cd[lv - 1]!;
    const r = NOVA.r[lv - 1]! * this.areaMult;
    const dmg = NOVA.dmg[lv - 1]! * this.atk;
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
    e.pos.x += kx;
    e.pos.y += ky;
    if (e.hp <= 0) this.killEnemy(e);
  }

  private killEnemy(e: Enemy): void {
    const idx = this.enemies.indexOf(e);
    if (idx < 0) return;
    this.enemies.splice(idx, 1);
    if (e === this.boss) this.boss = null;
    this.kills += 1;
    this.juice.burst(this.sx(e.pos.x), this.sy(e.pos.y), { count: e.kind === 'boss' ? 30 : 9, color: 0x9fffe0, speed: 170, life: 0.4, size: 2 });
    if (e.kind === 'boss') {
      this.juice.alarm(FOREST);
      for (let i = 0; i < 8; i++) this.dropGem(e.pos.x + rand(-18, 18), e.pos.y + rand(-18, 18), 5);
      this.harvested += 2; // a hefty biomass bounty
    } else {
      this.dropGem(e.pos.x, e.pos.y, e.xp);
    }
  }

  private dropGem(x: number, y: number, value: number): void {
    this.gems.push({ pos: { x, y }, vel: { x: rand(-40, 40), y: rand(-40, 40) }, value, t: 0 });
  }

  private updateGems(dt: number): void {
    const pickup = this.effPickup;
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i]!;
      g.t += dt;
      const dx = this.player.x - g.pos.x;
      const dy = this.player.y - g.pos.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < pickup) {
        const pull = 240 + (1 - dist / pickup) * 360;
        g.pos.x += (dx / dist) * pull * dt;
        g.pos.y += (dy / dist) * pull * dt;
      } else {
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

  // ── Buff plants (rare) ──────────────────────────────────────────────────────
  private spawnPlant(): void {
    const a = Math.random() * TAU;
    const d = rand(PLANT_DIST.min, PLANT_DIST.max);
    const type = PLANT_TYPES[Math.floor(Math.random() * PLANT_TYPES.length)]!;
    this.plants.push({ pos: { x: this.player.x + Math.cos(a) * d, y: this.player.y + Math.sin(a) * d }, type, phase: Math.random() * TAU });
  }

  private updatePlants(): void {
    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i]!;
      const dist = Math.hypot(p.pos.x - this.player.x, p.pos.y - this.player.y);
      if (dist > PLANT_CULL_R) { this.plants.splice(i, 1); continue; }
      if (dist < PLAYER_R + 13) {
        this.buffs[p.type] = BUFF_TIME;
        this.juice.pop(this.sx(p.pos.x), this.sy(p.pos.y), PLANTS[p.type].color);
        this.juice.flash(PLANTS[p.type].color, 0.12, 0.22);
        this.plants.splice(i, 1);
      }
    }
    while (this.plants.length < PLANTS_NEARBY) this.spawnPlant();
  }

  // ── Enemies ───────────────────────────────────────────────────────────────
  private updateSpawns(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0 || this.enemies.length >= ENEMY_CAP) return;
    const burst = 1 + Math.floor(this.elapsed / 20);
    for (let i = 0; i < burst && this.enemies.length < ENEMY_CAP; i++) this.spawnEnemy();
    this.spawnTimer = Math.max(SPAWN_MIN, SPAWN_START - this.elapsed * 0.014 - (this.extractOpen ? 0.4 : 0));
  }

  private pickKind(): EKind {
    const r = Math.random();
    if (this.elapsed > 55 && r < 0.18) return 'brute';
    if (this.elapsed > 20 && r < 0.46) return 'crawler';
    return 'sprout';
  }

  private ringPos(radius: number): Vec2 {
    const a = Math.random() * TAU;
    return { x: this.player.x + Math.cos(a) * radius, y: this.player.y + Math.sin(a) * radius };
  }

  private spawnEnemy(force?: EKind): void {
    const kind = force ?? this.pickKind();
    const s = ESTATS[kind];
    const hpScale = 1 + this.elapsed * 0.006;
    this.enemies.push({
      kind, pos: this.ringPos(SPAWN_RING + rand(0, 80)),
      hp: s.hp * hpScale, maxHp: s.hp * hpScale,
      speed: s.speed + Math.random() * 16, dmg: s.dmg, r: s.r, xp: s.xp, color: s.color,
      flash: 0, touchCd: 0, orbitCd: 0, pushX: 0, pushY: 0,
    });
  }

  private spawnBoss(): void {
    if (this.bossSpawned) return;
    this.bossSpawned = true;
    const s = ESTATS.boss;
    this.boss = {
      kind: 'boss', pos: this.ringPos(SPAWN_RING),
      hp: s.hp, maxHp: s.hp, speed: s.speed, dmg: s.dmg, r: s.r, xp: s.xp, color: s.color,
      flash: 0, touchCd: 0, orbitCd: 0, pushX: 0, pushY: 0,
    };
    this.enemies.push(this.boss);
  }

  private updateEnemies(dt: number): void {
    const n = this.enemies.length;
    // Soft separation so the horde crowds instead of stacking on one point.
    for (let i = 0; i < n; i++) { const e = this.enemies[i]!; e.pushX = 0; e.pushY = 0; }
    for (let i = 0; i < n; i++) {
      const a = this.enemies[i]!;
      for (let j = i + 1; j < n; j++) {
        const b = this.enemies[j]!;
        const dx = b.pos.x - a.pos.x;
        const dy = b.pos.y - a.pos.y;
        const rr = a.r + b.r + 2;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0.0001 && d2 < rr * rr) {
          const dist = Math.sqrt(d2);
          const push = ((rr - dist) / dist) * SEPARATION;
          const px = dx * push;
          const py = dy * push;
          a.pushX -= px; a.pushY -= py;
          b.pushX += px; b.pushY += py;
        }
      }
    }

    const contactMult = this.channeling ? HARVEST_VULN : 1;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]!;
      e.flash = Math.max(0, e.flash - dt);
      e.touchCd = Math.max(0, e.touchCd - dt);
      const dx = this.player.x - e.pos.x;
      const dy = this.player.y - e.pos.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (e.kind !== 'boss' && dist > DESPAWN_R) { this.enemies.splice(i, 1); continue; }
      e.pos.x += (dx / dist) * e.speed * dt + (e.kind === 'boss' ? 0 : e.pushX);
      e.pos.y += (dy / dist) * e.speed * dt + (e.kind === 'boss' ? 0 : e.pushY);
      if (dist < PLAYER_R + e.r && e.touchCd <= 0) {
        e.touchCd = TOUCH_CD;
        this.hp -= e.dmg * contactMult;
        this.hurtFlash = 1;
        this.juice.hurt(VW / 2, VH / 2);
        if (this.hp <= 0) { this.hp = 0; this.end(false); return; }
      }
    }
  }

  // ── Background art ──────────────────────────────────────────────────────────
  private buildBackground(): void {
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

  private drawGrid(): void {
    this.gridG.clear();
    const camX = this.player.x - VW / 2;
    const camY = this.player.y - VH / 2;
    const sx = -(((camX % GRID) + GRID) % GRID);
    const sy = -(((camY % GRID) + GRID) % GRID);
    for (let x = sx; x <= VW; x += GRID) this.gridG.moveTo(x, 0).lineTo(x, VH);
    for (let y = sy; y <= VH; y += GRID) this.gridG.moveTo(0, y).lineTo(VW, y);
    this.gridG.stroke({ color: 0x2c5a36, width: 1, alpha: 0.10 });
  }

  // ── Rendering ────────────────────────────────────────────────────────────────
  private draw(): void {
    const t = this.elapsed;
    this.drawGrid();

    // Spore aura.
    this.auraG.clear();
    if (this.weapons.aura > 0) {
      const r = AURA.r[this.weapons.aura - 1]! * this.areaMult;
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      this.auraG.circle(this.player.x, this.player.y, r).fill({ color: FOREST, alpha: 0.05 + 0.04 * pulse });
      this.auraG.circle(this.player.x, this.player.y, r).stroke({ color: FOREST, width: 1.5, alpha: 0.25 + 0.15 * pulse });
    }

    // Biomass harvest nodes — amber pods; the current one fills a ring.
    this.nodeG.clear();
    for (const nd of this.nodes) {
      const pulse = 0.6 + 0.4 * Math.sin(t * 2.5 + nd.phase);
      this.nodeG.circle(nd.pos.x, nd.pos.y, 20).fill({ color: 0xffd36b, alpha: 0.08 * pulse });
      // pod cluster
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

    // Buff plants.
    this.plantG.clear();
    for (const p of this.plants) {
      const def = PLANTS[p.type];
      const pulse = 0.6 + 0.4 * Math.sin(t * 3 + p.phase);
      this.plantG.circle(p.pos.x, p.pos.y, 17).fill({ color: def.color, alpha: 0.12 * pulse });
      this.plantG.circle(p.pos.x, p.pos.y, 17).stroke({ color: def.color, width: 1.5, alpha: 0.4 });
      this.plantG.rect(p.pos.x - 2, p.pos.y, 4, 9).fill({ color: 0xe6e0c8, alpha: 0.9 });
      this.plantG.ellipse(p.pos.x, p.pos.y, 9, 6).fill({ color: def.color, alpha: 0.95 });
      this.plantG.ellipse(p.pos.x, p.pos.y - 1, 4, 2.6).fill({ color: 0xffffff, alpha: 0.7 * pulse });
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

    // Enemies.
    this.enemyG.clear();
    for (const e of this.enemies) {
      const c = e.flash > 0 ? 0xffffff : e.color;
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
      const blink = 0.6 + 0.4 * Math.sin(t * 6 + e.pos.x);
      this.enemyG.circle(e.pos.x, e.pos.y, 2.6).fill({ color: 0xff3a3a, alpha: 0.6 + 0.4 * blink });
    }

    // Nova rings.
    this.novaG.clear();
    for (const nv of this.novas) {
      this.novaG.circle(nv.x, nv.y, nv.r).stroke({ color: FOREST, width: 3, alpha: 0.6 * (nv.life / 0.45) });
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
        const a = this.orbitAngle + (b / count) * TAU;
        const bx = this.player.x + Math.cos(a) * r;
        const by = this.player.y + Math.sin(a) * r;
        this.orbitG.circle(bx, by, 7).fill({ color: FOREST, alpha: 0.9 });
        this.orbitG.circle(bx, by, 4).fill({ color: 0xffffff, alpha: 0.7 });
      }
    }

    // Paulo — a warning ring pulses while channelling (exposed).
    this.playerG.clear();
    const pc = this.hurtFlash > 0.4 ? 0xff5a5a : FOREST;
    const px = this.player.x;
    const py = this.player.y;
    if (this.channeling) {
      const wp = 0.5 + 0.5 * Math.sin(t * 9);
      this.playerG.circle(px, py, PLAYER_R + 7).stroke({ color: 0xffcf4d, width: 2.5, alpha: 0.4 + 0.45 * wp });
    }
    this.playerG.circle(px, py, PLAYER_R + 4).fill({ color: pc, alpha: 0.2 });
    this.playerG.circle(px, py, PLAYER_R).fill({ color: pc, alpha: 0.95 });
    this.playerG.circle(px, py, PLAYER_R - 4).fill({ color: 0xffffff, alpha: 0.65 });
    if (!this.channeling) {
      const tgt = this.nearestEnemy();
      const a = tgt ? Math.atan2(tgt.pos.y - py, tgt.pos.x - px) : this.facing;
      this.playerG.moveTo(px, py).lineTo(px + Math.cos(a) * (PLAYER_R + 8), py + Math.sin(a) * (PLAYER_R + 8))
        .stroke({ color: 0x9fffe0, width: 3, alpha: 0.8 });
    }
  }

  // ── Screen-space overlay (legible HUD: XP, level, reward, buffs, pointers) ───
  private drawHudOverlay(): void {
    // XP bar.
    this.xpG.clear();
    const x = 8;
    const w = VW - 16;
    const y = TOP + 22;
    this.xpG.rect(x, y, w, 5).fill({ color: 0x09140f, alpha: 0.92 });
    this.xpG.rect(x, y, w * Math.max(0, Math.min(1, this.xp / this.xpNext)), 5).fill({ color: FOREST, alpha: 0.98 });
    this.xpG.rect(x, y, w, 5).stroke({ color: 0x0a0d0e, width: 1, alpha: 0.6 });
    this.levelText.text = `Nv ${this.level}`;

    // Reward meter — grows with survival + over-harvest, to entice staying.
    this.rewardText.text = `BIOMASSA ${this.reward}  ×${this.rewardMult.toFixed(1)}`;

    // Active buffs as bright text with countdowns.
    const parts: string[] = [];
    for (const type of PLANT_TYPES) {
      if (this.buffs[type] > 0) parts.push(`${PLANTS[type].short} ${Math.ceil(this.buffs[type])}s`);
    }
    this.buffText.text = parts.join('   ');

    // Off-screen pointers — guide to extraction beacon / boss.
    this.pointerG.clear();
    if (this.extractOpen) this.drawPointer(this.extractPos.x, this.extractPos.y, FOREST);
    if (this.boss) this.drawPointer(this.boss.pos.x, this.boss.pos.y, 0xff5a6a);

    // Floating joystick.
    this.joyG.clear();
    if (this.drag.dragging) {
      const ox = this.joyOrigin.x;
      const oy = this.joyOrigin.y;
      const dx = this.drag.pos.x - ox;
      const dy = this.drag.pos.y - oy;
      const len = Math.hypot(dx, dy) || 1;
      const clamp = Math.min(len, JOY_MAX);
      const tx = ox + (dx / len) * clamp;
      const ty = oy + (dy / len) * clamp;
      this.joyG.circle(ox, oy, JOY_MAX).stroke({ color: FOREST, width: 2, alpha: 0.18 });
      this.joyG.circle(ox, oy, 6).fill({ color: FOREST, alpha: 0.25 });
      this.joyG.circle(tx, ty, 16).fill({ color: FOREST, alpha: 0.35 });
    }
  }

  private drawPointer(wx: number, wy: number, color: number): void {
    const m = 26;
    const px = this.sx(wx);
    const py = this.sy(wy);
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

  private end(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
    const payout = this.reward;
    if (victory && payout > 0) {
      HubState.depositFlow('biomassa_adaptativa', payout);
    }
    HubState.onRunEnded(victory);
    this.root.addChild(buildEndOverlay({
      zone: ZONE,
      victory,
      rewardLabel: `+${payout} Biomassa  (×${this.rewardMult.toFixed(1)}) · Nv ${this.level} · ☠ ${this.kills}`,
      failLabel: 'Capturado pelos jardineiros — biomassa perdida.',
    }));
  }
}
