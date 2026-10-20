# Horse Looker 4000 — Game Design

This is the source of truth for how the game behaves. It was copied from the "Horse Looker 4000 — Game Design" doc on 2026-10-20, and that doc is now deprecated. Change the rules here, through an issue and a PR.

How the game is built lives in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). Numbers marked _(tune)_ there are starting values, adjusted after playtesting.

## Game background

The idea for Horse Looker 4000 came from an off-the-cuff joke in a group chat about how just about any game, even one with a name as ridiculous as Horse Looker 4000, could be a fun and engaging way to relax for a diehard gamer. As a group we then defined how the gameplay might work. This context is important because this game is meant to be weird and silly, yet also we hope that it could be genuinely fun. The audience is a small group of friends, in their early 40s, who remember the dawn of silly internet Flash games and simple JavaScript games.

## High-level game description

A fusion between Duck Hunter and Pokémon, where the player tries to identify and collect horses without accidentally collecting non-horses.

## Gameplay

### Opening sequence

The game opens with the text below. Each sentence appears on the screen briefly, bold white text against a black background, before fading out and being replaced by the next line. A click skips ahead.

> "The year is 4000."
>
> "The American Cowboy is dead. But there's one job the robots can't take ..."
>
> "It's you. The Horse Looker."

After the text above displays, the main game loop begins.

### Basic rules

- **Players:** single player.
- **Turns or time:** real-time. Levels have no time limit.
- **Scoring:** once the player looks at 10 horses in a level, they progress to the next level.
- **Winning:** for the MVP, the player wins upon finishing level 3.
- **Losing:** the player loses as soon as they have looked at 5 non-horses over the course of the game.

### Main game loop

The game displays rolling fields of grass from a great distance, as if the player is looking through a telephoto lens. The player zooms with the mouse wheel and pans by dragging. The goal is to zoom in on horses grazing in the pasture.

Once the player has zoomed in far enough on an animal, it becomes "looked at":

- Each animal has its own zoom threshold, so some are looked at sooner than others.
- A look meter above the animal fills over about a second while the player stays zoomed in. Zooming out before it fills drains it, which gives the player a moment to notice a goat and back off.
- Every animal on screen that meets its threshold fills its own meter, not just the one under the cursor.
- An animal only counts if its head is visible. A horse whose head is hidden behind a barn can't be looked at.

A looked-at animal stays in the game but is marked with a bright outline traced around its sprite: blue for horses, red for non-horses. When zoomed far out, a small ring of the same color circles it. If the sprite outline causes performance issues or needs complex code, it becomes a simple rectangular border instead.

Each looked-at animal also appears in a strip along the bottom of the screen that tracks the animals looked at on the current level. Like in Tetris, once you've looked at enough horses in a level, you progress to the next level.

The challenge is that the pasture is also populated with creatures that are not horses: goats, sheep, and other horse look-alikes. If the player zooms in on these far enough, the same "looked at" mechanism triggers.

### Scenery

The pasture contains barns, big trees (redwoods), and datacenters. Datacenters are the largest objects, small by datacenter standards but at least twice the size of a barn. Animals walk around scenery and can pass behind it, which can hide them.

### Animal details

- **Horse breeds:** for the MVP there are three breeds with distinct, solid coat colors, called A, B, and C.
  - **A — Friesian:** jet black coat, thick flowing mane and tail, bold silhouette.
  - **B — Haflinger:** golden chestnut coat with a blond mane and tail.
  - **C — Camarillo White:** pure white coat with dark eyes and hooves.
- **Goats and sheep:** goats share horse breed B's color. Sheep share horse breed C's color.
- **Other creatures:**
  - **Centaurs:** the horse body shares horse breed A's color.
  - **Reverse centaurs:** a human body with a long horse neck and horse head, in horse breed B's color.
  - **Robot horses:** look like horse breed C but have robot legs.
  - **Humans in a horse suit:** horse breed A's color, but actually two humans in a horse suit, distinguishable from a distance by their colorful sneakers.

Each look-alike's telltale (upright torso, robot legs, sneakers) first becomes visible at the middle zoom levels, so the player has to zoom partway in to check before committing.

### Animals for each level

| Level | Animals | Horses   | Goats and sheep               | Other creatures      | Horse breeds      |
| ----- | ------- | -------- | ----------------------------- | -------------------- | ----------------- |
| 1     | 40      | 50% (20) | 50%, mix randomized per level | none                 | A only            |
| 2     | 80      | 20% (16) | 80%, mix randomized per level | none                 | A, B, C at random |
| 3     | 80      | 20% (16) | 60%, mix randomized per level | 20%, kinds at random | A, B, C at random |

### Music

Each level has its own simple, calming music track, used under a license that allows it (CC0, CC BY 4.0 or the Pixabay Content License). The player can mute it.

### Losing screen

The main game loop fades away, and the player sees the words:

> "Sorry mate, but you don't have what it takes to be an American horse looker."

The screen displays all horses and non-horses the player has looked at. It also shows the total horses looked at, total non-horses looked at, and the level reached before the game ended.

The player may press a "Horse again" button to start a new game at level 1, skipping the opening sequence.

### Winning screen

The main game loop fades away, and the player sees the words:

> "That's some damn fine horse looking!"

The player may press a "Horse again" button to start a new game at level 1, skipping the opening sequence.

## Platform, look and scope

- **Platform:** desktop browser, built with HTML5 Canvas and plain JavaScript, hosted on GitHub Pages.
- **Controls:** a mouse or trackpad. The scroll wheel zooms in and out; dragging pans.
- **Art:** pixel art, with a diversity of horse and non-horse creatures that can be represented at different zoom levels. MVP sprites are drawn in code; AI-generated images are a post-MVP upgrade.

| Version              | What's in it                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MVP (first playable) | The smallest version that's still fun: three levels, and the player wins by completing all three.                                                                                    |
| Later                | More horses, more non-horse challenges, non-horse creatures (like goats) that follow the mouse cursor, high score tracking, variable-value horses, and AI-generated creature images. |
