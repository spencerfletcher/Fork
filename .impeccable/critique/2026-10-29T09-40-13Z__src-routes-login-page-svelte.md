---
target: login page
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/login/+page.svelte"
target_fingerprint: "sha256:7781d75a6a00c0f9f6955c2df4c789883a15cd3a4f98ae8ab4fa137e4b9691b7"
target_path: /Users/spfle/Dev/Fork/src/routes/login/+page.svelte
timestamp: 2026-10-29T09-40-13Z
slug: src-routes-login-page-svelte
---
# Login page, /login (29 October 2026 sweep)

Method: single combined agent (design review, detector, overlay, polish walk). Target: src/routes/login/+page.svelte and the .auth-* rules in src/app.css. Saved for later; nothing acted on; the form was never submitted, so error and pending states are read from source.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Generic tab title; no pending state on the button |
| 2 | Match system / real world | 3 | "Welcome back", "Sign in to your cookbook" |
| 3 | User control and freedom | 2 | No forgot-password, no show-password |
| 4 | Consistency and standards | 2 | Navbar "Login" vs button "Sign in"; the card carries the legacy shadow |
| 5 | Error prevention | 3 | required, type=email, server validates |
| 6 | Recognition over recall | 3 | Two fields, one button |
| 7 | Flexibility and efficiency | 2 | No OAuth or magic link (fine pre-production) |
| 8 | Aesthetic and minimalist design | 3 | Quiet card |
| 9 | Error recovery | 2 | Error block shows raw Supabase text, no role=alert, not tied to a field |
| 10 | Help and documentation | 1 | No password recovery path at all |
| Total | | 23/40 | Needs work |

## Design specificity

2 of 5: a centred 420px card with two fields and a yellow button is every auth page; only the Bitter clay h1 and the eyebrow labels tie it to Fork. The shadow works against the Flat-At-Rest rule. Redirects verified: owner state 303 to / (the code comment says profile); the hidden redirectTo input renders and localPath guards it on load and action. Both inputs have real labels. Console, overflow, focus, text contrast clean; placeholders 3.4:1.

## Priority issues

- [P1] .auth-page min-height 100dvh sits under a 56px navbar, so the document is always viewport plus 56px and scrolls for nothing; on a phone the card sits off-centre. Fix: calc(100dvh - 56px) or let main flex.
- [P1] The card's box-shadow is the legacy token DESIGN.md marks for removal on this very surface. Fix: delete it; the border and tone step already separate the card.
- [P2] Generic <title> ("Sign in — Fork"); error block needs role=alert and Fork's own wording with a recovery link; no forgot-password link anywhere.
- [P3] "Create one" link 20px tall; the password placeholder repeats the mask; copy case navbar "Login"/"Sign Up" vs page "Sign in"/"Create one"; subtitle 0.95rem off the ramp; the stale profile-redirect comment in +page.server.ts.

## Persona and question

Someone who forgot their password and wants one recipe tonight has no path from this page except "Create one", which fails on the existing email with a raw Supabase string. Should auth pages drop the navbar (wordmark only) and let the card be the page, since the bar still offers Login and Sign Up as if you were not already here?
