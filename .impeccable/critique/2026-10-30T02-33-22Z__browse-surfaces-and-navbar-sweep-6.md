---
target: browse surfaces and navbar, sweep 6
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/browse surfaces and navbar, sweep 6"
timestamp: 2026-10-30T02-33-22Z
slug: browse-surfaces-and-navbar-sweep-6
---
# Browse surfaces, landing and navbar, sweep 6 (29 October 2026)

⚠️ DEGRADED: single-context (run as one read-only reviewer subagent; A and B not isolated). Tree 81b69ec. Trend 27 → 30 → 31 → 33 → 34 → 33 → 34/40. The last run's P1, P2 and both forced-colour P3s are fixed; one new P2 comes from the fix for the P1.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 4 | Tab past the phone menu's last row now closes it; the focused card shows |
| 2 | Match system / real world | 3 | "commit message" in the lede; v3 and "1 fork" unexplained |
| 3 | User control and freedom | 4 | Escape, overlay click and focus-out all close the phone menu |
| 4 | Consistency and standards | 3 | The right cluster's text still sits 1px above the left links; the handle 1.6px lower again |
| 5 | Error prevention | 3 | A tag-only search titles no tag |
| 6 | Recognition over recall | 4 | |
| 7 | Flexibility and efficiency | 3 | No sort |
| 8 | Aesthetic and minimalist design | 3 | 768–1023 clips the owner's own handle to "@spencerflet…"; at 768 the handle sits nearer the links than they sit to each other |
| 9 | Error recovery | 4 | |
| 10 | Help and documentation | 3 | |
| Total | | 34/40 | Good |

Previous open items: FIXED the bar collision at 768 (seed handle: Favorites ends 427.8, handle starts 445.8, an 18px gap; with an injected 30-character handle the same 18px, Log out one line at 32.8 tall, "+ New recipe" whole to 744, scrollWidth 768; at 1024 and 1280 the 30-char handle ellipsises at 22ch and the seed handle shows whole); FIXED focus leaving the phone menu (signed in Log out → Tab → "Thick and Chewy…" at top 161 with the menu closed; signed out Sign up → Tab → the "All" tag tab, closed; Shift+Tab from the toggle to the search icon keeps it open, as it should; a click on the panel's padding keeps it open); FIXED "+ New recipe" in forced colours (1px solid border, boxed beside Log out); FIXED the no-photo panel in forced colours (1px border, "Weeknight Red Lentil Dal" sits in a box like the photos). STILL OPEN the right cluster 1px high (text tops 17.6 links, 16.6 Log out / Log in, 19.2 handle, 17.5 CTA at 1280); no srcset; the search empty state centred under a left h1 (text-align centre, box left 40 = h1 left 40); "1 fork" wraps to its own line at 768 (screenshot in-768-_); a tag-only search titles "Search — Fork". Decided and not re-raised: the strip flows column-first; diff-first on desktop.

Evidence: detector 8 advisory font-size hits (Navbar 96/260/282/336/385, RecipeCard 198/209/258), all sizes DESIGN.md lists under "Also in use": false positives. Overflow none at 390/768/1024/1280 on /, /recipes, /recipes?q=cookie, /tags/dessert, /users/spencerfletcher, both states. Titles right per state. First food at 1478/1363/1420/1359 on the landing (unchanged, decided). Smallest targets: tag tab "All" 14.8–15.4 wide (spacing exception), handle 26.1 tall. Rings on every stop (clay on paper, marigold in the bar; the sweep's two "no ring" hits are the body after focus leaves the document). Escape from the toggle or a row closes and returns focus to the toggle. Strip at 390: four cards fit two columns, no scroll; with overflow forced in the browser the third card's focus moves scrollLeft 0 → 166, scroll-behavior auto under reduced motion, card zoom transition 1e-5s. /recipes ignores ?q (same page as /recipes): harmless, nothing links to it.

Priority issues:

[P2] The owner's own handle is clipped on an iPad. src/lib/components/ui/Navbar.svelte:370–375: below 1024 the bar's handle is capped at 14ch, so the 16-character seed handle reads "@spencerflet…" at every width from 768 to 1023, even at 900 where the bar has 150px to spare and at 1023 with 273px. The cap was sized for a 30-character worst case and now costs the common case. Fix: drop the breakpoint cap and let the handle shrink only when the bar runs out: keep max-width 22ch, give the handle's wrapper and .navbar-account min-width: 0 and flex-shrink: 1, and the left cluster flex-shrink: 0; the 16px gap stays the floor. At 768 the seed handle would lose two or three characters, at 800 and up it shows whole. Command: /impeccable adapt.

[P3] At 768 the handle joins the left group. Navbar.svelte:77 and :95: the links sit 24px apart (gap-6) but Favorites to the handle is 18px, so the handle reads as a fifth link and the two clusters lose their split. Trade-off: widening the cluster gap costs handle characters at 768. Fix: with the P2 fix in place, raise the cluster gap to 24px (gap-6) so the boundary is at least the in-group spacing. Command: /impeccable layout.

[P3, carried] the right cluster 1px high (handle 1.6px low); no srcset; the search empty state centred; "1 fork" wraps at 768; a tag-only search names no tag.

Cognitive load: no hard failures. Signed-in bar at 768: nine stops in 720px, now on one line.

Personas: iPad cook at 768–1023 signed in (bar fits, but their own name is cut short; a hover title holds it whole, which a touch user never sees); keyboard user on a phone-width window (Tab off the menu closes it and lands on visible content; Escape and Shift+Tab behave); forced-colours user (the bar's action is a box again; the no-photo card is a box); first-timer (landing ends on "Sign up to fork one").

Questions: below 1024, a flexible handle that shrinks only when the bar is full, or the fixed 14ch cap (rec: flexible, the owner's own handle shows whole from 800 up).

Skipped: overlay injection; Log out, forms and favorites (read-only); dark mode. Screenshots and scripts: wave6/browse.
