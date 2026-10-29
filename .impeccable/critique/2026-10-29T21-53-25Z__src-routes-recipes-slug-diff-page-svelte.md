---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte"
target_fingerprint: "sha256:74e4bee90b3dc63d2e826c914373018aa05609d537dcc5723d6b0eb88860e004"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte
timestamp: 2026-10-29T21-53-25Z
slug: src-routes-recipes-slug-diff-page-svelte
---
---
target: compare page, final run
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Compare page, final sweep (29 October 2026, fourth run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped, shared server). Target: /recipes/[slug]/diff and VersionDiff. Trend 23 → 30 → 30/40 (flat: the e2696aa fixes landed, forced colours is the new regression). Tree at b511c97.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | Title, pickers, URL and focus agree; the reversed-pair redirect still swaps silently and focus lands on a picker showing the other value |
| 2 | Match system / real world | 3 | ~, strike and underline have no key; the error page shows a giant "400" |
| 3 | User control and freedom | 3 | No swap, no step to the previous or next pair |
| 4 | Consistency and standards | 3 | "Read v3" is the one version mark in sans; forced colours lose the caret and the To chip's fill |
| 5 | Error prevention | 3 | Each picker still offers the version on the other side |
| 6 | Recognition over recall | 3 | Closed "v2" leans on the card below (works); forced colours clip "v2 · Increased" again |
| 7 | Flexibility and efficiency | 2 | Every change is a full navigation through a select |
| 8 | Aesthetic and minimalist design | 3 | The one-character quantity change is the smallest mark on its row; same-version shows two identical cards |
| 9 | Error recovery | 3 | The 400 says "Pick two versions" but offers only "Back to the recipe" |
| 10 | Help and documentation | 3 | Readers get "Changed:", "to", "added:"; sighted readers get no legend |
| Total | | 30/40 | Good |

## Evidence (B)

Detector: 8 advisory, all known false positives (0.875rem ×5, 1.125rem, the +error 4rem/1.5rem); 0.9375rem no longer reported. Console clean (the 400 logs its own status). CLS 0.0000 at every width and state. No overflow. Column 1200/976/720/354; side by side at 1280 and 1024, stacked at 768 and 390. Tab order back, From, To, v2, author, v3, author, Read v3; 2px outline, 2px offset; the ring shows on the transparent-text select. Focus stays on the changed select. Heights ≥24 at 1280 (pickers 35, numbers 29.7, authors 26, Read 26.4, back 31.1) and ≥44 at 390 (pickers 46, back 45.1, authors 45.1, numbers 51.7 hit, Read 44, 400 button 48.8). Contrast all AA, lowest 4.91 (back link, unchanged rows), modified rows 16.14. Verified from e2696aa: closed pickers "v2 ▾"/"v3 ▾", named "From version"/"To version", options "v2 · message"; arrow aria-hidden mono 14; Method's left edge equals the To card's (652/652 at 1280, 524/524 at 1024); Details rows span the column; lone insertion reads "added:" (step 6: "Drop rounded tablespoons of added: chilled dough"); "removed:" pinned by VersionDiff.svelte.test.ts:235 (no lone deletion in the seed pairs); back link width equals its text (255.9); same-version title "v2 · same version · …" live too; redirect 3→2 lands on 2→3; 400 heading "Version not found in <recipe>", helper, "Back to the recipe"; Read v3 → the plain recipe URL. Logged out identical.

## Priority issues

- [P2] Forced colours: the face hides but keeps its 55.6px box and the select paints its own text: "v2 ·"/"v3 ·" at 1280, "v2 · Increased"/"v3 · Chill the" at 390, no caret. Fix (verified by injected CSS at both widths, focused and unfocused): select opacity 0 instead of color transparent, border on .picker, ring on .picker:focus-within, face stays visible in forced colours. forced-color-adjust: none did not hold at 390.
- [P2] The change a cook came for is the smallest mark on the row: a struck 14px ¾ beside an underlined ½ with one space between. Fix (taste): padding 0 2px on each del/ins so each has its own tinted box, or ingredient rows at 1rem.
- [P3] After the swap redirect, focus sits on a picker showing a value the user did not pick (To=v1 with From=v2 → ?from=1&to=2, focus on To reading v2). Known from run 3.
- [P3] The 400 asks the user to pick, then offers no picker. Fix: "Compare first and latest" → bare /diff (the loader defaults to first→latest), "Back to the recipe" secondary.
- [P3] On a phone "v2 ▾" sits at the left of a 164px box with ~120px empty: reads as a text field. Fix: caret at the right edge (space-between).
- [P3] Diff rows have no list semantics (plain divs, Method not an ol). Fix: role=list/listitem or an ol.
- [P3] Card link "v2" is 22px wide (passes 2.5.8 by spacing). Insertions still begin with ", " (word diff). Modified step numbers clay while the row is ink.
- Low, unverified: Chrome's tree keeps the number and its sr-only stop as separate runs ("5", "."); likely tool flattening, not tested with a real screen reader.

## Cognitive load, type, colour, personas

2 of 8 fail: fold (at 1280×900, 3 of 7 changed rows below the fold; 5 at 390; Read v3 at y=1080; the summary line stays closed), grouping (both pickers at x 40–184 above the From card, the To picker ~470px from the To card). 8 type combinations, 5 sizes (11/14/16/18/40); "Read v3" the only version mark not in mono. Marigold is the only fill; clay on six kinds of things (h1, usernames, From number, modified step numbers, Read v3); the 40px clay "Compare Versions" is the loudest and most generic thing on the page. Cook: the sea salt and the chill step sit below the 1280 fold and 2+ phone screens; servings 48→36 with sugar ¾→½ can mislead per cookie; the only action is at the bottom. Author: the redirect swaps their choice silently; same-version reachable in one click; steps matched by position (carried, not re-tested).

Minor: same-version shows two identical cards; To chip loses marigold in forced colours; option text uncapped (v3 is 100 chars, iOS sheet truncation unverified); pickers 56×35 under a 40px heading read as its subtitle. Headless Chromium cannot capture the native popup; the open-picker shot is a size=3 stand-in.

Questions: opacity-0 select with the box and ring on the wrapper (rec yes); per-pill padding (rec) or 1rem rows; the 400's main action "Compare first and latest".

Skipped: overlay; full matrix only for 2→3; 1→2; real screen readers. Screenshots: scratchpad/wave2/compare/A and B.
