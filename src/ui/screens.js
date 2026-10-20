// @ts-check
// Full-window text cards over the game. For now: "Level n complete", and plain end-of-game
// lines until milestone 6 brings the real win and lose screens.

/** End-of-game lines from DESIGN.md. */
export const WIN_TEXT = "That's some damn fine horse looking!";
export const LOSE_TEXT =
  "Sorry mate, but you don't have what it takes to be an American horse looker.";

/**
 * The card's text for the game's phase, or '' when no card shows.
 * @param {{phase: import('../game/rules.js').Phase, level: number}} play
 */
export function cardText(play) {
  if (play.phase === 'levelComplete') return `Level ${play.level} complete`;
  if (play.phase === 'won') return WIN_TEXT;
  if (play.phase === 'lost') return LOSE_TEXT;
  return '';
}

/**
 * @param {HTMLElement} el
 */
export function createCard(el) {
  let shown = '';
  return {
    /** @param {{phase: import('../game/rules.js').Phase, level: number}} play */
    update(play) {
      const text = cardText(play);
      if (text === shown) return;
      shown = text;
      // Keep the old text while fading out.
      if (text) el.textContent = text;
      el.classList.toggle('shown', text !== '');
    },
  };
}
