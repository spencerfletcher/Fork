---
target: error pages, sweep 5
total_score: 29
max_score: 36
na_heuristics: 5
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/+error.svelte"
target_fingerprint: "sha256:c0dfffad35e4d55441ddc482a94697c08e83dfbe98cd49f9b97bda96326c483d"
target_path: /Users/spfle/Dev/Fork/src/routes/+error.svelte
timestamp: 2026-10-30T02-06-04Z
slug: src-routes-error-svelte
---
# Error pages, sweep 5 (29 October 2026)

⚠️ DEGRADED: single-context (read-only subagent). Overlay skipped; the fallback rendered from a placeholder-substituted copy over file:// (fonts 404 there, so Georgia and the system sans stand in: layout only). In-app 404 29/36 (was 28; 1:3 2:3 3:4 4:3 6:3 7:2 8:4 9:3 10:3), compare 400 30/36 (unchanged; 1:3 2:4 3:4 4:2 6:4 7:3 8:3 9:4 10:3), fallback 500 29/36 (unchanged); heuristic 5 n/a. /recipes/does-not-exist: "Recipe not found — Fork", h1 balanced "Error 404 – / Recipe not found" at 1280 (fixed: no dangling word), one line at 768 and 200%; lede 8.68; "Go home" 8.53 and "Search recipes" 16.14, both 48.8. /nope: "Not Found — Fork", h1 "Error 404 – Not Found". Compare 400: "Version 9 not found — Fork", h1 "Error 400 – Version 9 not found" (fixed: names the version), buttons 48.8. Fallback: wordmark 55 in a 52 bar at 390, buttons 46.5. All: no overflow at any width or 200%; rings 2px clay (marigold in the bar); forced colours keep the buttons boxed; reduced motion 0 running transitions. Detector: error.html cream-palette (the brand's committed paper) and three font-size advisories, all false positives.

Priority: [P2, new] The compare 400's h1 does not balance, so at 1280 it breaks "Error 400 – Version 9 not / found" with "found" alone (recipes/[slug]/diff/+error.svelte:17; its style block from :42 has no h1 rule; the balance fix went only into routes/+error.svelte:48): add h1 { text-wrap: balance } there. DESIGN.md says the 400 title reads on one line; at 1280 it is two (517px measure against a 40px Bitter title). [P3, new] A non-recipe 404 says "Not Found" in title case and blames a recipe: SvelteKit's router message wins over the 'Page not found' fallback (routes/+error.svelte:9), and the lede's recipe clause shows on every 404 (:11): map "Not Found" to "Page not found" and keep the private-recipe clause for /recipes/* only. [P3, carried] The fallback's buttons are 46.5 against the app's 48.8, and its wordmark link 55 in a 52 bar on a phone (error.html:87 and :126; set line-height to the app's). [P3, carried] Logged-out "Recipes" current on the 404 and the 400. Persona: a visitor who mistypes /favourites is told it may be a private recipe. Question: balance the 400 h1 and send non-recipe 404s a plain "Page not found"?

## Navbar (shared, all pages)

Small caps 15/600, tan 7.80:1; Log out now 15px and 32.8 tall like Log in and Sign up (fixed); handle 13.125 mono 29.7; CTA 14px 37.1; at 390 brand 44.3, icons 44. Escape closes the phone menu (fixed; focus return unverified). Forced colours keep every link LinkText and Log out ButtonText. [P3, carried] Logged-out "Recipes" carries aria-current on /recipes/does-not-exist and on the compare 400 (Navbar.svelte:78, the active test matches /recipes/* paths the app could not render).
