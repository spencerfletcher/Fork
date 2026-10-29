# Site sweeps, 29 October 2026

One Impeccable critique (scored) and one polish evidence walk per surface, run at the end of the recipe page redesign against master at 4333b53, so the next design sessions can start from a list instead of a look. Each surface's full report is a snapshot in `.impeccable/critique/`, named by date and slug; this file is the index and the cross-cutting findings. Nothing here has been acted on except where the recipe page says so.

Method: two isolated agents per surface (A design review with Nielsen heuristics, B detector plus browser overlay plus a polish walk at 1280, 1024, 768 and 390, owner and logged out), the secondary pages as one combined agent. All agents were read-only and never submitted a form. The seed limits coverage: one author, four public recipes, no favorites, no photo change between versions, so empty states and some sections were read from source.

## Scores

| Surface | Score | Snapshot | Two biggest findings |
| --- | --- | --- | --- |
| Recipe page | 29/40 | `2026-10-29T09-30-03Z__src-routes-recipes-slug-page-svelte.md` | Older version wears the latest's marigold chip; the phone bar clamps the note to seven words |
| Browse (list, card, tabs, tag page, search, landing) | 27/40 | `2026-10-29T09-35-29Z__src-routes-recipes-page-svelte.md` | Landing page has two left edges and a pre-redesign header; card meta separator strands at wrap |
| Favorites | 26/40 | `2026-10-29T09-40-13Z__src-routes-favorites-page-svelte.md` | Logged-out redirect loses the return path; search input has no accessible name |
| Editor (new, edit) | 24/40 | `2026-10-29T09-40-52Z__src-lib-components-recipes-recipeform-svelte.md` | No inline invalid state; the "Saves as v4" sentence is only beside Save, below the fold |
| Compare page | 23/40 | `2026-10-29T09-36-39Z__src-routes-recipes-slug-diff-page-svelte.md` | Changes drown in unchanged rows; the diff is silent to a screen reader and wrong in the clipboard |
| Login | 23/40 | `2026-10-29T09-40-13Z__src-routes-login-page-svelte.md` | Always-scrolling page (100dvh under the navbar); legacy card shadow; no password recovery |
| Sign-up | 22/40 | `2026-10-29T09-40-13Z__src-routes-signup-page-svelte.md` | The handle is silently the email's local part, forever; same scroll gap and shadow |
| Profile | 20/32 | `2026-10-29T09-40-13Z__src-routes-users-username-page-svelte.md` | Owner has nothing to do on their own profile; "4 recipes" twice; date in sans |

Order to work them, by payoff per hour: compare page (worst score, three known detector findings, two P1s that are mostly markup), then the shared fixes below (one change each, every page gains), then the editor's two P1s, then browse's landing page, then the auth pages together.

## Cross-cutting findings, one fix each

- **Placeholders are 3.4:1 everywhere.** There is no `::placeholder` rule in `src`; the browser default (ink at 50% alpha) is what ships, while DESIGN.md's Inputs section claims Ink 3. One rule in `src/app.css`.
- **`<title>` is the site default** on `/recipes`, the owner feed, both editor pages, the compare page, favorites, login and sign-up. Each loader returns no `meta`; the recipe, tag, search and profile pages do it right.
- **Navbar text links are 20px tall** at desktop (24px floor) and the brand and skip link are 36 and 41px on a phone (44px floor). Shared `Navbar.svelte`.
- **Nav is Title Case ("+ New Recipe", "Sign Up", "Login"), pages are sentence case** ("New recipe", "Sign in", "Create account"). Decide once.
- **Font-swap layout shift** from the fontsource imports with no preload: 0.01 on list pages, 0.03 on the landing, 0.20 at 390 on the compare page, which is almost all mono. A preload of the three faces in `app.html`, or size-adjusted fallbacks.
- **The marigold chip means two things**: "the version being read" on the recipe page, "the To side" on the compare page (even for v1), and the card uses clay text instead. DESIGN.md's chip line says both. Pick one meaning and write it down.
- **Card titles widow** ("Cookies" alone on a line) on every surface that shows cards. `text-wrap: balance` on `.card-title`.
- **Legacy card shadow** on `.auth-card`, the token DESIGN.md marks for removal.
- **DESIGN.md drift found by measurement**: Chips says 0 5px padding, both chips ship 0 6px; Panels says 8px corners and 16px padding, the diff panels are 6px and 0; the ramp lacks 2.125rem, 1.625rem, 2rem, 1.5rem, 1.1rem, 0.95rem, 0.9rem, all in use; the stacked photo crops (16:9, 21:9) and the avatar are undocumented; the Pencil Rule has no recorded exception for text under edit.

## Compare page, applied

Done 29 October 2026 after Spencer's rulings: unchanged rows dimmed to Ink 3 and a sans summary line under the h1; `<del>`/`<ins>` with a spoken "to", sr-only row prefixes and an aria-hidden gutter; `<title>` from the loader; the changed picker refocused after navigation; one line for the same version on both sides, a reversed pair redirected to older-to-newer, a 400 that says "Version not found in <recipe>" with a link back to the recipe; removed ingredients at their old position; the h1 on the recipe page's clamp, the username at the line's size, the cards and Details in the recipe page's words ("36 servings", "13 min cook"), "Method" not "Steps"; a "Read v3" link after the last row. Closed by ruling: the "To" chip stays marigold (the sparing accent, fine on To), on the system's padding and corners, at the card number's size.

## Recipe page, polish findings not yet applied

Taken on 29 October 2026, after Spencer's rulings: the two-line clamp for the note on phones; a visible strike control (a 14px Rule 2 square, clay when checked) on ingredient and method rows; header links at 44px on a phone; the sticky aside scrolling inside itself on long lists; the bar's separators drawn by CSS so no wrapped line starts or ends with one, and the measure's dots moved to Ink 3 so they can be seen; aria-hidden on the Favorite star; a stop after "Version 3, the latest"; `fetchpriority` and `decoding` on the hero photo; the tabs as pressed buttons; a site-wide marigold `::selection`. Closed by ruling, no code change: the older-version chip stays marigold, because the chip marks the version being read, not the latest (the compare page's "To" chip and the card's mark are for their own rounds); Fork stays one click with a redirect, logged out it goes to login. Decisions already made and not to revisit: method runs the full column (a 68ch cap was tried and rejected), tags are clay 600 links, the fork count stays in the byline, compare-hover highlight deferred, the current line carries no compare.

## Parked and todo (see `2026-10-28-recipe-page-critique.md` section 14)

Forks page; Fork and version-level Favorite from older versions; struck rows persisting across reload; delete `VersionStrip.svelte`; outlined Fork and Star controls; compare-hover highlight.
