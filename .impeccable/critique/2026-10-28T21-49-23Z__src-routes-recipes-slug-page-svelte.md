---
target: the recipe page, rebuilt
total_score: 20
max_score: 32
na_heuristics: 9,10
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:510203e54cb5c70c441fa49ce46226dcb2ff8ad4bf92b14739385e6f0040b1c0"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-28T21-49-23Z
slug: src-routes-recipes-slug-page-svelte
---
Method: dual-agent (A: design review · B: detector + browser overlay)
Target: src/routes/recipes/[slug]/+page.svelte at http://localhost:4173 (preview of fa2519e), logged out and owner, 1280/768/390, cookies, dal (no photo, v1), ?version=2. Mode: Read with Operate elements. Owner's framing: the header column feels busy; judge the whole page for function, design and cookbook fidelity.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Clamped commit gives no sign it opens |
| 2 | Match system / real world | 3 | "Initial recipe" on v1, "Compare with v2" are git-speak |
| 3 | User control and freedom | 2 | No Fork logged out (by decision); struck rows reset on reload |
| 4 | Consistency and standards | 2 | Three uppercase label styles; commit is a pointer button where nothing is clipped |
| 5 | Error prevention | 3 | One-click fork, no confirm, never says a copy is made |
| 6 | Recognition over recall | 3 | Nothing hints the chip is one of three on desktop |
| 7 | Flexibility and efficiency | 2 | Dead first tab stop; 16 stops to the first ingredient; strike has no affordance |
| 8 | Aesthetic and minimalist | 2 | Header: 6 sizes, 3 faces, 5 colour treatments, 7 rows, a boxed panel with its own left edge |
| 9 | Error recovery | n/a | No error UI on fork/favorite to score |
| 10 | Help and documentation | n/a | Grams tooltip hover-only |
| Total | | 20/32 | Fair |

Same as the morning run: the three P1s then (reading start, touch targets, method beside ingredients) are closed; the header got denser and the visitor's Fork was removed by decision.

## Design specificity verdict
Authored for Fork in one block, and that block is overloaded. Chip, cook's-note commit, mono byline, clay Bitter title, clay mono numerals and inline grams could not ship elsewhere; the body below the rule is a clean generic recipe. Specific, not yet composed.

Deterministic scan: 32 advisory font-size hits in the targeted files, 63 src-wide (59 font sizes, 3 radii of 3px in VersionStrip and the diff page, 1 black body colour in app.html). 28 of 32 are sizes DESIGN.md prose lists but its YAML front matter does not; the file disagrees with itself. Seven app.css sizes are in neither (1.1, 2.125, 1.625, 2, 0.95, 1.4, 0.9rem). Browser overlay (cookies 1280 and 390, dal 1280): method step lines ~103 characters at 724px/17px against the 72 in DESIGN.md; cream background flagged is the paper token (false positive). No overflow, zero shadows, no console errors; all five header contrast pairs ≥ 4.5:1; text under 13px only the 11px eyebrows and the navbar handle.

## Priority issues
- [P1] The header column has no quiet row: six sizes (40/20/17/15/14/13), three faces, five colour treatments, seven rows, clay in three consecutive rows; tags at 17px clay read as a byline. Fix: tags mono 14 Ink 3 after the buttons or folded into the meta line; one uppercase label style page-wide (Prep/Cook/Serves and phone tabs take the eyebrow style); steady 12px gaps. /impeccable typeset
- [P1] The version bar is a boxed widget, not a margin note: the only enclosed shape on the page, its own left edge, lifted paper plus border on top of the face change the Pencil Rule says suffices. Fix: drop background and border, keep chip, flush left; at most a 2px rule-2 left edge; delete the title tooltip. /impeccable distill
- [P2] Commit clamp hides the cook's half ("cloying, smaller batch") at 390 with no affordance; on desktop it is a pointer button and the first tab stop while nothing is clipped. Fix: plain paragraph unless it overflows; clay mono "more" when clamped; or three lines on phone. /impeccable clarify
- [P2] v1 shows "Initial recipe" in a 76px box (dal). Fix: single version shows chip and byline on one row, no commit line. /impeccable distill
- [P2] Logged out, no Fork. Reviewer A rated P0 against the brief; it is the owner's decision of 28 October afternoon and stands as a choice; the brief must be updated. /impeccable onboard if reopened
- [P3] Method lines run 103 characters at 1280 since the cap was removed; owner's call against DESIGN.md's 72. /impeccable layout

## Persona red flags
Alex: Tab 8 is the dead commit button; 16 stops to the first ingredient; no skip link; six invisible checkboxes. Jordan: version vocabulary unglossed; no Fork to land the metaphor; clay tags read as attribution; strike undiscoverable; phone commit clipped. Casey: first ingredient at 761 of 844 as owner; marigold Edit under a scrolling thumb; struck rows at 40% hard to recover; 16px numerals small at 60cm.

## Minor observations
Phone byline wraps with a leading dot; owner offered Favorite on own recipe; commit at 17px reads boxed rather than subordinate to the 20px deck; iPad first ingredient at 879 of 1024; no error path on fork/favorite forms; long titles hold at every width; DESIGN.md front matter and prose disagree on the ramp.

## Cookbook test
Passes: the ingredient column. Fails: yield and time are the fifth row in their own label style; the margin note is boxed; two headnotes of prose before the recipe.

## Questions
If history is told apart by face alone, what does the box add? Who clicks "American" while holding a whisk? Why is Edit the only marigold an owner sees and nothing marigold for the person being converted?
