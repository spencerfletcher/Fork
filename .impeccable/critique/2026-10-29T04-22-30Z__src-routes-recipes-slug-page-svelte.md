---
target: the recipe page, before the header rethink
total_score: 26
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:751cf0c18ef1c585dd6d04bf8183268e48a6277c3478ba32a4a00a9d368dea70"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-10-29T04-22-30Z
slug: src-routes-recipes-slug-page-svelte
---
Method: dual-agent (A: design review · B: detector + browser overlay)
Target: src/routes/recipes/[slug]/+page.svelte at http://localhost:4173 (build of fe1d4a6). Read-only. Archived without action: the owner paused the loop to rethink the header's type system.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Phone tab bar says Ingredients while steps 1 to 3 are on screen |
| 2 | Match system / real world | 4 | Cook's-note voice, fractions, grams; "fork" and "versions" remain git words |
| 3 | User control and freedom | 3 | At 768 Method cannot reach the top on a short recipe |
| 4 | Consistency and standards | 2 | Clay mono text is both link and disclosure toggle, identically styled; tags look like body text |
| 5 | Error prevention | 3 | One-click Fork, decided |
| 6 | Recognition over recall | 2 | Toggle and tag links rely on hover for their only cue |
| 7 | Flexibility and efficiency | 3 | Skip link first and two keystrokes to the recipe; the 1280 landing shows no focus |
| 8 | Aesthetic and minimalist | 3 | Top three lines right; lower four lines in four idioms within 150px |
| 9 | Error recovery | 3 | Alerts on failed fork and favourite |
| 10 | Help and documentation | n/a | The estimates line suffices |
| Total | | 26/36 | Good (24/32 like for like) |

## Design specificity verdict
Specific. Header inventory: 11 type styles as owner, 9 logged out; 8 sizes, 3 faces, 5 colours plus a fill. The owner's own verdict the same hour: too busy; a rethink of the whole header type system follows, informed by reference sites (GitHub, GitLab, Hugging Face, npm, Serious Eats, Bon Appétit, Smitten Kitchen, King Arthur, NYT Cooking).

Deterministic scan: 30 advisory font-size hits in scope, 60 src-wide; 25 of 30 prose-listed; app.css sizes in neither: 1.1, 2.125, 1.625, 2, 0.95, 1.4, 0.9rem. Overlay: method ~103 chars (settled); cream is the paper token. No overflow, no shadows, console clean, contrast ≥ 4.9:1, skip link first stop everywhere and self-hit when focused; history opens from "v2 of 3" with correct diff links; no aria-busy at rest; no list roles.

## Priority issues (recorded, not scheduled)
- [P1] Disclosure toggle indistinguishable from the links beside it. Fix: a mono chevron after the toggle, flipped when open.
- [P1] Skip link lands invisibly at 1280: the page's maximum scroll is 272 and the focused block has no outline. Fix: focus the first ingredient's input instead.
- [P2] Tags have no resting link affordance.
- [P2] On a phone the history row's Compare link squeezes the note to ~140px. Fix: wrap below 700px.
- [P3] Short pages below 1024 cannot put Method under the bar. Fix: min-height on .main.

## Questions
If the note is the product, why does the description get the larger, darker type? Does "3 versions" need to be a disclosure? Why does a logged-out visitor see "1 fork" when they cannot fork?
