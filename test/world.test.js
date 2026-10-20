// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateHills, ridgeY } from '../src/game/world.js';
import { createRng } from '../src/game/rng.js';
import { HILL_COUNT, WORLD_WIDTH } from '../src/game/config.js';

test('the same seed makes the same hills', () => {
  assert.deepEqual(generateHills(createRng(5)), generateHills(createRng(5)));
});

test('hills are ordered back to front and cover the top of the pasture', () => {
  for (let seed = 0; seed < 200; seed++) {
    const hills = generateHills(createRng(seed));
    assert.equal(hills.length, HILL_COUNT);
    for (let i = 1; i < hills.length; i++) assert.ok(hills[i].baseY > hills[i - 1].baseY);
    for (let x = 0; x <= WORLD_WIDTH; x += 25) {
      assert.ok(ridgeY(hills[0], x) <= 0, `seed ${seed} leaves a gap at x=${x}`);
    }
  }
});
