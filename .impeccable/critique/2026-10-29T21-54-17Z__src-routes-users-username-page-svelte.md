---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/users/[username]/+page.svelte"
target_fingerprint: "sha256:685dd31863d67321eb9e1b97daef1345b04b1add48ef4da53be52cfa068c1ef8"
target_path: /Users/spfle/Dev/Fork/src/routes/users/[username]/+page.svelte
timestamp: 2026-10-29T21-54-17Z
slug: src-routes-users-username-page-svelte
---
---
target: profile, final run
total_score: 23
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 0
---
# Profile /users/[username], final sweep (29 October 2026, third run)

Combined A+B on Opus; overlay skipped (shared server). Trend 20 → 22 → 23/32. Tree at b511c97 (preview built after 34df375 and e78e512).

Evidence: title "@spencerfletcher — Fork"; page is exactly the viewport at 1280 and 390; h1 Bitter 40/28; stats mono with a CSS dot, one eyebrow "4 recipes"; lowest contrast 4.91 ("8 commits"), avatar S 4.98; 9 type styles outside the navbar; no target under 24 at desktop or 44 on a phone; owner and logged-out views identical below the bar; the private-recipes link is unreachable (seed has 0 private), source has href /recipes. Console clean, CLS 0, no overflow, ring on every stop.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Current state announced but not visible |
| 2 | Match system / real world | 3 | "commits" |
| 3 | User control and freedom | 3 | |
| 4 | Consistency and standards | 3 | |
| 6 | Recognition over recall | 3 | |
| 7 | Flexibility and efficiency | 2 | No sort or filter |
| 8 | Aesthetic and minimalist design | 3 | |
| 10 | Help and documentation | 3 | |
| Total | | 23/32 | |

Strengths: one calm mono header line under the Bitter handle; the grid matches browse exactly. Cognitive load 7/8 (the unexplained "commits").

Priority: [P2] no visible current marker on the owner's own handle; [P2] phone-menu handle 21px (navbar); [P3] "8 commits" is git vocabulary; [P3] with 0 private recipes the owner has nothing to act on in the page. Persona: a home cook cannot tell what a commit is. Question: should the owner's view carry one in-page action (New recipe), or does the navbar CTA cover it?

## Navbar (shared finding, all pages)

Wordmark 44.3px; desktop links 28, handle and Logout 31.1, "+ New recipe" 37.1; phone icon and toggle 44, menu rows 48.8; tan on espresso 7.80:1; aria-current=page on the handle on the owner's own profile in both bar and phone menu, absent elsewhere.
- [P2] The handle in the phone menu is 153×21: the 12px padding sits on the wrapping div, not the link. Fix: padding on the link, display block, like .mobile-link.
- [P2] Current state is uneven: the handle gets aria-current but no visual change (stays tan) while a current nav link turns cream without aria-current; the phone menu shows neither. Fix: aria-current on active links in both lists, and [aria-current=page] cream in Username's on-dark style.
- [P3] The handle's focus ring is clay 3.08:1 where every other bar stop is marigold 8.75:1: nav :focus-visible does not reach the Username component. Fix: nav :global(:focus-visible).
- [P3] On /login and /signup the matching nav link is not marked current.

Screenshots: scratchpad/wave2/secondary/profile-*.png, navbar-handle-focus-1280.png.
