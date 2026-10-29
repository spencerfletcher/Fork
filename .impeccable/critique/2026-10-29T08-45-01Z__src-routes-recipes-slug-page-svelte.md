---
target: recipe page after the version bar move
total_score: 20
max_score: 28
na_heuristics: 5,9,10
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:cb9f38f8bafa1ab6ffa6bfb38acfbe138bf76a22c05d6d0df7a8301ee723f648"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-29T08-45-01Z
slug: src-routes-recipes-slug-page-svelte
---
# Recipe page after the version bar move (29 October 2026, second sweep)

Method: dual-agent (A design review, B detector + browser overlay). Target: src/routes/recipes/[slug]/+page.svelte with RecipeHeader.svelte and the new VersionBar.svelte, master at 7f11022.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Older-version state is 14px grey mono in the bar; the pills vanish unexplained |
| 2 | Match system / real world | 3 | The note is plain English; "Compare with v2", "3 versions", "1 fork" are git words with no on-ramp |
| 3 | User control and freedom | 3 | Escape closes the list from anywhere and moves scroll to the toggle |
| 4 | Consistency and standards | 3 | DESIGN.md disagrees with itself on the bar's radius and padding |
| 5 | Error prevention | n/a | Read surface; Favorite rolls back |
| 6 | Recognition over recall | 2 | "Compare with v2" names a version the reader has not met; the phone note clamps at 30 characters |
| 7 | Flexibility and efficiency | 3 | Tabs switch in place; keyboard works end to end |
| 8 | Aesthetic and minimalist design | 3 | Header exemplary; the bar adds a box and two rules in 100px; 15/16/17px stair |
| 9 | Error recovery | n/a | Fork and Favorite alerts exist |
| 10 | Help and documentation | n/a | One hint, placed where needed |
| Total | | 20/28 | Good (5, 9, 10 n/a) |

## Design specificity

Specific. The header honours the decision to the pixel. The bar's idea (a mono note with a marigold chip on cookbook paper) is Fork's own; its delivery is a default 1px rounded card right after a header whose rule is "nothing boxed". The one-version page with no bar is the calmest in the set.

Deterministic scan: 13 advisories, 10 ramp false positives (0.875/0.9375/1.125rem are on the written ramp but not the YAML), 3 real on the diff page (2.125rem, 1.625rem, 3px radius). Overlay: nothing on the header or the bar in any state; Method line length about 103ch and the cream-palette false positive.

Measured: honoured at 1280 and 390; at 768 the older-version controls crush the note to 145px and the bar sits flush on the tab row. Three horizontal lines remain between the pills and the first ingredient (bar top, bar bottom, eyebrow underline). A 180-character note clamps and wraps cleanly at every width. 13 style combinations above the first ingredient. Contrast AA throughout.

## Working

- The header: one face, one metadata size, bold values, nothing boxed, nothing pinned.
- The bar's accessibility: region landmark, sr-only version sentence, aria-expanded, hidden list, focus return, close on navigate.
- The 390 composition: controls under the note with an indent that lines up, compare under each row.

## Priority issues

- [P1] Escape is window-wide: from the end of the method on a phone it jumps the page 640px to the toggle. Fix: ignore Escape unless focus is inside the bar.
- [P1] At 768 the older-version controls crush the note to 145px. Fix: wrap the controls under the note at 1023 and below.
- [P2] At 768 the bar sits flush on the tab row. Fix: 16px above the tabs in the 1023 block.
- [P2] "Compare with v2" on the closed line is the second-brightest link on the page and names a version the reader has not met. Options: closed shows only the toggle; or rename to say what it does.
- [P3] Phone hit areas in the bar are 30px for the toggle and compare links.
- [P3] Marigold twice within 42 to 75px: accepted by the system; if it nags, lose the box, not the chip.
- [P3] An orphaned separator ends "Back to v3 ·" when the older-version controls wrap at 390.

## Persona red flags

Messy-hands cook: 30px clay links between 44px pills and 44px tabs; the note clamps exactly where it becomes useful. First-time visitor: four git words above the ingredients; on a shared ?version=2 link the title differs from the one shared and the only history cue is grey mono in a box.

## Minor observations

DESIGN.md Shapes and Panels disagree with the Version note section on the bar's radius and padding. The sr-only "replaced" reads oddly aloud. Landmark name "Version" is thin. Both list compares read "Compare with v3". Measure dots are near-invisible but the bold values separate anyway.

## Questions to consider

- If the bar exists only when there is history, is the version the hinge, or a footnote in a hinge's seat? What would the line look like unboxed, as a caption under the photo?
- Who is the closed "Compare with v2" for?
- Should a stranger on ?version=2 learn it above the fold from anything other than grey mono?
