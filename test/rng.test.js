// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, randomBetween } from '../src/game/rng.js';

test('the same seed gives the same sequence', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});

test('different seeds give different sequences', () => {
  assert.notEqual(createRng(1)(), createRng(2)());
});

test('values stay in [0, 1)', () => {
  const rng = createRng(7);
  for (let i = 0; i < 10_000; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
  }
});

test('randomBetween stays in [min, max)', () => {
  const rng = createRng(3);
  for (let i = 0; i < 1_000; i++) {
    const v = randomBetween(rng, 0.15, 0.3);
    assert.ok(v >= 0.15 && v < 0.3, `out of range: ${v}`);
  }
});
