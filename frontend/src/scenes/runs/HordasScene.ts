import { Container, Graphics, TilingSprite, type Texture } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { sceneManager } from '../../core/SceneManager';
import { audioManager } from '../../core/AudioManager';
import { assets } from '../../core/AssetLoader';
import { juice } from '../../core/Juice';
import { FXSystem } from '../../run/fx/FXSystem';
import { ScreenFX } from '../../run/fx/ScreenFX';
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
import type { BaseEnemy } from '../../run/BaseEnemy';

import { HUD } from '../../ui/run/HUD';
import { GameOverScreen, VictoryScreen, RescueScreen, PowerOfferScreen, type RescueOption } from '../../ui/run/RunScreens';
import { CombatSfx, updateDamageNumbers } from '../../run/fx/DamageNumbers';

import { HubScene } from '../hub/HubScene';
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
  private fx!: FXSystem;
  private screenFx!: ScreenFX;

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
  private powerOffered = false;
  private endShown = false;

  // Signal disposers
  private disposers: Array<() => void> = [];
  private keyHandler!: (e: KeyboardEvent) => void;

  override async enter(): Promise<void> {
    this.root.addChild(this.cameraLayer);
    this.uiLayer.sortableChildren = true;
    this.root.addChild(this.uiLayer);

    this.world = new RunWorld();
    this.cameraLayer.addChild(this.world.root);

    const tex = await assets.texture('res://assets/art/textures/mycelium_tile.png');
    this.buildArena(tex);
    this.fx = new FXSystem(this.world.fxLayer, { w: GameConfig.ARENA_WIDTH, h: GameConfig.ARENA_HEIGHT }, { ambient: 70, cap: 360 });
    this.buildSystems();
    this.buildUi();
    this.connectSignals();
    this.startRun();
    this.setupMusic();

    this.keyHandler = (e: KeyboardEvent): void => this.onKey(e);
    window.addEventListener('keydown', this.keyHandler);
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
      this.fx.update(capped);
    }
    this.screenFx.update(capped);
    this.hud.update(capped);
    this.updateCamera(capped);
  }

  override async exit(): Promise<void> {
    window.removeEventListener('keydown', this.keyHandler);
    for (const d of this.disposers) d();
    this.disposers = [];
    this.drag.destroy();
    this.hud.destroyHud();
    this.fx?.destroy();
    juice.reset();
    audioManager.stopMusic(300);
  }

  // ── Build ──────────────────────────────────────────────────────────────
  private buildArena(tex: Texture | null): void {
    const W = GameConfig.ARENA_WIDTH;
    const H = GameConfig.ARENA_HEIGHT;

    // Base fill — also the fallback if the texture failed to load.
    this.arenaBg.rect(0, 0, W, H).fill(Color.hex(Color.rgb(0.06, 0.05, 0.05)));
    this.world.bgLayer.addChild(this.arenaBg);

    if (tex) {
      const bg = new TilingSprite({ texture: tex, width: W, height: H });
      bg.tileScale.set(1.4);
      bg.alpha = 0.92;
      this.world.bgLayer.addChild(bg);
    } else {
      const grid = new Graphics();
      const step = 64;
      for (let x = 0; x <= W; x += step) grid.moveTo(x, 0).lineTo(x, H);
      for (let y = 0; y <= H; y += step) grid.moveTo(0, y).lineTo(W, y);
      grid.stroke({ color: 0x1a1c25, width: 1, alpha: 0.6 });
      this.world.bgLayer.addChild(grid);
    }

    const borderColor = Color.hex(Color.rgb(0.42, 0.62, 0.40));
    const t = 4;
    this.arenaBorder
      .rect(0, 0, W, t).fill(borderColor)
      .rect(0, H - t, W, t).fill(borderColor)
      .rect(0, 0, t, H).fill(borderColor)
      .rect(W - t, 0, t, H).fill(borderColor);
    this.world.bgLayer.addChild(this.arenaBorder);
  }

  private buildSystems(): void {
    this.party = new Party();
    this.party.anchor = { x: GameConfig.ARENA_WIDTH * 0.5, y: GameConfig.ARENA_HEIGHT * 0.7 };

    this.extractionPoint = new ExtractionPoint(this.party);
    this.extractionPoint.position = { x: GameConfig.ARENA_WIDTH * 0.5, y: GameConfig.ARENA_HEIGHT * 0.15 };
    this.world.extractionLayer.addChild(this.extractionPoint.node);

    this.drag = new DragController(this.app, this.party);

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
    this.screenFx = new ScreenFX();
    this.uiLayer.addChild(this.screenFx);
    this.hud = new HUD();
    this.uiLayer.addChild(this.hud);
    this.disposers.push(this.hud.powerTapped.connect(() => this.powerManager.toggle()));
  }

  private connectSignals(): void {
    this.disposers.push(
      GameState.runEnded.connect((victory, fragments) => this.onRunEnded(victory, fragments)),
    );
    this.disposers.push(
      GameState.damageDealt.connect((target, amount, position) => this.onDamageEvent(target, amount, position)),
    );
    this.disposers.push(
      GameState.leveledUp.connect(() => this.onLevelUp()),
    );
    this.disposers.push(
      this.world.enemyAdded.connect((enemy) => this.onEnemyAdded(enemy)),
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
        juice.addTrauma(0.9, 80);
        this.screenFx.flash(0xff5a3c, 0.35, 0.28);
        this.screenFx.shockwave(0xff5a3c, 0.65);
        this.fx.burst(this.party.anchor.x, this.party.anchor.y, { count: 42, color: 0xff5a3c, speed: 320, life: 0.9, size: 3.2 });
      }),
    );
    this.disposers.push(
      GameState.waveStarted.connect(() => {
        juice.addTrauma(0.22, 25);
        this.screenFx.flash(0xffd070, 0.16, 0.16);
      }),
    );
  }

  private onEnemyAdded(enemy: BaseEnemy): void {
    this.disposers.push(enemy.died.connect((dead) => {
      const color = dead.is_elite ? 0xff5a3c : 0xffd070;
      this.fx.burst(dead.position.x, dead.position.y, {
        count: dead.is_elite ? 52 : 16,
        color,
        speed: dead.is_elite ? 360 : 180,
        life: dead.is_elite ? 0.95 : 0.45,
        size: dead.is_elite ? 3.4 : 2.4,
      });
      juice.addTrauma(dead.is_elite ? 0.65 : 0.12, dead.is_elite ? 70 : 12);
      if (dead.is_elite) {
        this.screenFx.flash(0xfff0a6, 0.28, 0.24);
        this.screenFx.shockwave(0xfff0a6, 0.55);
      }
    }));
  }

  private onDamageEvent(target: unknown, amount: number, position: { x: number; y: number }): void {
    const hitEnemy = typeof target === 'object' && target !== null && 'enemy_name' in target;
    if (hitEnemy) {
      const elite = Boolean((target as { is_elite?: boolean }).is_elite);
      this.fx.burst(position.x, position.y, {
        count: elite ? 10 : 4,
        color: elite ? 0xffd966 : 0x9fffe0,
        speed: elite ? 180 : 95,
        life: 0.24,
        size: elite ? 2.2 : 1.5,
      });
      if (amount >= 30 || elite) juice.addTrauma(elite ? 0.12 : 0.06, elite ? 10 : 0);
      return;
    }

    this.screenFx.edges(0xff2f3d, 0.38);
    this.screenFx.flash(0xff2f3d, 0.18, 0.16);
    this.fx.burst(position.x, position.y, { count: 12, color: 0xff5a60, speed: 160, life: 0.38, size: 2.2 });
    juice.addTrauma(amount >= 25 ? 0.34 : 0.2, amount >= 25 ? 45 : 25);
  }

  private onLevelUp(): void {
    audioManager.playSfx('res://assets/audio/sfx/ui/Complete_01.wav', 0.7);
    juice.addTrauma(0.18, 25);
    this.screenFx.flash(0x6dffba, 0.22, 0.22);
    this.screenFx.shockwave(0x6dffba, 0.42);
    this.fx.burst(this.party.anchor.x, this.party.anchor.y, { count: 30, color: 0x6dffba, speed: 220, life: 0.6, size: 2.5 });
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
    } else if (wave === 2 && !this.powerOffered) {
      this.powerOffered = true;
      this.offerPower();
    }
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
    screen.powerChosen.connect((p) => this.onPowerChosen(p));
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
  }

  private onRunEnded(victory: boolean, fragments: number): void {
    if (this.endShown) return;
    this.endShown = true;
    if (victory) {
      audioManager.playSfx('res://assets/audio/sfx/ui/Complete_01.wav', 0.8);
      juice.addTrauma(0.35, [35, 35, 55]);
      this.screenFx.flash(0x6dffba, 0.28, 0.34);
      this.screenFx.shockwave(0x6dffba, 0.6);
      HubState.depositBackpack(GameState.backpack);
      const screen = new VictoryScreen(GameState.run_time, fragments);
      screen.hubRequested.connect(() => this.returnToHub());
      this.uiLayer.addChild(screen);
    } else {
      audioManager.playSfx('res://assets/audio/sfx/ui/Click_04.wav', 0.75);
      juice.addTrauma(0.55, [80, 40, 80]);
      this.screenFx.edges(0xff2f3d, 1);
      this.screenFx.flash(0xff2f3d, 0.32, 0.34);
      const screen = new GameOverScreen(GameState.run_time);
      screen.hubRequested.connect(() => this.returnToHub());
      screen.retryRequested.connect(() => this.retry());
      this.uiLayer.addChild(screen);
    }
  }

  private retry(): void {
    void sceneManager.replace(new HordasScene());
  }

  private returnToHub(): void {
    void sceneManager.replace(new HubScene());
  }

  // ── Camera ─────────────────────────────────────────────────────────────
  private camBaseX = 0;
  private camBaseY = 0;
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
    this.camBaseX += (clampedX - this.camBaseX) * t;
    this.camBaseY += (clampedY - this.camBaseY) * t;
    const shake = juice.update(dt);
    this.cameraLayer.x = this.camBaseX + shake.x;
    this.cameraLayer.y = this.camBaseY + shake.y;
    this.cameraLayer.rotation = shake.rot;
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
