---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/users/[username]/+page.svelte"
target_fingerprint: "sha256:3014a553a33f1ccd2e159e10abb6f623f441bee0c72636dbc93e57b183e2a7fb"
target_path: /Users/spfle/Dev/Fork/src/routes/users/[username]/+page.svelte
timestamp: 2026-10-30T00-00-55Z
slug: src-routes-users-username-page-svelte
---
---
target: profile, final run
total_score: 25
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 0
---
# Profile, final run of the design phase (29 October 2026, fifth run)

Combined A+B; overlay skipped. Tree 61dd3ab. Trend 20 → 22 → 23 → 24 → 25/32 (heuristics 5 and 9 n/a). Scores 1:4 2:4 3:3 4:3 6:3 7:2 8:3 10:3. The stats line reads "8 changes · Member since October 2026"; cognitive load 8/8 now the git word is gone. Page exactly the viewport; 7 styles; contrast 4.91/4.98/5.36; owner and logged-out identical below the bar; Tab goes bar then cards. Strengths: one calm mono stats line; the current handle visible and announced. Priority: [P3] nothing for the owner to act on in the page; [P3] no sort or filter past ~12 recipes; [P3] the Log out size drift is most visible here. Persona: a visitor reads "8 changes" but cannot open them. Question: should "8 changes" link to a changes feed, or stay a count?

## Navbar (shared, all pages)

Small caps Source Sans 15/600 all-small-caps 0.08em, synthesised from the capitals; tan 7.80:1, the current link cream; heights at 1280 links 29, Log in and Sign up 32.8, Log out 31.1, handle 29.7, CTA 37.1; at 390 brand 44.3, icons 44, menu rows 50.4, handle row 48.8; aria-current right for Favorites, the handle, Log in and Sign up; the recovery pages mark nothing. [P3] Log out is 14px beside 15px links (.logout-btn 0.875rem; drop it). [P3] Log in and Sign up sit 1–2px off the left links. [P3] The phone menu does not close on Escape. [P3, carried] Logged-out "Recipes" is current on /recipes/no-such-recipe.
