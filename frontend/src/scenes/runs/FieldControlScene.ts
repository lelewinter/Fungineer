import { Container, Graphics, Text } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { sceneManager } from '../../core/SceneManager';
import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { FontFamily, TextColor } from '../../core/typography';
import { GameConfig } from '../../state/GameConfig';
import { GameState, RunState } from '../../state/GameState';
import { HubState } from '../../state/HubState';
import { HubScene } from '../hub/HubScene';
import type { Vec2 } from '../../core/types';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;

const PLAYER_SPEED = 200;
const PLAYER_R = 14;
const RECAPTURER_HP = 70;
const RECAPTURER_SPEED = 90;
const SQUAD_DPS = 25;
const RECAPTURER_DPS = 8;
const SQUAD_HP_PER = 100;
const SMALL_RATE = 0.20;
const MEDIUM_RATE = 0.10;
const CENTRAL_RATE = 0.05;
const DECAY_MULT = 0.50;
const CONTEST_DECAY = 0.50;
const KILL_REWARD = 8;

type ZoneState = 'neutral' | 'capturing' | 'captured' | 'contested' | 'losing';

interface CaptureZone {
  center: Vec2;
  radius: number;
  captureRate: number;
  signalRate: number;
  bar: number;
  state: ZoneState;
}

interface Recapturer {
  pos: Vec2;
  hp: number;
  alive: boolean;
  targetZone: number;
  idleTimer: number;
}

const SPAWN_POINTS: Vec2[] = [
  { x: 20, y: 70 }, { x: 460, y: 70 }, { x: 20, y: 834 }, { x: 460, y: 834 },
];

/** Controle de Campo — capture 6 zones, generate sinais_controle.
 *  Port of src/scenes/runs/FieldControlMain.gd. */
export class FieldControlScene extends Scene {
  private bg = new Graphics();
  private zoneG = new Graphics();
  private recapG = new Graphics();
  private playerG = new Graphics();
  private endOverlay = new Container();
  private hudLayer = new Container();
  private hudBg = new Graphics();
  private timerLabel!: Text;
  private signalLabel!: Text;
  private hpLabel!: Text;
  private dominanceLabel!: Text;
  private warningLabels = new Container();

  private zones: CaptureZone[] = [];
  private recapturers: Recapturer[] = [];
  private signalsAcc = 0;
  private runTimer: number = GameConfig.FIELD_RUN_TIMER;
  private squadSize = 1;
  private squadHp = 0;
  private squadMaxHp = 0;
  private playerPos: Vec2 = { x: 240, y: 500 };
  private dragTarget: Vec2 = { x: 240, y: 500 };
  private dragging = false;
  private spawnTimer = 5;
  private runEnded = false;
  private victory = false;
  private pulse = 0;
  private damageFlash = 0;

  private onDown = (e: PointerEvent): void => this.pointerDown(e);
  private onMove = (e: PointerEvent): void => this.pointerMove(e);
  private onUp = (_e: PointerEvent): void => { this.dragging = false; };

  override async enter(): Promise<void> {
    GameState.startRun();
    this.squadSize = 1 + HubState.rescued_characters.length;
    this.squadMaxHp = this.squadSize * SQUAD_HP_PER;
    this.squadHp = this.squadMaxHp;
    this.buildZones();
    this.buildVisuals();
    this.buildHud();
    this.bindPointer();
    audioManager.playMusic('res://assets/audio/music/zones/field_theme_1.wav', { loop: true, volume: 0.32, fadeMs: 400 }).catch(() => undefined);
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

    this.spawnTimer -= capped;
    if (this.spawnTimer <= 0) {
      this.spawnRecapturer();
      const elapsed = GameConfig.FIELD_RUN_TIMER - this.runTimer;
      this.spawnTimer = elapsed >= 60 ? 8 : elapsed >= 30 ? 10 : 15;
    }

    this.movePlayer(capped);
    this.updateRecapturers(capped);
    this.updateZones(capped);
    this.refreshHud();
    this.redraw();
  }

  // ── Build ──────────────────────────────────────────────────────────────
  private buildVisuals(): void {
    this.bg.rect(0, 0, VW, VH).fill(Color.hex(Color.rgb(0.03, 0.03, 0.06)));
    this.root.addChild(this.bg);
    this.root.addChild(this.zoneG);
    this.root.addChild(this.warningLabels);
    this.root.addChild(this.recapG);
    this.root.addChild(this.playerG);
  }

  private buildZones(): void {
    const defs: Array<[Vec2, number, number, number]> = [
      [{ x: 240, y: 430 }, 90, CENTRAL_RATE, 2.5],
      [{ x: 110, y: 220 }, 65, MEDIUM_RATE, 1.0],
      [{ x: 370, y: 220 }, 65, MEDIUM_RATE, 1.0],
      [{ x: 60, y: 620 }, 40, SMALL_RATE, 0.5],
      [{ x: 240, y: 740 }, 40, SMALL_RATE, 0.5],
      [{ x: 420, y: 620 }, 40, SMALL_RATE, 0.5],
    ];
    for (const [c, r, cr, sr] of defs) {
      this.zones.push({ center: c, radius: r, captureRate: cr, signalRate: sr, bar: 0, state: 'neutral' });
    }
  }

  private buildHud(): void {
    this.root.addChild(this.hudLayer);
    this.hudBg.rect(0, 0, VW, 48).fill({ color: 0x000000, alpha: 0.55 });
    this.hudLayer.addChild(this.hudBg);

    this.timerLabel = new Text({ text: '', style: { fontFamily: FontFamily.mono, fontSize: 16, fill: 0xffe54d, fontWeight: '700' } });
    this.timerLabel.x = 10; this.timerLabel.y = 14;
    this.hudLayer.addChild(this.timerLabel);

    this.signalLabel = new Text({ text: '', style: { fontFamily: FontFamily.mono, fontSize: 14, fill: 0x80bfff, fontWeight: '600' } });
    this.signalLabel.x = 130; this.signalLabel.y = 15;
    this.hudLayer.addChild(this.signalLabel);

    this.hpLabel = new Text({ text: '', style: { fontFamily: FontFamily.mono, fontSize: 14, fill: 0xff6666, fontWeight: '600' } });
    this.hpLabel.x = 330; this.hpLabel.y = 15;
    this.hudLayer.addChild(this.hpLabel);

    this.dominanceLabel = new Text({
      text: '',
      style: { fontFamily: FontFamily.display, fontSize: 14, fill: 0x4dff80, letterSpacing: 2 },
    });
    this.dominanceLabel.anchor.set(0.5);
    this.dominanceLabel.x = VW / 2;
    this.dominanceLabel.y = 68;
    this.hudLayer.addChild(this.dominanceLabel);
  }

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
    const ox = (this.app.world.x);
    const oy = (this.app.world.y);
    return {
      x: (e.clientX - rect.left - ox) / scale,
      y: (e.clientY - rect.top - oy) / scale,
    };
  }

  // ── Logic ──────────────────────────────────────────────────────────────
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

  private spawnRecapturer(): void {
    if (this.recapturers.length >= 12) return;
    const p = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)]!;
    const rec: Recapturer = { pos: { ...p }, hp: RECAPTURER_HP, alive: true, targetZone: -1, idleTimer: 0 };
    this.findTarget(rec);
    this.recapturers.push(rec);
  }

  private findTarget(rec: Recapturer): void {
    let bestScore = -1, bestIdx = -1;
    for (let i = 0; i < this.zones.length; i++) {
      const z = this.zones[i]!;
      if (z.bar <= 0) continue;
      const score = z.signalRate * (z.state === 'captured' ? 2 : 1) + z.bar;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    rec.targetZone = bestIdx;
  }

  private updateRecapturers(dt: number): void {
    const toRemove: number[] = [];
    for (let i = 0; i < this.recapturers.length; i++) {
      const rec = this.recapturers[i]!;
      if (!rec.alive) { toRemove.push(i); continue; }
      if (rec.targetZone < 0 || rec.targetZone >= this.zones.length) this.findTarget(rec);
      if (rec.targetZone < 0) {
        rec.idleTimer -= dt;
        if (rec.idleTimer <= 0) rec.idleTimer = 2;
        continue;
      }
      const tc = this.zones[rec.targetZone]!.center;
      const dx = tc.x - rec.pos.x;
      const dy = tc.y - rec.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        const inv = 1 / dist;
        rec.pos.x += dx * inv * RECAPTURER_SPEED * dt;
        rec.pos.y += dy * inv * RECAPTURER_SPEED * dt;
      } else {
        this.findTarget(rec);
      }
    }
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.recapturers.splice(toRemove[i]!, 1);
      this.signalsAcc += KILL_REWARD;
    }
  }

  private squadCoverage(): number {
    return (this.squadSize - 1) * 10;
  }

  private updateZones(dt: number): void {
    let totalRecapturerDps = 0;
    let zonesCaptured = 0;
    for (const z of this.zones) {
      const dx = this.playerPos.x - z.center.x;
      const dy = this.playerPos.y - z.center.y;
      const playerIn = Math.hypot(dx, dy) < z.radius + this.squadCoverage();
      let recapsIn = 0;
      for (const rec of this.recapturers) {
        if (!rec.alive) continue;
        if (Math.hypot(rec.pos.x - z.center.x, rec.pos.y - z.center.y) < z.radius) recapsIn++;
      }
      if (playerIn && recapsIn === 0) {
        if (z.bar < 1) {
          z.state = 'capturing';
          z.bar = Math.min(1, z.bar + z.captureRate * dt);
        } else {
          z.state = 'captured';
        }
      } else if (playerIn && recapsIn > 0) {
        z.state = 'contested';
        z.bar = Math.max(0, z.bar - z.captureRate * CONTEST_DECAY * dt);
        const squadDps = this.squadSize * SQUAD_DPS;
        for (const rec of this.recapturers) {
          if (!rec.alive) continue;
          if (Math.hypot(rec.pos.x - z.center.x, rec.pos.y - z.center.y) < z.radius) {
            rec.hp -= (squadDps / recapsIn) * dt;
            if (rec.hp <= 0) rec.alive = false;
          }
        }
        totalRecapturerDps += recapsIn * RECAPTURER_DPS;
      } else if (!playerIn && recapsIn > 0) {
        z.state = 'losing';
        z.bar = Math.max(0, z.bar - z.captureRate * DECAY_MULT * dt);
        if (z.bar <= 0) z.state = 'neutral';
      } else {
        z.state = z.bar >= 1 ? 'captured' : 'neutral';
      }
      if (z.bar >= 1) zonesCaptured++;
    }

    const mul = this.dominanceMul(zonesCaptured);
    for (const z of this.zones) {
      if (z.state === 'captured' || (z.bar >= 1 && z.state !== 'losing')) {
        this.signalsAcc += z.signalRate * mul * dt;
      }
    }

    if (totalRecapturerDps > 0) {
      this.squadHp -= totalRecapturerDps * dt;
      this.damageFlash = Math.max(this.damageFlash, 0.4);
      if (this.squadHp <= 0) {
        this.squadHp = 0;
        this.endRun(false);
      }
    }
  }

  private dominanceMul(held: number): number {
    if (held >= 6) return 3;
    if (held >= 4) return 2;
    if (held >= 3) return 1.5;
    return 1;
  }

  private refreshHud(): void {
    this.timerLabel.text = `Timer: ${Math.ceil(this.runTimer)}s`;
    const held = this.zones.filter((z) => z.bar >= 1).length;
    const mul = this.dominanceMul(held);
    this.signalLabel.text = `Sinais: ${Math.floor(this.signalsAcc)}  [${held}/6]${mul > 1 ? ` (×${mul.toFixed(1)})` : ''}`;
    this.hpLabel.text = `Vida: ${Math.ceil(this.squadHp)}`;
    if (held >= 3) {
      const pulse = 0.7 + 0.3 * Math.sin(this.pulse * 3);
      this.dominanceLabel.text = `DOMINÂNCIA ×${mul.toFixed(1)}`;
      this.dominanceLabel.style.fill = held >= 6 ? 0xffe61a : 0x4dff80;
      this.dominanceLabel.alpha = pulse;
    } else {
      this.dominanceLabel.text = '';
    }
  }

  private redraw(): void {
    this.zoneG.clear();
    this.warningLabels.removeChildren();
    for (const z of this.zones) {
      const { color: col, ringW } = this.zoneColor(z);
      this.zoneG.circle(z.center.x, z.center.y, z.radius).fill({ color: col, alpha: 0.12 });
      this.zoneG.circle(z.center.x, z.center.y, z.radius).stroke({ color: col, width: ringW });
      if (z.bar > 0) {
        const barCol = z.bar < 1 ? 0x59c0ff : 0x66e666;
        this.zoneG.arc(z.center.x, z.center.y, z.radius + 6, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * z.bar, false)
          .stroke({ color: barCol, width: 5, alpha: 0.85 });
      }
      const rate = new Text({
        text: `${z.signalRate.toFixed(1)}/s`,
        style: { fontFamily: FontFamily.mono, fontSize: 9, fill: col, fontWeight: '600' },
      });
      rate.anchor.set(0.5);
      rate.x = z.center.x;
      rate.y = z.center.y + 6;
      this.warningLabels.addChild(rate);
      if (z.state === 'losing' || z.state === 'contested') {
        const warn = new Text({
          text: z.state === 'losing' ? 'DEFENDENDO!' : 'CONTESTADA!',
          style: { fontFamily: FontFamily.body, fontSize: 9, fill: 0xff4d4d, fontWeight: '700' },
        });
        warn.anchor.set(0.5, 1);
        warn.x = z.center.x;
        warn.y = z.center.y - z.radius - 6;
        this.warningLabels.addChild(warn);
      }
    }

    this.recapG.clear();
    for (const rec of this.recapturers) {
      if (!rec.alive) continue;
      this.recapG.circle(rec.pos.x, rec.pos.y, 10).fill(Color.hex(Color.rgb(0.9, 0.25, 0.15)));
      this.recapG.circle(rec.pos.x, rec.pos.y, 11).stroke({ color: 0xff5a33, width: 2, alpha: 0.7 });
      const hpRatio = rec.hp / RECAPTURER_HP;
      this.recapG
        .rect(rec.pos.x - 12, rec.pos.y - 18, 24, 4).fill({ color: 0x333333 })
        .rect(rec.pos.x - 12, rec.pos.y - 18, 24 * hpRatio, 4).fill({ color: 0xe64020 });
    }

    this.playerG.clear();
    const pc = this.damageFlash > 0.5 ? 0xff4040 : 0x66bfff;
    this.playerG.circle(this.playerPos.x, this.playerPos.y, PLAYER_R).fill(pc);
    this.playerG.circle(this.playerPos.x, this.playerPos.y, PLAYER_R + 2)
      .stroke({ color: pc, width: 1.5, alpha: 0.45 });
    for (let i = 0; i < Math.min(this.squadSize - 1, 3); i++) {
      const ang = i * Math.PI * 2 / 3 + 0.8;
      const off = { x: Math.cos(ang) * 22, y: Math.sin(ang) * 22 };
      this.playerG.circle(this.playerPos.x + off.x, this.playerPos.y + off.y, 7)
        .fill({ color: 0x80d9ff, alpha: 0.65 });
    }
  }

  private zoneColor(z: CaptureZone): { color: number; ringW: number } {
    switch (z.state) {
      case 'neutral':   return { color: 0x59595c, ringW: 3 };
      case 'capturing': return { color: 0x4073e6, ringW: 3 };
      case 'captured':  return { color: 0x3380f2, ringW: 3 };
      case 'contested': return { color: 0xd926e6, ringW: 4 + 2 * Math.abs(Math.sin(this.pulse * 8)) };
      case 'losing':    return { color: 0xff1a1a, ringW: 4 + 2 * Math.abs(Math.sin(this.pulse * 6)) };
    }
  }

  private endRun(victory: boolean): void {
    if (this.runEnded) return;
    this.runEnded = true;
    this.victory = victory;
    if (victory) HubState.depositFlow('sinais_controle', Math.floor(this.signalsAcc));
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
      text: this.victory ? 'run completa' : 'falhou',
      style: { fontFamily: FontFamily.display, fontSize: 32, fill: this.victory ? 0x4dff66 : 0xff4d4d, letterSpacing: 6 },
    });
    msg.anchor.set(0.5);
    msg.x = VW / 2;
    msg.y = VH * 0.45;
    this.endOverlay.addChild(msg);
    if (this.victory) {
      const sub = new Text({
        text: `+ ${Math.floor(this.signalsAcc)} sinais`,
        style: { fontFamily: FontFamily.body, fontSize: 18, fill: 0x80bfff, fontWeight: '600' },
      });
      sub.anchor.set(0.5);
      sub.x = VW / 2;
      sub.y = VH * 0.45 + 36;
      this.endOverlay.addChild(sub);
    }
    this.root.addChild(this.endOverlay);
    void TextColor;
  }
}
