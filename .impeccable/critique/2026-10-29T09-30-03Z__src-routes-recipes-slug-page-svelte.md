---
target: recipe page, final score
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:59c895e93cb620b5322232cbf63b61ac84327e832f96f23f1c113d2f8ec896cf"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-29T09-30-03Z
slug: src-routes-recipes-slug-page-svelte
---
# Recipe page, final score at the end of the 29 October 2026 redesign

Method: dual-agent (A design review, B detector + overlay) plus a polish evidence walk. Target: src/routes/recipes/[slug]/+page.svelte and components/, master at 4333b53. Saved for later; nothing acted on in this run.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Older version signalled only by "Older version" in 14px Ink 2 at the bar's right; chip stays marigold |
| 2 | Match system / real world | 3 | Cookbook measure and ingredients; fork, version, compare unglossed |
| 3 | User control and freedom | 3 | Escape and Back to v3 work; Fork has no undo on this page |
| 4 | Consistency and standards | 3 | Tabs are buttons with aria-current; chip means "latest" elsewhere and "being read" here |
| 5 | Error prevention | 3 | Favorite rolls back; Fork creates a recipe on one tap |
| 6 | Recognition over recall | 2 | Strike rows have no visible control; phone note 64% hidden until opened |
| 7 | Flexibility and efficiency | 3 | Sticky aside, clean keyboard path; servings not scalable |
| 8 | Aesthetic and minimalist design | 4 | One accent, one fill, one bar |
| 9 | Error recovery | 3 | Errors announced, say only "Try again" |
| 10 | Help and documentation | 2 | Novel model, no in-place help |
| Total | | 29/40 | Good |

## Design specificity

Specific: three faces doing three jobs, header rhythm 8/8/8/8/16 measured exact, column 313px against a 340px photo, the bar reads as a pencil note. Template slips: 999px pills (the only rounded shape on a 4 to 6px page) and eyebrow-plus-rule headings. Detector: zero real findings on the page (10 ramp false positives; 3 real on the diff page). Overlay: Method line length about 103ch by decision, cream palette false positive. Console, layout shift, overflow, keyboard order, focus rings, Escape scoping, contrast all clean. 12 style combinations above the first ingredient, 8 in the header alone.

## Working

- The header column.
- Ingredient lines: bold measure, grams at line size, 45px rows, counted lines bold whole.
- The bar as hinge: 48px closed, 122px open, rows on a 26px column, Escape and aria-expanded correct.

## Priority issues

- [P1] Older version wears the latest's mark. Fix: on ?version=2 the chip is a clay outline and the line leads with the warning: [v2] Older version · Back to v3 · note. Marigold then means latest everywhere.
- [P1] The phone bar hides the note (284 of 798px). Fix: two-line clamp below 700.
- [P2] Strike affordance invisible on touch. Fix: a 14px Rule 2 square at the row start, clay when checked, or a hint under each eyebrow.
- [P2] Fork is a one-way door behind one tap. Fix: inline two-step confirm; logged out the pill says "Log in to fork".
- [P3] Sticky aside clips on long lists (25 rows at 1280x700). Fix: the aside scrolls inside, max-height to the viewport.
- [P3] Header links 30px tall at 390 (author, tags). Fix: the 11px padding trick used in the bar.
- [P3] Leading separator on the wrapped older-version line at 390. Fix: separators as pseudo-elements hidden on phones, 10px gaps.
- [P3] Accessibility nits: Favorite star svg lacks aria-hidden; sr-only "Version 3, the latest" runs into the note; tabs could be aria-pressed; photo lacks fetchpriority and decoding; no ::selection colour.
- [P3] Peak-end: the page ends on the estimates note then paper. Fix: note under the eyebrow; a deliberate end to the method.

## Persona red flags

Messy hands: first ingredient at y751 on an 844px phone; pills 26px above the bar; ticks lost on reload. First-timer: "1 fork" has no destination; logged out both pills go to login silently; a shared ?version=2 link reads as a different recipe.

## Minor observations

Measure dots 1.35:1 by decision. "3 versions" opens two rows. Second "Compare with v3" could be "Compare". Dal desktop: right half empty. DESIGN.md Chips says 0 5px, both chips ship 0 6px; DESIGN.md lacks the stacked crops. Nav Title Case vs page sentence case. The 1024 width ellipsises the seed note by 2px.

## Questions to consider

- Is "36 servings" a label or the first control the page pretends not to have?
- If latest is the default, does it need a chip at all, with marigold reserved for the older state?
- Is the closed bar's job to show the note, or that there is history? If the latter, "v3 · 3 versions" is 22px and the note belongs to open.
