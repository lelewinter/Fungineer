import { Color, type RGBA } from '../core/Color';
import { Signal } from '../core/Signal';
import { CharacterRegistry } from './CharacterRegistry';
import { GameConfig } from './GameConfig';
import { HubData, type HubNpc, type HubRoom, type HubZone } from './HubData';

export type ResourceKey =
  | 'scrap'
  | 'ai_components'
  | 'nucleo_logico'
  | 'combustivel_volatil'
  | 'sinais_controle'
  | 'biomassa_adaptativa'
  | 'fragmentos_estruturais';

export interface RocketRecipe {
  name: string;
  scrap?: number;
  ai_components?: number;
  nucleo_logico?: number;
  combustivel_volatil?: number;
  sinais_controle?: number;
  biomassa_adaptativa?: number;
  fragmentos_estruturais?: number;
}

export const ROCKET_RECIPE: RocketRecipe[] = [
  { name: 'Base Estrutural', scrap: 3 },
  { name: 'Motor Principal', combustivel_volatil: 3 },
  { name: 'Processador', nucleo_logico: 2 },
  { name: 'Revestimento', fragmentos_estruturais: 3, scrap: 2 },
  { name: 'Rede Neural', ai_components: 4, sinais_controle: 20 },
  { name: 'Sistema Vital', biomassa_adaptativa: 6, combustivel_volatil: 2 },
  { name: 'Blindagem Externa', fragmentos_estruturais: 3, ai_components: 3 },
  { name: 'Ignição Final', scrap: 2, nucleo_logico: 1, sinais_controle: 30, biomassa_adaptativa: 4 },
];

export interface Survivor {
  name: string;
  role: string;
  color: RGBA;
}

export const SURVIVOR_ROSTER: Survivor[] = [
  { name: 'Capitã Runa',  role: 'Guardiã',         color: Color.rgb(0.40, 0.90, 0.40) },
  { name: 'Brix',         role: 'Artilheiro',      color: Color.rgb(1.00, 0.60, 0.20) },
  { name: 'Zara',         role: 'Artificeira',     color: Color.rgb(0.90, 0.30, 0.30) },
  { name: 'Luz',          role: 'Médica',          color: Color.rgb(0.80, 0.40, 0.90) },
  { name: 'Ex-Exec',      role: 'Estrategista',    color: Color.rgb(0.60, 0.55, 0.45) },
  { name: 'Fio',          role: 'Hacker',          color: Color.rgb(0.20, 0.90, 0.70) },
  { name: 'Ferro-Velho',  role: 'Engenheiro',      color: Color.rgb(0.70, 0.65, 0.30) },
  { name: 'Mira',         role: 'Elite',           color: Color.rgb(0.90, 0.70, 0.20) },
  { name: 'Nulo',         role: 'Agente Stealth',  color: Color.rgb(0.55, 0.55, 0.65) },
];

export type HubVariantKey = 'fungus' | 'warm' | 'balanced' | 'blueprint';

export interface HubVariant {
  name: string;
  bg: RGBA;
  grid: RGBA;
  ink: RGBA;
  warm_light: RGBA;
  cool_light: RGBA;
  red_light: RGBA;
  accent: RGBA;
}

export const HUB_VARIANTS: Record<HubVariantKey, HubVariant> = {
  fungus: {
    name: 'Fungus Pântano',
    bg: Color.rgb(0.12, 0.13, 0.09),
    grid: Color.rgb(0.34, 0.27, 0.20),
    ink: Color.rgb(0.85, 0.92, 0.78),
    warm_light: Color.rgb(0.72, 0.45, 0.85),
    cool_light: Color.rgb(0.30, 0.78, 0.72),
    red_light: Color.rgb(0.78, 0.35, 0.45),
    accent: Color.rgb(0.72, 0.45, 0.85),
  },
  warm: {
    name: 'Warm Gambiarra',
    bg: Color.rgb(0.14, 0.09, 0.06),
    grid: Color.rgb(0.36, 0.30, 0.24),
    ink: Color.rgb(0.96, 0.89, 0.78),
    warm_light: Color.rgb(0.91, 0.58, 0.23),
    cool_light: Color.rgb(0.0, 1.0, 0.68),
    red_light: Color.rgb(0.82, 0.29, 0.25),
    accent: Color.rgb(0.91, 0.58, 0.23),
  },
  balanced: {
    name: 'Balanced',
    bg: Color.rgb(0.12, 0.11, 0.09),
    grid: Color.rgb(0.34, 0.34, 0.30),
    ink: Color.rgb(0.96, 0.89, 0.78),
    warm_light: Color.rgb(0.91, 0.58, 0.23),
    cool_light: Color.rgb(0.0, 1.0, 0.68),
    red_light: Color.rgb(0.82, 0.29, 0.25),
    accent: Color.rgb(0.91, 0.58, 0.23),
  },
  blueprint: {
    name: 'Blueprint Cold',
    bg: Color.rgb(0.08, 0.12, 0.18),
    grid: Color.rgb(0.26, 0.36, 0.48),
    ink: Color.rgb(0.6, 0.8, 1.0),
    warm_light: Color.rgb(0.0, 1.0, 0.68),
    cool_light: Color.rgb(0.0, 1.0, 0.68),
    red_light: Color.rgb(0.0, 1.0, 0.68),
    accent: Color.rgb(0.0, 1.0, 0.68),
  },
};

export const UNLOCK_ORDER: string[] = [
  'cozinha', 'enfermaria', 'server', 'vigia', 'arquivo', 'sala',
  'workshop', 'deposito', 'gestao', 'quarto_lena',
  'lab_rival', 'saida_hordas',
];

export interface HubStateSnapshot {
  v: 1;
  stock: Record<ResourceKey, number>;
  rocket_pieces_built: number;
  rescued_characters: string[];
  zones_unlocked: boolean[];
  zone_deterioration: number[];
  total_runs: number;
  lore_found: string[];
  hub_variant: HubVariantKey;
  hub_density: 'minimal' | 'balanced' | 'informative';
  hub_ui_visible: boolean;
  room_unlocked: Record<string, boolean>;
}

class HubStateClass {
  // ── Stock & rocket ──
  stock: Record<ResourceKey, number> = {
    scrap: 0,
    ai_components: 0,
    nucleo_logico: 0,
    combustivel_volatil: 0,
    sinais_controle: 0,
    biomassa_adaptativa: 0,
    fragmentos_estruturais: 0,
  };

  rocket_pieces_built = 0;

  /** Mirrors CharacterRegistry rescued list. Kept for backwards compat. */
  rescued_characters: string[] = [];

  // ── Zones ──
  zones_unlocked: boolean[] = [true, true, true, true, true, true, true, true, true, true, true];
  zone_deterioration: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  total_runs = 0;

  // ── Lore ──
  lore_found: string[] = [];

  // ── Hub view state ──
  hub_variant: HubVariantKey = 'fungus';
  hub_density: 'minimal' | 'balanced' | 'informative' = 'balanced';
  hub_ui_visible = true;

  // ── Room unlocks ──
  room_unlocked: Record<string, boolean> = {
    saida_hordas: true,
    lab_rival: true,
  };

  // ── Signals ──
  readonly stockChanged = new Signal<[stock: Record<ResourceKey, number>]>();
  readonly rocketPieceBuilt = new Signal<[pieceIndex: number, pieceName: string]>();
  readonly deteriorationChanged = new Signal<[zoneId: number, stage: number]>();
  readonly hubRoomSelected = new Signal<[roomId: string]>();
  readonly hubNpcSelected = new Signal<[npcId: string]>();
  readonly hubZoomOpened = new Signal<[roomId: string, zoneId: string]>();
  readonly hubZoomClosed = new Signal<[]>();
  readonly hubRocketOpened = new Signal<[]>();
  readonly hubRocketClosed = new Signal<[]>();
  readonly hubVariantChanged = new Signal<[variant: HubVariantKey]>();
  readonly roomUnlockedSignal = new Signal<[roomId: string]>();

  // ── Room helpers ──
  // The hub is the single main screen, so every room/zone is reachable from
  // the start (the old rocket-progression gating is retired). Kept as a method
  // so future modes could re-introduce gating without touching call sites.
  isRoomUnlocked(_roomId: string): boolean {
    return true;
  }

  unlockRoom(roomId: string): void {
    if (this.room_unlocked[roomId]) return;
    this.room_unlocked[roomId] = true;
    this.roomUnlockedSignal.emit(roomId);
  }

  private unlockRoomsForPiecesBuilt(): void {
    let count = 0;
    if (this.rocket_pieces_built >= 1) count = 1;
    if (this.rocket_pieces_built >= 2) count = 2;
    if (this.rocket_pieces_built >= 3) count = 4;
    if (this.rocket_pieces_built >= 4) count = 6;
    if (this.rocket_pieces_built >= 5) count = 8;
    if (this.rocket_pieces_built >= 6) count = 10;
    if (this.rocket_pieces_built >= 7) count = 12;
    if (this.rocket_pieces_built >= 8) count = 14;
    for (let i = 0; i < Math.min(count, UNLOCK_ORDER.length); i++) {
      this.unlockRoom(UNLOCK_ORDER[i]!);
    }
  }

  // ── Variant ──
  setHubVariant(key: HubVariantKey): void {
    if (key in HUB_VARIANTS) {
      this.hub_variant = key;
      this.hubVariantChanged.emit(key);
    }
  }

  getVariantData(): HubVariant {
    return HUB_VARIANTS[this.hub_variant] ?? HUB_VARIANTS.balanced;
  }

  // ── Stock / recipe ──
  depositFlow(key: ResourceKey, amount: number): void {
    if (key in this.stock) this.stock[key] += amount;
    this.stockChanged.emit(this.stock);
    this.tryBuildNextPiece();
  }

  depositBackpack(backpack: string[]): void {
    for (const item of backpack) {
      if (item in this.stock) this.stock[item as ResourceKey] += 1;
    }
    this.stockChanged.emit(this.stock);
    this.tryBuildNextPiece();
  }

  private tryBuildNextPiece(): void {
    while (this.rocket_pieces_built < ROCKET_RECIPE.length) {
      const recipe = ROCKET_RECIPE[this.rocket_pieces_built]!;
      if (this.canAfford(recipe)) {
        this.spend(recipe);
        const idx = this.rocket_pieces_built;
        this.rocket_pieces_built += 1;
        this.rocketPieceBuilt.emit(idx, recipe.name);
        this.checkZoneUnlocks();
        this.unlockRoomsForPiecesBuilt();
      } else {
        break;
      }
    }
  }

  private checkZoneUnlocks(): void {
    // All 11 zones playable from start; thresholds kept for legacy snapshots
    // and future gated re-introduction. Index 8..10 are surface-floor zones.
    const thresholds = [0, 1, 2, 3, 4, 5, 6, 7, 0, 0, 0];
    for (let i = 0; i < this.zones_unlocked.length; i++) {
      if (this.rocket_pieces_built >= (thresholds[i] ?? 0)) this.zones_unlocked[i] = true;
    }
  }

  private canAfford(recipe: RocketRecipe): boolean {
    for (const key of Object.keys(recipe) as Array<keyof RocketRecipe>) {
      if (key === 'name') continue;
      const required = recipe[key] as number | undefined;
      if (required === undefined) continue;
      if ((this.stock[key as ResourceKey] ?? 0) < required) return false;
    }
    return true;
  }

  private spend(recipe: RocketRecipe): void {
    for (const key of Object.keys(recipe) as Array<keyof RocketRecipe>) {
      if (key === 'name') continue;
      const cost = recipe[key] as number | undefined;
      if (cost === undefined) continue;
      this.stock[key as ResourceKey] -= cost;
    }
  }

  nextPieceCost(): RocketRecipe | null {
    if (this.rocket_pieces_built >= ROCKET_RECIPE.length) return null;
    return ROCKET_RECIPE[this.rocket_pieces_built]!;
  }

  isRocketComplete(): boolean {
    return this.rocket_pieces_built >= ROCKET_RECIPE.length;
  }

  getBackpackCapacity(): number {
    return GameConfig.BACKPACK_CAPACITY + CharacterRegistry.getBackpackBonus();
  }

  // ── Lore ──
  markLoreFound(fragmentId: string): void {
    if (!this.lore_found.includes(fragmentId)) this.lore_found.push(fragmentId);
  }

  isLoreFound(fragmentId: string): boolean {
    return this.lore_found.includes(fragmentId);
  }

  // ── Deterioration ──
  getSpawnMultiplier(zoneId: number): number {
    const stage = this.zone_deterioration[zoneId] ?? 0;
    if (stage === 1) return 1.25;
    if (stage === 2) return 1.5;
    return 1.0;
  }

  onRunEnded(_victory: boolean): void {
    this.total_runs += 1;
    this.updateDeterioration();
  }

  private updateDeterioration(): void {
    for (let i = 0; i < this.zone_deterioration.length; i++) {
      const old = this.zone_deterioration[i]!;
      let next = this.stageForRuns(this.total_runs);
      next = Math.min(next, 2);
      if (next !== old) {
        this.zone_deterioration[i] = next;
        this.deteriorationChanged.emit(i, next);
      }
    }
  }

  private stageForRuns(runs: number): number {
    if (runs >= GameConfig.DETERIORATION_STAGE2_RUNS) return 2;
    if (runs >= GameConfig.DETERIORATION_STAGE1_RUNS) return 1;
    return 0;
  }

  // ── Persistence ────────────────────────────────────────────────────────
  /** Opaque serialisable snapshot. The backend treats this as a black box;
   *  the schema version below lets us migrate later. */
  toSnapshot(): HubStateSnapshot {
    return {
      v: 1,
      stock: { ...this.stock },
      rocket_pieces_built: this.rocket_pieces_built,
      rescued_characters: this.rescued_characters.slice(),
      zones_unlocked: this.zones_unlocked.slice(),
      zone_deterioration: this.zone_deterioration.slice(),
      total_runs: this.total_runs,
      lore_found: this.lore_found.slice(),
      hub_variant: this.hub_variant,
      hub_density: this.hub_density,
      hub_ui_visible: this.hub_ui_visible,
      room_unlocked: { ...this.room_unlocked },
    };
  }

  loadFromSnapshot(snap: unknown): boolean {
    if (typeof snap !== 'object' || snap === null) return false;
    const s = snap as Partial<HubStateSnapshot>;
    if (s.v !== 1) return false;
    if (s.stock) Object.assign(this.stock, s.stock);
    if (typeof s.rocket_pieces_built === 'number') this.rocket_pieces_built = s.rocket_pieces_built;
    if (Array.isArray(s.rescued_characters)) this.rescued_characters = s.rescued_characters.slice();
    if (Array.isArray(s.zones_unlocked)) {
      this.zones_unlocked = s.zones_unlocked.map((v) => v === true);
      // Legacy 8-element saves: pad the new surface zones (8..10) as unlocked.
      while (this.zones_unlocked.length < 11) this.zones_unlocked.push(true);
    }
    if (Array.isArray(s.zone_deterioration)) {
      this.zone_deterioration = s.zone_deterioration.slice();
      while (this.zone_deterioration.length < 11) this.zone_deterioration.push(0);
    }
    if (typeof s.total_runs === 'number') this.total_runs = s.total_runs;
    if (Array.isArray(s.lore_found)) this.lore_found = s.lore_found.slice();
    if (s.hub_variant && s.hub_variant in HUB_VARIANTS) this.hub_variant = s.hub_variant;
    if (s.hub_density) this.hub_density = s.hub_density;
    if (typeof s.hub_ui_visible === 'boolean') this.hub_ui_visible = s.hub_ui_visible;
    if (s.room_unlocked) this.room_unlocked = { ...s.room_unlocked };
    this.stockChanged.emit(this.stock);
    this.hubVariantChanged.emit(this.hub_variant);
    return true;
  }

  // ── Hub data accessors (proxy to HubData) ──
  getRoomById(id: string): HubRoom | undefined {
    return HubData.getRoom(id);
  }
  getNpcById(id: string): HubNpc | undefined {
    return HubData.getNpc(id);
  }
  getZoneById(id: string): HubZone | undefined {
    return HubData.getZone(id);
  }
  getNpcsInRoom(roomId: string): HubNpc[] {
    return HubData.getNpcsInRoom(roomId);
  }
}

export const HubState = new HubStateClass();
