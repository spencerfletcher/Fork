# Fork — Project AGENTS.md

## Project Overview

Full-stack recipe platform with git-style version control for recipes. Stack: SvelteKit + TypeScript frontend, PostgreSQL backend. Live at recipes.spencerfletcher.com.

## Architecture

- SvelteKit handles routing, SSR, and API endpoints
- Version control model is central — understand the branching/diffing logic before touching it
- PostgreSQL schema reflects the versioning model: treat migrations carefully

## Database

- Drizzle is the ORM: write queries with it, and keep `src/lib/server/db/schema.ts` as the typed source of truth for every table
- Schema changes edit `schema.ts` and run `pnpm db:generate --name <what-changed>` in the same commit; review the SQL it writes into `drizzle/`. Data-only fixes use `pnpm db:generate --custom`
- Never use `drizzle-kit push`: it changes a database with no migration file. Apply with `pnpm db:migrate` (local) or `pnpm db:migrate:prod` (hosted, guarded by `SUPABASE_PROJECT_ID`)
- Never modify the schema without a migration file
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

## Deployment

- This is a live site — flag anything that would cause downtime or data loss
- Test SSR behavior locally before pushing — hydration bugs are hard to catch after deploy

## Working with agents

Two-way doors swing freely: walk through them and show the result after. Stop at one-way doors. If the answer would be a rubber stamp, don't ask; if running something could answer the question, run it. Save questions for taste and product calls only Spencer can make, one at a time, with a recommendation, using the harness's question tool. "No" is an acceptable answer. Once a one-way door is opened it stays open for that piece of work, including for any subagent handed it (quote the decision). Come back only if the door turns out to be different from the one opened: more at stake than stated, a check failing, something unknown at the time.
