---
target: the recipe page, after the polish pass
total_score: 21
max_score: 32
na_heuristics: 9,10
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:a73c744c5949f7e8743f3ab3cb8b73c09a5d3658494214fc0882123dae902aa8"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-29T02-58-20Z
slug: src-routes-recipes-slug-page-svelte
---
Method: dual-agent (A: design review · B: detector + browser overlay)
Target: src/routes/recipes/[slug]/+page.svelte at http://localhost:4173 (build of 35a0080), logged out and owner, 1280/768/390, cookies, dal, ?version=2. Read-only run. Settled: no action row logged out, two-line clamp with "more", full-width method.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | "more" goes stale after client-side navigation |
| 2 | Match system / real world | 3 | "1 fork · Compare with v2" assumes git literacy |
| 3 | User control and freedom | 3 | "more" drops focus to body; no re-clamp |
| 4 | Consistency and standards | 2 | Tags in mono break the Pencil Rule; quantity bold only with a unit; "1/2" beside "¼" |
| 5 | Error prevention | 3 | One-tap fork, no confirm |
| 6 | Recognition over recall | 3 | "3 versions" has no disclosure cue |
| 7 | Flexibility and efficiency | 2 | 16 tab stops to the first ingredient, no skip link |
| 8 | Aesthetic and minimalist | 2 | Eight sizes, three faces, seven clay items, one uniform 12px gap |
| 9 | Error recovery | n/a | No designed error state for fork/favorite |
| 10 | Help and documentation | n/a | ≈ hint is hover-only |
| Total | | 21/32 | Fair |

## Design specificity verdict
Specific, with a diluted header. The unboxed version bar as a cook's note is the best single line on the site; the header column still reads as a stack of metadata rows because face, size and colour change on every row with one uniform 12px gap.

Deterministic scan: 31 advisory font-size hits in targeted files, 61 src-wide (57 sizes, 3 radii, 1 body colour in app.html). 23 of 31 are sizes DESIGN.md prose lists but the YAML omits; 8 app.css sizes in neither. Overlay: method lines ~103 chars (settled); cream background is the paper token (false positive). No overflow, no shadows, console clean, six contrast pairs ≥ 4.9:1. Under 13px: 11px eyebrows incl. Prep/Cook/Serves, 12px phone tabs, navbar handle.

## Priority issues
- [P1] "more" is orphaned on its own line at 390 (34×20px), undersized, and goes stale after "Back to v3" because the effect depends on the element only. Fix: read the message in the effect, 44px hit; better, drop the clamp (saves ~25px on phone for a tap, an orphan and a bug). /impeccable harden
- [P1] Header column has no rhythm: six rows, one 12px gap, a face change per row. Fix: three groups, two gap sizes (title+description 8px; chip/note/byline 4px; tags on the meta line); 24px between groups. /impeccable layout
- [P2] Tags in mono break the Pencil Rule and double the clay: two adjacent 14px mono lines of three clay links. Fix: sans 14px Ink 2 or pill tags on the meta line; clay drops from 7 to 4. /impeccable typeset
- [P2] Quantity bold only on rows with a unit ("2 large eggs", "1 tomato" plain); "1/2" beside "¼". Fix: bold the leading quantity on every row, normalise fractions. /impeccable polish
- [P2] Byline wraps with a leading dot at 390 (::before travels with the item); tags 18px tall, byline links 24px. Fix: dots as ::after on all but last; inline links padded to ≥24px. /impeccable adapt
- [P3] "more" leaves focus on body; "1 fork" inert; iPad Method tap cannot reach top on a short recipe; no disclosure cue on "3 versions"; buttons 43px vs 44.

## Persona red flags
Alex: 16 stops to the first ingredient, no skip link, "more" loses focus. Jordan: five git words before the recipe; no explanation before the one-tap fork; orphan "more" looks broken. Casey: ≈ hint unreachable on touch; 18px tags and 20px "more" mis-tap bait; "· Compare with v2" at a line start reads as a typo.

## Minor observations
Description 20px Ink 2 above note 17px ink: bigger is greyer. History list is the one box left. Owner can favourite own recipe. Step 5 inline note vs dal's italic annotation. 768 logged out band spends the screen.

## Cookbook test
One headnote in one voice: fails narrowly. Three faces, one job each: passes below the rule, half above. Yield and time as one quiet line with air: passes on type, fails on space.

## Questions
Why is the description larger than the signature note? What does "3 versions" earn as a disclosure over a link? Is the two-line clamp solving a problem anyone has?
