/*
 * DragController — transforma o arrastar do dedo/mouse em movimento da party.
 *
 * O que faz: enquanto o jogador arrasta sobre o canvas, ele empurra o "anchor"
 * (ponto-âncora) da party pela arena. Os personagens seguem esse anchor em
 * formação. Também detecta quando a party fica parada por um tempo, o que
 * ativa o "Siege Mode" (modo cerco, um bônus do poder).
 *
 * Como se encaixa: criado pela cena da run; recebe a App (para o canvas e a
 * escala da tela) e a Party. A cena chama update(dt) todo frame.
 */
import type { App } from '../core/App';
import type { Party } from './Party';
import { GameConfig } from '../state/GameConfig';
import { GameState } from '../state/GameState';

/** Converte eventos de ponteiro/toque em movimento do anchor da party.
 *  Os deslocamentos do ponteiro (em pixels de tela) são divididos pela escala
 *  do mundo (App.world.scale) para o movimento parecer 1:1 mesmo quando a
 *  janela tem bordas pretas (letterboxing). */
export class DragController {
  private app: App;
  private party: Party;
  private dragActive = false;
  /** Para onde queremos levar o anchor; o anchor "persegue" este alvo suavemente. */
  private moveTarget = { x: 0, y: 0 };
  /** Quanto tempo a party está praticamente parada (para o Siege Mode). */
  private stillnessTimer = 0;
  private lastX = 0;
  private lastY = 0;
  /** Abaixo deste deslocamento por frame, consideramos a party "parada". */
  private static MOVE_THRESHOLD = 3;

  // Funções-ouvinte (listeners) guardadas em campos para poder removê-las depois.
  private onDown = (e: PointerEvent): void => this.handleDown(e);
  private onMove = (e: PointerEvent): void => this.handleMove(e);
  private onUp = (e: PointerEvent): void => this.handleUp(e);

  constructor(app: App, party: Party) {
    this.app = app;
    this.party = party;
    this.moveTarget = { ...party.anchor };
    const c = app.pixi.canvas;
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onUp);
    c.addEventListener('pointerleave', this.onUp);
  }

  /** Remove os listeners do canvas. Chamar ao sair da cena para evitar
   *  vazamento de memória e cliques fantasmas. */
  destroy(): void {
    const c = this.app.pixi.canvas;
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('pointermove', this.onMove);
    c.removeEventListener('pointerup', this.onUp);
    c.removeEventListener('pointercancel', this.onUp);
    c.removeEventListener('pointerleave', this.onUp);
  }

  /** Só permite controlar a party durante o jogo de fato (não em menus/pausa). */
  private isPlaying(): boolean {
    const s = GameState.current_state;
    return s === 'PLAYING' || s === 'BOSS_FIGHT';
  }

  private handleDown(_e: PointerEvent): void {
    if (!this.isPlaying()) return;
    this.dragActive = true;
    // Começa o arraste a partir da posição atual da party.
    this.moveTarget = { ...this.party.anchor };
  }

  private handleMove(e: PointerEvent): void {
    if (!this.dragActive || !this.isPlaying()) return;
    // Divide o deslocamento do dedo pela escala para manter o movimento 1:1.
    const scale = this.app.world.scale.x || 1;
    this.moveTarget.x += e.movementX / scale;
    this.moveTarget.y += e.movementY / scale;
  }

  private handleUp(_e: PointerEvent): void {
    this.dragActive = false;
  }

  /** Roda todo frame: aproxima o anchor do alvo e cuida do Siege Mode. */
  update(dt: number): void {
    // Fora do jogo (ou sem arraste ativo), o alvo acompanha o anchor atual
    // para não dar um "salto" quando o jogo voltar.
    if (!this.isPlaying()) {
      if (!this.dragActive) this.moveTarget = { ...this.party.anchor };
      return;
    }

    if (!this.dragActive) this.moveTarget = { ...this.party.anchor };

    // Mantém o alvo dentro da arena (com uma margem de 40px das bordas).
    this.moveTarget.x = Math.max(40, Math.min(GameConfig.ARENA_WIDTH - 40, this.moveTarget.x));
    this.moveTarget.y = Math.max(40, Math.min(GameConfig.ARENA_HEIGHT - 40, this.moveTarget.y));

    // Lerp (interpolação linear): a cada frame o anchor anda uma fração "t" da
    // distância até o alvo. Isso dá um movimento suave em vez de teleporte.
    const t = Math.min(1, GameConfig.DRAG_LERP_FACTOR * dt);
    this.party.anchor.x += (this.moveTarget.x - this.party.anchor.x) * t;
    this.party.anchor.y += (this.moveTarget.y - this.party.anchor.y) * t;

    // Detecção de imobilidade (Siege Mode): mede o quanto a party se moveu desde
    // o último frame. O limite é ajustado por dt*60 para ser independente do FPS.
    const moved = Math.hypot(this.party.anchor.x - this.lastX, this.party.anchor.y - this.lastY);
    this.lastX = this.party.anchor.x;
    this.lastY = this.party.anchor.y;
    if (moved < DragController.MOVE_THRESHOLD * dt * 60) {
      this.stillnessTimer += dt;
      if (this.stillnessTimer >= GameConfig.SIEGE_MODE_STILLNESS_TIME) GameState.siege_mode_active = true;
    } else {
      // Mexeu: zera o cronômetro e desliga o modo cerco.
      this.stillnessTimer = 0;
      GameState.siege_mode_active = false;
    }
  }
}
