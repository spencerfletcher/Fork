---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/login/+page.svelte"
target_fingerprint: "sha256:aed777ad24bf2146dd75c88fc048f81046bc84853d1ed797424c998cfe76f4da"
target_path: /Users/spfle/Dev/Fork/src/routes/login/+page.svelte
timestamp: 2026-10-30T00-00-55Z
slug: src-routes-login-page-svelte
---
---
target: login, final run
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Login, final run of the design phase (29 October 2026, fifth run)

Combined A+B; overlay skipped. Trend 23 → 25 → 27 → 28 → 31/40 (1:4 2:3 3:3 4:3 5:3 6:3 7:3 8:3 9:3 10:3); the no-recovery P2 is resolved. Subtitles "Log in to your cookbook" / "Log in to see your favorites"; "Create one" keeps the redirect; "Forgot password?" right-aligned under the password field, 103×27.1 at 1280 and 47.1 tall at 390, 5.84; Tab bar, email, password, Forgot password?, Log in, Create one; 5 styles, lowest contrast 5.35; page exactly the viewport. Cognitive load 8/8. Strengths: the subtitle says why you were sent here; recovery is one stop after the password.

Priority: [P2] heading case changes mid-flow: "Welcome Back" and "Create an Account" are Title Case while "Reset password", "Link expired", "Check your email", "Recipe not found" and "Go home" are sentence case; fix: sentence case on login and sign-up (the sign-up tab title changes too). [P3] A bad email ("jane@") turns red on blur with no aria-invalid and no message (measured on the forgot page; login shares the markup, unverified). [P3, carried] no show-password toggle. Persona: resolved. Question: sentence case for "Welcome back" and "Create an account"?

## Navbar (shared, all pages)

Small caps Source Sans 15/600 all-small-caps 0.08em, synthesised from the capitals; tan 7.80:1, the current link cream; heights at 1280 links 29, Log in and Sign up 32.8, Log out 31.1, handle 29.7, CTA 37.1; at 390 brand 44.3, icons 44, menu rows 50.4, handle row 48.8; aria-current right for Favorites, the handle, Log in and Sign up; the recovery pages mark nothing. [P3] Log out is 14px beside 15px links (.logout-btn 0.875rem; drop it). [P3] Log in and Sign up sit 1–2px off the left links. [P3] The phone menu does not close on Escape. [P3, carried] Logged-out "Recipes" is current on /recipes/no-such-recipe.
