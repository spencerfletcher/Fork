---
target: recipe page, sweep 5
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:bbb2ffc9a149cf75f0fdfe37d1cd3265c52b5cc99096de9d89255c613d6a17c9"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-30T02-07-15Z
slug: src-routes-recipes-slug-page-svelte
---
# Recipe page and forks page, sweep 5 (29 October 2026)

⚠️ DEGRADED: single-context (run as one read-only subagent from a brief; no isolated A/B split, no user question tool, no live overlay). Tree 27b7283. Trend 33 → 34/40.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Ticks still kept 12h with nothing saying so; Clear ticks now hints at it |
| 2 | Match system / real world | 4 | |
| 3 | User control and freedom | 4 | Clear ticks per list, Esc, Back to v3 |
| 4 | Consistency and standards | 4 | Nit: Favorite 500 beside Fork/Edit 600 |
| 5 | Error prevention | 3 | Clear ticks is one tap with no undo, at the end of the list a thumb reaches for |
| 6 | Recognition rather than recall | 4 | |
| 7 | Flexibility and efficiency | 3 | No serving scale, no wake lock |
| 8 | Aesthetic and minimalist design | 4 | |
| 9 | Error recovery | 3 | Alerts still "Could not … Try again." |
| 10 | Help and documentation | 2 | "1 fork" now leads somewhere, but nothing explains forks or versions, and the forks page says nothing about what a fork changed |
| Total | | 34/40 | Good |

Evidence: detector 4 advisory (was 10): +page.svelte:211 mask colour, RecipeMethod.svelte:56 and :67 and VersionBar.svelte:127 font sizes; all known. Browser at 390/768/1280, signed out and signed in (owner), v3, ?version=2 and /forks: all 200, no horizontal overflow, console clean. First ingredient at 557 (1280), 892 (768), 773 (390; v2 713). Escape closes the bar from inside it and returns focus to "3 versions"; from the ingredients it leaves the bar alone (by design). Tab order: skip link, navbar, byline handle, "1 fork", tags, actions, "3 versions", rows; focus ring clay 2px on every page stop. Focused rows from below the fold: max bottom 896/900, 1020/1024, 840/844. Reduced motion: chevron 1e-05s. Forced colours: rings draw, bar and buttons keep edges. 640 (200% at 1280): phone composition, no overflow, tabs at 760. Forks page: title, back link, h1, "1 fork" eyebrow, one card; skip link to content; tab order back link, card, author.

Priority issues:
- [P2] Clear ticks drops focus to body. The button unmounts when the list empties, so after Enter focus is on <body>; at 390 the next Tab restarts at "Skip to ingredients", at 1280 it lands on step 1 by luck. Fix: in clear(), move focus to the list's first checkbox (or the section) before the button goes. RecipeIngredients.svelte:22-25 and :116, RecipeMethod.svelte:17-20 and :81. /impeccable harden
- [P3] Ticked rows dim to opacity 0.6, the only text under 4.5:1 on the page (grams ~2.3, numeral ~2.7). Fix: recolour ticked text to Ink 3 instead of dimming it, keep the strike. RecipeIngredients.svelte:89, RecipeMethod.svelte:56 and :61. /impeccable polish
- [P3] Forced colours: the checked tick's clay fill is forced to Canvas, so a ticked row's square looks empty; only the strike carries state. Fix: forced-colors variant with forced-color-adjust: none and CanvasText (or Highlight) fill when checked. RecipeIngredients.svelte:86, RecipeMethod.svelte:52. /impeccable harden
- [P3] The forks page is a bare card grid: each card is the fork's title, author and time, nothing about what it changed or which version it came from, which is the one product-specific fact the page could show. Fix: the fork's first commit note (it already names the source and version) under each card's byline. forks/+page.svelte:22-24. /impeccable clarify
- [P3] Clear ticks has no undo: a mis-tap wipes a half-cooked list's ticks and their saved copy. Fix (decision): an "Undo" in its place for a few seconds, or accept it. /impeccable harden

Since last run (33/40, 61dd3ab):
- [P2] "1 fork" dead end: fixed (7b7159a), the count links to /forks.
- [P2] Kept ticks have no reset: fixed (4c90f20), Clear ticks per list; new P2 above from it. "Kept" is still not said anywhere: still open, folded into heuristic 1.
- [P3] Focused row clipped at viewport bottom: fixed (7fe6921), 896/900, 1020/1024, 840/844.
- [P3] Ticked rows dim to 0.6: still open.
- [P3] Page ends flat: still open (decision).
- [P3] "Log out" 14px beside 15px small caps: fixed, all 15px/600 all-small-caps.
- [P3] Favorite 500 beside Fork 600: still open (RecipeActions.svelte, 15px/500 vs 15px/600).
- [P3] One ingredient on a phone's first screen: still open (first row 773 of 844).

Cognitive load 7/8. Personas: phone cook (Clear ticks works and hits 44px; no undo; one ingredient on the first screen; no wake lock); keyboard user (Clear ticks loses focus; otherwise a clean order); first-timer ("1 fork" now opens a list, but the list never says what a fork is or what this one changed).

Minor: the byline counts public forks while /forks also lists the visitor's own private forks, so the two can disagree for a signed-in forker (unverified: the seed has no private fork). The forks page's "1 fork" eyebrow under a one-card grid repeats what the card shows. Signed-out visitors see Fork and Favorite (the brief's "no action row" was superseded).

Questions: Clear ticks undo or accept the one-tap clear (rec accept, fix focus only); fork card shows its first note (rec yes).

Skipped: overlay; dark mode beyond forced colours; signed-in Fork and Favorite clicks (read-only); hydration flash. Screenshots: scratchpad wave5/recipe.
