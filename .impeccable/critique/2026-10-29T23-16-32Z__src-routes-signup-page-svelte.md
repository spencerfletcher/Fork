---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/signup/+page.svelte"
target_fingerprint: "sha256:c1b672d2881b74b989cd4a90e14cda96efab225761dff7275523f757fd25aa4c"
target_path: /Users/spfle/Dev/Fork/src/routes/signup/+page.svelte
timestamp: 2026-10-29T23-16-32Z
slug: src-routes-signup-page-svelte
---
---
target: sign-up, wave 3
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Sign-up, wave 3 (29 October 2026, fourth run)

Combined A+B on Opus; overlay skipped. Trend 22 → 28 → 29 → 31/40. The P1 from wave 2 (the pattern dropped by Chromium) is fixed and verified.

Evidence (both widths): email "Jane.Doe1987@example.com" prefills "janedoe1987", valid, describedby username-hint; "Jane Doe" + blur: patternMismatch, :user-invalid true, aria-invalid "true", describedby "username-rule username-hint", the rule "Usernames are 3 to 30 characters: letters, digits, - or _" in rgb(163,54,43) and the hint reduced to "Your public handle, shown on every recipe."; "ab" + blur: tooShort + patternMismatch, same rule; "jane_doe-1": valid, rule clears, full hint back; no console errors; the page fits the viewport in every state, even with the rule on two lines on a phone; "Log in" → /login?redirectTo=%2Ffavorites when set, 35.2×27.1 / 35.2×47.1; title "Create an Account — Fork".

Scores: 1:3 2:3 3:3 4:3 5:4 6:3 7:3 8:3 9:3 10:3, total 31/40. Cognitive load 8/8 (the rule no longer printed twice). Strengths: the client rule fires and clears with the value; the prefill is respectful.

Priority: [P3] nothing announces the rule as it appears (not a live region; blur moves focus to Password), heard only on return; optional aria-live="polite" on a stable wrapper. [P3] server-side username errors not exercised (need a submit); the source path renders #username-error the same way. Persona: gone for Jane. Question: announce the rule live, or on return only?

## Navbar (shared, all pages)

Every earlier navbar finding is resolved: current state cream with aria-current for Favorites, the owner's handle, Log in and Sign up, in the bar and the phone menu; menu rows 48.8; marigold rings on every bar stop, the handle included; tan on espresso 7.80:1; Tab order skip, Fork., Search, Recipes, My Recipes, Favorites, handle, Log out, + New recipe. [P3] On /recipes/no-such-recipe a logged-out visitor sees Recipes marked current (path prefix) while the owner sees nothing current. Not yet swept: the small-caps link face shipped after this run (d7e9279).

Screenshots: wave3/secondary/signup*.
