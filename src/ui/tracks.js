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
 * One per level. A level whose track is null plays no music. The owner picks the tracks by ear
 * (milestone 10), so these stay empty until then.
 * @type {(Track | null)[]}
 */
export const TRACKS = [null, null, null];
