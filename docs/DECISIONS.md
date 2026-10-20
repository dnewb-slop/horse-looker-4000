# Decisions

Settled choices and why, newest first within each section. Check here before re-opening a question; changing one needs the owner's agreement and a new entry.

## Looking at horses (milestone 4, 2026-10-20)

| Decision            | Choice                                                                                                                                                                            | Why                                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Faster looks        | Look threshold 8–15% of the viewport height, peaking at 10% (was 15–30%, peaking at 20%); look meter fills in 0.5 s (was 1 s). Supersedes the planning entry                      | Owner playtest: less time to decide whether an animal is a horse. Looks now mostly finish at the Mid tier, about ×12–×24 on a typical screen |
| "Imposters" label   | The strikes counter in the bottom strip reads "Imposters 0/5"; code keeps the name strikes                                                                                        | Owner's choice of wording                                                                                                                    |
| Sandbox level       | Until milestone 5's level table, a level is 30 horses of all three breeds and no look-alikes                                                                                      | Lets the owner try looking at every breed before the rules arrive                                                                            |
| Head visibility     | The center of the head box must be above every crest in front and outside every scenery rectangle drawn in front of the animal                                                    | Simple, and matches what the player sees closely enough; scenery is treated as its full rectangle                                            |
| Grazing randomness  | Each animal carries its own mulberry32 state (`rngStep`), so grazing is a pure function of the animal                                                                             | Keeps `stepAnimals` pure and seeded without threading a shared generator through every tick                                                  |
| Walking             | Walks are mostly sideways (depth movement scaled by `GRAZE_DEPTH_SCALE`, 0.4), checked at 6 points against the slope and scenery bases before starting; blocked walks are skipped | Walking straight up or down a slope reads oddly from the side; checking up front keeps every step valid                                      |
| Scenery placement   | No two scenery sprites overlap, even on different hills; biggest objects are placed first                                                                                         | Simplest way to keep the pasture readable; placing big things first means they always fit                                                    |
| Draw order          | Each hill is followed by its own tufts, scenery and animals, sorted by base y; look meters are drawn last, on top                                                                 | Hiding comes from draw order; a meter shouldn't vanish behind a crest while it fills                                                         |
| Look meter position | Centered above the head                                                                                                                                                           | DESIGN.md asks for a bar above the head                                                                                                      |
| Looked-at outline   | Built at load from each grid: transparent cells touching the sprite, including diagonally, one grid pixel outside it; the dot gets a 2 px ring                                    | Traces the sprite exactly at every tier without per-frame work                                                                               |
| Bottom strip        | 96 px HTML strip under the canvas: level, horse meter, strikes, looked-at chips with the Near sprite as icon; the canvas (and the look threshold) uses the height above it        | Matches the plan's layout; the viewport the threshold refers to excludes the strip                                                           |

## Sprites (milestone 3, 2026-10-20)

| Decision                  | Choice                                                                                                                                                   | Why                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Horse size and zoom range | Horse is 24 × 16 world units; maximum zoom raised from 24× to 64×; wheel speed raised so the full range takes the same scrolling as before               | At 24× a horse could never reach the 15–30% look threshold while still being a dot at ×1   |
| Tier density              | Far, Mid and Near grids hold 0.5, 1 and 2 pixels per world unit; tier picked by a horse's on-screen height (dot below 8 px, Far below 32, Mid below 128) | Animals and scenery always share one pixel size                                            |
| Sprite scaling            | Exact scaling with smoothing off, not whole-pixel multiples                                                                                              | Whole-pixel snapping made sprites jump in size while zooming smoothly                      |
| Scenery art               | Drawn by small pure functions that output text grids at each tier's density, not hand-typed grids                                                        | A datacenter at Near is 480 pixels wide; generated grids keep it consistent and reviewable |
| Horse art                 | Grids generated from simple shapes, then reviewed on the sprite page                                                                                     | Consistent proportions across the three tiers                                              |
| Live oak size             | 4 horses wide, 3.5 tall (was 2.5)                                                                                                                        | At 2.5 the canopy was flat and read as a savanna acacia                                    |
| Sprite review page        | `tools/sprites.html`, dev-only, screenshotted by `e2e/sprites.spec.js`                                                                                   | Lets Claude and the owner judge art at real in-game sizes                                  |

## Hills and trees (2026-10-20)

| Decision         | Choice                                                                                                                            | Why                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Hills with depth | Added to the MVP as milestone 7: valleys hide animals, animals cross ridges by sinking and rising, peeking heads can be looked at | The ridge lines promise depth; making it real adds gameplay. Hiding comes from draw order, so the computational cost is negligible |
| Milestone 4      | Animals stay on their own hill (one layer each), with no ridge crossing                                                           | Fully playable before milestone 7, and the fallback if hill depth goes badly                                                       |
| Trees            | California live oaks instead of redwoods                                                                                          | Fit the rolling-pasture setting                                                                                                    |

## Pasture and zoom (milestone 2, 2026-10-20)

| Decision    | Choice                                                                                                                                          | Why                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Zoom easing | Eases `log(zoom)` rather than zoom                                                                                                              | A linear ease feels fast when zoomed out and sluggish when zoomed in                            |
| Zoom range  | 1× fits the whole pasture; 64× maximum (raised from 24× in milestone 3); a window with a different shape shows a dark border beside the pasture | The whole pasture is always reachable, and the camera never shows past its edges once zoomed in |
| Wheel input | Lines and pages converted to pixels; each event capped at 240 px                                                                                | Mice and trackpads feel similar, and a hard flick can't jump the whole range                    |
| Hills       | 7 bands from summed sine waves, generated from the seed; paler toward the back                                                                  | Cheap, deterministic, and reads as depth                                                        |
| Grass tufts | Placed by a hash of world cell and seed, shown from about 3 px tall                                                                             | Gives a sense of scale at close zoom and stays put while zooming                                |
| Seeds       | `?seed=123` reproduces a pasture; otherwise random                                                                                              | Reproducible bug reports and tests                                                              |
| Test hook   | `window.__horseLooker` exposes the seed and camera read-only                                                                                    | Browser tests can check camera state without parsing pixels                                     |

## Going public (2026-10-20)

| Decision                        | Choice                                       | Why                                                                                        |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Repo visibility                 | Public                                       | Free GitHub Pages and unlimited Actions minutes; friends can follow along                  |
| License                         | MIT                                          | Clear terms for a public repo                                                              |
| Who Claude takes direction from | Owner and collaborators only (see CLAUDE.md) | Anyone can open issues on a public repo                                                    |
| Music licenses                  | CC0 or CC BY 4.0 only; Pixabay dropped       | The Pixabay Content License restricts redistributing files as-is, which a public repo does |

## Tooling (milestone 1, 2026-10-20)

| Decision           | Choice                                                                      | Why                                                                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install scripts    | `allowScripts` denies `fsevents` (Playwright's optional macOS file watcher) | Newer npm asks before running install scripts. `fsevents` only speeds up Playwright's watch mode; denying it keeps installs from compiling native code. Older npm ignores the field |
| Playwright version | `@playwright/test` pinned to 1.56.1                                         | Matches the Chromium preinstalled in Claude cloud sessions, so local runs need no browser download. CI installs its own                                                             |
| TypeScript version | 5.9.3, JSDoc checking only (`tsc --noEmit`)                                 | Stable `checkJs` support; no build step                                                                                                                                             |
| Unit tests         | Node's built-in `node --test`                                               | No test-framework dependency                                                                                                                                                        |
| Dev server         | `tools/serve.js`, a small Node static server                                | Avoids a dependency just to serve files                                                                                                                                             |
| Pure-logic guard   | ESLint bans `Math.random` and `Date.now` in `src/game/`                     | Keeps game logic seeded and testable                                                                                                                                                |
| Pages build        | The Pages workflow publishes only `index.html`, `src/` and `audio/`         | Players never download tests or tools                                                                                                                                               |
| Screenshots        | Saved to `e2e/screenshots/`, not compared to baselines                      | For Claude and the owner to look at; pixel baselines would be brittle while art changes                                                                                             |

## Planning (2026-10-20)

| Decision          | Choice                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Platform          | Browser; HTML5 Canvas + plain JavaScript, no engine, GitHub Pages. Phaser is the fallback if we need physics or heavy animation     |
| MVP sprites       | Code-drawn text grids; AI-generated PNGs are a post-MVP upgrade                                                                     |
| Horse breeds      | A Friesian (black), B Haflinger (golden chestnut), C Camarillo White (white)                                                        |
| Looked-at marker  | Sprite outline, blue for horses, red for non-horses; rectangle fallback                                                             |
| Lose condition    | 5 non-horses over the whole game                                                                                                    |
| Animation         | Two-frame walk and graze, as its own milestone after the game is playable                                                           |
| Scenery           | Barns, California live oaks and datacenters (largest, at least twice a barn)                                                        |
| Zoom tiers        | Four tiers (Dot, Far, Mid, Near) with cutoffs as written; telltales first show at Mid                                               |
| Looked-at trigger | Per-animal threshold of 15–30% of viewport height, a 1 s look meter, every qualifying animal on screen counts, head must be visible |
| UI layout         | Bottom strip; strikes visible from the start; drag to pan                                                                           |
| "Horse again"     | Skips the intro, straight to level 1                                                                                                |
| Level sizes       | 40, 80, 80 animals; no time limit                                                                                                   |
| Music             | One calming licensed track per level; Claude shortlists, the owner picks                                                            |
| Merging           | Claude merges its own PRs, but asks the owner first on UI or visual-taste questions                                                 |
| Feedback          | Playtest notes in GitHub issues; rule changes via `docs/DESIGN.md`                                                                  |
