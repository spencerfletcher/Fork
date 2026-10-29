---
target: "browse surfaces: list, card, tabs, tag page, search, landing"
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/+page.svelte"
target_fingerprint: "sha256:c7fec39b123961ede1cb19e3ebf340f2a65f1cb49b6a23cdc7e81e4a19aa2eb9"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/+page.svelte
timestamp: 2026-10-29T09-35-29Z
slug: src-routes-recipes-page-svelte
---
# Browse surfaces: recipe list, card, tag tabs, tag page, search, landing (29 October 2026 sweep)

Method: dual-agent (A design review, B detector + overlay + polish walk). Targets: src/routes/recipes/+page.svelte, src/lib/components/recipes/RecipeCard.svelte, src/lib/components/ui/TagTabs.svelte, src/routes/tags/[slug], src/routes/search, src/routes/+page.svelte. Saved for later; nothing acted on. Seed has 4 public recipes by one author, so "Most forked" and "All recipes" sections and the owner empty state were not observable.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Signed in, nav "Recipes" lands on "My Recipes" with no other cue it is scoped to you; /recipes and the owner feed carry the generic <title> |
| 2 | Match system / real world | 3 | "v3", "1 fork", "Most forked" unexplained on the card; nav "Recipes" vs h1 "My Recipes" |
| 3 | User control and freedom | 2 | Landing CTA "Browse recipes" goes to an empty search form; empty search offers no clear or browse-all action |
| 4 | Consistency and standards | 2 | Landing has two left edges (64 vs 40) and the pre-redesign "Recipes / Recipes worth forking." header; card version mark is clay text while the recipe page's is a marigold chip; card author mono while the byline is sans; search filters look like browse tabs but toggle |
| 5 | Error prevention | 3 | Read-only; no guard on an empty query beyond the placeholder |
| 6 | Recognition over recall | 3 | Cards show no tag; a Dinner card is only dinner inside the Dinner tab |
| 7 | Flexibility and efficiency | 3 | Tabs, search, multi-tag filter; no sort, no "see all" from the landing |
| 8 | Aesthetic and minimalist design | 3 | Card meta line: four styles, identical "@spencerfletcher" on every card |
| 9 | Error recovery | 2 | Empty search copy generic and actionless |
| 10 | Help and documentation | 3 | The landing's live diff explains the product; browse never says what v3 means |
| Total | | 27/40 | Solid |

## Design specificity

Quietly Fork: the no-box card on paper with a Bitter title and the clay no-photo panel with the serif name bottom-left are distinct. On a photo card the only Fork mark is an 11px "v3" and an optional "1 fork", the smallest things on the card. The version mark is the signature on the recipe page and a footnote on the card.

Detector: 3 findings; 1 real (text-[1.1rem] on the owner empty state, src/routes/recipes/+page.svelte:22, off the ramp), 2 ramp false positives. Overlay: unbalanced card headings (one-word second line "Cookies") and a skipped heading on the owner list (h1 to h3, no h2 eyebrow); cream palette false positive. Console, overflow, nested interactives, focus rings, contrast (minimum 4.91:1) all clean.

## Measured

Grid 4/3/2 columns at 1280/768/390, 24px gap, cards exactly 4:3. Card type: Bitter 500 17px title (15 on phone), author JetBrains Mono 400 12px clay (hidden under 700), time and fork count Source Sans 400 13px Ink 3, version JetBrains Mono 600 11px clay. Browse page 9 style combinations (15 with chrome); landing 23. Browse gutter 40px matches the recipe page; the landing hero and diff sit at 64. h1 40px at every width including 390 (DESIGN.md says about 1.75rem on phones). Tag tabs 29px tall, bleed to the phone edge, page never scrolls sideways. Card photos all loading="lazy" including above the fold; no fetchpriority. CLS 0.012 at 390 from Bitter loading (3-line titles vs 2 in the fallback), landing 0.03; all under 0.1.

## Working

- The card with no box: the grid reads as one printed page; 4:3 photo at 6px is the only shape; hover scale 1.03 plus clay title is proportionate.
- The no-photo panel: same box, clay serif name bottom-left, 4-line clamp holds in a mixed grid.
- Tag tabs on the h1 baseline with aria-current, keyboard reaches every tab, no sideways page scroll.

## Priority issues

- [P1] Landing continuity: two left edges, the pre-redesign header under the diff (src/routes/+page.svelte lines 73-80), CTA to /search. Fix: browse header pattern and gutter for the landing grid, drop the extra padding-inline on the hero and diff section, point "Browse recipes" at /recipes, close with "All recipes".
- [P1] Meta separator strands at wrap (768: "@spencerfletcher · 28 min · v3 ·" then "1 fork"). Fix: separator inside the item or nowrap pairs.
- [P2] One version mark, not two: card clay mono text vs recipe page marigold chip. Try the chip at 0.6875rem on a 20-card mock before deciding, or record the card's text form in DESIGN.md.
- [P2] Demote the card author: mono clay, the loudest meta style, identical on every card, contradicts the sans byline decision. Fix: Source Sans 13px Ink 3, still a link.
- [P2] Search empty state and filter affordance: add "Clear filters" or "Browse all recipes"; give the toggles a pressed look that is not the current-page underline. Also the no-query empty state is unreachable (/search with nothing shows every recipe).
- [P3] Phone h1 40px vs DESIGN.md 1.75rem; tag tabs 29px on a phone; photo-card titles have no clamp while panel titles clamp at 4; card author link 20px tall at desktop; <title> generic on /recipes and the owner feed; search input has no label (placeholder only); accessible name triplication per card (aria-label, alt, h3); owner list skips h2; "My Recipes" Title Case; placeholder uses "..." not an ellipsis.

## Persona red flags

Cook choosing dinner on a phone: four cards above the fold, but the time is the greyest item and v3 and 1 fork mean nothing to her; tabs 29px; no cue the tab row scrolls; no servings on the card. First-time visitor on the landing: the diff is the peak; the end is a leftover header, three cards and no closing action; the primary CTA lands on an empty search; 2500px of monospace before food at 390.

## Minor observations

Signed in, "/" is browse-everything with no nav label. Search filters have no "All". .meta-sep carries the meta-author class as a hack. tabindex="0" on the stretched anchor is redundant. DESIGN.md's card line says mono meta row in Ink 3 while the ramp says 0.8125rem sans; the implementation is sans with two mono items. Desktop tag tabs with many tags would clip at the gutter with no affordance. After a tag-tab client navigation focus lands on body.

## Questions to consider

- If every card says @spencerfletcher, what is the author line for until there is a second author?
- Is the version mark the card's signature or a footnote? The recipe page and the card disagree.
- Should the logged-out home end on the grid? Food first, proof second would put a photo above the fold and give the page an ending.
