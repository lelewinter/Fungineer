/** Centralized typography. Use these constants everywhere. */

export const FontFamily = {
  /** "Major Mono Display" — decorative; LOGO ONLY. Hard to read at UI sizes,
   *  so never use it for text that must be read (use `body` bold instead). */
  display: '"Major Mono Display", "Courier New", monospace',
  /** "Space Grotesk" — for body text, labels, UI, and headers. */
  body: '"Space Grotesk", system-ui, -apple-system, sans-serif',
  /** "IBM Plex Mono" — for HUD readouts, timers, terminal-ish data. */
  mono: '"IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace',
} as const;

/** Type scale (logical px — the game world renders at 480w then scales to the
 *  device, so keep UI text at the larger end of each range for legibility). */
export const FontSize = {
  micro: 11,   // smallest allowed — tiny captions only
  small: 12,
  label: 13,   // buttons, room labels, HUD secondary
  body: 14,    // briefings, paragraph text
  hud: 15,     // primary HUD readouts
  h2: 19,      // panel headers
  h1: 26,      // screen titles
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
} as const;

/** Reusable color tokens for text. Tuned for contrast on the dark UI. */
export const TextColor = {
  ink: 0xf2f7ec,            // primary text on dark bg
  muted: 0xccd5c2,          // secondary — readable, not washed out
  faint: 0xa3b09e,          // tertiary
  accent: 0xcf8ff0,          // spore purple — brighter
  bio: 0x77e8d8,            // turquoise mycelium — brighter
  amber: 0xf6b25e,
  red: 0xe87070,
  white: 0xffffff,
  black: 0x000000,
} as const;
