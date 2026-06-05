/*
 * DamageNumbers — os "números de dano" que sobem e somem na tela, mais o banco
 * de efeitos sonoros de combate.
 *
 * Os números usam um "pool" (lista reutilizável) com limite máximo: quando
 * passa do teto, o mais antigo é descartado para abrir espaço. Isso evita criar
 * e destruir objetos sem parar, o que pesaria na performance.
 */
import { Text } from 'pixi.js';
import { FontFamily } from '../../core/typography';
import { audioManager } from '../../core/AudioManager';
import type { RunWorld } from '../RunWorld';
import type { Vec2 } from '../../core/types';

/** Um número de dano em movimento. ttl = "time to live" (tempo total de vida);
 *  elapsed = quanto desse tempo já passou. */
interface FloatNum {
  text: Text;
  velocityY: number;
  ttl: number;
  elapsed: number;
}

const POOL: FloatNum[] = [];
const MAX_LIVE = 60; // teto de números simultâneos na tela

/** Cria um número de dano flutuante (em coordenadas do mundo) que sobe e some.
 *  Cores usadas pelo jogo: 0xff8080 = dano recebido pela party; 0xffe899 = dano
 *  causado em inimigos; tons mais fortes para acertos grandes. */
export function spawnDamageNumber(
  world: RunWorld,
  pos: Vec2,
  value: number,
  color: number = 0xffffff,
): void {
  // Pool cheio: remove o mais antigo (o primeiro da fila) para abrir espaço.
  if (POOL.length >= MAX_LIVE) {
    const overflow = POOL.shift();
    if (overflow) {
      overflow.text.parent?.removeChild(overflow.text);
      overflow.text.destroy();
    }
  }
  const rounded = Math.max(1, Math.round(value)); // mostra ao menos "1"
  const text = new Text({
    text: String(rounded),
    style: {
      fontFamily: FontFamily.mono,
      fontSize: rounded >= 30 ? 14 : 11,
      fill: color,
      fontWeight: '700',
      stroke: { color: 0x000000, width: 2 },
    },
  });
  text.anchor.set(0.5, 1);
  // Espalha horizontalmente (±7px) para números empilhados não se sobreporem.
  text.x = pos.x + (Math.random() * 14 - 7);
  text.y = pos.y - 14;
  world.fxLayer.addChild(text);
  // velocityY negativo = sobe; o valor aleatório dá variação ao movimento.
  POOL.push({ text, velocityY: -36 - Math.random() * 20, ttl: 0.7, elapsed: 0 });
}

/** Atualiza todos os números (sobem, desbotam e crescem um pouco). Chamar uma
 *  vez por frame, a partir do update da cena da run. Iteramos de trás para
 *  frente para poder remover itens da lista com segurança. */
export function updateDamageNumbers(dt: number): void {
  for (let i = POOL.length - 1; i >= 0; i--) {
    const n = POOL[i]!;
    n.elapsed += dt;
    if (n.elapsed >= n.ttl) {
      n.text.parent?.removeChild(n.text);
      n.text.destroy();
      POOL.splice(i, 1);
      continue;
    }
    const t = n.elapsed / n.ttl; // progresso 0→1 da animação
    n.text.y += n.velocityY * dt; // sobe
    n.text.alpha = 1 - t * t;     // some acelerando no fim (curva quadrática)
    n.text.scale.set(1 + t * 0.15); // cresce levemente
  }
}

/** Banco de efeitos sonoros (SFX) de combate, agrupados por evento. */
export const CombatSfx = {
  hit: (volume: number = 0.4): void => {
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_06.wav', volume);
  },
  bossHit: (volume: number = 0.55): void => {
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_04.wav', volume);
  },
  death: (volume: number = 0.5): void => {
    audioManager.playSfx('res://assets/audio/sfx/ui/Complete_02.wav', volume);
  },
  partyHit: (volume: number = 0.45): void => {
    audioManager.playSfx('res://assets/audio/sfx/ui/Click_01.wav', volume);
  },
  waveStart: (): void => {
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_07.wav', 0.6);
  },
  bossSpawn: (): void => {
    audioManager.playSfx('res://assets/audio/sfx/ui/Complete_01.wav', 0.8);
  },
};
