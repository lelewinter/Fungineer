import { Container, Graphics } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { sceneManager } from '../../core/SceneManager';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
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
import { HubTopBar } from '../../ui/hub/HubTopBar';
import { HubBottomBar } from '../../ui/hub/HubBottomBar';
import { Modal } from '../../ui/Modal';

/** Mirrors src/scenes/hub/HubScene.gd. Root scene of the bunker view. */
export class HubScene extends Scene {
  private background = new Graphics();
  private worldLayer = new Container();
  private uiLayer = new Container();
  private modalLayer = new Container();
  private renderer: HubRenderer;
  private npcManager: HubNPCManager;
  private hubAudio = new HubAudio();
  private topBar = new HubTopBar();
  private bottomBar = new HubBottomBar();
  private activeModal: Modal | null = null;
  private disposers: Array<() => void> = [];
  private keyHandler!: (e: KeyboardEvent) => void;

  constructor() {
    super();
    const pad = { topPad: HubTopBar.TOTAL_H, bottomPad: HubBottomBar.H };
    this.renderer = new HubRenderer(pad);
    this.npcManager = new HubNPCManager(pad);
  }

  override async enter(): Promise<void> {
    this.root.addChild(this.background);
    this.root.addChild(this.worldLayer);
    this.root.addChild(this.uiLayer);
    this.root.addChild(this.modalLayer);

    this.updateBackground();

    this.worldLayer.addChild(this.renderer);
    this.worldLayer.addChild(this.npcManager);

    // TopBar + RocketReadout overlay
    this.uiLayer.addChild(this.topBar);
    this.disposers.push(
      this.topBar.rocketReadoutClicked.connect(() => this.openRocketPanel()),
    );

    // BottomBar overlay
    this.bottomBar.y = GameConfig.VIEWPORT_HEIGHT - HubBottomBar.H;
    this.uiLayer.addChild(this.bottomBar);
    this.disposers.push(
      this.bottomBar.rocketClicked.connect(() => this.openRocketPanel()),
    );

    this.disposers.push(
      this.renderer.roomClicked.connect((roomId) => this.onRoomClicked(roomId)),
    );
    this.disposers.push(
      this.renderer.rocketShaftClicked.connect(() => this.openRocketPanel()),
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
    // Tear down the chrome bars so their HubState signal listeners get
    // disconnected. Without this, a stockChanged emit from the run's
    // depositBackpack call later refers to a destroyed Pixi graphics tree
    // through the still-live `refresh()` closure and crashes.
    this.topBar.destroyBar();
    this.bottomBar.destroyBar();
    this.renderer.destroyRenderer();
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

  private openRocketPanel(): void {
    this.hubAudio.playOpenPanelSfx();
    const panel = new HubRocketPanel();
    panel.closed.connect(() => {
      this.hubAudio.playClosePanelSfx();
      HubState.hubRocketClosed.emit();
    });
    this.openModal(panel);
    HubState.hubRocketOpened.emit();
  }

  private updateBackground(): void {
    const variant = HubState.getVariantData();
    this.background.clear();
    this.background
      .rect(0, 0, GameConfig.VIEWPORT_WIDTH, GameConfig.VIEWPORT_HEIGHT)
      .fill(Color.hex(variant.bg));
  }
}
