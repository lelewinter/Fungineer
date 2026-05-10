import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { Color, type RGBA } from '../../core/Color';
import { Signal } from '../../core/Signal';
import { seededRng, strHash } from '../../core/hash';
import { GameConfig } from '../../state/GameConfig';
import { HubData, type HubRoom } from '../../state/HubData';
import { HubState } from '../../state/HubState';

/** Mirrors src/scenes/hub/HubRenderer.gd — bunker grid, room interiors,
 *  ambient spores, lighting, zone badges. Uses a single Graphics rebuilt each frame
 *  (cheap at this scene complexity). */
export class HubRenderer extends Container {
  readonly roomClicked = new Signal<[roomId: string]>();

  private cellWidth: number;
  private roomYOffset: Record<string, number> = {};
  private g = new Graphics();
  private hitLayer = new Container();
  private silhouetteLabels = new Map<string, Text>();
  private elapsedFrames = 0;
  private variantColors = HubState.getVariantData();
  private disposers: Array<() => void> = [];

  constructor() {
    super();
    this.cellWidth = GameConfig.VIEWPORT_WIDTH / 6;
    this.calculateLayout();
    this.addChild(this.g);
    this.addChild(this.hitLayer);
    this.buildHitboxes();
    this.disposers.push(HubState.hubVariantChanged.connect(() => this.applyVariant()));
    this.disposers.push(HubState.roomUnlockedSignal.connect(() => this.refreshSilhouettes()));
  }

  destroyRenderer(): void {
    for (const d of this.disposers) d();
    this.disposers = [];
    this.destroy({ children: true });
  }

  /** Called every frame from HubScene.update. */
  tick(dt: number): void {
    this.elapsedFrames += Math.round(dt * 60);
    this.redraw();
  }

  private calculateLayout(): void {
    let y = 0;
    for (const room of HubData.ROOMS) {
      this.roomYOffset[room.id] = y;
      y += room.h;
    }
  }

  private buildHitboxes(): void {
    for (const room of HubData.ROOMS) {
      const x = this.cellWidth * room.col;
      const y = this.roomYOffset[room.id] ?? 0;
      const w = this.cellWidth * room.w;
      const hit = new Graphics().rect(0, 0, w, room.h).fill({ color: 0x000000, alpha: 0.001 });
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
        label.y = y + Math.min(room.h * 0.5, room.h * 0.5 + 25) + 12;
        label.visible = !HubState.isRoomUnlocked(room.id);
        this.addChild(label);
        this.silhouetteLabels.set(room.id, label);
      }
    }
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
  private redraw(): void {
    this.g.clear();
    this.drawSideWalls();
    for (const room of HubData.ROOMS) this.drawRoom(room);
    this.drawGridLines();
    this.drawAmbientSpores();
  }

  /** Dirt/rock side walls flanking underground floors. Mirrors the Hub.html
   *  cross-section detail — adds vertical depth to the bunker. */
  private drawSideWalls(): void {
    let totalH = 0;
    let surfaceH = 0;
    for (const room of HubData.ROOMS) {
      totalH += room.h;
      if (room.type === 'surface' || room.type === 'surface-exit') surfaceH += room.h;
    }
    const wallW = 10;
    const ww = GameConfig.VIEWPORT_WIDTH;
    const rock = Color.rgb(0.04, 0.03, 0.02);
    const seam = Color.rgb(0.18, 0.13, 0.09);
    // Layered fill so the wall doesn't look flat
    this.g
      .rect(0, surfaceH, wallW, totalH - surfaceH).fill(Color.hex(rock))
      .rect(ww - wallW, surfaceH, wallW, totalH - surfaceH).fill(Color.hex(rock));
    // Horizontal strata lines every ~22px
    for (let y = surfaceH + 12; y < totalH; y += 22 + ((y * 13) % 9)) {
      this.g.moveTo(0, y).lineTo(wallW - 1, y + (((y * 7) % 4) - 2))
        .stroke({ color: Color.hex(seam), width: 1, alpha: 0.55 });
      this.g.moveTo(ww - wallW + 1, y + (((y * 11) % 4) - 2)).lineTo(ww, y)
        .stroke({ color: Color.hex(seam), width: 1, alpha: 0.55 });
    }
    // Inner seam line where wall meets rooms
    this.g.moveTo(wallW, surfaceH).lineTo(wallW, totalH)
      .stroke({ color: Color.hex(seam), width: 1.5, alpha: 0.7 });
    this.g.moveTo(ww - wallW, surfaceH).lineTo(ww - wallW, totalH)
      .stroke({ color: Color.hex(seam), width: 1.5, alpha: 0.7 });
  }

  private drawRoom(room: HubRoom): void {
    const x = this.cellWidth * room.col;
    const y = this.roomYOffset[room.id] ?? 0;
    const w = this.cellWidth * room.w;
    const h = room.h;

    if (!HubState.isRoomUnlocked(room.id)) {
      this.drawLockedRoom(room, x, y, w, h);
      return;
    }

    this.g.rect(x, y, w, h).fill(Color.hex(this.getRoomBaseColor(room)));

    // Save the drawing offset for interior. Pixi Graphics supports translate via no-op
    // — we just pass absolute coords to the helpers.
    this.drawRoomInterior(room, x, y, w, h);
    this.applyRoomLighting(room, x, y, w, h);
    this.drawRoomVignette(x, y, w, h);
    this.drawRoomTopLight(x, y, w, h, room);
    this.drawZoneBadgeIfNeeded(room, x, y, w, h);
    this.g.rect(x, y, w, h).stroke({ color: Color.hex(Color.rgb(0.15, 0.15, 0.15)), width: 1 });
  }

  /** Darken the room edges with a feathered alpha ring to give depth. */
  private drawRoomVignette(x: number, y: number, w: number, h: number): void {
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const t = (i + 1) / layers;
      const ringSize = t * 6;
      this.g
        .rect(x, y, w, ringSize)
        .fill({ color: 0x000000, alpha: 0.05 + 0.04 * (1 - t) })
        .rect(x, y + h - ringSize, w, ringSize)
        .fill({ color: 0x000000, alpha: 0.05 + 0.04 * (1 - t) })
        .rect(x, y + ringSize, ringSize, h - ringSize * 2)
        .fill({ color: 0x000000, alpha: 0.05 + 0.04 * (1 - t) })
        .rect(x + w - ringSize, y + ringSize, ringSize, h - ringSize * 2)
        .fill({ color: 0x000000, alpha: 0.05 + 0.04 * (1 - t) });
    }
  }

  /** A subtle horizontal highlight near the top edge — like a ceiling light strip. */
  private drawRoomTopLight(x: number, y: number, w: number, _h: number, room: HubRoom): void {
    const c = this.getLightColor(room.light);
    this.g
      .rect(x + 2, y + 2, w - 4, 1.5)
      .fill({ color: Color.hex(c), alpha: 0.35 });
    // Soft glow under the strip
    for (let i = 0; i < 4; i++) {
      this.g
        .rect(x + 2, y + 4 + i, w - 4, 1)
        .fill({ color: Color.hex(c), alpha: 0.04 - i * 0.008 });
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
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;
    const boxW = Math.min(w * 0.55, 80);
    const boxH = Math.min(h * 0.45, 50);
    this.g.rect(cx - boxW * 0.5, cy - boxH * 0.5, boxW, boxH)
      .fill({ color: Color.hex(Color.rgb(0.28, 0.25, 0.22)), alpha: 0.35 });
    this.g.rect(cx - boxW * 0.5, cy - boxH * 0.5, boxW, boxH)
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
      case 'tunnel-warm': return Color.rgb(0.15, 0.08, 0.04);
      case 'tunnel-cool': return Color.rgb(0.05, 0.10, 0.12);
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
      case 'tunnel-warm': this.drawRails(x, y, w, h, Color.rgb(0.91, 0.58, 0.23)); break;
      case 'tunnel-cool': this.drawRails(x, y, w, h, Color.rgb(0.0, 1.0, 0.533)); break;
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
    const cx = x + w - 10;
    const cy = (this.roomYOffset[room.id] ?? 0) + 10;
    // Outer halo (large, low alpha)
    this.g.circle(cx, cy, 14).fill({ color: Color.hex(zone.color), alpha: 0.08 * pulse });
    this.g.circle(cx, cy, 10).fill({ color: Color.hex(zone.color), alpha: 0.16 * pulse });
    // Bright core
    const c: RGBA = { r: zone.color.r * pulse, g: zone.color.g * pulse, b: zone.color.b * pulse, a: 1 };
    this.g.circle(cx, cy, 5).fill(Color.hex(c));
    // Hot center
    this.g.circle(cx, cy, 2.5).fill({ color: 0xffffff, alpha: 0.85 * pulse });
  }

  private drawGridLines(): void {
    let totalH = 0;
    for (const room of HubData.ROOMS) totalH += room.h;
    for (let col = 0; col < 7; col++) {
      const x = this.cellWidth * col;
      this.g.moveTo(x, 0).lineTo(x, totalH)
        .stroke({ color: Color.hex(this.variantColors.grid), width: 1 });
    }
  }

  private drawAmbientSpores(): void {
    const W = GameConfig.VIEWPORT_WIDTH;
    const H = GameConfig.VIEWPORT_HEIGHT;
    const t = this.elapsedFrames * (1000 / 60) * 0.0006;
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

  private isPointInUnlockedRoom(px: number, py: number): boolean {
    for (const room of HubData.ROOMS) {
      const rx = this.cellWidth * room.col;
      const ry = this.roomYOffset[room.id] ?? 0;
      const rw = this.cellWidth * room.w;
      const rh = room.h;
      if (px >= rx && px <= rx + rw && py >= ry && py <= ry + rh) {
        return HubState.isRoomUnlocked(room.id);
      }
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
      const cx = x + w * 0.2 + i * w * 0.2;
      this.g.circle(cx, tableY + tableH * 0.5, 6).fill(Color.hex(amber));
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
      Color.rgb(1.0, 0.4, 0.2),
      Color.rgb(0.8, 0.2, 0.2),
      Color.rgb(0.6, 0.3, 0.15),
      Color.rgb(0.7, 0.5, 0.3),
      Color.rgb(0.5, 0.7, 0.4),
      Color.rgb(0.4, 0.6, 0.5),
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

  private drawRails(x: number, y: number, w: number, h: number, c: RGBA): void {
    const railY = y + h * 0.5;
    this.g.moveTo(x, railY).lineTo(x + w, railY).stroke({ color: Color.hex(c), width: 4 });
    for (let i = 0; i < 8; i++) {
      const cx = x + (w / 8) * (i + 0.5);
      this.g.moveTo(cx, railY - 12).lineTo(cx, railY + 12).stroke({ color: Color.hex(c), width: 2 });
    }
  }

  // ── Bio/fungus interiors ─────────────────────────────────────────────────
  private drawSporeChamber(x: number, y: number, w: number, h: number): void {
    const purple = Color.rgb(0.72, 0.45, 0.85);
    const glow = Color.rgb(0.85, 0.60, 1.0);
    const pulse = Math.abs(Math.sin(this.elapsedFrames * 0.04)) * 0.3 + 0.7;
    for (let i = 0; i < 3; i++) {
      const cx = x + w * (0.22 + i * 0.29);
      const cy = y + h * 0.62;
      this.g.rect(cx - 2, cy, 4, 14).fill(Color.hex(Color.rgb(0.85, 0.78, 0.62)));
      const mod1: RGBA = { r: purple.r * pulse, g: purple.g * pulse, b: purple.b * pulse, a: 1 };
      this.g.circle(cx, cy, 8).fill(Color.hex(mod1));
      const mod2: RGBA = { r: glow.r * pulse * 0.6, g: glow.g * pulse * 0.6, b: glow.b * pulse * 0.6, a: 1 };
      this.g.circle(cx, cy - 2, 6).fill(Color.hex(mod2));
    }
    for (let i = 0; i < 6; i++) {
      const sx = x + w * (0.15 + i * 0.12);
      const sy = y + h * 0.3 + Math.sin(this.elapsedFrames * 0.03 + i) * 6;
      const sp: RGBA = { r: purple.r * 0.8, g: purple.g * 0.8, b: purple.b * 0.8, a: 1 };
      this.g.circle(sx, sy, 1.5).fill(Color.hex(sp));
    }
  }

  private drawMycelium(x: number, y: number, w: number, h: number): void {
    const cyan = Color.rgb(0.30, 0.78, 0.72);
    for (let i = 0; i < 5; i++) {
      const x1 = x + w * (0.1 + i * 0.18);
      const x2 = x1 + Math.sin(i) * 8;
      const c: RGBA = { r: cyan.r * 0.6, g: cyan.g * 0.6, b: cyan.b * 0.6, a: 1 };
      this.g.moveTo(x1, y + h * 0.25).lineTo(x2, y + h * 0.75)
        .stroke({ color: Color.hex(c), width: 1.5 });
    }
    for (let i = 0; i < 4; i++) {
      const cx = x + w * (0.15 + i * 0.22);
      const cy = y + h * 0.75;
      this.g.rect(cx - 1, cy - 6, 2, 6).fill(Color.hex(Color.rgb(0.85, 0.82, 0.72)));
      this.g.circle(cx, cy - 6, 4).fill(Color.hex(cyan));
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
      const points = [
        [rx, y + h * 0.65],
        [rx + 3, y + h * 0.5],
        [rx - 2, y + h * 0.35],
        [rx + 1, y + h * 0.22],
      ] as const;
      for (let p = 0; p < points.length - 1; p++) {
        this.g.moveTo(points[p]![0], points[p]![1])
          .lineTo(points[p + 1]![0], points[p + 1]![1])
          .stroke({ color: Color.hex(Color.rgb(0.55, 0.35, 0.18)), width: 2 });
      }
    }
  }

  private drawNeuralMushroom(x: number, y: number, w: number, h: number): void {
    const green = Color.rgb(0.30, 0.78, 0.60);
    const pulse = Math.abs(Math.sin(this.elapsedFrames * 0.04)) * 0.5 + 0.5;
    const nodes: Array<[number, number]> = [
      [x + w * 0.2, y + h * 0.3],
      [x + w * 0.5, y + h * 0.4],
      [x + w * 0.8, y + h * 0.3],
      [x + w * 0.3, y + h * 0.65],
      [x + w * 0.7, y + h * 0.65],
    ];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (dist < w * 0.5) {
          const c: RGBA = { r: green.r * pulse * 0.4, g: green.g * pulse * 0.4, b: green.b * pulse * 0.4, a: 1 };
          this.g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ color: Color.hex(c), width: 1 });
        }
      }
    }
    for (const n of nodes) {
      const c: RGBA = { r: green.r * pulse, g: green.g * pulse, b: green.b * pulse, a: 1 };
      this.g.circle(n[0], n[1], 5).fill(Color.hex(c));
      this.g.circle(n[0], n[1], 3).fill(Color.hex(Color.rgb(0.6, 0.95, 0.8)));
    }
  }
}
