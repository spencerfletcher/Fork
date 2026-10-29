---
target: recipe page header after the chip-byline rebuild
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:64711f64bd9422b0ab8739c42dc3ecdac4e6fb2168c4d53e48a9cea0b07e9267"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-29T07-53-35Z
slug: src-routes-recipes-slug-page-svelte
---
# Recipe page header, critique after the chip-byline rebuild (29 October 2026)

Method: dual-agent (A design review, B detector + browser overlay). Target: src/routes/recipes/[slug]/+page.svelte and components/RecipeHeader.svelte on branch recipe-header-chip-byline.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Older version marked only by "v2 of 3 · Viewing history"; the chip is removed exactly when it matters |
| 2 | Match system / real world | 2 | "1 fork · v3 · 3 versions · Viewing history": git words with no gloss |
| 3 | User control and freedom | 3 | Escape closes and refocuses; opening the list pushes the pills 160px down |
| 4 | Consistency and standards | 2 | "3 versions" has a chevron, "v2 of 3" none; the chip shares the Edit pill's fill and does nothing |
| 5 | Error prevention | 3 | Favorite is optimistic with rollback |
| 6 | Recognition over recall | 3 | Why v3 exists is behind the toggle, by design |
| 7 | Flexibility and efficiency | 3 | Every version and diff reachable from the list |
| 8 | Aesthetic and minimalist | 4 | "v3 · 3 versions" says 3 twice; otherwise the quietest header measured |
| 9 | Error recovery | 3 | Fork and Favorite failures alert; none for a bad ?version |
| 10 | Help and documentation | 1 | Nothing explains fork or version |
| Total | | 26/40 | Solid |

## Design specificity

Authored, about 70%: the byline sentence with a mono chip, the clay slab title, the in-flow history list. Interchangeable: the pill pair, the comma tag line, the logged-out column ending in a gap.

Deterministic scan: 13 advisory findings. 10 are false positives (0.875rem, 0.9375rem and 1.125rem are on DESIGN.md's written ramp but missing from its YAML frontmatter). 3 real, all on the diff page: 2.125rem and 1.625rem sizes, a 3px radius. Browser overlay on three states: line-length about 103ch on Method steps (DESIGN.md says under 72) and a cream-palette false positive; nothing on the header.

Measured against the 29 October rules: metadata size holds at 16px; marigold is spent twice in the owner header (chip, Edit pill); neutrals are ink for the byline and Ink 2 for labels and tags, so weight is not the only emphasis; nine style combinations closed, six between title and pills, five more mono when open. Description ran 95ch at 768 and 98ch on the no-photo page; capped at 65ch in this run.

## Working

- The byline as one sentence: who, forks, version, count, one toggle.
- The measure line: 600 value, 400 label, pairs never split.
- The in-flow history list: long messages wrap under themselves, Compare holds the right; verified at 160 characters.

## Priority issues

- [P1] Older version is not unmistakable. ?version=2 looks like the latest except for two ink words; servings differ silently. Fix: keep the chip as v2, chevron on the toggle, say "Older version" or "Replaced by v3". Accessible name fixed this run: "Version history, v2 of 3".
- [P1] Phone touch targets in the open list. Only the 12px version number is the link; the message is not tappable; Compare is 22px tall. Fix: whole row links to the version at 44px min-height.
- [P2] The chip reads as a button: same fill as Edit, does nothing. Options: unfilled mono v3, or the chip becomes the toggle and "3 versions" goes.
- [P2] Description measure. Fixed: max-width 65ch.
- [P3] Logged-out end: tags then 93px of nothing and no verb. Fix: show Fork logged out, route to login with a return URL.
- [P3] Phone compare indent hard-coded at 27px. Fixed: 36px, the chip column.

## Persona red flags

Cook on a phone with messy hands: pills are 44px; everything else tappable is 20 to 32px tall; the chip invites a tap and does nothing; opening the list pushes Edit off the first screen. First-time visitor: three unexplained terms in one line; the screen-reader byline had a dangling colon, fixed to "Version 3, the latest".

## Minor observations

Whole byline at 600 including "By"; description 17px against metadata 16px; Edit 600 vs Favorite 500; list margin-top 10px off the 8 rhythm; chevron stroke 1.6 light beside 600 text; v1 chip on a one-version recipe with nothing to open; the attribution line at 0.875rem Ink 3 would add a third neutral when a fork shows it; an unlabelled input after the header at 1280 (likely the sr-only checkbox, not verified).

## Questions to consider

- Is Fork's identity the marigold chip or the byline sentence? The chip is in the control colour and is not a control.
- Should a one-version recipe wear a chip at all?
- Also landed in this tree, tested: photo under the title below 1024; chip and numbers aligned in the list; counted ingredient lines bold whole; tabs switch sections in place below 1024.
