// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { animalLabel, formatZoom, stripModel } from '../src/ui/hud.js';
import { cardText } from '../src/ui/screens.js';
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

test('non-horses are labeled by kind and marked as imposters', () => {
  const play = createPlay(1);
  const goat = play.animals.find((a) => a.kind === 'goat' || a.kind === 'sheep');
  assert.ok(goat);
  const model = stripModel({ ...play, lookedAt: [goat.id], nonHorsesTotal: 1 });
  assert.equal(model.strikes, 'Imposters 1/5');
  assert.equal(model.strikeSlots, 1);
  assert.deepEqual(model.chips[0].horse, false);
  assert.equal(model.chips[0].label, goat.kind === 'goat' ? 'Goat' : 'Sheep');
});

test('every kind has a label', () => {
  assert.equal(animalLabel({ kind: 'horse', breed: 'B' }), 'Haflinger');
  assert.equal(animalLabel({ kind: 'reverseCentaur', breed: 'B' }), 'Reverse centaur');
  assert.equal(animalLabel({ kind: 'horseSuit', breed: 'A' }), 'Horse suit');
});

test('the card shows level complete and the DESIGN.md end lines', () => {
  assert.equal(cardText({ phase: 'playing', level: 1 }), '');
  assert.equal(cardText({ phase: 'levelComplete', level: 2 }), 'Level 2 complete');
  assert.equal(cardText({ phase: 'won', level: 3 }), "That's some damn fine horse looking!");
  assert.match(cardText({ phase: 'lost', level: 1 }), /^Sorry mate/);
});
