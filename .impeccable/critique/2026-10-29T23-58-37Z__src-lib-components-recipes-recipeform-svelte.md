---
target_identity: "file:/Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte"
target_fingerprint: "sha256:b0005858d6316f64568995774ff6c0e224b4416ebe02c03b34e9cc3372c139ef"
target_path: /Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte
timestamp: 2026-10-29T23-58-37Z
slug: src-lib-components-recipes-recipeform-svelte
---
---
target: recipe editor, final run
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Recipe editor, final run of the design phase (29 October 2026, fifth run)

Method: dual-agent; overlay skipped. Tree 61dd3ab. Trend 24 → 30 → 31 → 32 → 32/40 (H3 and the screen-reader half of H10 up; H9 down one on a fresh finding). 0 submits, 0 blocked requests; coarse-pointer run at 768.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | An edit plus an invalid number shows plain "Editing v3", reading as nothing changed |
| 2 | Match system / real world | 3 | "Serves" label against "Servings must be at least 1"; tip:/warning: idiom |
| 3 | User control and freedom | 4 | Keep photo, Escape, the leave guard |
| 4 | Consistency and standards | 3 | Tag × 16px at desktop and under a coarse pointer at 768; Title Case h1 vs sentence-case buttons |
| 5 | Error prevention | 4 | |
| 6 | Recognition rather than recall | 3 | The ingredient format lives only in a placeholder on New |
| 7 | Flexibility and efficiency | 3 | Focus starts on BODY on New (10 Tabs to Title) |
| 8 | Aesthetic and minimalist design | 3 | ~200px of empty paper above Create on New at 1280 |
| 9 | Error recovery | 3 | "Title is required" fires on blur of a never-typed field |
| 10 | Help and documentation | 3 | The can't-scale note says what, not how |
| Total | | 32/40 | Good |

Evidence (B): detector 2 known. Verified: steps describedby "steps-hint" / "steps-error steps-hint"; the ingredients note's describedby only when shown, no empty hints; number errors one 23px line at row width (483.3, 354), field order, aria wired; Remove → Keep photo focused and removeImage set, Keep → preview back and Remove focused, keyboard path the same; checkbox row 24 at ≥768, 44 at 390 and under touch; remover 28 / 44 touch; invalid placeholder Ink 2 (7.76); tag list flush (top = input bottom), no top border, corners 6/6/0/0 and 0/0/8/8, one ring, no nub, closed as before. Console clean, CLS ≤0.0000017, no overflow, no broken aria refs, Tab order right with rings, contrast lowest 4.91, inputs 40.8/45.6, Save and Cancel 48.8, widths 1200/976/720/354.

Priority issues: [P2] required fields go red on pass-through (validate() on focusout reports valueMissing for an untouched field: click Title, click Description → "Title is required"); report valueMissing only once edited or after a blocked submit. [P3] The outcome line goes silent when the save is blocked ("fix 1 field to save"). [P3] The tag-pill × misses the target rule (16×16 at 1280 and coarse 768): (pointer: coarse) in TagInput's query and a 24px desktop hit. [P3] The joined combobox doubles its edge where Create meets the box or the last suggestion (a 2px seam): one border-t on every option but the first. [P3] The invalid placeholder overshoots to near-body grey beside red typed text (Ink 2 at 7.76; one step above 4.39 was enough). [P3] The photo ghost buttons stay 41px at 390 and under touch. [P3] The open tag list sits flush with the viewport bottom (899.9 of 900), its ring and corners cut: scrollIntoView ignores the outline. [P3] Ingredient format is recall on New: end the note with "Put the quantity first, like 2 cups flour."

Cognitive load 1/8 fail (working memory: the ingredient syntax). 12 text styles plus two × glyphs; two Ink 3 asides could fold. Personas: laptop transcriber (page fits; focus on BODY; Title turns red on pass-through; "flour, 2 cups" gets only "can't be scaled"); phone typo fix (Save at 2412.7 of 2509; boxes 16px mono, 45.6 tall; the title box clips at ~34 chars). Minor: clearing Steps on edit shows the sample method on pink reading like content; after Remove the image vanishes so Keep refers to nothing visible; three number errors at a 31px pitch (keep three); Title Case h1 vs "+ New recipe".

Questions: required errors wait for an edit or a blocked submit (rec yes, before any Title autofocus); a compact sticky Save/Cancel below 700 on edit (rec try, taste); after Remove keep the photo dimmed with a "Removed" label (rec yes).

Skipped: overlay; the skip link in the Tab walk; 1024/768 visually. Screenshots: wave4/editor/A and B.
