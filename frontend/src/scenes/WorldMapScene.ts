import { Container, Graphics, Text } from 'pixi.js';
import { Scene } from '../core/Scene';
import { sceneManager } from '../core/SceneManager';
import { audioManager } from '../core/AudioManager';
import { Color, type RGBA } from '../core/Color';
import { GameConfig } from '../state/GameConfig';
import { HubState, ROCKET_RECIPE } from '../state/HubState';
import { ROCKET_BAY, ZONES, type ZoneData } from '../state/Zones';
import { ZoneRoom } from './ZoneRoom';
import { ConfirmRaidDialog } from '../ui/ConfirmRaidDialog';
import { PixiButton } from '../ui/PixiButton';
import { StubRunScene } from './runs/StubRunScene';
import { HordasScene } from './runs/HordasScene';
import { FieldControlScene } from './runs/FieldControlScene';
import { SacrificeScene } from './runs/SacrificeScene';
import { HubScene } from './hub/HubScene';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;
const SURFACE_Y = 72;
const STOCK_H = 104;

/** zone_id grid; -1 is the rocket bay slot. */
const FLOOR_LAYOUT: number[][] = [
  [0, 7, 3], // top
  [4, -1, 1],
  [5, 6, 2], // base
];

const ZONE_DIALOGUE: Record<number, string> = {
  0: '"Patrulha de IA no Setor 7. Têm sucata lá... valem o risco? Bom, claro que valem!"\n— Dr. Valério',
  1: '"Instalação de processamento de IA. Alta segurança. Mas os componentes lá dentro são imprescindíveis."\n— Dr. Valério',
  2: '"Câmaras de circuito integrado. Placas lógicas intactas! Basta não pisar nos alarmes. Fácil."\n— Dr. Valério',
  3: '"Depósito de combustível. Sessenta segundos antes de colapsar. Cronômetro sorrindo para mim."\n— Dr. Valério',
  4: '"Zona de transmissão. A IA controla o território por sinais. Temos que perturbá-los. Gentilmente."\n— Dr. Valério',
  5: '"Laboratório bioprogramável. A IA criou isso para controlar organismos. Nós vamos reapropriá-lo."\n— Dr. Valério',
  6: '"Complexo subterrâneo abandonado. Drones de patrulha ainda operacionais. Os corredores são um labirinto."\n— Dr. Valério',
  7: '"Centro de detenção da IA. Recursos e sobreviventes? Cada segundo lá dentro tem um preço."\n— Dr. Valério',
};

/** Mirrors src/scenes/WorldMapScene.gd — bunker cross-section view. */
export class WorldMapScene extends Scene {
  private bg = new Graphics();
  private skyG = new Graphics();
  private skyAccent = new Graphics();
  private floorsBg = new Graphics();
  private floorsLayer = new Container();
  private elevator = new Graphics();
  private stockBg = new Graphics();
  private stockText = new Container();
  private skyText = new Container();
  private aiDrones = new Graphics();
  private detailPanel: Container | null = null;
  private rooms: ZoneRoom[] = [];
  private elapsed = 0;
  private skyMessageA!: Text;
  private skyMessageB!: Text;
  private confirmDialog: ConfirmRaidDialog | null = null;
  private pendingZone = '';
  private keyHandler!: (e: KeyboardEvent) => void;

  override async enter(): Promise<void> {
    this.bg.rect(0, 0, VW, VH).fill(Color.hex(Color.rgb(0.051, 0.051, 0.051)));
    this.root.addChild(this.bg);

    this.root.addChild(this.skyG);
    this.root.addChild(this.skyAccent);
    this.root.addChild(this.skyText);
    this.root.addChild(this.aiDrones);
    this.root.addChild(this.floorsBg);
    this.root.addChild(this.floorsLayer);
    this.root.addChild(this.elevator);
    this.root.addChild(this.stockBg);
    this.root.addChild(this.stockText);

    this.buildSkyText();
    this.buildRoomLayout();
    this.buildBackToHub();

    audioManager.playMusic('res://assets/audio/music/menu.wav', { loop: true, volume: 0.3, fadeMs: 400 });

    this.keyHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (this.detailPanel?.visible) this.detailPanel.visible = false;
        else if (this.confirmDialog) void this.confirmDialog.requestClose();
        else void sceneManager.replace(new HubScene());
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  override update(dt: number): void {
    this.elapsed += dt;
    this.redrawDynamic();
  }

  override async exit(): Promise<void> {
    window.removeEventListener('keydown', this.keyHandler);
    audioManager.stopMusic(200);
  }

  // ── Build ──────────────────────────────────────────────────────────────
  private buildSkyText(): void {
    this.skyMessageA = new Text({
      text: '⬤  ZONA IA CONTROLADA — ACESSO PROIBIDO  ⬤',
      style: {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 9,
        fill: Color.hex(Color.rgb(0.20, 0.60, 0.95)),
      },
    });
    this.skyMessageA.x = VW * 0.5 - 90;
    this.skyMessageA.y = 22;
    this.skyText.addChild(this.skyMessageA);

    this.skyMessageB = new Text({
      text: 'SUPERFÍCIE — ZONA DE PERIGO',
      style: {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 10,
        fill: Color.hex(Color.rgb(0.85, 0.3, 0.2)),
      },
    });
    this.skyMessageB.x = VW * 0.5 - 60;
    this.skyMessageB.y = 44;
    this.skyText.addChild(this.skyMessageB);
  }

  private buildRoomLayout(): void {
    const floorsH = VH - SURFACE_Y - STOCK_H;
    const floorH = floorsH / FLOOR_LAYOUT.length;
    const roomW = VW / 3;
    const wallT = 6;

    for (let fi = 0; fi < FLOOR_LAYOUT.length; fi++) {
      const row = FLOOR_LAYOUT[fi]!;
      for (let ci = 0; ci < row.length; ci++) {
        const zoneId = row[ci]!;
        const x = ci * roomW;
        const y = SURFACE_Y + fi * floorH;

        // Wall (outer rect)
        const wall = new Graphics()
          .rect(x, y, roomW, floorH)
          .fill(Color.hex(Color.rgb(0.088, 0.08, 0.075)));
        this.floorsLayer.addChild(wall);

        if (zoneId < 0) {
          // Rocket bay
          const room = new ZoneRoom({
            width: roomW - wallT * 2,
            height: floorH - wallT * 2,
            accentColor: ROCKET_BAY.accent_color,
            zoneName: ROCKET_BAY.zone_name,
            roomSubtitle: ROCKET_BAY.room_subtitle,
            locked: true,
          });
          room.x = x + wallT;
          room.y = y + wallT;
          this.floorsLayer.addChild(room);
          continue;
        }

        const zd = ZONES[zoneId]!;
        const unlocked = HubState.zones_unlocked[zoneId] === true;
        const room = new ZoneRoom({
          width: roomW - wallT * 2,
          height: floorH - wallT * 2,
          accentColor: zd.accent_color,
          zoneName: zd.zone_name,
          roomSubtitle: zd.room_subtitle,
          locked: !unlocked,
          onRaid: () => this.openConfirm(zd),
        });
        room.x = x + wallT;
        room.y = y + wallT;
        room.eventMode = 'static';
        room.cursor = unlocked ? 'pointer' : 'not-allowed';
        room.on('pointertap', () => {
          if (unlocked) this.showDetail(zoneId, zd);
        });
        this.floorsLayer.addChild(room);
        this.rooms.push(room);
      }
    }
  }

  private buildBackToHub(): void {
    const back = new PixiButton({
      label: '← Bunker',
      width: 110,
      height: 22,
      fontSize: 10,
      onClick: () => {
        void sceneManager.replace(new HubScene());
      },
    });
    back.x = 8;
    back.y = SURFACE_Y - 30;
    this.skyText.addChild(back);
  }

  // ── Dynamic redraw (per frame) ─────────────────────────────────────────
  private redrawDynamic(): void {
    const dp = 0.5 + 0.5 * Math.sin(this.elapsed * 2.2);

    // Sky background
    this.skyG.clear();
    this.skyG.rect(0, 0, VW, SURFACE_Y).fill(Color.hex(Color.rgb(0.04, 0.045, 0.08)));
    this.drawCitySilhouette();
    this.skyMessageA.alpha = 0.65 * dp;
    this.skyMessageB.alpha = 0.45 * dp;

    // Surface line
    this.skyG.moveTo(0, SURFACE_Y).lineTo(VW, SURFACE_Y).stroke({ color: Color.hex(Color.rgb(0.3, 0.22, 0.1)), width: 2.5 });

    // Floors fill
    this.floorsBg.clear();
    this.floorsBg.rect(0, SURFACE_Y, VW, VH - SURFACE_Y).fill(Color.hex(Color.rgb(0.075, 0.068, 0.062)));

    // AI drones
    this.drawAiDrones();

    // Elevator
    this.drawElevator();

    // Stock panel
    this.drawStockPanel();

    // Glow border on unlocked rooms
    for (const room of this.rooms) {
      const gp = 0.5 + 0.5 * Math.sin(this.elapsed * 3.2);
      room.alpha = 0.85 + 0.15 * gp;
    }
  }

  private drawCitySilhouette(): void {
    const buildings: Array<[number, number, number, number]> = [
      [0, 10, 45, 52], [52, 22, 36, 40], [94, 6, 32, 56],
      [132, 24, 44, 38], [182, 12, 26, 50], [214, 20, 55, 42],
      [276, 5, 38, 57], [320, 18, 48, 44], [374, 14, 30, 48],
      [410, 24, 62, 38],
    ];
    const bc = Color.rgb(0.055, 0.065, 0.10);
    for (const b of buildings) this.skyG.rect(b[0], b[1], b[2], b[3]).fill(Color.hex(bc));

    const wcIa: RGBA = { r: 0.20, g: 0.55, b: 0.90, a: 1 };
    const wcWarm: RGBA = { r: 0.65, g: 0.6, b: 0.28, a: 1 };
    for (const b of buildings) {
      if (b[2] > 38) {
        this.skyG.rect(b[0] + 6, b[1] + 8, 5, 4).fill({ color: Color.hex(wcIa), alpha: 0.40 });
        this.skyG.rect(b[0] + 6, b[1] + 20, 5, 4).fill({ color: Color.hex(wcIa), alpha: 0.40 });
        if (b[2] > 50) {
          this.skyG.rect(b[0] + 22, b[1] + 8, 5, 4).fill({ color: Color.hex(wcWarm), alpha: 0.25 });
        }
      }
    }
    const antX = 214 + 27;
    this.skyG.moveTo(antX, 20).lineTo(antX, 4)
      .stroke({ color: Color.hex(Color.rgb(0.20, 0.60, 0.95)), width: 1.5, alpha: 0.7 });
    const blink = 0.5 + 0.5 * Math.sin(this.elapsed * 4);
    this.skyG.circle(antX, 4, 2.5).fill({ color: Color.hex(Color.rgb(0.90, 0.10, 0.10)), alpha: blink });
  }

  private drawAiDrones(): void {
    this.aiDrones.clear();
    const positions: Array<[number, number]> = [
      [60, 30], [190, 18], [310, 28], [430, 16],
    ];
    for (let i = 0; i < positions.length; i++) {
      const [bx, by] = positions[i]!;
      const bob = Math.sin(this.elapsed * 2.5 + i * 1.3) * 3;
      const px = bx;
      const py = by + bob;
      const scanAlpha = 0.30 + 0.20 * Math.sin(this.elapsed * 3 + i);
      this.aiDrones.poly([
        px, py - 6,
        px + 5, py,
        px, py + 4,
        px - 5, py,
      ]).fill({ color: Color.hex(Color.rgb(0.20, 0.60, 0.95)), alpha: 0.7 });
      this.aiDrones.circle(px, py, 1.8).fill({ color: Color.hex(Color.rgb(0.90, 0.95, 1.00)), alpha: 0.9 });
      this.aiDrones.moveTo(px, py + 4).lineTo(px, py + 18)
        .stroke({ color: Color.hex(Color.rgb(0.20, 0.60, 0.95)), width: 1.5, alpha: scanAlpha });
    }
  }

  private drawElevator(): void {
    this.elevator.clear();
    const sx = 0;
    const sy = SURFACE_Y + 2;
    const sw = 8;
    const sh = VH - SURFACE_Y - STOCK_H - 4;
    this.elevator
      .rect(sx, sy, sw, sh).fill(Color.hex(Color.rgb(0.1, 0.09, 0.085)))
      .rect(sx + 2, sy + 2, sw - 4, sh - 4).fill(Color.hex(Color.rgb(0.085, 0.078, 0.075)));
    const cabinY = sy + sh * 0.45;
    this.elevator
      .rect(sx + 1, cabinY, sw - 2, 18).fill(Color.hex(Color.rgb(0.22, 0.2, 0.18)))
      .rect(sx + 2, cabinY + 2, sw - 4, 14).fill(Color.hex(Color.rgb(0.28, 0.26, 0.24)));
  }

  private drawStockPanel(): void {
    const topY = VH - STOCK_H;
    this.stockBg.clear();
    this.stockBg.rect(0, topY, VW, VH - topY).fill(Color.hex(Color.rgb(0.05, 0.045, 0.042)))
      .moveTo(0, topY).lineTo(VW, topY).stroke({ color: Color.hex(Color.rgb(0.055, 0.05, 0.048)), width: 2 });

    this.stockText.removeChildren();

    const baseLabel = new Text({
      text: '▼  BASE DE RESISTÊNCIA',
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 10, fill: Color.hex(Color.rgb(0.75, 0.55, 0.25)) },
    });
    baseLabel.alpha = 0.75;
    baseLabel.anchor.set(1, 0);
    baseLabel.x = VW - 10;
    baseLabel.y = topY + 14;
    this.stockText.addChild(baseLabel);

    const rescued = HubState.rescued_characters.length + 1;
    const survivors = new Text({
      text: `Sobreviventes: ${rescued} / 10`,
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 9, fill: Color.hex(Color.rgb(0.55, 0.70, 0.55)) },
    });
    survivors.alpha = 0.8;
    survivors.anchor.set(1, 0);
    survivors.x = VW - 10;
    survivors.y = topY + 26;
    this.stockText.addChild(survivors);

    const pieceIdx = HubState.rocket_pieces_built;
    const nextName = pieceIdx >= ROCKET_RECIPE.length ? 'FOGUETE COMPLETO!' : ROCKET_RECIPE[pieceIdx]!.name;
    const next = new Text({
      text: `Proxima peca: ${nextName}`,
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 11, fill: Color.hex(Color.rgb(0.80, 0.65, 0.25)) },
    });
    next.x = 10;
    next.y = topY + 16;
    this.stockText.addChild(next);

    const labels: Array<[string, string]> = [
      ['scrap', 'Sucata'],
      ['ai_components', 'Comp. IA'],
      ['fragmentos_estruturais', 'Frag. Estru.'],
      ['combustivel_volatil', 'Combustivel'],
      ['nucleo_logico', 'Nucleo Log.'],
      ['sinais_controle', 'Sinais Ctrl.'],
      ['biomassa_adaptativa', 'Biomassa'],
    ];
    const colW = VW * 0.5;
    for (let i = 0; i < labels.length; i++) {
      const [key, lbl] = labels[i]!;
      const amount = (HubState.stock as Record<string, number>)[key] ?? 0;
      const colX = i % 2 === 0 ? 10 : colW + 10;
      const rowY = topY + 30 + Math.floor(i / 2) * 18;
      let needed = 0;
      if (pieceIdx < ROCKET_RECIPE.length) {
        const recipe = ROCKET_RECIPE[pieceIdx] as unknown as Record<string, number | string | undefined>;
        const v = recipe[key];
        if (typeof v === 'number') needed = v;
      }
      const txtCol = needed > 0 ? Color.rgb(0.45, 0.85, 0.45) : Color.rgb(0.55, 0.52, 0.50);
      const t = new Text({
        text: `${lbl}: ${amount}${needed > 0 ? `/${needed}` : ''}`,
        style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 10, fill: Color.hex(txtCol) },
      });
      t.x = colX;
      t.y = rowY;
      this.stockText.addChild(t);
    }
  }

  // ── Detail panel & confirmation ────────────────────────────────────────
  private showDetail(zoneId: number, zone: ZoneData): void {
    audioManager.playSfx('res://assets/audio/sfx/ui/Click_01.wav', 0.6);
    if (!this.detailPanel) this.detailPanel = this.buildDetailPanel();
    this.detailPanel.visible = true;
    this.populateDetailPanel(zoneId, zone);
  }

  private buildDetailPanel(): Container {
    const c = new Container();
    c.zIndex = 50;
    const halfW = 170;
    const halfH = 120;
    c.x = VW / 2;
    c.y = VH / 2;
    const bg = new Graphics()
      .roundRect(-halfW, -halfH, halfW * 2, halfH * 2, 6)
      .fill({ color: Color.hex(Color.rgb(0.07, 0.06, 0.05)), alpha: 0.97 })
      .stroke({ color: Color.hex(Color.rgb(0.45, 0.4, 0.35)), width: 1 });
    c.addChild(bg);
    c.eventMode = 'static';
    c.on('pointertap', (e) => e.stopPropagation());

    const closeOverlay = new Graphics().rect(0, 0, VW, VH).fill({ color: 0x000000, alpha: 0.5 });
    closeOverlay.eventMode = 'static';
    closeOverlay.cursor = 'pointer';
    closeOverlay.on('pointertap', () => { if (this.detailPanel) this.detailPanel.visible = false; });
    closeOverlay.x = -VW / 2;
    closeOverlay.y = -VH / 2;
    c.addChildAt(closeOverlay, 0);

    this.root.addChild(c);
    return c;
  }

  private populateDetailPanel(zoneId: number, zone: ZoneData): void {
    if (!this.detailPanel) return;
    // Strip previously added text/buttons (keep first two: overlay + bg)
    while (this.detailPanel.children.length > 2) {
      const last = this.detailPanel.children[this.detailPanel.children.length - 1]!;
      this.detailPanel.removeChild(last);
      last.destroy();
    }

    const halfW = 170;
    const halfH = 120;
    const padding = 14;

    const name = new Text({
      text: zone.zone_name,
      style: { fontFamily: '"Major Mono Display", "Courier New", monospace', fontSize: 20, fill: Color.hex(Color.rgb(1.0, 0.9, 0.5)), letterSpacing: 3 },
    });
    name.x = -halfW + padding;
    name.y = -halfH + padding;
    this.detailPanel.addChild(name);

    const res = new Text({
      text: `Recurso: ${zone.resource}`,
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 12, fill: Color.hex(Color.rgb(0.6, 0.85, 0.6)) },
    });
    res.x = -halfW + padding;
    res.y = -halfH + padding + 28;
    this.detailPanel.addChild(res);

    const stage = HubState.zone_deterioration[zoneId] ?? 0;
    const stageTexts = [
      'Estagio: Estavel',
      'Estagio: Deteriorando (+25% inimigos)',
      'Estagio: Critico (+50% inimigos)',
    ];
    const stageLabel = new Text({
      text: stageTexts[stage] ?? stageTexts[0]!,
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 11, fill: Color.hex(Color.rgb(0.75, 0.6, 0.5)) },
    });
    stageLabel.x = -halfW + padding;
    stageLabel.y = -halfH + padding + 48;
    this.detailPanel.addChild(stageLabel);

    const dlg = new Text({
      text: ZONE_DIALOGUE[zoneId] ?? '',
      style: {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 11,
        fill: Color.hex(Color.rgb(0.75, 0.80, 0.65)),
        wordWrap: true,
        wordWrapWidth: halfW * 2 - padding * 2,
      },
    });
    dlg.x = -halfW + padding;
    dlg.y = -halfH + padding + 72;
    this.detailPanel.addChild(dlg);

    const raidBtn = new PixiButton({
      label: 'RAIDAR',
      width: halfW * 2 - padding * 2,
      height: 32,
      onClick: () => {
        audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_01.wav', 0.6);
        if (this.detailPanel) this.detailPanel.visible = false;
        this.openConfirm(zone);
      },
    });
    raidBtn.x = -halfW + padding;
    raidBtn.y = halfH - padding - 64;
    this.detailPanel.addChild(raidBtn);

    const cancel = new PixiButton({
      label: 'Cancelar',
      width: halfW * 2 - padding * 2,
      height: 26,
      fill: 0x1a1a1a,
      hoverFill: 0x252525,
      onClick: () => {
        audioManager.playSfx('res://assets/audio/sfx/ui/Click_02.wav', 0.5);
        if (this.detailPanel) this.detailPanel.visible = false;
      },
    });
    cancel.x = -halfW + padding;
    cancel.y = halfH - padding - 30;
    this.detailPanel.addChild(cancel);
  }

  private openConfirm(zone: ZoneData): void {
    this.pendingZone = zone.zone_name;
    const dialog = new ConfirmRaidDialog(zone.zone_name, zone.subtitle);
    this.confirmDialog = dialog;
    dialog.confirmed.connect(() => {
      if (this.pendingZone === zone.zone_name) this.startRaid(zone);
    });
    dialog.cancelled.connect(() => {
      this.pendingZone = '';
    });
    dialog.closed.connect(() => {
      if (this.confirmDialog === dialog) this.confirmDialog = null;
    });
    this.root.addChild(dialog);
  }

  private startRaid(zone: ZoneData): void {
    switch (zone.scene) {
      case 'main':      void sceneManager.replace(new HordasScene()); break;
      case 'field':     void sceneManager.replace(new FieldControlScene()); break;
      case 'sacrifice': void sceneManager.replace(new SacrificeScene()); break;
      default:          void sceneManager.replace(new StubRunScene(zone));
    }
  }
}
