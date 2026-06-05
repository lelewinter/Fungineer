// ============================================================================
// HORDAS — TIPOS DAS "COISAS" QUE VIVEM NA ARENA (entidades)
// ----------------------------------------------------------------------------
// Aqui ficam as descricoes ("formatos") de cada objeto movel do jogo: inimigo,
// projetil, gema de XP, anel de explosao, planta de buff e nodulo de coleta.
//
// Pense nestes "interfaces" como fichas em branco: dizem QUAIS dados cada coisa
// guarda (posicao, vida, etc.), mas nao fazem nada sozinhas — a logica que
// mexe nesses dados mora nos arquivos de "sistemas".
// ============================================================================

import type { Vec2 } from '../../../core/types';
import type { EKind, PlantType } from './config';

// Um inimigo concreto na arena (uma copia da ficha tecnica + estado atual).
export interface Enemy {
  kind: EKind;
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  dmg: number;
  r: number;
  xp: number;
  color: number;
  flash: number;    // tempinho em que pisca branco ao levar dano
  touchCd: number;  // recarga ate poder machucar o jogador de novo
  orbitCd: number;  // recarga ate poder ser atingido pelos bulbos orbitais
  pushX: number;    // empurrao acumulado da separacao neste frame (eixo X)
  pushY: number;    // empurrao acumulado da separacao neste frame (eixo Y)
}

// Um dardo disparado. "hit" guarda quais inimigos ja foram atingidos por ele,
// para nao bater duas vezes no mesmo (importante quando o dardo atravessa).
export interface Proj { pos: Vec2; vel: Vec2; life: number; dmg: number; pierce: number; hit: Set<Enemy> }

// Uma gema de experiencia que cai de um inimigo morto.
export interface Gem { pos: Vec2; vel: Vec2; value: number; t: number }

// Um anel de explosao (nova) que cresce e some.
export interface Nova { x: number; y: number; r: number; max: number; life: number }

// Uma planta de buff espalhada pelo mapa.
export interface Plant { pos: Vec2; type: PlantType; phase: number }

// Um nodulo de biomassa: o objetivo. "progress" e o quanto ja foi canalizado.
export interface Node { pos: Vec2; phase: number; progress: number }

// Uma das tres cartas oferecidas ao subir de nivel.
export interface Offer {
  kind: 'weapon' | 'passive' | 'heal' | 'boost';
  id?: import('./config').WeaponId | import('./config').PassiveId | import('./config').BoostId;
  name: string;
  desc: string;
  tag: string;
}

// Sorteia um numero real entre a (inclusive) e b. Atalho usado em varios lugares.
export const rand = (a: number, b: number): number => a + Math.random() * (b - a);
