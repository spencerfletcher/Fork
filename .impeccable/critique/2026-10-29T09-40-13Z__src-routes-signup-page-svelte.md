---
target: sign-up page
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/signup/+page.svelte"
target_fingerprint: "sha256:bfe4e2db99ede446d7bb06a708365272f15212986f5e32ca58eedf242d9e7126"
target_path: /Users/spfle/Dev/Fork/src/routes/signup/+page.svelte
timestamp: 2026-10-29T09-40-13Z
slug: src-routes-signup-page-svelte
---
# Sign-up page, /signup (29 October 2026 sweep)

Method: single combined agent (design review, detector, overlay, polish walk). Target: src/routes/signup/+page.svelte, src/lib/server/profiles.ts. Saved for later; nothing acted on; the form was never submitted.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Generic title; the confirmation email is first mentioned after the redirect |
| 2 | Match system / real world | 3 | "Create an account", "Start building your personal cookbook" |
| 3 | User control and freedom | 1 | Cannot choose a username; the handle is silently the email's local part, forever |
| 4 | Consistency and standards | 2 | Same card and shadow; navbar "Sign Up" vs "Create account" |
| 5 | Error prevention | 2 | minlength=6 only, stated in a placeholder that vanishes on the first keystroke |
| 6 | Recognition over recall | 3 | Two fields |
| 7 | Flexibility and efficiency | 2 | No OAuth |
| 8 | Aesthetic and minimalist design | 3 | Quiet |
| 9 | Error recovery | 2 | Raw err.message, no role=alert; "already registered" not routed to Sign in |
| 10 | Help and documentation | 2 | Placeholder hint only; nothing says what happens next |
| Total | | 22/40 | Needs work |

## Design specificity

1 of 5: the login card with different strings; nothing previews what a Fork account is for. Same legacy shadow, same 100dvh scroll gap, same 3.4:1 placeholders. Labels, required, type=email, focus order, console, overflow, contrast clean; the server creates the profile row before the email confirm.

## Priority issues

- [P1] The handle is never asked for or shown: ensureProfile takes the email's local part (with a suffix on conflict) and that becomes the public URL and every byline. Fix: a username field with the existing uniqueness check surfaced as a field error, or a live "Your handle will be @alice" preview and an edit later.
- [P1] Same 100dvh scroll gap and legacy card shadow as Login (shared .auth-page and .auth-card; one fix covers both).
- [P2] Password rule only as a placeholder; make it a form hint under the field (and check the Supabase minimum matches). Generic <title>. Error block without role=alert. No sentence saying a confirmation email will be sent.
- [P3] "Sign in" switch link 20px; placeholder contrast; navbar Title Case.

## Persona and question

A cook whose email is jane.doe1987 becomes @jane.doe1987 to the world on her first recipe, with no way to change it. Is a sign-up card the right first encounter with git for recipes, or should the first screen be forking a recipe you were just reading, with the account created on the way out? The redirectTo plumbing already exists for that.
