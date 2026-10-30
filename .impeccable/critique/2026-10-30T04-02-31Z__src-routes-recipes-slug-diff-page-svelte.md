---
target: compare page, sweep 7
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte"
target_fingerprint: "sha256:c73ef84f2da8669352983b6b4318f47a317d0b8855941f8b53985f93cead80aa"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte
timestamp: 2026-10-30T04-02-31Z
slug: src-routes-recipes-slug-diff-page-svelte
---
# Compare page, sweep 7 (29 October 2026)

⚠️ DEGRADED: single-context (run as a read-only subagent brief; A and B in one context; detector overlay not re-injected). Tree 9014834. Signed out at 390/768/1280. Trend 23 → 30 → 30 → 30 → 31 → 31 → 31 → 32/40. Questions skipped: subagent run, no question tool; the open questions go back to the caller.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | Reversed pick swaps in place; focus lands on the picker holding the picked version (verified at all three widths) |
| 2 | Match system / real world | 3 | ~, strike and underline still have no sighted key |
| 3 | User control and freedom | 3 | No swap, no step to the next pair |
| 4 | Consistency and standards | 3 | Page rhythm now 16/24/24; VersionDiff's sections still sit 28px apart (1.75rem), off the scale |
| 5 | Error prevention | 3 | Each picker still offers the other side's version (3 → 3 lands on the same-version note) |
| 6 | Recognition over recall | 4 | Closed boxes still clip ("v2 · Increase", "v3 · Chill th" at 390; "Chill the dough a" at 1280) |
| 7 | Flexibility and efficiency | 2 | Every change is a navigation |
| 8 | Aesthetic and minimalist design | 3 | The generic "Compare Versions" h1 still outranks the content |
| 9 | Error recovery | 4 | The 400 names the range ("It has v1 to v3.") and offers first-to-latest and back |
| 10 | Help and documentation | 3 | Readers get "Changed:", "to", "added:"; sighted readers no legend |
| Total | | 32/40 | Good |

## Previous items

- [P2] 400 lede asks to pick, names no range: **fixed**. "It has v1 to v3." for ?from=1&to=9 and ?from=8&to=9 ("Versions 8 and 9 not found") at all widths (+error.svelte:21-22). "abc" keeps the generic "Pick two of the recipe's versions to compare." as intended.
- [P3] Vertical rhythm 8/8/22/26: **fixed**. Measured h1 → pickers 16, pickers → cards 24, cards → Details 24 at 390, 768 and 1280 (+page.svelte:121, 140, 185).
- [P3] Insertion carries its leading ", ": **still open**, and wider than recorded: diffWords also hands the trailing space to changed tokens, so the highlight runs past the word ("chilled ", cookies step 6; "and " struck in tikka masala step 1).
- [P3] Case-sensitive "Cool": **still open** (step 6 strikes "Cool" and inserts "…then cool").
- [P3] No key for ~, strike and underline: **still open**.
- To chip forced-colours box, focus rings: **held**. Both chips 2px clay ring at 2px offset; To chip boxed and caret painted under forced colours; del/ins keep strike and underline.
- Minor: the 400's phone buttons still stack at different widths (188 and 149).

## Evidence

Browser (Chromium, Playwright): overflow 0 on every page and width, and at 200% zoom (640 CSS px). Statuses 200/200/200(303 from 3,1)/400; console holds only the 400s' own resource errors. Reduced motion: global 0.01ms rule in app.css:1062 applies. Forced colours (dark): all text, borders, glyphs and marks survive; the + row loses its tint but keeps the glyph. Chicken tikka masala v1→v3 renders cleanly: the "and turmeric" → "turmeric, and smoked paprika" diff reads right. Seed note: two of four recipes have one version and 400 with the save-a-change lede. Detector not re-run this sweep (sweep 5–6 advisories were all false positives on 0.875rem/1.125rem). Not captured: the native select popup.

## Priority issues

- [P3] Word-diff boundaries: changed runs carry their separators, leading ", " and trailing spaces, so the green and red tints spill onto punctuation and blank space (src/lib/recipes/diff.ts:72, rendered by VersionDiff.svelte:124). Fix: move leading/trailing whitespace and a leading ", " from the changed segment into the neighbouring unchanged run.
- [P3] 400 lede "It has v1 to v3." (+error.svelte:22): after "Version 9 not found", "It" reads as the version. Fix: "This recipe has v1 to v3."
- [P3] VersionDiff .diff-section margin-bottom 1.75rem (VersionDiff.svelte:239) puts 28px between Details and Ingredients, under the page's new 24. Fix: 24px, checking the landing page sample too.
- [P3] No key for ~, strike and underline for sighted readers.
- [P3] Compare page keeps every unchanged row; on a phone v1→v3 of tikka masala shows 11 grey ingredient rows around 3 changes. The landing page's fold exists (fold prop); whether the compare page wants it is the owner's call.

## Cognitive load, type, colour, personas

Unchanged: 1 fail (the To picker sits far from the To card at 1280), 2 marginal (generic h1 largest; no key). Cook: changed sugar rows now just below the phone fold; long step 5 reads well at 56ch. Author: the 400 now tells them where the range ends.

Questions: fix the separator ownership in the word diff (rec yes); "This recipe has" (rec yes); fold unchanged runs on the phone compare page (rec no, unless the owner finds the tikka list long).

Skipped: overlay injection, Firefox/WebKit, real screen readers, the native popup, signed-in owner views. Screenshots and walk.json: scratchpad wave7/compare.
