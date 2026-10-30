---
target: profile, sweep 6
total_score: 26
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/users/[username]/+page.svelte"
target_fingerprint: "sha256:28bbfba28fd2c19ef473e50fdf7614c3d9833e8e80542de2c64dc1ea8e153c96"
target_path: /Users/spfle/Dev/Fork/src/routes/users/[username]/+page.svelte
timestamp: 2026-10-30T02-33-23Z
slug: src-routes-users-username-page-svelte
---
# Profile, sweep 6 (29 October 2026)

⚠️ DEGRADED: single-context (read-only subagent). Overlay skipped. /users/spencerfletcher signed out and signed in at 390, 768, 1280 and 640 (1280 at 200%). Trend 20 → 22 → 23 → 24 → 25 → 25 → 26/32 (heuristics 5 and 9 n/a). Scores 1:4 2:4 3:3 4:4 6:3 7:2 8:3 10:3. Title "@spencerfletcher — Fork"; h1 Bitter clay one line at every width; stats mono 12px Ink 3 "8 changes · Member since October 2026"; "4 RECIPES" eyebrow; owner and visitor identical below the bar (no private recipes); the owner's handle in the bar carries aria-current; Tab goes bar then the four cards, clay rings; no overflow at any width or 200%; reduced motion 0 running animations. Detector: two font-size advisories (:116 0.875rem, :128 1.375rem), documented in DESIGN.md; false positives.

Resolved: [P3] forced colours. The avatar now keeps its circle (1px border computes to CanvasText, 72x72 unchanged, :91), and the no-photo card "Weeknight Red Lentil Dal" keeps its panel box (RecipeCard transparent border). Consistency raised 3 → 4.

Priority: [P3, carried] Nothing for the owner to act on in the page (no edit-profile, no new-recipe way on beyond the bar). [P3, carried] No sort or filter past ~12 recipes. [P3, carried] "8 changes" is a count a visitor cannot open. Question: should "8 changes" link to a changes feed, or stay a count?

## Navbar (shared, all pages)

Small caps 15/600, tan; every bar ring 2px marigold, page rings 2px clay (measured on all six routes). Forced colours keep every link LinkText. [P3, carried, narrowed] Logged-out "Recipes" carries aria-current on /recipes/does-not-exist (Navbar.svelte:64, the active test matches any /recipes/* path, including one the app could not render). On the compare 400 the recipe exists, so "Recipes" current there is defensible. /nope now has no current link (fixed with the "Page not found" change).
