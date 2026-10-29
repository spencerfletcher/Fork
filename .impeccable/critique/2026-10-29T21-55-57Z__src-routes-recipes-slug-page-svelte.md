---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:33bf18742b78da9cf0163817ddd31f8fb0080420a93642ccc54f66fcf7003761"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-29T21-55-57Z
slug: src-routes-recipes-slug-page-svelte
---
---
target: recipe page, final run
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Recipe page, final sweep (29 October 2026, fifth run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped, shared server). Target: /recipes/[slug] and components. Trend 29 → 30 → 31/40. Tree at b511c97.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The older-version state now leads; ticks vanish on reload with no sign they were kept |
| 2 | Match system / real world | 3 | Reads like a cookbook; "1 fork", "versions" and "Compare" unexplained to a stranger |
| 3 | User control and freedom | 3 | Back to v3 and scoped Escape work; no way to clear ticks, a reload loses them |
| 4 | Consistency and standards | 3 | The "3 versions" toggle sits at x=1123 on the latest and x=337 on an older version; DESIGN.md contradicts the code in three places |
| 5 | Error prevention | 3 | Fork one click (closed); Favorite rolls back on failure |
| 6 | Recognition rather than recall | 4 | Tick edge 4.91:1, the fade cues hidden rows, ≈ footnoted, the note two lines at 768 |
| 7 | Flexibility and efficiency | 3 | Skip link to ingredients, sticky aside, tabs; no serving scale, no persistence |
| 8 | Aesthetic and minimalist design | 4 | One fill, one accent, one bar, nothing boxed in the header |
| 9 | Error recovery | 3 | Alerts say only "Could not … Try again." |
| 10 | Help and documentation | 2 | Nothing explains forks or versions; the ≈ tooltip is a title, which touch never shows |
| Total | | 31/40 | Good |

## Evidence (B)

Detector: 13 advisory; 10 ramp false positives, `#000` inside the fade's mask gradient (false positive), and the diff +error 4rem/1.5rem (sibling route). Verified: tick border Ink 3 1px 14px, 4.91:1; checked fill clay at full opacity 5.36:1, only the text dims; the native checkbox carries the state and the label names the row (`checkbox "2¼ cups (282g) all-purpose flour" [checked]`); ring inside the aside has 0px to spare left and right, not clipped; fade on at the top and middle, gone at scroll end (scrollTop 535), absent when the list fits (11 rows 565px, dal 538px); aside top 20, overflow-y auto, max-height 660 at 700 tall, content 1195 scrolls inside; ?version=2 bar order chip, Older version, Back to v3, 3 versions, then the note (the toggle sits between, see below); note clamps to 2 at 768 (fits) and 390 (ellipsis), v2 1 line at 768 and 2 at 390; separators only before an item, none at 390; measure dots CSS on items 2 and 3, none at 390; photo alt "", fetchpriority high, decoding async; JetBrains Mono 400 and 600 loaded, six faces preloaded, Menlo Regular fallbacks load; CLS 0 everywhere (was 0.0004); console clean across 13 runs; no overflow; Tab order handle, 3 tags, Edit, Favorite, 3 versions, (tabs below 1024), 11 ingredients, steps, 2px clay ring 5.36 on paper; Escape in the bar closes and refocuses 6/6, from a checkbox leaves it open 6/6; hits 1280/768 smallest 26.0 ("Back to v3"), 390 smallest 44.0; lowest text contrast 4.91; phone hero order title, photo, byline (390: y72, 152, 336). 12 type styles above the first ingredient (was 13), all on the ramp. Header rhythm 8/8/8/8/16; first ingredient at y=773 logged out.

## Priority issues

- [P2] Tabbing down a long list leaves the focused row under the fade at 1280×700 with 25 rows: row 14's ring 4.8px below the visible area, row 21's inside the fade, row 22's 24.8px below with only the top edge of the ring showing. Cause: the hidden 1px checkbox sits ~9px below the row's top, so Chrome scrolls only that pixel into view; the next Tab jumps 340px. Fix: scroll-padding-bottom ~28px on .sidebar-sticky, or stretch the hidden input over the row. Real recipes past ~13 ingredients on a 700px screen hit this.
- [P2] The versions toggle moves between versions: x=1123 on v3, x=337 on v2, where the line reads "v2 Older version · Back to v3 · 3 versions ▾ Increased vanilla…" so the toggle reads as the note's label and the note is the fourth item. Fix (within the marigold ruling): lead with "Older version" only, then the note, keep "Back to v3 · 3 versions ▾" at the right as on the latest. Below 1024 unchanged.
- [P2] DESIGN.md contradicts the page: line 171 "Clay never fills a shape" and line 324 "Don't fill anything with clay" against the Strike rows entry; line 295 still says "v2 · note · Older version · Back to v3 · 3 versions ▾" and "below 700px" for the two-line clamp (code: below 1024). Fix: name the strike square as the rule's one exception; update the Version note lines.
- [P2] Ticks do not survive a reload (uncontrolled checkbox, no storage). Fix: sessionStorage keyed by slug and version (parked todo "struck rows persist").
- [P3] Ticked grams fall to 2.34:1 (Ink 3 at 0.6), ticked clay numerals 2.66:1, ticked body text 4.52:1. Call: does "done" text need 4.5? Fix: dim to 0.7 or leave the grams undimmed.
- [P3] At 320 "Fork this recipe" wraps to two lines inside its pill (~137px). Fix: nowrap with a tighter pad, or "Fork" below 360.

## Cognitive load, personas, minor

7 of 8 pass; the fail is working memory on a phone: the Method tab hides quantities (the known cost of the tab decision, recorded not pushed). Phone cook: 45px rows, ticks lost on reload, no wake lock (feature gap), tab bar pins at 48. First-timer: "1 fork" plain text; "3 versions ▾" the only hint of version control; a shared ?version=2 link shows a different title and only "Older version" says it is the same recipe; logged out, Fork leads to login unexplained. Peak-end: the peak is the hero and the clay fill on ticking; the end is flat, 150px of paper after the last step with no closing line or next action. Minor: the handle Tabs twice in sequence (navbar then byline); the dal (no bar) spaces actions 32px above the eyebrow against 26+26 around the bar; the chevron rotates 0.15s with no reduced-motion guard; ingredient rows at 1.5 while DESIGN.md Body says 1.65; the method tick has no translate-y like the ingredient tick (sits acceptably).

Questions: on an older version, controls back to the right with only "Older version" leading (rec yes); ticks in sessionStorage per recipe and version (rec yes); should the end of the page carry a fork or compare prompt, or is a quiet stop the intent?

Skipped: overlay; the dal's bar and photo hero (one version, no photo); logged-out Tab walk; long-method layout on its own; dark mode. Screenshots: scratchpad/wave2/recipe/A and B.
