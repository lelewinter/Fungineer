/*
 * RunJuice — "kit completo" de game feel para as cenas de zona mais leves.
 *
 * Junta, atrás de uma API bem simples: o sistema de partículas (FXSystem), os
 * efeitos de tela cheia (ScreenFX: flash, pressão nas bordas, shockwave), um
 * tremor de tela próprio e som + vibração. Os "combos" de alto nível (pop,
 * hurt, jump, alarm, victoryFx, defeatFx) deixam cada momento do jogo a uma
 * linha de distância.
 *
 * Diferença para o Juice global (fx/Juice.ts): aquele só faz tremor/vibração e
 * é compartilhado; este é instanciado por cena e traz tudo embutido.
 */
import type { Container } from 'pixi.js';
import { GameConfig } from '../../state/GameConfig';
import { audioManager } from '../../core/AudioManager';
import { FXSystem, type BurstOpts } from './FXSystem';
import { ScreenFX } from './ScreenFX';

// VW/VH = largura/altura do viewport (a área visível da tela).
const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;

/** Configuração ao criar um RunJuice. */
export interface RunJuiceOpts {
  /** Cor de destaque da zona — tinge esporos de atmosfera, bursts e flashes. */
  accent: number;
  /** Quantidade de esporos de atmosfera. 0 desliga. */
  ambient?: number;
  /** Container que sofre o tremor de tela. Passe a camada de conteúdo do jogo
   *  (NÃO o root, para o overlay de efeitos / HUD ficarem firmes). */
  shakeTarget?: Container | null;
}

/**
 * Kit de game feel pronto para usar. Veja o bloco no topo do arquivo.
 *
 * Uso típico:
 *   this.juice = new RunJuice(this.root, { accent, shakeTarget: this.content });
 *   // no update():  this.juice.update(dt)
 *   // ao coletar:   this.juice.pop(x, y)
 *   // ao tomar dano: this.juice.hurt(x, y)
 *   // vitória/derrota: this.juice.victoryFx() / this.juice.defeatFx()
 *   // ao sair:       this.juice.destroy()
 */
export class RunJuice {
  readonly screenFx = new ScreenFX();
  private fx: FXSystem;
  private accent: number;
  private shakeTarget: Container | null;
  private baseX = 0;
  private baseY = 0;
  private trauma = 0;
  private reduced = false;

  constructor(root: Container, opts: RunJuiceOpts) {
    this.accent = opts.accent;
    this.shakeTarget = opts.shakeTarget ?? null;
    if (this.shakeTarget) {
      this.baseX = this.shakeTarget.x;
      this.baseY = this.shakeTarget.y;
    }
    root.sortableChildren = true;
    this.fx = new FXSystem(root, { w: VW, h: VH }, {
      ambient: opts.ambient ?? 34,
      cap: 240,
      ambientColor: opts.accent,
      zIndex: 40,
    });
    root.addChild(this.screenFx);
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  /** Roda todo frame: atualiza partículas, efeitos de tela e o tremor. */
  update(dt: number): void {
    this.fx.update(dt);
    this.screenFx.update(dt);
    this.applyShake(dt);
  }

  // ── Primitivos (efeitos isolados) ─────────────────────────────────────────
  burst(x: number, y: number, opts: BurstOpts = {}): void {
    this.fx.burst(x, y, { color: this.accent, ...opts });
  }

  flash(color: number = this.accent, alpha = 0.18, life = 0.18): void {
    this.screenFx.flash(color, alpha, life);
  }

  edges(color = 0xff2f3d, amount = 0.4): void {
    this.screenFx.edges(color, amount);
  }

  shockwave(color: number = this.accent, life = 0.5): void {
    this.screenFx.shockwave(color, life);
  }

  shake(amount: number, vibrateMs = 0): void {
    if (!this.reduced) this.trauma = Math.min(1, this.trauma + amount);
    if (vibrateMs > 0) this.vibrate(vibrateMs);
  }

  vibrate(ms: number): void {
    if (this.reduced) return;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    try { navigator.vibrate(Math.min(200, Math.max(5, Math.round(ms)))); } catch { /* ignore */ }
  }

  // ── Combos de alto nível (juntam vários primitivos por "momento") ─────────
  /** Coleta satisfatória / objetivo cumprido. */
  pop(x: number, y: number, color: number = this.accent): void {
    this.burst(x, y, {
      count: GameConfig.COLLECT_BURST_COUNT,
      color,
      speed: GameConfig.COLLECT_BURST_SPEED,
      life: GameConfig.COLLECT_BURST_LIFE,
      size: GameConfig.COLLECT_BURST_SIZE,
    });
    this.flash(color, GameConfig.COLLECT_FLASH_ALPHA, 0.14);
    this.shake(GameConfig.COLLECT_SHAKE_TRAUMA, GameConfig.COLLECT_SHAKE_VIBRATE_MS);
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_03.wav', GameConfig.COLLECT_SFX_VOLUME);
  }

  /** Jogador tomou dano / quase foi atingido. */
  hurt(x: number, y: number): void {
    this.edges(0xff2f3d, 0.5);
    this.flash(0xff2f3d, 0.22, 0.18);
    this.burst(x, y, { count: 14, color: 0xff5a60, speed: 180, life: 0.4, size: 2.4 });
    this.shake(0.4, 45);
    audioManager.playSfx('res://assets/audio/sfx/game/hit_01.wav', 0.6);
  }

  /** Pulinho / passo leve — o efeito típico das zonas só de movimento. */
  jump(x: number, y: number, color: number = this.accent): void {
    this.burst(x, y, { count: 6, color, speed: 90, life: 0.3, size: 2 });
    audioManager.playSfx('res://assets/audio/sfx/game/jump.wav', 0.4);
  }

  /** Momento pesado/alarmante (alarme, início de perseguição, perigo). */
  alarm(color = 0xff7a3c): void {
    this.edges(color, 0.6);
    this.flash(color, 0.2, 0.22);
    this.shockwave(color, 0.55);
    this.shake(0.45, 60);
    audioManager.playSfx('res://assets/audio/sfx/game/alarm.wav', 0.55);
  }

  victoryFx(): void {
    this.flash(this.accent, 0.26, 0.34);
    this.shockwave(this.accent, 0.6);
    this.burst(VW / 2, VH / 2, { count: 40, color: this.accent, speed: 240, life: 0.8, size: 3 });
    this.shake(0.3, 50);
    audioManager.playSfx('res://assets/audio/sfx/ui/Complete_01.wav', 0.8);
  }

  defeatFx(): void {
    this.edges(0xff2f3d, 1);
    this.flash(0xff2f3d, 0.32, 0.34);
    this.shake(0.55, 120);
    // O som "hit_02" é mais grave/pesado que o acerto comum do meio da run.
    audioManager.playSfx('res://assets/audio/sfx/game/hit_02.wav', 0.8);
  }

  /** Libera partículas e efeitos de tela. Chamar ao sair da cena. */
  destroy(): void {
    this.fx.destroy();
    this.screenFx.destroy();
  }

  /** Aplica o tremor ao shakeTarget. Mesma ideia do Juice global: trauma²
   *  desloca a camada e o trauma decai sozinho. */
  private applyShake(dt: number): void {
    if (!this.shakeTarget) return;
    if (this.trauma <= 0) {
      this.shakeTarget.x = this.baseX;
      this.shakeTarget.y = this.baseY;
      return;
    }
    const t2 = this.trauma * this.trauma;
    const max = 14; // deslocamento máximo do tremor, em pixels
    this.shakeTarget.x = this.baseX + (Math.random() * 2 - 1) * max * t2;
    this.shakeTarget.y = this.baseY + (Math.random() * 2 - 1) * max * t2;
    this.trauma = Math.max(0, this.trauma - 1.6 * dt);
  }
}
