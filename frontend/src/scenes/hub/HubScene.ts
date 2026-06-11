import { Container, Graphics, Text } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { sceneManager } from '../../core/SceneManager';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { HubState, ROCKET_RECIPE, PIECE_INSTALL_BEAT, type ResourceKey } from '../../state/HubState';
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
import { ArrivalModal } from '../../ui/hub/ArrivalModal';
import { StoryProgress } from '../../state/StoryProgress';
import { HubRocketPanel } from '../../ui/hub/HubRocketPanel';
import { RocketLaunchOverlay } from '../../ui/hub/RocketLaunchOverlay';
import { HubZoomPanel } from '../../ui/hub/HubZoomPanel';
import { AudioButton } from '../../ui/hub/AudioButton';
import { AudioSettingsModal } from '../../ui/AudioSettingsModal';
import { LoreLogPanel } from '../../ui/hub/LoreLogPanel';
import { PixiButton } from '../../ui/PixiButton';
import { Modal } from '../../ui/Modal';

/**
 * HubScene — a cena-raiz do hub (a visao do bunker, "base" do jogo).
 *
 * Esta classe e o maestro: ela junta as pecas e decide o que acontece quando o
 * jogador interage. Ela NAO desenha o bunker em si — isso e o HubRenderer. O
 * papel dela e:
 *   - Montar as camadas da tela, na ordem certa de empilhamento:
 *       background (fundo) -> worldLayer (bunker + NPCs) -> uiLayer (HUD) ->
 *       modalLayer (paineis que abrem por cima de tudo).
 *   - Ouvir os "signals" (avisos) de clique do renderer e abrir o painel certo
 *     (uma run, o foguete, a ficha de um NPC).
 *   - Repassar o pulso de cada quadro (update) para o renderer e os NPCs.
 *   - Limpar tudo ao sair (remover listeners, parar audio) para nao vazar.
 *
 * Observacao de desempenho: o renderer e o gerenciador de NPCs ja fazem um
 * throttle de redraw para ~20fps internamente — esta cena nao interfere nisso.
 */
export class HubScene extends Scene {
  private background = new Graphics();
  // Camadas empilhadas (a ordem de adicao define o que fica na frente).
  private worldLayer = new Container();
  private uiLayer = new Container();
  private modalLayer = new Container();
  private renderer = new HubRenderer();
  private npcManager = new HubNPCManager();
  private hubAudio = new HubAudio();
  // O painel/modal aberto no momento (so um por vez).
  private activeModal: Modal | null = null;
  // Funcoes de desinscricao de signals; chamadas no exit() para evitar leaks.
  private disposers: Array<() => void> = [];
  private keyHandler!: (e: KeyboardEvent) => void;

  /** Monta as camadas, liga as reacoes aos cliques e inicia o audio. */
  override async enter(): Promise<void> {
    this.root.addChild(this.background);
    this.root.addChild(this.worldLayer);
    this.root.addChild(this.uiLayer);
    this.root.addChild(this.modalLayer);

    this.updateBackground();

    this.worldLayer.addChild(this.renderer);
    this.worldLayer.addChild(this.npcManager);

    this.buildResourceStrip();
    this.buildAudioButton();
    this.buildLoreButton();

    // Storytelling: se uma run acabou de resgatar alguém, o beat de chegada
    // toca assim que o jogador pisa de volta no bunker.
    const arrival = StoryProgress.consumeArrival();
    if (arrival) {
      setTimeout(() => {
        if (!this.root.destroyed) this.openModal(new ArrivalModal(arrival));
      }, 600);
    }

    this.disposers.push(
      this.renderer.roomClicked.connect((roomId) => this.onRoomClicked(roomId)),
    );
    this.disposers.push(
      this.renderer.surfaceZoneClicked.connect((zoneId) => this.onSurfaceZoneClicked(zoneId)),
    );
    // Clicou no poco do foguete -> abre o painel de construcao do foguete.
    this.disposers.push(
      this.renderer.rocketShaftClicked.connect(() => {
        this.hubAudio.playOpenPanelSfx();
        const panel = new HubRocketPanel();
        panel.closed.connect(() => {
          this.hubAudio.playClosePanelSfx();
          HubState.hubRocketClosed.emit();
        });
        panel.launchRequested.connect(() => this.openModal(new RocketLaunchOverlay()));
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

    // Esc fecha o painel aberto (se houver algum).
    this.keyHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && this.activeModal) {
        void this.activeModal.requestClose();
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    this.hubAudio.start();

    // Peças construídas durante a última run (o depósito acontece na run, com o
    // hub destruído) — anuncia a mais recente com um beat na voz do Dr. Myco.
    if (HubState.pending_piece_beats.length > 0) {
      const idx = HubState.pending_piece_beats[HubState.pending_piece_beats.length - 1]!;
      HubState.pending_piece_beats = [];
      this.hubAudio.playRocketProgressSfx();
      this.showPieceBeat(PIECE_INSTALL_BEAT[idx] ?? '');
    }
  }

  /** Toast efêmero (voz Dr. Myco) ao instalar uma peça do foguete. Auto-remove. */
  private showPieceBeat(text: string): void {
    if (!text) return;
    const W = GameConfig.VIEWPORT_WIDTH;
    const c = new Container();
    const label = new Text({
      text,
      style: {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 13, fontStyle: 'italic', fill: Color.hex(Color.rgb(0.78, 0.94, 0.48)),
        align: 'center', wordWrap: true, wordWrapWidth: W - 80,
      },
    });
    label.anchor.set(0.5, 0);
    const bg = new Graphics();
    bg.roundRect(-label.width / 2 - 14, -8, label.width + 28, label.height + 16, 8)
      .fill({ color: 0x0a100c, alpha: 0.85 })
      .stroke({ color: Color.hex(Color.rgb(0.78, 0.94, 0.48)), width: 1, alpha: 0.5 });
    c.addChild(bg, label);
    c.x = W / 2;
    c.y = 80;
    c.alpha = 0;
    this.uiLayer.addChild(c);
    const start = performance.now();
    const tick = (): void => {
      if (c.destroyed) return;
      const e = performance.now() - start;
      c.alpha = e < 300 ? e / 300 : e > 3400 ? Math.max(0, 1 - (e - 3400) / 600) : 1;
      c.y = 80 - Math.min(10, e / 60); // sobe um pouco
      if (e >= 4000) { c.destroy({ children: true }); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /** A cada quadro: repassa o delta time para o renderer e os NPCs animarem. */
  override update(dt: number): void {
    this.renderer.tick(dt);
    this.npcManager.tick(dt);
  }

  /** Limpeza ao sair: remove o teclado, para o audio, desconecta os signals e
   *  destroi o renderer (que mantem listeners de longa duracao). */
  override async exit(): Promise<void> {
    window.removeEventListener('keydown', this.keyHandler);
    this.hubAudio.stop();
    for (const d of this.disposers) d();
    this.disposers = [];
    // O renderer assina signals de longa duracao do HubState no construtor dele;
    // sem isto, cada re-entrada no hub deixaria 2 listeners mortos a mais (e
    // dispararia trabalho em renderers ja destruidos). destroyRenderer()
    // desconecta tudo e libera os recursos.
    this.renderer.destroyRenderer();
  }

  // ── Gerenciamento de modais (paineis sobrepostos) ──────────────────────────

  /** Abre um modal, fechando o anterior se ja houver um aberto. */
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

  // ── Interacoes (o que cada clique faz) ─────────────────────────────────────

  /** Clique numa sala: se ela leva a uma zona, abre a visao de zoom; se tem um
   *  NPC, abre a ficha do personagem. */
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

  /** Abre o painel de zoom de uma zona (de onde o jogador inicia uma run). */
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

  /** Abre a ficha (card) de um personagem do bunker. */
  private showNpcPopover(npcId: string): void {
    const npc = HubData.getNpc(npcId);
    if (!npc) return;
    this.hubAudio.playNpcSelectSfx();
    const card = new HubCharacterCard(npc);
    card.closed.connect(() => this.hubAudio.playClosePanelSfx());
    this.openModal(card);
    HubState.hubNpcSelected.emit(npcId);
  }

  /** O jogador pediu para iniciar uma run numa zona: descobrimos qual cena de
   *  run corresponde aquela zona e trocamos para ela. */
  private onStartRunRequested(zoneId: string): void {
    // Traduz o id de zona (texto) do hub para o indice da zona no WorldMap.
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
    // Cada zona aponta para o tipo de cena de run dela; o default e um stub.
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

  // ── Botao de configuracoes de audio (canto superior-direito) ───────────────

  /** Cria o botao que abre o modal de configuracoes de audio. */
  private buildAudioButton(): void {
    const btn = new AudioButton();
    btn.x = GameConfig.VIEWPORT_WIDTH - 26;
    btn.y = 24;
    this.uiLayer.addChild(btn);
    this.disposers.push(
      btn.clicked.connect(() => {
        this.hubAudio.playOpenPanelSfx();
        this.openModal(new AudioSettingsModal());
      }),
    );
  }

  /** Botão "Arquivo" — abre o terminal de lore (fragmentos descobertos). */
  private buildLoreButton(): void {
    const btn = new PixiButton({
      label: '✦ Arquivo', width: 92, height: 26, fontSize: 12,
      onClick: () => { this.hubAudio.playOpenPanelSfx(); this.openModal(new LoreLogPanel()); },
    });
    btn.x = GameConfig.VIEWPORT_WIDTH - 92 - 12;
    btn.y = 44;
    this.uiLayer.addChild(btn);
  }

  // ── Faixa de recursos (o "placar" de estoque, antes no World Map) ───────────
  private resourceText: Text | null = null;

  /** Monta a barra inferior que mostra a proxima peca do foguete, o estoque de
   *  recursos e o numero de sobreviventes. */
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
        fontSize: 12,
        fontWeight: '600',
        fill: Color.hex(Color.rgb(0.90, 0.95, 0.84)),
        dropShadow: { color: 0x000000, alpha: 0.85, blur: 2, distance: 1, angle: Math.PI / 2 },
      },
    });
    txt.anchor.set(0, 0.5);
    txt.x = 10;
    txt.y = y + stripH / 2;
    bar.addChild(txt);
    this.resourceText = txt;

    this.uiLayer.addChild(bar);

    this.refreshResourceStrip();
    // Re-renderiza a faixa sempre que o estoque mudar ou uma peca for construida.
    this.disposers.push(HubState.stockChanged.connect(() => this.refreshResourceStrip()));
    this.disposers.push(HubState.rocketPieceBuilt.connect(() => this.refreshResourceStrip()));
  }

  // Rótulos curtos por recurso para a faixa de "próxima peça".
  private static readonly RES_LABEL: Record<string, string> = {
    scrap: 'Suc', ai_components: 'IA', nucleo_logico: 'Núc', combustivel_volatil: 'Comb',
    sinais_controle: 'Sin', biomassa_adaptativa: 'Bio', fragmentos_estruturais: 'Frag',
  };

  /** Atualiza a faixa: a próxima peça do foguete e quanto falta de cada recurso
   *  dela (have/need) — assim o jogador sabe o que ir raidar. */
  private refreshResourceStrip(): void {
    if (!this.resourceText) return;
    const idx = HubState.rocket_pieces_built;
    const survivors = HubState.rescued_characters.length + 1; // +1 = o próprio Myco
    if (idx >= ROCKET_RECIPE.length) {
      this.resourceText.text = `▲ FOGUETE COMPLETO — pronto pra lançar  ·  Sobrev ${survivors}/10`;
      return;
    }
    const recipe = ROCKET_RECIPE[idx]!;
    const parts: string[] = [];
    for (const k of Object.keys(recipe)) {
      if (k === 'name') continue;
      const need = (recipe[k as keyof typeof recipe] as number) ?? 0;
      const have = HubState.stock[k as ResourceKey] ?? 0;
      parts.push(`${HubScene.RES_LABEL[k] ?? k} ${Math.min(have, need)}/${need}`);
    }
    this.resourceText.text = `▲ ${recipe.name}: ${parts.join('  ')}  ·  Sobrev ${survivors}/10`;
  }

  /** Clique numa ruina da superficie: abre o zoom da zona correspondente. */
  private onSurfaceZoneClicked(zoneId: string): void {
    this.hubAudio.playClickSfx();
    // Superfície só abre na metade do arco (Tomas reativa o depósito).
    if (!StoryProgress.isSurfaceOpen()) {
      this.showPieceBeat('Dr. Myco: "A superfície ainda é loucura. Primeiro a gente traz mais gente pra casa."');
      return;
    }
    this.openZoomView(`surface_${zoneId}`, zoneId);
    HubState.hubRoomSelected.emit(`surface_${zoneId}`);
  }

  /** Pinta o fundo solido da cena com a cor da variante atual do hub. */
  private updateBackground(): void {
    const variant = HubState.getVariantData();
    this.background.clear();
    this.background
      .rect(0, 0, GameConfig.VIEWPORT_WIDTH, GameConfig.VIEWPORT_HEIGHT)
      .fill(Color.hex(variant.bg));
  }
}
