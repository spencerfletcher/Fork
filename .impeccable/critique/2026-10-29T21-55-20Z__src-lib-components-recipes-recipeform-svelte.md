---
target_identity: "file:/Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte"
target_fingerprint: "sha256:6e267f969dae94421f6521b00b9d680ab7f51442fb445bcc66e9e16be322d4b3"
target_path: /Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte
timestamp: 2026-10-29T21-55-20Z
slug: src-lib-components-recipes-recipeform-svelte
---
---
target: recipe editor, final run
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Recipe editor, final sweep (29 October 2026, third run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped, shared server). Targets: RecipeForm, TagInput, IngredientEditor, StepEditor, /recipes/new, /recipes/[slug]/edit. Trend 24 → 30 → 31/40. Tree at b511c97. Nothing saved: Save pressed only with the title empty, a capture-phase blocker counted 0 submits.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The outcome line is right for settings only, settings plus message, and content edits; it shows nothing when only a message is typed |
| 2 | Match system / real world | 3 | tip:/warning:/substitution: are developer idiom; "Prep time must be at least 0" under "Prep (min)" |
| 3 | User control and freedom | 3 | Leave guard, Cancel and Escape work; a photo removal is undone only by Cancel |
| 4 | Consistency and standards | 3 | Photo button matches Cancel; the public checkbox is browser blue, the one off-palette colour |
| 5 | Error prevention | 3 | A message typed with no other change is dropped silently (server returns unchanged and redirects) |
| 6 | Recognition over recall | 3 | The steps hint disappears on the first keystroke; an empty invalid steps field shows the error instead of the hint |
| 7 | Flexibility and efficiency | 3 | Title not focused when New opens |
| 8 | Aesthetic and minimalist design | 3 | Blue checkbox; ~130px gap at the foot of the left column on New at 1280 |
| 9 | Error recovery | 4 | No bubble, focus to #title, each error a role=alert in the server's wording, aria-invalid and aria-describedby |
| 10 | Help and documentation | 3 | Hints teach only while a field is empty |
| Total | | 31/40 | Good |

## Evidence (B)

Detector: 2, both ramp false positives (RecipeForm 447 at 0.9375rem, TagInput 247 at 0.875rem). Logged out both pages 303 to /login. Console clean on load, typing every field, choosing a PNG, clearing and blurring the title, pressing Save, at all four widths. CLS peak 0.000025, no overflow. Photo control: "Choose photo" on new, "Replace photo" on edit and after choosing, 41px (121.8/124.9 wide), native input 1×1 tabIndex 0 in the Tab order, Source Sans 3 500 15px ink like Cancel, 2px clay ring on the button. Blocked save: invalid event defaultPrevented, no bubble, focus #title, URL unchanged. Invalid title: aria-invalid, aria-describedby title-error "Title is required" role=alert, border 1px rgb(163,54,43), fill rgb(246,227,224), error text 6.09, border 5.44 on the fill. Tags: options tabIndex -1, ArrowDown+Enter adds (0→1 new, 3→4 edit), Escape keeps focus on tag-combobox and closes. Asterisk aria-hidden, #6f6960. Checkbox name "Make this recipe public applies to every version", no dot. Back link 31.1 / 45.1. Every input labelled. Contrast lowest 4.91 (labels, marks, note, steps hint), placeholder 5.35. Tab order: back (edit), Title, Description, Remove photo (edit), photo, Serves/Prep/Cook, tag removers, tags, public, Ingredients, Steps, What changed?, Save, Cancel; 2px outline on every stop. Inputs 40.8 at 1280, 45.6 at 390. Widths 1200 (483.3 + 676.7), 976 (390 + 546), one column 720 and 354. Save 116.8 ("Create recipe") / 112 ("Save") / 269.5 at 390; Cancel 76.5. Leave guard confirm "Leave without saving? Your changes will be lost." on a nav click with real edits; beforeunload on reload. Titles "New Recipe — Fork", "Edit Thick and Chewy Chocolate Chip Cookies — Fork". Outcome line measured at 1280 and 390: public toggle alone "saves settings only"; toggle plus message "saves as v4"; title edit "saves as v4".

## Priority issues

- [P2] A message typed with nothing else changed vanishes: serialise() sets commitMessage '' (RecipeForm.svelte:60-63) so the form is not dirty, the header stays "Editing v3", a nav click leaves with no confirm, and on Save the server returns 'unchanged' (edit/+page.server.ts:118) and redirects. Fix: the outcome line says "nothing to save" when only the message is filled (A and B agree; decision: Spencer's ruling covered settings plus message, not message alone).
- [P2] The tags menu opens where it cannot be seen: on a phone tapping the tag box on edit puts the menu's top at 848 in an 844 viewport; at 1280 scrolled to the top it runs 819–1021 in 900, 121 of 202px cut. Fix: scroll the listbox into view on open (handleKeydown already does for the active option).
- [P2] The public checkbox is native blue (accent-color auto), 13px, and its row is 23.1px tall at every width: under 24 at 1280 and 44 at 390. Fix: accent-color var(--color-accent), pad the row to 44 below 699.
- [P3] The photo button is 41px at 390, under 44 (as specified; Cancel beside it is 48.8).
- [P3] The steps hint disappears while still needed and nothing says numbered lines split on save. Fix: keep the one-line hint, error above it.
- [P3] Number error copy: "must be at least 0" → "can't be negative"; "must be a whole number" → "of minutes".
- [P3] The file input's name doubles ("Photo Replace photo"): both the for-label and the wrapping label name it.
- [P3] Photo remover 28×28 at 1280/1024/768 (44 at 390).
- [P3] Mixed case: h1 and title in Title Case, buttons and nav in sentence case.

## Cognitive load, type, personas

1 of 8 fail: working memory (hint and placeholder vanish once typed; the outcome line is out of view when Save is, 91px above at 1280 and 1473px on a phone, closed by decision). 12 combinations, 3 faces, all on the scale; mergeable: "optional" into the label style, the checkbox note into the label text. Stock marks left: the blue checkbox and the dark × circle. Laptop transcriber: title not focused; tip: syntax must be remembered from step 2; nothing shows how numbered lines split; unscaleable lines flagged live with an SR status. Phone typo fix: 2462px page, Save at ~2366; tag box seems to do nothing; checkbox row 23; inputs 46 at 16px, no zoom, Save 269×49.

Minor: "WHAT CHANGED? optional" is the only optional marker; the checkbox note's typed middle dot against the CSS-dot rule (written for cards); invalid ingredient and step placeholders sit on the pink fill and read like content; tag removers 16 at desktop (decided).

Questions: "nothing to save" for a message alone (rec yes); checkbox clay like the strike squares (rec) or ink; steps hint always visible with the error above (rec yes). Not verified: marker stripping (only on save; unit tests pin it).

Skipped: overlay; Tab order at 1024 and 768; the message-only save (read from code). Screenshots: scratchpad/wave2/editor/A and B.
