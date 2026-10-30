---
target: recipe editor, sweep 6
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte"
target_fingerprint: "sha256:b7b5dc43265f31af005492cfe084dd3bac9ec04e6d79f0c0e07601049158c5b9"
target_path: /Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte
timestamp: 2026-10-30T02-52-29Z
slug: src-lib-components-recipes-recipeform-svelte
---
# Recipe editor, sweep 6 (29 October 2026, seventh run)

Method: dual-agent (A: a7e7ee2082e8683c0 · B: a38910f69f4d03bae); overlay skipped (read-only). Tree 81b69ec. Trend 24 → 30 → 31 → 32 → 32 → 31 → 33/40: H3 and H9 up to 4 (pill × hands focus on; an empty invalid box looks empty; New counts the fields). 0 submits, 0 non-GET requests, 0 console errors across 390, 768, 1280, 768 coarse, forced colours and reduced motion.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | At 390 "saves as v4" and "What changed?" are ~1,500px above the sticky Save; New keeps "saves as v1" while typed fields are invalid (Edit blanks it) |
| 2 | Match system / real world | 3 | "Serves" label vs "Servings must be at least 1"; "can't be scaled" is the system's word |
| 3 | User control and freedom | 4 | |
| 4 | Consistency and standards | 3 | Title carries `*`, Ingredients and Steps don't; Steps has a permanent hint, Ingredients doesn't; Title Case h1 |
| 5 | Error prevention | 4 | |
| 6 | Recognition rather than recall | 3 | Ingredient format lives only in a placeholder |
| 7 | Flexibility and efficiency | 3 | Focus starts on BODY; no keyboard save |
| 8 | Aesthetic and minimalist design | 3 | ~200px empty paper above Create at 1280 on New |
| 9 | Error recovery | 4 | |
| 10 | Help and documentation | 3 | The can't-scale note says what, not how |
| Total | | 33/40 | Good |

Design specificity: Edit is Fork's own (mono "Editing v3 · saves as v4", self-drafting commit placeholder, "applies to every version"). New now says "saves as v1" in the same mono slot, its first sign of versioning; below the header it is still a generic two-column form in Fork's fonts.

Evidence (B): detector exit 0, 2 advisory design-system-font-size (RecipeForm.svelte:502 .photo-choose 0.9375rem; TagInput.svelte:291 .tag-option 0.875rem), both false positives: DESIGN.md:190 lists them as on the ramp, the detector reads only the frontmatter tokens. Pass-through Tab: no error text, no aria-invalid, 2px ring on every stop. Type-then-blur: exact messages, describedby targets exist (error before hint on Steps), invalid inputs and textareas red border on paper, no fill, placeholder Ink 3 5.35:1. Blocked empty New (form.form, confirmed invalid first): header "saves as v1" → "3 fields need attention" → "2" after Title, focus on Title, 3 role=alert, 0 submits, at all 8 configs. Combobox: arrows/Enter/Escape fine, list clears the 390 bar (0 overlap). Pill ×: chain × → next × → input, never BODY; 16px glyph, ring inside pill height, ::before hit 24 fine / 44 coarse and 390. Photo buttons 44 at 390/coarse, 41 fine; Remove ↔ Keep trade focus. Sticky bar 390: 66px, scroll-padding-bottom 70. Reduced motion: transitions ~0, scrollIntoView instant. Lowest contrast 4.91; CLS 0; no overflow.

Priority issues:
- [P2] At 390 a tabbed-into Ingredients box sits under the sticky bar. On New, Tab from the public checkbox focuses #ingredients at top 718, bottom 1020; bar top 778, so 242 of 302px are covered and the page does not scroll (Chrome treats a partly visible box as in view, so scroll-padding-bottom at RecipeForm.svelte:562 never applies). Reproduces in forced and reduced runs. Fix: on focusin of a textarea under the bar, scrollIntoView({block:'nearest'}) when its bottom exceeds the bar top, or cap the visible scroll with scroll-margin-bottom on textareas. Screenshot B/w390-ingredients-focus.png.
- [P2] Ingredient format is recall-only. IngredientEditor.svelte:58-64 only speaks after a line fails; Steps keeps a permanent hint (StepEditor.svelte:24-27). Fix: permanent .form-hint "One per line: quantity, unit, ingredient (2¼ cups flour)", in aria-describedby after the error, as Steps does.
- [P2] On a phone the version outcome and "What changed?" are nowhere near Save (Edit at 390: #commitMessage y=2346, bar top 778). The signature (a version with a reason) is easy to save without seeing it. Fix: carry the outcome as a small mono line in the sticky bar beside Save.
- [P3] Forced colours: invalid fields look identical to valid (1px black, app.css:872-875 has no forced-colours rule). Fix: `@media (forced-colors: active)` give `:user-invalid, [aria-invalid='true']` a 2px border.
- [P3] New's header ignores blur errors: new/+page.svelte:38 `outcome || 'saves as v1'` keeps "saves as v1" with 5 invalid fields, where Edit drops to "Editing v3" (RecipeForm.svelte:101). Fix: fall back to 'saves as v1' only when no field carries an error.
- [P3] aria-controls="tag-listbox" points at a missing element while the list is closed (TagInput.svelte:147 always set; the ul renders only under showDropdown at :150-152). Fix: set aria-controls only when open, or always render the ul hidden.

Prior items: invalid textarea reads as filled FIXED; New outcome line FIXED; pill × focus to BODY FIXED; pill × 52px ring at 390/coarse FIXED; forced-colours active tag option FIXED (2px outline); forced-colours invalid fields OPEN; required marks OPEN; ingredient format recall OPEN; focus on BODY OPEN; empty paper above Create at 1280 OPEN; Serves vs Servings OPEN; can't-scale note OPEN; Remove photo hides what is removed OPEN (mitigated by Keep photo); no keyboard save OPEN; broken aria-controls when closed OPEN. Regressions: none in the changed code; the Ingredients-under-bar case at 390 is newly measured (sweep 5 reported none).

Cognitive load 2/8 fail (chunking/grouping: the left column is a flat run of eight controls; working memory: ingredient syntax). Personas: first-timer (format vanishes on the first keystroke; can't-scale says no remedy; "v1" unexplained); keyboard/screen reader/forced colours (focus starts on BODY; three role=alert at once on a blocked save; invalid border invisible in forced colours; placeholders render dark red in Chromium forced emulation, unverified on a real theme); phone one-thumb (Save always in reach, but Ingredients hides under the bar on Tab and the outcome is 1,500px up). Minor: pill × ring crowds the tag text at 390; Tags list opens on Tab pass-through (TagInput.svelte:134); "Create" plus icon stays clay in forced colours (observed, cause unchecked); dead globals .required (app.css:865) and .field-message (app.css:793) overridden locally, note only.

Questions: outcome rides in the 390 sticky bar beside Save (rec yes, taste on bar height); Ingredients gets a permanent format hint and the can't-scale note names the fix (rec yes to both); move Create under the left column at 1280 (rec no: Edit fills that space with the commit message, consistency wins).

Screenshots: wave6/editor/A and B.
