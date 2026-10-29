---
target: recipe page, end of day
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:dfa0cf9bcbd919d8f6e251e53d0336bb6f9f8379fe59c6e29b9e5f9684928702"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-29T21-08-54Z
slug: src-routes-recipes-slug-page-svelte
---
# Recipe page, end-of-day sweep (29 October 2026, third run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped, shared server). Target: src/routes/recipes/[slug]/+page.svelte and components/. Trend 29 → 30/40.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Ticking a method step never filled its square (fixed the same hour, d182186); "Older version" trails the bar line at the far right |
| 2 | Match system / real world | 3 | Reads like a cookbook; fork, versions, compare unexplained; "15 min" beside "1h 15m" |
| 3 | User control and freedom | 3 | Back to v3 and scoped Escape; ticks lost on reload; Fork one click by decision |
| 4 | Consistency and standards | 3 | Measure dots are typed while the bar's are CSS; DESIGN.md's Clay Is Text rule contradicts the clay-filled tick |
| 5 | Error prevention | 3 | Favorite rolls back |
| 6 | Recognition over recall | 3 | Tick border 1.35:1; phone note still half hidden; the aside hides its last row with no cue |
| 7 | Flexibility and efficiency | 3 | Skip link, sticky aside with inner scroll, tabs |
| 8 | Aesthetic and minimalist design | 4 | One fill, one accent, one bar |
| 9 | Error recovery | 3 | Alerts say only "Try again" |
| 10 | Help and documentation | 2 | Nothing explains versions or forks; the ≈ tooltip is a title, invisible on touch |
| Total | | 30/40 | Good |

## Evidence

Zero real detector findings on the page. Console, overflow, Tab order, focus rings, Escape scoping, phone hit sizes (header links 46px, bar 44px), contrast (dots now 4.91:1), the two-line note clamp, the dotless phone separators, the sticky aside scrolling inside (scrollHeight 1187 in 652), marigold selection, priority photo, phone hero order: all verified. The font shift is gone (CLS 0.0004). Header rhythm 8/8/8/8/16 exact; 13 style combinations above the first ingredient (9 in the header).

## Priority issues

- [P1, fixed] Method squares never filled: the tick sat inside the numeral span where peer-checked could not reach it; both components now use group-has. e2e asserts the computed fill.
- [P2] The ingredient focus ring is clipped on both sides at 1024 and up: the aside's overflow-y: auto clips the 2px outline at 2px offset. Fix: inner padding on the aside with a matching negative margin, or outline inset.
- [P2] The tick square is too faint and the checked fill dims: Rule 2 border at 1.35:1 (3:1 is the floor for a control), and the row's 0.6 opacity turns the clay fill salmon and the grams to 2.34:1. Fix: Ink 3 border (Spencer ruled Rule 2; worth revisiting), opacity on the text span only.
- [P2] The sticky aside hides its last row with no cue (no overlay scrollbar, no fade). Fix: a bottom fade while it overflows.
- [P2] "Older version" trails the line. Within the marigold ruling: lead with it after the chip.
- [P3] The mono metric fallback never loads: src: local('Menlo') errors in Chromium; local('Menlo Regular') works. The 600 weights are not preloaded. Typed dots in the measure strand at 320px. Hero alt repeats the h1. At 768 the note clamps to one line though two would fit.

## Personas and questions

Phone cook: first ingredient at y773 of 844; ticks vanish on reload; the Method tab hides quantities (cost of the switch decision). First-timer: "1 fork" is neither link nor explained; a shared ?version=2 link reads as a different recipe. Questions: should the numeral carry the done state instead of a square on method rows; should ticks survive a reload (sessionStorage per recipe and version); what carries "older" at a glance with marigold on every chip.
