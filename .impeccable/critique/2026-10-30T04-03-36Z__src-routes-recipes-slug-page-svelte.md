---
target: recipe page, sweep 7
total_score: 35
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:bbb2ffc9a149cf75f0fdfe37d1cd3265c52b5cc99096de9d89255c613d6a17c9"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-30T04-03-36Z
slug: src-routes-recipes-slug-page-svelte
---
# Recipe page and forks page, sweep 7 (29 October 2026, PT)

⚠️ DEGRADED: single-context (run as one read-only subagent from a brief; no isolated A/B split, no user question tool, no live overlay). Tree 9014834. Trend 35 → 35/40.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Ticks kept 12h with nothing saying so; Favorite's state is in its label only, no aria-pressed |
| 2 | Match system / real world | 4 | |
| 3 | User control and freedom | 4 | Clear ticks per list, Esc, Back to v3 |
| 4 | Consistency and standards | 4 | Favorite now 600 beside Fork/Edit (fixed) |
| 5 | Error prevention | 3 | Clear ticks is one tap with no undo |
| 6 | Recognition rather than recall | 4 | |
| 7 | Flexibility and efficiency | 3 | No serving scale, no wake lock |
| 8 | Aesthetic and minimalist design | 4 | |
| 9 | Error recovery | 3 | Alerts still "Could not … Try again." |
| 10 | Help and documentation | 3 | Fork cards say who and what changed; nothing explains a fork or a version to a first-timer |
| Total | | 35/40 | Good |

Evidence: detector 5 advisory in scope, unchanged: +page.svelte:211 mask #000; RecipeMethod.svelte:59 (1.125rem) and :71 (0.9375rem); VersionBar.svelte:127 (0.875rem); forks/+page.svelte:29 (0.8125rem). Browser at 390/768/1280, signed out and in (owner), v3, ?version=2, /forks and chicken-tikka-masala: all 200, no horizontal overflow, console clean. First ingredient 557 (1280), 892 (768), 773 (390; v2 713; tikka 766), unchanged. Actions 44px, Fork/Edit and Favorite both 600. Tab order 1280 signed in: skip link, navbar (marigold rings), byline handle, "1 fork", tags, Edit, Favorite, "3 versions", rows (clay rings). 390 signed out: skip, navbar, byline, tags, Fork, Favorite, "3 versions", Ingredients, Method, rows. Ticks persist across reload (2 of 2); keyboard Clear ticks puts focus on the first checkbox with the ring. ?version=2 at 390: toggle by Enter, Tab into v3's row, Escape closes and returns focus to "3 versions". Forced colours: ticked square Highlight, chip outline and bar edges draw. Reduced motion: chevron 1e-05s. 640x450 at 2x (200%): phone composition, no overflow, also /forks. Dark scheme: paper stays cream (light-only by DESIGN.md). Forks page: author shown on a phone, the note fits three lines at 390 (59/59px, no clamp hit) and two at 768/1280; tab order back link, card, author.

Priority issues:
- [P3] Favorite's state is not exposed as state. The button swaps its label "Favorite" → "Favorited" but carries no aria-pressed, so a screen reader that keeps focus on it does not reliably announce the change, and the name of a toggle shifts under the user. Fix: aria-pressed={isFavorited} with a constant "Favorite" name (keep the visible "Favorited" text if wanted, as aria-pressed reads the state). RecipeActions.svelte:145-148. /impeccable harden
- [P3] On a phone the "3 versions" focus ring overlaps the note above it. The toggle's 44px hit (11px padding, -11px margin) is also the outline box, so the ring cuts through the second line of a two-line note and the history rule (seen on ?version=2 at 390). Fix: draw the ring on an inner span, or outline-offset negative on the padded box, or keep the ring on the text box and move the hit to a ::before. VersionBar.svelte:296-309. /impeccable polish
- [P3] Ticks persist 12h on the device and nothing says so (open, decision). RecipeIngredients.svelte:113-127. /impeccable clarify
- [P3] Clear ticks has no undo (open, decision). RecipeIngredients.svelte:24-28, RecipeMethod.svelte:17-23. /impeccable harden
- [P3] Clear ticks by mouse moves the page: focus to step 1 scrolls 151px at 1280 (Method, last step ticked) with no visible ring, so the page jumps for no visible reason. Fix: focus({ preventScroll: true }) when the click came from a pointer (event.detail > 0). RecipeMethod.svelte:19-20, RecipeIngredients.svelte:24-25. /impeccable polish

Since last run (35/40, 81b69ec):
- [P3] Forks page on a phone hides who forked: fixed (4866d29), author kept via alwaysShowAuthor; note clamps at three lines and fits.
- [P3] Favorite 500 beside Fork/Edit 600: fixed (0f30593), btn-ghost 600 site-wide.
- [P3] Ticks kept 12h, not said: still open (decision).
- [P3] Clear ticks no undo: still open (decision).
- [P3] One ingredient on a phone's first screen: still open (decision-bound; 773 of 844).
- Page ends flat: still open (decision).
- No regressions found.

Cognitive load 7/8. Personas: phone cook (44px targets, tabs at 707; no undo; no wake lock); keyboard user (clean order; Esc right; mouse Clear ticks jumps); screen-reader user (Favorite toggle state unspoken); first-timer (fork card says who and what; nothing says what a fork or version is).

Minor: ticks render unticked in SSR and appear on hydration (a brief flash on a slow phone; unverified visually). forks/+page.svelte:29 0.8125rem still off the DESIGN.md ramp. The forks back link's "←" is read aloud as "left arrow"; aria-hidden on the arrow would quiet it. The forks grid at 390 with one fork leaves the right column empty (fine; a list of one). The byline counts public forks while /forks may also list the viewer's private forks (unverified; no private fork in the seed).

Questions: Favorite with aria-pressed (rec yes); Clear ticks undo or accept (rec accept); say ticks are kept (rec accept silence).

Skipped: overlay; signed-in non-owner visitor (no second account); Fork and Favorite clicks (read-only); hydration flash timing. Screenshots: scratchpad wave7/recipe.
