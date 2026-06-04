import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { sceneManager } from '../../core/SceneManager';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { HubState, HUB_VARIANTS, type HubVariantKey } from '../../state/HubState';
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
import { WorldMapScene } from '../WorldMapScene';
import { HubAudio } from './HubAudio';
import { HubRenderer } from './HubRenderer';
import { HubNPCManager } from './HubNPCManager';
import { HubRocket } from './HubRocket';
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
  private rocketBadge = new HubRocket();
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

    this.uiLayer.addChild(this.rocketBadge);
    this.makeBadgeInteractive();
    this.buildVariantSelector();

    this.disposers.push(
      this.renderer.roomClicked.connect((roomId) => this.onRoomClicked(roomId)),
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

  private makeBadgeInteractive(): void {
    this.rocketBadge.eventMode = 'static';
    this.rocketBadge.cursor = 'pointer';
    this.rocketBadge.on('pointertap', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.hubAudio.playOpenPanelSfx();
      const panel = new HubRocketPanel();
      panel.closed.connect(() => {
        this.hubAudio.playClosePanelSfx();
        HubState.hubRocketClosed.emit();
      });
      this.openModal(panel);
      HubState.hubRocketOpened.emit();
    });
  }

  private buildVariantSelector(): void {
    const bar = new Container();
    bar.x = 12;
    bar.y = 60;
    let x = 0;
    const keys = Object.keys(HUB_VARIANTS) as HubVariantKey[];
    for (const key of keys) {
      const btn = new PixiButton({
        label: key.toUpperCase(),
        width: 80,
        height: 22,
        fontSize: 9,
        onClick: () => {
          HubState.setHubVariant(key);
        },
      });
      btn.x = x;
      x += 84;
      bar.addChild(btn);
    }
    this.uiLayer.addChild(bar);

    const mapBtn = new PixiButton({
      label: 'WORLD MAP',
      width: 100,
      height: 22,
      fontSize: 9,
      onClick: () => {
        void sceneManager.replace(new WorldMapScene());
      },
    });
    mapBtn.x = GameConfig.VIEWPORT_WIDTH - 110;
    mapBtn.y = 60;
    this.uiLayer.addChild(mapBtn);

    const hint = new Text({
      text: 'Toque numa sala para entrar · ESC fecha painel',
      style: {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 9,
        fill: Color.hex(Color.rgb(0.55, 0.62, 0.50)),
      },
    });
    hint.anchor.set(0.5, 1);
    hint.x = GameConfig.VIEWPORT_WIDTH / 2;
    hint.y = GameConfig.VIEWPORT_HEIGHT - 8;
    this.uiLayer.addChild(hint);
  }

  private updateBackground(): void {
    const variant = HubState.getVariantData();
    this.background.clear();
    this.background
      .rect(0, 0, GameConfig.VIEWPORT_WIDTH, GameConfig.VIEWPORT_HEIGHT)
      .fill(Color.hex(variant.bg));
  }
}
