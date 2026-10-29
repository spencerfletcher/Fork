---
target: favorites page
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/favorites/+page.svelte"
target_fingerprint: "sha256:a2b1d1c13a0a221e4ddb6056ae693a31aee2015b36e3d620aaccb9a5c01ecc9c"
target_path: /Users/spfle/Dev/Fork/src/routes/favorites/+page.svelte
timestamp: 2026-10-29T09-40-13Z
slug: src-routes-favorites-page-svelte
---
# Favorites page, /favorites (29 October 2026 sweep)

Method: single combined agent (design review, detector, overlay, polish walk). Target: src/routes/favorites/+page.svelte and src/lib/components/ui/SearchFilters.svelte. Saved for later; nothing acted on. The owner has no favorites in the seed, so only the empty state was observed; populated and filtered-empty states read from source.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Tab title is the generic site title; no meta from the loader |
| 2 | Match system / real world | 3 | Plain copy |
| 3 | User control and freedom | 2 | Logged-out redirect drops the return path; no unfavorite from the list |
| 4 | Consistency and standards | 3 | Same header, search and grid as Search and tags |
| 5 | Error prevention | 3 | Private recipes filtered server-side |
| 6 | Recognition over recall | 2 | A search box over an empty list invites a query with nothing to find |
| 7 | Flexibility and efficiency | 3 | Title search plus tag filter; chips from the full set |
| 8 | Aesthetic and minimalist design | 2 | Search box shown with 0 favorites; the empty state floats |
| 9 | Error recovery | 3 | Filtered-empty copy is specific |
| 10 | Help and documentation | 3 | Empty state links out |
| Total | | 26/40 | Solid |

## Design specificity

2 of 5: the Search page with a different h1. Nothing says "the recipes you cook from"; no "favorited v2, now at v4" mark, which is the one thing a versioned cookbook could show here (and ties to the version-level favorites todo). Overlay: placeholder contrast 3.4:1 (no ::placeholder rule anywhere in src, so browser default, not the Ink 3 DESIGN.md claims; global). Console, overflow, focus, text contrast clean.

## Priority issues

- [P1] Logged out, /favorites redirects to /login with no redirectTo; after signing in the user lands on home. Fix: one string in the loader, mirroring the recipe page.
- [P1] The search input has no accessible name (type=search with only a placeholder; shared with Search and tag pages). Fix: an aria-label prop or a visually hidden label.
- [P2] Generic <title>; return meta like the profile does.
- [P2] Filters render above an empty set; gate SearchFilters on favorites existing or a filter being active.
- [P3] Placeholder 3.4:1 (global ::placeholder rule missing); "Explore recipes" link 22px tall and a literal arrow glyph; .results margin 26px off the 8px scale.

## Persona and question

A cook who favorited a recipe at v1 and returns after v3 sees the same card as everyone; the thing they saved is gone and nothing says so. Is Favorites a list or a cookbook? If it is where someone cooks from, why does it look like Search, and why can a favorite not pin the version they cook?
