---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/signup/+page.svelte"
target_fingerprint: "sha256:d84f0260930947dc24954f746e8ff0e91b786634002d5fefd9e32d02f84f4be9"
target_path: /Users/spfle/Dev/Fork/src/routes/signup/+page.svelte
timestamp: 2026-10-29T21-54-17Z
slug: src-routes-signup-page-svelte
---
---
target: sign-up, final run
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
---
# Sign-up, final sweep (29 October 2026, third run)

Combined A+B on Opus; overlay skipped. Trend 22 → 28 → 29/40. Tree at b511c97.

**[P1] The username pattern is ignored in Chromium.** The attribute is `[A-Za-z0-9_-]{3,30}`; Chromium compiles HTML pattern with the regex v flag, under which an unescaped - inside a class is a syntax error. Console: "Pattern attribute value [A-Za-z0-9_-]{3,30} is not a valid regular expression", and the pattern is dropped. "Jane Doe" + blur: :user-invalid false, the rule line stays hidden. Email jo@example.com prefills "jo" and reports valid (minlength ignores script-set values; the pattern meant to catch it is dead). Only typed length errors fire (tooShort). The unit test at signup/page.svelte.test.ts:96 checks only the attribute text. Verified in Node by the parent: the current pattern throws under v; `[A-Za-z0-9_\-]{3,30}` compiles (jane_doe-1 true, Jane Doe false). Red test first: compile the attribute with new RegExp('^(?:' + p + ')$', 'v'). The server still validates, so no bad data; the cost is the round trip the pattern was meant to save.

Evidence: title "Create an Account — Fork", h1 matches; fits the viewport at both widths, including with a field error on a phone; autocomplete email, username, new-password; hints linked by aria-describedby; prefill "Jane.Doe1987@example.com" → janedoe1987, stops once edited; "Log in" → /login?redirectTo=%2Ffavorites when set; the injected alert's link underlined, one line; contrast 5.35 lowest, rule line in error red; 8 type styles; console error from the invalid pattern.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | |
| 2 | Match system / real world | 3 | |
| 3 | User control and freedom | 3 | |
| 4 | Consistency and standards | 3 | |
| 5 | Error prevention | 2 | Character rules still server-only: the pattern is ignored |
| 6 | Recognition over recall | 3 | |
| 7 | Flexibility and efficiency | 3 | |
| 8 | Aesthetic and minimalist design | 3 | |
| 9 | Error recovery | 3 | |
| 10 | Help and documentation | 3 | |
| Total | | 29/40 | |

Strengths: the prefill is respectful; the rules are stated before they are needed. Cognitive load 7/8 (the rule printed twice when invalid: error line, then the hint 30px below).

Priority: [P1] the pattern (above); [P3] when the rule line shows, readers are not told: no id, not in aria-describedby, aria-invalid not set for client errors; [P3] the rule twice when invalid (hide the hint's first sentence while the rule shows); [P3] the "Log in" switch link 20px. Persona: Jane types "Jane Doe", sees no complaint, learns the rule after a round trip. Question: with the pattern fixed, should the hint lose its rules sentence while the error shows?

## Navbar (shared finding, all pages)

Wordmark 44.3px; desktop links 28, handle and Logout 31.1, "+ New recipe" 37.1; phone icon and toggle 44, menu rows 48.8; tan on espresso 7.80:1; aria-current=page on the handle on the owner's own profile in both bar and phone menu, absent elsewhere.
- [P2] The handle in the phone menu is 153×21: the 12px padding sits on the wrapping div, not the link. Fix: padding on the link, display block, like .mobile-link.
- [P2] Current state is uneven: the handle gets aria-current but no visual change (stays tan) while a current nav link turns cream without aria-current; the phone menu shows neither. Fix: aria-current on active links in both lists, and [aria-current=page] cream in Username's on-dark style.
- [P3] The handle's focus ring is clay 3.08:1 where every other bar stop is marigold 8.75:1: nav :focus-visible does not reach the Username component. Fix: nav :global(:focus-visible).
- [P3] On /login and /signup the matching nav link is not marked current.

Screenshots: scratchpad/wave2/secondary/signup-*.png, signup-invalid-*, signup-shortprefill-1280, signup-alert-injected-1280.
