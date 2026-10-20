# horse-looker-4000

A game for horse lovers and utopians alike.

Play it at https://dnewb-slop.github.io/horse-looker-4000/ (deployed from `main`).

## Development

Claude builds this game; see [CLAUDE.md](CLAUDE.md), [docs/DESIGN.md](docs/DESIGN.md) and [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

```sh
npm ci            # install dev tools (Node 22+)
npm run serve     # play locally at http://localhost:8000
npm run check     # lint, typecheck, unit and browser tests
```

Found something off while playing? Open a [playtest issue](../../issues/new?template=playtest.md).

Code is [MIT licensed](LICENSE). Third-party assets, such as music, are listed with their own licenses in `CREDITS.md`.
