import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { Color, type RGBA } from '../../core/Color';
import { Signal } from '../../core/Signal';
import { seededRng, strHash } from '../../core/hash';
import { GameConfig } from '../../state/GameConfig';
import { HubData, type HubRoom } from '../../state/HubData';
import { HubState, ROCKET_RECIPE } from '../../state/HubState';

/** Bunker cross-section grid — 6 columns × 6 floors.
 *  Floor 1: surface exit (full-width). Floors 2-6: underground rooms.
 *  Cols 2-3 on floors 2-5 are the integrated rocket shaft overlay. */
export class HubRenderer extends Container {
  readonly roomClicked = new Signal<[roomId: string]>();
  readonly rocketShaftClicked = new Signal<[]>();

  private readonly SURFACE_H = 80;
  private readonly topPad: number;
  private readonly bottomPad: number;
  private floorH = 0;

  private cellWidth: number;
  private roomYOffset: Record<string, number> = {};
  /** Static layer: walls, room base + interior fills, grid, locked rooms.
   *  Redrawn only when the variant changes or a room is unlocked. */
  private staticG = new Graphics();
  /** Animated layer: badges, pulses, flickers, ambient spores. */
  private g = new Graphics();
  private hitLayer = new Container();
  private silhouetteLabels = new Map<string, Text>();
  private elapsedFrames = 0;
  private elapsedMs = 0;
  private variantColors = HubState.getVariantData();
  private disposers: Array<() => void> = [];
  private unlockedRoomBboxes: Array<{ x: number; y: number; w: number; h: number }> = [];

  constructor(opts: { topPad?: number; bottomPad?: number } = {}) {
    super();
    this.topPad = opts.topPad ?? 0;
    this.bottomPad = opts.bottomPad ?? 0;
    this.cellWidth = GameConfig.VIEWPORT_WIDTH / 6;
    this.calculateLayout();
    this.addChild(this.staticG);
    this.addChild(this.g);
    this.addChild(this.hitLayer);
    this.buildHitboxes();
    this.drawStatic();
    this.rebuildRoomBboxCache();
    this.disposers.push(HubState.hubVariantChanged.connect(() => {
      this.applyVariant();
      this.drawStatic();
    }));
    this.disposers.push(HubState.roomUnlockedSignal.connect(() => {
      this.refreshSilhouettes();
      this.rebuildRoomBboxCache();
      this.drawStatic();
    }));
  }

  destroyRenderer(): void {
    for (const d of this.disposers) d();
    this.disposers = [];
    this.destroy({ children: true });
  }

  /** Per-frame tick. Caller passes seconds since last tick. The animated
   *  layer redraws at ~30 fps regardless of incoming framerate — every
   *  effect is a slow pulse/flicker, so half-rate is invisible to the eye
   *  and roughly doubles the renderer's throughput. */
  private redrawAccumMs = 0;
  private readonly redrawIntervalMs = 1000 / 30;
  tick(dt: number): void {
    this.elapsedFrames += Math.round(dt * 60);
    this.elapsedMs += dt * 1000;
    this.redrawAccumMs += dt * 1000;
    if (this.redrawAccumMs >= this.redrawIntervalMs) {
      this.redrawAccumMs = 0;
      this.redraw();
    }
  }

  private calculateLayout(): void {
    const available = GameConfig.VIEWPORT_HEIGHT - this.topPad - this.bottomPad;
    this.floorH = (available - this.SURFACE_H) / 5;
    for (const room of HubData.ROOMS) {
      this.roomYOffset[room.id] = room.floor === 1
        ? this.topPad
        : this.topPad + this.SURFACE_H + (room.floor - 2) * this.floorH;
    }
  }

  private getTotalH(): number {
    return this.topPad + this.SURFACE_H + 5 * this.floorH;
  }

  private getTopY(): number {
    return this.topPad;
  }

  private roomFloorH(room: HubRoom): number {
    return room.floor === 1 ? this.SURFACE_H : this.floorH;
  }

  private buildHitboxes(): void {
    for (const room of HubData.ROOMS) {
      if (HubData.isRocketRoom(room)) continue;
      const x = this.cellWidth * room.col;
      const y = this.roomYOffset[room.id] ?? 0;
      const w = this.cellWidth * room.w;
      const h = this.roomFloorH(room);
      const hit = new Graphics().rect(0, 0, w, h).fill({ color: 0x000000, alpha: 0.001 });
      hit.x = x;
      hit.y = y;
      hit.eventMode = 'static';
      hit.cursor = 'pointer';
      hit.on('pointertap', (_e: FederatedPointerEvent) => {
        if (HubState.isRoomUnlocked(room.id)) this.roomClicked.emit(room.id);
      });
      this.hitLayer.addChild(hit);

      if (room.silhouette) {
        const label = new Text({
          text: room.silhouette,
          style: {
            fontFamily: '"Space Grotesk", system-ui, sans-serif',
            fontSize: 8,
            fill: Color.hex(Color.rgb(0.55, 0.48, 0.40)),
            align: 'center',
          },
        });
        label.alpha = 0.6;
        label.anchor.set(0.5, 0);
        label.x = x + w * 0.5;
        label.y = y + h * 0.5 + 10;
        label.visible = !HubState.isRoomUnlocked(room.id);
        this.addChild(label);
        this.silhouetteLabels.set(room.id, label);
      }
    }

    // Rocket shaft hitbox — spans floors 2-5, cols 2-3
    const rocketHit = new Graphics()
      .rect(0, 0, this.cellWidth * 2, this.floorH * 4)
      .fill({ color: 0x000000, alpha: 0.001 });
    rocketHit.x = this.cellWidth * 2;
    rocketHit.y = this.topPad + this.SURFACE_H;
    rocketHit.eventMode = 'static';
    rocketHit.cursor = 'pointer';
    rocketHit.on('pointertap', () => this.rocketShaftClicked.emit());
    this.hitLayer.addChild(rocketHit);
  }

  private refreshSilhouettes(): void {
    for (const [roomId, label] of this.silhouetteLabels) {
      label.visible = !HubState.isRoomUnlocked(roomId);
    }
  }

  private applyVariant(): void {
    this.variantColors = HubState.getVariantData();
  }

  // ── Drawing ──────────────────────────────────────────────────────────────
  /** Heavy, draw-once layer: walls, grid, locked rooms, room base + vignette
   *  + lighting + border. Re-runs only on variant change or room unlock. */
  private drawStatic(): void {
    this.staticG.clear();
    this.useGraphics(this.staticG);
    this.drawSideWalls();
    this.drawGridLines();
    for (const room of HubData.ROOMS) this.drawRoomStatic(room);
    this.useGraphics(this.g);
  }

  /** Light per-frame layer: zone badges, interior animations, rocket shaft,
   *  ambient spores. */
  private redraw(): void {
    this.g.clear();
    for (const room of HubData.ROOMS) this.drawRoomAnim(room);
    this.drawRocketShaft();
    this.drawAmbientSpores();
  }

  /** All `draw*` helpers below render into `this.g`. drawStatic temporarily
   *  swaps that pointer to `staticG` and restores it on exit. */
  private useGraphics(target: Graphics): void {
    this.g = target;
  }

  private drawRoomStatic(room: HubRoom): void {
    if (HubData.isRocketRoom(room)) return;
    const x = this.cellWidth * room.col;
    const y = this.roomYOffset[room.id] ?? 0;
    const w = this.cellWidth * room.w;
    const h = this.roomFloorH(room);

    if (!HubState.isRoomUnlocked(room.id)) {
      this.drawLockedRoom(room, x, y, w, h);
      return;
    }

    this.g.rect(x, y, w, h).fill(Color.hex(this.getRoomBaseColor(room)));
    this.applyRoomLighting(room, x, y, w, h);
    this.drawRoomVignette(x, y, w, h);
    this.drawRoomTopLight(x, y, w, h, room);
    this.g.rect(x, y, w, h).stroke({ color: Color.hex(Color.rgb(0.15, 0.15, 0.15)), width: 1 });
  }

  private drawRoomAnim(room: HubRoom): void {
    if (HubData.isRocketRoom(room)) return;
    if (!HubState.isRoomUnlocked(room.id)) return;
    const x = this.cellWidth * room.col;
    const y = this.roomYOffset[room.id] ?? 0;
    const w = this.cellWidth * room.w;
    const h = this.roomFloorH(room);
    this.drawRoomInterior(room, x, y, w, h);
    this.drawZoneBadgeIfNeeded(room, x, y, w, h);
  }

  private drawSideWalls(): void {
    const wallTopY = this.topPad + this.SURFACE_H;
    const totalH = this.getTotalH();
    const wallW = 10;
    const ww = GameConfig.VIEWPORT_WIDTH;
    const rock = Color.rgb(0.04, 0.03, 0.02);
    const seam = Color.rgb(0.18, 0.13, 0.09);
    this.g
      .rect(0, wallTopY, wallW, totalH - wallTopY).fill(Color.hex(rock))
      .rect(ww - wallW, wallTopY, wallW, totalH - wallTopY).fill(Color.hex(rock));
    for (let y = wallTopY + 12; y < totalH; y += 22 + ((y * 13) % 9)) {
      this.g.moveTo(0, y).lineTo(wallW - 1, y + (((y * 7) % 4) - 2))
        .stroke({ color: Color.hex(seam), width: 1, alpha: 0.55 });
      this.g.moveTo(ww - wallW + 1, y + (((y * 11) % 4) - 2)).lineTo(ww, y)
        .stroke({ color: Color.hex(seam), width: 1, alpha: 0.55 });
    }
    this.g.moveTo(wallW, wallTopY).lineTo(wallW, totalH)
      .stroke({ color: Color.hex(seam), width: 1.5, alpha: 0.7 });
    this.g.moveTo(ww - wallW, wallTopY).lineTo(ww - wallW, totalH)
      .stroke({ color: Color.hex(seam), width: 1.5, alpha: 0.7 });
  }

  // ── Integrated Rocket Shaft ───────────────────────────────────────────────

  /** Draws the full-height rocket inside the shaft (cols 2-3, floors 2-5). */
  private drawRocketShaft(): void {
    const built = HubState.rocket_pieces_built;
    const total = ROCKET_RECIPE.length;
    const progress = built / Math.max(1, total);
    const t = this.elapsedMs;

    const shaftX = this.cellWidth * 2;
    const shaftY = this.topPad + this.SURFACE_H;
    const shaftW = this.cellWidth * 2;
    const shaftH = this.floorH * 4;
    const cx = shaftX + shaftW * 0.5;

    // Void background
    this.g.rect(shaftX, shaftY, shaftW, shaftH)
      .fill(Color.hex(Color.rgb(0.03, 0.02, 0.015)));

    // Faint floor separators inside shaft
    for (let f = 1; f < 4; f++) {
      const ly = shaftY + f * this.floorH;
      this.g.moveTo(shaftX, ly).lineTo(shaftX + shaftW, ly)
        .stroke({ color: Color.hex(Color.rgb(0.14, 0.11, 0.09)), width: 1, alpha: 0.6 });
    }

    // Rocket geometry
    const topY = shaftY + 16;
    const bottomY = shaftY + shaftH - 20;
    const totalH = bottomY - topY;
    const bodyW = 52;
    const noseH = totalH * 0.13;
    const noseEnd = topY + noseH;
    const finH = totalH * 0.10;
    const finTop = bottomY - finH;
    const bodyH = finTop - noseEnd;
    const bodyLeft = cx - bodyW * 0.5;
    const bodyRight = cx + bodyW * 0.5;

    // Where built portion ends (measured from top of body downward)
    const buildY = noseEnd + bodyH * (1 - progress);

    const purple: RGBA = Color.rgb(0.72, 0.45, 0.85);
    const cyan: RGBA = Color.rgb(0.30, 0.78, 0.72);
    const amber: RGBA = Color.rgb(0.91, 0.58, 0.23);
    const earth: RGBA = Color.rgb(0.55, 0.35, 0.20);
    const gray: RGBA = { r: 0.35, g: 0.32, b: 0.28, a: 1 };

    // Scaffolding poles (behind rocket)
    const poleX1 = shaftX + 11;
    const poleX2 = shaftX + shaftW - 11;
    this.g.moveTo(poleX1, topY - 6).lineTo(poleX1, bottomY + 10)
      .stroke({ color: Color.hex(gray), width: 2, alpha: 0.38 });
    this.g.moveTo(poleX2, topY - 6).lineTo(poleX2, bottomY + 10)
      .stroke({ color: Color.hex(gray), width: 2, alpha: 0.38 });
    // Cross-bars at each floor boundary
    for (let f = 0; f <= 4; f++) {
      const barY = shaftY + f * this.floorH;
      this.g.moveTo(poleX1, barY).lineTo(poleX1 + 16, barY)
        .stroke({ color: Color.hex(gray), width: 1.5, alpha: 0.30 });
      this.g.moveTo(poleX2 - 16, barY).lineTo(poleX2, barY)
        .stroke({ color: Color.hex(gray), width: 1.5, alpha: 0.30 });
    }

    // Nose cone
    const noseColor = built >= 1 ? purple : gray;
    this.g.poly([cx, topY, bodyRight, noseEnd, bodyLeft, noseEnd])
      .fill(Color.hex(noseColor));
    const strokeC: RGBA = { r: noseColor.r * 0.75, g: noseColor.g * 0.75, b: noseColor.b * 0.75, a: 1 };
    this.g.poly([cx, topY, bodyRight, noseEnd, bodyLeft, noseEnd])
      .stroke({ color: Color.hex(strokeC), width: 1.5 });

    // Body — 4 sections, each mapping to a rocket piece (indices 1-4)
    const sectionH = bodyH / 4;
    for (let i = 0; i < 4; i++) {
      const sy = noseEnd + i * sectionH;
      const pieceIdx = i + 1;
      const isBuilt = pieceIdx < built;
      const isNext = pieceIdx === built;
      let c: RGBA;
      if (isBuilt) {
        c = cyan;
      } else if (isNext) {
        c = { r: cyan.r * 0.55 + gray.r * 0.45, g: cyan.g * 0.55 + gray.g * 0.45, b: cyan.b * 0.55 + gray.b * 0.45, a: 1 };
      } else {
        c = gray;
      }
      this.g.rect(bodyLeft, sy, bodyW, sectionH).fill(Color.hex(c));
      this.g.rect(bodyLeft, sy, bodyW, sectionH)
        .stroke({ color: Color.hex(Color.rgb(0.12, 0.18, 0.15)), width: 1 });

      if (isBuilt) {
        // Horizontal plating stripes
        for (let s = 1; s < 4; s++) {
          const ly = sy + sectionH * s / 4;
          this.g.moveTo(bodyLeft + 4, ly).lineTo(bodyRight - 4, ly)
            .stroke({ color: Color.hex(cyan), width: 0.8, alpha: 0.50 });
        }
        // Porthole on middle sections
        if (i === 1 || i === 2) {
          const ph = 0.5 + 0.5 * Math.abs(Math.sin(t * 0.003 + i * 1.3));
          this.g.circle(cx, sy + sectionH * 0.5, 5.5)
            .fill({ color: Color.hex(Color.rgb(0.85, 0.92, 0.78)), alpha: ph });
          this.g.circle(cx, sy + sectionH * 0.5, 3)
            .fill({ color: 0xffffff, alpha: 0.55 * ph });
        }
      }
    }

    // Animated welding seam where built meets unbuilt
    if (built > 0 && built < total) {
      const dashPulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.006));
      this.g.moveTo(bodyLeft - 5, buildY).lineTo(bodyRight + 5, buildY)
        .stroke({ color: Color.hex(amber), width: 1.8, alpha: 0.9 * dashPulse });
      this.g.circle(cx - 15, buildY, 2.4).fill({ color: Color.hex(amber), alpha: dashPulse });
      this.g.circle(cx + 15, buildY, 2.0).fill({ color: Color.hex(amber), alpha: 1 - dashPulse });
    }

    // Engine fins
    const finColor = built >= 5 ? earth : gray;
    this.g.poly([bodyLeft, finTop, shaftX + 16, bottomY - 4, bodyLeft, finTop + finH * 0.55])
      .fill(Color.hex(finColor));
    this.g.poly([bodyRight, finTop, shaftX + shaftW - 16, bottomY - 4, bodyRight, finTop + finH * 0.55])
      .fill(Color.hex(finColor));

    // Base glow and flame jets
    if (built > 0) {
      const pulse = 0.6 + 0.4 * Math.abs(Math.sin(t * 0.002));
      this.g.ellipse(cx, bottomY, 18 + pulse * 10, 8)
        .fill({ color: Color.hex(amber), alpha: 0.22 * pulse });
      if (built >= 5) {
        for (let j = 0; j < 5; j++) {
          const fx = cx + (j - 2) * 7;
          const fLen = 10 + Math.abs(Math.sin(t * 0.004 + j * 0.9)) * 9;
          const fa: RGBA = { r: amber.r * pulse, g: amber.g * pulse, b: amber.b * pulse, a: 1 };
          this.g.moveTo(fx, bottomY).lineTo(fx + Math.sin(j * 1.4) * 2, bottomY + fLen)
            .stroke({ color: Color.hex(fa), width: 2.5 });
        }
      }
    }

    // Shaft border on top
    this.g.rect(shaftX, shaftY, shaftW, shaftH)
      .stroke({ color: Color.hex(Color.rgb(0.22, 0.18, 0.15)), width: 1 });
  }

  // ── Room rendering ───────────────────────────────────────────────────────

  private drawRoomVignette(x: number, y: number, w: number, h: number): void {
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const t = (i + 1) / layers;
      const ringSize = t * 6;
      this.g
        .rect(x, y, w, ringSize).fill({ color: 0x000000, alpha: 0.05 + 0.04 * (1 - t) })
        .rect(x, y + h - ringSize, w, ringSize).fill({ color: 0x000000, alpha: 0.05 + 0.04 * (1 - t) })
        .rect(x, y + ringSize, ringSize, h - ringSize * 2).fill({ color: 0x000000, alpha: 0.05 + 0.04 * (1 - t) })
        .rect(x + w - ringSize, y + ringSize, ringSize, h - ringSize * 2).fill({ color: 0x000000, alpha: 0.05 + 0.04 * (1 - t) });
    }
  }

  private drawRoomTopLight(x: number, y: number, w: number, _h: number, room: HubRoom): void {
    const c = this.getLightColor(room.light);
    this.g.rect(x + 2, y + 2, w - 4, 1.5).fill({ color: Color.hex(c), alpha: 0.35 });
    for (let i = 0; i < 4; i++) {
      this.g.rect(x + 2, y + 4 + i, w - 4, 1).fill({ color: Color.hex(c), alpha: 0.04 - i * 0.008 });
    }
  }

  private drawLockedRoom(room: HubRoom, x: number, y: number, w: number, h: number): void {
    this.drawGradientRect(x, y, w, h, Color.rgb(0.10, 0.08, 0.05), Color.rgb(0.16, 0.12, 0.08));
    const rng = seededRng(strHash(room.id));
    for (let i = 0; i < 22; i++) {
      const px = x + rng() * w;
      const py = y + rng() * h;
      this.g.circle(px, py, 1.5).fill({ color: Color.hex(Color.rgb(0.25, 0.18, 0.12)), alpha: 0.5 });
    }
    for (let i = 0; i < 3; i++) {
      const vy = y + h * (0.2 + i * 0.3);
      this.g.moveTo(x + 6, vy).lineTo(x + w - 6, vy + 4)
        .stroke({ color: Color.hex(Color.rgb(0.22, 0.16, 0.10)), width: 1, alpha: 0.6 });
    }
    const rcx = x + w * 0.5;
    const rcy = y + h * 0.5;
    const boxW = Math.min(w * 0.55, 80);
    const boxH = Math.min(h * 0.45, 50);
    this.g.rect(rcx - boxW * 0.5, rcy - boxH * 0.5, boxW, boxH)
      .fill({ color: Color.hex(Color.rgb(0.28, 0.25, 0.22)), alpha: 0.35 });
    this.g.rect(rcx - boxW * 0.5, rcy - boxH * 0.5, boxW, boxH)
      .stroke({ color: Color.hex(Color.rgb(0.45, 0.40, 0.35)), width: 1, alpha: 0.5 });
    this.g.rect(x, y, w, h).stroke({ color: Color.hex(Color.rgb(0.10, 0.08, 0.05)), width: 1 });
  }

  private getRoomBaseColor(room: HubRoom): RGBA {
    switch (room.type) {
      case 'surface': return Color.rgb(0.08, 0.06, 0.03);
      case 'surface-exit': return Color.rgb(0.2, 0.1, 0.05);
      case 'tech': return Color.rgb(0.08, 0.08, 0.12);
      case 'storage': return Color.rgb(0.12, 0.10, 0.08);
      case 'medical':
      case 'mycelium-lab': return Color.rgb(0.08, 0.14, 0.11);
      case 'lab':
      case 'spore-chamber': return Color.rgb(0.12, 0.09, 0.16);
      case 'common': return Color.rgb(0.1, 0.09, 0.07);
      case 'kitchen':
      case 'fungus-kitchen': return Color.rgb(0.13, 0.10, 0.07);
      case 'workshop':
      case 'hyphae-forge': return Color.rgb(0.14, 0.11, 0.07);
      case 'archive': return Color.rgb(0.1, 0.10, 0.12);
      case 'server':
      case 'neural-mushroom': return Color.rgb(0.06, 0.08, 0.06);
      case 'office': return Color.rgb(0.12, 0.12, 0.10);
      case 'bedroom': return Color.rgb(0.12, 0.08, 0.10);
      case 'transit': return Color.rgb(0.10, 0.09, 0.08);
      default: return Color.rgb(0.08, 0.08, 0.08);
    }
  }

  private drawRoomInterior(room: HubRoom, x: number, y: number, w: number, h: number): void {
    switch (room.type) {
      case 'surface': this.drawGradientRect(x, y, w, h, Color.rgb(0.06, 0.05, 0.03), Color.rgb(0.15, 0.10, 0.06)); break;
      case 'surface-exit': this.drawSurfaceExit(x, y, w, h); break;
      case 'tech': this.drawMonitors(x, y, w, h); break;
      case 'storage': this.drawShelves(x, y, w, h); break;
      case 'medical': this.drawBeds(x, y, w, h); break;
      case 'mycelium-lab': this.drawMycelium(x, y, w, h); break;
      case 'lab': this.drawBeakers(x, y, w, h); break;
      case 'spore-chamber': this.drawSporeChamber(x, y, w, h); break;
      case 'common': this.drawTable(x, y, w, h); break;
      case 'kitchen': this.drawStove(x, y, w, h); break;
      case 'fungus-kitchen': this.drawFungusKitchen(x, y, w, h); break;
      case 'workshop': this.drawWorkbench(x, y, w, h); break;
      case 'hyphae-forge': this.drawHyphaeForge(x, y, w, h); break;
      case 'archive': this.drawBooks(x, y, w, h); break;
      case 'server': this.drawRacks(x, y, w, h); break;
      case 'neural-mushroom': this.drawNeuralMushroom(x, y, w, h); break;
      case 'office': this.drawDesk(x, y, w, h); break;
      case 'bedroom': this.drawBed(x, y, w, h); break;
      case 'transit': this.drawDoor(x, y, w, h); break;
    }
  }

  private applyRoomLighting(room: HubRoom, x: number, y: number, w: number, h: number): void {
    const c = this.getLightColor(room.light);
    this.g.rect(x, y, w, h).fill({ color: Color.hex(c), alpha: 0.2 });
  }

  private getLightColor(light: string): RGBA {
    switch (light) {
      case 'red': return Color.rgb(0.82, 0.29, 0.25);
      case 'cool': return Color.rgb(0.0, 1.0, 0.533);
      case 'clinical': return Color.rgb(0.8, 0.85, 0.85);
      case 'hospital': return Color.rgb(0.565, 0.878, 0.722);
      case 'amber':
      case 'amber-hot':
      case 'warm': return Color.rgb(0.91, 0.58, 0.23);
      case 'neon-green': return Color.rgb(0.0, 1.0, 0.533);
      case 'office': return Color.rgb(0.56, 0.66, 0.78);
      case 'pink-dim': return Color.rgb(0.85, 0.53, 0.62);
      default: return Color.rgb(0.5, 0.5, 0.5);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  private drawGradientRect(x: number, y: number, w: number, h: number, top: RGBA, bot: RGBA): void {
    const steps = Math.ceil(h);
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const c: RGBA = {
        r: top.r + (bot.r - top.r) * t,
        g: top.g + (bot.g - top.g) * t,
        b: top.b + (bot.b - top.b) * t,
        a: 1,
      };
      this.g.moveTo(x, y + i).lineTo(x + w, y + i).stroke({ color: Color.hex(c), width: 1 });
    }
  }

  private drawZoneBadgeIfNeeded(room: HubRoom, x: number, _y: number, w: number, _h: number): void {
    if (!room.zone_id) return;
    const zone = HubData.getZone(room.zone_id);
    if (!zone) return;
    const pulse = Math.abs(Math.sin(this.elapsedFrames * 0.02)) * 0.3 + 0.7;
    const bcx = x + w - 10;
    const bcy = (this.roomYOffset[room.id] ?? 0) + 10;
    this.g.circle(bcx, bcy, 14).fill({ color: Color.hex(zone.color), alpha: 0.08 * pulse });
    this.g.circle(bcx, bcy, 10).fill({ color: Color.hex(zone.color), alpha: 0.16 * pulse });
    const c: RGBA = { r: zone.color.r * pulse, g: zone.color.g * pulse, b: zone.color.b * pulse, a: 1 };
    this.g.circle(bcx, bcy, 5).fill(Color.hex(c));
    this.g.circle(bcx, bcy, 2.5).fill({ color: 0xffffff, alpha: 0.85 * pulse });
  }

  private drawGridLines(): void {
    const topY = this.getTopY();
    const totalH = this.getTotalH();
    for (let col = 0; col < 7; col++) {
      const x = this.cellWidth * col;
      this.g.moveTo(x, topY).lineTo(x, totalH)
        .stroke({ color: Color.hex(this.variantColors.grid), width: 1 });
    }
  }

  private drawAmbientSpores(): void {
    const W = GameConfig.VIEWPORT_WIDTH;
    const H = GameConfig.VIEWPORT_HEIGHT;
    const t = this.elapsedMs * 0.0006;
    const purple = Color.rgb(0.72, 0.45, 0.85);
    const cyan = Color.rgb(0.30, 0.78, 0.72);
    for (let i = 0; i < 18; i++) {
      const baseX = (i * 97.3) % W;
      const baseY = (i * 53.1) % H;
      let py = (baseY - t * 12 * (1 + (i % 3) * 0.3)) % H;
      if (py < 0) py += H;
      const px = baseX + Math.sin(t + i) * 8;
      if (!this.isPointInUnlockedRoom(px, py)) continue;
      const alpha = 0.25 + 0.15 * Math.sin(t * 2 + i);
      const c = i % 2 === 0 ? purple : cyan;
      this.g.circle(px, py, 1.2).fill({ color: Color.hex(c), alpha });
    }
  }

  private rebuildRoomBboxCache(): void {
    this.unlockedRoomBboxes = HubData.ROOMS
      .filter((r) => !HubData.isRocketRoom(r) && HubState.isRoomUnlocked(r.id))
      .map((r) => ({
        x: this.cellWidth * r.col,
        y: this.roomYOffset[r.id] ?? 0,
        w: this.cellWidth * r.w,
        h: this.roomFloorH(r),
      }));
  }

  private isPointInUnlockedRoom(px: number, py: number): boolean {
    for (const b of this.unlockedRoomBboxes) {
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return true;
    }
    return false;
  }

  // ── Interior drawers ─────────────────────────────────────────────────────

  private drawSurfaceExit(x: number, y: number, w: number, h: number): void {
    this.drawGradientRect(x, y, w, h * 0.6, Color.rgb(0.3, 0.15, 0.08), Color.rgb(0.5, 0.2, 0.1));
    this.g.poly([
      x + w * 0.1, y + h * 0.5,
      x + w * 0.25, y + h * 0.2,
      x + w * 0.35, y + h * 0.5,
    ]).fill(Color.hex(Color.rgb(0.05, 0.05, 0.05)));
    if ((Math.floor(this.elapsedFrames / 10)) % 2 === 0) {
      for (let i = 0; i < 5; i++) {
        this.g.circle(x + 10 + i * 12, y + h * 0.45, 1).fill(Color.hex(Color.rgb(0.2, 0.1, 0.05)));
      }
    }
  }

  private drawMonitors(x: number, y: number, w: number, h: number): void {
    const red = Color.rgb(0.82, 0.29, 0.25);
    const monitorW = w * 0.25;
    const monitorH = h * 0.35;
    const startX = x + w * 0.12;
    const startY = y + h * 0.25;
    for (let i = 0; i < 3; i++) {
      const mx = startX + i * (monitorW + 4);
      this.g.rect(mx, startY, monitorW, monitorH).fill(Color.hex(Color.rgb(0.1, 0.1, 0.15)));
      this.g.rect(mx, startY, monitorW, monitorH).stroke({ color: Color.hex(Color.rgb(0.6, 0.6, 0.7)), width: 2 });
      if ((Math.floor(this.elapsedFrames / 15)) % 2 === 0) {
        this.g.rect(mx + 3, startY + 3, monitorW - 6, monitorH - 6).fill(Color.hex(red));
      }
    }
  }

  private drawShelves(x: number, y: number, w: number, h: number): void {
    const shelfYStart = y + h * 0.3;
    const spacing = h * 0.15;
    for (let s = 0; s < 3; s++) {
      const sy = shelfYStart + s * spacing;
      this.g.moveTo(x + 8, sy).lineTo(x + w - 8, sy)
        .stroke({ color: Color.hex(Color.rgb(0.7, 0.6, 0.5)), width: 3 });
      for (let it = 0; it < 6; it++) {
        const itemW = (w - 16) / 6;
        const ix = x + 8 + it * itemW + itemW * 0.2;
        const c = s % 2 === 0 ? Color.rgb(0.85, 0.75, 0.55) : Color.rgb(1.0, 0.9, 0.4);
        this.g.rect(ix, sy - 8, itemW * 0.6, 10).fill(Color.hex(c));
      }
    }
  }

  private drawBeds(x: number, y: number, w: number, h: number): void {
    const bedH = h * 0.25;
    const bedY = y + h * 0.35;
    this.g.rect(x + 8, bedY, w * 0.35, bedH).fill(Color.hex(Color.rgb(0.8, 0.95, 0.85)));
    this.g.rect(x + w * 0.57, bedY, w * 0.35, bedH).fill(Color.hex(Color.rgb(0.8, 0.95, 0.85)));
    this.g.circle(x + w - 12, bedY + bedH * 0.5, 6).fill(Color.hex(Color.rgb(0.0, 1.0, 0.533)));
  }

  private drawBeakers(x: number, y: number, w: number, h: number): void {
    const beakerY = y + h * 0.4;
    const size = h * 0.2;
    const colors = [Color.rgb(0.31, 0.722, 0.447), Color.rgb(0.722, 0.353, 0.851), Color.rgb(1, 0.7, 0.2)];
    const spacing = w * 0.25;
    for (let i = 0; i < 3; i++) {
      const bx = x + w * 0.15 + i * spacing;
      this.g.rect(bx - size * 0.5, beakerY, size, size * 1.2).stroke({ color: Color.hex(colors[i]!), width: 2 });
      this.g.circle(bx, beakerY + size * 0.6, size * 0.3).fill(Color.hex(colors[i]!));
    }
  }

  private drawTable(x: number, y: number, w: number, h: number): void {
    const tableY = y + h * 0.4;
    const tableH = h * 0.2;
    this.g.rect(x + w * 0.1, tableY, w * 0.8, tableH).fill(Color.hex(Color.rgb(0.55, 0.42, 0.24)));
    const amber = Color.rgb(0.91, 0.58, 0.23);
    for (let i = 0; i < 4; i++) {
      const icx = x + w * 0.2 + i * w * 0.2;
      this.g.circle(icx, tableY + tableH * 0.5, 6).fill(Color.hex(amber));
    }
  }

  private drawStove(x: number, y: number, w: number, h: number): void {
    const stoveW = w * 0.35;
    const stoveH = h * 0.3;
    const stoveY = y + h * 0.3;
    const stoveX = x + w * 0.325 - stoveW * 0.5;
    this.g.rect(stoveX, stoveY, stoveW, stoveH).fill(Color.hex(Color.rgb(0.25, 0.25, 0.25)));
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        this.g.circle(stoveX + 8 + i * 15, stoveY + 8 + j * 15, 5).fill(Color.hex(Color.rgb(1, 0.5, 0.2)));
      }
    }
  }

  private drawWorkbench(x: number, y: number, w: number, h: number): void {
    const benchY = y + h * 0.35;
    const benchH = h * 0.25;
    this.g.rect(x + 8, benchY, w - 16, benchH).fill(Color.hex(Color.rgb(0.35, 0.35, 0.35)));
    for (let i = 0; i < 4; i++) {
      const vx = x + 20 + i * (w - 40) * 0.25;
      this.g.moveTo(vx, benchY + 4).lineTo(vx, benchY + benchH - 4)
        .stroke({ color: Color.hex(Color.rgb(0.7, 0.7, 0.7)), width: 2 });
    }
    if ((Math.floor(this.elapsedFrames / 8)) % 3 === 0) {
      this.g.circle(x + w - 12, benchY + benchH * 0.5, 4).fill(Color.hex(Color.rgb(1, 0.7, 0.3)));
    }
  }

  private drawBooks(x: number, y: number, w: number, h: number): void {
    const shelfYStart = y + h * 0.3;
    const spacing = h * 0.15;
    const bookW = (w - 16) / 6;
    const colors = [
      Color.rgb(1.0, 0.4, 0.2), Color.rgb(0.8, 0.2, 0.2), Color.rgb(0.6, 0.3, 0.15),
      Color.rgb(0.7, 0.5, 0.3), Color.rgb(0.5, 0.7, 0.4), Color.rgb(0.4, 0.6, 0.5),
    ];
    for (let r = 0; r < 3; r++) {
      const sy = shelfYStart + r * spacing;
      for (let c = 0; c < 6; c++) {
        this.g.rect(x + 8 + c * bookW, sy, bookW - 2, 12).fill(Color.hex(colors[c % 6]!));
      }
    }
  }

  private drawRacks(x: number, y: number, w: number, h: number): void {
    const green = Color.rgb(0.0, 1.0, 0.533);
    const rackY = y + h * 0.2;
    const rackW = w * 0.22;
    const rackH = h * 0.45;
    for (let i = 0; i < 3; i++) {
      const rx = x + w * 0.1 + i * (rackW + 6);
      this.g.rect(rx, rackY, rackW, rackH).stroke({ color: Color.hex(green), width: 2 });
      for (let j = 0; j < 5; j++) {
        this.g.circle(rx + rackW * 0.5, rackY + 6 + j * (rackH - 12) * 0.25, 2).fill(Color.hex(green));
      }
    }
  }

  private drawDesk(x: number, y: number, w: number, h: number): void {
    const deskY = y + h * 0.35;
    const deskW = w * 0.6;
    const deskH = h * 0.2;
    const deskX = x + w * 0.2;
    this.g.rect(deskX, deskY, deskW, deskH).fill(Color.hex(Color.rgb(0.25, 0.2, 0.15)));
    this.g.rect(deskX + 8, deskY - 12, deskW - 16, 10).fill(Color.hex(Color.rgb(0.05, 0.08, 0.15)));
    this.g.rect(deskX + 8, deskY - 12, deskW - 16, 10).stroke({ color: Color.hex(Color.rgb(0.3, 0.5, 0.8)), width: 2 });
  }

  private drawBed(x: number, y: number, w: number, h: number): void {
    const bedY = y + h * 0.35;
    const bedW = w * 0.6;
    const bedH = h * 0.25;
    const bedX = x + w * 0.2;
    this.g.rect(bedX, bedY, bedW, bedH).fill(Color.hex(Color.rgb(0.84, 0.39, 0.55)));
    this.g.moveTo(bedX + 2, bedY + 2).lineTo(bedX + bedW - 2, bedY + 2)
      .stroke({ color: Color.hex(Color.rgb(1, 0.95, 0.9)), width: 2 });
  }

  private drawDoor(x: number, y: number, w: number, h: number): void {
    this.g.rect(x + w * 0.3, y + h * 0.15, w * 0.4, h * 0.65).fill(Color.hex(Color.rgb(0.15, 0.15, 0.15)));
    this.g.rect(x + w * 0.3, y + h * 0.15, w * 0.4, h * 0.65).stroke({ color: Color.hex(Color.rgb(0.3, 0.3, 0.3)), width: 3 });
    this.g.circle(x + w * 0.65, y + h * 0.48, 4).fill(Color.hex(Color.rgb(0.8, 0.8, 0.8)));
  }

  // ── Bio/fungus interiors ─────────────────────────────────────────────────
  private drawSporeChamber(x: number, y: number, w: number, h: number): void {
    const purple = Color.rgb(0.72, 0.45, 0.85);
    const glow = Color.rgb(0.85, 0.60, 1.0);
    const t = this.elapsedMs;
    const pulse = 0.7 + 0.3 * Math.abs(Math.sin(t * 0.0024));

    // Central giant mushroom — the showcase. Wide cap with bioluminescent halo.
    const ccx = x + w * 0.5;
    const ccy = y + h * 0.62;
    const stemH = Math.min(h * 0.18, 22);
    this.g.rect(ccx - 3.5, ccy - 2, 7, stemH).fill(Color.hex(Color.rgb(0.90, 0.82, 0.66)));
    // Cap glow halo
    const haloR = 22 * pulse;
    const haloC: RGBA = { r: glow.r, g: glow.g, b: glow.b, a: 1 };
    this.g.circle(ccx, ccy, haloR).fill({ color: Color.hex(haloC), alpha: 0.10 * pulse });
    this.g.circle(ccx, ccy, haloR * 0.7).fill({ color: Color.hex(haloC), alpha: 0.16 * pulse });
    // Cap dome (ellipse-y)
    this.g.ellipse(ccx, ccy - 1, 16, 13).fill(Color.hex({ r: purple.r * pulse, g: purple.g * pulse, b: purple.b * pulse, a: 1 }));
    this.g.ellipse(ccx, ccy - 4, 11, 8).fill({ color: Color.hex(glow), alpha: 0.55 * pulse });
    // Cap underside ring (gills)
    this.g.ellipse(ccx, ccy + 6, 14, 3).fill({ color: Color.hex(Color.rgb(0.30, 0.18, 0.42)), alpha: 0.85 });

    // Side mushrooms — smaller, offset
    const sides: Array<[number, number, number]> = [
      [x + w * 0.20, y + h * 0.72, 0.7],
      [x + w * 0.80, y + h * 0.72, 0.6],
    ];
    for (const [sx, sy, scale] of sides) {
      this.g.rect(sx - 2, sy - 2, 4, 10 * scale).fill(Color.hex(Color.rgb(0.85, 0.78, 0.62)));
      const sp = pulse * 0.92;
      this.g.circle(sx, sy, 6 * scale).fill({ color: Color.hex(haloC), alpha: 0.12 });
      this.g.ellipse(sx, sy - 1, 7 * scale, 5 * scale).fill(Color.hex({ r: purple.r * sp, g: purple.g * sp, b: purple.b * sp, a: 1 }));
      this.g.circle(sx, sy - 3, 2.5 * scale).fill({ color: Color.hex(glow), alpha: 0.45 * pulse });
    }

    // Floating spores — drift up + sideways, alpha fades in & out.
    for (let i = 0; i < 14; i++) {
      const baseX = x + w * (0.10 + (i * 0.061) % 0.80);
      const cycleS = 4 + (i % 3) * 1.2;
      const phase = (t * 0.001 + i * 0.41) % cycleS;
      const lifeT = phase / cycleS;
      const sy = y + h * 0.78 - lifeT * h * 0.55;
      const sx = baseX + Math.sin(t * 0.001 + i) * 4;
      const aa = Math.sin(lifeT * Math.PI) * 0.9;
      const sCol = i % 2 === 0 ? glow : purple;
      this.g.circle(sx, sy, 1.4).fill({ color: Color.hex(sCol), alpha: aa });
    }
  }

  private drawMycelium(x: number, y: number, w: number, h: number): void {
    const cyan = Color.rgb(0.30, 0.78, 0.72);
    const cyanGlow = Color.rgb(0.50, 0.95, 0.88);
    const t = this.elapsedMs;

    // Network — vertical strands with horizontal cross-links.
    const strands = 6;
    for (let i = 0; i < strands; i++) {
      const xi = x + w * (0.10 + i * 0.16);
      const sway = Math.sin(t * 0.0012 + i) * 4;
      this.g.moveTo(xi, y + h * 0.18).lineTo(xi + sway, y + h * 0.85)
        .stroke({ color: Color.hex({ r: cyan.r * 0.55, g: cyan.g * 0.55, b: cyan.b * 0.55, a: 1 }), width: 1.5 });
    }
    // Cross-links
    for (let i = 0; i < strands - 1; i++) {
      const x1 = x + w * (0.10 + i * 0.16);
      const x2 = x + w * (0.10 + (i + 1) * 0.16);
      const yMid = y + h * (0.40 + (i % 2) * 0.18);
      this.g.moveTo(x1, yMid).lineTo(x2, yMid + (i % 2 === 0 ? -3 : 3))
        .stroke({ color: Color.hex({ r: cyan.r * 0.45, g: cyan.g * 0.45, b: cyan.b * 0.45, a: 1 }), width: 1, alpha: 0.7 });
    }
    // Pulsing bio-nodes flowing along strands
    for (let i = 0; i < strands; i++) {
      const xi = x + w * (0.10 + i * 0.16);
      const phase = (t * 0.0007 + i * 0.31) % 1;
      const ny = y + h * (0.18 + phase * 0.65);
      const nAlpha = Math.sin(phase * Math.PI);
      this.g.circle(xi, ny, 2.2).fill({ color: Color.hex(cyanGlow), alpha: 0.85 * nAlpha });
      this.g.circle(xi, ny, 4).fill({ color: Color.hex(cyan), alpha: 0.30 * nAlpha });
    }
    // Mushrooms growing from the floor
    for (let i = 0; i < 4; i++) {
      const icx = x + w * (0.18 + i * 0.21);
      const icy = y + h * 0.86;
      this.g.rect(icx - 1, icy - 7, 2, 7).fill(Color.hex(Color.rgb(0.85, 0.82, 0.72)));
      this.g.circle(icx, icy - 7, 5).fill({ color: Color.hex(cyanGlow), alpha: 0.30 });
      this.g.circle(icx, icy - 7, 4).fill(Color.hex(cyan));
    }
  }

  private drawFungusKitchen(x: number, y: number, w: number, h: number): void {
    this.g.rect(x + w * 0.15, y + h * 0.55, w * 0.7, h * 0.12).fill(Color.hex(Color.rgb(0.35, 0.28, 0.20)));
    const potCx = x + w * 0.5;
    const potCy = y + h * 0.48;
    this.g.rect(potCx - 12, potCy - 6, 24, 14).fill(Color.hex(Color.rgb(0.15, 0.15, 0.15)));
    const pulse = Math.abs(Math.sin(this.elapsedFrames * 0.05)) * 0.4 + 0.4;
    for (let i = 0; i < 3; i++) {
      const vx = potCx - 6 + i * 6;
      this.g.circle(vx, potCy - 10, 2).fill({ color: Color.hex(Color.rgb(0.72, 0.85, 0.72)), alpha: pulse });
    }
    for (let i = 0; i < 3; i++) {
      const mx = x + w * (0.22 + i * 0.22);
      this.g.rect(mx - 1, y + h * 0.52, 2, 6).fill(Color.hex(Color.rgb(0.82, 0.72, 0.55)));
      this.g.circle(mx, y + h * 0.52, 3).fill(Color.hex(Color.rgb(0.78, 0.45, 0.35)));
    }
  }

  private drawHyphaeForge(x: number, y: number, w: number, h: number): void {
    const amber = Color.rgb(0.91, 0.58, 0.23);
    const pulse = Math.abs(Math.sin(this.elapsedFrames * 0.03)) * 0.5 + 0.5;
    this.g.rect(x + w * 0.2, y + h * 0.65, w * 0.6, h * 0.1).fill(Color.hex(Color.rgb(0.25, 0.12, 0.06)));
    for (let i = 0; i < 5; i++) {
      const ex = x + w * (0.25 + i * 0.12);
      const a: RGBA = { r: amber.r * pulse, g: amber.g * pulse, b: amber.b * pulse, a: 1 };
      this.g.circle(ex, y + h * 0.70, 3).fill(Color.hex(a));
    }
    for (let i = 0; i < 4; i++) {
      const rx = x + w * (0.25 + i * 0.17);
      const points: Array<[number, number]> = [
        [rx, y + h * 0.65], [rx + 3, y + h * 0.5], [rx - 2, y + h * 0.35], [rx + 1, y + h * 0.22],
      ];
      for (let p = 0; p < points.length - 1; p++) {
        this.g.moveTo(points[p]![0], points[p]![1])
          .lineTo(points[p + 1]![0], points[p + 1]![1])
          .stroke({ color: Color.hex(Color.rgb(0.55, 0.35, 0.18)), width: 2 });
      }
    }
  }

  private drawNeuralMushroom(x: number, y: number, w: number, h: number): void {
    const green = Color.rgb(0.30, 0.78, 0.60);
    const greenBright = Color.rgb(0.6, 0.95, 0.8);
    const t = this.elapsedMs;
    const nodes: Array<[number, number]> = [
      [x + w * 0.2, y + h * 0.30], [x + w * 0.5, y + h * 0.40], [x + w * 0.8, y + h * 0.30],
      [x + w * 0.3, y + h * 0.65], [x + w * 0.7, y + h * 0.65],
    ];

    // Edges with travelling pulse — for each edge, draw the line dim then a
    // bright bead following along the line, simulating signal propagation.
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!; const b = nodes[j]!;
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) < w * 0.5) edges.push([i, j]);
      }
    }
    for (let e = 0; e < edges.length; e++) {
      const [i, j] = edges[e]!;
      const a = nodes[i]!; const b = nodes[j]!;
      this.g.moveTo(a[0], a[1]).lineTo(b[0], b[1])
        .stroke({ color: Color.hex({ r: green.r * 0.3, g: green.g * 0.3, b: green.b * 0.3, a: 1 }), width: 1 });
      // Bead position 0..1 along the edge
      const phase = (t * 0.0008 + e * 0.27) % 1;
      const bx = a[0] + (b[0] - a[0]) * phase;
      const by = a[1] + (b[1] - a[1]) * phase;
      this.g.circle(bx, by, 1.6).fill({ color: Color.hex(greenBright), alpha: 0.95 });
      this.g.circle(bx, by, 3).fill({ color: Color.hex(green), alpha: 0.30 });
    }

    // Nodes — soft halo + core pulsing slightly out of phase per node.
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!;
      const np = 0.5 + 0.5 * Math.abs(Math.sin(t * 0.0022 + i * 0.7));
      this.g.circle(n[0], n[1], 7).fill({ color: Color.hex(greenBright), alpha: 0.18 * np });
      this.g.circle(n[0], n[1], 5).fill(Color.hex({ r: green.r * np, g: green.g * np, b: green.b * np, a: 1 }));
      this.g.circle(n[0], n[1], 3).fill(Color.hex(greenBright));
    }
  }
}
