---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/+error.svelte"
target_fingerprint: "sha256:9e740d1f1e295d2cdead0dee9a065d4984e39e38408768f7ce4b0682eae61d5d"
target_path: /Users/spfle/Dev/Fork/src/routes/+error.svelte
timestamp: 2026-10-30T00-00-55Z
slug: src-routes-error-svelte
---
---
target: error pages, final run
total_score: 28
max_score: 36
na_heuristics: 5
p0_count: 0
p1_count: 0
---
# Error pages, final run of the design phase (29 October 2026, second run)

Combined A+B; overlay skipped; the fallback rendered through a Playwright route. In-app 404 28/36 (was 27; 1:3 2:4 3:4 4:3 6:3 7:2 8:3 9:3 10:3), compare 400 30/36 (1:3 2:3 3:4 4:3 6:4 7:3 8:3 9:4 10:3), fallback 500 29/36 (was 24; 1:3 2:4 3:4 4:4 6:3 7:2 8:4 9:3 10:2); heuristic 5 n/a. The 404: "Recipe not found — Fork", h1 "Error 404 – Recipe not found" Bitter 40/28 clay 5.36, lede 8.68, "Go home" and the ghost "Search recipes" 48.8, skip link "Skip to content" → #main. The compare 400: the same format, lede "Pick two of the recipe's versions to compare.", "Compare first and latest" and "Back to the recipe" 48.8. The fallback: "Internal Error — Fork", real Bitter 600, wordmark at x 40 with a 56 bar at 1280 and x 24 with 52 at 390 like the app, "Try again" (reload) and "Go home", Tab Fork., Try again, Go home. They read as one family: the centred block, the Bitter clay h1 at the site size, the 17px lede, a marigold primary beside a bordered ghost, 12px gap and 24 above the actions, "<message> — Fork". Strengths: the 404 lede names both real causes; every page offers a way on that fits its error.

Priority: [P2] one word dangles on the 404 h1 at 1280 ("Error 404 – Recipe not / found"; the 65ch cap is narrower than a 40px heading): text-wrap: balance on all three h1s. [P3] The compare 400 h1 runs three 40px lines and names no version: "Version 9 not found" with the recipe in the lede. [P3] The fallback's buttons are 46.5 against the app's 48.8 (line-height); its wordmark link is 55 in a 52 bar on a phone. [P3, carried] logged-out "Recipes" current on the 404. Persona: resolved (a now-private recipe's link gets "Search recipes"). Question: balance the heading wrap on all three?

## Navbar (shared, all pages)

Small caps Source Sans 15/600 all-small-caps 0.08em, synthesised from the capitals; tan 7.80:1, the current link cream; heights at 1280 links 29, Log in and Sign up 32.8, Log out 31.1, handle 29.7, CTA 37.1; at 390 brand 44.3, icons 44, menu rows 50.4, handle row 48.8; aria-current right for Favorites, the handle, Log in and Sign up; the recovery pages mark nothing. [P3] Log out is 14px beside 15px links (.logout-btn 0.875rem; drop it). [P3] Log in and Sign up sit 1–2px off the left links. [P3] The phone menu does not close on Escape. [P3, carried] Logged-out "Recipes" is current on /recipes/no-such-recipe.
