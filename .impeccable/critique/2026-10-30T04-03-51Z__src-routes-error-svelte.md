---
target: error pages, sweep 7
total_score: 30
max_score: 36
na_heuristics: 5
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/+error.svelte"
target_fingerprint: "sha256:7a182267061209aa0d55e24b410168ec0736ae3fb2b802e7c6774567e2cb4c04"
target_path: /Users/spfle/Dev/Fork/src/routes/+error.svelte
timestamp: 2026-10-30T04-03-51Z
slug: src-routes-error-svelte
---
# Error pages, sweep 7 (29 October 2026)

⚠️ DEGRADED: single-context (read-only subagent). Overlay skipped; the fallback rendered from a placeholder-substituted copy over file://, with fonts resolved to static/fonts (Bitter and Source Sans 3 load this time). In-app 404 30/36 (unchanged; 1:3 2:4 3:4 4:3 6:3 7:2 8:4 9:3 10:3), compare 400 32/36 (was 31; 10 raised 3 → 4: the lede names the range), fallback 500 31/36 (was 29; 4 and 8 raised to 4); heuristic 5 n/a.

Measured: /recipes/does-not-exist 404, "Recipe not found — Fork", h1 balanced on two lines at 390 and 1280, one at 768 and 200%; private-recipe lede; Go home + Search recipes 48.8. /nope 404 "Page not found — Fork", Go home only, no aria-current, signed in and out. Compare 400 (chicken-tikka-masala-78acddcf, ?from=1&to=9): "Version 9 not found — Fork", lede "It has v1 to v3.", Compare first and latest (188) + Back to the recipe (149), 48.8; a one-version recipe gives "Need at least two versions to compare" with Back to the recipe only. Fallback 500: "Internal Error — Fork", Try again 93 and Go home 91.5, both 48.8 (matches the app); forced colours give both a 1px box; wordmark 51 tall inside the 52 phone bar and 56 desktop bar. All: no overflow at any width or 200%; rings 2px clay (marigold in the bar); reduced motion 0 running. Detector: error.html :82 and :132 font-size and the cream-palette advisories, false positives.

Resolved: [P3] fallback "Try again" keeps a box in forced colours (error.html:136-143). [P3] fallback buttons 48.8, matching the app (:127-151). [P3] fallback wordmark fits the 52 phone bar (:87-88). [P3] compare 400 lede names the range (diff/+error.svelte:21-22).

Priority: [P3, new] A missing recipe's compare URL (/recipes/does-not-exist/diff) is a 404 from diff/+error.svelte with the lede "The page you're looking for doesn't exist or something went wrong." and Go home only (diff/+error.svelte:25-26, :38-39), while /recipes/does-not-exist says "It may be an old link, or a recipe its author keeps private." with Search recipes. Same cause, two answers; the same branch also serves any 5xx on the compare route, where "or something went wrong" blames nobody. Reuse the root page's 404 lede and Search action, and its "Fork's side" lede for 5xx. [P3, carried] On a phone the compare 400's two buttons stack centred at unequal widths (188 over 149): below ~420px give both the same width. [P3, new] "It has v1 to v3." leaves "It" to the reader: the h1 names a version, not the recipe; "This recipe has v1 to v3." [P3, carried] Logged-out "Recipes" current on /recipes/does-not-exist (Navbar active test). Persona: a cook following an old shared compare link to a recipe now private is told nothing about privacy and offered no search. Question: should every 404 under /recipes/ share the root page's lede and actions?
