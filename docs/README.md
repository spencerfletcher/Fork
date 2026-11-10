# Fork docs

Start here. Two files hold the current direction; everything else is dated history or research that fed them.

## Current

- **Product direction:** [Fork product roadmap](research/2026-11-08-product-roadmap/README.md) (8 Nov 2026, reconciled 9 Nov). Phases P0 to P5, feature dispositions, the pilot path. Its three research notes sit beside it.
- **MVP design direction:** [Design summary](design/2026-11-10-decision-pack/DESIGN-SUMMARY.md) (decided 9 Nov 2026). Builder-ready; open `design/2026-11-10-decision-pack/index.html` for the screens, comparisons and the live editor prototype. `WORKSHEET.md` beside it holds Spencer's review notes.
- **Design inspiration:** [design/INSPIRATION.md](design/INSPIRATION.md), a living list of products to look at when a screen is designed or revisited.
- **Design and solo-business review:** [Design refinement and solo-business viability](research/2026-11-10-design-and-solo-business.md) (10 Nov 2026). Cross-page refinements, profitability scenarios and how the roadmap supports adoption, retention and paid value. Recommendations supporting the direction above, not a replacement specification.
- **Rules:** [DESIGN.md](../DESIGN.md) (visual and interaction rules, tokens in `src/app.css`), [PRODUCT.md](../PRODUCT.md) (audience, purpose, principles), [AGENTS.md](../AGENTS.md) (how to work in the repo).

## History

- [ROADMAP.md](ROADMAP.md): the Oct 2026 milestone list M1 to M23 and earlier priority orders. Kept as history; the product roadmap above reconciles every milestone.
- `design/`: dated design work. `2026-10-27-redesign` (the shipped redesign), `2026-11-08-mvp` (first MVP mockups), `2026-11-10-offline-review` (a self-contained review pack with its own worksheet), `2026-11-10-decision-pack` (the current direction).
- `research/`: dated research notes, Oct to Nov 2026, including the cookbook design research and the social launch notes.
- `superpowers/plans` and `superpowers/specs`: build plans and specs from Aug to Oct 2026 for features that have shipped.
- `history/supabase-migrations`: the pre-Drizzle migration chain, superseded by `drizzle/`.
- `screenshots/`: the images the root README shows.

## Conventions

One dated folder or file per piece of work, `YYYY-MM-DD-topic`. A folder's entry point is `README.md` (research) or `DESIGN-SUMMARY.md` / `index.html` (design). Links are relative. When a doc stops being current, this index moves it under History rather than deleting it.
