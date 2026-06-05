import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { sceneManager } from '../../core/SceneManager';
import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { FontFamily, TextColor } from '../../core/typography';
import { GameConfig } from '../../state/GameConfig';
import { GameState, RunState } from '../../state/GameState';
import { HubState } from '../../state/HubState';
import { ZONES } from '../../state/Zones';
import { RunJuice } from '../../run/fx/RunJuice';
import { HubScene } from '../hub/HubScene';
import type { Vec2 } from '../../core/types';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;
const ZONE = ZONES[4]!;

// ── Numeros de balanceamento (a "receita" da fase; nada aqui foi alterado) ──
const PLAYER_SPEED = 200;      // velocidade do esquadrao (pixels por segundo)
const PLAYER_R = 14;           // raio do esquadrao (hitbox)
const RECAPTURER_HP = 70;      // vida de cada inimigo "recapturador"
const RECAPTURER_SPEED = 90;   // velocidade dos recapturadores
const SQUAD_DPS = 25;          // dano por segundo de cada membro do esquadrao
const RECAPTURER_DPS = 8;      // dano por segundo de cada recapturador
const SQUAD_HP_PER = 100;      // vida que cada membro do esquadrao soma ao total
const SMALL_RATE = 0.20;       // velocidade de captura das zonas pequenas
const MEDIUM_RATE = 0.10;      // velocidade de captura das zonas medias
const CENTRAL_RATE = 0.05;     // velocidade de captura da zona central (a mais lenta)
const DECAY_MULT = 0.50;       // o quanto a barra cai quando so o inimigo esta na zona
const CONTEST_DECAY = 0.50;    // o quanto a barra cai quando os dois disputam a zona
const KILL_REWARD = 8;         // sinais ganhos ao derrotar um recapturador

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

// Os 4 cantos do mapa de onde os recapturadores aparecem.
const SPAWN_POINTS: Vec2[] = [
  { x: 20, y: 70 }, { x: 460, y: 70 }, { x: 20, y: 834 }, { x: 460, y: 834 },
];

// ============================================================================
// CONTROLE DE CAMPO — DOMINE 6 ZONAS DE UMA PRACA PARA GERAR SINAIS
// ----------------------------------------------------------------------------
// Ideia da fase, em palavras simples:
//   - O mapa e uma praca com 6 "zonas" (circulos). Voce arrasta o dedo para
//     mover seu esquadrao. Ficar dentro de uma zona vai enchendo a barra dela
//     ate captura-la; zona capturada gera "sinais de controle" (a recompensa).
//   - A IA manda "recapturadores": inimigos que vao ate as zonas suas e comecam
//     a baixar a barra (retomar). Se voce estiver na zona junto com eles, ha uma
//     disputa: o esquadrao luta contra eles e a barra cai mais devagar.
//   - Quanto mais zonas voce segura ao mesmo tempo, maior o multiplicador de
//     "dominancia" — segurar 3, 4 ou 6 zonas rende muito mais sinais por segundo.
//   - A run termina quando o tempo acaba (sucesso: deposita os sinais juntados).
//     Se a vida do esquadrao zera por causa dos recapturadores, a run falha.
//
// Porte (traducao) de src/scenes/runs/FieldControlMain.gd (versao original em Godot).
// ============================================================================

/** Cena da zona Controle de Campo — capture 6 zonas e gere sinais_controle. */
export class FieldControlScene extends Scene {
  private content = new Container();
  private bg = new Graphics();
  private zoneG = new Graphics();
  private recapG = new Graphics();
  private playerG = new Graphics();
  private endOverlay = new Container();
  private juice!: RunJuice;
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

  private exitTimeout: ReturnType<typeof setTimeout> | null = null;

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
    this.juice = new RunJuice(this.root, { accent: Color.hex(ZONE.accent_color), shakeTarget: this.content, ambient: 26 });
    this.buildHud();
    this.bindPointer();
    if (ZONE.music) audioManager.playMusic(ZONE.music, { loop: true, volume: 0.32, fadeMs: 400 }).catch(() => undefined);
  }

  override async exit(): Promise<void> {
    if (this.exitTimeout !== null) { clearTimeout(this.exitTimeout); this.exitTimeout = null; }
    this.unbindPointer();
    audioManager.stopMusic(250);
    this.juice.destroy();
  }

  // Coracao da fase: roda uma vez por frame. "dt" e o delta time (segundos desde
  // o frame anterior), limitado a 1/30 para a fisica nao "saltar" num travamento.
  override update(dt: number): void {
    const capped = Math.min(dt, 1 / 30);
    this.juice.update(capped);
    if (this.runEnded) return;
    if (GameState.current_state !== RunState.PLAYING) return;
    this.pulse += capped;
    this.damageFlash = Math.max(0, this.damageFlash - capped * 3);
    // Cronometro chegou a zero -> a run termina como sucesso (deposita os sinais).
    this.runTimer -= capped;
    if (this.runTimer <= 0) {
      this.runTimer = 0;
      this.endRun(true);
      return;
    }

    // Gera recapturadores em intervalos que vao encurtando conforme o tempo passa.
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
    // Praça portuguesa — faint diagonal mosaic paving.
    for (let gx = -40; gx < VW; gx += 26) {
      this.bg.moveTo(gx, 60).lineTo(gx - 50, VH).stroke({ color: 0x12121c, width: 1, alpha: 0.3 });
    }
    // Dry central fountain (CORE preserves "aesthetic civic infrastructure").
    this.bg.circle(VW / 2, 430, 34).stroke({ color: 0x2a2a3a, width: 2, alpha: 0.5 });
    this.bg.circle(VW / 2, 430, 20).stroke({ color: 0x2a2a3a, width: 1.5, alpha: 0.4 });
    // The inauguration stage at the far end — where Paulo stood, five years ago.
    this.bg.rect(VW / 2 - 70, 70, 140, 24).fill({ color: 0x0a0a14, alpha: 0.7 })
      .rect(VW / 2 - 70, 70, 140, 24).stroke({ color: 0x2a2a3a, width: 1, alpha: 0.4 });
    this.content.addChild(this.bg, this.zoneG, this.warningLabels, this.recapG, this.playerG);
    this.root.addChild(this.content);
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

    // Give-up button — Field has no in-world exit tile (unlike Sacrifice), so
    // offer an explicit bail-to-hub. Ends the run as a defeat (no deposit).
    const quitBtn = new Text({ text: '✕ SAIR', style: { fontFamily: FontFamily.mono, fontSize: 13, fill: 0xff8080, fontWeight: '700' } });
    quitBtn.anchor.set(1, 0);
    quitBtn.x = VW - 10;
    quitBtn.y = 15;
    quitBtn.eventMode = 'static';
    quitBtn.cursor = 'pointer';
    // Padded hit area for a reliable touch target (~60px wide).
    quitBtn.hitArea = new Rectangle(-quitBtn.width - 16, -10, quitBtn.width + 32, quitBtn.height + 20);
    quitBtn.on('pointertap', () => { if (!this.runEnded) this.endRun(false); });
    this.hudLayer.addChild(quitBtn);
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

  // Escolhe a zona "mais valiosa" como alvo de um recapturador: ele prioriza
  // zonas que rendem mais sinais e que ja estao capturadas (vale o dobro retomar).
  private findTarget(rec: Recapturer): void {
    let bestScore = -1, bestIdx = -1;
    for (let i = 0; i < this.zones.length; i++) {
      const z = this.zones[i]!;
      if (z.bar <= 0) continue; // zonas zeradas nao interessam (nada a retomar)
      const score = z.signalRate * (z.state === 'captured' ? 2 : 1) + z.bar;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    rec.targetZone = bestIdx;
  }

  // Move cada recapturador rumo a zona-alvo. Ao chegar, escolhe um novo alvo.
  // Recapturadores mortos sao removidos e dao sinais de recompensa.
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
      const rec = this.recapturers[toRemove[i]!];
      if (rec) this.juice.pop(rec.pos.x, rec.pos.y, 0xffa040);
      this.recapturers.splice(toRemove[i]!, 1);
      this.signalsAcc += KILL_REWARD;
    }
  }

  // Esquadroes maiores "cobrem" um raio um pouco maior ao capturar zonas.
  private squadCoverage(): number {
    return (this.squadSize - 1) * 10;
  }

  // Nucleo da fase: para cada zona, decide o que acontece com a barra de captura
  // de acordo com quem esta dentro (so voce, so inimigos, os dois, ou ninguem),
  // resolve a luta na disputa e soma os sinais gerados pelas zonas que voce segura.
  private updateZones(dt: number): void {
    let totalRecapturerDps = 0;
    let zonesCaptured = 0;
    for (const z of this.zones) {
      const wasCaptured = z.bar >= 1; // estava capturada antes deste frame?
      const dx = this.playerPos.x - z.center.x;
      const dy = this.playerPos.y - z.center.y;
      const playerIn = Math.hypot(dx, dy) < z.radius + this.squadCoverage();
      // Conta quantos recapturadores vivos estao dentro desta zona.
      let recapsIn = 0;
      for (const rec of this.recapturers) {
        if (!rec.alive) continue;
        if (Math.hypot(rec.pos.x - z.center.x, rec.pos.y - z.center.y) < z.radius) recapsIn++;
      }
      if (playerIn && recapsIn === 0) {
        // So voce na zona: a barra sobe ate capturar.
        if (z.bar < 1) {
          z.state = 'capturing';
          z.bar = Math.min(1, z.bar + z.captureRate * dt);
        } else {
          z.state = 'captured';
        }
      } else if (playerIn && recapsIn > 0) {
        // Disputa: voce e inimigos juntos. A barra cai devagar e rola a luta —
        // o dano do esquadrao e dividido igualmente entre os inimigos presentes.
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
        // So inimigos na zona: eles retomam (a barra cai); se zera, vira neutra.
        z.state = 'losing';
        z.bar = Math.max(0, z.bar - z.captureRate * DECAY_MULT * dt);
        if (z.bar <= 0) z.state = 'neutral';
      } else {
        // Ninguem na zona: ela so fica como esta (capturada ou neutra).
        z.state = z.bar >= 1 ? 'captured' : 'neutral';
      }
      // Acabou de capturar agora? Toca o efeito comemorativo (uma vez so).
      if (z.bar >= 1 && !wasCaptured) {
        this.juice.pop(z.center.x, z.center.y);
        this.juice.flash(undefined, 0.10, 0.2);
        this.juice.shockwave(undefined, 0.45);
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
      this.juice.edges(0xff2f3d, 0.05);
      this.juice.shake(0.02);
      if (this.squadHp <= 0) {
        this.squadHp = 0;
        this.endRun(false);
      }
    }
  }

  // Multiplicador de "dominancia": segurar mais zonas ao mesmo tempo rende mais
  // sinais por segundo (recompensa por dominar boa parte da praca).
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

  // Redesenha a fase a cada frame: as zonas (com barra de captura, antena de
  // rele e taxa de sinais), os recapturadores com sua vida, e o esquadrao.
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
      // FLOW relay antenna at the point — glows once the mycelial tap completes.
      const lit = z.bar >= 1;
      const ax = z.center.x;
      const ay = z.center.y;
      this.zoneG.moveTo(ax, ay - 4).lineTo(ax, ay - 24).stroke({ color: lit ? col : 0x556070, width: 2, alpha: 0.85 });
      this.zoneG.moveTo(ax - 6, ay - 17).lineTo(ax + 6, ay - 17).stroke({ color: lit ? col : 0x556070, width: 1.5, alpha: 0.7 });
      if (lit) this.zoneG.circle(ax, ay - 26, 7).fill({ color: col, alpha: 0.16 });
      this.zoneG.circle(ax, ay - 26, lit ? 3 : 2).fill({ color: lit ? col : 0x99a0b0, alpha: lit ? 0.95 : 0.6 });
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

  // Encerra a run: toca o efeito de vitoria/derrota, deposita os sinais se venceu,
  // mostra o overlay final e volta ao bunker depois de uns instantes.
  private endRun(victory: boolean): void {
    if (this.runEnded) return;
    this.runEnded = true;
    this.victory = victory;
    if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
    if (victory) HubState.depositFlow('sinais_controle', Math.floor(this.signalsAcc));
    HubState.onRunEnded(victory);
    GameState.endRun(victory);
    this.showEndOverlay();
    this.exitTimeout = setTimeout(() => { void sceneManager.replace(new HubScene()); }, 2500);
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
        text: `+ ${Math.floor(this.signalsAcc)} Sinais de Controle — relés interceptados`,
        style: { fontFamily: FontFamily.body, fontSize: 18, fill: 0x80bfff, fontWeight: '600' },
      });
      sub.anchor.set(0.5);
      sub.x = VW / 2;
      sub.y = VH * 0.45 + 36;
      this.endOverlay.addChild(sub);
    } else {
      // Voz de Dr. Myco — diagnóstico, não consolação.
      const sub = new Text({
        text: 'O próximo desenho vai ser mais exato.',
        style: { fontFamily: FontFamily.body, fontSize: 16, fill: 0xc7b8a0, fontStyle: 'italic' },
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
