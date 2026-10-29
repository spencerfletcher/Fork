---
target: browse surfaces, end of day
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/+page.svelte"
target_fingerprint: "sha256:edf42bc67c58ebdfb9150b6bdc3398b9050834840fd87fb8509443227b9564eb"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/+page.svelte
timestamp: 2026-10-29T21-08-54Z
slug: src-routes-recipes-page-svelte
---
# Browse surfaces, end-of-day sweep (29 October 2026, second run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped). Targets: /recipes, /, LandingHero, RecipeCard, TagTabs, SearchFilters, /tags/[slug], /search. Trend 27 → 30/40.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Signed in, "/" is all recipes with no nav item lit; nav "Recipes" goes to "My Recipes" |
| 2 | Match system / real world | 3 | v3, v1, 1 fork unexplained on the card |
| 3 | User control and freedom | 3 | "Clear all" off-screen at the end of the scrolling filter row on a phone; "Clear filters" on a query-only miss clears the query |
| 4 | Consistency and standards | 3 | The landing hero sets its own h1 size (56/44px) against the one-clamp rule; lede 1.05rem off the ramp; tag and search grids still lazy |
| 5 | Error prevention | 3 | Bare /search lists everything |
| 6 | Recognition over recall | 3 | Cards carry no tag |
| 7 | Flexibility and efficiency | 3 | No sort |
| 8 | Aesthetic and minimalist design | 3 | The landing grid shows three cards in a four-column row; two clay mono styles side by side in the meta |
| 9 | Error recovery | 3 | Empty states have exits; labels do not always match what the link does |
| 10 | Help and documentation | 3 | The landing diff teaches; browse never does |
| Total | | 30/40 | Good |

## Evidence

Detector: 2 real (hero 3.5rem and 2.75rem), 3 ramp false positives; the lede's 1.05rem missed. Console clean, no overflow, no nested interactives, focus rings on every stop, contrast lowest 4.91:1, meta dots by CSS at desktop and none below 1024 with no stranded separator, titles balance and clamp, tabs 44px on phones, landing on one 40px edge, CTA to /recipes, titles set, h1 28px on phones everywhere but the landing. CLS 0.0001 (600 weights not preloaded).

## Priority issues

- [P1] The landing shows three recent cards in a four-column grid: a hole at 1280, an orphan at 390. Fix: slice to four.
- [P2] Pressing a search filter throws keyboard focus to body (goto without keepFocus). Fix: keepFocus, or refocus the pressed button.
- [P2] First-row photos on /tags and /search are lazy with no fetchpriority: those pages do not pass index to RecipeCard.
- [P2] The landing ending is quieter than its middle: "All recipes" is a 22px sans link with no arrow where every other closing link ends in one. Fix: a ghost button or the arrow form at 44px.
- [P2] Pressed filter pills touch each other (gap minus the pull-back is 0); "Clear all" is cut off on a phone; the pressed first pill sits on the clip edge.
- [P2] Landing hero h1 at 56/44px: either record it as the display exception in DESIGN.md or put it on the clamp. Spencer's call.
- [P3] Targets under 24px at desktop: card author link 20px, "All recipes" 22, "Clear filters" 22, "Open the full comparison" 23, navbar username 23. Title case drift: title "My recipes" vs h1 "My Recipes", "search" lowercase in search titles. Empty-state hrefs: "All recipes" should use the tabs' allHref (signed in it lands on My Recipes); the tag page's "Explore all" goes to the landing when logged out. Panel titles do not balance. eager = index < 4 ignores the column count. The filter row is a nav landmark holding toggles (role=group fits). Redundant tabindex on the stretched link. DESIGN.md Do's still say counts and grams in mono.

## Personas and questions

Phone cook: time is the greyest text, no servings on the card, the Dal panel pulls attention from the food. First-timer: no food in the hero, the first photo at 2247px on a phone, then an orphan card and a small link. Questions: four recent cards or a row count per width; fold the landing diff's unchanged rows on a phone; is the hero's 56px a deliberate exception.
