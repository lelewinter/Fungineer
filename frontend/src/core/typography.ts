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
  ink: 0xeef5e6,            // primary text on dark bg
  muted: 0xc3cdba,          // secondary — brightened for readability
  faint: 0x97a394,          // ghost — brightened for readability
  accent: 0xcf8ff0,          // spore purple — brighter
  bio: 0x6fe3d4,            // turquoise mycelium — brighter
  amber: 0xf3a955,
  red: 0xe06767,
  white: 0xffffff,
  black: 0x000000,
} as const;
