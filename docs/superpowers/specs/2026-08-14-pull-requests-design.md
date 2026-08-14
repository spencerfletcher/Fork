# Pull requests — design and estimate

Status: **design only, not approved for implementation.**

Roadmap item M1. This document exists so the shape and the cost can be judged before any code is written.

## Why this feature

Forking is currently a dead end. You can copy someone's recipe, improve it, and there is no way to offer the improvement back. The project's premise — "git-style version control for recipes" — is half-delivered: history, forking and diffing all work, but nothing flows upstream.

This is also the feature that would make a résumé claim about collaborative recipe development true rather than aspirational.

## What already exists that this builds on

Verified against the code, not assumed:

| Piece             | Where                                                                         | Note                                                            |
| ----------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Fork lineage      | `recipes.parentId`, `recipes.forkedAt`                                        | Set by the `fork` action                                        |
| Versioned content | `recipe_versions` — `ingredients`/`steps` JSONB, `commitMessage`, `createdBy` | Append-only                                                     |
| Version numbering | `edit/+page.server.ts` — `max(versionNumber) + 1` in a transaction            |                                                                 |
| Diff engine       | `lib/utils/diff.ts` — `diffIngredients`, `diffSteps`                          | Takes raw arrays, so it already diffs **across** recipes        |
| Diff rendering    | `lib/components/VersionDiff.svelte`                                           | Extracted in the UI refresh; self-contained, no page-scoped CSS |
| Version strip     | `lib/components/VersionStrip.svelte`                                          | Sits under the hero — where PR affordances belong               |

**The diff renderer and its extraction are already done.** The roadmap listed that as M1's Task 0; the UI refresh completed it, which removes 1–2 hours from this estimate.

One behaviour worth knowing: **forking creates a fresh `versionNumber: 1`** carrying the source's latest content — it does not copy the source's history. So a fork that has never been edited has content identical to the source, and a pull request from it would be an empty diff. The design must reject that explicitly.

## Decisions already taken

Settled earlier in discussion, recorded here so they are not re-litigated:

- **Fork-based**, mirroring GitHub — a PR proposes one of your fork's versions back to the parent. Not a "suggest an edit" scratch buffer.
- **Accepting appends a new version to the target**, with `created_by` set to the proposer. Attribution survives, and the contributor's profile commit count reflects it.
- **The fork survives** whatever the outcome. Accepting does not delete or merge away the proposer's copy.

## Data model

```ts
export const prStatus = pgEnum('pr_status', ['open', 'accepted', 'closed']);

export const pullRequests = pgTable(
	'pull_requests',
	{
		id: serial().primaryKey(),
		targetRecipeId: integer('target_recipe_id')
			.notNull()
			.references(() => recipes.id, { onDelete: 'cascade' }),
		sourceRecipeId: integer('source_recipe_id')
			.notNull()
			.references(() => recipes.id, { onDelete: 'cascade' }),
		// The fork version being proposed.
		sourceVersionId: integer('source_version_id')
			.notNull()
			.references(() => recipeVersions.id, { onDelete: 'cascade' }),
		// The target version the diff was computed against — the staleness anchor.
		baseVersionId: integer('base_version_id')
			.notNull()
			.references(() => recipeVersions.id, { onDelete: 'cascade' }),
		authorId: text('author_id').references(() => profiles.id, { onDelete: 'set null' }),
		title: text().notNull(),
		body: text(),
		status: prStatus().notNull().default('open'),
		createdAt: timestamp('created_at').defaultNow(),
		resolvedAt: timestamp('resolved_at'),
		// The version accepting produced, so the PR links into history.
		resolvedVersionId: integer('resolved_version_id').references(() => recipeVersions.id, {
			onDelete: 'set null'
		})
	},
	(table) => [index('pull_requests_target_status_idx').on(table.targetRecipeId, table.status)]
);
```

`baseVersionId` is the load-bearing column. Without it there is no way to know whether the diff a reviewer is looking at is still the diff they would be accepting.

RLS enabled with no policies, matching the other six tables — the app reaches Postgres as `postgres` (BYPASSRLS) and uses Supabase only for auth and storage.

## Lifecycle

```
              open ──accept──> accepted   (writes a version on the target)
                │
                └──close───> closed       (writes nothing)

accept refuses when:
  · caller does not own the target recipe
  · status is not 'open'
  · target's latest version ≠ baseVersionId      ← the recipe moved underneath
```

The staleness check is the interesting part, and it is the roadmap's M9 (optimistic concurrency) delivered early where it matters most. Without it, accepting a PR opened against v3 silently overwrites the changes in v4 and v5.

**What happens on a stale PR is a product decision, not a technical one.** Three options, in increasing cost:

1. **Refuse with an explanation** — "this recipe has changed since the proposal was made". Cheapest, honest, and the proposer can open a fresh PR. _Recommended for v1._
2. Refuse, and offer the proposer a one-click "refresh against latest" that recomputes the diff.
3. Attempt a merge. Real conflict resolution on JSONB ingredient lists. Substantially more work than the rest of this feature combined, and not worth it at this scale.

## Permissions

| Action | Who                                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| Open   | Owner of the source recipe, where `source.parentId === target.id` and the target is public or owned by them |
| View   | Anyone who can view the target recipe                                                                       |
| Accept | Owner of the target recipe only                                                                             |
| Close  | Owner of the target recipe, or the PR author                                                                |

Rejections worth writing tests for: proposing against a recipe that is not your fork's parent; proposing a fork you do not own; a second open PR from the same source version; **proposing an unmodified fork** (empty diff — "nothing to propose").

## Surfaces

- `/recipes/[slug]/pulls` — list for a recipe, open by default, filterable to accepted/closed.
- `/recipes/[slug]/pulls/[id]` — the diff of `baseVersion → sourceVersion` via the existing `VersionDiff`, plus proposer, title, body, status, and accept/close controls for whoever is entitled to them.
- **Propose action** on a fork's recipe page, visible only to the fork owner when `parentId` is set. Reuses the existing fork-dialog pattern in `RecipeActions.svelte`.
- **PR count** in `VersionStrip`, next to the existing fork count — this is why the strip was built as a component.

## Testing

Order follows the project convention: server logic, component, e2e.

The tests that carry the weight are on `accept`, because it is the only action that writes:

- non-owner cannot accept
- accepting a non-open PR fails
- **accepting a stale PR fails and writes no version** — assert the version count is unchanged, not just that an error was thrown
- accepting appends exactly one version and increments `versionNumber` by one
- the new version's `createdBy` is the proposer, not the target owner
- the target recipe's `authorId` is unchanged
- closing writes no version
- the PR author can close their own PR

One prerequisite: **`seed.ts` creates a single user who owns everything.** That is why the existing fork e2e can only assert a negative ("owner sees Edit, not Fork"). A second seeded user is required before any cross-owner flow can be tested end to end.

## Estimate

|                                                           | Hours     |
| --------------------------------------------------------- | --------- |
| Schema, migration, RLS, verify against a scratch database | 1.5       |
| Second seeded user + fixture updates                      | 1.0       |
| Open-PR flow (validation, action, dialog)                 | 3.5       |
| List and detail views                                     | 3.5       |
| Accept / close with the staleness guard                   | 3.5       |
| End-to-end cross-owner flow                               | 2.0       |
| **Implementation subtotal**                               | **15**    |
| Review loops and fixes                                    | 5–9       |
| **Total**                                                 | **20–24** |

The review overhead is not padding. Across the ten-task UI refresh just completed, roughly every task needed at least one fix round, and the majority of defects came from the plan rather than the implementation. An estimate that ignores that is the estimate that was wrong last time.

### What could push it higher

- **Choosing option 2 or 3 for stale PRs.** Option 2 adds ~3h. Option 3 is a different project.
- **Notifications.** Not in this design. A recipe owner currently has no way to learn a PR exists except by visiting the page. Doing it properly means email or an in-app inbox — assume 6h+ and treat it as separate.
- **The empty-diff case.** Cheap if handled at open time, expensive if discovered later as a stream of no-op PRs.

### What is explicitly out of scope

Merging beyond "append the proposed version". Conflict resolution. Notifications. Review comments on individual lines. Multi-commit PRs. Any AI involvement.

## Risks

| Risk                                                     | Mitigation                                                                                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `accept` corrupts history under concurrency              | Everything in one transaction; staleness guard; assert no-write on the failure path                                                                                |
| Empty PRs from unmodified forks                          | Reject at open time with a clear message; test it                                                                                                                  |
| PR list becomes an N+1                                   | One grouped aggregate for counts, the pattern already used for version/fork counts                                                                                 |
| Private recipes leak through PR listings                 | Scope every query by visibility — the fork-count leak found during the UI refresh was exactly this class of bug                                                    |
| Spec asserts things about the codebase that are not true | Paste grep output into the plan rather than conclusions drawn from it. Three defects in the last run traced to this, twice from misreading a grep that had errored |

## Recommendation

Build it, with stale-PR option 1. It is the feature that completes the product's premise, it reuses machinery that already exists and is tested, and at 20–24 hours it is the best remaining value per hour in the roadmap.

Do the second seeded user first, as its own commit. Every cross-owner test depends on it, and discovering that halfway through the accept flow is how a clean task turns into a messy one.
