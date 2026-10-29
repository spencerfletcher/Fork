---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte"
target_fingerprint: "sha256:6bafdf8e25d08a8ba877cf04280d0bb11dfdc7a59127ef26ab8864950fcc3f60"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte
timestamp: 2026-10-29T23-12-32Z
slug: src-routes-recipes-slug-diff-page-svelte
---
---
target: compare page, wave 3
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Compare page, wave 3 (29 October 2026, fifth run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped, shared server). Tree 61519d7 (B's walk ran while HEAD moved to ae5370d; the compare files did not change). Trend 23 → 30 → 30 → 30/40: the previous P2s closed (select-only picker, forced colours, the 400, list semantics), new findings surfaced. Owner checks before 16:09 PT ran logged out (the shared session had been revoked); re-run authenticated at 1280 and 390 after, the body identical, no owner-only UI.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | Title, URL, pickers and focus agree; the reversed pair still swaps silently |
| 2 | Match system / real world | 3 | ~, strike and underline have no key; the 400 leads with a 4rem code |
| 3 | User control and freedom | 3 | No swap, no step to the next pair; the 400 now has a way forward and back |
| 4 | Consistency and standards | 3 | Forced colours drop the To chip's fill; "Read v3" the one sans version mark |
| 5 | Error prevention | 3 | Each picker offers the other side's version |
| 6 | Recognition over recall | 3 | On a phone the open face reads "v2 · Increase ▾" cut mid-word; a plain ArrowDown on a Mac opens the list without the messages |
| 7 | Flexibility and efficiency | 2 | Every change is a full navigation |
| 8 | Aesthetic and minimalist design | 3 | Same-version shows two identical cards; the generic h1 is the loudest element |
| 9 | Error recovery | 3 | The 400 offers the pair but names neither v9 nor the range that exists |
| 10 | Help and documentation | 3 | Readers get "Changed:", "to", "added:"; sighted readers no legend |
| Total | | 30/40 | Good |

## Evidence (B)

Detector: 9 advisory, all known. Verified: no face span; options "v1|v2|v3" closed, focus leaves them short, pointerdown/Enter/Space lengthen, blur/Escape restore; the select stays 55.6px wide while open; forced colours at 1280 and 390 paint text and caret, ring in system colour; caret 11px from the right edge at every width; comboboxes "From version"/"To version"; panels role=list named by heading with 3/11/6 items on 1→3; no fold on compare (20 rows visible); DOM and tree text as before; the 400 primary "Compare first and latest" → bare /diff → 1→3, ghost "Back to the recipe", both 48.8px; titles and the 3→2 redirect right; console empty, CLS 0, no overflow; column 1200/976/720/354, panels side by side at 1280 and 1024; Tab order with a 2px ring on the select itself; focus stays on the changed select; heights ≥24 at 1280 and ≥44 at 390; contrast all AA, lowest 4.91. Desktop five-second read: 6 of 8 changed rows above the 1280×900 fold; phone: the first change 27px below the fold, Method changes at 1522 and 1729, Read v3 at 1964 (follows closed decisions).

## Priority issues

- [P2] The compare cards override the username size rule: `.version-card__head :global(.username) { font-size: inherit }` beats Username's 0.9375em (14 in 14, ratio 1.0 at every width). Fix: drop the override.
- [P2] On a phone the open picker face shows the long label cut mid-word ("v2 · Increase ▾"; iOS keeps the face visible while the wheel is up), and a list dismissed without a change keeps the long label until blur (measured by dispatching pointerdown: "v2 · Increase" against the caret at 390; at 1280 the ch box clips it to "v2"). Fix: keep the select at its ch width on a phone too and put the full-width box, border and caret on .picker, so the face clips to "v2" as it does at 1280.
- [P2] On a Mac a plain ArrowUp/ArrowDown opens the list, but opensList matches only Space, Enter and Alt+ArrowDown, so the list opens with short labels (inferred: ArrowDown left the URL, value and labels unchanged). Fix: add the arrows to opensList; on Windows, where arrows change the value, onchange resets the labels in the same tick.
- [P2] Forced colours turn the 400's primary into plain text: `.btn-primary` has `border: none` (app.css), so the fill goes and no box remains while the ghost keeps its border; site-wide. Fix: `border: 1px solid transparent`, padding 11px 16px.
- [P3] Forced colours hide the To chip's fill; `border: 1px solid transparent` on the To number keeps a box.
- [P3, carried] The reversed-pair redirect swaps the choice silently (focus on To showing v2 after picking v1); swap before the goto and focus the picker holding the picked value.
- [P3, carried] Insertions begin with ", "; same-version shows two identical cards; "Read v3" in sans; the 400 names neither v9 nor the range; the 4rem code is its loudest element; the step number and its sr-only stop are separate tree runs (unverified with a real reader); forced colours at 1280 leave the select's text exactly its width (no slack for "v10", --label-chars probably scales).

## Cognitive load, type, colour, personas

1 fail (grouping: both pickers at x 40–184, the To picker ~520px from the To card), 1 marginal on a phone (the first screen is metadata; the generic h1 outranks the changes). 8 combinations at 1280, 9 at 390 (pickers and arrow go to mono 16 so iOS does not zoom), 5 sizes. Four fills: lifted paper, marigold, the two tints; clay on the h1, usernames, From number, modified step numbers, Read v3. Cook: changes start after a scroll on a phone; batch quantities can mislead per cookie. Author: step 6's word diff pairs a struck "Cool" with the new sentence because the diff is case-sensitive ("Cool to Sprinkle … then cool"); the reversed-pair swap is silent.

Questions: delete the label swap entirely and let the ch-width face clip everywhere, box on the wrapper (closes the phone and Mac issues; a closed picker would then read the full label to screen readers; Firefox/Safari clipping unverified, try them first); the 400 naming the version and range and dropping the big code (rec yes, integer input only); the `.btn-primary` forced-colours border site-wide now (rec yes, one line).

Skipped: overlay; real screen readers and devices; the native popup (size=3 stand-in); owner at 1024/768 after 16:09; full matrix for 1→3, 3→2, bare. Screenshots: wave3/compare/A and B.
