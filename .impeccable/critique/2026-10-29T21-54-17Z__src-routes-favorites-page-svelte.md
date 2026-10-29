---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/favorites/+page.svelte"
target_fingerprint: "sha256:215a6f07af1ce464e0d2288190f01a57b3ab15560d9ff0e327c05a4c9fc19f2a"
target_path: /Users/spfle/Dev/Fork/src/routes/favorites/+page.svelte
timestamp: 2026-10-29T21-54-17Z
slug: src-routes-favorites-page-svelte
---
---
target: favorites, final run
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Favorites, final sweep (29 October 2026, third run)

Combined A+B on Opus; overlay skipped. Trend 26 → 29 → 30/40. Tree at b511c97.

Evidence: logged out 303 to /login?redirectTo=/favorites and the hidden input carries it; owner with zero favorites, also with ?q=zzz&tags=dessert: no filters, "No favorites yet. Tap the star on any recipe. Explore recipes →" (28d73b7 verified); the link 26.4 at 1280, 44.4 at 390, href /; title "Favorites — Fork"; contrast 4.91; 4 type styles; the populated list and the 24px results margin unseen (0 favorites, toggling forbidden; margin checked in source). Console clean, CLS 0, no overflow.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | |
| 2 | Match system / real world | 3 | |
| 3 | User control and freedom | 3 | |
| 4 | Consistency and standards | 3 | |
| 5 | Error prevention | 3 | |
| 6 | Recognition over recall | 3 | |
| 7 | Flexibility and efficiency | 3 | |
| 8 | Aesthetic and minimalist design | 3 | |
| 9 | Error recovery | 3 | Now true with zero favorites |
| 10 | Help and documentation | 3 | |
| Total | | 30/40 | |

Strengths: the empty state is honest and gives a way on; the redirect round trip works. Cognitive load 8/8.

Priority: [P2] the phone menu gives no current state for Favorites (navbar); [P3] the centred empty line under a left-aligned h1, two alignment axes; [P3] "Tap" is a touch verb shown to mouse users. Persona: a cook who saved v1 sees the same card as everyone after v3 (version-level favorites, parked). Question: should the empty state sit left-aligned under the h1?

## Navbar (shared finding, all pages)

Wordmark 44.3px; desktop links 28, handle and Logout 31.1, "+ New recipe" 37.1; phone icon and toggle 44, menu rows 48.8; tan on espresso 7.80:1; aria-current=page on the handle on the owner's own profile in both bar and phone menu, absent elsewhere.
- [P2] The handle in the phone menu is 153×21: the 12px padding sits on the wrapping div, not the link. Fix: padding on the link, display block, like .mobile-link.
- [P2] Current state is uneven: the handle gets aria-current but no visual change (stays tan) while a current nav link turns cream without aria-current; the phone menu shows neither. Fix: aria-current on active links in both lists, and [aria-current=page] cream in Username's on-dark style.
- [P3] The handle's focus ring is clay 3.08:1 where every other bar stop is marigold 8.75:1: nav :focus-visible does not reach the Username component. Fix: nav :global(:focus-visible).
- [P3] On /login and /signup the matching nav link is not marked current.

Screenshots: scratchpad/wave2/secondary/favorites-*.png.
