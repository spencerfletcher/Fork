---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/+page.svelte"
target_fingerprint: "sha256:edf42bc67c58ebdfb9150b6bdc3398b9050834840fd87fb8509443227b9564eb"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/+page.svelte
timestamp: 2026-10-29T23-15-06Z
slug: src-routes-recipes-page-svelte
---
---
target: browse surfaces and navbar, wave 3
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Browse surfaces and navbar, wave 3 (29 October 2026, fourth run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped). Tree 61519d7. Trend 27 → 30 → 31 → 33/40. Owner checks redone after the 16:09 PT session regeneration; the first signed-in passes had rendered logged out and are discarded.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | aria-current complete: Recipes on / and /tags/*, My Recipes on /recipes, Search on /search, in the bar and the phone menu |
| 2 | Match system / real world | 3 | v3 unexplained on browse |
| 3 | User control and freedom | 4 | Clear all leads the row; every empty state has a way out |
| 4 | Consistency and standards | 3 | Phone-menu handle 15px mono beside 15px sans rows; the phone menu's "New recipe" a plain row where desktop has the marigold CTA |
| 5 | Error prevention | 3 | A tag-only search titles the tab "Search — Fork" |
| 6 | Recognition over recall | 3 | The phone strip hides its third column with no peek |
| 7 | Flexibility and efficiency | 3 | No sort |
| 8 | Aesthetic and minimalist design | 3 | 700–1023 the landing diff is unfolded (1377px); My Recipes repeats the owner's handle on every card |
| 9 | Error recovery | 4 | "Clear filters" keeps the query, 26.4/44.4 hits |
| 10 | Help and documentation | 3 | The landing diff teaches; browse never explains vN or forks |
| Total | | 33/40 | Good |

## Evidence (B)

Detector: 9 advisory, all on the false-positive list. Verified: Recipes href / current on / and /tags/dessert, My Recipes current on /recipes, Log in/Sign up current on their pages, current colour rgb(247,243,236) in bar and menu; bar ring marigold on every stop including the handle; phone-menu handle 48.75, toggle 44; "Log out"; v1 cards no mark, v3 cards marked, no stranded dot at 1280/1100/1024/390, dots off ≤1023; "Clear search"/"Clear filters" 26.4/44.4, filters href keeps q; "Open the full comparison →" 26.4/44.4 in Source Sans 16 clay like "All recipes →"; landing photos lazy, no fetchpriority; six cards two rows at every width (4/3/3 columns; 390 a 3×2 column strip scrolling 579 in 390, page stays 390); diff at 390 three "4 unchanged", 11 visible, first photo y=1698; at 1280 all 20 rows; pressed pill ring unclipped at 1280 first and last and 390 first; left edges 40/24/24/18 shared by hero, diff, Recent, first card. 56 loads, console clean, CLS ≤0.00006, no overflow, no nested interactives, no target under 24 at ≥768 or 44 at 390, lowest contrast 4.91 (5.35 on the auth pages); focus stays on Dessert after a press, American after Clear all; titles right per state. 9 type styles on /recipes at 1280, 8 at 390.

## Priority issues

- [P2] At 390 pressing the last filter pushes the focused pill off-screen: "Clear all" is inserted at the front, so the pressed Spicy spans x 377–409 on a 390 viewport with scrollLeft still 0 (row 427 wide), the ring 29px past the edge. Fix: scroll the pressed pill into view after the row re-renders (scrollIntoView inline nearest).
- [P2] The phone strip hides its scroll: columns at x=18 and 207 end at 372, the third starts at 396, no scrollbar, reads as a finished 2×2 and nothing peeks at either end. Fix: grid-auto-columns calc((100% - 24px) / 2.25), keep the snap.
- [P2] The landing diff is unfolded from 700 to 1023 though the panels already stack at 768: 1377px of rows, first photo at 1773 on a 1024-tall iPad. Fix: fold whenever the panels stack (below 1024).
- [P3] The phone landing is still two screens to the food (first card at 1698 of 844): the Details title row wraps three lines, steps 5 and 6 take ~400px. Options: drop Details on the phone landing, or Ingredients only (decision).
- [P3] Card author 0.75rem fixed in a 13px line (ratio 0.923, not 0.9375); the phone-menu handle 15px beside 15px rows.
- [P3] My Recipes repeats the owner's handle on every card (a prop to leave the author out on /recipes signed in).
- [P3] The strip flows by column, so the top row reads cards 1, 3, 5 and keyboard focus goes down then right, transposing newest-first.
- [P3, carried] Photos have no srcset (800px into 165px slots); the search empty state centred under a left header; the phone tag row overflows 5px; at 768 "1 fork" wraps; a tag-only search names no tag; DESIGN.md "+ New Recipe" vs shipped "+ New recipe"; 132px gap between "Open the full comparison" and "Recent" on a phone.

## Cognitive load, personas

2 of 8 fail: progressive disclosure at 700–1023; discoverability of the phone strip. Watch: the same six tag words are links on browse and toggles on /search. Phone cook signed in: the menu goes where it says; time the faintest text; no servings; the cookie recipes differ by 28/31 min and v3; photos ~3× oversized. First-timer: no food above the fold at any width; iPad food behind the unfolded diff; phone strip looks complete and hides two; ends on a quiet "All recipes →".

Questions: strip at ~2.25 columns (rec yes); fold below 1024 (rec yes); drop Details on the phone landing (rec yes).

Skipped: overlay; Enter in the search box; Log out and favorites; the no-query empty state's links; strip focus-ring clipping on keyboard; tablet with six real cards (clones). Screenshots: wave3/browse/A and B.
