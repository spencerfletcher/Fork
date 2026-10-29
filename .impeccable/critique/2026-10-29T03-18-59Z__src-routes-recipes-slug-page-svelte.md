---
target: the recipe page, after the three-block pass
total_score: 25
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:a73c744c5949f7e8743f3ab3cb8b73c09a5d3658494214fc0882123dae902aa8"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-29T03-18-59Z
slug: src-routes-recipes-slug-page-svelte
---
Method: dual-agent (A: design review · B: detector + browser overlay)
Target: src/routes/recipes/[slug]/+page.svelte at http://localhost:4173 (build of bbb4534), logged out and owner, 1280/768/390, cookies, dal, ?version=2. Read-only. Settled: no action row logged out, full-width method, note at full length.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Nothing says struck rows reset on reload |
| 2 | Match system / real world | 3 | Git words; "1 fork" explains nothing, links nowhere |
| 3 | User control and freedom | 3 | Escape, focus return, Back to v3, strike toggles |
| 4 | Consistency and standards | 2 | Pill buttons vs 6px elsewhere; comma tags vs pill tags elsewhere; Favorite aria-label mismatch |
| 5 | Error prevention | 3 | Read surface |
| 6 | Recognition over recall | 3 | Current version marked by colour only in history |
| 7 | Flexibility and efficiency | 2 | 15 tab stops to the first ingredient, no skip link |
| 8 | Aesthetic and minimalist | 3 | Three clean blocks; 12 type styles; tags read as a fourth statistic |
| 9 | Error recovery | n/a | No error state reachable read-only |
| 10 | Help and documentation | 3 | Footnote well placed; ≈ tooltip hover-only |
| Total | | 25/36 | Fair, upper half (22/32 like for like) |

## Design specificity verdict
Specific. Two deviations from its own system: pill action buttons (DESIGN.md says 6px, pills only on tags) and comma tags where the site uses pill tags. The header column is structurally right (three blocks at 24px); remaining busyness is inside the lines: the note in the printed face reads as a second subtitle, and the tags sit on the statistics line unlabelled. Dal header 211px with 7 type styles reads like a cookbook; cookies 339px with 12; the delta is the version bar.

Deterministic scan: 31 advisory font-size hits in scope, 61 src-wide; 27 of 31 are prose-listed sizes the YAML omits; 8 app.css sizes in neither; three 3px radii are version chips DESIGN.md allows. No finding targeted the header. Overlay: method lines ~103 chars (settled); cream background is the paper token. No overflow, no shadows, no clamp, console clean, contrast ≥ 4.9:1 everywhere. The 24px hit-padding rule only half landed: the versions toggle's padding is reset by a later rule; the username's component element escapes the scoped rule; both 23.8px.

## Priority issues
- [P1] The commit line reads as a second subtitle: same face as the description, 17px ink under 20px Ink 2. Fix: italic note voice (1.0625rem Ink 2, as the Method's tips) or Pencil Rule mono 0.875rem Ink 2 after the chip; bar gap 4px to 2px. /impeccable typeset
- [P1] Tags masquerade as a fourth statistic on the meta line. Fix: tags on their own line under the measures (flex-basis 100%), as the phone already does. /impeccable layout
- [P2] Favorite aria-label "Unfavorite" over visible "Favorited" fails WCAG 2.5.3. Fix: drop the aria-label. /impeccable harden
- [P2] No skip link; 15 stops to the first ingredient; inline hit targets at 23.8px (toggle padding reset, username unscoped); phone buttons 43px. Fix: skip link, specificity fix, 44px. /impeccable adapt
- [P3] History's first row repeats the note just read; "Compare with v2" would sit better beside v2 in the list.
- [P3] Struck rows at 40% opacity leave grams at ~1.6:1; 60% with line-through.

## Persona red flags
Alex: 15 stops, no skip link, toggle looks like the links beside it. Jordan: three git ideas unglossed, "1 fork" inert, note reads as a second description. Casey: first ingredient at 772 of 844 (accepted); struck rows unreadable if re-checked; ≈ hover-only.

## Minor observations
Pill buttons contradict DESIGN.md. "1 fork" has no destination; brief says counts are links. "1 fork ·" dangles at a phone line end. iPad photo 2.4:1. Attribution line not exercised.

## Cookbook test
Ottolenghi: one headnote, bold measures: ingredients pass, cookies header has two headnotes. Nosrat: margin notes in a different hand: byline and history pass, the commit message is the one note in the printed face. Henry, Slater: no tags in a cookbook; "see also" at the foot argues for tags on their own line.

## Questions
Is the two-deck problem the cost of exempting the note from the Pencil Rule? Does "Compare with v2" belong in the byline or beside v2 in the list? Was the full-width method decided for reading or against an empty margin?
