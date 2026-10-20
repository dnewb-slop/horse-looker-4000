// @ts-check
// The level table from DESIGN.md, and what each level's pasture is stocked with.

/**
 * @typedef {'horse' | 'goat' | 'sheep' | 'centaur' | 'reverseCentaur' | 'robotHorse' | 'horseSuit'}
 *   AnimalKind
 * @typedef {'A' | 'B' | 'C'} Breed
 */

/**
 * @typedef {object} LevelDef
 * @property {number} horses
 * @property {number} goatsAndSheep split between goats and sheep at random
 * @property {number} others look-alikes of random kinds
 * @property {Breed[]} breeds horse breeds, chosen at random per horse
 */

/** @type {LevelDef[]} */
export const LEVELS = [
  { horses: 20, goatsAndSheep: 20, others: 0, breeds: ['A'] },
  { horses: 16, goatsAndSheep: 64, others: 0, breeds: ['A', 'B', 'C'] },
  { horses: 16, goatsAndSheep: 48, others: 16, breeds: ['A', 'B', 'C'] },
];

/** Look-alikes besides goats and sheep. */
/** @type {AnimalKind[]} */
export const OTHER_KINDS = ['centaur', 'reverseCentaur', 'robotHorse', 'horseSuit'];

/**
 * Every non-horse wears the coat of the horse breed it imitates (DESIGN.md, Animal details).
 * @type {Record<Exclude<AnimalKind, 'horse'>, Breed>}
 */
export const LOOKALIKE_COAT = {
  goat: 'B',
  sheep: 'C',
  centaur: 'A',
  reverseCentaur: 'B',
  robotHorse: 'C',
  horseSuit: 'A',
};

/**
 * Seed for one level of a game, so `?seed=` reproduces every level exactly.
 * @param {number} seed the game's seed
 * @param {number} level 1-based
 */
export function levelSeed(seed, level) {
  return (seed + Math.imul(level, 0x9e3779b9)) >>> 0;
}

/**
 * The animals to spawn on a level, as kind and coat.
 * @param {() => number} rng
 * @param {LevelDef} def
 * @returns {{kind: AnimalKind, breed: Breed}[]}
 */
export function levelRoster(rng, def) {
  /** @type {{kind: AnimalKind, breed: Breed}[]} */
  const roster = [];
  for (let i = 0; i < def.horses; i++) {
    roster.push({ kind: 'horse', breed: def.breeds[Math.floor(rng() * def.breeds.length)] });
  }
  for (let i = 0; i < def.goatsAndSheep; i++) {
    const kind = rng() < 0.5 ? 'goat' : 'sheep';
    roster.push({ kind, breed: LOOKALIKE_COAT[kind] });
  }
  for (let i = 0; i < def.others; i++) {
    const kind = /** @type {Exclude<AnimalKind, 'horse'>} */ (
      OTHER_KINDS[Math.floor(rng() * OTHER_KINDS.length)]
    );
    roster.push({ kind, breed: LOOKALIKE_COAT[kind] });
  }
  return roster;
}
