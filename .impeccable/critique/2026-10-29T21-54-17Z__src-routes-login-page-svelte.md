---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/login/+page.svelte"
target_fingerprint: "sha256:2611dc85158ba6153ffccd216509fe158491361e67ca3198da01cdd378022028"
target_path: /Users/spfle/Dev/Fork/src/routes/login/+page.svelte
timestamp: 2026-10-29T21-54-17Z
slug: src-routes-login-page-svelte
---
---
target: login, final run
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Login, final sweep (29 October 2026, third run)

Combined A+B on Opus; overlay skipped. Trend 23 → 25 → 27/40. Tree at b511c97.

Evidence: title "Log in — Fork"; page exactly the viewport at both widths; labels associated; autocomplete email and current-password; password has no placeholder; "Create one" → /signup?redirectTo=%2Ffavorites with the redirect, plain /signup without; hidden input redirectTo=/favorites; inputs 44.8 (46.4 phone), button 50.4; "Create one" 62.8×20 in a sentence (inline exception); lowest contrast 5.35 (labels); 7 type styles; pending state not observed (needs a submit), source confirms disabled + "Logging in…". Console clean, CLS 0, no overflow.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | |
| 2 | Match system / real world | 3 | |
| 3 | User control and freedom | 2 | No forgot-password, no show-password |
| 4 | Consistency and standards | 3 | |
| 5 | Error prevention | 3 | |
| 6 | Recognition over recall | 3 | |
| 7 | Flexibility and efficiency | 3 | |
| 8 | Aesthetic and minimalist design | 3 | |
| 9 | Error recovery | 3 | |
| 10 | Help and documentation | 1 | No password recovery |
| Total | | 27/40 | |

Strengths: a password manager fills it in one go; the redirect survives a detour through sign-up. Cognitive load 8/8.

Priority: [P2] no password recovery (roadmap, settings page); [P3] a visitor bounced from /favorites gets the generic subtitle with no reason ("Log in to see your favorites" when redirectTo is set); [P3] "Create one" 20px on a phone. Persona: a returning cook who forgot their password has no way forward. Question: should the subtitle name the destination when redirectTo is set?

## Navbar (shared finding, all pages)

Wordmark 44.3px; desktop links 28, handle and Logout 31.1, "+ New recipe" 37.1; phone icon and toggle 44, menu rows 48.8; tan on espresso 7.80:1; aria-current=page on the handle on the owner's own profile in both bar and phone menu, absent elsewhere.
- [P2] The handle in the phone menu is 153×21: the 12px padding sits on the wrapping div, not the link. Fix: padding on the link, display block, like .mobile-link.
- [P2] Current state is uneven: the handle gets aria-current but no visual change (stays tan) while a current nav link turns cream without aria-current; the phone menu shows neither. Fix: aria-current on active links in both lists, and [aria-current=page] cream in Username's on-dark style.
- [P3] The handle's focus ring is clay 3.08:1 where every other bar stop is marigold 8.75:1: nav :focus-visible does not reach the Username component. Fix: nav :global(:focus-visible).
- [P3] On /login and /signup the matching nav link is not marked current.

Screenshots: scratchpad/wave2/secondary/login-*.png, login-redirect-*.png.
