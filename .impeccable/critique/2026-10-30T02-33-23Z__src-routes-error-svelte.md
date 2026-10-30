---
target: error pages, sweep 6
total_score: 30
max_score: 36
na_heuristics: 5
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/+error.svelte"
target_fingerprint: "sha256:7a182267061209aa0d55e24b410168ec0736ae3fb2b802e7c6774567e2cb4c04"
target_path: /Users/spfle/Dev/Fork/src/routes/+error.svelte
timestamp: 2026-10-30T02-33-23Z
slug: src-routes-error-svelte
---
# Error pages, sweep 6 (29 October 2026)

⚠️ DEGRADED: single-context (read-only subagent). Overlay skipped; the fallback rendered from a placeholder-substituted copy over file:// (fonts 404 there: layout only). In-app 404 30/36 (was 29; 1:3 2:4 3:4 4:3 6:3 7:2 8:4 9:3 10:3), compare 400 31/36 (was 30; 1:3 2:4 3:4 4:2 6:4 7:3 8:4 9:4 10:3), fallback 500 29/36 (unchanged); heuristic 5 n/a.

Measured: /recipes/does-not-exist 404, "Recipe not found — Fork", h1 balanced "Error 404 – / Recipe not found" at 390 and 1280 (517px measure), one line at 768 and 200%; private-recipe lede; Go home + Search recipes, 48.8. /nope 404, "Page not found — Fork", h1 "Error 404 – Page not found" one line at 768 and 1280, lede "There is nothing at this address.", Go home only, no aria-current in the bar, signed in and out (fixed). Compare 400 (chicken-tikka-masala, ?from=1&to=9): "Version 9 not found — Fork", h1 now balances "Error 400 – / Version 9 not found" at 1280 and 390, one line at 768 and 200% (fixed: no orphan "found"); Compare first and latest + Back to the recipe, 48.8. A one-version recipe gives "Need at least two versions to compare", which balances too. Fallback: "Internal Error — Fork", buttons 46.5. All: no overflow at any width or 200%; rings 2px clay (marigold in the bar); reduced motion 0 running. Detector: error.html font-size and cream-palette advisories, false positives.

Resolved: [P2] the compare 400 h1 balances (diff/+error.svelte:49). [P3] a non-recipe 404 reads "Page not found" in title and tab, and only /recipes/* gets the private-recipe lede (+error.svelte:10-25).

Priority: [P3, new] In forced colours the fallback's "Try again" loses its box (border 0px) while "Go home" keeps one (error.html:134-138; the app's primary carries a 1px transparent border, DESIGN.md Primary): give .btn-primary padding 11px 16px and border 1px solid transparent. [P3, carried] The fallback's buttons are 46.5 against the app's 48.8, and its wordmark link 55 in a 52 bar on a phone (error.html:87 and :126): match the app's button line-height (1.65) and drop the brand's padding to fit 52. [P3, new] On a phone the compare 400's two buttons wrap into a centred stack of unequal widths (188 and 148): below ~420px stack them full-width or let both take the wider's width. [P3, carried, narrowed] Logged-out "Recipes" current on /recipes/does-not-exist (Navbar.svelte:64). Persona: a visitor who mistypes /favourites now reads "Page not found / There is nothing at this address." and is not told it may be private (fixed). Question: should the fallback match the app's buttons exactly, forced colours included?

## Navbar (shared, all pages)

Small caps 15/600, tan; every bar ring 2px marigold, page rings 2px clay (measured on all six routes). Forced colours keep every link LinkText. [P3, carried, narrowed] Logged-out "Recipes" carries aria-current on /recipes/does-not-exist (Navbar.svelte:64, the active test matches any /recipes/* path, including one the app could not render). On the compare 400 the recipe exists, so "Recipes" current there is defensible. /nope now has no current link (fixed with the "Page not found" change).
