import { Container, Graphics } from 'pixi.js';
import { Color } from '../../core/Color';
import { Signal } from '../../core/Signal';
import { FontFamily, TextColor } from '../../core/typography';
import { GameConfig } from '../../state/GameConfig';
import { HubData, type HubRoom } from '../../state/HubData';
import { HubState } from '../../state/HubState';
import { randomRange } from '../../core/types';
import { Text } from 'pixi.js';

interface NPCState {
  room: string;
  x: number;
  y: number;        // foot y inside room
  bobPhase: number;
  wanderTimer: number;
  facing: 1 | -1;
}

/** Wandering NPC figures inside unlocked hub rooms.
 *  Mirrors hub-npc.jsx: head + glyph + body + accent dot + legs. */
export class HubNPCManager extends Container {
  readonly npcClicked = new Signal<[npcId: string]>();

  private readonly SURFACE_H = 80;
  private readonly topPad: number;
  private readonly bottomPad: number;
  private floorH = 0;
  private cellWidth: number;
  private roomYOffset: Record<string, number> = {};
  private states: Map<string, NPCState> = new Map();
  private g = new Graphics();
  private glyphs = new Map<string, Text>();
  private wanderInterval = 15;
  private elapsed = 0;

  constructor(opts: { topPad?: number; bottomPad?: number } = {}) {
    super();
    this.topPad = opts.topPad ?? 0;
    this.bottomPad = opts.bottomPad ?? 0;
    this.addChild(this.g);
    this.cellWidth = GameConfig.VIEWPORT_WIDTH / 6;
    this.calculateDimensions();
    this.initializePositions();
  }

  private calculateDimensions(): void {
    const available = GameConfig.VIEWPORT_HEIGHT - this.topPad - this.bottomPad;
    this.floorH = (available - this.SURFACE_H) / 5;
    for (const room of HubData.ROOMS) {
      this.roomYOffset[room.id] = room.floor === 1
        ? this.topPad
        : this.topPad + this.SURFACE_H + (room.floor - 2) * this.floorH;
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
          x: this.cellWidth * room.col + randomRange(14, this.cellWidth * room.w - 14),
          y: yOff + this.roomH(room) - 6, // foot near floor
          bobPhase: Math.random(),
          wanderTimer: randomRange(5, this.wanderInterval),
          facing: Math.random() < 0.5 ? -1 : 1,
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
    this.redraw();
  }

  private tryWander(state: NPCState): void {
    if (Math.random() <= 0.6) return; // 40% per cycle
    const candidates = HubData.ROOMS.filter(
      (r) => r.type !== 'surface' && r.type !== 'surface-exit' && !HubData.isRocketRoom(r)
        && HubState.isRoomUnlocked(r.id),
    );
    if (candidates.length <= 1) return;
    const next = candidates[Math.floor(Math.random() * candidates.length)]!;
    if (next.id === state.room) return;
    state.room = next.id;
    const yOff = this.roomYOffset[next.id] ?? 0;
    state.x = this.cellWidth * next.col + randomRange(14, this.cellWidth * next.w - 14);
    state.y = yOff + this.roomH(next) - 6;
    state.facing = Math.random() < 0.5 ? -1 : 1;
  }

  private redraw(): void {
    this.g.clear();
    // Reset glyph visibility — we'll re-set as we walk active NPCs.
    for (const t of this.glyphs.values()) t.visible = false;

    for (const [npcId, state] of this.states) {
      if (!HubState.isRoomUnlocked(state.room)) continue;
      const def = HubData.getNpc(npcId);
      if (!def) continue;

      const walking = Math.sin(state.bobPhase * Math.PI * 2) > 0;
      const bob = walking ? Math.abs(Math.sin(state.bobPhase * Math.PI * 2)) * 0.6 : 0;
      const cx = state.x;
      const footY = state.y - bob;
      this.drawFigure(cx, footY, def.color, def.accent, state.facing);

      // Glyph (initial letter) on the head — cached Text per NPC.
      let glyph = this.glyphs.get(npcId);
      if (!glyph) {
        glyph = new Text({
          text: def.glyph,
          style: {
            fontFamily: FontFamily.mono,
            fontSize: 8,
            fill: 0x0a0a0a,
            fontWeight: '700',
          },
        });
        glyph.anchor.set(0.5);
        this.addChild(glyph);
        this.glyphs.set(npcId, glyph);
      }
      glyph.visible = true;
      glyph.x = cx;
      glyph.y = footY - 20;
    }
  }

  /** Humanoid silhouette: glow + head + body + accent + legs. Total height
   *  ~26px, drawn upward from the foot anchor (px, footY). */
  private drawFigure(
    px: number,
    footY: number,
    color: { r: number; g: number; b: number; a: number },
    accent: { r: number; g: number; b: number; a: number },
    facing: 1 | -1,
  ): void {
    const c = Color.hex(color);
    const ac = Color.hex(accent);
    const skirt = TextColor.faint;

    // Soft halo grounding the figure in the dim room.
    this.g.ellipse(px, footY, 6, 1.6).fill({ color: 0x000000, alpha: 0.35 });

    // Head — 5px radius circle, centered at (px, footY-20)
    const headY = footY - 20;
    this.g.circle(px, headY, 6).fill({ color: c, alpha: 0.22 }); // glow
    this.g.circle(px, headY, 4.5).fill({ color: c, alpha: 1 });

    // Body — trapezoid 9px tall under the head
    const bodyTop = footY - 15;
    const bodyBot = footY - 4;
    this.g.poly([
      px - 2.8, bodyTop,
      px + 2.8, bodyTop,
      px + 4.2 + facing * 0.4, bodyBot,
      px - 4.2 + facing * 0.4, bodyBot,
    ]).fill({ color: c, alpha: 0.88 });

    // Accent — small dot on the shoulder
    this.g.circle(px + 2.4 * facing, footY - 11, 1.2).fill({ color: ac, alpha: 1 });

    // Legs — two thin segments
    this.g.rect(px - 3, bodyBot, 2, 4).fill({ color: skirt, alpha: 0.95 });
    this.g.rect(px + 1, bodyBot, 2, 4).fill({ color: skirt, alpha: 0.95 });
  }
}
