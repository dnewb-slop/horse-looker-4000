# Decisions

Settled choices and why, newest first within each section. Check here before re-opening a question; changing one needs the owner's agreement and a new entry.

## Going public (2026-10-20)

| Decision                        | Choice                                       | Why                                                                                        |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Repo visibility                 | Public                                       | Free GitHub Pages and unlimited Actions minutes; friends can follow along                  |
| License                         | MIT                                          | Clear terms for a public repo                                                              |
| Who Claude takes direction from | Owner and collaborators only (see CLAUDE.md) | Anyone can open issues on a public repo                                                    |
| Music licenses                  | CC0 or CC BY 4.0 only; Pixabay dropped       | The Pixabay Content License restricts redistributing files as-is, which a public repo does |

## Tooling (milestone 1, 2026-10-20)

| Decision           | Choice                                                              | Why                                                                                                                     |
| ------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Playwright version | `@playwright/test` pinned to 1.56.1                                 | Matches the Chromium preinstalled in Claude cloud sessions, so local runs need no browser download. CI installs its own |
| TypeScript version | 5.9.3, JSDoc checking only (`tsc --noEmit`)                         | Stable `checkJs` support; no build step                                                                                 |
| Unit tests         | Node's built-in `node --test`                                       | No test-framework dependency                                                                                            |
| Dev server         | `tools/serve.js`, a small Node static server                        | Avoids a dependency just to serve files                                                                                 |
| Pure-logic guard   | ESLint bans `Math.random` and `Date.now` in `src/game/`             | Keeps game logic seeded and testable                                                                                    |
| Pages build        | The Pages workflow publishes only `index.html`, `src/` and `audio/` | Players never download tests or tools                                                                                   |
| Screenshots        | Saved to `e2e/screenshots/`, not compared to baselines              | For Claude and the owner to look at; pixel baselines would be brittle while art changes                                 |

## Planning (2026-10-20)

| Decision          | Choice                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Platform          | Browser; HTML5 Canvas + plain JavaScript, no engine, GitHub Pages. Phaser is the fallback if we need physics or heavy animation     |
| MVP sprites       | Code-drawn text grids; AI-generated PNGs are a post-MVP upgrade                                                                     |
| Horse breeds      | A Friesian (black), B Haflinger (golden chestnut), C Camarillo White (white)                                                        |
| Looked-at marker  | Sprite outline, blue for horses, red for non-horses; rectangle fallback                                                             |
| Lose condition    | 5 non-horses over the whole game                                                                                                    |
| Animation         | Two-frame walk and graze, as its own milestone after the game is playable                                                           |
| Scenery           | Barns, redwoods and datacenters (largest, at least twice a barn)                                                                    |
| Zoom tiers        | Four tiers (Dot, Far, Mid, Near) with cutoffs as written; telltales first show at Mid                                               |
| Looked-at trigger | Per-animal threshold of 15–30% of viewport height, a 1 s look meter, every qualifying animal on screen counts, head must be visible |
| UI layout         | Bottom strip; strikes visible from the start; drag to pan                                                                           |
| "Horse again"     | Skips the intro, straight to level 1                                                                                                |
| Level sizes       | 40, 80, 80 animals; no time limit                                                                                                   |
| Music             | One calming licensed track per level; Claude shortlists, the owner picks                                                            |
| Merging           | Claude merges its own PRs, but asks the owner first on UI or visual-taste questions                                                 |
| Feedback          | Playtest notes in GitHub issues; rule changes via `docs/DESIGN.md`                                                                  |
