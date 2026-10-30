---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:017766e1c4efcb05815cb3faa23df7a7b7e0210e33f7a67c674cbf57fa4d59b0"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-29T23-58-37Z
slug: src-routes-recipes-slug-page-svelte
---
---
target: recipe page, final run
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Recipe page, final run of the design phase (29 October 2026, seventh run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped). Tree 61dd3ab; the "Older version" label was removed after this run (d132ba6), so the bar now reads chip, note, controls. Trend 29 → 30 → 31 → 32 → 33/40. Owner session held.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Ticks last 12h across tabs but nothing says they are kept |
| 2 | Match system / real world | 4 | The dot fixed "Back to v3 3 versions" |
| 3 | User control and freedom | 3 | No way to clear ticks except row by row |
| 4 | Consistency and standards | 4 | Nit: Favorite 500 beside Fork 600 |
| 5 | Error prevention | 3 | |
| 6 | Recognition rather than recall | 4 | |
| 7 | Flexibility and efficiency | 3 | No serving scale, no wake lock |
| 8 | Aesthetic and minimalist design | 4 | One fill, one accent, one bar |
| 9 | Error recovery | 3 | Alerts say only "Could not … Try again." |
| 10 | Help and documentation | 2 | "1 fork" goes nowhere; nothing explains forks or versions |
| Total | | 33/40 | Good |

Evidence (B): detector 10 advisory, all known. Verified: the phone controls with their dot, both items on one line at 1280/1024/768/390/320; ticks survive a reload and a new context, none on v2, localStorage {ticks, at}; 12 cloned steps: tick at the row start, every numeral's right edge 10.0px from its text; the 404's "Skip to content" → #main; chevron 1e-05s under reduced motion; navbar all-small-caps 600. Console clean through load, open, tabs, tick, reload; CLS 0; no overflow at 320; Escape 3/3; Tab order right, the navbar and byline handles no longer adjacent; hits ≥24 at 1280/768 (smallest "Back to v3" 26), ≥44 at 390; contrast lowest 4.91 apart from ticked rows; phone hero title 72, photo 152, bar 594, tabs 707, first ingredient 773. 12 styles at 1280.

Priority issues: [P2] "1 fork" is a dead end (no page lists forks; the tree is one-way): with exactly one public fork make it a link to it (decision). [P2] Kept ticks are invisible and have no reset: a quiet "Clear ticks" link under a ticked list. [P3] A focused ingredient row coming up from below the fold is clipped at the viewport bottom (row bottom 902 of 900 at 1280, 1026 of 1024, 846 of 844): scroll-padding-bottom is only on the aside's own scroll; a page-level scroll-padding-bottom or scroll-margin-bottom on the rows. [P3] Ticked rows dim to 0.6 (grams 2.34, numeral 2.66, text 4.52), the only text under 4.5 on the page. [P3] The page ends flat (157px of paper at 1280, no next action): one quiet closing line (decision). [P3] "Log out" 14px beside 15px small-caps links. [P3] Favorite 500 beside Fork 600. [P3] On a phone one ingredient shows on the first screen.

Cognitive load 7/8 (the Method tab, closed). Personas: phone cook (rows big, ticks persist, no wake lock, no clear-all, first screen shows one ingredient); first-timer (Fork → login unexplained; "1 fork" nowhere; "3 versions ▾" the only hint; a shared ?version=2 link shows a different title). Minor: a one-digit step's square sits 30px from its numeral (documented); the owner on an older version has no actions or restore; a one-version fork shows no bar; generic alerts; no footer.

Questions: "1 fork" → the fork when exactly one (rec yes); "Clear ticks" (rec yes); a closing line after the last step (rec the version line, no second Fork).

Skipped: overlay; dark mode; signed-in Fork; the hydration flash. Screenshots: wave4/recipe/A and B.
