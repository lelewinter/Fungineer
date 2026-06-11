/**
 * HubState — A "memoria permanente" da base do jogador.
 * ----------------------------------------------------
 * Em linguagem simples: este e o cofre do progresso de longo prazo. Tudo o que
 * deve sobreviver entre partidas mora aqui — os recursos no estoque (stock),
 * quantas pecas do foguete ja foram construidas, quais zonas estao liberadas,
 * o quanto cada zona se "deteriorou", os fragmentos de lore encontrados e as
 * preferencias visuais do hub.
 *
 * Como funciona o foguete: quando o jogador deposita recursos, o jogo tenta
 * automaticamente "comprar" a proxima peca do foguete seguindo uma receita
 * (ROCKET_RECIPE). Cada peca custa certos recursos; havendo o bastante, a peca
 * e construida e o estoque e descontado.
 *
 * Sobre os signals: o HubState avisa quando algo muda (estoque, pecas, etc).
 * O SaveService escuta esses avisos para salvar o progresso automaticamente.
 *
 * Por fim, ele sabe virar um "snapshot" (uma foto serializavel do estado) para
 * salvar, e reconstruir-se a partir de um snapshot ao carregar. O campo `v: 1`
 * e a versao do formato, para podermos migrar saves antigos no futuro.
 *
 * E um singleton: existe UMA instancia (`HubState`), exportada no fim.
 */

import { Color, type RGBA } from '../core/Color';
import { Signal } from '../core/Signal';
import { LoreFragments, type LoreFragment } from '../data/LoreFragments';
import { CharacterRegistry } from './CharacterRegistry';
import { GameConfig } from './GameConfig';
import { HubData, type HubNpc, type HubRoom, type HubZone } from './HubData';

// Os tipos de recurso que o jogo coleta e gasta. Usar um tipo fechado evita
// erros de digitacao (so estes nomes sao aceitos pelo TypeScript).
export type ResourceKey =
  | 'scrap'
  | 'ai_components'
  | 'nucleo_logico'
  | 'combustivel_volatil'
  | 'sinais_controle'
  | 'biomassa_adaptativa'
  | 'fragmentos_estruturais';

// A "receita" de uma peca do foguete: o nome e quanto custa de cada recurso.
// Todos os custos sao opcionais — uma peca so cobra os recursos que listar.
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

// As pecas do foguete, NA ORDEM em que sao construidas. O jogo sempre constroi
// a proxima peca da lista assim que houver recursos para ela.
// Nomes player-facing em voz Dr. Myco (o foguete é uma semente biológica).
// As ResourceKey internas (scrap, nucleo_logico, …) NÃO mudam — só o `name`.
// sinais_controle reduzido (Rede 20→12, Ignição 30→18, total 50→30) para tirar
// o gargalo de fonte única do Campo — alvo ~3 runs de Campo. Ver
// design/systems/rocket-tuning-verified.md.
export const ROCKET_RECIPE: RocketRecipe[] = [
  { name: 'Raiz-Âncora', scrap: 3 },
  { name: 'Câmara Viva', combustivel_volatil: 3 },
  { name: 'Núcleo Lógico', nucleo_logico: 2 },
  { name: 'Casca Adaptada', fragmentos_estruturais: 3, scrap: 2 },
  { name: 'Rede de Esporo', ai_components: 4, sinais_controle: 12 },
  { name: 'Bolsão Vital', biomassa_adaptativa: 6, combustivel_volatil: 2 },
  { name: 'Blindagem Orgânica', fragmentos_estruturais: 3, ai_components: 3 },
  { name: 'Ignição Final', scrap: 2, nucleo_logico: 1, sinais_controle: 18, biomassa_adaptativa: 4 },
];

/** Micro-beat (voz Dr. Myco) exibido ao instalar a peça de mesmo índice em
 *  ROCKET_RECIPE. Copy: design/narrative/launch-and-piece-copy.md §2.2. */
export const PIECE_INSTALL_BEAT: string[] = [
  'Enraizou. Agora o foguete sabe onde está o chão.',
  'A câmara de fermentação está ativa. Ela já respira.',
  'Conexões estabelecidas. O foguete começou a pensar.',
  'Casca integrada. Resistência melhor que qualquer composto sintético.',
  'A rede propagou. Cada nó conversa com o outro — como um micélio saudável.',
  'Sistemas vitais respondem. Ele vai sobreviver lá fora.',
  'Blindagem fundida. A casca exterior cresceu junto com o núcleo.',
  'Ignição carregada. Agora só falta plantar ela no céu.',
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

// A ordem em que os comodos do hub seriam liberados conforme o foguete cresce.
// (Hoje tudo ja nasce liberado; mantido para compatibilidade e modos futuros.)
export const UNLOCK_ORDER: string[] = [
  'cozinha', 'enfermaria', 'server', 'vigia', 'arquivo', 'sala',
  'workshop', 'deposito', 'gestao', 'quarto_lena',
  'lab_rival', 'saida_hordas',
];

// O "snapshot": uma foto completa e serializavel do progresso, pronta para
// virar texto (JSON) e ser salva. O `v` e a versao do formato deste save.
export interface HubStateSnapshot {
  v: 1;
  stock: Record<ResourceKey, number>;
  rocket_pieces_built: number;
  rescued_characters: string[];
  zones_unlocked: boolean[];
  zone_deterioration: number[];
  total_runs: number;
  lore_found: string[];
  zones_introduced?: string[];
  hub_variant: HubVariantKey;
  hub_density: 'minimal' | 'balanced' | 'informative';
  hub_ui_visible: boolean;
  room_unlocked: Record<string, boolean>;
  story_intro_seen?: boolean;
  /** Confiança e resgates dos personagens (CharacterRegistry). Opcional para
   *  compatibilidade com saves antigos. */
  character_state?: { trust: Record<string, number>; rescued: string[] };
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

  /** Índices de peças construídas ainda não anunciados ao jogador (drenado pelo
   *  HubScene ao voltar ao hub — o depósito ocorre durante a run). Transiente,
   *  não entra no snapshot. */
  pending_piece_beats: number[] = [];

  /** Mirrors CharacterRegistry rescued list. Kept for backwards compat. */
  rescued_characters: string[] = [];

  // ── Zones ──
  zones_unlocked: boolean[] = [true, true, true, true, true, true, true, true, true, true, true];
  zone_deterioration: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  total_runs = 0;

  // ── Lore ──
  lore_found: string[] = [];

  // Zonas cujo cartão de ensino de movimento já foi mostrado (some depois).
  zones_introduced: string[] = [];

  // ── Hub view state ──
  hub_variant: HubVariantKey = 'fungus';
  hub_density: 'minimal' | 'balanced' | 'informative' = 'balanced';
  hub_ui_visible = true;

  // ── Room unlocks ──
  // Estado inicial = a casa do Dr. Myco recém-virada bunker: a saída pra
  // superfície, a forja (onde o Marcus se instala na intro) e o vão do foguete.
  // O resto destrava via resgates (ver state/StoryProgress.ts).
  room_unlocked: Record<string, boolean> = {
    saida_hordas: true,
    workshop: true,
    rocket_top: true,
    rocket_mid1: true,
    rocket_mid2: true,
    rocket_base: true,
  };

  /** O jogador já viu a cutscene de abertura (Marcus chegando)? */
  story_intro_seen = false;

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
  readonly storyFlagChanged = new Signal<[]>();

  // ── Room helpers ──
  // Gating narrativo: salas destravam quando o sobrevivente certo é resgatado
  // (ver state/StoryProgress.ts). Salas estruturais nascem destravadas.
  isRoomUnlocked(roomId: string): boolean {
    return this.room_unlocked[roomId] === true;
  }

  /** Marca a intro como vista e dispara persistência. */
  markIntroSeen(): void {
    if (this.story_intro_seen) return;
    this.story_intro_seen = true;
    this.storyFlagChanged.emit();
  }

  unlockRoom(roomId: string): void {
    if (this.room_unlocked[roomId]) return;
    this.room_unlocked[roomId] = true;
    this.roomUnlockedSignal.emit(roomId);
  }

  // Quantos comodos liberar para cada quantidade de pecas construidas.
  // O indice e o numero de pecas; o valor e quantos comodos da UNLOCK_ORDER
  // ficam disponiveis. (Tabela fixa porque a progressao nao segue uma formula
  // simples.) Mantido por compatibilidade — hoje todo comodo ja nasce liberado.
  private static readonly ROOMS_UNLOCKED_BY_PIECES = [0, 1, 2, 4, 6, 8, 10, 12, 14];

  // Libera os primeiros N comodos da ordem, conforme as pecas ja construidas.
  private unlockRoomsForPiecesBuilt(): void {
    const table = HubStateClass.ROOMS_UNLOCKED_BY_PIECES;
    // Acima do ultimo degrau, usa o maior valor da tabela.
    const idx = Math.min(this.rocket_pieces_built, table.length - 1);
    const count = table[idx]!;
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

  // ── Estoque / receita do foguete ──
  // Deposita uma quantidade de um recurso e tenta construir a proxima peca.
  depositFlow(key: ResourceKey, amount: number): void {
    if (key in this.stock) this.stock[key] += amount;
    this.stockChanged.emit(this.stock);
    this.tryBuildNextPiece();
  }

  // Despeja a mochila inteira no estoque (cada item conta como +1 do seu tipo).
  depositBackpack(backpack: string[]): void {
    for (const item of backpack) {
      if (item in this.stock) this.stock[item as ResourceKey] += 1;
    }
    this.stockChanged.emit(this.stock);
    this.tryBuildNextPiece();
  }

  // Constroi quantas pecas der com o estoque atual. O "while" permite construir
  // varias de uma vez se um deposito grande cobrir mais de uma receita.
  private tryBuildNextPiece(): void {
    while (this.rocket_pieces_built < ROCKET_RECIPE.length) {
      const recipe = ROCKET_RECIPE[this.rocket_pieces_built]!;
      if (this.canAfford(recipe)) {
        this.spend(recipe);
        const idx = this.rocket_pieces_built;
        this.rocket_pieces_built += 1;
        this.pending_piece_beats.push(idx);
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

  // Confere se ha estoque suficiente para todos os recursos exigidos na receita
  // (o campo "name" e ignorado por nao ser um custo).
  private canAfford(recipe: RocketRecipe): boolean {
    for (const key of Object.keys(recipe) as Array<keyof RocketRecipe>) {
      if (key === 'name') continue;
      const required = recipe[key] as number | undefined;
      if (required === undefined) continue;
      if ((this.stock[key as ResourceKey] ?? 0) < required) return false;
    }
    return true;
  }

  // Desconta do estoque o custo de uma receita ja confirmada como pagavel.
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

  /** Wipes run progress for a fresh playthrough after a successful launch.
   *  Cosmetic preferences (hub variant/density/visibility) are preserved. */
  resetForNewCycle(): void {
    for (const key of Object.keys(this.stock) as ResourceKey[]) this.stock[key] = 0;
    this.rocket_pieces_built = 0;
    this.pending_piece_beats = [];
    this.rescued_characters = [];
    this.zones_unlocked = this.zones_unlocked.map(() => true);
    this.zone_deterioration = this.zone_deterioration.map(() => 0);
    this.total_runs = 0;
    this.lore_found = [];
    this.room_unlocked = {
      saida_hordas: true, workshop: true,
      rocket_top: true, rocket_mid1: true, rocket_mid2: true, rocket_base: true,
    };
    CharacterRegistry.resetAll();
    this.stockChanged.emit(this.stock);
  }

  // Capacidade total da mochila: o valor base mais o bonus do Richard (que
  // aumenta conforme a confianca dele sobe).
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

  // ── Onboarding ──
  isZoneIntroduced(scene: string): boolean {
    return this.zones_introduced.includes(scene);
  }
  markZoneIntroduced(scene: string): void {
    if (!this.zones_introduced.includes(scene)) this.zones_introduced.push(scene);
  }

  /** Descobre (marca como encontrado) o primeiro fragmento ainda não-achado da
   *  zona dada, e devolve-o — ou null se a zona não tem fragmentos novos.
   *  Chamado na vitória de uma run (ver RunScene.endRun). */
  discoverFragmentForZone(loreZone: string): LoreFragment | null {
    const next = LoreFragments.getZoneFragments(loreZone).find((f) => !this.isLoreFound(f.id));
    if (!next) return null;
    this.markLoreFound(next.id);
    return next;
  }

  // ── Deterioracao das zonas ──
  // Quanto mais o jogador joga, mais "deterioradas" as zonas ficam, e mais
  // inimigos surgem. Este multiplicador (1.0, 1.25 ou 1.5) escala a quantidade
  // de inimigos por onda conforme o estagio de deterioracao da zona.
  getSpawnMultiplier(zoneId: number): number {
    const stage = this.zone_deterioration[zoneId] ?? 0;
    if (stage === 1) return 1.25;
    if (stage === 2) return 1.5;
    return 1.0;
  }

  onRunEnded(victory: boolean): void {
    this.total_runs += 1;
    this.updateDeterioration();
    // Confiança sobe por presença (toda run), com bônus por vitória. Avança os
    // arcos dos personagens ao longo do jogo, mesmo em derrotas.
    CharacterRegistry.advanceAllTrust(victory ? 6 : 3);
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
      zones_introduced: this.zones_introduced.slice(),
      hub_variant: this.hub_variant,
      hub_density: this.hub_density,
      hub_ui_visible: this.hub_ui_visible,
      room_unlocked: { ...this.room_unlocked },
      story_intro_seen: this.story_intro_seen,
      character_state: CharacterRegistry.snapshot(),
    };
  }

  // Reconstroi o estado a partir de um snapshot salvo. Devolve false (e nao
  // altera nada) se o dado for invalido ou de uma versao desconhecida. Cada
  // campo e checado individualmente para tolerar saves parciais/antigos.
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
    if (Array.isArray(s.zones_introduced)) this.zones_introduced = s.zones_introduced.slice();
    if (s.hub_variant && s.hub_variant in HUB_VARIANTS) this.hub_variant = s.hub_variant;
    if (s.hub_density) this.hub_density = s.hub_density;
    if (typeof s.hub_ui_visible === 'boolean') this.hub_ui_visible = s.hub_ui_visible;
    if (s.room_unlocked) this.room_unlocked = { ...s.room_unlocked };
    if (typeof s.story_intro_seen === 'boolean') this.story_intro_seen = s.story_intro_seen;
    if (s.character_state) CharacterRegistry.restore(s.character_state);
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
