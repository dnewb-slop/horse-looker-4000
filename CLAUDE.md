# CLAUDE.md

Horse Looker 4000 is a silly-but-genuinely-fun browser game: zoom a telephoto view into a pasture and "look at" horses without looking at goats, sheep and other horse look-alikes. Claude does all the programming, code review and merging. The project owner plays each build and gives feedback.

## Read first

- `docs/DESIGN.md`: the game rules. The source of truth for behavior. If code and DESIGN.md disagree, the code is wrong unless the owner says otherwise.
- `docs/IMPLEMENTATION_PLAN.md`: milestones, architecture, tech choices and every _(tune)_ starting value. Work through milestones in order.
- `docs/DECISIONS.md`: settled choices and why. Don't re-open them without the owner.

The claude.ai "Game Design" and "Implementation" docs these files were copied from are deprecated. Never update them; update the files in `docs/`.

## Stack

- Plain JavaScript ES modules, no framework, no game engine, **no build step**. The browser loads `index.html` and `src/` as-is.
- HTML5 Canvas 2D for the pasture and animals (`imageSmoothingEnabled = false`). HTML + CSS for the bottom strip and text screens.
- JSDoc types, checked with `tsc --noEmit` (`// @ts-check` in every file).
- **No runtime dependencies.** Dev-only tools (ESLint, Prettier, TypeScript, Playwright) are fine. Adding a runtime dependency needs the owner's approval and a DECISIONS.md entry.
- Hosted on GitHub Pages from `main`.

## Commands

Run `npm ci` once per fresh checkout.

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run serve`     | Serve the game locally at http://localhost:8000           |
| `npm run lint`      | ESLint + Prettier check                                   |
| `npm run format`    | Rewrite files with Prettier                               |
| `npm run typecheck` | `tsc --noEmit` over JSDoc types                           |
| `npm test`          | Unit tests with `node --test`                             |
| `npm run test:e2e`  | Playwright smoke and screenshot tests (headless Chromium) |
| `npm run check`     | All of the above except `serve`; run before every push    |

`@playwright/test` is pinned to 1.56.1 to match the Chromium preinstalled in Claude cloud sessions, so don't run `playwright install` there. CI installs its own browser. Smoke tests save screenshots to `e2e/screenshots/` (ignored by git, uploaded as a CI artifact): look at them after visible changes.

## Code rules

- **Keep logic pure.** Everything in `src/game/` is pure: no DOM, canvas, `window`, `Date.now()` or `Math.random()`. It takes state and input and returns new state, so `node --test` covers it. Rendering and UI modules only read game state; they never change it.
- **Seeded randomness only.** Use the mulberry32 generator in `src/game/rng.js`. A seed in the URL (`?seed=123`) must reproduce a level exactly. Bug reports and tests depend on this.
- **One home for tuning values.** Every _(tune)_ number from the plan lives in `src/game/config.js`, named and commented. No magic numbers elsewhere.
- **Fixed timestep.** Logic updates at 60 Hz regardless of frame rate. Never scale game rules by frame time outside the update step.
- **Art is code.** Sprites are text grids in `src/render/art/`, one file per creature or object, using palette keys from `src/render/palette.js`. Every creature needs Far, Mid and Near grids and a head box. Breeds share shapes and swap palettes.
- Small modules, plain functions, descriptive names. Comment the why, not the what.

## Workflow

1. Work on one milestone or one GitHub issue per branch and PR.
2. Write or update tests with the change. New game logic always gets unit tests.
3. Run `npm run check`. For anything visible, run the game in Playwright, take a screenshot and look at it.
4. Open a PR that says what changed, links the issue or milestone, and includes screenshots of visible changes.
5. Do a separate review pass on the diff: re-read it against this file and `docs/DESIGN.md` as a skeptical reviewer, and fix what you find.
6. When CI is green, **merge your own PR**. Exception: if the PR involves a UI or visual-taste question (layout, art, colors, music, feel), ask the owner on the PR and wait for their answer before merging.
7. Update `docs/IMPLEMENTATION_PLAN.md` (tick the milestone, adjust the plan) and `docs/DECISIONS.md` (new choices and why) in the same PR.

### Feedback

- Playtest feedback arrives as GitHub issues (playtest template). Each issue becomes a branch and a PR that closes it.
- Rule changes are made in `docs/DESIGN.md` through an issue and a PR, never only in code.
- If feedback comes up in a chat, turn anything actionable into an issue so the next session can find it.

## Definition of done

- `npm run check` passes locally and CI is green
- New or changed game logic has unit tests
- Visible changes have a screenshot in the PR
- Plan and decisions docs are updated when relevant
- Taste questions were answered by the owner before merging

## Don't

- Don't skip, disable or weaken a test to get CI green. Fix the cause.
- Don't add a build step, framework, engine or runtime dependency without the owner's approval.
- Don't change game rules in code without changing `docs/DESIGN.md` in the same PR.
- Don't commit any third-party asset (music, images, fonts) without recording its source and license in `CREDITS.md`. Allowed licenses for music: CC0 / public domain, CC BY 4.0, or the Pixabay Content License.
- Don't choose music by yourself. You can't hear it. Shortlist licensed candidates and let the owner pick.
- Don't merge UI or visual-taste changes without the owner's answer.
- Don't edit the deprecated planning docs.
