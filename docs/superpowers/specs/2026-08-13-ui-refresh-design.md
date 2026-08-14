# UI refresh — design

Status: approved, not implemented.

## Context

The site's visual language is not generic — cream/espresso/amber with Lora, Instrument
Sans, and JetBrains Mono is a deliberate point of view, and the diff page is the
strongest screen in the product. The complaint that it "looks a little AI" comes from
three specific things, none of which are the palette:

1. **One accent does every job.** `--color-tag` is `#e8a83a`; `--color-accent` is
   `#e8a83a`. Tags, the Forked badge, version numbers, and the primary "New Recipe"
   button are the same colour by construction, so nothing has hierarchy. A passive tag
   chip reads with the same weight as the main call to action. Uniform accent
   application with no hierarchy is the actual tell.
2. **The landing page never states the premise.** Above the fold: nav, the word
   "Recipes", a grid. Version control is invisible until a visitor opens a recipe and
   scrolls a sidebar.
3. **The best feature is tertiary.** Version history is the third sidebar card, below
   the photo and a Details box.

Investigation also surfaced three defects worth fixing regardless of visual direction.

## Goals

- Serve two audiences without compromising either: a recruiter who needs to understand
  the project in under a minute, and a home cook who wants to read a recipe.
- Establish visual hierarchy so the accent means something.
- Promote version control from metadata to a first-class element.
- Fix the defects found during investigation.

## Non-goals

- No new palette, typeface, or wholesale reskin. The aesthetic is working.
- No features from the roadmap. Pull requests, comments, following, and collections stay
  out of scope; this is presentation and correctness only.
- No dark mode. Tokens are structured for it, but it is not part of this work.

## Decision: split the homepage by auth state

Logged-out `/` becomes a landing page stating the premise. Logged-in `/` stays the feed.
This is how GitHub resolves the same tension, and it means neither audience pays for the
other: a recruiter never has to infer the product from a recipe grid, and a cook never
sees marketing copy.

---

## Section 1 — Accent hierarchy

**Rule: amber means action or version identity. Everything else is quiet.**

### Token changes (`src/app.css`)

The tag system currently aliases the accent. Give it its own quiet values:

```css
/* Tag system — quiet by default. Amber is reserved for actions and versions. */
--color-tag: var(--color-text-2); /* #6b5a3a — label text */
--color-tag-border: #ddd0b4; /* hairline */
--color-tag-hover-bg: #f3ead6; /* subtle warm fill on hover */
```

`--color-tag-pale` is removed. It is declared three times — the `@theme inline`
registration, the `:root` light value, and the `[data-theme='dark']` override at
`app.css:183` — and all three must go together, along with its two consumers below. A
dangling reference renders `transparent` silently.

`--color-paprika` (`#c45a38`) has exactly one consumer: `bg-paprika` on the time pill at
`RecipeHero.svelte:90`. Removing that pill makes the token dead, so delete it — from the
registration, the `:root` value, and the `[data-theme='dark']` override at `app.css:181`.

### Component changes

| Element                    | Now                | After                                                                                           | File                                         |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `+ New Recipe`             | solid amber        | unchanged — the only solid amber button                                                         | `Navbar.svelte`                              |
| `v2` / current-version dot | amber              | unchanged — product identity                                                                    | `RecipeHero.svelte`, `VersionHistory.svelte` |
| Tags                       | filled amber pill  | transparent fill, 1px `--color-tag-border`, `--color-tag` text, `--color-tag-hover-bg` on hover | see below                                    |
| Forked badge               | filled amber pill  | outline + existing fork glyph, no fill                                                          | `RecipeCard.svelte`                          |
| `26 min`                   | solid paprika pill | not a pill — mono metadata beside Serves and author                                             | `RecipeHero.svelte`                          |

Tags are styled in three places, and they do not agree with each other today — which is
part of why the system reads as unconsidered:

- `app.css` `.tag` (uses `--color-tag` / `--color-tag-pale`) — consumed only by
  `RecipeCard.svelte`
- `TagFilter.svelte:44` — inline Tailwind `bg-tag-pale text-tag`, duplicating the class
- `RecipeHero.svelte:83` — inline `bg-accent text-hero-bg`, bypassing the tag tokens
  entirely and using the raw accent

Consolidate: `.tag` becomes the single definition, and both inline sites use it. That
removes the duplication as well as the colour, and means the next restyle is one edit.

The recipe hero today renders five competing filled pills. After this it renders one
amber element (`v2`) and quiet metadata.

### Testing

`RecipeCard.svelte.test.ts` asserts on `.forked-badge` and `.forked-badge--hidden`. Those
class names must survive the restyle, or the tests must be updated deliberately in the
same commit — not incidentally. The e2e suite already learned this lesson once when the
Tailwind migration silently removed `.version-row`.

---

## Section 2 — Correctness

### 2.1 Mobile reading order

`src/routes/recipes/[slug]/+page.svelte` sets `.content-layout aside { order: -1 }` below
860px. This is deliberate — the photo should precede the recipe — but Details and Version
History inherit the reordering, so a phone user scrolls past three boxes to reach the
ingredients.

Split the aside: the photo keeps `order: -1`; Details and Version History move below the
main column. Implementation is a DOM change (hoist the photo out of `<aside>` into its own
element the grid can place), not a new `order` value on each child, because `order` on
grid items inside a single-column grid gets fragile fast.

Verify by screenshot at 390px: hero → photo → Ingredients → Method → Details → Version
History.

### 2.2 Search card parity

`src/routes/search/+page.server.ts` builds results with `db.select().from(recipes)` — no
relations. `src/routes/+page.server.ts` uses `db.query.recipes.findMany` with `author` and
`recipesToTags`. The same `RecipeCard` therefore renders with no author and no tags on
search, which reads as broken rather than designed.

Keep the existing full-text ranking, then hydrate: collect the ranked ids, issue one
`db.query.recipes.findMany({ where: inArray(recipes.id, ids), with: { author, recipesToTags: { with: { tag } } } })`,
and reorder the result to match the ranked id order in JavaScript. Postgres will not
preserve `inArray` ordering, so the reorder is required, not optional.

### 2.3 Tag filter shows dead options

Seven of thirteen tags have zero recipes (`Easy`, `Italian`, `John`, `Pasta`, `Quick`,
`Russian`, `Vegetarian`). More than half the filter chips lead to an empty page.

Two parts, because either alone regresses:

- **Data:** delete the seven orphans from production via a migration, so the change is
  recorded rather than applied by hand.
- **Query:** the tag filter renders only tags with at least one recipe. A tag that loses
  its last recipe then disappears from the filter on its own.

Tag creation is unchanged — new tags still appear as soon as a recipe uses one.

### 2.4 Hero metadata

`RecipeHero.svelte` prints the raw slug in the breadcrumb (`classic-chocolate-chip-cookies`,
which wraps to two lines at 390px) and renders `@spencerfletcher` twice — once in the
breadcrumb, once in the meta line. Show the recipe title in the breadcrumb and drop the
duplicate from the meta line.

---

## Section 3 — Landing page and version promotion

### 3.1 Extract `VersionDiff.svelte`

The diff markup is inline in `src/routes/recipes/[slug]/diff/+page.svelte`. Extract it to
`src/lib/components/VersionDiff.svelte` taking
`{ ingredientDiff: IngredientDiffRow[], stepDiff: StepDiffRow[] }`. The compare page
becomes a thin wrapper.

This is the same extraction the roadmap lists as M1 Task 0 for pull requests. Doing it
here means M1 inherits it. `diff/page.svelte.test.ts` (13 tests) must pass unchanged — it
is the safety net for the refactor.

### 3.2 Logged-out landing page

`src/routes/+page.server.ts` branches on `locals.user`. Logged out returns landing data;
logged in returns the feed exactly as today.

Sections, in order:

1. Premise — one headline, one supporting line, two actions: browse recipes, and view a
   diff.
2. A real diff, rendered with `VersionDiff` from actual version rows. Not a screenshot,
   not fixture data. If the seeded recipe it depends on is missing, the section is
   omitted rather than rendered empty.
3. Three recent public recipes, using the existing `RecipeCard`.

No feature grid, no testimonials, no claims about anything unbuilt. The README's
"Not built" section is the boundary.

### 3.3 Version and fork counts on cards

`RecipeCard` gains `v{latest} · {n} forks` in its meta line. Fork count is omitted at
zero; version number always shows.

Both counts come from grouped aggregates joined into the existing list query — one query
for the page, not one per card. A test asserts the query count does not scale with the
number of cards.

### 3.4 Version strip on the recipe page

Version history moves from the third sidebar card to a horizontal strip directly under
the hero: version dots with commit messages, the current version marked, and the existing
Compare links. The sidebar keeps the photo and Details.

This is also where M1 will put the pull-request affordance, so the strip should be a
component (`VersionStrip.svelte`) rather than inline markup.

---

## Testing

Order follows the project convention: server logic, then component, then e2e.

- **Server:** search hydration returns author and tags and preserves rank order; the tag
  filter excludes zero-recipe tags; the homepage loader returns landing data when logged
  out and feed data when logged in; card aggregates issue a fixed number of queries.
- **Component:** `RecipeCard` renders version and fork counts, omits fork count at zero,
  and keeps its existing badge classes; `VersionDiff` renders unchanged (existing tests);
  `VersionStrip` marks the current version.
- **E2E:** a logged-out visitor sees the premise and a diff on `/`; a logged-in user sees
  the feed; a phone-width recipe page shows Ingredients before Details.

## Risks

| Risk                                                                     | Mitigation                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Card aggregates become N+1                                               | Single grouped subquery; test asserts query count is constant |
| Removing `--color-tag-pale` leaves dangling refs that render transparent | Grep and migrate every usage in the same commit               |
| Restyle silently breaks e2e selectors, as the Tailwind migration did     | e2e runs in CI now; keep `.forked-badge` class names          |
| Landing page drifts into claiming unbuilt features                       | Section 3.2 constrains content to live data                   |
| Mobile reorder fixes the photo but buries something else                 | Verify by screenshot at 390px, not by reasoning               |

## Out of scope

Dark mode. Per-page metadata (roadmap M2). Any roadmap feature. Image `width`/`height`
attributes for layout shift — worth doing, but unrelated to this work.

## Sequencing

Section 2 first: it is correctness, needs no design judgement, and makes the rest easier
to evaluate. Then Section 1, which is the highest visual return per hour. Then Section 3,
which is the largest and depends on the `VersionDiff` extraction.
