import { Container, Graphics, Text } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { sceneManager } from '../../core/SceneManager';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { HubState, HUB_VARIANTS, ROCKET_RECIPE, type HubVariantKey } from '../../state/HubState';
import { HubData, ROOM_TO_ZONE } from '../../state/HubData';
import { ZONES } from '../../state/Zones';
import { StubRunScene } from '../runs/StubRunScene';
import { HordasScene } from '../runs/HordasScene';
import { FieldControlScene } from '../runs/FieldControlScene';
import { SacrificeScene } from '../runs/SacrificeScene';
import { StealthScene } from '../runs/StealthScene';
import { CircuitoScene } from '../runs/CircuitoScene';
import { ExtractionScene } from '../runs/ExtractionScene';
import { InfeccaoScene } from '../runs/InfeccaoScene';
import { LabirintoScene } from '../runs/LabirintoScene';
import { CordilheiraScene } from '../runs/CordilheiraScene';
import { TorresScene } from '../runs/TorresScene';
import { CatedralScene } from '../runs/CatedralScene';
import { HubAudio } from './HubAudio';
import { HubRenderer } from './HubRenderer';
import { HubNPCManager } from './HubNPCManager';
import { HubCharacterCard } from '../../ui/hub/HubCharacterCard';
import { HubRocketPanel } from '../../ui/hub/HubRocketPanel';
import { HubZoomPanel } from '../../ui/hub/HubZoomPanel';
import { Modal } from '../../ui/Modal';
import { PixiButton } from '../../ui/PixiButton';

/** Mirrors src/scenes/hub/HubScene.gd. Root scene of the bunker view. */
export class HubScene extends Scene {
  private background = new Graphics();
  private worldLayer = new Container();
  private uiLayer = new Container();
  private modalLayer = new Container();
  private renderer = new HubRenderer();
  private npcManager = new HubNPCManager();
  private hubAudio = new HubAudio();
  private activeModal: Modal | null = null;
  private disposers: Array<() => void> = [];
  private keyHandler!: (e: KeyboardEvent) => void;

  override async enter(): Promise<void> {
    this.root.addChild(this.background);
    this.root.addChild(this.worldLayer);
    this.root.addChild(this.uiLayer);
    this.root.addChild(this.modalLayer);

    this.updateBackground();

    this.worldLayer.addChild(this.renderer);
    this.worldLayer.addChild(this.npcManager);

    this.buildResourceStrip();

    this.disposers.push(
      this.renderer.roomClicked.connect((roomId) => this.onRoomClicked(roomId)),
    );
    this.disposers.push(
      this.renderer.surfaceZoneClicked.connect((zoneId) => this.onSurfaceZoneClicked(zoneId)),
    );
    this.disposers.push(
      this.renderer.rocketShaftClicked.connect(() => {
        this.hubAudio.playOpenPanelSfx();
        const panel = new HubRocketPanel();
        panel.closed.connect(() => {
          this.hubAudio.playClosePanelSfx();
          HubState.hubRocketClosed.emit();
        });
        this.openModal(panel);
        HubState.hubRocketOpened.emit();
      }),
    );
    this.disposers.push(
      HubState.hubVariantChanged.connect(() => this.updateBackground()),
    );
    this.disposers.push(
      HubState.rocketPieceBuilt.connect(() => this.hubAudio.playRocketProgressSfx()),
    );

    this.keyHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && this.activeModal) {
        void this.activeModal.requestClose();
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    this.hubAudio.start();
  }

  override update(dt: number): void {
    this.renderer.tick(dt);
    this.npcManager.tick(dt);
  }

  override async exit(): Promise<void> {
    window.removeEventListener('keydown', this.keyHandler);
    this.hubAudio.stop();
    for (const d of this.disposers) d();
    this.disposers = [];
  }

  // ── Modal management ─────────────────────────────────────────────────────
  private openModal(modal: Modal): void {
    if (this.activeModal) {
      void this.activeModal.requestClose();
    }
    this.activeModal = modal;
    this.modalLayer.addChild(modal);
    modal.closed.connect(() => {
      if (this.activeModal === modal) this.activeModal = null;
    });
  }

  // ── Interactions ─────────────────────────────────────────────────────────
  private onRoomClicked(roomId: string): void {
    this.hubAudio.playClickSfx();
    const room = HubState.getRoomById(roomId) ?? HubData.getRoom(roomId);
    if (!room) return;
    const zoneId = ROOM_TO_ZONE[roomId];
    if (zoneId) {
      this.openZoomView(roomId, zoneId);
    } else if (room.npcs.length > 0) {
      this.showNpcPopover(room.npcs[0]!);
    }
    HubState.hubRoomSelected.emit(roomId);
  }

  private openZoomView(roomId: string, zoneId: string): void {
    this.hubAudio.playOpenPanelSfx();
    const panel = new HubZoomPanel(roomId, zoneId);
    panel.startRunRequested.connect((zid) => this.onStartRunRequested(zid));
    panel.closed.connect(() => {
      this.hubAudio.playClosePanelSfx();
      HubState.hubZoomClosed.emit();
    });
    this.openModal(panel);
    HubState.hubZoomOpened.emit(roomId, zoneId);
  }

  private showNpcPopover(npcId: string): void {
    const npc = HubData.getNpc(npcId);
    if (!npc) return;
    this.hubAudio.playNpcSelectSfx();
    const card = new HubCharacterCard(npc);
    card.closed.connect(() => this.hubAudio.playClosePanelSfx());
    this.openModal(card);
    HubState.hubNpcSelected.emit(npcId);
  }

  private onStartRunRequested(zoneId: string): void {
    // Map the hub's string zone id to the WorldMap zone index.
    const zoneIndex = (
      {
        hordas: 0, stealth: 1, circuito: 2, extracao: 3, campo: 4,
        infeccao: 5, labirinto: 6, sacrificio: 7,
        cordilheira: 8, torres: 9, catedral: 10,
      } as Record<string, number>
    )[zoneId];
    if (zoneIndex === undefined) {
      console.warn('[hub] unknown zone id', zoneId);
      return;
    }
    const zd = ZONES[zoneIndex];
    if (!zd) return;
    switch (zd.scene) {
      case 'main':        void sceneManager.replace(new HordasScene()); break;
      case 'field':       void sceneManager.replace(new FieldControlScene()); break;
      case 'sacrifice':   void sceneManager.replace(new SacrificeScene()); break;
      case 'stealth':     void sceneManager.replace(new StealthScene()); break;
      case 'circuit':     void sceneManager.replace(new CircuitoScene()); break;
      case 'extraction':  void sceneManager.replace(new ExtractionScene()); break;
      case 'infection':   void sceneManager.replace(new InfeccaoScene()); break;
      case 'maze':        void sceneManager.replace(new LabirintoScene()); break;
      case 'cordilheira': void sceneManager.replace(new CordilheiraScene()); break;
      case 'torres':      void sceneManager.replace(new TorresScene()); break;
      case 'catedral':    void sceneManager.replace(new CatedralScene()); break;
      default:            void sceneManager.replace(new StubRunScene(zd));
    }
  }

  // ── Resource strip (folds the old World Map stock readout into the hub) ────
  private resourceText: Text | null = null;
  private themeBtn: PixiButton | null = null;

  private buildResourceStrip(): void {
    const VW = GameConfig.VIEWPORT_WIDTH;
    const VH = GameConfig.VIEWPORT_HEIGHT;
    const stripH = 28;
    const y = VH - 34;

    const bar = new Container();
    const bg = new Graphics()
      .rect(0, y, VW, stripH).fill({ color: 0x050807, alpha: 0.82 })
      .moveTo(0, y).lineTo(VW, y).stroke({ color: Color.hex(Color.rgb(0.35, 0.45, 0.40)), width: 1, alpha: 0.55 });
    bar.addChild(bg);

    const txt = new Text({
      text: '',
      style: {
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        fontSize: 10,
        fontWeight: '600',
        fill: Color.hex(Color.rgb(0.88, 0.93, 0.82)),
        dropShadow: { color: 0x000000, alpha: 0.8, blur: 2, distance: 1, angle: Math.PI / 2 },
      },
    });
    txt.anchor.set(0, 0.5);
    txt.x = 10;
    txt.y = y + stripH / 2;
    bar.addChild(txt);
    this.resourceText = txt;

    // Compact theme cycler (replaces the old top variant bar).
    const tbW = 78;
    const tbH = 20;
    const themeBtn = new PixiButton({
      label: '',
      width: tbW,
      height: tbH,
      fontSize: 9,
      fill: 0x18221b,
      hoverFill: 0x243328,
      textColor: 0x9fe9cf,
      onClick: () => this.cycleVariant(),
    });
    themeBtn.x = VW - tbW - 8;
    themeBtn.y = y + (stripH - tbH) / 2;
    bar.addChild(themeBtn);
    this.themeBtn = themeBtn;

    this.uiLayer.addChild(bar);

    this.refreshResourceStrip();
    this.refreshThemeBtn();
    this.disposers.push(HubState.stockChanged.connect(() => this.refreshResourceStrip()));
    this.disposers.push(HubState.rocketPieceBuilt.connect(() => this.refreshResourceStrip()));
    this.disposers.push(HubState.hubVariantChanged.connect(() => this.refreshThemeBtn()));
  }

  private cycleVariant(): void {
    const keys = Object.keys(HUB_VARIANTS) as HubVariantKey[];
    const i = keys.indexOf(HubState.hub_variant);
    const next = keys[(i + 1) % keys.length]!;
    HubState.setHubVariant(next);
  }

  private refreshThemeBtn(): void {
    this.themeBtn?.setLabel(`◑ ${HubState.hub_variant.toUpperCase()}`);
  }

  private refreshResourceStrip(): void {
    if (!this.resourceText) return;
    const idx = HubState.rocket_pieces_built;
    const nextName = idx >= ROCKET_RECIPE.length ? 'FOGUETE COMPLETO' : ROCKET_RECIPE[idx]!.name;
    const s = HubState.stock;
    const survivors = HubState.rescued_characters.length + 1;
    this.resourceText.text =
      `▲ ${nextName}  ·  Suc ${s.scrap} IA ${s.ai_components} Bio ${s.biomassa_adaptativa}  ·  Sobrev ${survivors}/10`;
  }

  private onSurfaceZoneClicked(zoneId: string): void {
    this.hubAudio.playClickSfx();
    this.openZoomView(`surface_${zoneId}`, zoneId);
    HubState.hubRoomSelected.emit(`surface_${zoneId}`);
  }

  private updateBackground(): void {
    const variant = HubState.getVariantData();
    this.background.clear();
    this.background
      .rect(0, 0, GameConfig.VIEWPORT_WIDTH, GameConfig.VIEWPORT_HEIGHT)
      .fill(Color.hex(variant.bg));
  }
}
