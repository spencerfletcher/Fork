---
target: compare page
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte"
target_fingerprint: "sha256:93e566d6a0a13c288bc5308918410d284665130c6f979af5c101a1e3b9e41ddf"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/diff/+page.svelte
timestamp: 2026-10-29T09-36-39Z
slug: src-routes-recipes-slug-diff-page-svelte
---
# Compare page, /recipes/[slug]/diff (29 October 2026 sweep)

Method: dual-agent (A design review, B detector + overlay + polish walk). Target: src/routes/recipes/[slug]/diff/+page.svelte, +page.server.ts, src/lib/components/recipes/VersionDiff.svelte, src/lib/recipes/diff.ts. Saved for later; nothing acted on.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | <title> is the site default (loader returns no meta); pickers do reflect the URL |
| 2 | Match system / real world | 3 | Cards speak the cook's words; the diff speaks git's (~ + − gutter, strike, underline); removed ingredients jump to the top of the list |
| 3 | User control and freedom | 2 | Any pair selectable including v3 to v3 and reversed; no swap, no stepping; focus drops to body after every picker change |
| 4 | Consistency and standards | 3 | Type system holds; the marigold chip means "being read" on the recipe page and "To" here (even for v1); 12px username inside a 14px line |
| 5 | Error prevention | 1 | Same version both sides renders a full diff of unchanged rows with no notice; reversed range accepted silently; non-numeric version gives "Version NaN not found" |
| 6 | Recognition over recall | 3 | Cards carry the snapshot; closed selects truncate the message ("v3: Chill the" at 390) |
| 7 | Flexibility and efficiency | 2 | Instant navigation on change; no step, swap or jump to a change |
| 8 | Aesthetic and minimalist design | 2 | Message in the select and the card; title, servings, cook time in both cards and again as the first three diff rows; 14 of 19 rows unchanged at full weight |
| 9 | Error recovery | 2 | Silent empty diff; bad params land on the generic 400 page with "Go Home" and no way back to the recipe |
| 10 | Help and documentation | 2 | Gutter glyphs carry no legend, title or sr text |
| Total | | 23/40 | Needs work |

## Design specificity

Specific to Fork, not to the cook's question: Bitter clay h1, mono for history, lifted panels, the chip, no shadows. But it is a developer's unified diff in cookbook clothes; a cook asks what is different and should I cook it, the page answers with the whole file marked up.

Detector: 8 findings on the page, 3 real (h1 2.125rem line 124, chip radius 3px line 183, phone h1 1.625rem line 220), 5 ramp false positives; VersionDiff.svelte was outside the scan. Overlay: only the cream-palette false positive. Console, overflow, focus rings, contrast (minimum 4.91:1; add 5.47, remove 5.44 on their tints) all clean.

## Measured

17 style combinations in main at 1280 (three faces, seven sizes); strays: 12px username in a 14px line, a 16px sans arrow between an 11px label and a 14px mono select. h1 34px vs the recipe page's 40. "To" chip 18px/600, 3px radius, 30px tall vs the bar chip 12px, 4px, 18px. Cards match DESIGN.md Panels; diff panels are 6px, transparent, 0 padding (doc says 8px, 16px, lifted). Font-swap CLS 0.07 at 1280, 0.20 at 390 (worst page on the site: almost all mono; fontsource imports, no preload). Selects truncate to 338px at 1280, 162px at 390. Replaced fractions have no whitespace in the DOM: textContent "¾½ cup"; screen readers and the clipboard get it. Back link 23px, card usernames 16px tall.

## Working

- Diff colours AA on their own tints and every change carries a non-colour cue at full opacity, as DESIGN.md locks it.
- Version cards speak the cook's language and stack from to to on the phone.
- Phone build disciplined: 16px selects at 45px, no sideways scroll, 8px rhythm.

## Priority issues

- [P1] Changes drown in context. Fix: fold runs of unchanged rows ("7 unchanged") or dim them to Ink 3; add one sans line "3 details · 3 ingredients · 2 steps changed" from the arrays already loaded.
- [P1] The diff is silent to a screen reader and wrong in the clipboard. Fix in VersionDiff.svelte: <del>/<ins>, aria-hidden on the gutter, sr-only "Changed/Added/Removed" per row, a real space or sr-only "to" between removed and added segments.
- [P2] <title> is the homepage's. Fix: return meta from +page.server.ts.
- [P2] Same-version and reversed ranges render as a normal diff; non-numeric params give "Version NaN". Fix: one line for from === to, swap or label a reversed range, validate the params.
- [P2] Focus drops to body after each picker change (goto). Fix: refocus the select after navigation.
- [P2] The marigold chip has two meanings. Pick one across the recipe bar and this page, and amend DESIGN.md's chip line.
- [P3] h1 34px and phone 26px off the ramp; chip 3px radius; Username 12px in a 14px line (font-size inherit); removed ingredients listed first (diffIngredients); copy: card "Serves"/"Prep"/"Cook" vs panel "Servings:"/"Prep time:"/"Cook time:", "Steps" vs the recipe page's "Method"; back link is the one grey link; 400 page says "Go Home" with no way back to the recipe; no ending (no "Read v3" after the last row); font-swap CLS site-wide, worst here.

## Persona red flags

Cook deciding which version: the deciding facts are spread across a mono card message, three Details rows and two 8px fraction glyphs; on 1 to 2 the chip says v2 is "To", not that v3 exists. Author checking their change: diffSteps matches by position, so inserting a step mid-method marks every later step modified; a deleted last ingredient is reported first.

## Minor observations

Plan file's 0.75rem is stale; DESIGN.md agrees with the shipped 0.875rem. "Title" appears in sans in the cards and "Title:" in mono in Details. 21 unit tests cover the markup, none the same-version state. Two adjacent links named @spencerfletcher. Photo diff row never rendered (no version changes the photo in the seed).

## Questions to consider

- Should unchanged rows be on this page at all, with "show everything" as the exception?
- Is the marigold chip "current" or "newer"? The two pages disagree and DESIGN.md says both.
- Why two selects and two cards that say the same thing? Each card's head could be the picker.
