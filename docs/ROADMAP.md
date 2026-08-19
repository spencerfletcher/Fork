# Fork — Roadmap

Planning document. Nothing here is built; see the README for what actually exists.

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

M1 first. Forking is currently a dead end — you can copy someone's recipe and improve
it, but there is no way to offer the improvement back. Every primitive already exists:
`parent_id` lineage, versioned JSONB content, and a diff engine that takes raw
ingredient and step arrays rather than versions, so it already diffs across recipes.

---

# M1 — Pull requests

**Shape.** Fork-based, mirroring GitHub. A user forks a recipe, edits their fork, then
opens a PR from one of their fork's versions back to the parent. Accepting appends a new
version to the target recipe with `created_by` set to the proposer, so the contributor
gets real credit and their profile commit count reflects it. The fork survives whatever
the outcome.

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

Shipped ahead of M1, during the UI refresh. `src/lib/components/VersionDiff.svelte`
takes `{ ingredientDiff: IngredientDiffRow[], stepDiff: StepDiffRow[] }`, the compare
page is a thin wrapper around it, and the landing page renders the same component. It
has its own tests in `VersionDiff.svelte.test.ts`.

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

Write the migration by hand into `supabase/migrations/` (`CREATE TYPE` then `CREATE TABLE`),
enable RLS on the new table to match the other six, and verify by letting CI replay the
chain from empty. Do **not** use `drizzle-kit push`; it targets `.env.local`, and this
project already paid for that once.

## Task 2 — Opening a PR (3–4h)

Tests first (`src/routes/recipes/[slug]/pulls/page.server.test.ts`):

- rejects an anonymous user
- rejects when the source recipe's `parentId` is not the target recipe
- rejects when the user does not own the source recipe
- rejects when the target recipe is private and not owned by the proposer
- rejects a second open PR from the same source version
- creates with `status: 'open'`, `baseVersionId` = target's current latest version

Then: a "Propose changes to the original" action on a fork's detail page, visible only to
the fork owner when `parentId` is set. Reuse the existing fork dialog pattern in
`RecipeActions.svelte` — title and body fields, defaulting the title to the source
version's commit message.

## Task 3 — List and detail views (3–4h)

- `/recipes/[slug]/pulls` — open PRs by default, with a filter for accepted/closed.
- `/recipes/[slug]/pulls/[id]` — diff of `baseVersion` → `sourceVersion` via
  `diffIngredients` / `diffSteps` and the `VersionDiff` component from Task 0, plus
  proposer, title, body, and status.
- Link the PR count from the recipe detail page next to the existing fork count.

Server tests: private recipes stay hidden, a closed PR still renders, a PR against a
deleted source 404s cleanly.

## Task 4 — Accept and close (3–4h)

The only genuinely tricky task. Accepting runs in one transaction:

1. Assert the caller owns the target recipe (close additionally allows the PR author).
2. Assert `status === 'open'`.
3. **Staleness guard:** if the target's current latest version is not `baseVersionId`,
   refuse with a conflict — the recipe moved since the PR was opened. This is M9's
   optimistic concurrency, delivered early and where it matters most.
4. Insert a `recipe_versions` row on the _target_: `versionNumber` = max + 1, ingredients
   and steps copied from the source version, `commitMessage` = the PR title,
   `createdBy` = the PR author.
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

One flow in `e2e/authenticated.test.ts`, running against the seeded stack in CI: fork a
recipe, edit the fork, open a PR, accept it, assert a new version appears on the original
crediting the proposer.

Extend `db:seed` with a second user so the fork and the target have different owners —
the current seed owns everything, which is why the existing fork test can only assert a
negative.

---

# M2 — Per-page metadata (~2h)

`src/app.html` carries site-wide Open Graph and Twitter tags, so every shared recipe
link previews as the site. Move them into `<svelte:head>` per route, with the recipe
title, description, and `imageUrl` as the OG image. Small, and it compounds with every
share.

# M3 — Comments on versions (4–6h)

Commit messages say _what_ changed; comments are where "this worked better at 350°F"
lives. Table keyed on `recipe_version_id`, threaded one level. Reuse the PR detail
layout for the thread UI, which is why this follows M1.

# M4 — Following and a real feed (6–8h)

The homepage is "all public recipes, newest first" — fine at three recipes, meaningless
at three thousand. A `follows` join table plus a feed query, with the existing feed as
the logged-out fallback.

# M5 — Lineage visualisation (4–6h)

You store `parent_id` but only ever render one hop. A tree of how a recipe evolved
across users is the most visually striking thing this data model can produce, and the
best screenshot the README will ever get. Recursive CTE server-side, SVG or nested lists
client-side.

# M6 — Collections (4–6h)

`collections` + `collection_recipes`. Straightforward; makes favourites usable rather
than a flat pile.

# M7 — Fuzzy ingredient matching (2–3h)

`diff.ts` matches by exact lowercased name, so a rename shows as remove + add — its own
comment says so. Token-overlap or Levenshtein turns that into a proper modify. Pure
logic, no database, no framework, trivially testable. The highest quality-per-hour item
on this list, and a genuinely interesting problem to talk through in an interview.

# M8 — Search ranking (3–4h)

The `tsvector` is weighted title/description already. Rank by fork count, favourites, and
recency rather than raw `ts_rank`.

# M9 — Optimistic concurrency on edits (2–3h)

Two people editing one recipe is currently last-write-wins. Mostly delivered by M1's
staleness guard; extend the same check to the edit form.

---

## Working agreements

These are the ones this project has already been bitten by. They are enforced in CI now,
so following them is cheaper than working around them.

- Schema changes go through a migration file in `supabase/migrations/`. `supabase start`
  replays the chain from empty on every push, so a broken migration fails CI.
- Tests before implementation: server logic, then component, then e2e.
- Never `drizzle-kit push` at production. `drizzle.config.ts` loads `.env.local` with
  `override: true`, so it silently targets localhost.
- Do not add a feature to the README until it exists. The README's "Not built" section is
  the honest record.
