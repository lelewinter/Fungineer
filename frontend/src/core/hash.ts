/**
 * hash.ts — geradores de numeros "aleatorios" porem PREVISIVEIS.
 *
 * Em jogos, as vezes precisamos de algo que pareca aleatorio mas que de SEMPRE
 * o mesmo resultado quando partimos do mesmo ponto de partida (a "seed"/semente).
 * Isso permite, por exemplo, recriar exatamente o mesmo mapa ou a mesma sequencia
 * de inimigos. As duas funcoes aqui sao "deterministicas": mesma entrada, mesma
 * saida, sempre.
 *
 * - strHash: transforma um texto em um numero (uma "impressao digital" do texto).
 * - seededRng: cria um sorteador de numeros entre 0 e 1, controlado por uma seed.
 */

/**
 * Transforma uma string (texto) em um numero de 32 bits.
 * Usa o algoritmo FNV-1a, conhecido por espalhar bem os valores (textos
 * parecidos geram numeros bem diferentes). O resultado e sempre o mesmo para o
 * mesmo texto, util como semente para o sorteador abaixo.
 */
export function strHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    // Mistura cada caractere no acumulador: XOR seguido de multiplicacao por um
    // numero primo grande. E o coracao do FNV-1a.
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // `>>> 0` garante que o numero saia como inteiro positivo (sem sinal).
  return h >>> 0;
}

/**
 * Cria um "sorteador" de numeros pseudo-aleatorios a partir de uma seed.
 * Retorna uma funcao: cada chamada devolve um novo numero entre 0 e 1, mas a
 * SEQUENCIA inteira e reproduzivel se voce comecar com a mesma seed.
 * Usa o algoritmo Mulberry32, rapido e de boa qualidade para jogos.
 */
export function seededRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    // Cada chamada avanca o estado interno e o "embaralha" com varias operacoes
    // de bits para produzir um numero bem distribuido.
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    // Divide pelo maximo de 32 bits para normalizar o resultado para [0, 1).
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
