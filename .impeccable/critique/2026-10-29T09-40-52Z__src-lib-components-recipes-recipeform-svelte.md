---
target: "recipe editor: new and edit"
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte"
target_fingerprint: "sha256:dca3bcde437665c63b4a94902783bec4f17bc8ee31b249d2e1989dc813002937"
target_path: /Users/spfle/Dev/Fork/src/lib/components/recipes/RecipeForm.svelte
timestamp: 2026-10-29T09-40-52Z
slug: src-lib-components-recipes-recipeform-svelte
---
# Recipe editor: /recipes/new and /recipes/[slug]/edit (29 October 2026 sweep)

Method: dual-agent (A design review, B detector + overlay + polish walk). Target: src/lib/components/recipes/RecipeForm.svelte, src/lib/components/ui/TagInput.svelte, src/routes/recipes/new, src/routes/recipes/[slug]/edit. Saved for later; nothing acted on; no form was submitted, so saving and server-error states are read from source.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | The outcome sentence ("Saves as v4 · title and servings changed") lives only beside Save, 1000px below the title at 1280 and 2200px at 390; saving is a word change; an invalid draft silently blanks the helper |
| 2 | Match system / real world | 3 | Plain labels; tip:/warning:/substitution: prefixes and mono boxes are developer idiom |
| 3 | User control and freedom | 3 | Guard on every exit, draft kept after a failed save, photo removal reversible before saving |
| 4 | Consistency and standards | 2 | Pencil Rule contradicted (recipe text mono here, sans on the page); dotted and dashed lines are new; Save narrower than Cancel; commit input 41px vs 45px siblings; placeholder "2 1/4" vs stored "2¼" |
| 5 | Error prevention | 2 | required and min fire before submit, but nothing styles an invalid field |
| 6 | Recognition over recall | 2 | Placeholders teach the syntax only while empty; the steps hint repeats permanently |
| 7 | Flexibility and efficiency | 3 | Paste a list, Enter makes a tag; Tags cost nine Tab presses |
| 8 | Aesthetic and minimalist design | 3 | Calm and flat; the native "Choose File No file chosen" string inside a dashed field; on New the left column ends 200px above the right |
| 9 | Error recovery | 1 | The server returns one sentence in a box above the actions; no field marked, focus not moved, no aria-describedby |
| 10 | Help and documentation | 3 | Inline hints cover the two syntaxes and the visibility note |
| Total | | 24/40 | Solid |

## Design specificity

Specific and the same product as the recipe page: clay Bitter h1, eyebrow labels in the Ingredients/Method voice, lifted-paper inputs with Rule 2 borders, marigold Save and ghost Cancel, the same tag pills, the global focus ring, one 864px column split 5:7 that collapses in DOM order. Against the system: ingredients and steps are set in mono while the Pencil Rule says the recipe is never mono; a dashed file box and a dotted rule are new line styles. 11 type combinations, all on the ramp except the 0.9rem tag option.

Detector: 0 findings in scope; TagInput's .tag-option 0.9rem is off the ramp. Overlay: every placeholder 3.4:1 (ink at 50% alpha on the surface; no ::placeholder rule in src, site-wide) and the cream palette false positive. Console, overflow, CLS, focus rings, label association (except the tag combobox), textarea growth, file preview, auth redirect, 16px inputs on a phone: clean.

## Measured

Inputs 45px (46 on a phone); commit message input 41px. Save 63px wide vs Cancel 77 at desktop. Edit page 1285px tall at 1280 and 2493 at 390 with Save at the bottom. Tag remove buttons 8x16px; photo remove 28px (32 on a phone); back link 23px. Invalid field after blur: :user-invalid matches but border unchanged, no aria-invalid or aria-describedby, no message. Logged out both pages 303 to /login. <title> generic on both pages. Guard: window.confirm "Leave without saving? Your changes will be lost." on in-app navigation and the native dialog on tab close.

## Working

- The helper line is the version model in one sentence, computed with the server's own grouping, and the generated message as placeholder means an empty field still yields a good commit.
- Honest fast text model: one line per ingredient in a growing mono box, paste and type, the "can't be scaled" hint discloses the parser without blocking.
- Structure holds at every width: DOM order equals visual order, textareas grow instead of scrolling inside, the guard covers Cancel, links and tab close.

## Priority issues

- [P1] No inline invalid state. Fix: style :user-invalid with the DESIGN.md error tokens, a per-field hint with an id, aria-invalid and aria-describedby, focus the first named field after a failed action; keep the global box for 409/500 only.
- [P1] The outcome sentence is only at the bottom. Fix: echo it in the header ("Editing v3 · saves as v4" when dirty), cheapest; or a sticky action bar from 700px up, which the Flat-At-Rest rule would have to admit.
- [P2] Save is narrower than Cancel; min-width 112px or label it "Save changes".
- [P2] Tags: the combobox has no label association (only input without one); it opens on focus and every option is a Tab stop (nine presses); tag remove buttons 8x16; option li role=option wraps a button with aria-selected never true. Fix: open on input, options tabindex -1 with arrow keys and aria-activedescendant, 24px minimum removers, label the input.
- [P2] Pencil Rule broken without a recorded exception and the notation round-trips (placeholder "2 1/4", stored "2¼"). Write the exception into DESIGN.md (raw text under edit is mono) and make the placeholder "2¼ cups", or set the textareas in sans with tabular figures.
- [P3] One grammar for the change list ("Updated title and servings", "Removed photo" when removing); "Serves" vs "servings"; visible disabled state while saving; commit input height; "WHAT CHANGED?" as an uppercase question; the permanent steps hint; photo preview crop 2.3:1 matches no surface; generic <title> on both pages; placeholder contrast; back link 23px; "Saves as v1" on New instead of "Unsaved changes".

## Persona red flags

Author typing from a paper card on a laptop: no autofocus on Title; "salt to taste" fires an aria-live status on every keystroke; a card with "1. 2. 3." steps may ship numbers inside steps (hint says nothing); the first "Title is required" arrives after the whole card is typed, as a browser bubble. Author fixing a typo on a phone: a 2493px page, an 890px mono textarea, Save at 2389 with the helper confirming only once reached; tag and photo removers under the 44px floor next to each other.

## Minor observations

Native number spinners on hover; resize grips on growing textareas; the required asterisk uses the error colour at rest; "Choose File No file chosen" under the existing photo with no word "Replace"; the dirty check trims and sorts tags so retyping the original clears the helper, a nice detail; a black band in the 390 full-page capture is a Chromium artefact of a scrolled capture, worth one look on a real phone.

## Questions to consider

- If the helper line is the product's honesty about versioning, why is it the last thing on the page?
- The Pencil Rule says the recipe is never mono; the editor sets it in mono. Is the editor where the rule bends, or is text under edit not yet the recipe? Either answer is fine, the undecided one is not.
- Two textareas carry three grammars. Is that the honest cost of one save, or does the phone typo-fix persona say steps want to be a list of boxes?
