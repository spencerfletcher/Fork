---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/+page.svelte"
target_fingerprint: "sha256:edf42bc67c58ebdfb9150b6bdc3398b9050834840fd87fb8509443227b9564eb"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/+page.svelte
timestamp: 2026-10-29T21-53-25Z
slug: src-routes-recipes-page-svelte
---
---
target: browse surfaces, final run
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
---
# Browse surfaces, final sweep (29 October 2026, third run)

Method: dual-agent (A review, B detector + polish walk; overlay skipped, shared server). Targets: /recipes, /, LandingHero, RecipeCard, TagTabs, SearchFilters, /tags/[slug], /search. Trend 27 → 30 → 31/40. Tree at b511c97.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Signed in, the navbar lights "Recipes" on /recipes and /tags/* but not on /, where the tabs' All goes; nav links set a class only, no aria-current (Navbar.svelte:26-33, 52) |
| 2 | Match system / real world | 3 | v1 and v3 unexplained; v1 on every new recipe is noise |
| 3 | User control and freedom | 4 | "Clear all" leads the row, focus is kept, every empty state has an exit |
| 4 | Consistency and standards | 3 | "Recipes" names two places signed in; filter toggles look like nav tabs; the landing's two closing links use two faces (mono 14, sans 16) |
| 5 | Error prevention | 3 | A tag-only search titles the tab "Search — Fork" |
| 6 | Recognition over recall | 3 | Cards carry no tag and no servings |
| 7 | Flexibility and efficiency | 3 | No sort |
| 8 | Aesthetic and minimalist design | 3 | 700–1099: four cards in three columns, an orphan; one meta row at three sizes (12/13/11) |
| 9 | Error recovery | 3 | "Clear filters" with tags and a query goes to /search and drops the query too |
| 10 | Help and documentation | 3 | The landing diff teaches; browse never explains vN or fork |
| Total | | 31/40 | Good |

## Evidence (B)

Detector: 3 findings, all ramp false positives (RecipeCard 192, 203 at 0.8125rem; 250 at 0.9375rem). Console clean on 56 loads and after tab click, filter press, Clear all, typing. CLS max 0.0000124. No overflow, no nested interactives, visible focus on every stop starting at "Skip to content". Lowest contrast 4.91 (the 11px count label), pressed pill 8.68. Verified: four cards (4/3/3/2 columns at 1280/1024/768/390); h1 40/37.6/33/28; "All recipes →" 26.4 at 1280, 44.4 at 390, href /recipes; filter press keeps focus (Enter and click), scrollY 0; Clear all → first tag; pressed pills 4.0px apart, first never clipped, Clear all leads at 40/18px; filter row div role=group "Filter by tag"; /tags and /search first photo eager + fetchpriority=high, rest of first row eager, alt ""; author link 25.8 at 1280, hidden below 700; empty-state hrefs follow the tabs' All (code only, states unreachable with seed); titles "My Recipes — Fork", "“cookie” — Search — Fork", "Search — Fork", "Dessert — Fork", "Recipes — Fork", landing "Fork — git-style version control for recipes"; 600 weights preloaded; meta dots CSS at ≥1024, none below, 390 row is time · version · forks; landing left edges 40/24/24/18 shared by hero, lede, diff, bar, grid; tap sizes at 390: tabs and filters 44.1, search 46.4, navbar 44.

## Priority issues

- [P1] Signed in, "Recipes" names two places: the nav's "Recipes" is My Recipes (no tabs) while browse with tabs lives at /; the nav highlight goes off on /; no aria-current on nav links. Fix: nav "Recipes" → / when signed in, active on / and /tags/*; My Recipes its own entry; aria-current="page" on nav links.
- [P2] Empty-search links 22px tall ("Clear search" 22.0×81.6, "Clear filters" 22.0×75.8) at every width: under 24 at 1280, half of 44 at 390.
- [P2] Landing 700–1099: three columns, the fourth card alone on row two, "1 fork" wraps. Fix: hide the fourth in that band or show six.
- [P2] Phone landing: about 1500px of mostly unchanged diff rows between the hero and the first food (2212 of 2770px). Fix: fold unchanged rows on the landing sample ≤699, or a phone order.
- [P3] "Open the full comparison →" is mono 14 clay at 218×23: under 24, and a link is neither history nor measurement. Fix: .arrow-link.
- [P3] Pressed filter with focus: the ring is on the button box, the pill 6px wider, so the pill's ends poke through the ring; at 390 the ring is 44px around a 24px pill.
- [P3] Landing passes index, so three below-fold photos load eagerly and the first is fetchpriority=high at 1359/2212px. Pass no index on the landing.
- [P3] "Clear filters" with q and tags drops q; the copy says "clearing some filters". Keep q or label it "Clear all".
- [P3] v1 on every unedited card; render the mark only from v2 (question).

## Cognitive load, type, personas

2 of 8 fail: progressive disclosure (phone landing diff), recognition (the same six tag words are links on /tags and toggles on /search). 9 styles in /recipes main content (14 with navbar and skip link); the meta row holds 12, 13 and 11px. Phone cook: signed-in menu "Recipes" opens My Recipes; time is the faintest text; two cookie recipes differ by 28/31 min and a mark; 800w photos into 165px slots, no srcset (201+60+134KB). First-timer: no food above the fold at any width; iPad ends on an orphan; v1 undercuts the promise.

Minor: tag-only search title names no tag; search empty state centred under a left-aligned header; author 12px in a 13px line against the Pencil Rule's "size of the line" (code and doc disagree; mono and clay not re-raised); navbar "Logout" against the "Log in" verb ("Log out"); phone tag row overflows 5px (395 vs 390) so Spicy sits flush and reads as fitting; balance gives "Thick and Chewy / Chocolate / Chip Cookies".

Questions: signed-in nav "Recipes" → / with My Recipes elsewhere (rec yes); 700–1099 hide the fourth or show six (rec hide); version mark from v2 only (rec yes).

Skipped: overlay; Enter in the search box (a submit); the no-query and tag-page empty states (unreachable with seed). Screenshots: scratchpad/wave2/browse/A and B.
