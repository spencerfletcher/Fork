---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/signup/+page.svelte"
target_fingerprint: "sha256:c1b672d2881b74b989cd4a90e14cda96efab225761dff7275523f757fd25aa4c"
target_path: /Users/spfle/Dev/Fork/src/routes/signup/+page.svelte
timestamp: 2026-10-30T00-00-55Z
slug: src-routes-signup-page-svelte
---
---
target: sign-up, final run
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Sign-up, final run of the design phase (29 October 2026, fifth run)

Combined A+B; overlay skipped. Trend 22 → 28 → 29 → 31 → 31/40 (1:3 2:3 3:3 4:3 5:4 6:3 7:3 8:3 9:3 10:3). Title "Create an Account — Fork"; prefill janedoe1987 valid; "Jane Doe" and "ab" give aria-invalid, describedby "username-rule username-hint", the rule at 6.63; "jane_doe-1" clears it; fits the viewport in every state; "Log in" 47.1 on a phone. Strengths: the rule appears and clears with the value; the prefill is respectful. Priority: [P2] the Title Case h1, shared with login (sentence case); [P3, carried] the rule not announced as it appears; [P3] server-side username errors not exercised. Persona: none left for Jane. Question: announce the rule live, or on return only?

## Navbar (shared, all pages)

Small caps Source Sans 15/600 all-small-caps 0.08em, synthesised from the capitals; tan 7.80:1, the current link cream; heights at 1280 links 29, Log in and Sign up 32.8, Log out 31.1, handle 29.7, CTA 37.1; at 390 brand 44.3, icons 44, menu rows 50.4, handle row 48.8; aria-current right for Favorites, the handle, Log in and Sign up; the recovery pages mark nothing. [P3] Log out is 14px beside 15px links (.logout-btn 0.875rem; drop it). [P3] Log in and Sign up sit 1–2px off the left links. [P3] The phone menu does not close on Escape. [P3, carried] Logged-out "Recipes" is current on /recipes/no-such-recipe.
