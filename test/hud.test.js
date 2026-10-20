// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatZoom, stripModel } from '../src/ui/hud.js';
import { createPlay } from '../src/game/play.js';

test('zoom reads like a camera display', () => {
  assert.equal(formatZoom(1), '×1.0');
  assert.equal(formatZoom(4.54), '×4.5');
  assert.equal(formatZoom(9.96), '×10');
  assert.equal(formatZoom(24), '×24');
});

test('the strip starts empty and lists looked-at animals newest first', () => {
  const play = createPlay(1);
  assert.deepEqual(stripModel(play), {
    level: 'Level 1 / 3',
    horses: 'Horses 0/10',
    horseSlots: 0,
    strikes: 'Imposters 0/5',
    strikeSlots: 0,
    chips: [],
  });

  const [first, second] = play.animals;
  const model = stripModel({ ...play, lookedAt: [first.id, second.id], horsesThisLevel: 2 });
  assert.equal(model.horses, 'Horses 2/10');
  assert.equal(model.horseSlots, 2);
  assert.deepEqual(
    model.chips.map((c) => c.id),
    [second.id, first.id],
  );
  assert.ok(model.chips.every((c) => c.horse && c.label.length > 0));
});
