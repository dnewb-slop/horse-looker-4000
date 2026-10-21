// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MUSIC_CROSSFADE_S } from '../src/game/config.js';
import { createEndPreview, createPlay } from '../src/game/play.js';
import { musicCredits, stepGains, trackIndex } from '../src/ui/audio.js';
import { TRACKS } from '../src/ui/tracks.js';
import { LEVELS } from '../src/game/levels.js';

test('each level plays its own track, from the intro through the end screens', () => {
  assert.equal(trackIndex(createPlay(1, 1, { intro: true })), 0);
  assert.equal(trackIndex(createPlay(1, 2)), 1);
  assert.equal(trackIndex(createEndPreview(1, 'won')), LEVELS.length - 1);
  assert.equal(trackIndex(createEndPreview(1, 'lost')), 1);
});

test('there is one track slot per level', () => {
  assert.equal(TRACKS.length, LEVELS.length);
});

test('a level change crossfades over MUSIC_CROSSFADE_S', () => {
  const dt = 1 / 60;
  let gains = [1, 0, 0];
  const steps = Math.round(MUSIC_CROSSFADE_S / dt);
  for (let i = 0; i < steps / 2; i++) gains = stepGains(gains, 1, dt);
  // Halfway, the old track is half down and the new one half up.
  assert.ok(Math.abs(gains[0] - 0.5) < 1e-6);
  assert.ok(Math.abs(gains[1] - 0.5) < 1e-6);
  for (let i = 0; i < steps; i++) gains = stepGains(gains, 1, dt);
  assert.deepEqual(gains, [0, 1, 0]);
});

test('gains stay between 0 and 1, and -1 fades everything out', () => {
  assert.deepEqual(stepGains([0.9, 0.1], 0, 10), [1, 0]);
  assert.deepEqual(stepGains([0.9, 0.1], -1, 10), [0, 0]);
});

test('credits name each track, its artist and its license, skipping empty levels', () => {
  const track = { file: 'audio/a.mp3', title: 'Meadow', artist: 'Someone', license: 'CC0' };
  assert.deepEqual(musicCredits([track, null]), ['“Meadow” by Someone (CC0)']);
  assert.deepEqual(musicCredits([null, null]), []);
});
