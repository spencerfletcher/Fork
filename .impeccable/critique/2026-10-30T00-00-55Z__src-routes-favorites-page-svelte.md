---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/favorites/+page.svelte"
target_fingerprint: "sha256:4efc1d376f20975a0814d0f0f56342e89fa65801dfa903cf1ec4094122e869a9"
target_path: /Users/spfle/Dev/Fork/src/routes/favorites/+page.svelte
timestamp: 2026-10-30T00-00-55Z
slug: src-routes-favorites-page-svelte
---
---
target: favorites, final run
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Favorites, final run of the design phase (29 October 2026, fifth run)

Combined A+B; overlay skipped. Trend 26 → 29 → 30 → 31 → 31/40 (1:3 2:3 3:3 4:4 5:3 6:3 7:3 8:3 9:3 10:3). Logged out 303 to /login?redirectTo=/favorites with "Log in to see your favorites"; owner with 0 favorites, 2 styles, contrast 4.91/5.36, "Explore recipes →" 26.4/44.4. Cognitive load 8/8. Strengths: one alignment axis; an honest empty state with a way on. Priority: [P3] the empty line still floats ~60px under the h1 on a phone (zero the shared .empty-state top padding in the page's CSS); [P3] "Star any recipe" says not where ("Star a recipe from its page"). Persona: a cook who starred v1 sees the same card after v3. Question: zero that padding?

## Navbar (shared, all pages)

Small caps Source Sans 15/600 all-small-caps 0.08em, synthesised from the capitals; tan 7.80:1, the current link cream; heights at 1280 links 29, Log in and Sign up 32.8, Log out 31.1, handle 29.7, CTA 37.1; at 390 brand 44.3, icons 44, menu rows 50.4, handle row 48.8; aria-current right for Favorites, the handle, Log in and Sign up; the recovery pages mark nothing. [P3] Log out is 14px beside 15px links (.logout-btn 0.875rem; drop it). [P3] Log in and Sign up sit 1–2px off the left links. [P3] The phone menu does not close on Escape. [P3, carried] Logged-out "Recipes" is current on /recipes/no-such-recipe.
