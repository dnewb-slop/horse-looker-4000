// @ts-check
// HTML overlays drawn over and below the canvas: the camera-style zoom readout and the bottom
// strip. They read game state only; they never change it.

import { HORSES_PER_LEVEL, LEVEL_COUNT, MAX_STRIKES } from '../game/config.js';

/** What the looked-at list calls each horse breed. */
export const BREED_NAMES = { A: 'Friesian', B: 'Haflinger', C: 'Camarillo White' };

/** What the looked-at list calls each non-horse. */
export const KIND_NAMES = {
  goat: 'Goat',
  sheep: 'Sheep',
  centaur: 'Centaur',
  reverseCentaur: 'Reverse centaur',
  robotHorse: 'Robot horse',
  horseSuit: 'Horse suit',
};

/**
 * The looked-at list's label for an animal: its breed for a horse, its kind otherwise.
 * @param {{kind: import('../game/levels.js').AnimalKind, breed: import('../game/levels.js').Breed}} animal
 */
export function animalLabel(animal) {
  return animal.kind === 'horse' ? BREED_NAMES[animal.breed] : KIND_NAMES[animal.kind];
}

/**
 * Format a zoom factor like a camera display: "×1.0", "×4.5", "×24".
 * @param {number} factor
 */
export function formatZoom(factor) {
  const tenths = Math.round(factor * 10) / 10;
  return tenths < 10 ? `×${tenths.toFixed(1)}` : `×${Math.round(factor)}`;
}

/**
 * @param {HTMLElement} el
 */
export function createZoomReadout(el) {
  let shown = '';
  return {
    /** @param {number} factor */
    update(factor) {
      const text = formatZoom(factor);
      if (text !== shown) el.textContent = shown = text;
    },
  };
}

/**
 * @typedef {object} Chip
 * @property {number} id
 * @property {import('../game/world.js').AnimalKind} kind
 * @property {import('../game/world.js').Breed} breed
 * @property {string} label
 * @property {boolean} horse
 */

/**
 * @typedef {object} StripModel
 * @property {string} level e.g. "Level 1 / 3"
 * @property {string} horses e.g. "Horses 7/10"
 * @property {number} horseSlots filled slots of the horse meter
 * @property {string} strikes e.g. "Imposters 2/5": non-horses looked at, which end the game
 * @property {number} strikeSlots
 * @property {Chip[]} chips looked-at animals, newest first
 */

/**
 * Everything the bottom strip shows, worked out from the game state.
 * @param {import('../game/play.js').Play} play
 * @returns {StripModel}
 */
export function stripModel(play) {
  const byId = new Map(play.animals.map((a) => [a.id, a]));
  /** @type {Chip[]} */
  const chips = [];
  for (let i = play.lookedAt.length - 1; i >= 0; i--) {
    const a = byId.get(play.lookedAt[i]);
    if (!a) continue;
    chips.push({
      id: a.id,
      kind: a.kind,
      breed: a.breed,
      label: animalLabel(a),
      horse: a.kind === 'horse',
    });
  }
  const horses = Math.min(play.horsesThisLevel, HORSES_PER_LEVEL);
  const strikes = Math.min(play.nonHorsesTotal, MAX_STRIKES);
  return {
    level: `Level ${play.level} / ${LEVEL_COUNT}`,
    horses: `Horses ${horses}/${HORSES_PER_LEVEL}`,
    horseSlots: horses,
    strikes: `Imposters ${strikes}/${MAX_STRIKES}`,
    strikeSlots: strikes,
    chips,
  };
}

/**
 * @param {HTMLElement} root the strip element
 * @param {import('../render/sprites.js').SpriteSet} sprites for the chip icons
 */
export function createStrip(root, sprites) {
  /** @param {string} tag @param {string} className @param {HTMLElement} parent */
  const add = (tag, className, parent) => {
    const el = document.createElement(tag);
    el.className = className;
    parent.append(el);
    return el;
  };
  const progress = add('section', 'strip-progress', root);
  const levelEl = add('div', 'strip-level', progress);
  const horsesEl = add('div', 'strip-label', progress);
  const horseMeter = add('div', 'slots horse-meter', progress);
  const horseSlots = Array.from({ length: HORSES_PER_LEVEL }, () =>
    add('span', 'slot', horseMeter),
  );

  const strikesSection = add('section', 'strip-strikes', root);
  const strikesEl = add('div', 'strip-label', strikesSection);
  const strikeMeter = add('div', 'slots strike-meter', strikesSection);
  const strikeSlots = Array.from({ length: MAX_STRIKES }, () => add('span', 'slot', strikeMeter));

  const looked = add('section', 'strip-looked', root);
  add('div', 'strip-label', looked).textContent = 'Looked at';
  const chipList = add('ol', 'chips', looked);

  let shown = '';
  return {
    /** @param {import('../game/play.js').Play} play */
    update(play) {
      const model = stripModel(play);
      const key = JSON.stringify(model);
      if (key === shown) return;
      shown = key;
      levelEl.textContent = model.level;
      horsesEl.textContent = model.horses;
      horseSlots.forEach((s, i) => s.classList.toggle('filled', i < model.horseSlots));
      strikesEl.textContent = model.strikes;
      strikeSlots.forEach((s, i) => s.classList.toggle('filled', i < model.strikeSlots));
      chipList.replaceChildren(...model.chips.map((c) => chipElement(c, sprites)));
    },
  };
}

/**
 * A looked-at chip: the animal's Near sprite and its label, edged blue or red.
 * @param {Chip} chip
 * @param {import('../render/sprites.js').SpriteSet} sprites
 */
export function chipElement(chip, sprites) {
  const li = document.createElement('li');
  li.className = chip.horse ? 'chip horse' : 'chip non-horse';
  const icon = sprites.creatures[chip.kind][chip.breed].near;
  const canvas = document.createElement('canvas');
  canvas.width = icon.width;
  canvas.height = icon.height;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  ctx.drawImage(icon, 0, 0);
  const label = document.createElement('span');
  label.textContent = chip.label;
  li.append(canvas, label);
  return li;
}
