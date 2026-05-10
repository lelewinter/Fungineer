/** Helpers to bridge Godot's float Color(r,g,b,a) with Pixi's hex/RGBA. */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export const Color = {
  rgb(r: number, g: number, b: number, a: number = 1): RGBA {
    return { r, g, b, a };
  },

  hex(c: RGBA): number {
    const rr = Math.max(0, Math.min(255, Math.round(c.r * 255)));
    const gg = Math.max(0, Math.min(255, Math.round(c.g * 255)));
    const bb = Math.max(0, Math.min(255, Math.round(c.b * 255)));
    return (rr << 16) | (gg << 8) | bb;
  },

  /** CSS rgba() string. */
  css(c: RGBA): string {
    return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`;
  },

  WHITE: { r: 1, g: 1, b: 1, a: 1 } as RGBA,
  BLACK: { r: 0, g: 0, b: 0, a: 1 } as RGBA,
  RED: { r: 1, g: 0, b: 0, a: 1 } as RGBA,
  GREEN: { r: 0, g: 1, b: 0, a: 1 } as RGBA,
  BLUE: { r: 0, g: 0, b: 1, a: 1 } as RGBA,
};
