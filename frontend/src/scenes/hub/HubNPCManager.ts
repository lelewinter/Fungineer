import { Container, Graphics } from 'pixi.js';
import { Color } from '../../core/Color';
import { Signal } from '../../core/Signal';
import { GameConfig } from '../../state/GameConfig';
import { HubData, type HubRoom } from '../../state/HubData';
import { HubState } from '../../state/HubState';
import { randomRange } from '../../core/types';

interface NPCState {
  room: string;
  x: number;
  y: number;
  bobPhase: number;
  wanderTimer: number;
}

/** Wandering NPC dots inside unlocked hub rooms. Mirrors HubNPCManager.gd. */
export class HubNPCManager extends Container {
  readonly npcClicked = new Signal<[npcId: string]>();

  private readonly SURFACE_H = 110;
  private floorH = 0;
  private cellWidth: number;
  private roomYOffset: Record<string, number> = {};
  private states: Map<string, NPCState> = new Map();
  private g = new Graphics();
  private wanderInterval = 15;
  private elapsed = 0;
  private redrawAccum = 0;

  constructor() {
    super();
    this.addChild(this.g);
    this.cellWidth = GameConfig.VIEWPORT_WIDTH / 6;
    this.calculateDimensions();
    this.initializePositions();
  }

  private calculateDimensions(): void {
    this.floorH = (GameConfig.VIEWPORT_HEIGHT - this.SURFACE_H) / 5;
    for (const room of HubData.ROOMS) {
      this.roomYOffset[room.id] = room.floor === 1
        ? 0
        : this.SURFACE_H + (room.floor - 2) * this.floorH;
    }
  }

  private roomH(room: HubRoom): number {
    return room.floor === 1 ? this.SURFACE_H : this.floorH;
  }

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

  /** Called every frame from HubScene.update. */
  tick(dt: number): void {
    this.elapsed += dt;
    for (const [, state] of this.states) {
      state.wanderTimer -= dt;
      state.bobPhase += dt / 0.6;
      if (state.wanderTimer <= 0) {
        state.wanderTimer = randomRange(this.wanderInterval * 0.8, this.wanderInterval * 1.2);
        this.tryWander(state);
      }
    }
    // Bob is slow ambient motion — redraw at ~20fps, not every frame.
    this.redrawAccum += dt;
    if (this.redrawAccum >= 1 / 20) {
      this.redrawAccum = 0;
      this.redraw();
    }
  }

  private tryWander(state: NPCState): void {
    if (Math.random() <= 0.6) return; // 40% per cycle
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

  private redraw(): void {
    this.g.clear();
    for (const [npcId, state] of this.states) {
      if (!HubState.isRoomUnlocked(state.room)) continue;
      const def = HubData.getNpc(npcId);
      if (!def) continue;
      const bob = Math.sin(state.bobPhase * Math.PI * 2) * 1.5;
      const px = state.x;
      const py = state.y + bob;
      this.g.circle(px, py, 3).fill(Color.hex(def.color));
      this.g.circle(px, py - 5, 2).fill(Color.hex(def.accent));
    }
  }
}
