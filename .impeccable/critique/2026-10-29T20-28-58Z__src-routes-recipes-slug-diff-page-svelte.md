---
target: compare page, second sweep
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte"
target_fingerprint: "sha256:d15efd2f309479a5028797ab81ae7e6a90d87f3b832f1ded44c90ffeca744821"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte
timestamp: 2026-10-29T20-28-58Z
slug: src-routes-recipes-slug-diff-page-svelte
---
# Compare page, second sweep after the fixes (29 October 2026)

Method: dual-agent (A design review, B detector + overlay + polish walk). Target: src/routes/recipes/[slug]/diff/+page.svelte, +page.server.ts, +error.svelte, src/lib/components/recipes/VersionDiff.svelte. Previous run 23/40.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | Tab title, summary line, pickers and URL agree; focus stays on the changed select; the 400 page keeps the default title |
| 2 | Match system / real world | 3 | "to", "Method", "36 servings" land; "3 details" is a tally, not a cook's word; no key for ~, strike, underline |
| 3 | User control and freedom | 3 | Reversed pair redirects; no swap or step; the From version has no link |
| 4 | Consistency and standards | 3 | Chip matches DESIGN.md; one stray: a 16px sans arrow between an 11px label and a 14px mono select |
| 5 | Error prevention | 3 | Same pair explained, reversed corrected, non-numeric a clean 400; the picker still offers the same version on both sides |
| 6 | Recognition over recall | 3 | Closed selects truncate the message ("v2: Increased" at 390) |
| 7 | Flexibility and efficiency | 2 | Each select change is a navigation; no stepping or swap |
| 8 | Aesthetic and minimalist design | 3 | Dimming works; title, servings and cook time still stated three to four times; cards 201px tall |
| 9 | Error recovery | 3 | 400 names the recipe and offers a way back; the one-version message contradicts its helper line |
| 10 | Help and documentation | 3 | Screen readers get prefixes and "to"; sighted first-timers get no legend |
| Total | | 30/40 | Good (was 23) |

## Design specificity

Specific to Fork and now mostly to the cook's question: how much changed is one sans line at y 167, the first real change sits inside the fold at every width, "to" and value-then-label measures replace the git grammar. Left of the costume: the ~ marker drawn in the receded grey, and a summary that counts where it could name. Detector: 9 advisories, 7 ramp false positives, 2 inherited from the root error page convention (4rem status, 1.5rem h1 in +error.svelte). Overlay: cream palette only. Console, overflow, focus rings, contrast (minimum 4.91:1), picker focus, redirect, 400 page, same-version line, Read link at 44px on a phone: all verified. Screen reader reads a modified row as "Changed: deletion ¾ to insertion ½ cup granulated sugar"; the clipboard gets "¾ to ½ cup". 21 colour combinations, 10 by face/size/weight, 5 sizes (down from 7).

## Working

- The summary line and the dimmed rows: at 1280 the eye lands on the three Details rows and the fraction changes first.
- The diff is honest to a screen reader and the clipboard; the best-marked-up diff outside a code host.
- The page has an end: Read v3 after the last row, 44px on a phone.

## Priority issues

- [P1] The modified marker (~) is drawn in Ink 3, the same grey as the unchanged rows it should stand apart from; modified step numbers are already clay. Fix: one rule, the ~ in clay (or Ink 2), the modified row's content in ink.
- [P2] Title, servings and cook time stated three to four times across the two cards and the Details rows. Fix: cards keep number, author, date and message; Details carries the facts with their del/ins.
- [P2] The From version has no link; the page is a corridor to the newer version. Fix: card numbers link to their version, or end with "Read v2 · Read v3".
- [P3] Summary counts where it could name ("Title, servings and cook time · 3 ingredients · 2 steps changed"). The one-version 400 says "Need at least two versions" then "Pick two of the recipe's versions"; the 400 page has the default title. Card usernames 18px tall; back link 23px. Modified step rows announce "Changed: 5 Gradually stir" with no separator after the number. Font-swap CLS 0.066 at 1280 (site-wide, fonts round).

## Persona red flags

Cook deciding which version: the facts are in one place now, but preferring the older version is not served (chip, Read and back all point forward). Author checking their change: diffSteps matches by position, so an inserted step marks every later step modified; a renamed ingredient counts as two changes. Neither is in the seed.

## Minor observations

The 16px sans arrow is the one off-system glyph. At 768 the card measures wrap. The back link is the page's one Ink 3 link. No test names the same-version state in the diff route's tests. Unchanged step numbers Ink 3, modified clay: the model for fixing the ~.

## Questions to consider

- Is the From card worth 201px when every differing fact is in the Details rows?
- Should the summary speak rather than count?
- Why is the ~ greyer than the +?
