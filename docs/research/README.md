# Research notes

Every research note, live and archived. A note is research, never the plan: its recommendations reach the plan only when they are folded into [docs/product](../product/README.md), each with a source key (ROADMAP.md, Source key) and a row in [COVERAGE.md](../product/COVERAGE.md). A note is never amended to change the plan.

**Live** notes sit in this folder: their conclusions are folded, and a build still reads them first (each next build's roadmap row names its notes). **Archived** notes sit in [archive/](archive/): fully folded, superseded, or a one-off sweep whose fixes shipped; no build needs to read them. Each archived note's first line says where its conclusions live.

## Live

| Date | Note | Subject | Status | Where its conclusions live | Read first for |
| --- | --- | --- | --- | --- | --- |
| 23 Oct 2026 | [Cooklang](2026-10-23-cooklang.md) | Cooklang as competitor and source: structure, portability, the adaptation bar | live reference (folded 12 Nov) | ROADMAP key CL: P2 Scaler workstream, §7 Timers and AI, P4 Ingredient quantities in steps and Cooklang import; COMPETITIVE §3 | Journal recall; Cooklang import; the first AI adaptation |
| 8 Nov 2026 | [Product roadmap report](2026-11-08-product-roadmap/README.md), with [cookbook market](2026-11-08-product-roadmap/cookbook_market.md), [advanced and quality](2026-11-08-product-roadmap/advanced_and_quality.md) and [product audit](2026-11-08-product-roadmap/current_product_audit.md) | The previous current plan: audience, phases, competitors, AI, economics | live reference (folded 11 Nov) | The whole product set; COVERAGE R, CM, AQ, PA | Easy import (URL import, migration rules) |
| 8 Nov 2026 | [Cookbook design research](2026-11-08-cookbook-design-research/README.md), with [design principles](2026-11-08-cookbook-design-research/design_principles.md), [product references](2026-11-08-cookbook-design-research/product_references.md) and [cooking workflows](2026-11-08-cookbook-design-research/cooking_workflows.md) | Design direction from research: the working contract, evidence limits, cooking under interruption | live reference (folded 12 Nov) | DESIGN-DIRECTION Identity and each row's Check; ROADMAP §10 Formative usability track; COVERAGE CD | Design quality pass; Journal recall; empty Cookbook; Easy import |
| 8 Nov 2026 | [Social launch](2026-11-08-social-launch/social_launch.md), with the [US](2026-11-08-social-launch/us_copyright.md) and [Canada](2026-11-08-social-launch/canada_copyright.md) copyright notes | The friends pilot, recipe supply, rights handling | live reference (folded 11 Nov) | ROADMAP §7 Recipe supply, §10, P2 Rights and moderation operations, P0 Public-launch prerequisites; BUSINESS §6, §8 | Varied seed data; onboarding; public-launch prerequisites |
| 9 Nov 2026 | [Cookbook-app deep dive](2026-11-09-cookbook-app-deep-dive/README.md), with [Crouton](2026-11-09-cookbook-app-deep-dive/notes/crouton.md), [Paprika](2026-11-09-cookbook-app-deep-dive/notes/paprika.md) and [Recipe Keeper](2026-11-09-cookbook-app-deep-dive/notes/recipe-keeper.md) notes | Mac competitor review: the 87-entry inventory and its fixtures | live reference (folded 11 Nov) | INVENTORY; COMPETITIVE §4; DESIGN-DIRECTION interaction choices | Varied seed data; Easy import; the migration importer |
| 9 Nov 2026 | [Zed design reference](2026-11-09-zed-design-reference/README.md) | Typographic hierarchy, alignment, restrained accents | live reference (folded 11 Nov) | DESIGN-DIRECTION system rows and From the Zed reference | Design quality pass |
| 10 Nov 2026 | [Design refinement and solo business](2026-11-10-design-and-solo-business.md) | System and page refinements; the solo-business case | live reference (folded 11 Nov) | DESIGN-DIRECTION (each row's Check); BUSINESS §1 to §5; ROADMAP §9, §10 | Design quality pass; onboarding |
| 10 Nov 2026 | [Finished product and revenue](2026-11-10-finished-product-and-revenue.md) | The six experiences; revenue arithmetic | live reference (folded 11 Nov) | ROADMAP §1, §9; BUSINESS §2 to §5 | Journal recall; onboarding |
| 12 Nov 2026 | [Package sweep](2026-11-12-package-sweep.md) | Hand-built code against packages, and packages for later needs | live reference (folded 12 Nov) | ROADMAP key PS: the rows of each future need, §11 | Varied seed data; Easy import; public-launch prerequisites; each later row it names |
| 12 Nov 2026 | [UX review](2026-11-12-ux-review.md) | Signed-in walkthrough and the recommended order of next work | live reference (folded 12 Nov) | ROADMAP key UX; DESIGN-DIRECTION page rows | Every next build (its order is the build order) |

## Archived

| Date | Note | Subject | Status | Where its conclusions live |
| --- | --- | --- | --- | --- |
| 26 Oct 2026 | [UI design directions](archive/2026-10-26-ui-design-directions.md) | Three directions, palettes and the locked system | archived: built 27 Oct, the rest rejected | [DESIGN.md](../../DESIGN.md); COVERAGE UD |
| 27 Oct 2026 | [Alternate palette ideas](archive/2026-10-27-alternate-palette-ideas.md) | A stashed March palette and the 2025 brief | archived: superseded | DESIGN.md tokens; COVERAGE AP |
| 28 Oct 2026 | [Recipe page critique](archive/2026-10-28-recipe-page-critique.md) | The recipe page's composition and parked ideas | archived: shipped | DESIGN.md; COVERAGE RC |
| 29 Oct 2026 | [Site sweeps](archive/2026-10-29-site-sweeps.md) | Per-surface critiques after the redesign | archived: fixes shipped, open items folded | DESIGN-DIRECTION (key SW); COVERAGE SW |
| 31 Oct 2026 | [Business viability](archive/2026-10-31-business-viability.md) | Paths to scale, comparables, legal and moderation | archived: folded | BUSINESS; ROADMAP P0 Public-launch prerequisites (key BV); its kill criteria removed (DECISIONS §2, line 26) |
| 31 Oct 2026 | [Feature research](archive/2026-10-31-feature-research.md) | Wishlist, competitor gaps, accessibility | archived: folded | ROADMAP key FR; COMPETITIVE §5 |
| 8 Nov 2026 | [Roadmap before the social revision](archive/2026-11-08-roadmap-before-social-revision.md) | An earlier draft of the roadmap report | archived: superseded by the report | [Product roadmap report](2026-11-08-product-roadmap/README.md); COVERAGE RB |
| 9 Nov 2026 | [Server reuse sweep](archive/2026-11-09-server-reuse-sweep.md) | Shared server helpers to extract | archived: shipped | [AGENTS.md](../../AGENTS.md), Shared helpers; COVERAGE RS2 |
| 9 Nov 2026 | [UI reuse sweep](archive/2026-11-09-ui-reuse-sweep.md) | Shared components and classes to extract | archived: shipped | `src/lib/components/ui/`; COVERAGE RS1 |

## Adding and archiving

A new note is a dated file or folder here (`YYYY-MM-DD-topic`, a folder's entry point `README.md`), added to the Live table, then folded into the product set. It moves to `archive/` with `git mv`, keeping its dated name, once no build needs to read it: its conclusions are in the product set or the code, it is superseded, or its fixes shipped. Moving it adds one line at its top saying where its conclusions live, moves its row to the Archived table, and fixes every link to it.
