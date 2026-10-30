---
target: recipe editor, sweep 5
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte"
target_fingerprint: "sha256:fca90eddfabc266d4270727aa68f9065c3916ea81736dbac61ffc426648d67bd"
target_path: /Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte
timestamp: 2026-10-30T02-12-19Z
slug: src-lib-components-recipes-recipeform-svelte
---
# Recipe editor, sweep 5 (29 October 2026, sixth run)

Method: dual-agent (A: a05344d193a77b020 · B: a5465f902526983b0); overlay skipped (read-only). Tree 27b7283. Trend 24 → 30 → 31 → 32 → 32 → 31/40: H3 down one on a fresh finding (pill × drops focus to BODY); five prior P2/P3 items fixed. 0 submits, 0 blocked non-GET requests, 0 console errors; coarse-pointer run at 768.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | New renders no header snippet, so a blocked save there gets no "N fields need attention" (Edit does) |
| 2 | Match system / real world | 3 | "Serves" label vs "Servings must be at least 1"; "can't be scaled" is the system's word |
| 3 | User control and freedom | 3 | Removing a tag pill drops focus to BODY; Remove photo hides what is being removed |
| 4 | Consistency and standards | 3 | Title carries `*`, Ingredients and Steps (equally required) don't; Title Case h1 vs sentence-case buttons |
| 5 | Error prevention | 4 | |
| 6 | Recognition rather than recall | 3 | Ingredient format lives only in a placeholder |
| 7 | Flexibility and efficiency | 3 | Focus starts on BODY; no keyboard save |
| 8 | Aesthetic and minimalist design | 3 | ~190px empty paper above Create at 1280; a blocked save turns two 300px textareas into pink walls |
| 9 | Error recovery | 3 | An empty invalid textarea shows its example darker than before, so it reads as filled |
| 10 | Help and documentation | 3 | The can't-scale note says what, not how |
| Total | | 31/40 | Good |

Design specificity: Edit is Fork's own (mono "Editing v3 · saves as v4", the self-drafting commit placeholder, "applies to every version"). New is a generic two-column form in Fork's fonts: nothing on it shows versioning.

Evidence (B): detector exit 0, 2 advisory design-system-font-size (RecipeForm.svelte:502 .photo-choose 0.9375rem; TagInput.svelte:276 .tag-option 0.875rem), both real departures from the DESIGN.md ramp. Pass-through Tab on both pages: no error text, no aria-invalid, rings on every stop. Type-then-blur: exact messages, aria-describedby targets exist, error line 23px. Blocked empty New: 3 errors, focus on Title, 0 submits. Combobox: one 1px shared edge, ring encloses box and list, not cut at any width (390: list bottom 774, bar top 778). Pill × 24 fine / 44 coarse and 390. Photo buttons 44 at 390 and coarse, 41 fine. Sticky bar at 390: 66px, sticky, scroll-padding-bottom 70, no focused field under it. Reduced motion: all transitions ~0, scrollIntoView instant. Contrast lowest 4.91; invalid placeholder 7.76. CLS 0, no overflow. Broken aria ref: aria-controls="tag-listbox" while the list is closed (TagInput) and the nav's mobile-menu. Probe note: `document.querySelector('form')` is the logout form, and checkValidity() fires RecipeForm's invalid capture handler, so validity was read per field.

Priority issues:
- [P2] An empty invalid textarea reads as filled. RecipeForm.svelte:530-534 lifts the invalid placeholder to Ink 2 (7.76:1) on the pink fill, darker than the red typed text gets; the Ingredients and Steps examples look like content above "At least one ingredient is required". Fix: drop the pink fill on invalid textareas (keep red border + message) so the Ink 3 placeholder stays on paper; or blank the placeholder when invalid once a permanent format hint exists. A rated this P1.
- [P2] New has no outcome line. src/routes/recipes/new/+page.svelte:27-31 passes no `header` snippet, so the count RecipeForm.svelte:98-100 computes never renders; at 390 only "Title is required" is on screen after a blocked save. Fix: give New the same aria-live header span as Edit (~5 lines).
- [P3] Removing a tag pill drops focus to BODY (TagInput.svelte:45-47 remove() moves no focus). Fix: focus the next pill's ×, else the combobox input.
- [P3] At 390 and coarse pointer the pill × ring draws around the invisible 44px box (TagInput.svelte:226-231, margin -14px): a ~52px rectangle spanning the pill row, half over "Dessert", its bottom painted over by the input. Fix: keep the 44px hit with a ::before pseudo-element and leave the button (and its ring) at pill size.
- [P3] Forced colours: invalid fields look identical to valid ones (same 1px border), and the active combobox option has no indicator (TagInput.svelte:282-285 background only). Fix: invalid fields get a 2px border; `[aria-selected='true']` gets an outline or `forced-colors: active` Highlight.
- [P3] Required marks inconsistent: Title `*` (RecipeForm.svelte:282), none on IngredientEditor.svelte:44 / StepEditor.svelte:9.

Prior items: required red on pass-through FIXED; outcome line on blocked save FIXED on Edit (source), OPEN on New; tag × 16px FIXED (24/44); combobox 2px seam FIXED; invalid placeholder overshoot OPEN and now the top item; photo ghost 41px at 390/touch FIXED (44); tag list flush with viewport bottom FIXED (now stops 4px above the sticky bar); ingredient format recall OPEN; focus on BODY OPEN; empty paper above Create at 1280 OPEN; Serves vs Servings OPEN; can't-scale note OPEN; Remove photo vanishes OPEN.

Cognitive load 2/8 fail (chunking/grouping: the left column is a flat run of eight controls; working memory: ingredient syntax). Personas: laptop transcriber (format example gone on first keystroke; Tags opens a 240px list on Tab pass-through, TagInput.svelte:124; no keyboard save); phone typo fix (sticky Save works, but "saves as v4" and "What changed?" are both off-screen when saving); screen reader (a blocked save fires three role=alert at once while focus lands on Title; no summary on New). Minor: global `.required` red and dotted `.field-message` are overridden locally (dead globals, note only); "· applies to every version" on New says little; Title Case h1 vs "Create recipe".

Questions: New shows "saves as v1" in the same header slot (rec yes, also fixes the blocked-save count); invalid textareas lose the pink fill and keep border + message (rec yes); at 390 the outcome rides in the sticky bar beside Save (rec try, taste).

Screenshots: wave5/editor/A and B.
