import { Graphics, Text } from 'pixi.js';
import { Modal } from '../Modal';
import { PixiButton } from '../PixiButton';
import { Color } from '../../core/Color';
import { FontFamily } from '../../core/typography';
import { GameConfig } from '../../state/GameConfig';
import { HubState, ROCKET_RECIPE } from '../../state/HubState';
import { CharacterRegistry } from '../../state/CharacterRegistry';
import { audioManager } from '../../core/AudioManager';
import { audioSettings } from '../../state/AudioSettings';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;

// Procedural launch-sequence colours (paleta de evento — só aqui).
// Spec: design/art/launch-sequence-art-spec.md §2.2.
const C_BIOLUM = Color.hex(Color.rgb(0.78, 0.94, 0.48)); // #C8F07A esporo em ignição
const C_SPORE = Color.hex(Color.rgb(0.56, 0.83, 0.31));  // #8FD44E verde fungal
const C_HIFA = Color.hex(Color.rgb(0.96, 0.64, 0.29));   // #F5A449 hifa em combustão
const C_CORE = Color.hex(Color.rgb(1.0, 0.87, 0.53));    // #FFDD88 núcleo de micélio
const C_PURPLE = Color.hex(Color.rgb(0.72, 0.48, 0.86)); // #B87ADB cone/esporo
const C_CYAN = Color.hex(Color.rgb(0.30, 0.79, 0.77));   // #4DC9C4 corpo / vital
const C_OUTLINE = Color.hex(Color.rgb(0.05, 0.03, 0.02));

const COUNTDOWN_END = 800;
const IGNITION_END = 1400;
const ASCEND_END = 4000;
/** Batida de pausa (silêncio visual) entre o foguete sumir e o painel entrar. */
const HOLD_MS = 500;
const REVEAL_AT = ASCEND_END + HOLD_MS;
const REVEAL_MS = 600;

interface Spore { x: number; y: number; vx: number; vy: number; alpha: number; color: number }

/**
 * Victory screen + procedural launch sequence shown when the player launches
 * the completed bio-rocket. Four phases over ~5s (the emotional peak — not a
 * loading screen): countdown → ignition → ascension → victory panel.
 * Emits `newCycle` via the reset on the Novo Ciclo button.
 */
export class RocketLaunchOverlay extends Modal {
  private elapsedMs = 0;
  private lastMs = 0;
  private animationFrame = 0;
  private fx = new Graphics();
  private spores: Spore[] = [];
  private spawnAcc = 0;
  private revealed = false;
  private readonly restCenterY = VH * 0.5;
  private readonly reducedMotion =
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    super(340, 420);
    this.backdropAlpha = 0.92;
    this.drawPanelBg(C_HIFA);
    // Full-screen FX layer sits above the backdrop, below the centred panel.
    this.addChildAt(this.fx, this.getChildIndex(this.panel));
    this.buildContent();
    // Do NOT call animateOpen() — the victory panel stays hidden until phase 3.
    // (visible:false also blocks blind taps on the invisible Novo Ciclo button.)
    this.panel.visible = false;
    // Áudio do clímax: música do hub abaixa, o rumble da decolagem assume.
    audioManager.setMusicVolume(audioSettings.muted ? 0 : audioSettings.music * 0.15);
    audioManager.playSfx('res://assets/audio/sfx/game/launch.wav', 1.0);
    this.startAnimation();
  }

  override async requestClose(): Promise<void> {
    cancelAnimationFrame(this.animationFrame);
    // Restaura o volume de música escolhido pelo jogador.
    audioManager.setMusicVolume(audioSettings.muted ? 0 : audioSettings.music);
    await super.requestClose();
  }

  private startAnimation(): void {
    const start = performance.now();
    this.lastMs = 0;
    const tick = (): void => {
      if (this.destroyed) return;
      this.elapsedMs = performance.now() - start;
      const dt = Math.min(0.05, (this.elapsedMs - this.lastMs) / 1000);
      this.lastMs = this.elapsedMs;
      this.backdrop.alpha = Math.min(this.backdropAlpha, (this.elapsedMs / 250) * this.backdropAlpha);
      this.updateSpores(dt);
      this.applyShake();
      this.draw();
      if (this.elapsedMs >= REVEAL_AT) this.revealPanel();
      this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  /**
   * Tremor de tela do lançamento: cresce na ignição, decai conforme o foguete
   * se afasta. Só mexe na camada de FX — o painel de vitória fica firme.
   * Respeita prefers-reduced-motion.
   */
  private applyShake(): void {
    if (this.reducedMotion) return;
    const t = this.elapsedMs;
    let mag = 0;
    if (t >= COUNTDOWN_END && t < IGNITION_END) {
      mag = 7 * ((t - COUNTDOWN_END) / (IGNITION_END - COUNTDOWN_END));
    } else if (t >= IGNITION_END && t < ASCEND_END) {
      mag = 6 * (1 - (t - IGNITION_END) / (ASCEND_END - IGNITION_END));
    }
    this.fx.position.set((Math.random() - 0.5) * 2 * mag, (Math.random() - 0.5) * 2 * mag);
  }

  /** Rocket-seed vertical centre at the current time (screen coords). */
  private rocketCenterY(): number {
    if (this.elapsedMs < IGNITION_END) return this.restCenterY;
    const t = Math.min(1, (this.elapsedMs - IGNITION_END) / (ASCEND_END - IGNITION_END));
    return this.restCenterY - Math.pow(t, 2) * (this.restCenterY + 240);
  }

  private updateSpores(dt: number): void {
    // Emit a leque of spores from the engine base during ascension.
    if (this.elapsedMs >= IGNITION_END && this.elapsedMs < ASCEND_END) {
      this.spawnAcc += dt;
      const baseY = this.rocketCenterY() + 46;
      while (this.spawnAcc >= 0.04) {
        this.spawnAcc -= 0.04;
        this.spores.push({
          x: VW / 2 + (Math.random() - 0.5) * 24,
          y: baseY,
          vx: (Math.random() - 0.5) * 40,
          vy: -10 - Math.random() * 30,
          alpha: 1,
          color: Math.random() < 0.5 ? C_BIOLUM : C_PURPLE,
        });
      }
    }
    for (const s of this.spores) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.alpha -= dt / 1.2;
    }
    this.spores = this.spores.filter((s) => s.alpha > 0);
  }

  private draw(): void {
    const g = this.fx;
    g.clear();
    const cx = VW / 2;
    const t = this.elapsedMs;
    const cy = this.rocketCenterY();
    const baseY = cy + 46;

    // Floating spores (under the rocket).
    for (const s of this.spores) {
      g.circle(s.x, s.y, 2).fill({ color: s.color, alpha: Math.max(0, s.alpha) * 0.9 });
    }

    // Phase 0 — Countdown: three biolum halo pulses at the base.
    if (t < COUNTDOWN_END) {
      const p = (t % 250) / 250;
      g.circle(cx, baseY, 8 + 16 * p).stroke({ color: C_BIOLUM, width: 2, alpha: 0.9 * (1 - p) });
    }

    // Phase 1 — Ignition: three concentric mycelium burst rings.
    if (t >= COUNTDOWN_END && t < IGNITION_END) {
      const p = (t - COUNTDOWN_END) / (IGNITION_END - COUNTDOWN_END);
      g.circle(cx, baseY, 24 + p * 30).fill({ color: C_BIOLUM, alpha: 0.45 * (1 - p) });
      g.circle(cx, baseY, 12 + p * 16).fill({ color: C_HIFA, alpha: 0.7 * (1 - p) });
      g.circle(cx, baseY, 4 + p * 4).fill({ color: C_CORE, alpha: 1 - p });
    }

    // Liftoff flash: um pulso quente de tela cheia no instante da decolagem.
    if (t >= IGNITION_END && t < IGNITION_END + 250) {
      const p = (t - IGNITION_END) / 250;
      g.rect(0, 0, VW, VH).fill({ color: C_CORE, alpha: 0.5 * (1 - p) });
    }

    // Speed streaks na subida: o mundo passando pelo foguete.
    if (t >= IGNITION_END && t < ASCEND_END) {
      const p = (t - IGNITION_END) / (ASCEND_END - IGNITION_END);
      for (let i = 0; i < 14; i++) {
        const sx = (i * 73.3 + 11) % VW;
        const speed = 300 + (i % 5) * 160;
        const sy = ((i * 191 + t * 0.001 * speed * (0.3 + p)) % (VH + 80)) - 40;
        const len = 26 + (i % 4) * 14;
        g.moveTo(sx, sy).lineTo(sx, sy + len)
          .stroke({ color: i % 3 === 0 ? C_SPORE : C_CYAN, width: 1.5, alpha: 0.14 * Math.min(1, p * 3) });
      }
    }

    // Phase 2 — Ascension: mycelium trail behind the rising rocket.
    if (t >= IGNITION_END && t < ASCEND_END) {
      for (let i = 0; i < 8; i++) {
        const ty = baseY + i * 26;
        if (ty > this.restCenterY + 60) break;
        const wob = Math.sin(t * 0.01 + i) * 3;
        g.circle(cx + wob, ty, 3 - i * 0.25).fill({ color: C_SPORE, alpha: 0.35 * (1 - i / 8) });
      }
    }

    // The rocket-seed itself — drawn until it leaves the top of the screen.
    if (cy > -120 && t < ASCEND_END) this.drawRocketSeed(g, cx, cy);
  }

  /** Draws the bio-rocket: cyan body, purple spore-cone, amber weld, green roots. */
  private drawRocketSeed(g: Graphics, cx: number, cy: number): void {
    const halfW = 13;
    const topBody = cy - 36;
    const botBody = cy + 40;
    // Engine glow / ignition under the rocket while ascending.
    if (this.elapsedMs >= COUNTDOWN_END) {
      const flick = 0.6 + 0.4 * Math.abs(Math.sin(this.elapsedMs * 0.02));
      g.circle(cx, botBody + 6, 10 * flick).fill({ color: C_CORE, alpha: 0.5 * flick });
      g.circle(cx, botBody + 12, 16 * flick).fill({ color: C_HIFA, alpha: 0.3 * flick });
    }
    // Roots / hifas at the base.
    for (let j = 0; j < 5; j++) {
      const rx = cx + (j - 2) * 5;
      g.moveTo(rx, botBody).lineTo(rx + Math.sin(j + this.elapsedMs * 0.005) * 3, botBody + 12)
        .stroke({ color: j % 2 === 0 ? C_HIFA : C_SPORE, width: 2, alpha: 0.85 });
    }
    // Fins.
    g.poly([cx - halfW, botBody - 6, cx - halfW - 9, botBody + 6, cx - halfW, botBody]).fill({ color: C_HIFA, alpha: 0.9 });
    g.poly([cx + halfW, botBody - 6, cx + halfW + 9, botBody + 6, cx + halfW, botBody]).fill({ color: C_HIFA, alpha: 0.9 });
    // Body.
    g.rect(cx - halfW, topBody, halfW * 2, botBody - topBody).fill({ color: C_CYAN }).stroke({ color: C_OUTLINE, width: 1.5 });
    // Spore-cone (nose).
    g.poly([cx, cy - 64, cx + halfW, topBody + 4, cx - halfW, topBody + 4]).fill({ color: C_PURPLE }).stroke({ color: C_OUTLINE, width: 1.5 });
    // Breathing biolum halo (the seed is alive).
    const breathe = 0.12 + 0.1 * Math.sin(this.elapsedMs * 0.004);
    g.circle(cx, cy, 40).stroke({ color: C_BIOLUM, width: 2, alpha: breathe });
  }

  /** Fades the victory panel in once the rocket has cleared the screen. */
  private revealPanel(): void {
    this.panel.visible = true;
    const k = Math.min(1, (this.elapsedMs - REVEAL_AT) / REVEAL_MS);
    this.panel.alpha = k;
    this.panel.scale.set(0.9 + 0.1 * k);
    if (!this.revealed && k >= 1) this.revealed = true;
  }

  private buildContent(): void {
    const halfH = this.panelH / 2;
    const padding = 18;
    const ink = Color.hex(Color.rgb(0.85, 0.78, 0.60));
    const amber = C_HIFA;

    // O final depende do estado de confiança dos personagens (narrative-arc.md).
    const ending = CharacterRegistry.getEnding();
    const ENDINGS = {
      A: { tag: 'Final A — Lançamento', title: 'GERMINAÇÃO', color: amber,
           flavor: 'Dr. Myco: "Desta vez, vamos construir algo que fica melhor com a gente dentro."' },
      B: { tag: 'Final B — Desligamento', title: 'SILÊNCIO', color: C_CYAN,
           flavor: 'Dr. Myco: "Então recomeçamos aqui."' },
      C: { tag: 'Final C — Reprogramação', title: 'REPROGRAMAÇÃO', color: Color.hex(Color.rgb(0.56, 0.83, 0.31)),
           flavor: 'Lena: "Ela não odeia a gente. Ela só não sabia que a gente importava."' },
    } as const;
    const end = ENDINGS[ending];

    const title = new Text({
      text: end.title,
      style: { fontFamily: FontFamily.display, fontSize: 26, fontWeight: '700', fill: end.color, align: 'center', letterSpacing: 3 },
    });
    title.anchor.set(0.5, 0);
    title.y = -halfH + 60;
    this.panel.addChild(title);

    const flavor = new Text({
      text: end.flavor,
      style: { fontFamily: FontFamily.body, fontSize: 11, fill: C_CYAN, align: 'center', fontStyle: 'italic', wordWrap: true, wordWrapWidth: this.panelW - padding * 2 },
    });
    flavor.anchor.set(0.5, 0);
    flavor.y = -halfH + 104;
    this.panel.addChild(flavor);

    const survivors = HubState.rescued_characters.length;
    const summary = new Text({
      text: [
        end.tag,
        `Peças germinadas    ${ROCKET_RECIPE.length} / ${ROCKET_RECIPE.length}`,
        `Raides realizadas    ${HubState.total_runs}`,
        `Sobreviventes a bordo ${survivors}`,
      ].join('\n'),
      style: { fontFamily: FontFamily.mono, fontSize: 13, fill: ink, align: 'center', lineHeight: 22 },
    });
    summary.anchor.set(0.5, 0);
    summary.y = -halfH + 168;
    this.panel.addChild(summary);

    const newCycle = new PixiButton({
      label: 'Novo Ciclo',
      width: 160,
      height: 40,
      fill: 0x4a2f12,
      hoverFill: 0x6b431a,
      onClick: () => {
        HubState.resetForNewCycle();
        void this.requestClose();
      },
    });
    newCycle.x = -80;
    newCycle.y = halfH - padding - 40;
    this.panel.addChild(newCycle);
  }
}
