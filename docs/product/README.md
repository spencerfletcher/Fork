# Fork product set

Fork is a recipe cookbook for serious home cooks, live at recipes.spencerfletcher.com. Every edit to a recipe is a version with a note, any two versions compare, and a fork is an editable copy that credits its source. A cooking Journal and a friends feed sit beside the cookbook, so Fork remembers how a person's cooking evolves and lets friends' real cooks inspire the next one.

**Product promise:** a dependable home for your recipes that helps your cooking improve over time.

## Where it stands (12 November 2026)

- The minimum viable product (MVP) is in production: three recipe audiences with one access rule on every surface, friendships with unfriend, block, mute and report, the Journal with likes, the Friends feed, Discover, the Cookbook (All, Mine, Saved), new navigation, the recipe page redesign and the line editor with section headings.
- Published again on 12 November 2026 (build `9593a3d`, migrations through 0024): settings, export, print, drafts, Trash, collections, Keep this version, search quality, notifications, moderation and rate limits, among others (ROADMAP §2).
- The CSS simplification and the phone fixes landed in git on 11 November.
- No pilot invitations have been sent. No pricing is approved. The business goal is a sustainable solo operation.

## What matters next

1. Finish P0 trust work: exact source versions on forks, account access and lifecycle, backup and restore, moderator suppression that reaches history.
2. Clear the pilot prerequisites: interim data export, rights and moderation operations, abuse basics, in-app notifications.
3. Run the friends pilot and watch whether Fork stays useful without founder reminders.
4. Build the P1 cookbook: drafts, Trash, photo access by audience, collections, Keep this version, search quality, print, export.
5. Settle the P1 design backlog and the open questions in the roadmap, one at a time.

**Next builds, in order** (Spencer, 12 Nov 2026; [DECISIONS.md](DECISIONS.md) section 1): varied seed data; a design quality pass against [DESIGN-DIRECTION.md](DESIGN-DIRECTION.md); Journal recall; the empty Cookbook entry point; easy import, starting with an options page; onboarding; then the public-launch prerequisites with a short final design pass, before the pilot. The cookie example's fix comes before the seed. The order follows the [12 November UX review](../research/2026-11-12-ux-review.md), with real-meal validation waiting on public launch.

## Release log

What each publish to production carried. A roadmap row is **live** once a build listed here contains it; until then a merged row is **built**.

| Date | Build | Migrations | What went live |
| --- | --- | --- | --- |
| 11 Nov 2026 | `daa1dd1` | 0008 to 0011 applied | The MVP: three recipe audiences with one access rule, friendships with unfriend, block, mute and report, the Journal with likes, the Friends feed, Discover, the Cookbook (All, Mine, Saved), new navigation, the recipe page redesign and the line editor with section headings (ROADMAP §2) |
| 12 Nov 2026 | `9593a3d` | 0023 and 0024 applied after the publish, which took the site down until they were; 0012 to 0022 were applied before it (unverified here) | Exact origins; account settings, username change and the confirmation page; Delete account with the login removed; moderator hide and restore and `/moderation`; source, notes and times; restore as new version; durable drafts; Trash; Settings and the measurement preference; collections; Keep this version; search quality; Library growth (paging, ⋯ menus, list view, Sort, select mode, pickers, the Journal summary); print; export and archive; public recipe metadata; the photo field; the editor composition; `/report`; rate limits and photo metadata stripping; in-app notifications; the scaler redesign (S01, S04); the CSS simplification and phone fixes |

**Built, not yet published** (as of 12 Nov 2026): the database pool cap (`089022a`), the scaler field's pinned amounts (`7f93f7a`, tests and DESIGN.md only), the phone top bar's + restyle (`7dfd4cc`), the drawn × on removable pills (`6b340bd`) and the cookie seed fix.

## The set

| File | What it holds |
| --- | --- |
| [ROADMAP.md](ROADMAP.md) | The finished-product picture, phases P0 to P5 with gates and item status, design backlog, rules, quality gates, pilot path and open questions |
| [DECISIONS.md](DECISIONS.md) | Spencer's dated decisions, what they replaced (Dropped as superseded) and removals awaiting his approval |
| [COMPETITIVE.md](COMPETITIVE.md) | Market shape, competitors, table stakes versus Fork's difference, fidelity fixtures, what is not known |
| [BUSINESS.md](BUSINESS.md) | Paid-offer hypotheses, one recomputed unit-economics model, scenarios, acquisition, operations, rights and copyright |
| [DESIGN-DIRECTION.md](DESIGN-DIRECTION.md) | Identity to keep, what excellent means, system and page refinements with status |
| [INVENTORY.md](INVENTORY.md) | All 87 cookbook-app inventory entries with phase and status |
| [COVERAGE.md](COVERAGE.md) | Audit trail: where every item of each folded source went, and where the October milestones M1 to M23 went; a section is added per new source, earlier sections are not re-edited |

Rules stay where they are: [DESIGN.md](../../DESIGN.md) (visual and interaction rules), [PRODUCT.md](../../PRODUCT.md) (audience and principles), [AGENTS.md](../../AGENTS.md) (how to work in the repo).

## How this set is maintained

- This is the one current set. Edit it in place; never add an amendment section.
- Each file ends with a dated changelog, one line per change.
- New research goes in `docs/research/` as a dated note, then is folded into these files. Research notes are never amended in place to change the plan.
- A decision by Spencer goes into the Decided list in DECISIONS.md with its date, and into the item it changes.
- A publish to production gets a row in the release log above; roadmap rows only say live, built and so on, never which publish.
- Nothing is removed without Spencer's approval unless a later decision replaces it; replacements go in "Dropped as superseded", other candidates in "Proposed removals".

## Changelog

- 2026-11-11: created; replaces the 8 November roadmap report and the two 10 November syntheses as the current plan.
- 2026-11-11: first migration importer dropped from the P1 list (moved to P2, RM §14).
- 2026-11-12: the UX review's recommended order noted under What matters next as proposed (RM §15 question 2); varied seed and cookie fixes noted (RM P1).
- 2026-11-12: Where it stands refreshed: what is built since 11 Nov, the 12 Nov publish, the CSS and phone fixes landed.
- 2026-11-12: the 12 Nov publish recorded as build `9593a3d`.
- 2026-11-12: Next builds in order (DECISIONS §1); the UX review paragraph replaced.
- 2026-11-12: Release log added; roadmap rows no longer carry publish status.
- 2026-11-12: Next builds include the design quality pass (second) and the final design pass with the public-launch prerequisites.
