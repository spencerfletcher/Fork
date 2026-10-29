---
target: sign-up page, end of day
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/signup/+page.svelte"
target_fingerprint: "sha256:6e0c11eece124c9783923954877de8dc5f28d5b36c1b77786d0dbecb32c6fe8f"
target_path: /Users/spfle/Dev/Fork/src/routes/signup/+page.svelte
timestamp: 2026-10-29T21-08-55Z
slug: src-routes-signup-page-svelte
---
# Sign-up page, end-of-day sweep (29 October 2026, second run)

Combined agent (review, detector, polish walk; overlay skipped; never submitted, server errors injected). Trend 22 → 28/40.

| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of system status | 3 |
| 2 | Match system / real world | 3 |
| 3 | User control and freedom | 3 (you choose your handle; cannot change it later) |
| 4 | Consistency and standards | 2 (h1 sentence case against the Title Case decision; Log in / Sign in) |
| 5 | Error prevention | 2 (username rules enforced on the server only) |
| 6 | Recognition over recall | 3 |
| 7 | Flexibility and efficiency | 3 (prefill) |
| 8 | Aesthetic and minimalist design | 3 |
| 9 | Error recovery | 3 |
| 10 | Help and documentation | 3 |
| Total | | 28/40 |

Evidence: title set; the document fits the viewport; all three inputs labelled, hints linked by aria-describedby; "Jane.Doe1987@example.com" prefills "janedoe1987" and stops once the user edits; the field error renders under the field at 6.63:1; the alert's inline "Sign in" link is 1.13:1 against the alert text and wraps at 390.

Priority issues: [P2] username rules only on the server: add pattern="[A-Za-z0-9_-]{3,30}" and state the rules in the hint (a too-short prefill like "jo" passes the client because minlength ignores script-set values). [P2] the alert's "Sign in" link cannot be told from the alert text; underline it and keep it on one line. [P3] h1 to Title Case ("Create an Account"); no pending state; email lacks autocomplete="email"; the switch link is 20px tall; "- or _" reads awkwardly. Persona: Jane types "Jane Doe" and learns the rules after a round trip. Question: rules up front in the hint, with the pattern (recommended).
