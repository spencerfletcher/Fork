---
target: browse surfaces and navbar, sweep 5
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/+page.svelte"
target_fingerprint: "sha256:edf42bc67c58ebdfb9150b6bdc3398b9050834840fd87fb8509443227b9564eb"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/+page.svelte
timestamp: 2026-10-30T02-08-31Z
slug: src-routes-recipes-page-svelte
---
# Browse surfaces, landing and navbar, sweep 5 (29 October 2026)

⚠️ DEGRADED: single-context (run as one read-only reviewer subagent; A and B not isolated). Tree 27b7283. Trend 27 → 30 → 31 → 33 → 34 → 33/40. The drop is a new find, not a regression of fixed work: five of the last run's open items are fixed.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Tabbing past the phone menu's last row puts focus on page content hidden under the open menu |
| 2 | Match system / real world | 3 | "commit message" in the lede; v3 and "1 fork" unexplained |
| 3 | User control and freedom | 4 | Escape now closes the phone menu and returns focus |
| 4 | Consistency and standards | 3 | "+ New recipe" loses its box in forced colours; the right cluster's text sits 1px above the left links |
| 5 | Error prevention | 3 | A tag-only search titles no tag |
| 6 | Recognition over recall | 4 | |
| 7 | Flexibility and efficiency | 3 | No sort |
| 8 | Aesthetic and minimalist design | 3 | At 768 signed in the bar's two clusters touch; a long handle breaks the bar |
| 9 | Error recovery | 4 | |
| 10 | Help and documentation | 3 | |
| Total | | 33/40 | Good |

Previous open items: FIXED the phone strip's keyboard focus (forced overflow in the browser: the third card's focus moves scrollLeft 0 → 166, instant under reduced motion, smooth otherwise); FIXED Log out at 14px (15px small caps 600 now, like the links; hover cream; marigold ring); FIXED Escape on the phone menu (from the toggle or a row it closes and focus returns to the toggle); FIXED the handle row (13px mono, 45.4 tall, quieter than the 16px small-caps rows); FIXED DESIGN.md drift (navbar sizes, "+ New recipe", the handle step, Escape and the strip are all written down); DONE the closing "Sign up to fork one" (ghost 48.8 tall, 15px, on the column's left edge at 768/1280, centred at 390, 32px under "All recipes →", 48px from the page end). STILL OPEN the right cluster's text 1px higher than the left links (text tops 16.6 vs 17.6 at 1280); no srcset; the search empty state centred under a left h1 (centre text, h1 at 18/40); "1 fork" wraps to its own line at 768; a tag-only search titles "Search — Fork" with no tag. Decided and not re-raised: the strip flows column-first; diff-first on desktop.

Evidence: detector 8 advisory font-size hits (Navbar 88/249/268/322/356, RecipeCard 195/206/255), all sizes DESIGN.md lists under "Also in use": false positives. Overflow none at 390/768/1024/1280 on /, /recipes, /recipes?q=cookie, /tags/dessert, /users/spencerfletcher, both states, with the seed handle. Console clean. Titles right per state. First food at 1478/1363/1420/1359 on the landing (unchanged, decided). Smallest targets: tag tab "All" 15.4 wide (spacing exception), handle 26.1 tall. Rings on every stop (clay on paper, marigold in the bar). Forced colours: ghost and primary keep their 1px boxes. Seed data now has four recipes, so the 390 strip shows two full columns and no peek.

Priority issues:

[P1] The desktop bar collides at 768, iPad portrait. src/lib/components/ui/Navbar.svelte:71 and :88: the bar shows from 768 (md), and signed in "Favorites" ends at 427.8 while "@spencerfletcher" starts at 430.1, a 2.3px gap that reads "FAVORITES@spencerfletcher". Handles may be 30 characters (src/routes/signup/+page.server.ts:20); with one, simulated in the browser, "My Recipes" and "Log out" wrap to two lines, "+ New recipe" is clipped and the page scrolls sideways (scrollWidth 813 at 768). An iPad on the counter is a named context. Fix: cap the bar's handle (white-space nowrap, max-width about 14ch, text-overflow ellipsis, the full handle in the phone menu and on the profile) and give .navbar-link white-space: nowrap; or collapse the signed-in bar below 1024. Command: /impeccable adapt.

[P2] Focus leaves the open phone menu and hides under it. Navbar.svelte:171–238: the menu is drawn over a 50% scrim like a modal, but Tab past "Log out" (signed in) or "Sign up" (signed out) moves on into the page with the menu still open; the focused "American" tag tab sits at top 105 under the menu's 399px panel, invisible (fails 2.4.11), and Escape no longer closes it because focus is outside the nav. Fix: close the menu when focus leaves the nav (onfocusout on the nav, close if relatedTarget is outside it). Command: /impeccable harden.

[P3] "+ New recipe" loses its box in forced colours. Navbar.svelte:262: .nav-cta has no border, so with the fill stripped it reads as one more link beside "Log out". Fix: the 1px transparent border .btn-primary carries (padding 6px 13px to keep the size). Command: /impeccable polish.

[P3] The no-photo panel disappears in forced colours. src/lib/components/recipes/RecipeCard.svelte:168: the clay-tint panel has no border, so "Weeknight Red Lentil Dal" floats in a blank 4:3 hole beside three photos. Fix: a 1px transparent border on .card-panel. Command: /impeccable polish.

[P3, carried] the right cluster 1px high; no srcset; the search empty state centred; "1 fork" wraps at 768; a tag-only search names no tag.

Cognitive load: no hard failures. The signed-in bar holds nine stops (four links, handle, Log out, the action) at 768 in 720px, which is where it breaks.

Personas: iPad cook at 768 signed in (the bar's links run into the handle; a longer handle scrolls the page sideways); keyboard user on a phone-width window (Tab off the menu's end lands under it, Escape stops working); forced-colours user (the bar's one action looks like a link; the panel card is a hole); first-timer (the landing now ends on "Sign up to fork one", so it ends on an action).

Questions: below 1024 signed in, cap the handle with an ellipsis or collapse to the phone menu (rec: cap, the smaller change); close the phone menu when focus leaves it, or trap focus inside it (rec: close, it matches the overlay-click behaviour).

Skipped: overlay injection; Log out, forms and favorites (read-only); dark mode. Screenshots and scripts: wave5/browse.
