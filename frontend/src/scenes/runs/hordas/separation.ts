// ============================================================================
// HORDAS — "EMPURRAO" ENTRE INIMIGOS (separation via spatial hash)
// ----------------------------------------------------------------------------
// Problema: quando dezenas de inimigos correm para o mesmo ponto (o jogador),
// eles tendem a virar uma bolota so, um em cima do outro. Feio e injusto.
//
// Solucao: a cada frame, todo inimigo da um empurraozinho leve nos vizinhos
// colados nele, espalhando a horda. Mas comparar CADA inimigo com TODOS os
// outros seria lento demais (cresce ao quadrado). Por isso usamos um
// "spatial hash": dividimos o mapa numa grade invisivel de celulas e so
// comparamos inimigos que estao na mesma celula ou nas vizinhas. Assim cada um
// olha poucos vizinhos, e o jogo continua fluido mesmo com a horda cheia.
//
// Os "buckets" (listas de cada celula) sao reaproveitados frame a frame para
// evitar criar e jogar fora memoria toda hora (reduz pausas do garbage collector).
// ============================================================================

import type { Enemy } from './entities';
import { SEP_CELL, SEPARATION } from './config';

// Transforma a coordenada (cx, cy) de uma celula da grade num numero unico,
// que serve de chave no Map. O "+32768" so garante que coordenadas negativas
// continuem virando chaves validas e distintas.
function cellKey(cx: number, cy: number): number {
  return (cx + 32768) * 65536 + (cy + 32768);
}

/** Resultado reutilizavel: a grade (Map) e o "estoque" de listas vazias. */
export interface SepScratch {
  grid: Map<number, Enemy[]>;
  bucketPool: Enemy[][];
}

export function createSepScratch(): SepScratch {
  return { grid: new Map<number, Enemy[]>(), bucketPool: [] };
}

/**
 * Calcula o empurrao de separacao de todos os inimigos e o guarda em e.pushX /
 * e.pushY (a cena aplica esse empurrao depois, ao mover cada inimigo).
 * O boss nao e empurrado — ele e pesado demais e so afasta os outros.
 */
export function computeSeparation(enemies: Enemy[], scratch: SepScratch): void {
  const n = enemies.length;
  const grid = scratch.grid;

  // Esvazia a grade do frame anterior, devolvendo as listas para o estoque.
  for (const arr of grid.values()) { arr.length = 0; scratch.bucketPool.push(arr); }
  grid.clear();

  // Coloca cada inimigo na celula correspondente a sua posicao.
  for (let i = 0; i < n; i++) {
    const e = enemies[i]!;
    e.pushX = 0; e.pushY = 0;
    const k = cellKey(Math.floor(e.pos.x / SEP_CELL), Math.floor(e.pos.y / SEP_CELL));
    let arr = grid.get(k);
    if (!arr) { arr = scratch.bucketPool.pop() ?? []; grid.set(k, arr); }
    arr.push(e);
  }

  // Para cada inimigo, olha so as 9 celulas ao redor e soma o empurrao dos que
  // estiverem sobrepostos a ele.
  for (let i = 0; i < n; i++) {
    const a = enemies[i]!;
    if (a.kind === 'boss') continue; // o boss empurra os outros mas nao e empurrado
    const cx = Math.floor(a.pos.x / SEP_CELL);
    const cy = Math.floor(a.pos.y / SEP_CELL);
    for (let gx = -1; gx <= 1; gx++) {
      for (let gy = -1; gy <= 1; gy++) {
        const arr = grid.get(cellKey(cx + gx, cy + gy));
        if (!arr) continue;
        for (let j = 0; j < arr.length; j++) {
          const b = arr[j]!;
          if (b === a) continue;
          const dx = a.pos.x - b.pos.x;
          const dy = a.pos.y - b.pos.y;
          const rr = a.r + b.r + 2;          // distancia minima desejada entre eles
          const d2 = dx * dx + dy * dy;       // distancia ao quadrado (evita raiz cara)
          if (d2 > 0.0001 && d2 < rr * rr) {
            const dist = Math.sqrt(d2);
            const push = ((rr - dist) / dist) * SEPARATION; // quanto mais grudados, mais forte
            a.pushX += dx * push; a.pushY += dy * push;
          }
        }
      }
    }
  }
}
