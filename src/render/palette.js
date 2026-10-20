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

/**
 * Horse breed palettes. Keys match the horse art: o outline, B coat, b coat shade, w highlight,
 * M mane and tail, h hooves, e eye.
 * @type {Record<'A' | 'B' | 'C', Record<string, string>>}
 */
export const BREED_PALETTES = {
  // Friesian: jet black, thick black mane.
  A: {
    o: '#050506',
    B: '#24232a',
    b: '#151419',
    w: '#45434d',
    M: '#0b0b0d',
    h: '#38363d',
    e: '#8a8592',
  },
  // Haflinger: golden chestnut, blond mane and tail.
  B: {
    o: '#4a2c10',
    B: '#c8862a',
    b: '#9c6420',
    w: '#e3a752',
    M: '#f1d9a0',
    h: '#3b2a1a',
    e: '#1b120c',
  },
  // Camarillo White: pure white, dark eyes and hooves.
  C: {
    o: '#6f6a62',
    B: '#f4f1ea',
    b: '#cfcac0',
    w: '#ffffff',
    M: '#e6e1d6',
    h: '#3a3a3a',
    e: '#1d1d1d',
  },
};

/** @type {Record<string, string>} */
export const BARN_PALETTE = {
  o: '#2a1512',
  R: '#b03a2e',
  r: '#7d241c',
  W: '#f2ead8',
  D: '#3a1a14',
  k: '#4a4038',
};

/** @type {Record<string, string>} */
export const OAK_PALETTE = {
  o: '#1f2e14',
  G: '#4f6b2a',
  g: '#3a5220',
  L: '#6f8a3c',
  T: '#4a3a2a',
  t: '#33281d',
};

/** @type {Record<string, string>} */
export const DATACENTER_PALETTE = {
  o: '#2b3036',
  S: '#d5d9de',
  s: '#a9afb7',
  K: '#3d434b',
  U: '#8e959e',
  A: '#4fa3e0',
};

/** Looked-at marker for horses: blue, not green, so it stands out from the grass. */
export const MARKER_HORSE = '#2f8cff';
/** Looked-at marker for everything else. */
export const MARKER_NON_HORSE = '#ff3b30';

/**
 * Extra keys for look-alike art, on top of the breed palette that gives their coat:
 * S skin, T shirt, P trousers, R robot metal, r robot joints, K sneakers.
 * @type {Record<string, string>}
 */
export const LOOKALIKE_KEYS = {
  S: '#d9a37a',
  T: '#d6417a',
  P: '#3d4f73',
  R: '#a3acb6',
  r: '#59616b',
  K: '#ff2fa8',
};

/** Look meter: neutral white, so it doesn't give away what the animal is. */
export const LOOK_METER = '#ffffff';
export const LOOK_METER_BACK = 'rgba(0, 0, 0, 0.55)';
