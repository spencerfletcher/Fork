---
target: profile, sweep 7
total_score: 27
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/users/[username]/+page.svelte"
target_fingerprint: "sha256:6dd2d179f3346bf9fcebb1d56d508ac1aab59b3c33a1b11dfc34a8ebdeea7ef7"
target_path: /Users/spfle/Dev/Fork/src/routes/users/[username]/+page.svelte
timestamp: 2026-10-30T04-03-51Z
slug: src-routes-users-username-page-svelte
---
# Profile, sweep 7 (29 October 2026)

⚠️ DEGRADED: single-context (read-only subagent). Overlay skipped. /users/spencerfletcher signed out and signed in at 390, 768, 1280 and 640 (1280 at 200%). Trend 20 → 22 → 23 → 24 → 25 → 25 → 26 → 27/32 (heuristics 5 and 9 n/a). Scores 1:4 2:4 3:3 4:4 6:3 7:3 8:3 10:3. Title "@spencerfletcher — Fork"; h1 Bitter clay one line at every width; stats mono "8 changes · Member since October 2026"; "4 RECIPES" eyebrow; owner sees "New recipe →" after the grid (x 40 y 524 at 1280, 26.4 tall; 44.4 at 390 and 200%), visitor does not; Tab: bar then the four cards, clay rings; forced colours keep the avatar circle (1px CanvasText) and the link LinkText; no overflow at any width or 200%; reduced motion 0 running. Detector: :124 0.875rem and :140 1.375rem advisories, documented in DESIGN.md; false positives.

Resolved: [P3] the owner has an action in the page, "New recipe →" (users/[username]/+page.svelte:61-63, DESIGN.md closing links). Flexibility raised 2 → 3.

Priority: [P3, new] At 768 and 1280 the owner sees two New recipe actions on one screen: the bar's marigold "+ New recipe" (y 9) and the arrow link under the grid. Below 768 the bar hides it in the menu, so the link earns its place only on a phone; DESIGN.md calls it the page's one action, so this is a product call: keep it everywhere, or hide it where the bar shows its own. [P3, new] The link sits after the list, so past roughly eight recipes on a phone it is below the fold, where the owner will not find it; if it stays, the empty-state case is where it matters most and is already covered. [P3, carried] No sort or filter past ~12 recipes. [P3, carried] "8 changes" is a count a visitor cannot open. Question: should the arrow link show only below 768, where the bar has no New recipe?

## Navbar (shared, all pages)

[P3, new here, may be known from the browse sweep] At 768 the owner's own handle, the current link on this page, ellipsises to "@spencerflet…". [P3, carried] Logged-out "Recipes" current on /recipes/does-not-exist.
