---
target: recipe editor, end of day
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte"
target_fingerprint: "sha256:0059ce564801477a47e1d8a9228d4bf81a55ad109c14dcf015d346a01bcac773"
target_path: /Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte
timestamp: 2026-10-29T21-08-54Z
slug: src-lib-components-recipes-recipeform-svelte
---
# Recipe editor, end-of-day sweep (29 October 2026, second run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped). Target: RecipeForm, TagInput, IngredientEditor, StepEditor, the new and edit routes. Trend 24 → 30/40.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The outcome line is honest and live but scrolled away by the time Save is on screen (152 vs 1038 at 1280) |
| 2 | Match system / real world | 3 | tip:/warning:/substitution: prefixes are developer idiom |
| 3 | User control and freedom | 3 | Guard, Cancel, draft kept; a photo removal is undone only by Cancel |
| 4 | Consistency and standards | 3 | The file input is the one sans 45px box among mono 41px boxes; dotted and dashed lines undocumented; back link 23px |
| 5 | Error prevention | 3 | Inline validity on blur; a typed commit message is silently dropped on a settings-only save |
| 6 | Recognition over recall | 3 | The steps hint disappears after the first character |
| 7 | Flexibility and efficiency | 3 | Arrows and Enter in tags; no autofocus on Title |
| 8 | Aesthetic and minimalist design | 3 | The native "Choose File" box; a 186px hole bottom-left on New |
| 9 | Error recovery | 3 | Per-field messages and focus; the native bubble duplicates the inline message; blur errors not announced |
| 10 | Help and documentation | 3 | Hints teach both syntaxes only while empty |
| Total | | 30/40 | Good |

## Evidence

Detector: one ramp false positive. Logged out both pages 303 to login. Console clean while typing every field, choosing a file, clearing the title. No overflow, CLS 0. Tags options are not Tab stops; ArrowDown then Enter picks; the input is labelled. Invalid title: error tokens, "Title is required", aria-invalid and aria-describedby, cleared on the next keystroke. Header line "Editing v3 · saves as v4" when dirty. Editor 1200 wide (483 + 677, 40px gap), one column at 768. Single-line inputs all 40.8px (45.6 on a phone). Save 112px, Cancel 77. Titles "New Recipe — Fork", "Edit <title> — Fork".

## Priority issues

- [P2] A settings-only save drops the typed commit message silently (the action uses it only when a version is written). Fix: disable or hide the field when the outcome is settings only, or change its placeholder.
- [P2] The outcome is not where the hand is at Save. Cheapest: the button reads "Save as v4" or "Save settings" when dirty; Spencer's call since it touches the removed helper.
- [P2] The photo input breaks the editor's own rules: sans, 45px, dashed, "Choose File No file chosen" over an existing photo. Fix: hide the native input behind a 41px ghost "Choose photo" / "Replace photo".
- [P2] Two voices on a blocked submit: no novalidate and no preventDefault in oninvalidcapture, so Chrome's bubble repeats the inline message. Fix: preventDefault and focus the first invalid field.
- [P3] Field errors never announced (no live region); the ingredients status fires every keystroke; photo remover 32px on a phone; back link 23px; tag removers 16px at desktop (by decision; passes via spacing); Escape in the tags box blurs to body instead of keeping the input; the required asterisk is red at rest; "Prep (min)" vs "Prep time must"; a card numbered "1. 2. 3." keeps its numbers.

## Personas and questions

Laptop transcriber: no autofocus; the note-prefix hint vanishes when step 3 needs a tip:. Phone typo fixer: 2468px page, promise 2300px above Save, menu opens under the keyboard (real-device check). Questions: should Save state the outcome; should "What changed?" step aside when no version is written; does mono hold for steps on a phone at 34 characters per line.
