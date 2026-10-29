# Fork — Roadmap

## Priority order — 2026-10-23

1. ~~One save, versioned content~~ shipped 2026-10-27 (`superpowers/specs/2026-10-23-one-save-design.md`), together with M10 Drizzle migrations and the operational cleanup.
2. ~~UI redesign~~ built 2026-10-27 on the `redesign` branch (tokens, nav and shell, recipe page, card and grid, compare, edit and new), each step reviewed; the "as built" paragraphs in `research/2026-10-26-ui-design-directions.md` record what differs from the boards. Moved to the backlog during the build: in-place tag filtering, browse sections past their caps, dark mode. Older inputs: `todo/DESIGN.md`, `todo/TODO_UI.md`.
3. Serving scaling on the recipe page (temporary multiplier, no version written).
4. Cooklang-derived items from `research/2026-10-23-cooklang.md`: cooking attempts (M17), export (M16), `.cook` import (M15 stage 6), ingredient use in steps.
5. Social features (added 2026-10-29): pull requests back to the source recipe (M1), comments on versions (M3), following and a feed (M4), collections (M6), with the sharing defaults below settled first. The 2026-09 deferral of feeds and graph work no longer stands; order within the set is open.

## Sharing defaults — from the 2026-09 reconciliation

Open product calls carried over from the repository reconciliation (the rest of that note has since shipped or lives in the milestones below):

- **Start private, publish deliberately.** New recipes and forks default to public. Default to private with an explicit "make public" step that says what it exposes, and stop a fork inheriting the source's visibility.
- **Pin the source version on a fork.** `parentId` records the parent but not which version was copied, so "forked from v3" is lost once the parent moves on. One `parentVersionNumber` column written at fork time.
- **Variation versus bookmark.** Fork and favorite both read as "save". The copy should say which one makes an editable copy.

## Backlog — from the 2025 design document

Ideas from the original MVP design that are not covered by a milestone. Kept as one line each; the document's palette, layout sketches and Bits UI plan are superseded (see `todo/DESIGN.md`).

- Change your username and a forgot-password flow: both need a settings page and the Supabase reset email (Spencer, 29 October 2026).
- Tag suggestions ranked by the recipe itself (Spencer, 29 October 2026): the editor's Tags box already lists tags before you type; it should order them by fit, so a recipe titled "cookies" offers Dessert and American first. Needs a small scorer over title, description and ingredients against tag names, no new data.
- In-place tag filtering on the browse page: today the tabs link to `/tags/{slug}`; filtering the sectioned page without a navigation needs the browse loader to take a tag and the sections to recompute.
- Browse sections past their caps: a side-scrolling row or a "see more" link per section (Recent 8, Most forked 4) once the collection outgrows them.
- Dark mode: the dark token set is recorded in the design directions, nothing is built.
- Fork count on the recipe page opens a list of public forks, the way the version count opens the history (Spencer, 2026-10-27).
- Diff pages stay monospace (decided 2026-10-27).
- Temperature toggle (°C / °F) on steps: temperatures are free text, so a render-time regex like the M11 timer match, no schema.
- Print stylesheet for the recipe page: `@media print`, no nav or sidebar. An afternoon.
- Serving scaler on the recipe page: a stepper or ×½ / ×2 that re-renders parsed quantities in place; unparsed lines render as written with a mark. The parser already separates the two.
- Restore or edit-from on the compare page: one secondary button in the "from" card that opens the editor seeded with that version's content.
- Quantities inline in steps ("Whisk flour (280 g), baking soda (1 tsp)…") so cooking does not mean scrolling between the list and the method. Needs ingredient names matched to step text; after the redesign.
- Nutrition (macros) per ingredient from USDA FoodData Central, after the M12 gram tables, since weights are the input.
- Ratings: a private personal rating first, crowd-sourced later if the social loop exists.
- AI recipe generation and adaptation from a prompt or chosen ingredients, reviewed in the form before saving; M14, M15 and M17 all mention consuming it.
- Structured tag taxonomy (diet, cuisine, meal type) instead of one flat list, when the tag count makes one filter row unwieldy.
- Pantry, meal log and grocery pricing (v3 in the old plan): a separate product. Not before everything above.
- Rejected then and still: ads, automatic prep-time estimates, "grams made" as a recipe field.

## Current direction — 2026-09-09

The sequence below is preserved as historical planning. The consolidated product note is `/Users/spfle/obsidian-vault/fork/ForkV2.md`.

Prioritize reliable private writing, readable mobile recipes, and deliberate friend-to-friend sharing with independent adaptations. Pull requests, feeds, and graph work are deferred. Small shared collections can follow simple sharing; they do not require professional operations. Per-page metadata is already implemented in the layout and route loaders, so historical M2 is no longer pending.

The original M1 design is not approval to implement it. Preserve existing history and diff functionality. The assessment distinguishes source-inspected behavior from unverified runtime behavior.

## Historical roadmap

The material below records the earlier direction; estimates are historical, not current commitments.

## Sequencing

```
M1  Pull requests          <- closes the premise; everything else is worth more after it
M2  Per-page metadata      independent, ~2h, do it whenever
M3  Comments on versions   depends on M1 for the review-thread UI
M4  Following + real feed   ]
M5  Lineage visualisation   ]  independent of each other, any order
M6  Collections             ]
M7  Fuzzy ingredient matching in diffs   independent, pure logic
M8  Search ranking                       independent
M9  Optimistic concurrency on edits      partially delivered by M1's staleness guard
```

M1 first. Forking is currently a dead end — you can copy someone's recipe and improve it, but there is no way to offer the improvement back. Every primitive already exists: `parent_id` lineage, versioned JSONB content, and a diff engine that takes raw ingredient and step arrays rather than versions, so it already diffs across recipes.

---

# M1 — Pull requests

**Shape.** Fork-based, mirroring GitHub. A user forks a recipe, edits their fork, then opens a PR from one of their fork's versions back to the parent. Accepting appends a new version to the target recipe with `created_by` set to the proposer, so the contributor gets real credit and their profile commit count reflects it. The fork survives whatever the outcome.

```
alice/classic-ccc            v1  v2
       │                          ▲
       └─ fork ─> bob/classic-ccc │  v1  v2
                                  │       │
                        PR: base=alice v2, source=bob v2
                                  │
                        accept ──> alice/classic-ccc v3   created_by = bob
```

Estimated 14–18h total, less Task 0, which is already done.

## Task 0 — Extract the diff renderer — **done**

Shipped ahead of M1, during the UI refresh. `src/lib/components/VersionDiff.svelte` takes `{ ingredientDiff: IngredientDiffRow[], stepDiff: StepDiffRow[] }`, the compare page is a thin wrapper around it, and the landing page renders the same component. It has its own tests in `VersionDiff.svelte.test.ts`.

Subtract 1–2h from the estimate below.

## Task 1 — Schema and migration (1h)

Add to `src/lib/server/db/schema.ts`:

```ts
export const prStatus = pgEnum('pr_status', ['open', 'accepted', 'closed']);

export const pullRequests = pgTable('pull_requests', {
	id: serial().primaryKey(),
	targetRecipeId: integer('target_recipe_id')
		.notNull()
		.references(() => recipes.id, { onDelete: 'cascade' }),
	sourceRecipeId: integer('source_recipe_id')
		.notNull()
		.references(() => recipes.id, { onDelete: 'cascade' }),
	sourceVersionId: integer('source_version_id')
		.notNull()
		.references(() => recipeVersions.id, { onDelete: 'cascade' }),
	// The target version the diff was computed against — used to detect staleness.
	baseVersionId: integer('base_version_id')
		.notNull()
		.references(() => recipeVersions.id, { onDelete: 'cascade' }),
	authorId: text('author_id').references(() => profiles.id, { onDelete: 'set null' }),
	title: text().notNull(),
	body: text(),
	status: prStatus().notNull().default('open'),
	createdAt: timestamp('created_at').defaultNow(),
	resolvedAt: timestamp('resolved_at'),
	// The version accepting produced, for linking from the PR back into history.
	resolvedVersionId: integer('resolved_version_id').references(() => recipeVersions.id, {
		onDelete: 'set null'
	})
});
```

Index `(target_recipe_id, status)` — the list query filters on both.

Write the migration by hand into `supabase/migrations/` (`CREATE TYPE` then `CREATE TABLE`), enable RLS on the new table to match the other six, and verify by letting CI replay the chain from empty. Do **not** use `drizzle-kit push`; it targets `.env.local`, and this project already paid for that once.

## Task 2 — Opening a PR (3–4h)

Tests first (`src/routes/recipes/[slug]/pulls/page.server.test.ts`):

- rejects an anonymous user
- rejects when the source recipe's `parentId` is not the target recipe
- rejects when the user does not own the source recipe
- rejects when the target recipe is private and not owned by the proposer
- rejects a second open PR from the same source version
- creates with `status: 'open'`, `baseVersionId` = target's current latest version

Then: a "Propose changes to the original" action on a fork's detail page, visible only to the fork owner when `parentId` is set. Reuse the existing fork dialog pattern in `RecipeActions.svelte` — title and body fields, defaulting the title to the source version's commit message.

## Task 3 — List and detail views (3–4h)

- `/recipes/[slug]/pulls` — open PRs by default, with a filter for accepted/closed.
- `/recipes/[slug]/pulls/[id]` — diff of `baseVersion` → `sourceVersion` via `diffIngredients` / `diffSteps` and the `VersionDiff` component from Task 0, plus proposer, title, body, and status.
- Link the PR count from the recipe detail page next to the existing fork count.

Server tests: private recipes stay hidden, a closed PR still renders, a PR against a deleted source 404s cleanly.

## Task 4 — Accept and close (3–4h)

The only genuinely tricky task. Accepting runs in one transaction:

1. Assert the caller owns the target recipe (close additionally allows the PR author).
2. Assert `status === 'open'`.
3. **Staleness guard:** if the target's current latest version is not `baseVersionId`, refuse with a conflict — the recipe moved since the PR was opened. This is M9's optimistic concurrency, delivered early and where it matters most.
4. Insert a `recipe_versions` row on the _target_: `versionNumber` = max + 1, ingredients and steps copied from the source version, `commitMessage` = the PR title, `createdBy` = the PR author.
5. Update the PR: `status`, `resolvedAt`, `resolvedVersionId`.

Tests — this is where the value is:

- non-owner cannot accept
- accepting a non-open PR fails
- accepting a stale PR fails with a conflict, and writes no version
- accepting appends exactly one version and increments `versionNumber` by one
- the new version's `createdBy` is the proposer, not the owner
- the target recipe's `authorId` is unchanged
- closing sets status without writing a version
- the PR author can close their own PR

## Task 5 — End-to-end (2h)

One flow in `e2e/authenticated.test.ts`, running against the seeded stack in CI: fork a recipe, edit the fork, open a PR, accept it, assert a new version appears on the original crediting the proposer.

Extend `db:seed` with a second user so the fork and the target have different owners — the current seed owns everything, which is why the existing fork test can only assert a negative.

---

# M2 — Per-page metadata (~2h)

`src/app.html` carries site-wide Open Graph and Twitter tags, so every shared recipe link previews as the site. Move them into `<svelte:head>` per route, with the recipe title, description, and `imageUrl` as the OG image. Small, and it compounds with every share.

# M3 — Comments on versions (4–6h)

Commit messages say _what_ changed; comments are where "this worked better at 350°F" lives. Table keyed on `recipe_version_id`, threaded one level. Reuse the PR detail layout for the thread UI, which is why this follows M1.

# M4 — Following and a real feed (6–8h)

The homepage is "all public recipes, newest first" — fine at three recipes, meaningless at three thousand. A `follows` join table plus a feed query, with the existing feed as the logged-out fallback.

# M5 — Lineage visualisation (4–6h)

You store `parent_id` but only ever render one hop. A tree of how a recipe evolved across users is the most visually striking thing this data model can produce, and the best screenshot the README will ever get. Recursive CTE server-side, SVG or nested lists client-side.

# M6 — Collections (4–6h)

`collections` + `collection_recipes`. Straightforward; makes favourites usable rather than a flat pile.

# M7 — Fuzzy ingredient matching (2–3h)

`diff.ts` matches by exact lowercased name, so a rename shows as remove + add — its own comment says so. Token-overlap or Levenshtein turns that into a proper modify. Pure logic, no database, no framework, trivially testable. The highest quality-per-hour item on this list, and a genuinely interesting problem to talk through in an interview.

# M8 — Search ranking (3–4h)

The `tsvector` is weighted title/description already. Rank by fork count, favourites, and recency rather than raw `ts_rank`.

# M9 — Optimistic concurrency on edits (2–3h)

Two people editing one recipe is currently last-write-wins. Mostly delivered by M1's staleness guard; extend the same check to the edit form.

---

# M10 — Drizzle-generated migrations — **done 2026-10-27**

Shipped: `drizzle/` is the only migration chain, `pnpm db:generate` / `db:migrate` / `db:migrate:prod`, one env loader with a hosted guard, RLS declared in `schema.ts`, CI replays the chain from empty. The Supabase chain lives in `docs/history/supabase-migrations/`. Original plan below.

## M10 as planned (half day)

`schema.ts` is the source of truth for types, but migrations are still SQL written by hand in `supabase/migrations/`, so the two can drift. Move to `drizzle-kit generate` plus `drizzle-kit migrate`: the schema diff produces the SQL, which is reviewed and committed like any other change. `drizzle-kit push` stays banned; it applies changes with no file and no history.

Steps, in order:

1. Stop `drizzle.config.ts` loading `.env.local` with `override: true`, so `migrate` cannot silently target the wrong database.
2. Generate a baseline migration from the current `schema.ts` and mark it applied on local and prod by hand, so `migrate` does not try to recreate tables.
3. Decide whether the existing `supabase/migrations/` chain stays as history or is folded into `drizzle/`. Two live chains is not an option.
4. Express RLS policies in `schema.ts` where Drizzle supports them; use `generate --custom` for one-off SQL such as data cleanups.
5. CI: after `supabase start`, run `drizzle-kit migrate`, and keep the from-empty replay check.

---

# M11 — Step timers (2–3h)

Step text already carries durations ("marinate at least 1 hour", "bake 25 minutes"). Match them at render time in `RecipeMethod.svelte` with one regex over `(\d+)\s*(seconds?|minutes?|mins?|hours?|hrs?)` and show a "Start 1h timer" inlay under that step. `setTimeout` plus the native `Notification` API, with permission requested on first click; fall back to an in-page banner when notifications are denied. Nothing stored: durations derive from the text, so no schema or seed change. One timer per step, running state is component-local.

---

# M12 — Gram tables from USDA FoodData Central (half day)

`gramTables.ts` is hand-typed and matched whole-name, so a name the table does not know shows no weight. USDA FoodData Central (public domain, SR Legacy and FNDDS) lists household measures per food: grams per cup, tablespoon and per item. A one-off script picks the most common few hundred foods, maps their formal names ("Wheat flour, white, all-purpose, enriched") to what people type, and emits the two tables. Review the generated keys by hand; the seed coverage test in `gramTables.test.ts` stays as the net. No runtime dependency on USDA.

# M13 — User-defined ingredient weights (2–3h)

A per-user `ingredient_weights` table (name, grams per ml or grams per item), consulted before the built-in tables with the same whole-name lookup. Lets a power user teach the app their flour or their eggs. A wrong number can then only come from the user's own entry. Edit UI is a small list on the profile page. Depends on M12 making the built-in table good enough that this is the exception, not the fix.

---

# M14 — iOS app (large, after the web product settles)

A native or wrapped iOS client for cooking from a recipe: large type, screen stays awake, step timers (M11), serving scaling, offline access to saved recipes. Options, cheapest first: the SvelteKit site as a PWA with an install prompt and a service worker for offline; Capacitor wrapping the same site for an App Store listing; a Swift client against the existing endpoints. Decide after the save flow, scaling and the first AI adaptation exist, since the app would consume all three. Needs API auth that is not cookie-based for anything beyond the PWA.

---

# M15 — Importing recipes (in stages)

Entry points into the two text editors, cheapest first. Each stage lands in the same `/recipes/new` form prefilled, so review and save are the existing flow.

1. **Pasted text.** One box, paste a whole recipe; split it into title, ingredients and steps by headings and blank lines. Ingredients and steps already parse, so this is mostly finding the boundaries.
2. **Text and Markdown files.** Same splitter behind a file picker.
3. **URL.** Most recipe sites embed a schema.org `Recipe` as JSON-LD: name, `recipeIngredient` lines, `recipeInstructions`, `recipeYield`, prep and cook time. Fetch server-side, read the JSON-LD, prefill. No AI, covers most blogs; fall back to the pasted-text splitter on the page text when there is no JSON-LD.
4. **Photo of a cookbook page or card.** Needs OCR or a vision model; slots after the first AI adaptation exists, reusing that plumbing.
5. **iOS share sheet** (M14): the URL path from a different entry point.

6. **Cooklang `.cook` files.** After the cooking loop works. Keep the original file, translate the supported subset (ingredients, steps, timers, metadata), say what was not represented. Evaluate existing TypeScript parsers and Cooklang's canonical parser tests first. See `research/2026-10-23-cooklang.md`.

Not planned until asked for: Paprika, Mealie or Recipe Keeper export formats.

---

# M16 — Export (bounded, after M15 stage 3)

Portability as a guarantee, not a sentence. A documented archive per user or per recipe: readable Markdown recipes, machine-readable version snapshots as JSON, source attribution and fork lineage, images, and attempt notes once M17 exists. Add `.cook` export of the supported subset alongside, without inventing ingredient-to-step links. See `research/2026-10-23-cooklang.md`.

# M17 — Cooking attempts (the improvement loop)

The strongest opportunity identified in the Cooklang research. An attempt records: which version, batch size or multiplier, deviations from the formulation, and the outcome, in a few taps. Distinct from the saved formulation and from a proposed revision. Feeds the AI adaptation ("version 3 at half size with oat milk was too thin") and answers "which version did I cook last time, and did it help?". Must be effortless or it is no advantage; start with one free-text note plus the version and multiplier, structure later.

---

## Working agreements

These are the ones this project has already been bitten by. They are enforced in CI now, so following them is cheaper than working around them.

- Schema changes edit `schema.ts` and run `pnpm db:generate --name <what-changed>` in the same commit; the SQL lands in `drizzle/` and is reviewed like any other change. Apply with `pnpm db:migrate` locally and `pnpm db:migrate:prod` for the hosted database.
- Tests before implementation: server logic, then component, then e2e.
- Never `drizzle-kit push`, anywhere. It changes a database with no migration file, and `drizzle.config.ts` loads `.env.local` with `override: true`, so it can target a different database than you expect. (M10, shipped 27 October 2026, moved migrations to `drizzle-kit generate`.)
- Do not add a feature to the README until it exists. The README's "Not built" section is the honest record.
