---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte"
target_fingerprint: "sha256:fc29fff9f447e72acf16c29222e37a427906c026f367c1f63fb8d66739f618e8"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte
timestamp: 2026-10-29T23-53-16Z
slug: src-routes-recipes-slug-diff-page-svelte
---
---
target: compare page, final run
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Compare page, final run of the design phase (29 October 2026, sixth run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped). Tree 61dd3ab. Trend 23 → 30 → 30 → 30 → 31/40. Owner session held. No P0–P2 in the walk; the review's one P2 is copy.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | Title, URL, pickers and focus agree; a reversed pair still swaps silently |
| 2 | Match system / real world | 3 | ~, strike and underline have no key; the 400 h1 names the recipe, not the version that is wrong |
| 3 | User control and freedom | 3 | No swap, no step to the next pair |
| 4 | Consistency and standards | 3 | Forced colours drop the To chip's box; the gutter is a synthesised 700; 22 and 26px margins off the 8px rhythm |
| 5 | Error prevention | 3 | Each picker offers the other side's version |
| 6 | Recognition over recall | 4 | The open list carries the messages; the phone face is fixed; a Mac's plain ArrowDown still opens with short labels (code, unverified) |
| 7 | Flexibility and efficiency | 2 | Every change is a navigation |
| 8 | Aesthetic and minimalist design | 3 | The generic h1 outranks the content; the 400 h1 is three lines at 1280 |
| 9 | Error recovery | 3 | The 400 names neither v9 nor the range; its lede asks to pick on a page with no picker |
| 10 | Help and documentation | 3 | Readers get "Changed:", "to", "added:"; sighted readers no legend |
| Total | | 31/40 | Good |

## Evidence (B)

Detector: 7 advisories, all known. Verified: card username 13.125 in 14 (0.9375) at every width, phone hit 44.0; the 400 h1 "Error 400 – Version not found in …" at 40/37.6/33/28, centred, primary → bare /diff, ghost → recipe, both 48.8, title "Version not found in … — Fork"; open picker at 390 after pointerdown: options long, text area 2ch (19.20 at 390, 16.79 at 1280), the face "v2" with the caret 11px from the edge, the select full width; no 4rem in either error page; forced colours .btn-primary and the ghost both 1px solid boxes. Clean at four widths for every page: CLS 0, overflow 0, console empty (the 400's own status); columns 1200/976/720/354, panels 588+588 and 476+476; titles and the 3→2 redirect right; nothing under 24 at ≥768, at 390 only the card number box (29.7, hit 50.7); contrast all AA, lowest 4.91; Tab order right, rings 2px/2px; focus stays on the changed select; panels role=list 3/11/6. Five-second read: desktop yes (6 of 8 changed rows above the fold); phone nearly (the Details changes on the first screen, ingredient changes 27px below the fold).

## Priority issues

- [P2] The 400 h1 names the wrong thing ("Version not found in Thick and Chewy Chocolate Chip Cookies" wraps to three lines, 138px at 1280) and its lede asks to pick on a page with no picker; it never says v9 is the problem or that v1–v3 exist. Fix: for integer input throw "No v9 in this recipe" with the range and a lede "It has v1 to v3." (keep the generic message for "1.5" and "abc", as the loader's comment says).
- [P3, carried] The To chip has no box in forced colours (v3 looks like v2). Fix: `border: 1px solid transparent` on the To number, padding taken back.
- [P3] The diff gutter is a synthesised 700 (only Mono 400 and 600 load). Fix: 600 on .diff-gutter (also the landing sample).
- [P3, carried] The reversed pair swaps silently; swap locally before the goto and focus the picker holding the picked value.
- [P3] Vertical rhythm: back link → h1 8, h1 → pickers 8, pickers → cards 22, cards → Details 26; the pickers read as a subtitle. Fix: 16 / 24 / 24.
- [P3, carried] Insertions start with ", "; the case-sensitive word diff strikes "Cool" against "then cool"; the step number and its stop are separate tree runs; the two cards are unnamed articles with nothing saying which is From; zero slack in the closed desktop picker (16.79 vs 16.81, scales with --label-chars).

## Cognitive load, type, colour, personas

1 fail (grouping: the To picker 524px from the To card), 2 marginal (the generic h1 is the largest element; no key for the marks). 9 combinations at 1280, 10 at 390; 6 sizes (11, 13.125, 14, 16, 18, 40): the username notch adds a size off the written ramp, which DESIGN.md should name as the sanctioned exception (13 vs 13.125 is invisible). Fills: lifted paper, marigold, the two tints; clay on the h1, usernames, From number, modified step numbers, Read v3. Cook: the sugar swaps just below the phone fold; batch quantities can mislead per cookie; the v3 chip is the only way to the version from the top and reads as a badge. Author: the chopped "Cool" sentence; the reversed swap.

Minor: same-version shows two identical cards; site-wide h1 casing is mixed ("Create an Account", "Welcome Back" against "Reset password", "Link expired"); at 768 "Favorites" and the handle in the navbar sit 7px apart; in forced colours "+ New recipe" has no box; the mobile 400's two buttons stack at different widths (188 and 148).

Questions: the 400 naming the version and range and dropping the recipe title from the h1 (rec yes, integer input only); each card's number as its own picker (rec no for now); DESIGN.md naming the username notch as the one off-ramp size (rec yes).

Skipped: overlay; real screen readers and devices; the native popup; Firefox (its Playwright build will not start in the sandbox); owner at 768 beyond 2→3 and at 1024 (review); forced colours on 2→3 and the 400 only (walk). Screenshots: wave4/compare/A and B.
