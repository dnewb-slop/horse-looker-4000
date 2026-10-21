// @ts-check
// Full-window screens over the game: the opening sequence, the "Level n complete" card, and the
// win and lose screens with "Horse again". They read game state only; clicks are handed back to
// main.js through callbacks.

import { introView } from '../game/intro.js';
import { musicCredits } from './audio.js';
import { animalLabel, chipElement } from './hud.js';

/** End-of-game lines from DESIGN.md. */
export const WIN_TEXT = "That's some damn fine horse looking!";
export const LOSE_TEXT =
  "Sorry kid, but you don't have what it takes to be an American horse looker.";

/**
 * @typedef {object} EndModel
 * @property {string} title
 * @property {{label: string, value: number}[]} stats empty on the win screen
 * @property {import('./hud.js').Chip[]} chips everything looked at this game, oldest first
 */

/**
 * The win or lose screen's content (DESIGN.md, Losing screen and Winning screen).
 * @param {import('../game/play.js').Play} play
 * @returns {EndModel}
 */
export function endModel(play) {
  if (play.phase === 'won') return { title: WIN_TEXT, stats: [], chips: [] };
  const horses = play.log.filter((e) => e.kind === 'horse').length;
  return {
    title: LOSE_TEXT,
    stats: [
      { label: 'Horses looked at', value: horses },
      { label: 'Non-horses looked at', value: play.log.length - horses },
      { label: 'Level reached', value: play.level },
    ],
    chips: play.log.map((e, i) => ({
      id: i,
      kind: e.kind,
      breed: e.breed,
      label: animalLabel(e),
      horse: e.kind === 'horse',
    })),
  };
}

/**
 * @param {HTMLElement} root the full-window overlay
 * @param {import('../render/sprites.js').SpriteSet} sprites for the looked-at icons
 * @param {(import('./tracks.js').Track | null)[]} tracks credited on the end screens
 * @param {{onClick: () => void, onHorseAgain: () => void}} handlers
 */
export function createScreens(root, sprites, tracks, handlers) {
  root.addEventListener('click', handlers.onClick);
  /** What is built into the overlay now, so it is only rebuilt when that changes. */
  let shown = '';

  /** @param {string} className @param {string} [text] */
  const el = (className, text = '') => {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    return div;
  };

  return {
    /** @param {import('../game/play.js').Play} play */
    update(play) {
      const key = play.phase === 'intro' ? `intro:${play.intro?.line}` : play.phase;
      if (play.phase === 'intro' && play.intro) {
        if (key !== shown) {
          root.replaceChildren(el('screen-line', introView(play.intro).text));
          root.className = 'screen shown intro';
        }
        // The intro's fades come from game time, so a click can cut a line short.
        /** @type {HTMLElement} */ (root.firstChild).style.opacity = String(
          introView(play.intro).opacity,
        );
        shown = key;
        return;
      }
      if (key === shown) return;
      shown = key;

      if (play.phase === 'playing' || play.phase === 'losing') {
        // Keep the old content while it fades out. The pasture stays in view, drained of
        // color, for the pause before the lose screen.
        root.className = 'screen';
        return;
      }
      if (play.phase === 'levelComplete') {
        root.replaceChildren(el('screen-line', `Level ${play.level} complete`));
        root.className = 'screen shown';
        return;
      }

      const model = endModel(play);
      /** @type {HTMLElement[]} */
      const parts = [el('screen-line', model.title)];
      if (model.stats.length > 0) {
        const stats = el('screen-stats');
        for (const s of model.stats) {
          const row = el('stat');
          row.append(el('stat-value', String(s.value)), el('stat-label', s.label));
          stats.append(row);
        }
        parts.push(stats);
      }
      if (model.chips.length > 0) {
        const list = document.createElement('ol');
        list.className = 'chips screen-log';
        list.append(...model.chips.map((c) => chipElement(c, sprites)));
        parts.push(list);
      }
      const again = document.createElement('button');
      again.type = 'button';
      again.className = 'horse-again';
      again.textContent = 'Horse again';
      again.addEventListener('click', (e) => {
        e.stopPropagation();
        handlers.onHorseAgain();
      });
      parts.push(again);
      const credits = musicCredits(tracks);
      if (credits.length > 0) parts.push(el('screen-credits', `Music: ${credits.join(' · ')}`));
      root.replaceChildren(...parts);
      root.className = 'screen shown end';
    },
  };
}
