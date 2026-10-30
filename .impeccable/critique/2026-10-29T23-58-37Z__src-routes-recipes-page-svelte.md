---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/+page.svelte"
target_fingerprint: "sha256:edf42bc67c58ebdfb9150b6bdc3398b9050834840fd87fb8509443227b9564eb"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/+page.svelte
timestamp: 2026-10-29T23-58-37Z
slug: src-routes-recipes-page-svelte
---
---
target: browse surfaces and navbar, final run
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Browse surfaces, landing and navbar, final run of the design phase (29 October 2026, fifth run)

Method: dual-agent; overlay skipped. Tree 61dd3ab. Trend 27 → 30 → 31 → 33 → 34/40. Owner held on 30 and 56 loads.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | Gap: keyboard focus in the phone strip |
| 2 | Match system / real world | 3 | "commit message" in the lede; v3 and "1 fork" unexplained |
| 3 | User control and freedom | 4 | |
| 4 | Consistency and standards | 3 | Log out 14 beside 15; the phone menu's "New recipe" a plain row; unpressed search toggles look like browse tag links |
| 5 | Error prevention | 3 | A tag-only search titles no tag |
| 6 | Recognition over recall | 4 | The strip peeks 31px |
| 7 | Flexibility and efficiency | 3 | No sort |
| 8 | Aesthetic and minimalist design | 3 | The signed-in right cluster speaks three voices; ≥1024 the landing is ~1.5 screens before food |
| 9 | Error recovery | 4 | |
| 10 | Help and documentation | 3 | |
| Total | | 34/40 | Good |

Evidence (B): detector 8 known. Verified: last filter by keyboard at 390 scrolls into view (scrollLeft 37, pill 340–372, ring 330–382, page 390 wide; Clear all → American); the strip's third column at 359 inside 390, page stays 390 scrolled; folds 3 at 768 and 390, 0 at 1024/1280; Details display:none at 390, visible at 768, first card 1478; card author 12.1875; .btn-primary 1px transparent, boxed in forced colours, 48.75 like the ghost; navbar all-small-caps 600 0.08em, phone rows 16px/50.4. Console clean on load and after tab click, typing, filter press, Clear all; CLS ≤0.01; no overflow; smallest target 26.1 at 1280, ≥44 at 390; no nested interactives; contrast all AA (tan small caps 7.8, cream 16.55); rings on every stop; left edges 40/24/24/18; titles right per state. Type: 10 logged out at 1280, 11 signed in.

Priority issues: [P2] Keyboard focus in the phone landing strip does not scroll the strip in Chromium (scrollLeft stays 0, the focused card at 359–506 shows a sliver of ring; WebKit scrolls; explicit scrollIntoView works): fails 2.4.11 on narrow desktop Chrome or Android with a keyboard. Fix: onfocusin on .recent-strip → scrollIntoView inline/block nearest. [P3] "Log out" 14px beside 15px links (.logout-btn 0.875rem left behind by d7e9279; delete it); Log in/Sign up sit 1–2px off the left links. [P3] The phone menu does not close on Escape. [P3] The phone menu's handle is now its loudest row (15px mono lowercase beside small caps whose caps render ~11px): step it down (~0.8125rem) or accept. [P3] DESIGN.md drift: navbar sizes and "+ New Recipe". [P3, carried] no srcset (800px into 165, ~2.4× at 2× DPR); the search empty state centred under a left header; "1 fork" wraps at 768; a tag-only search names no tag; the strip flows column-first (decided).

Cognitive load: no hard failures; watch progressive disclosure at ≥1024 (decided) and the same six tag words as links and toggles. Personas: phone cook (time the only decision data at 4.91; no servings; cookie recipes differ by 28/31 and v3; titles three lines at 15px); first-timer (the lede leans on git words before the diff explains them; no food above the fold at 1359/1363/1478; ends on a quiet link with no footer and no second Sign up).

Questions: end the landing on an action too, a ghost "Sign up to fork one" beside "All recipes →" (rec yes); the phone-menu handle stepped down (rec yes); keep diff-first on desktop (rec yes).

Skipped: overlay; Enter in the search box; Log out and favorites; hover; dark mode; the vertical grids' focus scroll. Screenshots: wave4/browse/A and B.
