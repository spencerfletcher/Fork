---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/+error.svelte"
target_fingerprint: "sha256:ea1b3517193d24b2ce06d27d5a9755fa58d59f2f7524e63dfd6acc44cab1f2c3"
target_path: /Users/spfle/Dev/Fork/src/routes/+error.svelte
timestamp: 2026-10-29T23-16-32Z
slug: src-routes-error-svelte
---
---
target: error pages (in-app and fallback), wave 3
total_score: 27
max_score: 36
na_heuristics: 5
p0_count: 0
p1_count: 0
---
# Error pages, wave 3 (29 October 2026, first run)

Combined A+B on Opus; overlay skipped. The in-app 404 was measured on the 61519d7 build (left-aligned); the centred page (ae5370d) and the fallback src/error.html were reviewed from source and the fallback rendered through a Playwright route with the placeholders filled. Scores: in-app 404 27/36 (1:3 2:4 3:3 4:2 6:3 7:2 8:4 9:3 10:3); fallback 500 24/36 (1:3 2:3 3:2 4:3 6:3 7:2 8:4 9:2 10:2). Heuristic 5 n/a.

Evidence: /recipes/no-such-recipe is 404 owner and logged out; title "Recipe not found — Fork"; h1 "Error 404 – Recipe not found" Bitter 40/28 clay; lede 8.68:1; "Go home" 90×48.8 → /; exactly the viewport; CLS 0. Fallback: title "500 · Fork", bar 56, centred h1 "Error 500 – Internal Error", lede ink-2 8.68, marigold "Go home" 90×46.5 at 8.53; viewport-tall at both widths; Tab Fork. (marigold ring) then Go home (clay). It reads as Fork: espresso bar, paper, Bitter clay title, marigold button. Detector: the fallback's literal #f7f3ec is Fork's paper (cream-palette false positive).

## Priority issues

- [P2] The fallback wordmark is faux bold: .brand asks for Bitter 600 but only a Bitter 500 face is declared, so Chromium synthesises it, visibly heavier and softer than the app's (wordmark-fallback.png vs wordmark-app.png). Fix: declare bitter-latin-600-normal.woff2, which ships.
- [P2] The compare 400 (diff/+error.svelte) is the old design: a 64px mono clay "400" above a 24px h1 holding the bare message (off the one-h1-size rule), and its 404 branch says "Go Home". Fix: "Error {status} – {message}" at the site h1 size, keep its two actions, "Go home".
- [P2] The recipe 404's first Tab stop is a dead skip link: +layout.svelte sets skipTarget 'recipe' for any /recipes/[slug] route, error pages included, so "Skip to ingredients" points at a #recipe that does not exist. Fix: `page.route.id === '/recipes/[slug]' && !page.error`.
- [P3] The fallback wordmark is inset differently (x=80 at 1280 against the app's 40: .inner pads 40 inside the 1200 cap where the app pads 20 outside it; 18 vs 20 at 390) and the bar is 56 on a phone against the app's 52.
- [P3] The fallback's tab title "500 · Fork" against the app's "<message> — Fork".
- [P3] A recipe 404's lede mentions a private recipe but the only action is home; a secondary "Search recipes".
- [P3] The fallback's lede says "Try again in a moment" but the only button goes home; if / crashed that loops. Primary "Try again" (reload), secondary "Go home" (question).

Cognitive load 8/8. Strengths: the 404 lede names the two real causes; the 500 says the fault is Fork's. Persona: someone following a shared link to a now-private recipe lands on home with no way to search. Question: should the fallback's primary be "Try again"?

Skipped: HEAD's centred in-app page in the browser (preview predates ae5370d); the fallback as a file URL blocks fonts by CORS (artefact). Screenshots: wave3/secondary/404-*, compare400-*, error-fallback-*, wordmark-*.
