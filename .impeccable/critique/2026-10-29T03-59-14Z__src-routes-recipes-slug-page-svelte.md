---
target: the recipe page, after the skip link and failure-state pass
total_score: 26
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:427788cbed8281750d5b62dac7879186e270c2c29398121eb47e7ec1a68b3763"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-29T03-59-14Z
slug: src-routes-recipes-slug-page-svelte
---
Method: dual-agent (A: design review · B: detector + browser overlay)
Target: src/routes/recipes/[slug]/+page.svelte at http://localhost:4173 (build of 62bfd21), logged out and owner, 1280/768/390, cookies, dal, ?version=2. Read-only. Settled: no action row logged out, full-width method, note at full length, pills, 60% strike.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | iPad Method tab active with ten ingredient rows still on screen |
| 2 | Match system / real world | 3 | "Compare" has no object; "3 versions" a toggle dressed as a link |
| 3 | User control and freedom | 3 | No history list while viewing v2 |
| 4 | Consistency and standards | 2 | Skip link not first; grams sans vs Pencil Rule; meta labels 11px |
| 5 | Error prevention | 3 | One-click Fork without saying so |
| 6 | Recognition over recall | 3 | No visible Ingredients/Method boundary below 1024 |
| 7 | Flexibility and efficiency | 3 | Skip link costs 5 to 7 navbar stops to reach |
| 8 | Aesthetic and minimalist | 3 | 8 header sizes, five between 14 and 18 |
| 9 | Error recovery | 3 | Favorite reverts and alerts; Fork disables and reports (code-verified) |
| 10 | Help and documentation | n/a | The estimates line is all the page needs |
| Total | | 26/36 | Good (24/32 like for like) |

## Design specificity verdict
Specific. Deck in ink above the italic note now reads as print against pencil. The Prep/Cook/Serves row (11px uppercase label, 16px bold value, three times) is the one dashboard pattern left. The column reads calm from a distance; up close the 155px band of note, byline, meta and tags carries six sizes, five between 14 and 18. Fewer sizes, not fewer lines.

Deterministic scan: 30 advisory font-size hits in scope, 60 src-wide; 23 of 30 prose-listed; 7 app.css sizes in neither; 3px chip radii allowed. Overlay: method ~103 chars (settled); cream is the paper token. No overflow, no shadows, console clean, contrast ≥ 4.9:1, hit boxes 28 to 48, skip link self-hit under elementFromPoint. aria-busy="false" renders at rest.

## Priority issues
- [P1] Skip link is stop 6 to 8, not first: it lives in the page after the layout's navbar. Fix: render in the root layout before the navbar (#recipe here, #main elsewhere). Touches the layout. /impeccable adapt
- [P1] No visible Ingredients/Method boundary below 1024: h2s clipped; iPad Method tab active while ingredients remain on screen. Fix: keep the eyebrow headings visible at every width. /impeccable layout
- [P2] Skip link lands under the sticky tab bar on phone and iPad (fixed 16px offset vs 48px bar). Fix: subtract the bar's height plus 16; 64px scroll margin below 1024. /impeccable adapt
- [P2] Too many header sizes; meta row is a dashboard. Fix: note 16px italic; meta as one 15px sentence line, labels Ink 3, values ink 600, no uppercase; tags 15px next line. Sizes 40/18/16/15/14/12. /impeccable typeset
- [P3] Grams sans vs Pencil Rule mono: decide and record; recommend grams stay sans, amend DESIGN.md. /impeccable document
- [P3] "Compare" without an object; no history while viewing history. /impeccable clarify

## Persona red flags
Alex: skip link 6 to 8 stops deep. Jordan: note identified only by a 12px chip; "3 versions · 1 fork" unglossed; "Compare" with no object. Casey: first ingredient at 745 of 844; PREP/COOK at 11px caps not legible at arm's length; no Method label at the join.

## Minor observations
Favorite/Favorited shifts pill width ~12px. Logged out, 99px of paper under the tags at 1280. History panel 6px/10-14 vs DESIGN.md 8/16. Colour is the only hint "3 versions" is pressable. Error line adds a fourth row.

## Cookbook test
One italic headnote and a plain "Serves 6": Fork has two headnotes and a stat row. Pencilled margin note: Fork's chip, note and byline match; passes. Printed numerals in the display face: Fork's mono numerals are annotation, same rule the grams ignore.

## Questions
Does the page need both a description and a note? Why is Prep/Cook/Serves a dashboard? Is the Pencil Rule about history or about numbers?
