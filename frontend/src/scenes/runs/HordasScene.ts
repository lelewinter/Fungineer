import { Container, Graphics } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { sceneManager } from '../../core/SceneManager';
import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { GameState, RunState } from '../../state/GameState';
import { HubState } from '../../state/HubState';

import { RunWorld } from '../../run/RunWorld';
import { Party } from '../../run/Party';
import { DragController } from '../../run/DragController';
import { WaveSpawner, type WaveFactories } from '../../run/WaveSpawner';
import { ItemSpawner } from '../../run/ItemSpawner';
import { ExtractionPoint } from '../../run/ExtractionPoint';
import { PowerManager, type PowerResource } from '../../run/power/PowerManager';
import { SiegeMode, SplitOrbit, Overclock, MagnetPulse, ReflectiveShell, GhostDrive } from '../../run/power/Powers';
import { Guardian, Striker, Medic, Artificer, CHARACTER_FACTORIES } from '../../run/Characters';
import { Runner, Bruiser, Spitter, SentinelCore } from '../../run/Enemies';

import { HUD } from '../../ui/run/HUD';
import { GameOverScreen, VictoryScreen, RescueScreen, PowerOfferScreen, type RescueOption } from '../../ui/run/RunScreens';
import { CombatSfx, updateDamageNumbers } from '../../run/fx/DamageNumbers';
import { Juice } from '../../run/fx/Juice';

import { HubScene } from '../hub/HubScene';
import { saveService } from '../../state/SaveService';
import { shuffleInPlace } from '../../core/types';

/** Hordas zone run scene. Port of src/scenes/Main.gd.
 *  Wires every Phase 4-6 system together and runs the wave loop until
 *  boss death or party wipe. */
export class HordasScene extends Scene {
  // Layout
  private cameraLayer = new Container();
  private uiLayer = new Container();
  private arenaBg = new Graphics();
  private arenaBorder = new Graphics();

  // Run systems
  private world!: RunWorld;
  private party!: Party;
  private drag!: DragController;
  private waves!: WaveSpawner;
  private items!: ItemSpawner;
  private extractionPoint!: ExtractionPoint;
  private powerManager!: PowerManager;

  // UI
  private hud!: HUD;
  private rescueOffered = false;
  private endShown = false;

  // Recurring power-offer cadence — VS-style "level up". After the first
  // offer post wave-2 clear, the run keeps prompting every POWER_OFFER_EVERY_S
  // until run end, letting the player swap powers mid-fight.
  private static readonly POWER_OFFER_EVERY_S = 25;
  private nextPowerOfferAt = Number.POSITIVE_INFINITY;
  private powerScreenOpen = false;

  // Signal disposers
  private disposers: Array<() => void> = [];
  private keyHandler!: (e: KeyboardEvent) => void;

  override async enter(): Promise<void> {
    this.root.addChild(this.cameraLayer);
    this.root.addChild(this.uiLayer);

    this.world = new RunWorld();
    this.cameraLayer.addChild(this.world.root);

    this.buildArena();
    this.buildSystems();
    this.buildUi();
    this.connectSignals();
    this.startRun();
    this.setupMusic();

    this.keyHandler = (e: KeyboardEvent): void => this.onKey(e);
    window.addEventListener('keydown', this.keyHandler);

    Juice.bind(this.cameraLayer);
  }

  override update(dt: number): void {
    // Cap dt so tab-switch doesn't teleport everyone.
    const capped = Math.min(dt, 1 / 30);

    if (GameState.current_state === RunState.PLAYING || GameState.current_state === RunState.BOSS_FIGHT) {
      GameState.tick(capped);
      this.drag.update(capped);
      this.party.update();
      for (const c of this.world.characters) c.update(capped, this.world);
      for (const e of this.world.enemies) e.update(capped, this.world);
      this.world.updateProjectiles(capped);
      this.items.update(capped);
      this.extractionPoint.update(capped);
      this.waves.update(capped);
      this.powerManager.update(capped);
      updateDamageNumbers(capped);
      this.maybeOfferRecurringPower();
    }
    this.hud.update(capped);
    this.updateCamera(capped);
    Juice.update(capped);
  }

  override async exit(): Promise<void> {
    window.removeEventListener('keydown', this.keyHandler);
    for (const d of this.disposers) d();
    this.disposers = [];
    this.drag.destroy();
    this.hud.destroyHud();
    Juice.bind(null);
    audioManager.stopMusic(300);
  }

  // ── Build ──────────────────────────────────────────────────────────────
  private buildArena(): void {
    const W = GameConfig.ARENA_WIDTH;
    const H = GameConfig.ARENA_HEIGHT;
    this.arenaBg.rect(0, 0, W, H).fill(Color.hex(Color.rgb(0.08, 0.06, 0.10)));

    // Subtle scan grid
    const grid = new Graphics();
    const step = 64;
    for (let x = 0; x <= W; x += step) grid.moveTo(x, 0).lineTo(x, H);
    for (let y = 0; y <= H; y += step) grid.moveTo(0, y).lineTo(W, y);
    grid.stroke({ color: 0x1a1c25, width: 1, alpha: 0.6 });

    const borderColor = Color.hex(Color.rgb(0.35, 0.3, 0.6));
    const t = 3;
    this.arenaBorder
      .rect(0, 0, W, t).fill(borderColor)
      .rect(0, H - t, W, t).fill(borderColor)
      .rect(0, 0, t, H).fill(borderColor)
      .rect(W - t, 0, t, H).fill(borderColor);

    this.world.bgLayer.addChild(this.arenaBg);
    this.world.bgLayer.addChild(grid);
    this.world.bgLayer.addChild(this.arenaBorder);
  }

  private buildSystems(): void {
    this.party = new Party();
    this.party.anchor = { x: GameConfig.ARENA_WIDTH * 0.5, y: GameConfig.ARENA_HEIGHT * 0.7 };

    this.extractionPoint = new ExtractionPoint(this.party);
    this.extractionPoint.position = { x: GameConfig.ARENA_WIDTH * 0.5, y: GameConfig.ARENA_HEIGHT * 0.15 };
    this.world.extractionLayer.addChild(this.extractionPoint.node);

    this.drag = new DragController(this.app, this.party, this.cameraLayer);

    const factories: WaveFactories = {
      runner: () => new Runner(),
      bruiser: () => new Bruiser(),
      spitter: () => new Spitter(),
      sentinel: () => new SentinelCore(),
    };
    this.waves = new WaveSpawner(this.world, factories, 0);
    this.items = new ItemSpawner(this.world, this.party);
    this.powerManager = new PowerManager(this.world);
  }

  private buildUi(): void {
    this.hud = new HUD();
    this.uiLayer.addChild(this.hud);
    this.disposers.push(this.hud.powerTapped.connect(() => this.powerManager.toggle()));
  }

  private connectSignals(): void {
    this.disposers.push(
      GameState.runEnded.connect((victory, fragments) => this.onRunEnded(victory, fragments)),
    );
    this.disposers.push(
      this.waves.waveCleared.connect((w) => this.onWaveCleared(w)),
    );
    this.disposers.push(
      GameState.waveStarted.connect(() => CombatSfx.waveStart()),
    );
    this.disposers.push(
      GameState.bossSpawned.connect(() => {
        CombatSfx.bossSpawn();
        Juice.shake(0.95, 180);
      }),
    );
  }

  private startRun(): void {
    // Initial party (Guardian + Striker — Sprint 1 default).
    const guardian = new Guardian();
    this.party.add(guardian, this.world);
    this.hud.registerCharacter(guardian);

    const striker = new Striker();
    this.party.add(striker, this.world);
    this.hud.registerCharacter(striker);

    GameState.startRun();
    this.items.spawnResources('scrap');
    this.waves.start();
  }

  // ── Wave callbacks ─────────────────────────────────────────────────────
  private onWaveCleared(wave: number): void {
    if (wave === 1 && !this.rescueOffered) {
      this.rescueOffered = true;
      if (this.party.size() >= GameConfig.MAX_PARTY_SIZE) return;
      this.offerRescue();
    } else if (wave === 2) {
      // Wave 2 cleared kicks off the recurring power-offer loop. The first
      // offer fires immediately; subsequent ones every POWER_OFFER_EVERY_S.
      this.offerPower();
      this.nextPowerOfferAt = GameState.run_time + HordasScene.POWER_OFFER_EVERY_S;
    }
  }

  private maybeOfferRecurringPower(): void {
    if (this.powerScreenOpen) return;
    if (this.nextPowerOfferAt === Number.POSITIVE_INFINITY) return;
    if (GameState.run_time < this.nextPowerOfferAt) return;
    this.offerPower();
    this.nextPowerOfferAt = GameState.run_time + HordasScene.POWER_OFFER_EVERY_S;
  }

  private offerRescue(): void {
    const pool: RescueOption[] = [];
    if (!HubState.rescued_characters.includes('Artificer')) {
      pool.push({ name: 'Artificera', desc: 'Explosões em área. Bônus em grupos.', factoryId: 'artificer' });
    }
    if (!HubState.rescued_characters.includes('Medic')) {
      pool.push({ name: 'Médica', desc: 'Cura passiva e suporte à party.', factoryId: 'medic' });
    }
    if (pool.length === 0) return;
    shuffleInPlace(pool);
    const offered = pool.slice(0, 2);
    const screen = new RescueScreen(offered);
    screen.characterChosen.connect((id) => this.onCharacterChosen(id));
    this.uiLayer.addChild(screen);
  }

  private offerPower(): void {
    if (this.powerScreenOpen) return;
    this.powerScreenOpen = true;
    const pool: PowerResource[] = [
      new SiegeMode(),
      new SplitOrbit(),
      new Overclock(),
      new MagnetPulse(),
      new ReflectiveShell(),
      new GhostDrive(),
    ];
    shuffleInPlace(pool);
    const offered = pool.slice(0, 3);
    const screen = new PowerOfferScreen(offered);
    screen.powerChosen.connect((p) => {
      this.powerScreenOpen = false;
      this.onPowerChosen(p);
    });
    this.uiLayer.addChild(screen);
  }

  private onCharacterChosen(factoryId: string): void {
    const make = CHARACTER_FACTORIES[factoryId];
    if (!make) return;
    const character = make();
    this.party.add(character, this.world);
    this.hud.registerCharacter(character);
    const className = character.character_name;
    if (!HubState.rescued_characters.includes(className)) {
      HubState.rescued_characters.push(className);
    }
  }

  private onPowerChosen(power: PowerResource): void {
    this.powerManager.setPower(power);
    this.hud.setPowerDisplay(power);
    Juice.shake(0.35, 60);
  }

  private onRunEnded(victory: boolean, fragments: number): void {
    if (this.endShown) return;
    this.endShown = true;
    if (victory) {
      // Bank everything the player carried home before showing the screen,
      // and force-flush the HubState save so a refresh during the modal
      // can't lose the deposit.
      HubState.depositBackpack(GameState.backpack);
      void saveService.flush();

      const screen = new VictoryScreen(GameState.run_time, fragments);
      // Either route — the explicit button OR a backdrop tap that closes
      // the modal — sends the player back to the hub. Without the closed
      // hook, tapping outside the panel left the run scene stranded.
      const goHub = (): void => this.returnToHub();
      screen.hubRequested.connect(goHub);
      screen.closed.connect(goHub);
      this.uiLayer.addChild(screen);
    } else {
      const screen = new GameOverScreen(GameState.run_time);
      const goHub = (): void => this.returnToHub();
      screen.hubRequested.connect(goHub);
      screen.closed.connect(goHub);
      screen.retryRequested.connect(() => this.retry());
      this.uiLayer.addChild(screen);
    }
  }

  private retry(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    void sceneManager.replace(new HordasScene());
  }

  private returnToHub(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    void sceneManager.replace(new HubScene());
  }
  private transitioning = false;

  // ── Camera ─────────────────────────────────────────────────────────────
  private updateCamera(dt: number): void {
    // Center the party on screen, but clamp to arena bounds so we never
    // show the void outside.
    const targetX = GameConfig.VIEWPORT_WIDTH / 2 - this.party.anchor.x;
    const targetY = GameConfig.VIEWPORT_HEIGHT / 2 - this.party.anchor.y;
    const minX = GameConfig.VIEWPORT_WIDTH - GameConfig.ARENA_WIDTH;
    const maxX = 0;
    const minY = GameConfig.VIEWPORT_HEIGHT - GameConfig.ARENA_HEIGHT;
    const maxY = 0;
    const clampedX = Math.max(minX, Math.min(maxX, targetX));
    const clampedY = Math.max(minY, Math.min(maxY, targetY));
    const t = Math.min(1, 8 * dt);
    this.cameraLayer.x += (clampedX - this.cameraLayer.x) * t;
    this.cameraLayer.y += (clampedY - this.cameraLayer.y) * t;
  }

  private onKey(e: KeyboardEvent): void {
    if (e.key === ' ' || e.code === 'Space') {
      this.powerManager.toggle();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      if (GameState.current_state === RunState.GAME_OVER || GameState.current_state === RunState.VICTORY) {
        this.returnToHub();
      }
    }
  }

  private setupMusic(): void {
    audioManager.playMusic('res://assets/audio/music/battle.wav', { loop: true, volume: 0.35, fadeMs: 500 }).catch(() => undefined);
  }

  /** Helper to mark unused imports as referenced for tree-shaking awareness. */
  static _refs: unknown = [Medic, Artificer];
}
