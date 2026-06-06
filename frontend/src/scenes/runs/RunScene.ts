import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { Scene } from '../../core/Scene';
import { HubState } from '../../state/HubState';
import type { ZoneData } from '../../state/Zones';
import { RunJuice } from '../../run/fx/RunJuice';
import { buildHud, buildEndOverlay, type RunHud } from './RunFrame';

/** Delta máximo passado à lógica de update. Evita "spiral of death" ao voltar
 *  de uma aba em segundo plano. */
const MAX_DT = 1 / 30;

/**
 * Base abstrata para toda cena de run (zona).
 *
 * Responsabilidades da subclasse:
 *   - Declarar `protected readonly zone: ZoneData`.
 *   - Implementar `onEnter()` — montar só o conteúdo do mundo.
 *   - Implementar `onUpdate(dt)` — lógica de jogo; `dt` já vem limitado.
 *   - Opcionalmente sobrescrever `onExit()` — liberar recursos não-canvas.
 *   - Chamar `this.endRun(victory, opts?)` quando a run termina.
 *
 * A base cuida de: limitar o delta, juice.update(), iniciar/parar música,
 * montar o HUD, o overlay de fim de run e o bookkeeping do HubState.
 */
export abstract class RunScene extends Scene {
  protected abstract readonly zone: ZoneData;

  protected hud!: RunHud;
  protected juice!: RunJuice;
  protected ended = false;

  // ── Ciclo de vida ─────────────────────────────────────────────────────────

  override async enter(): Promise<void> {
    this.juice = this.buildJuice();
    this.hud = buildHud(this.zone);
    this.root.addChild(this.hud.container);
    this.startMusic();
    await this.onEnter();
  }

  override exit(): void {
    this.onExit();
    this.juice.destroy();
    audioManager.stopMusic(300);
  }

  override update(dt: number): void {
    const d = Math.min(dt, MAX_DT);
    this.juice.update(d);
    if (this.ended) return;
    this.onUpdate(d);
  }

  // ── Hooks abstratos ────────────────────────────────────────────────────────

  /** Monta o conteúdo específico da cena (nós do mundo, entidades, timers).
   *  Chamado uma vez, depois que o HUD e o juice compartilhados foram criados. */
  protected abstract onEnter(): Promise<void> | void;

  /** Lógica de jogo por frame. `dt` já está limitado a MAX_DT e a base já
   *  retornou cedo se `this.ended`. */
  protected abstract onUpdate(dt: number): void;

  /** Libera recursos específicos da cena (listeners de input, etc.).
   *  Chamado ANTES de juice.destroy() e audioManager.stopMusic(). */
  protected onExit(): void { /* override opcional */ }

  // ── Helpers compartilhados ──────────────────────────────────────────────────

  /** Chame quando a run conclui (vitória ou derrota). Dispara o feedback de
   *  juice, o bookkeeping do HubState e o overlay de fim. */
  protected endRun(victory: boolean, opts?: { rewardLabel?: string; failLabel?: string }): void {
    if (this.ended) return;
    this.ended = true;
    if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
    HubState.onRunEnded(victory);
    // Vitória pode revelar um fragmento de lore desta zona (lido depois no
    // Arquivo do hub). O id da cena 'main' (Hordas) mapeia para a lore 'hordas'.
    if (victory) {
      HubState.discoverFragmentForZone(this.zone.scene === 'main' ? 'hordas' : this.zone.scene);
    }
    this.root.addChild(buildEndOverlay({
      zone: this.zone,
      victory,
      rewardLabel: opts?.rewardLabel,
      failLabel: opts?.failLabel,
    }));
  }

  /** Sobrescreva para passar um shakeTarget custom ou outro nível de ambiente.
   *  Padrão: sem shakeTarget, ambient 24. */
  protected buildJuice(): RunJuice {
    return new RunJuice(this.root, {
      accent: this.accentHex(),
      shakeTarget: null,
      ambient: 24,
    });
  }

  /** Converte o accent RGBA da zona num número hex do PixiJS. */
  protected accentHex(): number {
    return Color.hex(this.zone.accent_color);
  }

  /**
   * Registra os eventos de pointer no canvas e devolve uma função de cleanup.
   * Substitui o boilerplate de bindPointer() + toLocal() de cada cena.
   *
   * @returns função que remove todos os listeners; chame em onExit().
   */
  protected bindPointerEvents(
    onDown: (pos: { x: number; y: number }, e: PointerEvent) => void,
    onMove: (pos: { x: number; y: number }, e: PointerEvent) => void,
    onUp: (e: PointerEvent) => void,
  ): () => void {
    const canvas = this.app.pixi.canvas;
    let isDown = false;

    const toLocal = (e: PointerEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const scale = this.app.world.scale.x || 1;
      return {
        x: (e.clientX - rect.left - this.app.world.x) / scale,
        y: (e.clientY - rect.top - this.app.world.y) / scale,
      };
    };

    const handleDown = (e: PointerEvent): void => { isDown = true; onDown(toLocal(e), e); };
    const handleMove = (e: PointerEvent): void => { if (isDown) onMove(toLocal(e), e); };
    const handleUp = (e: PointerEvent): void => { isDown = false; onUp(e); };

    canvas.addEventListener('pointerdown', handleDown);
    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('pointerup', handleUp);
    canvas.addEventListener('pointercancel', handleUp);

    return (): void => {
      canvas.removeEventListener('pointerdown', handleDown);
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('pointerup', handleUp);
      canvas.removeEventListener('pointercancel', handleUp);
    };
  }

  // ── Interno ──────────────────────────────────────────────────────────────

  private startMusic(): void {
    if (!this.zone.music) return;
    audioManager.playMusic(this.zone.music, {
      loop: true, volume: 0.3, fadeMs: 400,
    }).catch(() => undefined);
  }
}
