# Fork / RecipeBook — Project CLAUDE.md

## Project Overview
Full-stack recipe platform with git-style version control for recipes.
Stack: SvelteKit + TypeScript frontend, PostgreSQL backend.
Live at recipes.spencerfletcher.com.

## Architecture
- SvelteKit handles routing, SSR, and API endpoints
- Version control model is central — understand the branching/diffing logic before touching it
- PostgreSQL schema reflects the versioning model: treat migrations carefully

## Database
- Never modify the schema without a migration file
- Migrations are one-way — no rollback scripts means you need to get it right
- Version history is append-only by design — don't add any logic that mutates past versions
- Test schema changes locally against a copy of prod data structure before shipping

## Frontend
- TypeScript strict mode — no `any`
- Svelte stores for shared state, props for component-local state
- Keep components small and single-purpose
- Accessibility matters: interactive elements need keyboard support and ARIA where appropriate

## API / Endpoints
- Validate all inputs server-side — don't trust client data
- Return consistent error shapes: `{ error: string, code: string }`
- Auth-gated endpoints need explicit permission checks — don't rely on route structure alone

## Deployment
- This is a live site — flag anything that would cause downtime or data loss
- Test SSR behavior locally before pushing — hydration bugs are hard to catch after deploy
