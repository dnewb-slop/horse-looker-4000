// @ts-check
// Every color the game draws. Sprites will refer to these by key.

/** Hillsides from back (far, hazier) to front (near, richer). */
export const HILL_COLORS = [
  '#9fbf7a',
  '#8fb56a',
  '#7faa5c',
  '#6f9e4f',
  '#619244',
  '#55863b',
  '#4a7a33',
];

/** Thin lighter line along each ridge, so overlapping hills read as separate. */
export const RIDGE_HIGHLIGHT = 'rgba(214, 235, 160, 0.35)';

/** Shown outside the pasture when the window's shape differs from the pasture's. */
export const OUT_OF_BOUNDS = '#24381b';

/** Grass tufts drawn at close zoom. */
export const TUFT_COLOR = '#3c6a2a';
