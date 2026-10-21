// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OAK_GRASS_SPREAD_X, OAK_GRASS_SPREAD_Y, OAK_GRASS_TUFTS } from '../src/game/config.js';
import { createPlay } from '../src/game/play.js';
import { ridgeY } from '../src/game/world.js';
import { oakGrass } from '../src/render/renderer.js';

test('every live oak gets lots of grass around its trunk, on its own hill', () => {
  for (let seed = 0; seed < 20; seed++) {
    const { scenery, hills } = createPlay(seed, 2);
    const oaks = scenery.filter((s) => s.kind === 'oak');
    const grass = oakGrass(scenery, hills, seed);
    for (const oak of oaks) {
      const near = grass.filter(
        (t) =>
          t.hill === oak.hill &&
          Math.abs(t.x - oak.x) <= OAK_GRASS_SPREAD_X &&
          Math.abs(t.y - oak.y) <= OAK_GRASS_SPREAD_Y,
      );
      // A few tufts can fall past the crest of a tree near the top of its slope.
      assert.ok(near.length > OAK_GRASS_TUFTS / 2, `seed ${seed}: ${near.length} tufts`);
    }
    for (const t of grass) assert.ok(ridgeY(hills[t.hill], t.x) <= t.y, 'grass below the crest');
  }
});

test('the grass stays put: same scenery, same tufts', () => {
  const { scenery, hills } = createPlay(7, 3);
  assert.deepEqual(oakGrass([...scenery], hills, 7), oakGrass(scenery, hills, 7));
});
