---
target: recipe page, sweep 6
total_score: 35
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:bbb2ffc9a149cf75f0fdfe37d1cd3265c52b5cc99096de9d89255c613d6a17c9"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-30T02-33-01Z
slug: src-routes-recipes-slug-page-svelte
---
# Recipe page and forks page, sweep 6 (29 October 2026)

⚠️ DEGRADED: single-context (run as one read-only subagent from a brief; no isolated A/B split, no user question tool, no live overlay). Tree 81b69ec. Trend 34 → 35/40.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Ticks still kept 12h on the device with nothing saying so |
| 2 | Match system / real world | 4 | |
| 3 | User control and freedom | 4 | Clear ticks per list, Esc, Back to v3 |
| 4 | Consistency and standards | 4 | Nit: Favorite 500 beside Fork/Edit 600 |
| 5 | Error prevention | 3 | Clear ticks is one tap with no undo |
| 6 | Recognition rather than recall | 4 | |
| 7 | Flexibility and efficiency | 3 | No serving scale, no wake lock |
| 8 | Aesthetic and minimalist design | 4 | |
| 9 | Error recovery | 3 | Alerts still "Could not … Try again." |
| 10 | Help and documentation | 3 | Fork cards now say what each fork changed (was 2); still nothing explains forks or versions to a first-timer |
| Total | | 35/40 | Good |

Evidence: detector 5 advisory in scope (was 4): +page.svelte:211 mask #000, RecipeMethod.svelte:59 and :71, VersionBar.svelte:127 font sizes (all known), and new forks/+page.svelte:28 text-[0.8125rem] (the card meta size, not on the DESIGN.md ramp). Other +page.svelte hits under [slug] are sibling routes, out of scope. Browser at 390/768/1280, signed out and signed in (owner), v3, ?version=2 and /forks: all 200, no horizontal overflow, console clean. First ingredient at 557 (1280), 892 (768), 773 (390; v2 713), unchanged. Ticked rows: opacity 1, text and grams rgb(111,105,96) on rgb(247,243,236) = 4.91:1, strike kept, square full clay. Clear ticks by Enter: focus lands on the first checkbox with the clay ring (390 and 1280); next Tab goes to row 2; storage key removed. By mouse on Method: focus to step 1's checkbox, no ring (not focus-visible). Escape closes the bar from inside it and returns focus to "3 versions"; from the ingredients it leaves the bar alone (by design). Tab order: skip link, navbar, byline handle, "1 fork", tags, actions, "3 versions", rows; clay 2px ring on every page stop. Focused row 6 bottom 827/900 (1280), 552/844 (390). Reduced motion: chevron 1e-05s, scroll-behavior auto. Forced colours: ticked squares Highlight fill and edge in both lists, unticked CanvasText edge; rings and bar edges draw. 640 (200% at 1280): phone composition, no overflow, tabs at 760. Forks page: back link, h1, "1 fork" eyebrow, card, then the note "Swapped melted butter for brown butter, added flaky sea salt topping" in Ink 3 13px, 2-line clamp; tab order back link, card, author.

Priority issues:
- [P3] Forks page on a phone hides who forked. RecipeCard drops the author below 700px ("the recipe page has it", RecipeCard.svelte:254-261), which is right on a feed but wrong on /forks, where the author is half the answer; and the note's 2-line clamp cuts the seed note mid-word ("flaky s…"). Fix: let the forks page keep the author (a prop or a wrapper class) and clamp the note at 3 lines. forks/+page.svelte:22-31. /impeccable adapt
- [P3] Ticks persist 12h on the device and nothing says so (heuristic 1). A cook who returns to a struck list next morning will not know why. Fix (decision): accept, or a one-line hint beside Clear ticks the first time a list is struck. RecipeIngredients.svelte:113-127. /impeccable clarify
- [P3] Clear ticks has no undo: one mis-tap wipes a half-cooked list and its saved copy. Fix (decision): an "Undo" in its place for a few seconds, or accept it. RecipeIngredients.svelte:24-28, RecipeMethod.svelte:19-23. /impeccable harden
- [P3] Favorite is 500 beside Fork/Edit at 600 in the same row. Fix: btn-ghost to 600, or accept the step as hierarchy. app.css:453. /impeccable polish
- [P3] One ingredient on a phone's first screen (first row 773 of 844). Decision-bound (brief puts the tab bar inside the first screen, which it is at 707). /impeccable layout

Since last run (34/40, 27b7283):
- [P2] Clear ticks drops focus to body: fixed (438cb1d), focus goes to the list's first checkbox.
- [P3] Ticked rows dim to 0.6: fixed (6937493), Ink 3 at 4.91:1.
- [P3] Forced colours: ticked square empty: fixed (6937493), Highlight fill.
- [P3] Forks page a bare card grid: fixed (53a6f15), first commit note under each card; new P3 above on phone.
- [P3] Clear ticks no undo: still open (decision).
- "Kept" not said: still open.
- [P3] Favorite 500 beside Fork 600: still open.
- [P3] One ingredient on a phone's first screen: still open.
- [P3] Page ends flat: still open (decision).

Cognitive load 7/8. Personas: phone cook (Clear ticks 44px and focus-safe; no undo; one ingredient on the first screen; no wake lock); keyboard user (clean order, Clear ticks now hands focus back to the list); first-timer (the fork card now says what the fork changed, but nothing says what a fork or a version is).

Minor: Clear ticks moves focus, so a keyboard user near the end of a long list is scrolled back to row 1; right for "start over", worth knowing. The fork note sits outside the card link, so it is not part of the link's name (fine; it reads next). forks/+page.svelte:28 adds 0.8125rem to the off-ramp count; add the meta size to the DESIGN.md ramp. The byline counts public forks while /forks also lists the visitor's own private forks (unverified: the seed has no private fork). Signed-out visitors see Fork and Favorite (the brief's "no action row" was superseded).

Questions: keep the fork's author on /forks at phone width (rec yes); Clear ticks undo or accept (rec accept); say ticks are kept (rec accept silence unless a cook trips on it).

Skipped: overlay; dark mode beyond forced colours; signed-in visitor (non-owner) role, no second account in storage; Fork and Favorite clicks (read-only); hydration flash. Screenshots: scratchpad wave6/recipe.
