---
target: browse surfaces and navbar, sweep 7
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/browse surfaces and navbar, sweep 7"
timestamp: 2026-10-30T04-04-55Z
slug: browse-surfaces-and-navbar-sweep-7
---
# Browse surfaces, landing and navbar, sweep 7 (29 October 2026)

⚠️ DEGRADED: single-context (run as one read-only reviewer subagent; A and B not isolated; no question tool, so the brief stands in for the interview). Tree 9014834. Trend 27 → 30 → 31 → 33 → 34 → 33 → 34 → 34/40. Both sweep 6 items are fixed. The score holds because this sweep found two new P2s in search. Neither is a regression.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The search box's native × empties the box, but the results and the URL stay on the old query |
| 2 | Match system / real world | 3 | The search box says "by title" but also matches descriptions and ingredients; "commit message", v3 and "1 fork" are unexplained |
| 3 | User control and freedom | 4 | Escape, overlay click and focus-out all close the phone menu |
| 4 | Consistency and standards | 3 | Text in the right cluster still sits 1px above the links, and the handle sits 1.6px below them |
| 5 | Error prevention | 3 | A tag-only search names no tag |
| 6 | Recognition over recall | 4 | |
| 7 | Flexibility and efficiency | 3 | No sort |
| 8 | Aesthetic and minimalist design | 4 | The bar is composed at every width from 768 to 1280; what remains are P3s |
| 9 | Error recovery | 4 | |
| 10 | Help and documentation | 3 | The ingredient search is undiscoverable |
| Total | | 34/40 | Good |

Previous open items:
- FIXED: the owner's handle clipped on an iPad. The seed handle now shows whole from 800 up (126px at 800, 850, 900, 1023, 1024 and 1280). Only at 768, where the bar really is full, does it shrink to "@spencerflet…" (104.2px). An injected 30-character handle ellipsises at 22ch (173.2px) from 850 up and shrinks to 136.2 at 800 and 104.2 at 768. scrollWidth equals the viewport everywhere. Log out stays on one line at 32.8, and "+ New recipe" ends at viewport − 24.
- FIXED: the handle joining the left group. Favorites to the handle measures 24.0 at 768 with either handle, equal to the 24px between links. The mono lowercase face does the rest of the separating.
- STILL OPEN: the right cluster sits 1px high. Text tops at every width are 17.6 for the links, 16.6 for Log out and Log in, 19.2 for the handle and 17.5 for the CTA.
- STILL OPEN: no srcset (RecipeCard.svelte has 0 hits).
- STILL OPEN: the search empty state is centred under a left-aligned h1 (text-align center; the box's left edge equals the h1's at 18 and 40).
- STILL OPEN: "1 fork" wraps at 768 (meta row 48 tall, against 21 at 900).
- STILL OPEN: a tag-only search titles "Search — Fork" and its h1 is "Search".
- Decided and not raised again: the strip flows column-first; diff-first on desktop.

Evidence: The detector reports the same 8 advisory font-size hits (Navbar 96/260/282/336/379, RecipeCard 203/214/264). All are sizes DESIGN.md lists, so all are false positives. No overflow at 390, 768, 900, 1024 or 1280 on /, /recipes, /recipes?q=cookie, /tags/dessert or /users/spencerfletcher, signed in or out. Page titles are right in each state. First food sits at 1478/1363/1366/1420/1359 on the landing page, unchanged and decided. Phone menu by keyboard: the toggle is the 4th Tab stop, Enter opens it, Tab reaches Recipes with a marigold ring, and Escape from the toggle or a row closes it and returns focus to the toggle. Tabbing past Log out lands on the first card with the menu closed; signed out, Sign up tabs on to the "All" tag. The strip at 390: all four cards are in view with scrollLeft 0. Under reduced motion scroll-behavior is auto and the card transition is 1e-5s. Every focus stop has a ring (the 40-Tab sweep's two "misses" are the body after focus leaves the document). Focus on a truncated handle draws a full 2px marigold box (overflow hidden is on the element itself, so its outline is not clipped). Search: Enter submits and focus stays in the box. "cookie" finds 2, "garam" 1 (Chicken Tikka Masala), "cumin" 2 (Dal, Tikka), "zzzqqq" 0 with "Clear search".

Priority issues:

[P2] The search box hides its best trick. src/lib/components/ui/SearchFilters.svelte:101–102 set the placeholder and aria-label to "Search recipes by title…", but the server (src/routes/search/+page.server.ts:40–55) also matches descriptions and ingredient names in any version, and its own meta description says "name, description or ingredient". "garam" returns Chicken Tikka Masala with no "garam" anywhere on the card, so the hit looks like a bug, and a cook with a lentil to use up is never told to try typing it. PRODUCT.md lists ingredient matching as a capability. Fix: placeholder "Search by name or ingredient…" and the aria-label to match. Command: /impeccable clarify.

[P2] Clearing the box doesn't clear the search. SearchFilters.svelte:98–103: type=search draws a native × in Chrome and Safari. Pressing it empties the field, but nothing listens, so /search?q=garam keeps showing "1 recipe" under an empty box (verified: value "", URL still ?q=garam, 1 card). The box and the results now disagree. Fix: add `onsearch` (or `oninput` when the value becomes "") that calls applyFilters(). Then restyle ::-webkit-search-cancel-button in ink or clay, because Chrome draws it in its default blue, the only blue on the site (screenshot search-garam-390). Command: /impeccable harden.

[P3] Forced colours lose "you are here". app.css:553 gives every .tag-tabs link a transparent 2px border-bottom, and forced colours paint it, so every tab gets the underline that marks the current one; only the bold weight on "All" or "Dessert" is left. In the bar, Navbar.svelte:352–355 marks the current link by colour alone (cream against tan), and forced colours flatten that to LinkText, so Recipes looks the same as its neighbours (screenshot forced-in-1280). Fix: in @media (forced-colors: active), set the non-current tabs' border-bottom-color to Canvas, and give `.navbar-link[aria-current='page']` a text-decoration underline. Command: /impeccable harden.

[P3, carried] The right cluster sits 1px high (the handle 1.6px low); no srcset; the search empty state is centred; "1 fork" wraps at 768; a tag-only search names no tag.

Minor: the page behind the open phone menu still scrolls (body overflow visible) under the 50% scrim. It's harmless, because the bar stays put.

Cognitive load: no hard failures. The signed-in bar at 768 has nine stops on one line.

Personas:
- iPad cook, 768–1023, signed in: their own handle now shows whole from 800 up.
- Cook with leftovers on a phone: types "lentils", which works, but nothing told them it would, and the × leaves stale results.
- Forced-colours user: can't tell which tag tab or which bar link is the current page.
- Keyboard user: the menu, Escape and the strip all behave.

Questions: should the search box name ingredients? (rec: yes, "Search by name or ingredient…"; it is the feature PRODUCT.md calls out).

Skipped: overlay injection; Log out, forms, favourites and saves (read-only); dark mode. Screenshots and scripts are in wave7/browse.
