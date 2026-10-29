---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/login/+page.svelte"
target_fingerprint: "sha256:648c32fcf73524bd3445147657f72aaa48887c1079b2165862846cb860ea1e98"
target_path: /Users/spfle/Dev/Fork/src/routes/login/+page.svelte
timestamp: 2026-10-29T23-16-32Z
slug: src-routes-login-page-svelte
---
---
target: login, wave 3
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Login, wave 3 (29 October 2026, fourth run)

Combined A+B on Opus; overlay skipped. Trend 23 → 25 → 27 → 28/40.

Evidence: subtitles "Log in to your cookbook" (plain), "Log in to see your favorites" (redirectTo=/favorites), "Log in to continue" (/recipes/new); "Create one" carries the redirect, 62.8×27.1 at 1280 and 62.8×47.1 at 390; labels associated, autocomplete right, button 50.4; page exactly the viewport; lowest contrast 5.35 (11px labels); 5 type styles; Tab bar (Log in current), email, password, Log in, Create one; console clean, CLS 0.

Scores: 1:4 2:3 3:2 4:3 5:3 6:3 7:3 8:3 9:3 10:1, total 28/40. Cognitive load 8/8. Strengths: the subtitle gives the reason for the detour; the redirect survives sign-up.

Priority: [P2] no password recovery (roadmap, settings page); [P3] no show-password toggle. Persona: a returning cook who forgot their password has no way forward. Question: a "Forgot password?" link before the settings page, on Supabase's reset flow?

## Navbar (shared, all pages)

Every earlier navbar finding is resolved: current state cream with aria-current for Favorites, the owner's handle, Log in and Sign up, in the bar and the phone menu; menu rows 48.8; marigold rings on every bar stop, the handle included; tan on espresso 7.80:1; Tab order skip, Fork., Search, Recipes, My Recipes, Favorites, handle, Log out, + New recipe. [P3] On /recipes/no-such-recipe a logged-out visitor sees Recipes marked current (path prefix) while the owner sees nothing current. Not yet swept: the small-caps link face shipped after this run (d7e9279).

Screenshots: wave3/secondary/login*.
