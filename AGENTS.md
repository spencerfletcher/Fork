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
- `changeUsername(id, username, conn?)` and `usernameTaken(username, self?, conn?)` (`src/lib/server/profiles.ts`): a rename that keeps the old name reserved to its owner, and the taken check across current and former names
- `cardList(where, orderBy, viewer, { tagRank?, limit? })` (`src/lib/server/recipeCounts.ts`): recipe cards with their counts, more tag matches first
- `tagSelection(allTags, slugs, withinIds?)` (`src/lib/server/tagFilter.ts`): the URL's tags resolved and matched
- `failure(status, code, error, extra?)` and `FAILURE_CODES` (`src/lib/server/actions.ts`): every `fail()` in the `{ error, code }` shape, codes from one list
- `requireUser(url, user)` and `SESSION_ENDED(verb)` (`src/lib/server/actions.ts`): the signed-out redirect and its one wording
- `trashedRecipe(slug, userId)`, `inTrashOf(userId)`, `deleteForever(recipeId, supabase)` and `purgeExpiredTrash(supabase)` (`src/lib/server/trash.ts`): the owner's restorable trashed recipe or null, the Trash as SQL (`TRASH_DAYS` from `src/lib/trash.ts`), the one permanent-deletion path, and the hourly purge. `viewableRecipe`, `ownRecipe`, `visibleTo` and `canView` never return a trashed recipe
- `storePhoto(formData, supabase, userId)` (`src/lib/server/submission.ts`): a form's photo stored, or why it was refused
- `listDrafts(userId)` (`src/lib/drafts.ts`): this device's editor drafts for one cook, newest first, for the Cookbook's Drafts list; `saveDraft`, `loadDraft`, `clearDraft` beside it
- `changeUsername(id, name)` (`src/lib/server/profiles.ts`): `changed`, `taken` or `too_soon` with the next allowed day; former names last `FORMER_USERNAME_DAYS`, at most `USERNAME_CHANGES_PER_WINDOW` new names in that window (`src/lib/auth/rules.ts`)
- `oneOf(list, value)` (`src/lib/helpers.ts`): a value from an `as const` list, else undefined
- `wholeNumber(s)` (`src/lib/helpers.ts`): digits only as a number, else null
- `plural(n, word, pluralForm?)` (`src/lib/helpers.ts`): "1 fork", "2 forks", "2 entries"
- `compactCount(n)` (`src/lib/helpers.ts`): "1.2k", "2.5M" for a pill
- `day(iso)`, `dayLabel(string | Date)` and `sourceHref(source)` (`src/lib/journal.ts`): a calendar day read as UTC, its label, a journal entry's recipe link
- `pendingEnhance(...)` (`src/lib/pendingEnhance.svelte.ts`): a form's pending and kept-error state; `keepFailure` holds a refusal from another route's action, which SvelteKit does not hand to the page's `form`
- `optimisticToggle(initial, { failure, report, refresh? })` (`src/lib/optimisticToggle.svelte.ts`): a pressed state that flips at once, rolls back on refusal, one request at a time
- Testing: `loadEvent`, `formEvent` and `formOf` (`src/lib/testing/actions.ts`), `mockDb` (`src/lib/testing/drizzle.ts`, hoisted at the call site), `sqlOf(q)` (same file: a query fragment as its SQL text and params), `inRollback` (`src/lib/testing/db.ts`), `lastShallowUrl(goto)` (`src/lib/testing/navigation.ts`: the URL of a mocked `goto`'s last call, asserted a shallow replace), `cssRule(source, selector)` and `cssRules` (`src/lib/testing/css.ts`: a rule's body read from app.css or a `<style>`, for the tests jsdom cannot style); e2e: `gotoHydrated`, `COOKIES_RE`, `openCookies` (`e2e/helpers.ts`)

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
