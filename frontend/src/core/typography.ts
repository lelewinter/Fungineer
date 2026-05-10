/** Centralized typography. Use these constants everywhere. */

export const FontFamily = {
  /** "Major Mono Display" — for game title, banners, big numerals. */
  display: '"Major Mono Display", "Courier New", monospace',
  /** "Space Grotesk" — for body text, labels, UI. */
  body: '"Space Grotesk", system-ui, -apple-system, sans-serif',
  /** "IBM Plex Mono" — for HUD readouts, terminal-ish data. */
  mono: '"IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace',
} as const;

/** Reusable color tokens for text. */
export const TextColor = {
  ink: 0xe6f0d9,            // primary text on dark bg
  muted: 0x9aa697,          // secondary
  faint: 0x6e7a6c,          // ghost
  accent: 0xb573d8,          // spore purple
  bio: 0x4dc7b9,            // turquoise mycelium
  amber: 0xe89339,
  red: 0xc24d4d,
  white: 0xffffff,
  black: 0x000000,
} as const;
