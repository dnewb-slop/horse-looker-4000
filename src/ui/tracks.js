// @ts-check
// The music for each level, in level order. Every track's source and license is also listed in
// CREDITS.md; only CC0 / public domain or CC BY 4.0 tracks are allowed (see CLAUDE.md).

/**
 * @typedef {object} Track
 * @property {string} file served path, relative to index.html
 * @property {string} title
 * @property {string} artist
 * @property {string} license e.g. "CC BY 4.0" or "CC0"
 */

/**
 * One per level, picked by the owner (milestone 10). A level whose track is null plays no music.
 * Credit lines on the end screens come from these fields; CC BY asks for title, artist, source
 * and license, so the artist names the source where it is required.
 * @type {(Track | null)[]}
 */
export const TRACKS = [
  { file: 'audio/etirwer.ogg', title: 'Etirwer', artist: 'Kistol', license: 'CC0' },
  {
    file: 'audio/feel-good-island-loop.ogg',
    title: 'Feel Good Island Loop',
    artist: 'Brandon Morris, looped by AntumDeluge',
    license: 'CC0',
  },
  {
    file: 'audio/porch-swing-days-faster.ogg',
    title: 'Porch Swing Days - faster',
    artist: 'Kevin MacLeod (incompetech.com)',
    license: 'CC BY 4.0',
  },
];
