import { Container, Graphics } from 'pixi.js';
import { Color } from '../../core/Color';
import { Signal } from '../../core/Signal';
import { GameConfig } from '../../state/GameConfig';
import { HubData, type HubRoom } from '../../state/HubData';
import { HubState } from '../../state/HubState';
import { randomRange } from '../../core/types';

/** Estado de um NPC: em que sala esta, sua posicao e os timers de animacao. */
interface NPCState {
  room: string;
  x: number;
  y: number;
  bobPhase: number;    // fase do "balancinho" vertical (bob)
  wanderTimer: number; // contagem regressiva ate tentar trocar de sala
}

/**
 * HubNPCManager — os pontinhos dos personagens andando pelo bunker.
 *
 * Desenha os NPCs (sobreviventes) como bolinhas que ficam balancando de leve
 * dentro das salas ja liberadas e, de vez em quando, "passeiam" (wander) para
 * outra sala. E so enfeite/vida ambiente — nao afeta as regras do jogo.
 *
 * Assim como o HubRenderer, faz um throttle de redraw para ~20fps: o movimento
 * e lento e nao precisa ser redesenhado a cada quadro.
 */
export class HubNPCManager extends Container {
  readonly npcClicked = new Signal<[npcId: string]>();

  private readonly SURFACE_H = 110;
  private floorH = 0;
  private cellWidth: number;
  private roomYOffset: Record<string, number> = {};
  // Estado de cada NPC, indexado pelo id dele.
  private states: Map<string, NPCState> = new Map();
  private g = new Graphics();
  // Intervalo medio (segundos) entre tentativas de passear.
  private wanderInterval = 15;
  private elapsed = 0;
  // Acumulador do throttle de redraw (ver tick()).
  private redrawAccum = 0;

  constructor() {
    super();
    this.addChild(this.g);
    this.cellWidth = GameConfig.VIEWPORT_WIDTH / 6;
    this.calculateDimensions();
    this.initializePositions();
  }

  /** Calcula a altura de um andar e o topo (Y) de cada sala. */
  private calculateDimensions(): void {
    this.floorH = (GameConfig.VIEWPORT_HEIGHT - this.SURFACE_H) / 5;
    for (const room of HubData.ROOMS) {
      this.roomYOffset[room.id] = room.floor === 1
        ? 0
        : this.SURFACE_H + (room.floor - 2) * this.floorH;
    }
  }

  /** Altura util de uma sala (o andar 1, a superficie, tem altura especial). */
  private roomH(room: HubRoom): number {
    return room.floor === 1 ? this.SURFACE_H : this.floorH;
  }

  /** Coloca cada NPC numa posicao aleatoria dentro da sala inicial dele. */
  private initializePositions(): void {
    for (const room of HubData.ROOMS) {
      for (const npcId of room.npcs) {
        if (this.states.has(npcId)) continue;
        const yOff = this.roomYOffset[room.id] ?? 0;
        this.states.set(npcId, {
          room: room.id,
          x: this.cellWidth * room.col + randomRange(10, this.cellWidth * room.w - 10),
          y: yOff + randomRange(20, this.roomH(room) - 20),
          bobPhase: Math.random(),
          wanderTimer: randomRange(5, this.wanderInterval),
        });
      }
    }
  }

  /** Chamado a cada quadro pelo HubScene. Avanca os timers e, no ritmo do
   *  throttle, redesenha os NPCs. */
  tick(dt: number): void {
    this.elapsed += dt;
    for (const [, state] of this.states) {
      state.wanderTimer -= dt;
      state.bobPhase += dt / 0.6;
      // Quando o timer zera, sorteia o proximo intervalo e tenta passear.
      if (state.wanderTimer <= 0) {
        state.wanderTimer = randomRange(this.wanderInterval * 0.8, this.wanderInterval * 1.2);
        this.tryWander(state);
      }
    }
    // O balancinho (bob) e movimento lento — redesenhamos a ~20fps, nao a cada
    // quadro (mesmo motivo do HubRenderer: economizar CPU/bateria).
    this.redrawAccum += dt;
    if (this.redrawAccum >= 1 / 20) {
      this.redrawAccum = 0;
      this.redraw();
    }
  }

  /** Tenta mover o NPC para outra sala (com chance de 40% por ciclo). */
  private tryWander(state: NPCState): void {
    if (Math.random() <= 0.6) return; // 40% de chance por ciclo
    // Pode passear para qualquer sala interna (nao superficie, nao o foguete).
    const candidates = HubData.ROOMS.filter(
      (r) => r.type !== 'surface' && r.type !== 'surface-exit' && !HubData.isRocketRoom(r),
    );
    if (candidates.length <= 1) return;
    const next = candidates[Math.floor(Math.random() * candidates.length)]!;
    if (next.id === state.room) return;
    state.room = next.id;
    const yOff = this.roomYOffset[next.id] ?? 0;
    state.x = this.cellWidth * next.col + randomRange(10, this.cellWidth * next.w - 10);
    state.y = yOff + randomRange(20, this.roomH(next) - 20);
  }

  /** Redesenha todos os NPCs visiveis: um corpo + uma "cabeca" colorida,
   *  deslocados pelo balancinho vertical. NPCs em salas trancadas sao pulados. */
  private redraw(): void {
    this.g.clear();
    for (const [npcId, state] of this.states) {
      if (!HubState.isRoomUnlocked(state.room)) continue;
      const def = HubData.getNpc(npcId);
      if (!def) continue;
      // bob: deslocamento vertical suave (entre -1.5 e +1.5).
      const bob = Math.sin(state.bobPhase * Math.PI * 2) * 1.5;
      const px = state.x;
      const py = state.y + bob;
      this.g.circle(px, py, 3).fill(Color.hex(def.color));
      this.g.circle(px, py - 5, 2).fill(Color.hex(def.accent));
    }
  }
}
