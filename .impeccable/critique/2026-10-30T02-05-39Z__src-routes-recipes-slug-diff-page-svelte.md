---
target: compare page, sweep 5
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte"
target_fingerprint: "sha256:f872ca92d55bc52e418cb9b186ccd5db719d9d6d829360501ff1e88c07a42ce1"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte
timestamp: 2026-10-30T02-05-39Z
slug: src-routes-recipes-slug-diff-page-svelte
---
# Compare page, sweep 5 (29 October 2026)

⚠️ DEGRADED: single-context (run as a read-only subagent brief; A and B in one context, A written before the detector ran). Tree 27b7283. Signed out at 390/768/1280. Trend 23 → 30 → 30 → 30 → 31 → 31/40. Questions skipped: subagent run, no question tool; the open questions go back to the caller.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | Title, URL, pickers and focus agree on every change; the reversed pair still swaps silently |
| 2 | Match system / real world | 3 | ~, strike and underline have no key; the 400 now names v9 but not the range that exists |
| 3 | User control and freedom | 3 | No swap, no step to the next pair |
| 4 | Consistency and standards | 3 | Gutter 600 and the To chip's forced-colours box fixed; the compare 400 title does not balance as the root error page's does; 22/26px margins still off the 8px rhythm |
| 5 | Error prevention | 3 | Each picker offers the other side's version (3 → 2 lands on a swap; 3 → 3 on the same-version note) |
| 6 | Recognition over recall | 4 | The list always carries the full messages; the closed box clips mid-word ("v3 · Chill th" at 390, "Chill the dough a" at 1280) |
| 7 | Flexibility and efficiency | 2 | Every change is a navigation |
| 8 | Aesthetic and minimalist design | 3 | The generic h1 outranks the content; the 400 h1 orphans "found" at 1280 and 390 |
| 9 | Error recovery | 3 | The 400 names v9 now, but its lede still asks to pick on a page with no picker and never says v1–v3 exist |
| 10 | Help and documentation | 3 | Readers get "Changed:", "to", "added:"; sighted readers no legend |
| Total | | 31/40 | Good |

## Previous items

- [P2] 400 names the wrong thing: **partly fixed**. The h1 is "Error 400 – Version 9 not found" (title "Version 9 not found — Fork"), 2 lines at 1280 (was 3, 138px → 92px), 1 at 768. Still open: the lede "Pick two of the recipe's versions to compare." on a page with no picker, and no range.
- [P3] To chip has no box in forced colours: **fixed**. Outline 1px solid (system colour) at 390 and 1280; visible as a box in the screenshot; off on :focus-visible, so the 2px clay ring draws on both chips (verified at all three widths).
- [P3] Synthesised 700 gutter: **fixed**. .diff-gutter computes 600.
- [P3] Reversed pair swaps silently: **still open**. From 3, picking To = 2 lands on ?from=2&to=3 with focus on To, which now shows 3, not the 2 just picked.
- [P3] Vertical rhythm 8 / 8 / 22 / 26: **still open**, measured unchanged at 1280 (back → h1 8, h1 → pickers 8, pickers → cards 22, cards → Details 26).
- [P3] Insertion leading ", ", case-sensitive "Cool", unnamed card articles: **still open** (source unchanged).
- Picker slack (16.79 vs 16.81): **moot**. The label swap is gone; the box is a fixed calc(24ch + 22px) = 224px at ≥700 and full width on a phone (164px each at 390); the long label clips at the box edge cleanly in Chromium, no ellipsis, no overflow.

## Evidence

Detector: 7 advisories, all false positives (font-size 0.875rem ×6, 1.125rem ×1 "off the ramp"; DESIGN.md lists both; the design.json sidecar is stale). Browser (Chromium, Playwright): overflow 0 at every width and page, including a 180-char commit message with an unbroken run injected into the To card and the To option (the card breaks it, the select stays 224px / 164px). Console empty except the 400's own status. Titles right; 3→2 redirects to 2→3. Options: v1 · Initial recipe / v2 · Increased vanilla to 2 tsp, added pinch of espresso powder / v3 · Chill the dough … smaller batch, in every picker at every width. Keyboard: Tab reaches From (2px clay ring); a change navigates to ?from=1&to=3 and focus stays on the From select with :focus-visible. Forced colours: chip box, caret (CanvasText), del/ins strike and underline all survive; the marigold fill goes as intended. Reduced motion: 0 elements with a transition. Five-second read: 1280 6 of 8 changed rows above the fold, 768 5, 390 4 (Details on the first screen). Headless Chromium's ArrowUp on a closed select did not change the value (macOS opens the popup); the native popup itself is not captured.

## Priority issues

- [P2] The compare 400 title orphans "found" ("Error 400 – Version 9 not / found" at 1280 and 390). The root error page balances its title (src/routes/+error.svelte:49 `text-wrap: balance`); the compare one does not (src/routes/recipes/[slug]/diff/+error.svelte:17, computed text-wrap-style auto). DESIGN.md says "The error title balances its lines." Fix: `text-wrap: balance` on that h1.
- [P2] The 400 lede asks to pick on a page with no picker and does not say what exists (+error.svelte:22). Fix: for a named version, "It has v1 to v3." (needs the count from the loader; the generic line stays for "abc").
- [P3, carried] Reversed pair swaps silently (+page.svelte:29-33 / +page.server.ts:53). Fix: swap locally before the goto and focus the picker that now holds the picked value.
- [P3, carried] Vertical rhythm 8 / 8 / 22 / 26 (+page.svelte:110, 129, 174). Fix: 16 / 24 / 24.
- [P3, carried] No key for ~, strike and underline for sighted readers.

## Cognitive load, type, colour, personas

Unchanged from the final run: 1 fail (the To picker sits far from the To card at 1280), 2 marginal (generic h1 largest; no key). Cook: the sugar swaps sit just below the phone fold; the phone pickers read "v2 · Increase" and "v3 · Chill th", so the closed boxes say only the number on a phone. Author: the reversed swap, the chopped "Cool" sentence.

Minor: same-version shows two identical cards with the note above the pickers; the 400's two phone buttons stack at different widths (188 and 148); the closed desktop To label ends on a lone "a".

Questions: balance the 400 title (rec yes, one line); the 400 lede naming the range (rec yes); a swap button or local swap on reversal (rec local swap, no new control).

Skipped: overlay injection, Firefox/WebKit, real screen readers, the native popup, signed-in owner views. Screenshots and walk.json: scratchpad wave5/compare.
