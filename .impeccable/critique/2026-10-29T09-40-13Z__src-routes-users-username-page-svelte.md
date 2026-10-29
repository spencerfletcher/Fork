---
target: profile page
total_score: 20
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 1
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/users/[username]/+page.svelte"
target_fingerprint: "sha256:ee5da00ec5d8dcb4a669ba2080e7a7cf421cb226772f72d2865c775e465b0673"
target_path: /Users/spfle/Dev/Fork/src/routes/users/[username]/+page.svelte
timestamp: 2026-10-29T09-40-13Z
slug: src-routes-users-username-page-svelte
---
# Profile page, /users/[username] (29 October 2026 sweep)

Method: single combined agent (design review, detector, overlay, polish walk) for the secondary pages. Target: src/routes/users/[username]/+page.svelte. Saved for later; nothing acted on. Seed has one profile with 4 public recipes; the empty state was not observable.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Title "@spencerfletcher — Fork"; active nav |
| 2 | Match system / real world | 3 | "8 commits" is git vocabulary on a cookbook page |
| 3 | User control and freedom | 2 | The owner has nothing to do on their own profile |
| 4 | Consistency and standards | 2 | "Member since" date is sans (Pencil Rule says dates are mono); the avatar is undocumented |
| 5 | Error prevention | n/a | No inputs or destructive actions |
| 6 | Recognition over recall | 3 | Cards reuse the site's one card |
| 7 | Flexibility and efficiency | 2 | No sort or filter |
| 8 | Aesthetic and minimalist design | 2 | "4 recipes" twice within 40px; title widows |
| 9 | Error recovery | n/a | No error paths |
| 10 | Help and documentation | 3 | Empty-state copy exists |
| Total | | 20/32 | Solid (5, 9 n/a) |

## Design specificity

2 of 5: paper, clay handle and mono stats are Fork; the circle-initial avatar is the generic profile shape and nothing says "cookbook with history" beyond the word commits. Two clay serifs side by side (h1 40 and avatar 32) compete. Detector: 4 advisories, 2 real (avatar 2rem and 1.5rem off the ramp, undocumented element), 1 false positive (0.875rem), 1 borderline (phone h1 1.625rem). Overlay: card-title widows ("Cookies") on two cards. Console, overflow, focus, contrast clean.

## Priority issues

- [P1] Owner has nothing to do here: no edit, no private-recipe view. Fix: when the viewer is the owner, one line under the stats ("You also have 2 private recipes") or a ghost "Edit profile" link.
- [P2] "4 recipes" rendered twice (stats line and the eyebrow 40px below). Drop one.
- [P2] "Member since" is sans; make it mono beside the stats or fold it into the stats line.
- [P3] Avatar sizes off the ramp and undocumented: document in DESIGN.md or drop it. Card title widows: text-wrap: balance on .card-title (shared). Phone h1 1.625rem vs the doc's 1.75rem.

## Persona and question

A home cook reads "8 commits" and does not know if that is good; "8 edits" or "8 versions saved" would land. If a profile is just recipes by this person, why is it a page rather than a filter, and what would make it worth a visit: a bio, a pinned recipe, the forks of their recipes?
