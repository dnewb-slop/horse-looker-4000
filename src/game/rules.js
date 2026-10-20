// @ts-check
// Scoring, winning and losing (DESIGN.md, Basic rules). Pure functions over the play state.

import { HORSES_PER_LEVEL, LEVEL_COUNT, MAX_STRIKES } from './config.js';

/**
 * @typedef {'intro' | 'playing' | 'levelComplete' | 'won' | 'lost'} Phase
 * @typedef {{kind: import('./levels.js').AnimalKind, breed: import('./levels.js').Breed}} LogEntry
 */

/**
 * Count newly looked-at animals: horses toward the level, non-horses toward the whole game's
 * imposters. Every one is kept in the game log for the end screens.
 * @template {{lookedAt: number[], horsesThisLevel: number, nonHorsesTotal: number, log: LogEntry[]}} T
 * @param {T} play
 * @param {import('./world.js').Animal[]} looked
 * @returns {T}
 */
export function countLooks(play, looked) {
  if (looked.length === 0) return play;
  const horses = looked.filter((a) => a.kind === 'horse').length;
  return {
    ...play,
    lookedAt: [...play.lookedAt, ...looked.map((a) => a.id)],
    horsesThisLevel: play.horsesThisLevel + horses,
    nonHorsesTotal: play.nonHorsesTotal + looked.length - horses,
    log: [...play.log, ...looked.map((a) => ({ kind: a.kind, breed: a.breed }))],
  };
}

/**
 * What happens next after the counts change. Losing wins ties: the game ends as soon as the
 * fifth non-horse is looked at, even if a tenth horse was looked at in the same instant.
 * @param {{level: number, horsesThisLevel: number, nonHorsesTotal: number}} play
 * @returns {Phase}
 */
export function nextPhase(play) {
  if (play.nonHorsesTotal >= MAX_STRIKES) return 'lost';
  if (play.horsesThisLevel >= HORSES_PER_LEVEL) return 'levelComplete';
  return 'playing';
}

/**
 * Whether finishing this level wins the game.
 * @param {number} level 1-based
 */
export function isLastLevel(level) {
  return level >= LEVEL_COUNT;
}
