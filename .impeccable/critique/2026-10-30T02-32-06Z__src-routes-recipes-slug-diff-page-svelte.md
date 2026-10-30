---
target: compare page, sweep 6
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte"
target_fingerprint: "sha256:6876b279ad4325a79a7c2e39c9a7762796144701308dcd7e854760386feab398"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte
timestamp: 2026-10-30T02-32-06Z
slug: src-routes-recipes-slug-diff-page-svelte
---
# Compare page, sweep 6 (29 October 2026)

⚠️ DEGRADED: single-context (run as a read-only subagent brief; A and B in one context, A written before the detector ran). Tree 81b69ec. Signed out at 390/768/1280. Trend 23 → 30 → 30 → 30 → 31 → 31 → 31/40. Questions skipped: subagent run, no question tool; the open questions go back to the caller.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | A reversed pick now swaps the pickers in place and focus lands on the picker holding the picked version |
| 2 | Match system / real world | 3 | ~, strike and underline have no key; the 400 never says which versions exist |
| 3 | User control and freedom | 3 | No swap, no step to the next pair |
| 4 | Consistency and standards | 3 | The 400 h1 balances like the root error page; the 8 / 8 / 22 / 26 rhythm is still off the 8px scale |
| 5 | Error prevention | 3 | Each picker still offers the other side's version and the current one (3 → 3 lands on the same-version note) |
| 6 | Recognition over recall | 4 | List carries full messages; the closed box clips ("v2 · Increase" at 390, "Chill the dough a" at 1280) |
| 7 | Flexibility and efficiency | 2 | Every change is a navigation |
| 8 | Aesthetic and minimalist design | 3 | The generic "Compare Versions" h1 still outranks the content |
| 9 | Error recovery | 3 | The 400 lede asks to pick on a page with no picker and names no range |
| 10 | Help and documentation | 3 | Readers get "Changed:", "to", "added:"; sighted readers no legend |
| Total | | 31/40 | Good |

## Previous items

- [P2] 400 title orphans "found": **fixed**. "Error 400 – / Version 9 not found" on two balanced lines at 1280 (92px) and 390 (64px), one line at 768 (+error.svelte:49 `text-wrap: balance`).
- [P2] 400 lede asks to pick on a page with no picker, no range: **still open** (+error.svelte:22, unchanged).
- [P3] Reversed pair swaps silently: **fixed**. Verified with selectOption at 390/768/1280: 3,3 pick To=2 → ?from=2&to=3, From reads 2 and holds focus (:focus-visible); 1,2 pick From=3 → ?from=2&to=3, focus on To (3); 2,3 pick To=1 → ?from=1&to=2, focus on From (1). Titles match. No stale select value (+page.svelte:32-38).
- [P3] Vertical rhythm 8 / 8 / 22 / 26: **still open**, measured unchanged at 1280 (+page.svelte:121, 140, 185).
- [P3] Insertion leading ", ", case-sensitive "Cool", unnamed card articles: **still open** (step 5 still underlines ", reserving a handful…" including the comma).
- [P3] No key for ~, strike and underline: **still open**.
- To chip forced-colours box, 600 gutter: **held** (outline 1px solid system colour at 390 and 1280; caret CanvasText).

## Evidence

Detector: 7 advisories, all the same false positives as sweep 5 (0.875rem ×6 and 1.125rem ×1 "off the ramp"; DESIGN.md lists both). Browser (Chromium, Playwright): overflow 0 on every page and width, including a 180-char unbroken commit message injected into the To card and option. Statuses 200/200/200/400; console empty except the 400's own resource error. Chip focus rings: 2px clay at 2px offset on both chips, :focus-visible, at all three widths. Keyboard: Tab to From with the ring. Forced colours: chip box, caret, del/ins strike and underline survive. Reduced motion: 0 elements with a transition. Above the fold: 1280 6 of 8 changed rows, 768 5, 390 4. Not captured: the native select popup.

## Priority issues

- [P2] The 400 lede "Pick two of the recipe's versions to compare." (src/routes/recipes/[slug]/diff/+error.svelte:22) sits on a page with no picker and does not say what exists. Fix: pass the version count with the 400 and say "It has v1 to v3."; keep the generic line for "abc".
- [P3] Vertical rhythm 8 / 8 / 22 / 26 (+page.svelte:121, 140, 185). Fix: 16 / 24 / 24.
- [P3] Insertion includes its leading ", " (VersionDiff word diff). Fix: let the separator belong to the unchanged run.
- [P3] No key for ~, strike and underline for sighted readers.

## Cognitive load, type, colour, personas

Unchanged: 1 fail (the To picker sits far from the To card at 1280), 2 marginal (generic h1 largest; no key). Cook: the sugar swaps sit just below the phone fold; the phone pickers read "v2 · Increase" and "v3 · Chill th". Author: the reversed pick now reads right; the chopped "Cool" sentence remains.

Minor: same-version shows two identical cards; the 400's two phone buttons stack at different widths (188 and 148).

Questions: the 400 lede naming the range (rec yes); rhythm to 16/24/24 (rec yes); a sighted key for the diff marks (rec a one-line caption under Details, only if the owner wants it).

Skipped: overlay injection, Firefox/WebKit, real screen readers, the native popup, signed-in owner views. Screenshots and walk.json: scratchpad wave6/compare.
