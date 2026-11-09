# Server and shared-code reuse sweep · 9 Nov 2026

Companion to `2026-11-09-ui-reuse-sweep.md`, covering `src/lib/server`, `src/lib`, every `+page.server.ts`, and the tests. Read-only audit on master `f3bdd95`; the refactor slice works from it. Line numbers as of that commit.

## Access paths (highest value)

| Pattern | Copies | Extract |
|---|---|---|
| Load a recipe by slug, check access, 404 | `recipes/[slug]/+page.server.ts` load, toggleFavorite, fork; `forks/+page.server.ts`; `diff/+page.server.ts`; `lib/server/journal.ts` | `viewableRecipe(slug, user, with?)` in visibility.ts, throws the 404 |
| Owner check with disagreeing result shapes (403 thrown vs `fail` `forbidden`) | `edit/+page.server.ts` load, save, deleteRecipe | `ownRecipe(slug, userId, with?)`, one 403 shape |
| Own journal entry fetched twice in two shapes | `journal.ts ownEntry`, `journal/[id]/edit/+page.server.ts storedRow` | one helper |
| "Own recipes plus saved ones the viewer may see" | `cookbook/+page.server.ts`, `journal.ts recipeChoices` | `inLibraryOf(user): SQL` in visibility.ts |
| Friend ids queried twice per request | Friends load + `feedFor`; recipe page `canViewRow` ×2 | fetch once, pass down |
| `canSeeEntry` rule re-written inline as SQL | `journal.ts`, `friends.ts feedFor` | `entryVisibleTo(viewer, friendIds): SQL` beside `canSeeEntry` |

## List pipeline

| Pattern | Copies | Extract |
|---|---|---|
| findMany with `CARD_WITH`, sort by tag matches, `attachRecipeCounts` | cookbook, search, discover, tags | `cardList(where, text, matchCounts, user, limit?)` in recipeCounts.ts |
| Tag-selection sequence | cookbook, search, discover | `tagSelection(allTags, slugs, withinIds?)` in tagFilter.ts |
| Fork count outside `attachRecipeCounts`; **bug:** `forks/+page.server.ts` calls it without `user`, undercounting friends-level grandchild forks for signed-in viewers | `[slug]/+page.server.ts`, `forks/+page.server.ts` | pass `user`; recipe page uses `attachRecipeCounts([recipe], user)` |

## Actions and parsing

| Pattern | Copies | Extract |
|---|---|---|
| Three failure builders plus raw `fail` with codes outside any union | `submission.ts saveFailure`, `journal/entryForm.ts entryFailure`, `friends/+page.server.ts invalid`, raw `fail` in edit and friends | one `failure(status, code: FailureCode, error, extra?)`; `FAILURE_CODES as const` |
| Photo store step | `submission.ts`, `journal/save.server.ts` | `storePhoto(formData, supabase, userId)` |
| Signed-out handling: 5 "session ended" strings in 3 wordings, 6 `error(401)`, 7 login redirects | journal, recipes, cookbook, friends routes | `requireUser(url, user)`; `SESSION_ENDED(verb)` constant |
| Value-from-list parse `LIST.find(v => v === x) ?? fallback` (and one hard-coded `=== 'friends'`) | journal.ts, validation.ts, cookbook, friends, entryForm | `oneOf(list, value, fallback)` in helpers.ts |
| Digits-only regex `/^\d+$/` ×8 | journal, recipe page, edit, friends, RecipeActions | `wholeNumber(s)` in helpers.ts |
| `ensureProfile` wrapped inconsistently | recipes/new, journal/new (try/catch) vs friends, recipe page (bare) | one way |

## Queries

| Pattern | Copies | Extract |
|---|---|---|
| "Either way round" friendship match, 5 forms (incl. a raw SQL with hard-coded column and status) | friends.ts ×2, visibility.ts ×2, schema unique index | `eitherWay(cols, a, b): SQL` on least/greatest, matching the index; keep the db.query alias workaround |
| ISO-day logic twice | `journal/new` default vs `lib/journal.ts localToday`; `isRealDay` rebuilds `day()` | export `day`, reuse |
| Latest-version lookup in 5 styles | various | leave; each fits its load |

## Tests

| Pattern | Copies | Extract |
|---|---|---|
| Load-event builders ×10 | route tests | `loadEvent({path, user, params})` in `lib/testing/actions.ts` |
| Db mock blocks ×17 (three identical) | route tests | `mockDb()` in `lib/testing/drizzle.ts` (hoisted at call site) |
| Hand-built FormData ×4 | journal, submission, validation, edit db tests | `formOf(fields)` exported from `formEvent` |
| Db-test setup ×3, two rollback idioms, one cleanup-by-delete | friends.db, edit db, schema.db | `lib/testing/db.ts`: `localDb` flag + `inRollback(fn)` |
| Shared e2e steps: `COOKIES_RE` ×4, "open cookies via Discover" ×3, local `goto` copy | authenticated, compare, invariants, recipe | into `e2e/helpers.ts` |
| Literal message strings in tests; stale "pass 1/pass 2" comments | submission, new, edit, search tests | import the constants |

## Over-building and drift

`ACCEPTED` const used once while friends.ts uses the literal 19 times; a transaction around one update; guards for impossible states (recipe page, edit); comments contradicting code (recipe page fork count, `parseFilters` doc, orphan doc in `lib/journal.ts`); hand-written `RecipeChoice` duplicating an inferred type; `Viewer` declared three times; `Tx` imported from tags.ts; `VISIBILITIES` in validation.ts while sibling `as const` lists live in schema.ts; hand-written visibility unions in entryForm and a db test.

## Top three

1. `viewableRecipe` / `ownRecipe` / `inLibraryOf`: seven access copies become one path and the 403 shape stops drifting.
2. `cardList` + `tagSelection`, and passing `user` on the forks page (a real undercount).
3. One `failure()` with typed codes, `storePhoto`, `requireUser`: the `{ error, code }` rule becomes a type.
