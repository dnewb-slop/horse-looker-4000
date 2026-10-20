// @ts-check
// The game in progress: the current level's pasture, what the player has looked at, and the
// phase (playing, level complete, won or lost).

import { LEVEL_CARD_S } from './config.js';
import { stepLooks } from './detect.js';
import { LEVELS, levelRoster, levelSeed } from './levels.js';
import { createRng } from './rng.js';
import { countLooks, isLastLevel, nextPhase } from './rules.js';
import { generateHills, placeScenery, spawnAnimals, stepAnimals } from './world.js';

/**
 * @typedef {object} Play
 * @property {number} seed the game's seed; each level derives its own from it
 * @property {number} level 1-based
 * @property {import('./rules.js').Phase} phase
 * @property {number} cardTime seconds left on the "Level n complete" card
 * @property {import('./world.js').Hill[]} hills
 * @property {import('./world.js').Scenery[]} scenery
 * @property {import('./world.js').Animal[]} animals
 * @property {number[]} lookedAt ids of animals looked at this level, oldest first
 * @property {number} horsesThisLevel
 * @property {number} nonHorsesTotal across the whole game
 * @property {import('./rules.js').LogEntry[]} log every animal looked at this game, oldest first
 */

/**
 * Start a game at a level. The same seed and level always make the same pasture.
 * @param {number} seed
 * @param {number} [level] 1-based
 * @returns {Play}
 */
export function createPlay(seed, level = 1) {
  return {
    seed,
    phase: 'playing',
    cardTime: 0,
    nonHorsesTotal: 0,
    log: [],
    ...createLevel(seed, level),
  };
}

/**
 * A fresh pasture for one level.
 * @param {number} seed the game's seed
 * @param {number} level 1-based
 */
function createLevel(seed, level) {
  const rng = createRng(levelSeed(seed, level));
  const hills = generateHills(rng);
  const scenery = placeScenery(rng, hills);
  const roster = levelRoster(rng, LEVELS[level - 1]);
  const animals = spawnAnimals(rng, hills, scenery, roster);
  return { level, hills, scenery, animals, lookedAt: [], horsesThisLevel: 0 };
}

/**
 * Advance one logic step. Animals always graze; looks only count while playing.
 * @param {Play} play
 * @param {import('./camera.js').Camera} cam
 * @param {Record<import('./world.js').AnimalKind, import('./detect.js').HeadBox>} headBoxes
 * @param {number} dt
 * @returns {Play}
 */
export function stepPlay(play, cam, headBoxes, dt) {
  const grazed = stepAnimals(play.animals, play.hills, play.scenery, dt);
  if (play.phase === 'levelComplete') {
    const cardTime = play.cardTime - dt;
    if (cardTime > 0) return { ...play, animals: grazed, cardTime };
    if (isLastLevel(play.level)) return { ...play, animals: grazed, cardTime: 0, phase: 'won' };
    return { ...play, ...createLevel(play.seed, play.level + 1), phase: 'playing', cardTime: 0 };
  }
  if (play.phase !== 'playing') return { ...play, animals: grazed };

  const { animals, looked } = stepLooks(grazed, cam, headBoxes, play.hills, play.scenery, dt);
  const counted = countLooks({ ...play, animals }, looked);
  const phase = nextPhase(counted);
  if (phase === 'levelComplete') return { ...counted, phase, cardTime: LEVEL_CARD_S };
  return { ...counted, phase };
}
