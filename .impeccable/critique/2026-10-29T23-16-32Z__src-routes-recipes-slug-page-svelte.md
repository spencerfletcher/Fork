---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:017766e1c4efcb05815cb3faa23df7a7b7e0210e33f7a67c674cbf57fa4d59b0"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-29T23-16-32Z
slug: src-routes-recipes-slug-page-svelte
---
---
target: recipe page, wave 3
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Recipe page, wave 3 (29 October 2026, sixth run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped). Tree 61519d7. Trend 29 → 30 → 31 → 32/40. Owner checks redone after the 16:09 PT session regeneration (r2-* and owner2-* files); the earlier owner files are logged-out views.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Ticks restore only after hydration (0 ticked, then 2 with JS delayed 800ms); nothing says they are kept |
| 2 | Match system / real world | 3 | At 390 an older version's controls read "Back to v3 3 versions" with no separator; "1 fork" unexplained |
| 3 | User control and freedom | 3 | No way to clear ticks; sessionStorage is per tab |
| 4 | Consistency and standards | 3 | Phone separators differ from desktop dots; DESIGN.md lines 182, 188, 283 still say the handle is "at the line's size" |
| 5 | Error prevention | 3 | Fork one click (closed); Favorite rolls back |
| 6 | Recognition rather than recall | 4 | Tick edge, the fade cue, the ≈ footnote, "Older version" leading |
| 7 | Flexibility and efficiency | 3 | No serving scale, no wake lock |
| 8 | Aesthetic and minimalist design | 4 | One fill, one accent, one bar; the fork byline folds three facts into one line |
| 9 | Error recovery | 3 | Alerts say only "Could not … Try again." |
| 10 | Help and documentation | 2 | Nothing explains forks or versions; the ≈ note is a title tooltip |
| Total | | 32/40 | Good |

## Evidence (B)

Detector: 12 advisory (false positives plus the diff +error.svelte 4rem/1.5rem, a sibling route). Verified: fade and Tab at 1280×700 with 25 rows, rows 13/14/21/22 rings above the fade by 16/0.25/23/0.25px, scroll-padding-bottom 30; v2 bar chip, "Older version", note, then "Back to v3 · 3 versions ▾" at the right, no leading or trailing separator at 1280/1024/768/390/320, toggle x equal to v3's at 1280 and 1024 (1123, 883), below 1024 the controls wrap so v2's toggle sits at 186/165/165 against v3's 77/71/71 (the "below 1024 unchanged" ruling); "Fork" in a 44px pill at 320 and 360, full label from 375; ticks (ingredients 1 and 4, step 0) survive a reload, none on v2, back on v3; method row tick-to-numeral 18, numeral-to-text 10.3 for two digits and 21.7 for one, text edge equal (533 at 1280, 83 at 390); fork byline "By @spencerfletcher · forked from Thick and Chewy Chocolate Chip Cookies", no attribution paragraph, parent link clay; cookies "By @spencerfletcher · 1 fork", handle 15 in 16 (0.9375, same in the navbar). Console clean across 15 runs, CLS 0, no overflow at 320; Escape 8/8; Tab order right at 1280 and 390 with 2px rings; smallest hit 26px at 1280/768 ("Back to v3"), 44 at 390; contrast lowest 4.91, parent link 5.36, "forked from" ink 8.53; phone hero title 72, photo 152, byline 336. 12 styles above the first ingredient (three mono sizes within 3px: 15, 14, 12, by role). Owner on the fork sees "Edit recipe"; on v2 no actions.

## Priority issues

- [P2] The phone older-version controls read as one phrase: "Back to v3" ends at x=155, "3 versions" starts at 165, no separator; the two items (~194px) never wrap in the ~214px row even at 320. Fix: keep the CSS dot between the controls on a phone, or a 16px gap and "Back to latest" (decision).
- [P2] Ticks appear only after hydration and are per tab (not into a new tab from a shared link; a tap before hydration probably overwritten, unverified). Options: accept the flash; localStorage with ~12h expiry; a cookie for SSR (decision).
- [P3] The method numeral floats: tick right edge 482, numeral 500–511, text 533, so 18 then 22px; the 10px holds only for two-digit numerals filling the 55px column. Fix: right-align the numeral in its column (decision).
- [P3] Ticked rows still dim to 0.6 (grams 2.34:1, numerals 2.66:1 last measured); open question.
- [P3] The card's handle is a hard-coded 0.75rem in a 13px line (0.923, not 0.9375) and does not use Username; the byline and navbar measure 0.9375.
- [P3] DESIGN.md 182, 188, 283 say "at the line's size".
- [P3] No prefers-reduced-motion anywhere (the 0.15s chevron, the star fill); the handle takes two Tab stops in a row (navbar then byline).

## Cognitive load, personas, peak-end, minor

7 of 8 pass (the Method tab hides quantities, the known cost); grouping borderline on the phone v2 bar. Phone cook: rows 45/56–192px; ticks flash late and do not follow into a new tab; no wake lock; only the first ingredient fits the first screen (773–818 of 844); the v2 bar is 124px tall at 390. First-timer: "1 fork" plain; "3 versions ▾" the only hint; Fork → login unexplained; a shared ?version=2 link shows a different title. The end is still flat (160px of paper at 1280, 67 at 390, no next action). Minor: the owner on v2 gets no actions; dal actions 32px vs 26 around the bar; five 600 weights in the header; the "Fork" switch at 375 a few px conservative; ingredient tick translate-y-2px, method not.

Questions: the dot back on the phone v2 controls (rec yes); ticks to localStorage ~12h (rec yes, product call); numeral right-aligned (rec yes).

Skipped: overlay; a signed-in Fork (one seed user); ticked contrast re-measure; dark mode. Screenshots: wave3/recipe/A and B.
