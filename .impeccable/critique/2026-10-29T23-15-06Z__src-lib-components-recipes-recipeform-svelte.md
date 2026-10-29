---
target_identity: "file:/Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte"
target_fingerprint: "sha256:5653090f4a9af288752999797bc43fada9f36f1998d93dd34c7f5cac80d54632"
target_path: /Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte
timestamp: 2026-10-29T23-15-06Z
slug: src-lib-components-recipes-recipeform-svelte
---
---
target: recipe editor, wave 3
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Recipe editor, wave 3 (29 October 2026, fourth run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped). Tree 61519d7. Trend 24 → 30 → 31 → 32/40. Both agents' owner walks ran after the 16:09 PT session regeneration; the first attempts bounced to /login. Nothing saved: capture-phase counters read 0 submits.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | With the title empty or a number invalid the outcome line drops to plain "Editing v3" with no hint the save is blocked |
| 2 | Match system / real world | 3 | tip:/warning:/substitution: still developer idiom; "Serves" label against "Servings" error |
| 3 | User control and freedom | 3 | Removing the photo is undone only by Cancel, which drops every other edit |
| 4 | Consistency and standards | 3 | Title Case h1 against sentence-case buttons |
| 5 | Error prevention | 4 | Message never dropped, leave guard, min attributes, fields locked while saving, stale-tab check |
| 6 | Recognition over recall | 3 | The ingredient format lives only in a placeholder, gone on the first keystroke and never shown on edit |
| 7 | Flexibility and efficiency | 3 | Focus starts on BODY when New opens |
| 8 | Aesthetic and minimalist design | 3 | ~190px of empty paper above Create on New at 1280; number errors wrap to 2–3 lines and push Tags down |
| 9 | Error recovery | 4 | Inline role=alert in the server's wording, aria-invalid, aria-describedby, focus to the named field |
| 10 | Help and documentation | 3 | The steps hint stays but is not in the textarea's aria-describedby |
| Total | | 32/40 | Good |

## Evidence (B)

Detector: 2 ramp false positives. All seven fixes verified live: "Editing v3 · saves as v4" after typing only a message, back link raises "Leave without saving? Your changes will be lost." (dismissed, URL kept); checkbox accent rgb(178,60,0), row 44.1 at 390, 21px below the tags box at both widths; hint stays, error 31px above it, every error role=alert with aria-invalid and describedby, error text 6.09, border 5.44; tags listbox scrolled into view on open (new 586–826 of 900, 589–829 of 844; edit 698–900 of 900, 643–844 of 844, flush with the edge); "Prep time can't be negative", "Cook time must be a whole number of minutes", cleared once fixed; file input named exactly "Choose photo"/"Replace photo". Logged out both pages 303 to /login, no return-to. Console clean, CLS 0.000061, no overflow, every input labelled, 2px rings on every stop (marigold in the bar, clay in the form), Tab order follows the card. Lowest contrast 4.91; placeholders 5.35. Inputs 40.8/45.6; Save and Cancel 48.8; back link 31.1/45.1; remover 28 at ≥768, 44 at 390. Widths 1200 (483.3 + 676.7), 976 (390 + 546), 720, 354. Save 116.8/112, 269.5 at 390; Cancel 76.5. Titles "New Recipe — Fork", "Edit Thick and Chewy Chocolate Chip Cookies — Fork". 11 text styles plus two × glyphs (Save 15/600 is its own style beside Cancel 15/500). One near-miss: B's first script matched the navbar's Log out button; its capture-phase listener cancelled the submit and the session survived.

## Priority issues

- [P2] The steps and ingredients guidance never reaches a screen reader: aria-describedby points at the error id only while there is an error (StepEditor.svelte:18, IngredientEditor.svelte:46). Fix: give the hint an id and always reference it, error first.
- [P2] The ingredient format is recall, not recognition: only a placeholder. Fix: a one-line persistent hint like the steps one ("One ingredient per line, quantity first: 2¼ cups flour").
- [P3] The number errors wrap in their 150px columns at 1280 (two lines each, Tags pushed ~54px) and 107px at 390 (Cook's takes 3–4 lines, 92px tall). Fix: errors span the row (grid-column 1 / -1) under the three boxes, keeping each describedby.
- [P3] A placeholder on an invalid field's pink fill is 4.39:1 (rgb(111,105,96) on rgb(246,227,224)); 5.35 on the normal fill.
- [P3] The checkbox row is 23.1px at 1280, 1024 and 768 (44.1 at 390); the photo × is 28px at ≥768; the photo button 41px at 390. Fix: a 24px row minimum everywhere, 44px rules under (pointer: coarse) too.
- [P3] Tabbing on from Cook opens the tags menu over the checkbox and Ingredients at 390 (Escape closes it); on edit the revealed menu sits flush with the bottom edge, so the iOS keyboard probably covers it (unverified).
- [P3] Removing the photo is undone only by Cancel; a "Keep photo" ghost after Remove.
- [P3] Title not focused on New (autofocus on #title, New only).

## Cognitive load, personas, minor

1 of 8 fail (working memory: the ingredient syntax; the outcome line far from Save is closed). Laptop transcriber: clicks into Title first; ingredient syntax found by error; new recipes default to public (product call); the page fits at 1280 (932 tall, Create at 835). Phone typo fix: edit page 2517 tall, Save at 2419.8 (54px lower than wave 2, the hint staying); boxes 45.6 at 16px, no zoom; Save 269.5×48.8. Minor: the invalid empty Steps placeholder on the pink fill reads like content; "Serves"/"Servings" mismatch; the PHOTO label opens the file dialog; IngredientEditor renders an empty .form-hint; "optional" the only optional marker; app.css .field-message and .required are dead rules overridden by the component.

Questions: new recipes public by default (rec keep, product call); "Keep photo" undo (rec yes); number-row errors spanning the row (rec yes); extend the 44px rows to pointer: coarse (rec yes).

Skipped: overlay; Tab order at 1024/768 as counts only. Screenshots: wave3/editor/A and B.
