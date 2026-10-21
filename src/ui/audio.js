// @ts-check
// Level music: one looping <audio> element per level, crossfaded when the level changes, and the
// mute button in the bottom strip. It reads game state only; it never changes it.

import { MUSIC_CROSSFADE_S, MUSIC_VOLUME } from '../game/config.js';

/** Where the mute setting is remembered between visits. */
export const MUTE_KEY = 'horseLooker.muted';

/**
 * Which level's track should be playing: the current level's, from the intro (level 1) through
 * the level-complete card and the end screens, so the music never cuts out mid-game.
 * @param {{level: number}} play
 * @returns {number} 0-based track index
 */
export function trackIndex(play) {
  return play.level - 1;
}

/**
 * Move every track's gain toward its target: 1 for the wanted track, 0 for the rest. A full
 * fade takes MUSIC_CROSSFADE_S, so a level change crossfades over that long.
 * @param {number[]} gains each track's gain, 0 to 1
 * @param {number} wanted index of the track that should be playing, or -1 for silence
 * @param {number} dt seconds since the last step
 * @returns {number[]}
 */
export function stepGains(gains, wanted, dt) {
  const change = dt / MUSIC_CROSSFADE_S;
  return gains.map((g, i) => (i === wanted ? Math.min(1, g + change) : Math.max(0, g - change)));
}

/**
 * The credit lines for the end screens. CC BY asks for title, artist and license.
 * @param {(import('./tracks.js').Track | null)[]} tracks
 * @returns {string[]}
 */
export function musicCredits(tracks) {
  return tracks.filter((t) => t !== null).map((t) => `“${t.title}” by ${t.artist} (${t.license})`);
}

/** @returns {boolean} */
function loadMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

/** @param {boolean} muted */
function saveMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch {
    // Private windows can refuse storage; the setting then lasts only this visit.
  }
}

const SPEAKER =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/>' +
  '<path class="waves" d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
  '<path class="cross" d="M16 9l6 6M22 9l-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

/**
 * @param {HTMLElement} strip where the mute button goes, at the right end
 * @param {(import('./tracks.js').Track | null)[]} tracks one per level
 */
export function createMusic(strip, tracks) {
  const players = tracks.map((t) => {
    if (!t) return null;
    const el = new Audio(t.file);
    el.loop = true;
    el.preload = 'none';
    el.volume = 0;
    return el;
  });
  let gains = tracks.map(() => 0);
  let muted = loadMuted();
  // Browsers block sound until the player interacts with the page; the first click or key
  // (usually skipping the intro) lets it start.
  let unlocked = false;
  const unlock = () => (unlocked = true);
  window.addEventListener('pointerdown', unlock, { capture: true, once: true });
  window.addEventListener('keydown', unlock, { capture: true, once: true });

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mute';
  button.innerHTML = SPEAKER;
  button.setAttribute('aria-label', 'Mute music');
  const showMuted = () => button.setAttribute('aria-pressed', String(muted));
  showMuted();
  button.addEventListener('click', () => {
    muted = !muted;
    saveMuted(muted);
    showMuted();
    for (const el of players) if (el) el.muted = muted;
  });
  for (const el of players) if (el) el.muted = muted;
  strip.append(button);

  return {
    /**
     * @param {{level: number}} play
     * @param {number} dt seconds since the last frame
     */
    update(play, dt) {
      if (!unlocked) return;
      gains = stepGains(gains, trackIndex(play), dt);
      players.forEach((el, i) => {
        if (!el) return;
        el.volume = gains[i] * MUSIC_VOLUME;
        if (gains[i] > 0 && el.paused && !el.error) {
          // A file that fails to load just leaves that level quiet; play() is retried only while
          // the browser is still holding sound back.
          el.play().catch(() => {});
        } else if (gains[i] === 0 && !el.paused) {
          // Faded out: stop, and start from the top next time this level comes round.
          el.pause();
          el.currentTime = 0;
        }
      });
    },
    /** For browser tests: what the music is doing. */
    get state() {
      return {
        muted,
        unlocked,
        gains,
        playing: players.map((el) => !!el && !el.paused),
      };
    },
  };
}
