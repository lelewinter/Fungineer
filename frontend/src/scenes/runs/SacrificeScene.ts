import { Container, Graphics, Text } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { sceneManager } from '../../core/SceneManager';
import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { FontFamily } from '../../core/typography';
import { GameConfig } from '../../state/GameConfig';
import { GameState, RunState } from '../../state/GameState';
import { HubState } from '../../state/HubState';
import { HubScene } from '../hub/HubScene';
import { shuffleInPlace } from '../../core/types';
import type { Vec2 } from '../../core/types';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;

const SQUAD_DPS = 15;
const ENEMY_HP_EACH = 30;
const ENEMY_DPS = 3;
const SQUAD_HP_PER = 80;
const COLLECT_TIME = 1.5;
const COLLECT_DIST = 26;
const PICKUP_R = 8;
const PLAYER_SPEED = 200;
const PLAYER_R = 14;
const CHAMBER_RADIUS = 170;
const CHAMBER_W = 130;
const CHAMBER_H = 100;
const N_CHAMBERS = 5;
const CORRIDOR_W = 38;
const SEAL_TIME = 8;
const HUB_SPAWN_INTERVAL = 12;
const HUB_ENEMY_HP = 22;
const HUB_ENEMY_SPEED = 110;
const HUB_ENEMY_DPS = 8;
const HUB_ENEMY_DAMAGE_DIST = 48;
const BONUS_INTERVAL = 12;
const BONUS_COLLECT_TIME = 0.35;

const HUB_CENTER: Vec2 = { x: 240, y: 427 };
const HUB_RECT = { x: 155, y: 352, w: 170, h: 150 };
const EXIT_RECT = { x: 190, y: 462, w: 100, h: 40 };

type CostKind = 'none' | 'timer' | 'enemy' | 'slot' | 'chain';

interface Pickup {
  pos: Vec2;
  type: 'scrap' | 'ai_components';
  collected: boolean;
  collecting: boolean;
  timer: number;
}

interface Chamber {
  rect: { x: number; y: number; w: number; h: number };
  center: Vec2;
  scrap: number;
  ai: number;
  cost: CostKind;
  costTimerS: number;
  costEnemyN: number;
  chainTo: number;
  entered: boolean;
  enemyHp: number;
  pickups: Pickup[];
  collectingIdx: number;
  sealTimer: number;
  sealed: boolean;
}

interface HubEnemy {
  pos: Vec2;
  hp: number;
}

function rectHasPoint(r: { x: number; y: number; w: number; h: number }, p: Vec2): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

/** Sacrifício zone — 5 chambers around a hub, each with a cost. Port of
 *  src/scenes/runs/SacrificeMain.gd. */
export class SacrificeScene extends Scene {
  private bg = new Graphics();
  private corridorG = new Graphics();
  private hubG = new Graphics();
  private chamberG = new Graphics();
  private enemyG = new Graphics();
  private playerG = new Graphics();
  private labelLayer = new Container();
  private endOverlay = new Container();

  private hudLayer = new Container();
  private hudBg = new Graphics();
  private timerLabel!: Text;
  private bagLabel!: Text;
  private hpLabel!: Text;
  private exitLabel!: Text;
  private hubTitle!: Text;

  private chambers: Chamber[] = [];
  private backpack: string[] = [];
  private bagCap = 3;
  private runTimer: number = GameConfig.SACRIFICE_RUN_TIMER;
  private squadSize = 1;
  private squadHp = 0;
  private squadMaxHp = 0;
  private playerPos: Vec2 = { ...HUB_CENTER };
  private dragTarget: Vec2 = { ...HUB_CENTER };
  private dragging = false;
  private currentChamberIdx = -1;
  private runEnded = false;
  private victory = false;
  private damageFlash = 0;
  private pulse = 0;
  private hubEnemies: HubEnemy[] = [];
  private hubSpawnTimer = 20;
  private bonusIdx = -1;
  private bonusTimer = 8;

  private onDown = (e: PointerEvent): void => this.pointerDown(e);
  private onMove = (e: PointerEvent): void => this.pointerMove(e);
  private onUp = (): void => { this.dragging = false; };

  override async enter(): Promise<void> {
    GameState.startRun();
    this.bagCap = HubState.getBackpackCapacity();
    this.squadSize = 1 + HubState.rescued_characters.length;
    this.squadMaxHp = this.squadSize * SQUAD_HP_PER;
    this.squadHp = this.squadMaxHp;
    this.buildChambers();
    this.buildVisuals();
    this.buildHud();
    this.bindPointer();
    audioManager.playMusic('res://assets/audio/music/zones/dungeon_theme_1.wav', { loop: true, volume: 0.35, fadeMs: 400 }).catch(() => undefined);
  }

  override async exit(): Promise<void> {
    this.unbindPointer();
    audioManager.stopMusic(250);
  }

  override update(dt: number): void {
    if (this.runEnded) return;
    if (GameState.current_state !== RunState.PLAYING) return;
    const capped = Math.min(dt, 1 / 30);
    this.pulse += capped;
    this.damageFlash = Math.max(0, this.damageFlash - capped * 3);

    this.runTimer -= capped;
    if (this.runTimer <= 0) {
      this.runTimer = 0;
      this.endRun(true);
      return;
    }

    this.currentChamberIdx = -1;
    for (let i = 0; i < this.chambers.length; i++) {
      if (rectHasPoint(this.chambers[i]!.rect, this.playerPos)) { this.currentChamberIdx = i; break; }
    }

    for (const ch of this.chambers) {
      if (ch.entered && !ch.sealed && ch.sealTimer >= 0) {
        ch.sealTimer += capped;
        if (ch.sealTimer >= SEAL_TIME) {
          ch.sealed = true;
          ch.collectingIdx = -1;
          for (let k = 0; k < 2; k++) {
            const ang = this.pulse + k * Math.PI;
            this.hubEnemies.push({
              pos: { x: ch.center.x + Math.cos(ang) * 30, y: ch.center.y + Math.sin(ang) * 30 },
              hp: HUB_ENEMY_HP,
            });
          }
        }
      }
    }

    this.bonusTimer -= capped;
    if (this.bonusTimer <= 0) {
      this.bonusTimer = BONUS_INTERVAL;
      this.rotateBonus();
    }
    this.hubSpawnTimer -= capped;
    if (this.hubSpawnTimer <= 0) {
      this.hubSpawnTimer = HUB_SPAWN_INTERVAL;
      this.spawnHubEnemies();
    }

    this.movePlayer(capped);
    this.updateHubEnemies(capped);
    if (this.runEnded) return;

    if (this.currentChamberIdx >= 0) {
      const ch = this.chambers[this.currentChamberIdx]!;
      if (!ch.entered) {
        ch.entered = true;
        ch.sealTimer = 0;
        this.activateCost(ch);
      }
      if (this.enemiesAlive(ch)) {
        const squadDps = this.squadSize * SQUAD_DPS;
        ch.enemyHp = Math.max(0, ch.enemyHp - squadDps * capped);
        const dmg = this.enemyCount(ch) * ENEMY_DPS * capped;
        this.squadHp -= dmg;
        this.damageFlash = Math.max(this.damageFlash, 0.4);
        if (this.squadHp <= 0) {
          this.squadHp = 0;
          this.endRun(false);
          return;
        }
      } else {
        this.updateCollection(ch, this.currentChamberIdx, capped);
      }
    }

    this.refreshHud();

    if (rectHasPoint(EXIT_RECT, this.playerPos)) {
      this.endRun(true);
      return;
    }

    this.redraw();
  }

  // ── Build ──────────────────────────────────────────────────────────────
  private buildVisuals(): void {
    this.bg.rect(0, 0, VW, VH).fill(Color.hex(Color.rgb(0.04, 0.02, 0.03)));
    this.root.addChild(this.bg);
    this.root.addChild(this.corridorG);
    this.root.addChild(this.hubG);
    this.root.addChild(this.enemyG);
    this.root.addChild(this.chamberG);
    this.root.addChild(this.playerG);
    this.root.addChild(this.labelLayer);
  }

  private buildChambers(): void {
    const positions: Array<{ x: number; y: number; w: number; h: number }> = [];
    for (let i = 0; i < N_CHAMBERS; i++) {
      const angle = -Math.PI * 0.5 + (i * Math.PI * 2) / N_CHAMBERS;
      const cx = HUB_CENTER.x + CHAMBER_RADIUS * Math.cos(angle);
      const cy = HUB_CENTER.y + CHAMBER_RADIUS * Math.sin(angle);
      positions.push({ x: cx - CHAMBER_W * 0.5, y: cy - CHAMBER_H * 0.5, w: CHAMBER_W, h: CHAMBER_H });
    }
    const templates: Array<{ scrap: number; ai: number; cost: CostKind; timerS: number; enemyN: number }> = [
      { scrap: 4, ai: 0, cost: 'none',  timerS: 0,  enemyN: 0 },
      { scrap: 0, ai: 6, cost: 'timer', timerS: 15, enemyN: 0 },
      { scrap: 8, ai: 0, cost: 'enemy', timerS: 0,  enemyN: 3 },
      { scrap: 0, ai: 5, cost: 'slot',  timerS: 0,  enemyN: 0 },
      { scrap: 5, ai: 3, cost: 'chain', timerS: 0,  enemyN: 0 },
    ];
    shuffleInPlace(templates);

    for (let i = 0; i < N_CHAMBERS; i++) {
      const t = templates[i]!;
      const pos = positions[i]!;
      const ch: Chamber = {
        rect: pos,
        center: { x: pos.x + pos.w / 2, y: pos.y + pos.h / 2 },
        scrap: t.scrap, ai: t.ai, cost: t.cost,
        costTimerS: t.timerS, costEnemyN: t.enemyN,
        chainTo: -1, entered: false, enemyHp: 0,
        pickups: [], collectingIdx: -1, sealTimer: -1, sealed: false,
      };
      this.buildPickups(ch);
      this.chambers.push(ch);
    }

    let timerIdx = 0;
    for (let i = 0; i < this.chambers.length; i++) {
      if (this.chambers[i]!.cost === 'timer') { timerIdx = i; break; }
    }
    for (const ch of this.chambers) {
      if (ch.cost === 'chain') ch.chainTo = timerIdx;
    }
  }

  private buildPickups(ch: Chamber): void {
    const total = ch.scrap + ch.ai;
    if (total === 0) return;
    const pad = 18;
    const area = { x: ch.rect.x + pad, y: ch.rect.y + pad, w: ch.rect.w - pad * 2, h: ch.rect.h - pad * 2 };
    const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
    const rows = Math.ceil(total / cols);
    const sx = area.w / cols;
    const sy = area.h / rows;
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (idx >= total) break;
        ch.pickups.push({
          pos: { x: area.x + sx * (c + 0.5), y: area.y + sy * (r + 0.5) },
          type: idx < ch.scrap ? 'scrap' : 'ai_components',
          collected: false, collecting: false, timer: 0,
        });
        idx++;
      }
    }
  }

  private buildHud(): void {
    this.root.addChild(this.hudLayer);
    this.hudBg.rect(0, 0, VW, 48).fill({ color: 0x000000, alpha: 0.55 });
    this.hudLayer.addChild(this.hudBg);
    this.timerLabel = new Text({ text: '', style: { fontFamily: FontFamily.mono, fontSize: 16, fill: 0xffe54d, fontWeight: '700' } });
    this.timerLabel.x = 10; this.timerLabel.y = 14;
    this.hudLayer.addChild(this.timerLabel);
    this.bagLabel = new Text({ text: '', style: { fontFamily: FontFamily.mono, fontSize: 14, fill: 0xe6b3ff, fontWeight: '600' } });
    this.bagLabel.x = 130; this.bagLabel.y = 15;
    this.hudLayer.addChild(this.bagLabel);
    this.hpLabel = new Text({ text: '', style: { fontFamily: FontFamily.mono, fontSize: 14, fill: 0xff6666, fontWeight: '600' } });
    this.hpLabel.x = 300; this.hpLabel.y = 15;
    this.hudLayer.addChild(this.hpLabel);

    this.hubTitle = new Text({ text: 'HUB', style: { fontFamily: FontFamily.mono, fontSize: 10, fill: 0xb399cc, fontWeight: '600' } });
    this.hubTitle.anchor.set(0.5);
    this.hubTitle.x = HUB_CENTER.x;
    this.hubTitle.y = HUB_CENTER.y - 55;

    this.exitLabel = new Text({ text: 'EXIT', style: { fontFamily: FontFamily.mono, fontSize: 12, fill: 0x4dff4d, fontWeight: '700', letterSpacing: 2 } });
    this.exitLabel.anchor.set(0.5);
    this.exitLabel.x = EXIT_RECT.x + EXIT_RECT.w / 2;
    this.exitLabel.y = EXIT_RECT.y + EXIT_RECT.h / 2;
  }

  // ── Input ──────────────────────────────────────────────────────────────
  private bindPointer(): void {
    const c = this.app.pixi.canvas;
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onUp);
  }
  private unbindPointer(): void {
    const c = this.app.pixi.canvas;
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('pointermove', this.onMove);
    c.removeEventListener('pointerup', this.onUp);
    c.removeEventListener('pointercancel', this.onUp);
  }
  private pointerDown(e: PointerEvent): void {
    if (this.runEnded) return;
    this.dragging = true;
    this.dragTarget = this.screenToWorld(e);
  }
  private pointerMove(e: PointerEvent): void {
    if (!this.dragging) return;
    this.dragTarget = this.screenToWorld(e);
  }
  private screenToWorld(e: PointerEvent): Vec2 {
    const rect = this.app.pixi.canvas.getBoundingClientRect();
    const scale = this.app.world.scale.x || 1;
    return {
      x: (e.clientX - rect.left - this.app.world.x) / scale,
      y: (e.clientY - rect.top - this.app.world.y) / scale,
    };
  }
  private movePlayer(dt: number): void {
    if (!this.dragging) return;
    const dx = this.dragTarget.x - this.playerPos.x;
    const dy = this.dragTarget.y - this.playerPos.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) return;
    const inv = 1 / dist;
    this.playerPos.x += dx * inv * PLAYER_SPEED * dt;
    this.playerPos.y += dy * inv * PLAYER_SPEED * dt;
    this.playerPos.x = Math.max(0, Math.min(VW, this.playerPos.x));
    this.playerPos.y = Math.max(48, Math.min(VH, this.playerPos.y));
  }

  // ── Chamber logic ──────────────────────────────────────────────────────
  private enemyCount(ch: Chamber): number {
    return Math.ceil(ch.enemyHp / ENEMY_HP_EACH);
  }
  private enemiesAlive(ch: Chamber): boolean {
    return ch.cost === 'enemy' && ch.entered && ch.enemyHp > 0;
  }

  private activateCost(ch: Chamber): void {
    switch (ch.cost) {
      case 'timer':
        this.runTimer = Math.max(0, this.runTimer - ch.costTimerS);
        break;
      case 'enemy':
        ch.enemyHp = ch.costEnemyN * ENEMY_HP_EACH;
        break;
      case 'slot':
        this.bagCap = Math.max(0, this.bagCap - 1);
        while (this.backpack.length > this.bagCap) this.backpack.pop();
        break;
      case 'chain':
        if (ch.chainTo >= 0 && ch.chainTo < this.chambers.length) {
          const target = this.chambers[ch.chainTo]!;
          if (!target.entered) {
            target.entered = true;
            this.activateCost(target);
          }
        }
        break;
    }
  }

  private updateCollection(ch: Chamber, chIdx: number, dt: number): void {
    if (ch.sealed) return;
    const collectTime = chIdx === this.bonusIdx ? BONUS_COLLECT_TIME : COLLECT_TIME;
    if (ch.collectingIdx >= 0) {
      const p = ch.pickups[ch.collectingIdx]!;
      const dist = Math.hypot(this.playerPos.x - p.pos.x, this.playerPos.y - p.pos.y);
      if (!rectHasPoint(ch.rect, this.playerPos) || dist > COLLECT_DIST + 8) {
        p.collecting = false;
        p.timer = 0;
        ch.collectingIdx = -1;
      } else {
        p.timer += dt;
        if (p.timer >= collectTime) {
          if (this.backpack.length < this.bagCap) this.backpack.push(p.type);
          p.collected = true;
          p.collecting = false;
          ch.collectingIdx = -1;
        }
      }
    } else if (this.backpack.length < this.bagCap) {
      for (let i = 0; i < ch.pickups.length; i++) {
        const p = ch.pickups[i]!;
        if (p.collected || p.collecting) continue;
        const dist = Math.hypot(this.playerPos.x - p.pos.x, this.playerPos.y - p.pos.y);
        if (dist < COLLECT_DIST) {
          p.collecting = true;
          p.timer = 0;
          ch.collectingIdx = i;
          break;
        }
      }
    }
  }

  private rotateBonus(): void {
    const candidates: number[] = [];
    for (let i = 0; i < this.chambers.length; i++) {
      const ch = this.chambers[i]!;
      if (ch.sealed) continue;
      if (ch.pickups.some((p) => !p.collected)) candidates.push(i);
    }
    if (candidates.length === 0) { this.bonusIdx = -1; return; }
    this.bonusIdx = candidates[Math.floor(Math.random() * candidates.length)]!;
  }

  private spawnHubEnemies(): void {
    const count = Math.min(2, 4 - this.hubEnemies.length);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / Math.max(1, count) + this.pulse;
      const r = CHAMBER_RADIUS * 0.55;
      this.hubEnemies.push({
        pos: { x: HUB_CENTER.x + Math.cos(angle) * r, y: HUB_CENTER.y + Math.sin(angle) * r },
        hp: HUB_ENEMY_HP,
      });
    }
  }

  private updateHubEnemies(dt: number): void {
    let totalDps = 0;
    const toRemove: number[] = [];
    for (let i = 0; i < this.hubEnemies.length; i++) {
      const e = this.hubEnemies[i]!;
      const dx = this.playerPos.x - e.pos.x;
      const dy = this.playerPos.y - e.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 6) {
        const inv = 1 / dist;
        e.pos.x += dx * inv * HUB_ENEMY_SPEED * dt;
        e.pos.y += dy * inv * HUB_ENEMY_SPEED * dt;
      }
      if (dist < HUB_ENEMY_DAMAGE_DIST) {
        totalDps += HUB_ENEMY_DPS;
        const share = (this.squadSize * SQUAD_DPS) / this.hubEnemies.length;
        e.hp -= share * dt;
      }
      if (e.hp <= 0) toRemove.push(i);
    }
    for (let i = toRemove.length - 1; i >= 0; i--) this.hubEnemies.splice(toRemove[i]!, 1);
    if (totalDps > 0) {
      this.squadHp -= totalDps * dt;
      this.damageFlash = Math.max(this.damageFlash, 0.55);
      if (this.squadHp <= 0) {
        this.squadHp = 0;
        this.endRun(false);
      }
    }
  }

  // ── Drawing ────────────────────────────────────────────────────────────
  private refreshHud(): void {
    this.timerLabel.text = `Timer: ${Math.ceil(this.runTimer)}s`;
    this.bagLabel.text = `Bag: ${this.backpack.length}/${this.bagCap}`;
    const inv = this.hubEnemies.length;
    this.hpLabel.text = `Vida: ${Math.ceil(this.squadHp)}${inv > 0 ? `  ⚠ ×${inv}` : ''}`;
  }

  private redraw(): void {
    // Corridors
    this.corridorG.clear();
    for (const ch of this.chambers) {
      this.corridorG.moveTo(HUB_CENTER.x, HUB_CENTER.y).lineTo(ch.center.x, ch.center.y)
        .stroke({ color: Color.hex(Color.rgb(0.07, 0.05, 0.09)), width: CORRIDOR_W });
    }

    // Hub
    this.hubG.clear();
    this.hubG.rect(HUB_RECT.x, HUB_RECT.y, HUB_RECT.w, HUB_RECT.h)
      .fill(Color.hex(Color.rgb(0.09, 0.07, 0.13)))
      .stroke({ color: Color.hex(Color.rgb(0.45, 0.25, 0.40)), width: 1.5, alpha: 0.8 });
    this.hubG.rect(EXIT_RECT.x, EXIT_RECT.y, EXIT_RECT.w, EXIT_RECT.h)
      .fill(Color.hex(Color.rgb(0.10, 0.35, 0.12)))
      .stroke({ color: Color.hex(Color.rgb(0.25, 0.90, 0.30)), width: 2, alpha: 0.9 });

    // Chambers
    this.chamberG.clear();
    this.labelLayer.removeChildren();
    this.labelLayer.addChild(this.hubTitle);
    this.labelLayer.addChild(this.exitLabel);

    for (let i = 0; i < this.chambers.length; i++) {
      const ch = this.chambers[i]!;
      const isCurrent = i === this.currentChamberIdx;
      const floorCol = isCurrent ? Color.rgb(0.15, 0.10, 0.14) : Color.rgb(0.12, 0.08, 0.10);
      this.chamberG.rect(ch.rect.x, ch.rect.y, ch.rect.w, ch.rect.h).fill(Color.hex(floorCol));

      if (i === this.bonusIdx && !ch.sealed) {
        const bp = 0.55 + 0.45 * Math.sin(this.pulse * 4.5);
        this.chamberG.rect(ch.rect.x, ch.rect.y, ch.rect.w, ch.rect.h)
          .fill({ color: 0xffd91a, alpha: 0.18 * bp })
          .stroke({ color: 0xffd91a, width: 3, alpha: 0.8 * bp });
        const label = new Text({ text: 'RÁPIDO!', style: { fontFamily: FontFamily.body, fontSize: 9, fill: 0xffe61a, fontWeight: '700' } });
        label.anchor.set(0.5);
        label.x = ch.center.x;
        label.y = ch.center.y - 42;
        label.alpha = bp;
        this.labelLayer.addChild(label);
      }

      const costCol = this.costColor(ch.cost);
      this.chamberG.rect(ch.rect.x, ch.rect.y, ch.rect.w, ch.rect.h)
        .stroke({ color: costCol, width: 2, alpha: 0.8 });

      if (ch.entered && !ch.sealed && ch.sealTimer >= 0) {
        const sealRatio = ch.sealTimer / SEAL_TIME;
        const urgent = sealRatio > 0.65;
        const sp = urgent ? 0.5 + 0.5 * Math.sin(this.pulse * 8) : 1;
        this.chamberG.arc(ch.center.x, ch.center.y, CHAMBER_W * 0.5 + 9,
          -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * (1 - sealRatio), false)
          .stroke({ color: 0xff4d20, width: 4.5, alpha: 0.85 * sp });
        const label = new Text({
          text: `${(SEAL_TIME - ch.sealTimer).toFixed(0)}s`,
          style: { fontFamily: FontFamily.mono, fontSize: 10, fill: 0xff7a30, fontWeight: '700' },
        });
        label.anchor.set(0.5);
        label.x = ch.center.x;
        label.y = ch.center.y - 42;
        label.alpha = sp;
        this.labelLayer.addChild(label);
      } else if (ch.sealed) {
        this.chamberG.rect(ch.rect.x, ch.rect.y, ch.rect.w, ch.rect.h)
          .fill({ color: 0x000000, alpha: 0.55 });
        const label = new Text({
          text: 'SELADA',
          style: { fontFamily: FontFamily.display, fontSize: 12, fill: 0x8c3838, letterSpacing: 3 },
        });
        label.anchor.set(0.5);
        label.x = ch.center.x;
        label.y = ch.center.y;
        this.labelLayer.addChild(label);
      }

      const resText = this.resourceLabel(ch);
      const resLbl = new Text({
        text: resText,
        style: { fontFamily: FontFamily.body, fontSize: 9, fill: 0xf2e6cc, fontWeight: '600' },
      });
      resLbl.anchor.set(0.5);
      resLbl.x = ch.center.x;
      resLbl.y = ch.center.y - 28;
      this.labelLayer.addChild(resLbl);

      const costLbl = new Text({
        text: this.costLabel(ch),
        style: { fontFamily: FontFamily.body, fontSize: 10, fill: costCol, fontWeight: '700' },
      });
      costLbl.anchor.set(0.5);
      costLbl.x = ch.center.x;
      costLbl.y = ch.center.y + 35;
      this.labelLayer.addChild(costLbl);

      if (ch.cost === 'chain' && ch.chainTo >= 0) {
        const target = this.chambers[ch.chainTo]!;
        const dx = target.center.x - ch.center.x;
        const dy = target.center.y - ch.center.y;
        const len = Math.hypot(dx, dy) || 1;
        const t = 30 / len;
        this.chamberG.moveTo(ch.center.x, ch.center.y)
          .lineTo(ch.center.x + dx * t, ch.center.y + dy * t)
          .stroke({ color: 0xe68019, width: 2, alpha: 0.5 });
      }

      if (ch.entered) {
        this.chamberG.rect(ch.rect.x, ch.rect.y, ch.rect.w, ch.rect.h)
          .fill({ color: 0x000000, alpha: 0.30 });
      }

      if (this.enemiesAlive(ch)) {
        const n = this.enemyCount(ch);
        for (let e = 0; e < n; e++) {
          const ex = ch.rect.x + 20 + e * 22;
          const ey = ch.center.y;
          this.chamberG.circle(ex, ey, 8).fill({ color: 0xe63333, alpha: 0.85 });
        }
      }

      for (const p of ch.pickups) {
        if (p.collected) continue;
        const pcol = p.type === 'scrap' ? 0xbf8c33 : 0x66a6ff;
        this.chamberG.circle(p.pos.x, p.pos.y, PICKUP_R).fill({ color: pcol, alpha: p.collecting ? 0.5 : 1 });
        if (p.collecting) {
          const prog = Math.min(1, p.timer / COLLECT_TIME);
          this.chamberG.arc(p.pos.x, p.pos.y, PICKUP_R + 5, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * prog, false)
            .stroke({ color: 0xffff80, width: 2.5, alpha: 0.9 });
        }
      }
    }

    // Hub enemies
    this.enemyG.clear();
    for (const e of this.hubEnemies) {
      const p = 0.55 + 0.45 * Math.sin(this.pulse * 7);
      this.enemyG.circle(e.pos.x, e.pos.y, 9).fill({ color: 0xee2d20, alpha: p });
      this.enemyG.circle(e.pos.x, e.pos.y, 11).stroke({ color: 0xff5a33, width: 1.5, alpha: 0.65 * p });
      if (Math.hypot(e.pos.x - this.playerPos.x, e.pos.y - this.playerPos.y) < HUB_ENEMY_DAMAGE_DIST) {
        const wp = 0.6 + 0.4 * Math.sin(this.pulse * 8);
        this.enemyG.circle(e.pos.x, e.pos.y, 13).fill({ color: 0xff2d14, alpha: 0.35 * wp });
      }
    }
    if (this.hubEnemies.length > 0) {
      const wp = 0.6 + 0.4 * Math.sin(this.pulse * 8);
      const lbl = new Text({
        text: `INVASORES ×${this.hubEnemies.length}`,
        style: { fontFamily: FontFamily.body, fontSize: 12, fill: 0xff4040, fontWeight: '700' },
      });
      lbl.anchor.set(0.5);
      lbl.x = VW / 2;
      lbl.y = 76;
      lbl.alpha = wp;
      this.labelLayer.addChild(lbl);
    }

    // Player
    this.playerG.clear();
    const pc = this.damageFlash > 0.5 ? 0xff4040 : 0x66b3ff;
    this.playerG.circle(this.playerPos.x, this.playerPos.y, PLAYER_R).fill(pc);
    this.playerG.circle(this.playerPos.x, this.playerPos.y, PLAYER_R + 2)
      .stroke({ color: pc, width: 1.5, alpha: 0.45 });
    for (let i = 0; i < Math.min(this.squadSize - 1, 3); i++) {
      const ang = i * Math.PI * 2 / 3 + 0.5;
      this.playerG.circle(this.playerPos.x + Math.cos(ang) * 20, this.playerPos.y + Math.sin(ang) * 20, 7)
        .fill({ color: 0x80ccff, alpha: 0.65 });
    }
  }

  private costColor(c: CostKind): number {
    switch (c) {
      case 'none':  return 0x4dff4d;
      case 'timer': return 0xe6c633;
      case 'enemy': return 0xe63333;
      case 'slot':  return 0x9933e6;
      case 'chain': return 0xe68019;
    }
  }

  private costLabel(ch: Chamber): string {
    switch (ch.cost) {
      case 'none':  return 'SEM CUSTO';
      case 'timer': return `−${ch.costTimerS}s`;
      case 'enemy': return `×${ch.costEnemyN} Inimigos`;
      case 'slot':  return '−1 Slot';
      case 'chain': return 'CADEIA';
    }
  }

  private resourceLabel(ch: Chamber): string {
    const parts: string[] = [];
    if (ch.scrap > 0) parts.push(`Sucata ×${ch.scrap}`);
    if (ch.ai > 0) parts.push(`C.IA ×${ch.ai}`);
    return parts.length ? parts.join('\n') : 'Vazio';
  }

  private endRun(victory: boolean): void {
    if (this.runEnded) return;
    this.runEnded = true;
    this.victory = victory;
    if (victory) HubState.depositBackpack(this.backpack);
    HubState.onRunEnded(victory);
    GameState.endRun(victory);
    this.showEndOverlay();
    setTimeout(() => { void sceneManager.replace(new HubScene()); }, 2500);
  }

  private showEndOverlay(): void {
    this.endOverlay.removeChildren();
    const dim = new Graphics().rect(0, 0, VW, VH).fill({ color: 0x000000, alpha: 0.7 });
    this.endOverlay.addChild(dim);
    const msg = new Text({
      text: this.victory ? 'vitória' : 'falhou',
      style: { fontFamily: FontFamily.display, fontSize: 36, fill: this.victory ? 0x4dff66 : 0xff4d4d, letterSpacing: 8 },
    });
    msg.anchor.set(0.5);
    msg.x = VW / 2;
    msg.y = VH * 0.45;
    this.endOverlay.addChild(msg);
    if (this.victory) {
      const sub = new Text({
        text: `+ ${this.backpack.length} recursos`,
        style: { fontFamily: FontFamily.body, fontSize: 18, fill: 0xf2c64d, fontWeight: '600' },
      });
      sub.anchor.set(0.5);
      sub.x = VW / 2;
      sub.y = VH * 0.45 + 36;
      this.endOverlay.addChild(sub);
    }
    this.root.addChild(this.endOverlay);
  }
}
