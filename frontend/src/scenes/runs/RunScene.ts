import { Container, Graphics, Text } from 'pixi.js';
import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { Scene } from '../../core/Scene';
import { FontFamily } from '../../core/typography';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
import type { ZoneData } from '../../state/Zones';
import { RunJuice } from '../../run/fx/RunJuice';
import { buildHud, buildEndOverlay, type RunHud } from './RunFrame';

/** Delta máximo passado à lógica de update. Evita "spiral of death" ao voltar
 *  de uma aba em segundo plano. */
const MAX_DT = 1 / 30;

/** Dica curta de "o que mover significa" por zona (scene id) — mostrada uma vez
 *  num cartão ao entrar pela primeira vez (onboarding, ver UX). */
const MOVE_HINT: Record<string, string> = {
  main: 'Arraste para mover. As armas disparam sozinhas — pare sobre os nódulos para colher (e fica exposto).',
  stealth: 'Arraste para mover. Coma as bolhas menores e fuja das maiores. Quanto maior, mais lento.',
  circuit: 'Arraste — a cabeça segue o dedo. O rastro cresce a cada relé; encostar nele te mata.',
  extraction: 'Arraste para cavar. Empurre pedras de lado; elas caem se você tirar o chão de baixo.',
  field: 'Arraste o esquadrão. Fique nas zonas para capturá-las e segure contra os recapturadores.',
  infection: 'Arraste para mover. Coma as pastilhas e fuja dos drones; o power inverte os papéis.',
  maze: 'Arraste para empurrar os fragmentos até os receptores. Só empurra — nunca puxa.',
  sacrifice: 'Arraste o esquadrão. Cada câmara cobra um preço ao entrar; o tile EXIT encerra a run.',
  cordilheira: 'Arraste para cima para pular faixas, para os lados para deslizar. Não pare na pista.',
  torres: 'Arraste para escalar a torre pelas escadas. Desvie dos barris que rolam e caem.',
  catedral: 'Toque um degrau vizinho para pular e acendê-lo. Acenda todos; fuja das sondas que descem.',
};

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
    // Onboarding: na 1ª vez nesta zona, mostra o cartão de "o que mover significa".
    if (!HubState.isZoneIntroduced(this.zone.scene)) {
      HubState.markZoneIntroduced(this.zone.scene);
      this.showIntroCard();
    }
  }

  /** Cartão de ensino de movimento (uma vez por zona). Overlay não-bloqueante
   *  que aparece, segura ~2s e some — o gameplay roda por baixo. */
  private showIntroCard(): void {
    const hint = MOVE_HINT[this.zone.scene];
    if (!hint) return;
    const VW = GameConfig.VIEWPORT_WIDTH;
    const VH = GameConfig.VIEWPORT_HEIGHT;
    const accent = this.accentHex();
    const w = VW - 48;
    const card = new Container();
    card.zIndex = 200;
    const title = new Text({
      text: this.zone.zone_name,
      style: { fontFamily: FontFamily.display, fontSize: 20, fontWeight: '700', fill: accent, letterSpacing: 2, align: 'center' },
    });
    title.anchor.set(0.5, 0);
    title.y = 0;
    const body = new Text({
      text: hint,
      style: { fontFamily: FontFamily.body, fontSize: 13, fill: 0xe8e2d0, align: 'center', wordWrap: true, wordWrapWidth: w - 32 },
    });
    body.anchor.set(0.5, 0);
    body.y = 30;
    const innerH = 30 + body.height;
    const bg = new Graphics();
    bg.roundRect(-w / 2, -16, w, innerH + 32, 10).fill({ color: 0x0a100c, alpha: 0.92 }).stroke({ color: accent, width: 1.5, alpha: 0.7 });
    card.addChild(bg, title, body);
    card.x = VW / 2;
    card.y = VH * 0.46 - innerH / 2;
    card.alpha = 0;
    this.root.addChild(card);
    const start = performance.now();
    const tick = (): void => {
      if (card.destroyed) return;
      const e = performance.now() - start;
      card.alpha = e < 300 ? e / 300 : e > 2200 ? Math.max(0, 1 - (e - 2200) / 600) : 1;
      if (e >= 2800) { card.destroy({ children: true }); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
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
