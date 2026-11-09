---
name: code-health
description: Scheduled whole-repo health sweep for Fork — duplicated components, helpers and CSS (with a status row per shared component), dead routes, components and functions, oversized files and their seams, blind or stale tests, doc drift (DESIGN.md, AGENTS.md, docs/README.md against the code), type and lint hygiene, migration journal consistency, dependency pins. Produces ONE ranked report under docs/audits/ with evidence and effort per item; fixes are separate builder items routed through review. Run monthly, after any build that lands more than ~1000 lines or more than two parallel slices, and before a production publish.
---

# Code health — the sweep, the ranking, the hand-off

**Named failure:** rot nobody owns. Five parallel slices each built their own inline confirm, avatar, failure builder and access check (9 Nov 2026); a `.text-btn` defined three times locally so a hover change missed two of them; a doc paragraph describing a checkbox that became radios. Each is cheap alone; together they make every change slower and every review less sure. This skill makes the sweep somebody's job and keeps its output in one place.

The sweep is READ-ONLY. It writes exactly one file, `docs/audits/code_health_<YYYY-MM-DD>.md`. Every fix is a separate builder item with the repo's normal review. Deletions follow the operator rule in AGENTS.md (orphaned, duplicate or superseded files may go to Trash; anything else needs a yes; never `rm`). The sweep never runs e2e while builders are active and never reads `.env*`.

## 1. The sweep (measure, do not impress)

Every line of the report carries evidence: a `file:line`, or the command and the number it printed. "Looks duplicated" is not a finding; two `file:line`s with matching bodies are.

| Area | How | Finding when |
|---|---|---|
| **Deduplication: component status** | For each file in `src/lib/components/**` (and the shared list in DESIGN.md "Shared components"): `grep -rl "<Name" src --include='*.svelte' \| wc -l` for usages; then grep for the shape it owns (`role="menu"`, `aria-pressed`, `class="choice"`, `avatar`, `confirm`, `line-clamp`) outside it for local copies. One row per component: usages · local copies remaining (file:line) · drift between copies (props, CSS, a11y). | a shared component with a hand-rolled twin; a pattern in 2+ places with no component; a component with one usage and no second coming (yagni). |
| **Deduplication: helpers and server** | AST or grep: same function name in 2+ files; repeated `formData.get`/zod/`fail(...)` shapes; access checks (`canView`, `visibleTo`) re-sequenced per route; same `sql` fragment twice; `/^\d+$/`, `toISOString().slice(0,10)`, `.find(v => v === x)` idioms. Compare with the "Shared helpers" list in AGENTS.md. | propose ONE owner per copy set. |
| **Deduplication: CSS** | `grep -rn "min-height: 44px\|border-radius: var(--radius-pill)\|content: '·'\|text-wrap\|inset: 0; width: 100%" src --include='*.svelte'`; component `<style>` blocks that restate an `app.css` class. | same rule in 2+ components → `app.css` utility or component. |
| **Dead code** | routes with no inbound link or redirect (`grep -rn "href=\"/<route>"`), components with zero imports, exported functions referenced only in their own test, `*.svelte` with no route and no importer. | no caller AND no commit in 60 days, or superseded by a redirect. |
| **Oversized files** | `wc -l src/**/*.svelte src/**/*.ts \| sort -n \| tail -15` | > 600 lines for a component, > 800 for a server module. Name the seams or say "leave it". |
| **Blind or stale tests** | tests that grep `<style>` source with regexes; `test.skip`/`describe.skip`/`skipIf` older than 60 days (blame); literal UI strings asserted where a constant exists; e2e helpers duplicated across `e2e/*.ts`. | brittle or silently skipped. |
| **Docs drift** | DESIGN.md claims vs code (labels, breakpoints, colours, component names: grep each quoted label); AGENTS.md shared-helper list vs `src/lib`; `docs/README.md` links resolve (`python3` link checker as in the 9 Nov layout pass); `docs/design/*/DESIGN-SUMMARY.md` "Build record" vs routes. | a sentence the code contradicts; a dead link; a decided item with no code and no "later" note. |
| **Hygiene** | `grep -rn ": any\|as any\|eslint-disable\|@ts-ignore\|svelte-ignore" src`; `pnpm lint` and `pnpm check` summaries from the last clean run; `grep -rn "ponytail:" src` (debt ledger: still true, upgrade due, or delete). | each `any`; each disable without a reason; each stale ponytail note. |
| **Database** | `drizzle/meta/_journal.json` idx chain and snapshot `prevId`s; `pnpm db:generate` dry run says "No schema changes"; `as const` unions in `schema.ts` vs hand-written unions elsewhere; indexes behind every `orderBy`/`where` on a date column in a list query. | drift or a missing index on a hot list query. |
| **Dependencies** | `package.json` vs `import` grep; unpinned ranges. | unused dep, unpinned import. |
| **Pool and connections** | `src/lib/server/db/index.ts` has `max`, `idle_timeout`, dev-global reuse and `end()` on dispose/SIGINT; `*.db.test.ts` close their client. | any missing. |

## 2. Tags (ponytail's, plus three of ours)

One line per finding: `<tag> <what>. <replacement>. [path:line] (S/M/L)`.

- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `reuse:` a hand-rolled twin of an existing component, helper or class. Name the owner.
- `extract:` the same shape in 2+ places with no owner yet. Name the new file and props.
- `stdlib:` / `native:` hand-rolled thing the standard library or the platform ships. Name it.
- `yagni:` abstraction with one implementation, config nobody sets, prop nobody passes.
- `shrink:` same logic, fewer lines. Show the shorter form.
- `split:` a file past its seams. Name the seams.
- `blind:` a test whose target can move without turning it red. Name the owner helper.
- `drift:` a doc or comment that no longer matches the code. Name the owning doc section.

Correctness bugs, security and performance are OUT of scope here: route them to `/code-review` or the `schema-reviewer` agent and say so in the report.

## 3. Ranking

Score = (reach × spread) / effort. Reach: how many changes per month touch it (git log count, 90 days). Spread: number of copies or callers. Effort: S ≤ 1 h, M ≤ 1 day, L more. Top 10 first with a one-line "do this" each; the long tail after. End with: `net: -<N> lines, -<M> deps possible.` or `Lean already. Ship.`

## 4. Report shape (`docs/audits/code_health_<date>.md`, ≤ 250 lines)

1. Ten-line summary: unit/check/e2e line (from the last clean run, never re-run here), largest file, component-status totals (shared components · with twins · patterns without an owner), net cut possible.
2. Top 10, ranked, one line each with the tag format above.
3. Component status table (every shared component, one row).
4. Long tail by area (the §1 table order).
5. What could not be verified.
6. Delta vs the previous report (items closed, items new). The previous report is the newest `docs/audits/code_health_*.md`; the first run's predecessors are `docs/research/2026-11-09-ui-reuse-sweep.md` and `2026-11-09-server-reuse-sweep.md`.

Written once; never maintained. The NEXT sweep writes a new dated file and reads the old one for the delta. A finding that becomes work gets a line in the roadmap report's backlog or a builder brief, not a report edit.

## 5. Cadence and triggers

- Monthly, or at the start of a session with no builder active.
- After any build landing more than ~1000 lines or more than two parallel slices: run §1 rows **Deduplication** (all three) and **Docs drift** the same day. Those are the rows that broke after the 9 Nov MVP build.
- Before `pnpm db:migrate:prod` and a Netlify publish: the full sweep.

## 6. Running it

Delegate to ONE read-only agent (`Explore` or `general-purpose` with write access to the report path only). Brief = this file's §1 table + the report path + the previous report path. Wall budget 45 min. The agent returns the ten-line summary; the main session reads the report and hands fixes to builders with the normal review. Verification is Playwright, not the Chrome extension.
