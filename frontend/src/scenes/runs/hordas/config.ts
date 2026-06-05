// ============================================================================
// HORDAS — CONFIGURACAO E NUMEROS DO JOGO (balanceamento)
// ----------------------------------------------------------------------------
// Este arquivo guarda TODAS as "regrinhas numericas" da fase Hordas: quanto
// cada inimigo aguenta, a velocidade do jogador, de quanto em quanto tempo
// nascem inimigos, o poder de cada arma, etc.
//
// Por que separar? Imagine a receita de um bolo: os ingredientes (as
// quantidades) ficam numa lista, e o modo de preparo (a logica) fica em outro
// lugar. Assim quem quiser ajustar o "tempero" do jogo mexe so aqui, sem
// precisar entender o codigo que faz tudo funcionar.
//
// IMPORTANTE: nenhum destes valores foi alterado em relacao ao original — isto
// e apenas uma reorganizacao para deixar o balanceamento todo num so lugar.
// ============================================================================

import { Color } from '../../../core/Color';
import { GameConfig } from '../../../state/GameConfig';
import { ZONES } from '../../../state/Zones';

// Tamanho da tela (viewport) em que tudo e desenhado.
export const VW = GameConfig.VIEWPORT_WIDTH;
export const VH = GameConfig.VIEWPORT_HEIGHT;

// Dados da zona (nome, cor) — Hordas e a primeira zona da lista.
export const ZONE = ZONES[0]!;

// Uma volta completa em radianos (360 graus). Usado o tempo todo em angulos.
export const TAU = Math.PI * 2;

// Cor verde-floresta, o tom principal desta fase.
export const FOREST = Color.hex(Color.rgb(0.38, 0.82, 0.47));

// Sombra usada nos textos para que fiquem legiveis sobre o cenario movimentado.
export const SHADOW = { color: 0x000000, alpha: 0.85, blur: 3, distance: 1, angle: Math.PI / 2 } as const;

export const TOP = 46;   // altura da faixa de HUD no topo da tela
export const GRID = 48;  // espacamento da grade de fundo que rola conforme andamos

// ── Jogador (Dr. Paulo) ─────────────────────────────────────────────────────
export const PLAYER_R = 12;       // raio do circulo do jogador (hitbox)
export const BASE_HP = 100;       // vida inicial
export const BASE_SPEED = 240;    // velocidade base (pixels por segundo)
export const BASE_PICKUP = 50;    // raio em que gemas de XP comecam a ser atraidas
export const MOVE_ACCEL = 13;     // suavizacao da velocidade (da peso/inercia ao movimento)
export const JOY_DEAD = 8;        // zona morta do joystick (movimentos minusculos sao ignorados)
export const JOY_MAX = 64;        // quanto arrastar o dedo para chegar a velocidade maxima

// ── Inimigos (robos-jardineiros) — nascem num anel ao redor do jogador ───────
export const ENEMY_CAP = 160;     // numero maximo de inimigos vivos ao mesmo tempo (horda maior)
export const SPAWN_START = 1.1;   // intervalo inicial entre ondas de spawn (segundos)
export const SPAWN_MIN = 0.14;    // intervalo minimo (o jogo vai acelerando — ondas mais rapidas)
export const TOUCH_CD = 0.6;      // tempo de "recarga" do dano de toque de cada inimigo
export const SPAWN_RING = 520;    // distancia em que os inimigos nascem (logo fora da tela)
export const DESPAWN_R = 900;     // inimigos que se afastam demais sao removidos
export const SEPARATION = 0.5;    // forca do empurrao que evita inimigos amontoados
export const SEP_CELL = 34;       // tamanho da celula do spatial hash usado na separacao

// Tipos de inimigo desta fase.
export type EKind = 'sprout' | 'crawler' | 'brute' | 'boss';

// Ficha tecnica de cada tipo: vida, velocidade, dano, raio, XP que solta e cor.
export interface EnemyStat { hp: number; speed: number; dmg: number; r: number; xp: number; color: number }

// "Frescos": HP base um pouco menor (morrem rapido, ceifar a horda e gostoso),
// mas com dano de toque maior (a massa vira ameaca real, nao so estorvo).
export const ESTATS: Record<EKind, EnemyStat> = {
  sprout: { hp: 16, speed: 54, dmg: 9, r: 8, xp: 1, color: 0x4a5560 },
  crawler: { hp: 34, speed: 74, dmg: 13, r: 9, xp: 2, color: 0x5a6470 },
  brute: { hp: 110, speed: 36, dmg: 26, r: 14, xp: 5, color: 0x6a5560 },
  boss: { hp: 1400, speed: 32, dmg: 30, r: 24, xp: 40, color: 0x7a4a5a },
};

// ── Plantas de buff — raras; pisar numa da um bonus temporario ───────────────
// O cogumelo "orange" e especial: alem do efeito temporario, recupera vida.
export type PlantType = 'red' | 'blue' | 'green' | 'gold' | 'purple' | 'orange';
export interface PlantDef { color: number; name: string; short: string }

export const PLANTS: Record<PlantType, PlantDef> = {
  red: { color: 0xff5a5a, name: 'Carmesim', short: 'DANO' },
  blue: { color: 0x5ab0ff, name: 'Glacial', short: 'CADÊNCIA' },
  green: { color: 0x6dff9a, name: 'Veloz', short: 'VELOZ' },
  gold: { color: 0xffd36b, name: 'Áurea', short: 'ÍMÃ' },
  purple: { color: 0xc78fff, name: 'Esporal', short: 'ÁREA' },
  orange: { color: 0xff8a1e, name: 'Restauradora', short: 'CURA' },  // cogumelo laranja brilhante
};
export const PLANT_TYPES: PlantType[] = ['red', 'blue', 'green', 'gold', 'purple', 'orange'];

export const BUFF_TIME = 7;        // duracao do bonus de uma planta (segundos)
export const BUFF_MAX = 30;        // teto do tempo acumulado de um buff (eles EMPILHAM)
export const HEAL_INSTANT = 30;    // cura imediata ao pisar no cogumelo laranja
export const HEAL_REGEN = 6;       // vida por segundo enquanto o cogumelo laranja dura
export const PLANTS_NEARBY = 3;    // quantas plantas existem por perto ao mesmo tempo
export const PLANT_DIST = { min: 300, max: 540 };  // a que distancia elas nascem
export const PLANT_CULL_R = 760;   // plantas alem disto sao removidas

// ── Nodulos de biomassa — o objetivo arriscado (canalizar para coletar) ──────
export const HARVEST_NEARBY = 3;   // quantos nodulos existem por perto
export const HARVEST_TIME = 2.6;   // segundos parado e exposto para coletar um nodulo
export const HARVEST_DIST = { min: 220, max: 460 };  // a que distancia os nodulos nascem
export const HARVEST_DECAY = 0.7;  // progresso perdido por segundo ao sair de cima do nodulo
export const HARVEST_VULN = 1.5;   // dano de contato extra recebido enquanto coletando
export const HARVEST_SURGE = 0.85; // intervalo das ondas-punicao que nascem durante a coleta
export const GOAL = 6;             // minimo de biomassa para ABRIR a extracao

// ── Arsenal — armas automaticas estilo Vampire Survivors (nivel 1..5) ────────
export const MAXLV = 5;

// Cada arma e descrita por listas: o valor do indice N e o efeito no nivel N+1.
export const DART = {
  interval: [0.42, 0.34, 0.30, 0.26, 0.22],  // tempo entre disparos por nivel
  dmg: [7, 8, 9, 11, 13],                     // dano por dardo por nivel
  count: [1, 1, 2, 2, 3],                     // quantos dardos por disparo
  pierce: [0, 0, 0, 1, 1],                    // quantos inimigos cada dardo atravessa
};
export const PROJ_SPEED = 400;   // velocidade do dardo (pixels por segundo)
export const PROJ_LIFE = 1.2;    // tempo de vida do dardo antes de sumir (segundos)

export const AURA = { r: [46, 54, 62, 72, 84], dps: [10, 16, 22, 30, 40] };
export const ORBIT = { count: [2, 2, 3, 4, 5], dmg: [8, 11, 13, 15, 18], r: [40, 44, 48, 52, 56] };
export const NOVA = { cd: [4.0, 3.6, 3.2, 2.8, 2.4], dmg: [18, 24, 30, 38, 48], r: [90, 105, 120, 135, 150] };

export type WeaponId = 'dart' | 'aura' | 'orbit' | 'nova';
export type PassiveId = 'maxhp' | 'speed' | 'magnet' | 'power' | 'regen';

export const WEAPON_NAME: Record<WeaponId, string> = {
  dart: 'Bio-dardo', aura: 'Névoa de esporos', orbit: 'Bulbos orbitais', nova: 'Explosão de pólen',
};
export const WEAPON_DESC: Record<WeaponId, string> = {
  dart: 'Dispara no inimigo mais próximo. Sobe dano, cadência e projéteis.',
  aura: 'Esporos tóxicos corroem tudo ao seu redor, sem mirar.',
  orbit: 'Bulbos giram ao seu redor e esmagam quem chega perto.',
  nova: 'Pulsos de pólen explodem em área, empurrando a horda.',
};
export const PASSIVE_NAME: Record<PassiveId, string> = {
  maxhp: 'Casca reforçada', speed: 'Passada leve', magnet: 'Esporo magnético', power: 'Toxina concentrada', regen: 'Micélio curativo',
};
export const PASSIVE_DESC: Record<PassiveId, string> = {
  maxhp: '+35 vida máxima e cura na hora.',
  speed: '+30 de velocidade de movimento.',
  magnet: '+32 de raio de coleta de gemas.',
  power: '+22% de dano em todas as armas.',
  regen: '+1.3 de vida por segundo.',
};

// ── Reforços (limit break) — melhorias PERMANENTES que acumulam SEM LIMITE ────
// Entram no menu de level up junto das armas/passivas. Diferente delas, nunca
// "maxam": e o trilho de progressao infinito que mantem Myco ficando mais forte
// quanto mais a run dura, acompanhando os inimigos que engrossam com o tempo.
export type BoostId = 'edge' | 'bloom' | 'haste' | 'lure' | 'vigor';
export const BOOST_NAME: Record<BoostId, string> = {
  edge: 'Fio cortante', bloom: 'Esporo expansivo', haste: 'Ímpeto', lure: 'Atração', vigor: 'Vigor',
};
export const BOOST_DESC: Record<BoostId, string> = {
  edge: '+8% de dano. Acumula sem limite.',
  bloom: '+8% de área das armas. Acumula sem limite.',
  haste: '+6% de velocidade. Acumula sem limite.',
  lure: '+25 de raio de coleta. Acumula sem limite.',
  vigor: '+20 de vida máxima e cura igual. Acumula sem limite.',
};
// Magnitude de cada reforço por acumulo (lido pela cena ao recalcular atributos).
export const BOOST_VAL = { edge: 0.08, bloom: 0.08, haste: 0.06, lure: 25, vigor: 20 } as const;
export const BOOST_IDS: BoostId[] = ['edge', 'bloom', 'haste', 'lure', 'vigor'];
