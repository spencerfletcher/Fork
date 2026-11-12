# Fork product set

Fork is a recipe cookbook for serious home cooks, live at recipes.spencerfletcher.com. Every edit to a recipe is a version with a note, any two versions compare, and a fork is an editable copy that credits its source. A cooking Journal and a friends feed sit beside the cookbook, so Fork remembers how a person's cooking evolves and lets friends' real cooks inspire the next one.

**Product promise:** a dependable home for your recipes that helps your cooking improve over time.

## Where it stands (12 November 2026)

- The minimum viable product (MVP) is in production: three recipe audiences with one access rule on every surface, friendships with unfriend, block, mute and report, the Journal with likes, the Friends feed, Discover, the Cookbook (All, Mine, Saved), new navigation, the recipe page redesign and the line editor with section headings.
- Built since, most of it marked "awaiting publish" in the roadmap: settings, export, print, drafts, Trash, collections, Keep this version, search quality, notifications, moderation and rate limits, among others. Spencer published again on 12 November 2026 at a build before `089022a`; which rows that made live is not yet recorded (ROADMAP §2).
- The CSS simplification and the phone fixes landed in git on 11 November.
- No pilot invitations have been sent. No pricing is approved. The business goal is a sustainable solo operation.

## What matters next

1. Finish P0 trust work: exact source versions on forks, account access and lifecycle, backup and restore, moderator suppression that reaches history.
2. Clear the pilot prerequisites: interim data export, rights and moderation operations, abuse basics, in-app notifications.
3. Run the friends pilot and watch whether Fork stays useful without founder reminders.
4. Build the P1 cookbook: drafts, Trash, photo access by audience, collections, Keep this version, search quality, print, export.
5. Settle the P1 design backlog and the open questions in the roadmap, one at a time.

The [12 November UX review](../research/2026-11-12-ux-review.md) recommends a different emphasis for the next work: Journal recall at the next cook, an easy first recipe in an empty Cookbook, better featured recipes, then validation with full libraries and real meals. Its items are in the roadmap as **proposed**; whether they change this list is open question 2 there. Spencer has asked for a varied seed with many users as one of the next builds and approved fixing the cookie example's faults (ROADMAP P1).

## The set

| File | What it holds |
| --- | --- |
| [ROADMAP.md](ROADMAP.md) | The finished-product picture, phases P0 to P5 with gates and item status, design backlog, pilot path, decisions and open questions |
| [COMPETITIVE.md](COMPETITIVE.md) | Market shape, competitors, table stakes versus Fork's difference, fidelity fixtures, what is not known |
| [BUSINESS.md](BUSINESS.md) | Paid-offer hypotheses, one recomputed unit-economics model, scenarios, acquisition, operations, rights and copyright |
| [DESIGN-DIRECTION.md](DESIGN-DIRECTION.md) | Identity to keep, what excellent means, system and page refinements with status |
| [INVENTORY.md](INVENTORY.md) | All 87 cookbook-app inventory entries with phase and status |
| [COVERAGE.md](COVERAGE.md) | Working file: where every source item went |

Rules stay where they are: [DESIGN.md](../../DESIGN.md) (visual and interaction rules), [PRODUCT.md](../../PRODUCT.md) (audience and principles), [AGENTS.md](../../AGENTS.md) (how to work in the repo).

## How this set is maintained

- This is the one current set. Edit it in place; never add an amendment section.
- Each file ends with a dated changelog, one line per change.
- New research goes in `docs/research/` as a dated note, then is folded into these files. Research notes are never amended in place to change the plan.
- A decision by Spencer goes into the Decided list in ROADMAP.md with its date, and into the item it changes.
- Nothing is removed without Spencer's approval unless a later decision replaces it; replacements go in "Dropped as superseded", other candidates in "Proposed removals".

## Changelog

- 2026-11-11: created; replaces the 8 November roadmap report and the two 10 November syntheses as the current plan.
- 2026-11-11: first migration importer dropped from the P1 list (moved to P2, RM §14).
- 2026-11-12: the UX review's recommended order noted under What matters next as proposed (RM §15 question 2); varied seed and cookie fixes noted (RM P1).
- 2026-11-12: Where it stands refreshed: what is built since 11 Nov, the 12 Nov publish, the CSS and phone fixes landed.
