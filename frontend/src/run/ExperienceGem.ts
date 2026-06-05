/*
 * ExperienceGem — a "gema de XP" largada por inimigos mortos.
 *
 * Diferente do recurso (que exige ficar parado), a gema é coletada na hora:
 * quando a party chega perto, a gema é "puxada" magneticamente até ela e some
 * ao encostar, somando XP ao medidor de nível da run. Sem tempo de canalização
 * e sem ocupar a mochila — é o fluxo constante de recompensa (estilo Vampire
 * Survivors). Visual: verde-vivo com um halo esverdeado.
 */
import { Container, Graphics } from 'pixi.js';
import { GameState, RunState } from '../state/GameState';
import { juice } from '../core/Juice';
import type { Party } from './Party';
import type { Vec2 } from '../core/types';

/** Pequena gema de XP atraída automaticamente para a party ao se aproximar. */
export class ExperienceGem {
  position: Vec2 = { x: 0, y: 0 };
  readonly node = new Container();
  private g = new Graphics();
  private party: Party;
  private done = false;
  /** Tempo desde o spawn — alimenta a pulsação visual. Começa em valor
   *  aleatório para as gemas não pulsarem todas em sincronia. */
  private spawnT = Math.random();
  private value: number;

  // Para economizar processamento, o redesenho roda no máx. 30 vezes por segundo.
  private drawAccumMs = 0;
  private static readonly DRAW_INTERVAL_MS = 1000 / 30;
  private static readonly MAGNET_R = 90; // raio onde a gema começa a ser puxada
  private static readonly PICKUP_R = 18; // raio em que é considerada coletada

  constructor(party: Party, value = 1) {
    this.party = party;
    this.value = value;
    this.node.addChild(this.g);
    this.draw();
  }

  /** Roda todo frame. Retorna true enquanto a gema existe; false ao ser coletada. */
  update(dt: number): boolean {
    if (this.done) return false;
    const s = GameState.current_state;
    if (s !== RunState.PLAYING && s !== RunState.BOSS_FIGHT) return true;

    this.spawnT += dt;

    const dx = this.party.anchor.x - this.position.x;
    const dy = this.party.anchor.y - this.position.y;
    const dist = Math.hypot(dx, dy);

    // Atração magnética dentro do raio: quanto mais perto, mais rápido vem.
    // step nunca passa de "dist" para não ultrapassar a party num frame.
    if (dist < ExperienceGem.MAGNET_R && dist > 0.5) {
      const pullSpeed = 320 + (1 - dist / ExperienceGem.MAGNET_R) * 560;
      const step = Math.min(dist, pullSpeed * dt);
      this.position.x += (dx / dist) * step;
      this.position.y += (dy / dist) * step;
    }

    // Encostou: soma XP, dá um tremor sutil e a gema some.
    if (dist <= ExperienceGem.PICKUP_R) {
      GameState.addXp(this.value);
      juice.shake(0.03, 4);
      this.done = true;
      return false;
    }

    this.node.x = this.position.x;
    this.node.y = this.position.y;
    // Redesenha no máximo 30x/s (acumula o tempo e só repinta ao atingir o limite).
    this.drawAccumMs += dt * 1000;
    if (this.drawAccumMs >= ExperienceGem.DRAW_INTERVAL_MS) {
      this.drawAccumMs = 0;
      this.draw();
    }
    return true;
  }

  /** Desenha a gema com camadas de halo e uma leve pulsação de brilho. */
  private draw(): void {
    const pulse = 0.85 + 0.15 * Math.sin(this.spawnT * 5); // oscila o brilho suavemente
    const r = 4;
    this.g.clear()
      .circle(0, 0, r * 2.4).fill({ color: 0x9aff6a, alpha: 0.10 * pulse })
      .circle(0, 0, r * 1.6).fill({ color: 0x9aff6a, alpha: 0.22 * pulse })
      .circle(0, 0, r).fill({ color: 0x6dffba, alpha: 1 })
      .circle(0, 0, r).stroke({ color: 0xddffd8, width: 1, alpha: 0.95 });
  }
}
