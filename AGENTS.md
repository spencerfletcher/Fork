# Fork — Project AGENTS.md

## Project Overview

Full-stack recipe platform with git-style version control for recipes. Stack: SvelteKit + TypeScript frontend, PostgreSQL backend. Live at recipes.spencerfletcher.com.

Planning and design docs: start at `docs/README.md`, which names the current product and design direction.

## Architecture

- SvelteKit handles routing, SSR, and API endpoints
- Version control model is central — understand the branching/diffing logic before touching it
- PostgreSQL schema reflects the versioning model: treat migrations carefully

## Database

- Drizzle is the ORM: write queries with it, and keep `src/lib/server/db/schema.ts` as the typed source of truth for every table
- Schema changes edit `schema.ts` and run `pnpm db:generate --name <what-changed>` in the same commit; review the SQL it writes into `drizzle/`. Data-only fixes use `pnpm db:generate --custom`
- Never use `drizzle-kit push`: it changes a database with no migration file. Apply with `pnpm db:migrate` (local) or `pnpm db:migrate:prod` (hosted, guarded by `SUPABASE_PROJECT_ID`)
- Never modify the schema without a migration file
- To inspect the hosted database, use `pnpm db:read:prod "<sql>"`: read-only by construction, through the Management API with the Database: Read token in `.env` (`SUPABASE_ACCESS_TOKEN`)
- Migrations are one-way — no rollback scripts means you need to get it right
- Version history is append-only by design — don't add any logic that mutates past versions
- Pre-production: no backward compatibility with stored data. When a JSONB shape changes, change the type, update the seed, reseed. No legacy types, no backfill or normalize helpers, no sanitising for data nothing writes any more
- Store only what cannot be derived. Position in a list is its number; do not add a stored index field
- Test schema changes locally against a copy of prod data structure before shipping

## Frontend

- TypeScript strict mode — no `any`
- Naming: an ingredient's number is `quantity` (never `amount`, which is reserved for quoting external APIs such as Spoonacular's `sourceAmount`)
- Status-like values are string literal unions, not enums. When a list must exist at runtime, declare it `as const` and derive the type from it
- Svelte stores for shared state, props for component-local state
- Keep components small and single-purpose
- Accessibility matters: interactive elements need keyboard support and ARIA where appropriate

## Reuse before building

- Before writing a control, helper, query or test fixture, look for one that exists: `src/lib/components/` (shared UI; the list in DESIGN.md under "Shared components"), `src/lib/server/` and `src/lib/*.ts` (helpers; the list below under "Shared helpers"), `src/app.css` (shared classes), `src/lib/testing/` (test helpers)
- Same shape, reuse it. Different item, don't force it. A shape needed in two places becomes one shared piece in `src/lib/`, not two local copies
- A build brief names the component or helper each item reuses, or says "extract a shared one". A review treats a hand-rolled duplicate of an existing piece as blocking
- When parallel builders work at once, land or name the shared pieces first, then fan out
- The [`code-health`](.agents/skills/code-health/SKILL.md) skill sweeps the repo for duplication (with a status row per shared component), dead code, drift and hygiene into one dated report under `docs/audits/`: monthly, after any build over ~1000 lines or more than two parallel slices, and before a production publish

### Shared helpers

- `viewableRecipe(slug, user, with?)` (`src/lib/server/visibility.ts`): load a recipe by slug the viewer may see, or null (the caller throws its own 404)
- `ownRecipe(slug, userId, with?)` (`src/lib/server/visibility.ts`): load the viewer's own recipe, or throw the one 403 (`NOT_AUTHORIZED`)
- `inLibraryOf(user)` (`src/lib/server/visibility.ts`): SQL for own recipes plus saved ones the viewer may see
- `authorIsFriendOf(userId)` (`src/lib/server/visibility.ts`): SQL for recipes whose author is an accepted friend; visibleTo's friends rule and the Friends filter (Discover, Search), always ANDed with `visibleTo`
- `eitherWay([requester, addressee], a, b)` (`src/lib/server/visibility.ts`): the friendship pair matched either way round, as the unique index orders it
- `namedBy(username)` (`src/lib/server/profiles.ts`): SQL for the profile a URL username or `@handle` names, current or former; every reader of a username from the URL goes through it (the caller redirects when the current name differs)
- `changeUsername(id, username, conn?)` and `usernameTaken(username, self?, conn?)` (`src/lib/server/profiles.ts`): a rename that keeps the old name reserved to its owner, as `{ result: 'changed' | 'taken' | 'too_soon' }` with the next allowed day (former names last `FORMER_USERNAME_DAYS`, at most `USERNAME_CHANGES_PER_WINDOW` new names in that window, `src/lib/auth/rules.ts`), and the taken check across current and former names
- `cardList(where, orderBy, viewer, { tagRank?, limit? })` (`src/lib/server/recipeCounts.ts`): recipe cards with their counts, more tag matches first
- `tagSelection(allTags, slugs, withinIds?)` (`src/lib/server/tagFilter.ts`): the URL's tags resolved and matched
- `failure(status, code, error, extra?)` and `FAILURE_CODES` (`src/lib/server/actions.ts`): every `fail()` in the `{ error, code }` shape, codes from one list
- `requireUser(url, user)` and `SESSION_ENDED(verb)` (`src/lib/server/actions.ts`): the signed-out redirect and its one wording
- `signedOut(retry?, extra?)` and `BAD_FORM` (`src/lib/server/actions.ts`): an action's 401 when its session lapsed, and the 400 wording for missing or malformed hidden fields
- `lockForSave`, `appendVersion`, `commitSave` and `restoreVersion` (`src/lib/server/versions.ts`): the append-only write path for v2 onwards: the recipe row locked with its latest version (or why the save stops), the next version inserted, the row's copies and revision bumped in one update, and a past version's content appended as the newest
- `text(formData, key)` (`src/lib/helpers.ts`): a form field as a string, missing or a File read as empty
- `parseFilters(url)` (`src/lib/server/recipeSearch.ts`): the `?q=` and `?tags=` filters shared by Search, Cookbook and Discover
- `setShallowParam(name, value | null)` (`src/routes/recipes/[slug]/components/shallowParam.ts`): one query param set or dropped by a shallow replace, building on `page.shallow`'s URL
- `trashedRecipe(slug, userId)`, `inTrashOf(userId)`, `deleteForever(recipeId, supabase)` and `purgeExpiredTrash(supabase)` (`src/lib/server/trash.ts`): the owner's restorable trashed recipe or null, the Trash as SQL (`TRASH_DAYS` from `src/lib/trash.ts`), the one permanent-deletion path (it erases instead while savers keep copies, blanking the row's words), and the hourly purge (which also finishes an erased recipe no copy is left of). `viewableRecipe`, `ownRecipe`, `visibleTo` and `canView` never return a trashed recipe
- `keptCopyOf(user)` and `keptCopy(slug, user, with?)` (`src/lib/server/visibility.ts`): the one rule for a saver's read-only copy of a recipe its author withdrew (private, Trash, erased), as SQL and as viewableRecipe's sibling (the recipe and the one kept version, or null); `inLibraryOf` includes it
- `grantKeptCopies(tx, recipe)`, `keepVersion(userId, recipeId, n | null)`, `setNote(userId, recipeId, note)`, `removeCopy(userId, recipeId)` and `keptVersionsOf(user, recipeIds)` (`src/lib/server/keptCopies.ts`): copies granted when a recipe goes private (an unfriend's forks included) or to the Trash, Keep this version and Follow latest, the saver's note, a copy removed under the recipe's row lock (true when the caller must finish an erase), and the kept version a list shows for a copy (never the recipe row's copies). A copy's page or card data is an explicit pick of the row, never a spread; `NOTE_MAX` and `NOTE_TOO_LONG` in `src/lib/saves.ts`
- `collectionsOf(user, recipeId?)`, `recipeIdsIn(user, collectionId)`, `createCollection`, `renameCollection`, `deleteCollection`, `setMembership(user, collectionId, recipeId, member)` and `leaveCollections(userId, recipeId)` (`src/lib/server/collections.ts`): a cook's collections with counts of what is still in their library (makes the starters "To cook" and "Favorites" once, recorded in `profiles.starters_made_at`), a collection's recipe ids or null when not theirs, the name rules (`collectionName` and `COLLECTION_NAME_MAX` in `src/lib/collections.ts`), membership only for a recipe in the cook's library, and an unsave's cleanup
- `uniqueViolation(e)` (`src/lib/server/profiles.ts`): a Postgres unique-key refusal, through Drizzle's wrapper
- `storePhoto(formData, supabase, userId)` (`src/lib/server/submission.ts`): a form's photo stored, or why it was refused
- `listDrafts(userId)` (`src/lib/drafts.ts`): this device's editor drafts for one cook, newest first, for the Cookbook's Drafts list; `saveDraft`, `loadDraft`, `clearDraft` beside it
- `textSearch(query)` and `searchMatches(query, ids, conn)` (`src/lib/server/recipeSearch.ts`): the `?q=` match and rank (title, then current ingredients, then the rest of the current version, then older versions; saves break ties) for any card list, and why each result matched, its words marked for `segments(marked)` (`src/lib/highlight.ts`) to render as text
- `recipeSlug(title)` (`src/lib/helpers.ts`): a new recipe's ASCII slug with its random suffix ("recipe-…" for a title with no Latin letters); `slugify` keeps any script's letters, for tags
- `readDuration(typed)`, `formatDuration(minutes)` and `timeSpans(times)` (`src/lib/recipes/times.ts`): a typed time ("1 h 30", "overnight") as minutes or why not, minutes as "1 h 30 min", and a recipe's prep, cook and rest as separate value-and-word spans, never a total; `TIME_FIELDS` names them
- `contentDraft(content, settings)` (`src/lib/recipes/validation.ts`): a version's content as the editor's form strings (times as words), or a blank form; the edit and new pages and every test draft start from it
- `readSourceUrl(typed)` and `sourceLabel(name, url)` (`src/lib/recipes/validation.ts`): a source link kept as http(s) only, a bare address taken as https; how a source reads (its name, else the host)
- `exportFor(userId, origin, recipeId?, conn?)` (`src/lib/server/export.ts`): the cook's own data as a `ForkExport` (`src/lib/export/archive.ts`, the one shape for the JSON and Markdown downloads); `exportRequest(url, user)` (the 401/400 refusals) and `exportResponse(ex, format)` (the uncached attachment) beside it; `toMarkdown(ex)` (`src/lib/export/markdown.ts`); `exportHref(format, slug?)` for the download links
- `oneOf(list, value)` (`src/lib/helpers.ts`): a value from an `as const` list, else undefined
- `wholeNumber(s)` (`src/lib/helpers.ts`): digits only as a number, else null
- `plural(n, word, pluralForm?)` (`src/lib/helpers.ts`): "1 fork", "2 forks", "2 entries"
- `compactCount(n)` (`src/lib/helpers.ts`): "1.2k", "2.5M" for a pill
- `day(iso)`, `dayLabel(string | Date)` and `sourceHref(source)` (`src/lib/journal.ts`): a calendar day read as UTC, its label, a journal entry's recipe link
- `pendingEnhance(...)` (`src/lib/pendingEnhance.svelte.ts`): a form's pending and kept-error state, its result applied on the page at its URL (query kept; a redirect still goes); `keepFailure` holds a refusal from another route's action, which SvelteKit does not hand to the page's `form`
- `convertIngredient(ingredient, grams, measurement)` (`src/lib/recipes/convert.ts`): a row in the cook's metric or US units for display, with the measure as written, or the row unchanged; Metric leads with grams for a volume of anything but a liquid whose ml are its grams (`likeWater` in what `gramsFor` returns, `src/lib/server/ingredientDensities.ts`, from `ML_IS_GRAMS_TOLERANCE` and `WEIGHED_NEAR_WATER` in `src/lib/server/gramTables.ts`), spoons from `MIN_SPOON_GRAMS`; tables in `UNITS`, rules in DESIGN.md under Measurement
- `splitMeasure(ingredient)` and `unitFor(unit, n)` (`src/lib/recipes/scale.ts`): a typed line's measure and the words after it, for rewriting; a full-word unit's singular or plural
- `optimisticToggle(initial, { failure, report, refresh? })` (`src/lib/optimisticToggle.svelte.ts`): a pressed state that flips at once, rolls back on refusal, one request at a time; `refresh` applies a success in place, query kept. Bare `use:enhance`, or `update()` without `navigate: false`, lands on the action's URL, which a relative `?/name` has stripped of the page's query
- Testing: `loadEvent`, `formEvent` and `formOf` (`src/lib/testing/actions.ts`), `invokeAction(action, event)` and `loadPage<PageData>(load, event)` (same file: an action's returned or thrown result, a loader's narrowed data), `mockDb` (`src/lib/testing/drizzle.ts`, hoisted at the call site), `sqlOf(q)` (same file: a query fragment as its SQL text and params), `localDb`, `inRollback`, `withProfiles(n, body)`, `stamp()` and `closeDbAfter()` (`src/lib/testing/db.ts`: whether the local stack is the target, a rolled-back transaction, one with `n` fresh profiles, a run-unique suffix, the pool closed after the file), `lastShallowUrl(goto)` (`src/lib/testing/navigation.ts`: the URL of a mocked `goto`'s last call, asserted a shallow replace), `cssRule(source, selector)` and `cssRules` (`src/lib/testing/css.ts`: a rule's body read from app.css or a `<style>`, for the tests jsdom cannot style); e2e: `gotoHydrated`, `COOKIES_RE`, `openCookies`, `createRecipe(page, title, { servings?, cookTimeMinutes? })`, `postAction(page, url, fields?)`, `deleteRecipe(page, url)` and `uniqueTitle(label)` (`e2e/helpers.ts`: a private recipe of the signed-in cook's, a form action posted from the page, the cleanup to the Trash, a title no other run shares)

## API / Endpoints

- Validate all inputs server-side — don't trust client data
- Return consistent error shapes: `{ error: string, code: string }`
- Auth-gated endpoints need explicit permission checks — don't rely on route structure alone

## Testing

- Every new feature must have tests before it's marked done — no exceptions
- Order: server logic tests first (Vitest, Node env), then component tests, then e2e
- Unit test files live next to the source file: `Foo.svelte` → `Foo.svelte.test.ts`, `page.server.ts` → `page.server.test.ts`
- Use `@testing-library/svelte` for component tests; match existing `makeX()` helper patterns
- Use `vi.hoisted()` for any mock function used inside `vi.mock()` factory
- Build recipe content fixtures with the helpers in `src/lib/recipes/fixtures.ts`, never with hand-written object literals, so a shape change touches one file
- When a stored type changes shape, do the type and every reader as one vertical slice so `svelte-check` is green at the end of the task; server-first ordering is for new features
- Run `pnpm test:unit` before committing; don't commit with failing unit tests
- `pnpm test:e2e` runs against its own `fork_e2e` database, reset to the seed every run, so e2e tests may assume the seed; the dev database is never touched

## Deployment

- This is a live site — flag anything that would cause downtime or data loss
- Test SSR behavior locally before pushing — hydration bugs are hard to catch after deploy

## Working with agents

Two-way doors swing freely: walk through them and show the result after. Stop at one-way doors. If the answer would be a rubber stamp, don't ask; if running something could answer the question, run it. Save questions for taste and product calls only Spencer can make, one at a time, with a recommendation, using the harness's question tool. "No" is an acceptable answer. Once a one-way door is opened it stays open for that piece of work, including for any subagent handed it (quote the decision). Come back only if the door turns out to be different from the one opened: more at stake than stated, a check failing, something unknown at the time.
