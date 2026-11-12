# Fork docs

Start here. The product set in `product/` holds the current plan; everything else is dated history or research that fed it.

## Current

- **Product set:** [product/README.md](product/README.md) (11 Nov 2026), the one current plan, edited in place:
  - [Roadmap](product/ROADMAP.md): the finished product, phases P0 to P5 with gates and status, design backlog, pilot path, decisions and open questions. The 87-entry inventory is in [product/INVENTORY.md](product/INVENTORY.md).
  - [Competitive analysis](product/COMPETITIVE.md): market, competitors, table stakes versus Fork's difference, fidelity fixtures.
  - [Business plan](product/BUSINESS.md): paid-offer hypotheses, unit economics, scenarios, acquisition, operations, rights.
  - [Design direction](product/DESIGN-DIRECTION.md): identity, quality ambition, refinements with status.
- **MVP design direction:** [Design summary](design/2026-11-10-decision-pack/DESIGN-SUMMARY.md) (decided 9 Nov 2026), with its build record. Open `design/2026-11-10-decision-pack/index.html` for the screens, comparisons and the live editor prototype. `WORKSHEET.md` beside it holds Spencer's review notes.
- **Design inspiration:** [design/INSPIRATION.md](design/INSPIRATION.md), a living list of products to look at when a screen is designed or revisited.
- **Rules:** [DESIGN.md](../DESIGN.md) (visual and interaction rules, tokens in `src/app.css`), [PRODUCT.md](../PRODUCT.md) (audience, purpose, principles), [AGENTS.md](../AGENTS.md) (how to work in the repo).
- **Engineering state:** `audits/`, dated sweeps from the `code-health` skill.

## History / research that fed the current set

- [Product roadmap report](research/2026-11-08-product-roadmap/README.md) (8 to 10 Nov 2026) and its three research notes: the previous current plan, folded into `product/`.
- [Design refinement and solo-business viability](research/2026-11-10-design-and-solo-business.md) and [Finished product and revenue](research/2026-11-10-finished-product-and-revenue.md) (10 Nov 2026): syntheses folded into `product/`.
- [UX review](research/2026-11-12-ux-review.md) (12 Nov 2026): a signed-in walkthrough and implementation review with a recommended order of next work, folded into `product/` as recommendations (source UX).
- [ROADMAP.md](ROADMAP.md): the Oct 2026 milestone list M1 to M23 and earlier priority orders; the product roadmap maps every milestone.
- `design/`: dated design work. `2026-10-27-redesign` (the shipped redesign), `2026-11-08-mvp` (first MVP mockups), `2026-11-10-offline-review` (a self-contained review pack with its own worksheet), `2026-11-10-decision-pack` (the MVP direction).
- `research/`: dated research notes, Oct to Nov 2026, including the cookbook-app deep dive, the Zed reference, the cookbook design research and the social launch and copyright notes.
- `superpowers/plans` and `superpowers/specs`: build plans and specs from Aug to Oct 2026 for features that have shipped.
- `history/supabase-migrations`: the pre-Drizzle migration chain, superseded by `drizzle/`.
- `screenshots/`: the images the root README shows.

## Conventions

One dated folder or file per piece of research or design work, `YYYY-MM-DD-topic`. A folder's entry point is `README.md` (research) or `DESIGN-SUMMARY.md` / `index.html` (design). The `product/` set is the exception: undated, edited in place, with a dated changelog in each file; new research is folded into it, never amended in place. Links are relative. When a doc stops being current, this index moves it under History rather than deleting it.
