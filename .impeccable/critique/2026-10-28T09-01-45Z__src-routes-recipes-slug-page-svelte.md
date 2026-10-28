---
target: the recipe page
total_score: 20
max_score: 32
na_heuristics: 9,10
p0_count: 0
p1_count: 3
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:089fb0dd8f29ef0f885b009906a303d7b6945cfc49d8b1a7624a06d8aa2fcd85"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-28T09-01-45Z
slug: src-routes-recipes-slug-page-svelte
---
Method: dual-agent (A: design review · B: detector + browser overlay)
Target: src/routes/recipes/[slug]/+page.svelte at http://127.0.0.1:4173 (preview, logged out), cookies and no-photo dal. Mode: Read with Operate elements.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Version and "Viewing vN" clear; struck rows reset on reload |
| 2 | Match system / real world | 2 | v3, 3 versions, 1 fork, Compare with v2, Initial recipe in code font, unexplained |
| 3 | User control and freedom | 2 | No serving scaling, no clear-all, ingredients cannot stay beside the method |
| 4 | Consistency and standards | 3 | Clay means link except step numbers; time shown twice in two formats |
| 5 | Error prevention | 3 | Whole-row tap targets strike by accident |
| 6 | Recognition over recall | 2 | Method cannot see the ingredients; sticky column pins the photo |
| 7 | Flexibility and efficiency | 2 | Nothing for a repeat user; Fork behind login then a dialog |
| 8 | Aesthetic and minimalist | 3 | Version number three times above the fold; empty no-photo column |
| 9 | Error recovery | n/a | No error states on a visitor's reading page |
| 10 | Help and documentation | n/a | Grams hint is enough |
| Total | | 20/32 | Fair |

## Design specificity verdict
Authored for Fork by one element: the version strip, a commit line on a cookbook page. Remove it and the rest is a good generic recipe page. Character missing where it matters: no fork affordance for a visitor; "1 fork" not a link; single-version dal reads "v1 · v1 · Initial recipe · 1 version"; on phone the strip card pushes the first ingredient to ~770px.

Deterministic scan: 11 advisory CLI findings in targeted files (9 font sizes off the DESIGN.md ramp: RecipeCard 0.8125/0.9375rem, Navbar 1.375/0.875/0.95rem, VersionStrip and VersionDiff 0.875rem; 2 radii: 3px chip corners in VersionStrip). Src-wide 60 advisory, 56 font sizes, 22 in app.css. Browser scan per recipe page: 3x 10px "Prep/Cook/Serves" labels under the 11px floor (Details.svelte:25), 2 method steps at ~103 chars/line in the 724px column (RecipeMethod.svelte:27), h1 followed by h4 with no h2 (RecipeIngredients.svelte:31, RecipeMethod.svelte:14), cream background. Diff page: cream only. False positive: cream palette is the documented paper token.

## Priority issues
- [P1] Recipe starts a screen late on phone (first ingredient ~770px at 390) and iPad (Ingredients heading ~875px at 768). Fix: photo as short crop between title and description on phone, strip collapsed to one line with message on tap, Prep/Cook/Serves in the meta row. /impeccable adapt
- [P1] A visitor cannot fork and cannot see forking exists; actions block absent without a user, "1 fork" not a link. Fix: render Fork for everyone, link to login with redirect; fork count links to forks. /impeccable shape
- [P1] Touch targets in strip and meta row 16–20px tall at 12px mono on phone. Fix: 44px hit areas, mono 0.8125rem on touch widths. /impeccable adapt
- [P2] Method cannot see the ingredients on any viewport; 103-char lines. Fix: ingredients in the sticky aside, photo in the header, method capped at 72ch (options B/C). /impeccable layout
- [P2] Version number shown three times; One Fill Rule broken; servings and time duplicated. Fix: drop title chip, one place for details, single-version strip collapses to a mono byline. /impeccable distill
- [P3] Tablet is the phone stretched. /impeccable adapt
- [P3] No-photo desktop leaves 700px of empty column. /impeccable layout

## Persona red flags
Alex: no Fork logged out; logged in it is ~900px down then a dialog before any change; Compare links 1000px from their lines; 1 fork not a link; no keyboard path.
Jordan: five unexplained marks before the recipe; nothing teaches what a fork is; commit message reads as a tagline; dal says Initial recipe · 1 version; no cue rows are tappable.
Casey (cook, phone on counter): first ingredient a scroll away; 16px/12px text not readable at arm's length; 16–20px links under the thumb; a brush strikes a row; reload resets checks; quantities a scroll from the step.

## Minor observations
"2 large eggs" lacks a bold measure; step numbers in clay read as links; details labels 10px; h1 to h4 heading skip; history panel repeats the strip line; 44px title to 12px handle is the harshest step; tags comma list vs pills elsewhere; annotations differ only by colour; DESIGN.md ramp is missing four sizes the code uses.

## Questions
Commit message as the deck (option C)? Cooking as a mode? Fork as the editor?
