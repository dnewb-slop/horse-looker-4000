// @ts-check
// The opening sequence (DESIGN.md): three lines, each fading in, holding and fading out on black.
// A click skips to the next line. Pure: the play state carries which line and how far into it.

import { INTRO_FADE_S, INTRO_HOLDS_S } from './config.js';

/** The opening lines, verbatim from DESIGN.md. */
export const INTRO_LINES = [
  'The year is 4000.',
  "The American Cowboy is dead. But there's one job the robots can't take ...",
  "It's you. The Horse Looker.",
];

/**
 * Seconds a line is on screen: fade in, hold, fade out.
 * @param {number} line
 */
export function introLineSeconds(line) {
  return INTRO_FADE_S * 2 + INTRO_HOLDS_S[line];
}

/**
 * Advance the intro by dt seconds and any clicks. Returns null once the last line is done.
 * @param {{line: number, time: number}} intro
 * @param {number} dt
 * @param {number} clicks clicks since the last step; each one skips a line
 * @returns {{line: number, time: number} | null}
 */
export function stepIntro(intro, dt, clicks) {
  let { line, time } = intro;
  if (clicks > 0) {
    line += clicks;
    time = 0;
  } else {
    time += dt;
    if (time >= introLineSeconds(line)) {
      // Carry the leftover into the next line, so the intro's length doesn't drift with ticks.
      time -= introLineSeconds(line);
      line += 1;
    }
  }
  return line >= INTRO_LINES.length ? null : { line, time };
}

/**
 * What to show: the current line and its opacity.
 * @param {{line: number, time: number}} intro
 */
export function introView(intro) {
  const { time } = intro;
  const fadeOutAt = INTRO_FADE_S + INTRO_HOLDS_S[intro.line];
  let opacity = 1;
  if (time < INTRO_FADE_S) opacity = time / INTRO_FADE_S;
  else if (time > fadeOutAt) opacity = Math.max(0, 1 - (time - fadeOutAt) / INTRO_FADE_S);
  return { text: INTRO_LINES[intro.line], opacity };
}
