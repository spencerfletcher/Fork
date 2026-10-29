---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/users/[username]/+page.svelte"
target_fingerprint: "sha256:685dd31863d67321eb9e1b97daef1345b04b1add48ef4da53be52cfa068c1ef8"
target_path: /Users/spfle/Dev/Fork/src/routes/users/[username]/+page.svelte
timestamp: 2026-10-29T23-16-32Z
slug: src-routes-users-username-page-svelte
---
---
target: profile, wave 3
total_score: 24
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 0
---
# Profile /users/[username], wave 3 (29 October 2026, fourth run)

Combined A+B on Opus; overlay skipped. Trend 20 → 22 → 23 → 24/32. Owner pages re-run after the 16:09 PT session regeneration.

Evidence: title "@spencerfletcher — Fork"; page exactly the viewport (900/900, 844/844); console clean, CLS 0, no overflow, no target under 24/44; lowest contrast 4.91 ("8 commits"), avatar 4.98, h1 5.36; 7 type styles outside the bar; the owner's handle cream with aria-current in the bar; below the bar owner and logged-out identical.

Scores: 1:4 2:3 3:3 4:3 6:3 7:2 8:3 10:3, total 24/32. Cognitive load 7/8 ("commits"). Strengths: one calm mono stats line; the current handle visible as well as announced.

Priority: [P3] "8 commits" is git vocabulary ("8 saved changes", or a tooltip); [P3] the owner has nothing to act on in the page with no private recipes; [P3] no sort or filter (matters past ~12 recipes). Persona: a cook who never used git reads "commits" and stops. Question: "commits" → "changes" on the profile only, or across the app?

## Navbar (shared, all pages)

Every earlier navbar finding is resolved: current state cream with aria-current for Favorites, the owner's handle, Log in and Sign up, in the bar and the phone menu; menu rows 48.8; marigold rings on every bar stop, the handle included; tan on espresso 7.80:1; Tab order skip, Fork., Search, Recipes, My Recipes, Favorites, handle, Log out, + New recipe. [P3] On /recipes/no-such-recipe a logged-out visitor sees Recipes marked current (path prefix) while the owner sees nothing current. Not yet swept: the small-caps link face shipped after this run (d7e9279).

Screenshots: wave3/secondary/profile-*.
