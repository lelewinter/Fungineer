/**
 * types.ts — tipos e funcoes de matematica basica usados em todo o jogo.
 *
 * O centro daqui e o `Vec2`: um par de coordenadas (x, y) que representa uma
 * posicao, uma direcao ou um deslocamento no mundo 2D. As funcoes `v2*` fazem as
 * contas comuns com esses pares (somar, medir distancia, normalizar, etc.).
 * No fim ha tambem alguns ajudantes numericos gerais (clamp, lerp, sorteios).
 *
 * Termos tecnicos: "lerp" = interpolacao linear (mistura suave entre dois
 * valores); "clamp" = limitar um valor a um intervalo; "normalize" = transformar
 * um vetor para que ele tenha comprimento 1 (so a direcao, sem o tamanho).
 */

/** Um ponto/vetor 2D: posicao ou direcao no plano. */
export interface Vec2 {
  x: number;
  y: number;
}

/** Atalho para criar um Vec2 (ambos os eixos comecam em 0 por padrao). */
export const v2 = (x: number = 0, y: number = 0): Vec2 => ({ x, y });

/** Soma dois vetores (junta dois deslocamentos). */
export const v2Add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
/** Subtrai b de a (vetor que vai de b ate a). */
export const v2Sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
/** Multiplica o vetor por um numero (estica ou encolhe seu tamanho). */
export const v2Scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
/** Comprimento (tamanho) do vetor — a distancia da origem ate o ponto. */
export const v2Length = (a: Vec2): number => Math.hypot(a.x, a.y);
/** Distancia em linha reta entre dois pontos. */
export const v2Distance = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
/** Interpola entre a e b: t=0 retorna a, t=1 retorna b, valores no meio misturam. */
export const v2Lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
/** Normaliza: devolve um vetor de mesma direcao mas comprimento 1 (vetor zero fica zero). */
export const v2Normalize = (a: Vec2): Vec2 => {
  const len = v2Length(a);
  return len === 0 ? { x: 0, y: 0 } : { x: a.x / len, y: a.y / len };
};

/** Limita x ao intervalo [lo, hi]: menor que lo vira lo, maior que hi vira hi. */
export const clamp = (x: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, x));

/** Interpolacao linear entre dois numeros (t de 0 a 1 mistura a com b). */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Sorteia um numero decimal aleatorio no intervalo [lo, hi). */
export const randomRange = (lo: number, hi: number): number => lo + Math.random() * (hi - lo);

/** Sorteia um numero inteiro aleatorio no intervalo [lo, hi] (ambos inclusivos). */
export const randomInt = (lo: number, hi: number): number =>
  Math.floor(randomRange(lo, hi + 1));

/**
 * Embaralha um array NA PROPRIA estrutura (modifica o array recebido).
 * Usa o algoritmo Fisher-Yates: percorre de tras pra frente trocando cada
 * elemento com outro sorteado entre os ainda nao embaralhados — garante um
 * embaralhamento justo (toda ordem possivel tem a mesma chance).
 */
export const shuffleInPlace = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
};
