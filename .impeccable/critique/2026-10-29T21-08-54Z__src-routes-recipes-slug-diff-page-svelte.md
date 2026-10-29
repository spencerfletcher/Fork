---
target: compare page, end of day
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte"
target_fingerprint: "sha256:4fe059b5588185a63933fa9e0459a32d446b3f784414254d4afa23acd73231eb"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte
timestamp: 2026-10-29T21-08-54Z
slug: src-routes-recipes-slug-diff-page-svelte
---
# Compare page, end-of-day sweep (29 October 2026, third run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped). Target: src/routes/recipes/[slug]/diff and VersionDiff.svelte. Trend 23 → 30 → 30/40 (the old faults are fixed; what remains is flexibility and the picker/card overlap).

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | Title, pickers, URL and focus agree; after the swap redirect focus lands on a picker showing a value the user did not pick; no pending cue |
| 2 | Match system / real world | 3 | ~, strike and underline have no key |
| 3 | User control and freedom | 3 | Both versions reachable; no swap, no step |
| 4 | Consistency and standards | 3 | The 16px sans arrow; "Read v3" sets a version number in sans; the back link is a full-width block |
| 5 | Error prevention | 3 | Same version and reversed pairs handled after the fact |
| 6 | Recognition over recall | 3 | Closed selects cut off mid-word; the card rescues it |
| 7 | Flexibility and efficiency | 2 | Every change is a navigation through a select |
| 8 | Aesthetic and minimalist design | 3 | The message is printed twice within 60px; the Details band mostly empty at 1280; same-version shows two identical cards |
| 9 | Error recovery | 3 | The 400 says "pick two versions" with no picker in reach |
| 10 | Help and documentation | 3 | Screen readers get prefixes and "to"; no sighted legend |
| Total | | 30/40 | Good |

## Evidence

Detector: 7 ramp false positives, 2 inherited from the root error page. Console clean, no overflow, focus rings everywhere, focus stays on the changed select, CLS 0 at 390 (the 0.20 font shift is gone). Content column 1200/976/720/354; Ingredients beside Method from exactly 1024. Heights pass at 1280; at 390 everything reaches 44 except the card number links (29.7px). Contrast all AA; modified rows 16.14:1 against unchanged 4.91:1. A modified ingredient reads "Changed: deletion ¾ to insertion ½ cup granulated sugar"; a step reads "Changed: 5. Gradually stir". Titles "v2 → v3 · <recipe> — Fork" and "Version not found in <recipe> — Fork". 9 style combinations, 5 sizes.

## Priority issues

- [P2] Pure insertions or deletions inside a modified row are silent to most screen readers (only replacements get "to"). Fix: an unseen "added:"/"removed:" in the segments snippet.
- [P2] The back link is a 1200px-wide click target (display: block, site-wide). Fix: width: fit-content in app.css.
- [P2] The pickers repeat the cards and clip mid-word. Fix: cut option text to about 30 characters plus an ellipsis server-side, or options as "v2 · 27 Feb 2026" (taste).
- [P3] The Details title wraps beside 590px of empty panel (72ch cap on meta rows). Card number links 22x30 on a phone (pass only by spacing) and the To chip does not look like a link. The arrow is sans and not aria-hidden. "v2 → v2" tab title on the same-version state. Underlined insertions begin with a comma and a space (word-level diff). Modified step numbers are clay while the row is ink (not named in the ruling; taste). The 400 could link to a valid default compare.

## Personas and questions

Cook deciding: the added sea salt and step 6 sit below the 1280x900 fold with nothing saying so; whole-batch quantities can mislead when servings also change. Author: steps matched by position; after the swap redirect, focus is on a picker they did not set. Questions: should the closed pickers stop repeating the card; should lone insertions get "added:"; should Details take one column or drop its cap.
