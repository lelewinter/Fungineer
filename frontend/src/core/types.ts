export interface Vec2 {
  x: number;
  y: number;
}

export const v2 = (x: number = 0, y: number = 0): Vec2 => ({ x, y });

export const v2Add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const v2Sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const v2Scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const v2Length = (a: Vec2): number => Math.hypot(a.x, a.y);
export const v2Distance = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
export const v2Lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
export const v2Normalize = (a: Vec2): Vec2 => {
  const len = v2Length(a);
  return len === 0 ? { x: 0, y: 0 } : { x: a.x / len, y: a.y / len };
};

export const clamp = (x: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, x));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const randomRange = (lo: number, hi: number): number => lo + Math.random() * (hi - lo);

export const randomInt = (lo: number, hi: number): number =>
  Math.floor(randomRange(lo, hi + 1));

export const shuffleInPlace = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
};
