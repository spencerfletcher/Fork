---
target: the recipe page, after the voice pass
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:5dbe09f828b70fe4eb7921175ce4f871fee02ff42fbabdb8f340a66260040024"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-29T03-39-17Z
slug: src-routes-recipes-slug-page-svelte
---
Method: dual-agent (A: design review · B: detector + browser overlay)
Target: src/routes/recipes/[slug]/+page.svelte at http://localhost:4173 (build of 8b29c13), logged out and owner, 1280/768/390, cookies, dal, ?version=2. Read-only. Settled: no action row logged out, full-width method, note at full length, pill action row.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Fork has no pending state; Favorite flips with no revert |
| 2 | Match system / real world | 4 | "3 versions" reads as a statistic |
| 3 | User control and freedom | 3 | No route back up on phone from deep in Method |
| 4 | Consistency and standards | 3 | Note italic sans when current, mono in the list |
| 5 | Error prevention | 3 | One-tap Fork, no pending state |
| 6 | Recognition over recall | 3 | Compare only after opening the list; logged out nothing says fork |
| 7 | Flexibility and efficiency | 2 | Skip link invisible when focused |
| 8 | Aesthetic and minimalist | 3 | 8 sizes, 5 voices in 401px; phantom gap logged out |
| 9 | Error recovery | 2 | Favorite and Fork fail silently |
| 10 | Help and documentation | 3 | ≈ tooltip hover-only |
| Total | | 29/40 | Good (24/32 on the eight scored before) |

## Design specificity verdict
Specific. Only the history panel and the pills (recorded exception) read as generic app shapes. Composition settled: four rows at 24px, one left edge, Ingredients at 575. Voice still crowded: the version bar changes face three times in 75px, and the 20px Ink 2 deck above a 17px italic Ink 2 note gives two grey paragraphs before any ink.

Deterministic scan: 32 advisory font-size hits in scope, 62 src-wide; 24 of 32 prose-listed; 8 app.css sizes in neither; 3px chip radii allowed; app.html body colour is a bare-template read. Overlay: method ~103 chars (settled); cream is the paper token. No overflow, no shadows, console clean; hit boxes 28 to 48px; Favorite named by text; history lists v2 and v1 with Compare. Struck grams at 60% opacity: 2.35:1.

## Priority issues
- [P0] Skip link invisible when focused: lands at (24,8) under the z-50 navbar with z-index 3. Works, cannot be seen. Fix: z-index above the navbar on focus or top 64px. /impeccable harden
- [P1] role="list" with no listitem children in #ingredients and #method. Fix: remove the role or add listitem to rows. /impeccable harden
- [P2] Version bar packs three faces into 75px under a second grey paragraph. Fix: deck in ink at 1.125rem/1.5; note-to-byline gap 6px; chip 0.75rem. /impeccable typeset
- [P2] Favorite and Fork fail silently: optimistic flip never reverts; failed fork renders nothing. Fix: revert on non-success; disabled plus aria-busy while pending; render the form error. /impeccable harden
- [P2] Struck grams at 60% read at 2.35:1. Fix: full opacity with line-through, or dim only the name. /impeccable polish
- [P3] Phantom 24px gap logged out: empty actions row still takes a gap slot. Fix: gate the wrapper. /impeccable polish
- [P3] Skip link scrolls to the wrong place (target inside the sticky aside). Fix: scroll-margin on the sticky wrapper. /impeccable adapt

## Persona red flags
Alex: invisible skip link; empty list role. Jordan: the page never says fork; Compare behind a count-looking toggle. Casey: first row 8px under the tab bar after a tap; no route back up; hero 609px before the photo logged in.

## Minor observations
Note face switch between current and list. Phone history rows wrap with Compare floating. Byline 4.9:1 at the AA floor. iPad photo 2.4:1. History panel pushes Ingredients 575 to 671. Outline h1, h2, h2.

## Cookbook test
Title, roman headnote, yield, recipe: Fork's grey note interrupts the rhythm. A pencil note is smaller and looser than Fork's near-body-size note with a bold chip; the mono byline is the only true pencil. Ingredients: Fork beats the book.

## Questions
What if the version bar lived in the margin (under the photo, above Ingredients in the aside)? Why is the deck grey and larger than every line the cook reads? What on this page earns the wordmark for a logged-out visitor?
