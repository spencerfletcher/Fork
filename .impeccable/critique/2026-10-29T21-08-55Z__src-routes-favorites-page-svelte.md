---
target: favorites page, end of day
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/favorites/+page.svelte"
target_fingerprint: "sha256:b63afd10b7f9b9e922b3cac9072e3809b2c5d4eb91a64e2c385092ebfbecd0c1"
target_path: /Users/spfle/Dev/Fork/src/routes/favorites/+page.svelte
timestamp: 2026-10-29T21-08-55Z
slug: src-routes-favorites-page-svelte
---
# Favorites page, end-of-day sweep (29 October 2026, second run)

Combined agent (review, detector, polish walk; overlay skipped). Trend 26 → 29/40.

| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of system status | 3 |
| 2 | Match system / real world | 3 |
| 3 | User control and freedom | 3 (redirect fixed; no unfavorite from the list) |
| 4 | Consistency and standards | 3 |
| 5 | Error prevention | 3 |
| 6 | Recognition over recall | 3 |
| 7 | Flexibility and efficiency | 3 |
| 8 | Aesthetic and minimalist design | 3 |
| 9 | Error recovery | 2 (filtered-empty message is false with zero favorites) |
| 10 | Help and documentation | 3 |
| Total | | 29/40 |

Evidence: logged out 303 to /login?redirectTo=/favorites and the hidden input carries it; title "Favorites — Fork"; with 0 favorites only the h1 and the empty line render; the search input is named; contrast lowest 4.91. Populated state not observable.

Priority issues: [P2] /favorites?q=cookie with zero favorites shows the filters and "No favorites match your filters", which is false; the loader knows favoriteIds is empty, show "No favorites yet". [P3] "Explore recipes" is 22px tall at desktop with a typed arrow; .results margin 26px off the 8px scale; the empty state does not say where favoriting happens. Persona: a cook who saved v1 sees the same card as everyone after v3 (the version-level favorites todo). Question: should the empty state say "Tap the star on any recipe".
