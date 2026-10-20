// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HORSES_PER_LEVEL, LEVEL_COUNT } from '../src/game/config.js';
import { LEVELS, LOOKALIKE_COAT, OTHER_KINDS, levelRoster, levelSeed } from '../src/game/levels.js';
import { createPlay } from '../src/game/play.js';
import { createRng } from '../src/game/rng.js';

test('the level table matches DESIGN.md', () => {
  assert.equal(LEVELS.length, LEVEL_COUNT);
  const sizes = LEVELS.map((l) => l.horses + l.goatsAndSheep + l.others);
  assert.deepEqual(sizes, [40, 80, 80]);
  assert.deepEqual(
    LEVELS.map((l) => l.horses),
    [20, 16, 16],
  );
  assert.deepEqual(LEVELS[0].breeds, ['A']);
  for (const l of LEVELS) assert.ok(l.horses >= HORSES_PER_LEVEL, 'every level is winnable');
});

test('rosters have the right mix, and look-alikes wear their paired coat', () => {
  for (let seed = 0; seed < 50; seed++) {
    LEVELS.forEach((def, i) => {
      const roster = levelRoster(createRng(seed), def);
      const horses = roster.filter((a) => a.kind === 'horse');
      const goatsAndSheep = roster.filter((a) => a.kind === 'goat' || a.kind === 'sheep');
      const others = roster.filter((a) => OTHER_KINDS.includes(a.kind));
      assert.equal(horses.length, def.horses, `level ${i + 1}`);
      assert.equal(goatsAndSheep.length, def.goatsAndSheep);
      assert.equal(others.length, def.others);
      for (const h of horses) assert.ok(def.breeds.includes(h.breed));
      for (const a of roster) {
        if (a.kind !== 'horse') assert.equal(a.breed, LOOKALIKE_COAT[a.kind]);
      }
    });
  }
});

test('level 2 and 3 use all three breeds; level 3 has every kind of look-alike', () => {
  const two = levelRoster(createRng(1), LEVELS[1]);
  assert.deepEqual(new Set(two.filter((a) => a.kind === 'horse').map((a) => a.breed)).size, 3);
  const three = levelRoster(createRng(1), LEVELS[2]);
  for (const kind of OTHER_KINDS)
    assert.ok(
      three.some((a) => a.kind === kind),
      kind,
    );
});

test('each level of a game gets its own reproducible seed', () => {
  const seeds = [1, 2, 3].map((level) => levelSeed(4000, level));
  assert.equal(new Set(seeds).size, 3);
  assert.deepEqual(createPlay(4000, 2), createPlay(4000, 2));
  assert.notDeepEqual(createPlay(4000, 2).animals, createPlay(4000, 3).animals);
});

test('every level spawns all of its animals', () => {
  for (let seed = 0; seed < 20; seed++) {
    for (let level = 1; level <= LEVEL_COUNT; level++) {
      const play = createPlay(seed * 977, level);
      const def = LEVELS[level - 1];
      assert.equal(play.animals.length, def.horses + def.goatsAndSheep + def.others);
    }
  }
});
