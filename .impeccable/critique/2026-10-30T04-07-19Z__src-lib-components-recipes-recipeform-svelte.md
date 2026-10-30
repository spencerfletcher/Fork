---
target: recipe editor, sweep 7
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte"
target_fingerprint: "sha256:4aa3fd0e8d67fd493efc9567c025a0b87ba80dcc957b77d07503ee7d88a5cb48"
target_path: /Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte
timestamp: 2026-10-30T04-07-19Z
slug: src-lib-components-recipes-recipeform-svelte
---
# Recipe editor, sweep 7 (29 October 2026, eighth run)

Method: dual-agent (A: af9be39bd380a8e08 · B: a476a729ccc57d11b); overlay skipped (read-only). Tree 9014834. Trend 24 → 30 → 31 → 32 → 32 → 31 → 33 → 34/40: H6 up to 4 (Ingredients and Steps both keep a permanent format hint). 0 submits, 0 non-GET requests, 0 console errors across 390, 768, 768 coarse, 1280, forced colours and reduced motion.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | New keeps "saves as v1" with 5 aria-invalid fields; after a blocked save at 1280 the count line sits at the top edge (-14/6) |
| 2 | Match system / real world | 3 | "saves as v1", "Editing v3", "applies to every version" unglossed; Serves vs Servings |
| 3 | User control and freedom | 4 | |
| 4 | Consistency and standards | 3 | New and Edit treat an invalid draft differently; Title alone carries `*` |
| 5 | Error prevention | 4 | (A scored 3: Steps syntax is free text; unchanged since sweep 6's 4, kept) |
| 6 | Recognition rather than recall | 4 | Both textareas keep a format hint, describedby after the error |
| 7 | Flexibility and efficiency | 3 | Focus starts on BODY; Enter submits from inputs, Cmd/Ctrl+Enter in a textarea does nothing |
| 8 | Aesthetic and minimalist design | 3 | Title clips at 390; ~200px dead paper bottom-left at 1280; 48px paper under the 390 bar at scroll end |
| 9 | Error recovery | 4 | |
| 10 | Help and documentation | 3 | Nothing says a blank "What changed?" saves the placeholder as the message |
| Total | | 34/40 | Good |

Design specificity: Fork's own in the header outcome line ("Editing v3 · saves as v4", "saves settings only", a live count of fields needing attention), mono boxes as raw text under edit, and the self-drafting commit placeholder. The left column alone is still a generic form stack.

Evidence (B): detector exit 0, 2 advisory design-system-font-size (RecipeForm.svelte:519 .photo-choose 0.9375rem; TagInput.svelte:291 .tag-option 0.875rem), both false positives per DESIGN.md:190. Tab pass: 2px ring every stop, no error text or aria-invalid. Blur: exact messages, error before hint on Ingredients and Steps, invalid border rgb(163,54,43), fill unchanged; text also turns red (app.css:872, 6.63:1). Contrast: errors 6.09, hints 4.91, placeholders 5.35. Blocked empty New: "saves as v1" → "3 fields need attention" → "2", focus #title, 3 role=alert, 0 submits. Combobox: activedescendant valid, Enter adds, Escape closes; menu clears the 390 bar by 95px. Pill ×: 24 hit fine, 44 at 390/coarse; focus → next × → input. Photo: Remove ↔ Keep trade focus. Sticky bar 390: 66px, every Tab stop on both pages clears it hint included (worst 774 vs bar 778), also in forced and reduced. Reduced motion: transitions 1e-05s, scroll instant (RecipeForm.svelte:248). CLS 0, no overflow.

Priority issues:
- [P2] Title clips on a phone. RecipeForm.svelte:301 is a one-line input; at 390 the 38-char seed title has scrollWidth 389 vs clientWidth 352 and reads "Thick and Chewy Chocolate Chip Coo" (A/edit-fold-390.png). Mono 1rem fits ~29 chars. Fix: a one-row textarea with field-sizing: content that blocks Enter, so the title wraps like Description.
- [P2] New promises "saves as v1" while fields are invalid. new/+page.svelte:38 `outcome || 'saves as v1'`; Edit in the same state drops to "Editing v3". Fix: fall back to "saves as v1" only when no field carries an error.
- [P3] Blank commit message silently saves the placeholder. RecipeForm.svelte:430-440: "What changed? optional" with placeholder "Updated servings", which is what gets written. Fix: a hint "Left blank, saves as: Updated servings".
- [P3] Forced colours: invalid and valid borders both settle to rgb(0,0,0), pixels match; app.css:872 has no forced-colors rule. Fix: `@media (forced-colors: active)` give `:user-invalid, [aria-invalid='true']` a 2px border.
- [P3] aria-controls="tag-listbox" targets a missing element when closed (TagInput.svelte:147). Fix: set it only when open, or always render the ul hidden.

Prior items: Ingredients under the 390 bar FIXED (774 vs 778, both pages); ingredient format recall FIXED (permanent hint, describedby after error); outcome far from Save at 390 now moot for Tab (every field clears) but the outcome still isn't in the bar, OPEN as taste; New header ignores blur errors OPEN; forced-colours invalid fields OPEN; aria-controls when closed OPEN; Tags list opens on Tab pass-through OPEN (aria-expanded true on the Tab stop); focus on BODY OPEN; keyboard save PARTLY (Enter in inputs submits; nothing from textareas); "Create" plus icon clay in forced colours OPEN, cause found: text-accent on the svg at TagInput.svelte:189; required marks OPEN; empty paper above/beside Create at 1280 OPEN; Serves vs Servings OPEN; can't-scale note OPEN. Regressions: none.

New this sweep: Title clipping at 390 (P2); blank commit message saves the placeholder unannounced (P3); 48px paper band below the 390 bar at scroll end on Edit (bar bottom 796 of 844; RecipeForm.svelte:565-573 plus .page padding); after a blocked save at 1280 the count line is at top -14/6 (unverified for real clicks, Playwright scrolled Save into view).

Cognitive load 1/8 fail (chunking: seven ungrouped controls in the left column). Working memory now passes. Personas: Jordan ("v1"/"v3" unglossed; big multi-line mono placeholders read as pre-filled; blank commit behaviour unknown); Sam (no blockers; tab order logical; invalid border invisible in forced colours, message text carries it); Casey (title clips; the bar works on every field).

Minor: steps hint "with tip:, warning: or substitution:" reads awkwardly and the codes aren't in mono; pill × ring at 390 squares over the pill border; desktop Remove photo 28px translucent circle; invalid text also red (DESIGN.md silent on whether intended).

Questions: wrap the title on a phone (rec yes, textarea with field-sizing); state the blank-commit fallback in a hint (rec yes); carry the outcome into the 390 bar (rec no now that every field clears the bar; revisit if testers miss "What changed?").

Screenshots: wave7/editor/A and B.
