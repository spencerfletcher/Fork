# Code health · 10 Nov 2026

First sweep under `.agents/skills/code-health/SKILL.md`, read-only, on master `3185727`. One file written (this one). Fixes are separate builder items.

## 1. Summary

1. Last clean run (not re-run here): unit 1689 tests / 126 files passed, svelte-check 0 errors, lint clean, e2e 221 passed 0 failed at 4 workers, on `f252e5b`. `pnpm lint` re-run on `3185727`: clean (exit 0).
2. Largest file: `src/lib/components/recipes/GroupedTextEditor.svelte` 580 lines (under the 600 bar); largest test `e2e/recipe.test.ts` 1868; `src/app.css` 1291.
3. Components: 24 under `src/lib/components` · 1 with a hand-rolled twin (`Dropdown`'s panel and row CSS, twice) · 2 patterns without an owner (avatar+handle link, CSS-rule extractor in tests) · 1 dead (`BrowseSections`).
4. Closed set: 17 allowlist entries, 13 justified, 2 should become one shared class (`clear-ticks`), 2 need a DESIGN row (`friends-toggle`, `.btn-sm` is a local twin outside the set).
5. Dead code: `BrowseSections.svelte` + `lib/recipes/browse.ts` + 2 tests (153 lines); `.commit-bar*` and `.inline-checkbox*` in app.css (~38 lines).
6. Server: `{ error, code }` rule broken by 11 raw `fail()` in the four auth routes; 6 `error(401, 'Login required…')` left.
7. Docs drift: 7 sentences the code contradicts (AGENTS `viewableRecipe`, DESIGN photo buttons, Icons list, commit bar, Choose photo, app.css comments).
8. Hygiene: 4 `as any` (one test file); every other suppression carries a reason; 3 ponytail notes, all still true.
9. Database: journal 11 entries, idx and snapshot `prevId` chain intact; `db:generate` dry run skipped (would write on drift), unverified.
10. net: -300 lines possible (estimate), -0 deps.

## 2. Top 10

Score = (90-day commits on the files × copies) / effort (S=1, M=4). Commit counts from `git log --since=2026-08-12 --oneline -- <file> | wc -l`.

1. `extract:` the menu panel and menu row CSS, written twice with drift (min-width 180 vs 200; font-size 0.9375rem vs inherit). Move into `Dropdown.svelte` as `.menu-panel` / `.menu-row` (+ `.menu-row.danger`). [src/lib/components/ui/Navbar.svelte:238-274, src/routes/friends/MoreMenu.svelte:126-165] (S) — reach 46 × 2.
2. `blind:` About 19 hand-written CSS-rule extractors over `?raw` source across 18 test files; each regex breaks differently when a rule moves to app.css or is reformatted. One `cssRule(source, selector)` in `src/lib/testing/css.ts`. [e.g. Navbar.svelte.test.ts:198, RecipeActions.svelte.test.ts:154, RecipeMethod.svelte.test.ts:147, RecipeForm.svelte.test.ts:139, error.test.ts:47] (M) — reach 87 (app.css) × 19.
3. `delete:` `BrowseSections` has 0 importers since `/recipes` became a redirect (dffb8d7, 9 Nov); `browseSections()` has no other caller. Delete the component, `browse.ts` and both tests, 153 lines. [src/lib/components/recipes/BrowseSections.svelte:1, src/lib/recipes/browse.ts:15] (S)
4. `delete:` app.css rules with no user: `.commit-bar`, `__versions`, `__message` (last user gone in fc6f653) and `.inline-checkbox`, `__note` (the public checkbox, replaced in 3637270). [src/app.css:1243-1268, 946-949, 1000-1006] (S) — reach 87.
5. `reuse:` 11 raw `fail()` without `code` in the auth routes; `failure()` owns the shape (needs codes such as `invalid`, `unauthenticated`, maybe `auth_failed`). [src/routes/login/+page.server.ts:22,38; signup/+page.server.ts:27,30,35,42; forgot-password/+page.server.ts:13,23; reset-password/+page.server.ts:50,53,59] (S) — reach 26 × 11.
6. `drift:` AGENTS.md says `viewableRecipe` throws the 404; it returns null and 5 callers throw their own. Make it throw (`shrink:` -5 lines; journal.ts:135 wants null, so give that caller its own path) or fix the AGENTS line. [src/lib/server/visibility.ts:66-74; routes/recipes/[slug]/+page.server.ts:37,111,131; diff/+page.server.ts:16; forks/+page.server.ts:14] (S)
7. `reuse:` 6 actions throw `error(401, 'Login required…')`, a third wording (and "Login", not DESIGN's "Log in"); use `failure(401, 'unauthenticated', SESSION_ENDED(...))` as the other actions do. [routes/recipes/[slug]/+page.server.ts:108,124; journal/[id]/edit/+page.server.ts:113; friends/+page.server.ts:40,98,108] (S)
8. `reuse:` `pendingEnhance` hand-rolled twice: DeleteEntry's `pending`/`error` submit, EntryForm's `pending` enhance. [src/routes/journal/[id]/edit/DeleteEntry.svelte:8-19, src/routes/journal/EntryForm.svelte:130-135] (S) — reach 17.
9. `drift:` DESIGN.md says Choose photo is "in the ghost button's voice" and Keep photo "a ghost"; both are `.text-btn`, and PhotoField restates `.text-btn`'s 44px phone rule. Fix the DESIGN sentence; delete the local 44px rule. [DESIGN.md:324; src/lib/components/recipes/PhotoField.svelte:95,116,174-179 vs src/app.css:516-520] (S)
10. `extract:` the avatar+handle author link drawn twice (`.card-cook`, `.lead-cook`: same flex, gap 8, 24px, phone `min-height: 44px; margin-block: -8px`). One `AuthorLink.svelte` `{username, size}` in `ui/`, landing after the in-flight RecipeCard handle fix. [src/lib/components/recipes/RecipeCard.svelte:100,332-357; src/routes/discover/Discover.svelte:57,172-233] (S) — reach 44 × 2.

## 3. Component status

Usages = files rendering `<Name` (component's own file excluded); importers counted the same way.

| Component | Usages | Local copies remaining | Drift / note |
|---|---|---|---|
| `Icons.svelte` | 12 importers | TabBar's Journal is a calendar (TabBar.svelte:35-37); `journalIcon` is a notebook (Icons.svelte:160-172, used RecipeActions.svelte:214) | Journal drawn two ways: a design call |
| `ui/Avatar` | 6 | none (no `toUpperCase`/`charAt(0)` outside it) | ok |
| `ui/Username` + `.handle` | 4 + 3 spans | RecipeCard (in flight) | ok otherwise |
| `ui/ConfirmStep` | 3 | MoreMenu's block step (decided) | ok |
| `ui/FormActions` | 2 | none | ok |
| `ui/ChoiceGroup` | 2 | none | ok |
| `ui/EmptyPanel` | 3 | Discover `.empty` (Discover.svelte:110,316-323) twins `.empty-state` (app.css:1237) | wording: "No recipes found" (search/+page.svelte:33,42) vs "No recipes match" (Discover.svelte:112, cookbook/+page.svelte:86,90) |
| `ui/ResultStatus` | 3 | none | ok |
| `ui/Dropdown` | 2 | panel and row CSS in both callers (Top 10 #1) | MoreMenu has no `role="menu"`/`menuitem` (route elsewhere) |
| `ui/SearchFilters` | 3 | none | `friends-toggle` chip has no DESIGN row |
| `ui/TagTabs` | 2 | none | its CSS lives in app.css:620-720, no `<style>` in the component; leave |
| `ui/TagInput` | 1 | EntryForm's recipe combobox repeats the arrow/Enter/Escape walk (EntryForm.svelte:104-119 vs TagInput.svelte:69-90) | shapes differ (create row, pills); leave |
| `ui/Navbar`, `ui/TabBar` | 1 each | — | layout singletons; fine |
| `recipes/RecipeCard` | 5 | `.card-cook` (Top 10 #10) | handle rules in flight |
| `recipes/RecipeGrid` | 4 | none | ok |
| `recipes/RecipeForm` | 2 | — | ok |
| `recipes/GroupedTextEditor` | 2 | — | 580 lines; leave |
| `recipes/IngredientEditor`, `StepEditor` | 1 each | 82-line diff between them after renaming | different parsers; leave |
| `recipes/ReadBack` | 2 | `.part + .part::before` twins `.dot-list` (ReadBack.svelte:42-45 vs app.css:539) | padding 0.5em vs 0.45em, no Ink 3 |
| `recipes/PhotoField` | 2 | local `.text-btn` font and 44px restatement (:163-179) | Top 10 #9 |
| `recipes/VersionDiff` | 1 | — | ok |
| `recipes/BrowseSections` | **0** | — | dead (Top 10 #3) |

## 4. Long tail

### Control inventory: the 17 allowlist entries (`src/lib/controls.test.ts:11-33`)

| # | Entry | Verdict |
|---|---|---|
| 1 | GroupedTextEditor `tool` | justified: DESIGN.md:324 specifies ink 600 with the band hover, which no closed-set class draws. Add a row to the table at DESIGN.md:265 |
| 2 | ConfirmStep `triggerClass` | justified: the test checks each `triggerClass="…"` at the call (controls.test.ts:62-66) |
| 3 | Navbar `nav-avatar-button` | justified: icon-only trigger |
| 4 | Navbar `''` account row | justified as a menu row; its CSS should be the shared `.menu-row` (Top 10 #1) |
| 5 | MoreMenu `more-button` | justified: icon-only trigger |
| 6 | MoreMenu `''` | as #4 |
| 7 | MoreMenu `danger` | as #4, `.menu-row.danger` |
| 8–9 | MoreMenu `confirm`, `confirm danger` | justified structurally; border in flight |
| 10 | TagInput `tag-remove` | justified: glyph with a `::before` hit (DESIGN.md:324) |
| 11 | TagTabs `''` | justified: tab |
| 12 | TagTabs `tag-tabs__clear` | justified: a tab in the row's padding, Ink 3 (app.css:709) |
| 13 | SearchFilters `friends-toggle` | **needs a decision**: a bordered marigold-tint chip (SearchFilters.svelte:159-179) that DESIGN's Chips and closed set never name |
| 14 | recipe page `''` section tab | justified: DESIGN.md:340 |
| 15–16 | RecipeIngredients / RecipeMethod `clear-ticks` | **should become a shared class in the set**: it is already one app.css class (app.css:1064-1085); name it (e.g. `.text-btn--quiet`), add it to `CLOSED_SET` and the DESIGN table, drop both entries |
| 17 | VersionBar `versions-toggle` | justified: ring hugs the text, hit on `::before` (DESIGN.md:358; VersionBar.svelte:233-250) |

- `yagni:` `.btn-sm` is a local ghost size (`min-height: 44px; padding: 0 14px`) outside the closed set. Drop it (ghost is already 48.8px tall) or ask Spencer for a row. [src/routes/friends/+page.svelte:45,68,231-234] (S)
- `shrink:` `.relation button:not(.text-btn) { min-height: 44px }` on ghosts already 48.8px tall: likely a no-op (render unverified). [src/routes/users/[username]/+page.svelte:160-162] (S)

### Deduplication: helpers and server

- `reuse:` the server's today written inline; `isRealDay` does its own round-trip. Use `day()` plus one `isoDay(date)` helper in `lib/journal.ts`. [src/routes/journal/new/+page.server.ts:44; src/lib/server/journal.ts:52] (S)
- `reuse:` hand-written `'private' | 'friends'` where `LogAudience` exists. [src/lib/server/db/seedData.ts:462 vs schema.ts:145] (S)
- `yagni:` `export` on names no other module imports: `SITE_URL` (seo.ts:20), `FRIENDSHIP_STATUSES` (schema.ts:80, used only for its type), `valuesOf` (routes/journal/entryForm.ts:22), `privatiseForksIn` (friends.ts:130), `FEED_LIMIT` (friends.ts:287). Found with a script that greps each `export` name outside its own file and tests. (S)
- `ensureProfile` still in try/catch on the create routes (recipes/new:36, journal/new:63), bare in friends:48 and the fork action (recipes/[slug]/+page.server.ts:140). Leave: the create routes have an upload to protect.

### Deduplication: CSS

- `reuse:` ReadBack's dot rule → `.dot-list` with `--dot-space`. [ReadBack.svelte:42-45] (S)
- `reuse:` Discover `.empty` → `.empty-state`; one wording for no results. [Discover.svelte:110-113,316-323; search/+page.svelte:33,42] (S)
- `drift:` the only `(width < 699px)` query in the repo; the other 36 say `(max-width: 699px)`, so at exactly 699px Clear ticks keeps its desktop hit while every other control has switched to the phone one. [src/app.css:1080] (S)
- Line-clamp in 5 files (RecipeCard:225,253,282; Discover:281; RecipeHeader:197; VersionBar:320; forks page uses Tailwind `line-clamp-3`): different line counts per place. Leave.

### Dead code

- Routes: every route has an inbound link or is a redirect (`/favorites`, `/recipes` → `/cookbook`, 301). Route-local `.svelte` and `.ts`: all imported.
- Components: `BrowseSections` only (Top 10 #3). CSS: Top 10 #4.

### Oversized files

- No component over 600 or server module over 800 lines (`wc -l`, top: GroupedTextEditor 580, seedData.ts 539, RecipeForm 475). Leave.
- `e2e/recipe.test.ts` 1868 lines: the seams are its `test.describe` blocks (header, scale, cook, ticks, version bar). Split only when it next needs to change.

### Blind or stale tests

- `blind:` "Not authorized" typed in 6 test files while `NOT_AUTHORIZED` (visibility.ts:77) exists; unit tests can import it. [pendingEnhance.svelte.test.ts, visibility.test.ts, recipes/[slug]/error.svelte.test.ts, edit/DeleteRecipe.svelte.test.ts, edit/page.svelte.test.ts, edit/page.server.test.ts] (S)
- `extract:` `sqlOf = (q) => new PgDialect().sqlToQuery(q)` copied 3 times, plus 9 inline `new PgDialect()`. Move it into `src/lib/testing/drizzle.ts`. [discover.server.test.ts:22, cookbook/page.server.test.ts:23, tags/[slug]/page.server.test.ts:28] (S)
- `reuse:` 4 `as any` with `eslint-disable` where `loadPage<PageData>` exists. [src/routes/users/[username]/page.server.test.ts:112-168] (S)
- `mockDb()` used in 3 files; 20 files still mock `#lib/server/db/index.js` by hand (`grep -rn "vi.mock(" src --include='*.test.ts' | grep "db/index"`). How many fit the helper's chain is unverified; check per file before converting.
- Skips: 4 `describe.skipIf(!localDb)` (db tests, intended); 6 `test.skip(!!row.auth !== signedIn())` in e2e/invariants.test.ts (project split, intended). None stale.

### Docs drift

- `drift:` DESIGN.md:313 lists a "commit bar" panel, which no longer exists (Top 10 #4). Owner: DESIGN "Cards / Containers".
- `drift:` DESIGN.md:382 says Icons holds "the editor's heading H"; it is a typed `H` in GroupedTextEditor.svelte:352. The list also leaves out `journalIcon` (Icons.svelte:16). Owner: DESIGN "Shared components".
- `drift:` the app.css comment says "search and favorites toggle them"; `/favorites` is a redirect, and Search, Discover and Cookbook toggle them through SearchFilters. [src/app.css:631-633] Also "Shared by the feed, search, favourites and tag pages" [src/app.css:1236]. (S)
- `drift:` the diff page's version card head is mono throughout, the date included, and types its dot; DESIGN.md:395 says dates are sans and DESIGN draws dots with CSS (the commit message's mono is decided and not counted here). [src/routes/recipes/[slug]/diff/+page.svelte:74-80,194-200] (S)
- `drift:` decision-pack build record row C says "Insert ▾" (now Section heading, DESIGN.md:324); its Deviations line says "top-bar handle shows from 1024" (now avatar alone, DESIGN.md:334). It is a dated record: add a "superseded, see DESIGN.md" line or leave it. [docs/design/2026-11-10-decision-pack/DESIGN-SUMMARY.md:100,106]
- AGENTS "Shared helpers": every named export exists at the stated path (scripted check, 0 missing). The one wrong claim is `viewableRecipe` (Top 10 #6).
- Links: 0 dead relative links in docs/README.md, AGENTS.md, DESIGN.md, README.md (python link check).

### Hygiene

- `any`: 4, all in users/[username]/page.server.test.ts (above). `@ts-ignore`: 0. `@ts-expect-error`: 1 with a reason (TagInput.svelte.test.ts:138).
- `eslint-disable` / `svelte-ignore`: 24 in src; each has a reason on its line or the line above, except `no-control-regex` at localPath.ts:11, whose regex says why.
- Ponytail ledger: app.css:624 (tab wrap at 700+; still true), discover.server.ts:67 (no pagination; still true, P1), recipes/[slug]/edit/+page.server.ts:199 (fork race; still true). None due.

### Database

- `drizzle/meta/_journal.json`: 11 entries, idx 0–10 contiguous, tags match the 11 `.sql` files, 11 snapshots with an unbroken `prevId` chain.
- `as const` unions: schema.ts:80,126,145; one hand-written copy (seedData.ts:462, above).
- Indexes: `recipes` has only `recipes_fts_idx` (schema.ts:75). List queries order by `recipes.updatedAt` (recipeSearch.ts:20,43) and filter `recipes.parentId` (forks/+page.server.ts:17). This is performance, so it is routed to `schema-reviewer`; unverified without EXPLAIN on real volume.

### Dependencies

- All 7 runtime and 28 dev dependencies are imported or used in a config or script (scripted grep). 0 unused.
- 33 caret ranges plus the exact `parse-ingredient` (`grep -c '"\^' package.json` counts 34 lines, `packageManager` included); the lockfile pins them. No change.

### Pool and connections

- `src/lib/server/db/index.ts`: `max: DB_POOL_MAX ?? 10`, `idle_timeout: 20`, client reused through globalThis in dev, `end({ timeout: 5 })` on SIGINT/SIGTERM. All 3 `*.db.test.ts` files call `closeDb`. Clean.

## 5. Could not be verified

- `pnpm db:generate` dry run: skipped, since it writes a migration when it finds drift. Schema/migration agreement is unverified.
- `pnpm check`: not re-run (`svelte-kit sync` writes `.svelte-kit/`); the summary uses the 10 Nov clean run on `f252e5b`.
- Rendered heights (`.btn-sm`, `.relation` 44px no-ops) and the index finding: unverified without a browser or EXPLAIN.
- How many of the 20 hand-mocked db test files fit `mockDb()`.

## 6. Delta vs the 9 Nov sweeps

**In flight (a builder branch, not counted here):** `.field-required` announced twice; `.text-btn:hover` underline; version chips in two sizes across `.vid`, RecipeCard `.meta-item--accent` and VersionBar `.version-number`; RecipeCard's own mono handle rules; MoreMenu confirm rows' light border; One Direction Rule wording.

**Decided, not drift:** grey text turning ink on hover; the diff page's mono commit message; `VISIBILITIES` in `src/lib/recipes/validation.ts`.

UI sweep (`docs/research/2026-11-09-ui-reuse-sweep.md`):
- Closed: ConfirmStep (3 users), FormActions (2), ChoiceGroup (2), Avatar (6), `Username` takes `class` + `.handle`, EmptyPanel (3), ResultStatus (3), `sourceHref` (JournalEntry, FeedEntry), `optimisticToggle` (RecipeActions, FeedEntry), one Icons file (12 importers, one Friends drawing), `.text-btn` base (app.css:484), `.page-inner--narrow`, `.page-head`/`.page-sub`, `.dot-list`, `.hit-link`, `.lock-note`, `dayLabel(string | Date)`, `compactCount`, `plural` with an irregular form.
- Remain: Discover's empty line and the match/found wording; ReadBack's dot copy; local 44px overrides on shared buttons (friends `.btn-sm`, users `.relation`, PhotoField); RecipeCard handles (in flight).
- New: menu CSS twin (#1), avatar+handle link (#10), Journal drawn two ways, dead BrowseSections and dead app.css rules.

Server sweep (`docs/research/2026-11-09-server-reuse-sweep.md`):
- Closed: `viewableRecipe`/`ownRecipe`/`inLibraryOf` (AGENTS wording drifted, #6); `cardList`, `tagSelection`; forks page now passes `user` (forks/+page.server.ts:31); `failure()` + `FAILURE_CODES` in app routes (`entryFailure` and friends' `invalid` wrap it); `storePhoto`; `oneOf`, `wholeNumber` (0 `/^\d+$/` left); `eitherWay`; `Viewer` declared once (visibility.ts:21); `RecipeChoice` inferred (entryForm.ts:20); `loadEvent` (21 test importers), `formOf`, `inRollback`, e2e `COOKIES_RE`/`openCookies`/`gotoHydrated`.
- Remain: 6 `error(401)` (#7); `ensureProfile` wrapped two ways (left, with reason); one inline ISO day (journal/new:44); literal message strings in tests (`Not authorized` ×6); `mockDb` adopted by 3 of 20 mocked files.
- New: auth routes outside the `{ error, code }` shape (#5); the `sqlOf` copies; `as any` in the users test.

## 7. Route elsewhere (not analysed)

- a11y: MoreMenu's panel has no `role="menu"`/`menuitem` and its trigger no `aria-haspopup`, so Dropdown's arrow-key walk (`querySelectorAll('[role="menuitem"]')`, Dropdown.svelte:60) finds nothing there. [src/routes/friends/MoreMenu.svelte:44,49-60] → `/code-review`.
- perf: no index behind the `recipes.updatedAt` order or the `parentId` filter. [schema.ts:75; recipeSearch.ts:20] → `schema-reviewer`.
