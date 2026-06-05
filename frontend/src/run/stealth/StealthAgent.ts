/*
 * StealthAgent — o personagem solo da zona de furtividade (stealth).
 *
 * Ideia central: quanto MAIS RÁPIDO o jogador se move, MAIOR o "raio de som"
 * que ele emite (e mais fácil é ser detectado). Ficar dentro de áreas de sombra
 * (shadow rects, definidas pela cena) deixa o personagem escondido/escurecido.
 *
 * O controle é por arrastar (igual ao DragController da party), mas aqui move um
 * único personagem. A cena consulta getSpeed()/getSoundRadius()/isInShadow()
 * para decidir se os inimigos percebem o jogador.
 */
import { Container, Graphics } from 'pixi.js';
import type { App } from '../../core/App';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { GameState, RunState } from '../../state/GameState';
import type { Vec2 } from '../../core/types';

/** Uma área retangular de sombra onde o agente fica escondido. */
interface ShadowRect {
  x: number; y: number; w: number; h: number;
}

/** Infiltrador solo da zona de furtividade. A velocidade define o raio de som;
 *  as áreas de sombra (definidas pela cena) escurecem/escondem o personagem. */
export class StealthAgent {
  readonly node = new Container();
  position: Vec2 = { x: 0, y: 0 };

  private body = new Graphics();
  private soundRing = new Graphics();
  private moveTarget: Vec2 = { x: 0, y: 0 };
  private dragActive = false;
  /** Velocidade atual (calculada pela diferença de posição entre frames). */
  private velocity: Vec2 = { x: 0, y: 0 };
  private shadowRects: ShadowRect[] = [];
  /** Bloqueia o controle (ex.: quando um terminal de hack abre um puzzle). */
  private inputLocked = false;
  private app: App;

  private onDown = (e: PointerEvent): void => this.handleDown(e);
  private onMove = (e: PointerEvent): void => this.handleMove(e);
  private onUp = (e: PointerEvent): void => this.handleUp(e);

  constructor(app: App, start: Vec2) {
    this.app = app;
    this.position = { ...start };
    this.moveTarget = { ...start };
    this.node.addChild(this.soundRing);
    this.node.addChild(this.body);
    this.drawBody(false);

    const c = app.pixi.canvas;
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onUp);
  }

  /** Remove os listeners e libera os gráficos. Chamar ao sair da cena. */
  destroy(): void {
    const c = this.app.pixi.canvas;
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('pointermove', this.onMove);
    c.removeEventListener('pointerup', this.onUp);
    c.removeEventListener('pointercancel', this.onUp);
    this.node.destroy({ children: true });
  }

  /** Define as áreas de sombra do mapa (a cena passa isso). */
  setShadowRects(rects: ShadowRect[]): void {
    this.shadowRects = rects;
  }

  /** Chamado pelo HackTerminal quando um puzzle abre (trava o movimento). */
  setInputLocked(locked: boolean): void {
    this.inputLocked = locked;
    if (locked) {
      this.dragActive = false;
      this.moveTarget = { ...this.position };
    }
  }

  private isPlaying(): boolean {
    return GameState.current_state === RunState.PLAYING;
  }

  private handleDown(_e: PointerEvent): void {
    if (this.inputLocked || !this.isPlaying()) return;
    this.dragActive = true;
    this.moveTarget = { ...this.position };
  }

  private handleMove(e: PointerEvent): void {
    if (!this.dragActive || this.inputLocked || !this.isPlaying()) return;
    const scale = this.app.world.scale.x || 1;
    this.moveTarget.x += e.movementX / scale;
    this.moveTarget.y += e.movementY / scale;
  }

  private handleUp(_e: PointerEvent): void {
    this.dragActive = false;
  }

  /** Roda todo frame: move suavemente em direção ao alvo, calcula a velocidade
   *  e redesenha o corpo e o anel de som. */
  update(dt: number): void {
    if (!this.isPlaying()) return;
    if (!this.dragActive) this.moveTarget = { ...this.position };

    // Mantém o alvo dentro da arena (margem de 30px).
    this.moveTarget.x = Math.max(30, Math.min(GameConfig.ARENA_WIDTH - 30, this.moveTarget.x));
    this.moveTarget.y = Math.max(30, Math.min(GameConfig.ARENA_HEIGHT - 30, this.moveTarget.y));

    // Lerp em direção ao alvo (movimento suave). Guardamos a posição anterior
    // para descobrir a velocidade real (distância percorrida ÷ tempo).
    const prevX = this.position.x;
    const prevY = this.position.y;
    const t = Math.min(1, GameConfig.DRAG_LERP_FACTOR * dt);
    this.position.x += (this.moveTarget.x - this.position.x) * t;
    this.position.y += (this.moveTarget.y - this.position.y) * t;
    this.velocity = dt > 0
      ? { x: (this.position.x - prevX) / dt, y: (this.position.y - prevY) / dt }
      : { x: 0, y: 0 };

    const inShadow = this.isInShadow();
    this.drawBody(inShadow);
    this.drawSoundRing();
    this.node.x = this.position.x;
    this.node.y = this.position.y;
  }

  /** Velocidade atual (magnitude do vetor velocidade). */
  getSpeed(): number {
    return Math.hypot(this.velocity.x, this.velocity.y);
  }

  /** Raio de som: cresce conforme a velocidade, entre um mínimo e um máximo.
   *  "t" é a velocidade normalizada (0 = parado, 1 = velocidade máxima). */
  getSoundRadius(): number {
    const t = Math.max(0, Math.min(1, this.getSpeed() / GameConfig.STEALTH_AGENT_SPEED_MAX));
    return GameConfig.STEALTH_SOUND_RADIUS_MIN
      + t * (GameConfig.STEALTH_SOUND_RADIUS_MAX - GameConfig.STEALTH_SOUND_RADIUS_MIN);
  }

  /** Verifica se o personagem está dentro de alguma área de sombra. */
  isInShadow(): boolean {
    for (const r of this.shadowRects) {
      if (this.position.x >= r.x && this.position.x <= r.x + r.w
        && this.position.y >= r.y && this.position.y <= r.y + r.h) return true;
    }
    return false;
  }

  /** Desenha o corpo; na sombra fica mais escuro e ganha um contorno azul. */
  private drawBody(inShadow: boolean): void {
    this.body.clear();
    const c = inShadow ? Color.rgb(0.1, 0.35, 0.65) : Color.rgb(0.25, 0.65, 1.0);
    this.body
      .circle(0, 0, 12).fill(Color.hex(c))
      .circle(0, -4, 6).fill({ color: 0xffffff, alpha: 0.7 });
    if (inShadow) {
      this.body.circle(0, 0, 15).stroke({ color: 0x4d8cff, width: 2, alpha: 0.55 });
    }
  }

  /** Desenha o anel amarelo que mostra o quanto de barulho está sendo feito.
   *  Quase parado (raio mínimo): não desenha nada. */
  private drawSoundRing(): void {
    this.soundRing.clear();
    const sr = this.getSoundRadius();
    if (sr <= GameConfig.STEALTH_SOUND_RADIUS_MIN + 2) return;
    const alpha = Math.min(0.45, (sr - GameConfig.STEALTH_SOUND_RADIUS_MIN) / 60);
    this.soundRing.circle(0, 0, sr).stroke({ color: 0xffd933, width: 2, alpha });
  }
}
