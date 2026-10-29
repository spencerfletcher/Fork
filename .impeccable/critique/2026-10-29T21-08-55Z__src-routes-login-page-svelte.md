---
target: login page, end of day
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/login/+page.svelte"
target_fingerprint: "sha256:7ba576082175e1ab8d47b014c925d642ecd0784c23b7133ce49a106469c1b56e"
target_path: /Users/spfle/Dev/Fork/src/routes/login/+page.svelte
timestamp: 2026-10-29T21-08-55Z
slug: src-routes-login-page-svelte
---
# Login page, end-of-day sweep (29 October 2026, second run)

Combined agent (review, detector, polish walk; overlay skipped; the form was never submitted, the error state was injected). Trend 23 → 25/40.

| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of system status | 3 (no pending state) |
| 2 | Match system / real world | 3 |
| 3 | User control and freedom | 2 (no forgot-password, no show-password) |
| 4 | Consistency and standards | 2 (navbar "Log in" vs title and button "Sign in") |
| 5 | Error prevention | 3 |
| 6 | Recognition over recall | 3 |
| 7 | Flexibility and efficiency | 2 (no autocomplete tokens) |
| 8 | Aesthetic and minimalist design | 3 |
| 9 | Error recovery | 3 |
| 10 | Help and documentation | 1 (no password recovery) |
| Total | | 25/40 |

Evidence: title "Sign in — Fork"; the document fits the viewport (the 100dvh gap is fixed); no card shadow; the error block is an alert with Fork's wording at 5.44:1; owner state redirects to /; redirectTo renders; both inputs labelled; placeholders 5.35:1.

Priority issues: [P2] no pending state (use:enhance without a callback; double submit possible); [P2] no autocomplete tokens (email, current-password); [P2] verb mismatch: navbar "Log in", page "Sign in" everywhere else (recommend "Log in" everywhere, since "Sign in" and "Sign up" differ by two letters in one navbar). [P3] "Create one" is 20px tall and does not forward redirectTo; the password placeholder repeats the mask; stale comments in +page.server.ts; forgot-password parked on the roadmap. Question: which verb.
