# Code health · 11 Nov 2026

Second sweep under `.agents/skills/code-health/SKILL.md`, read-only, on master `a967c43` (clean). One file written (this one). Fixes are separate builder items.

## 1. Summary

1. Last clean run (not re-run here): unit 1719 passed (128 files), svelte-check 0 errors, lint clean, e2e 241 passed / 69 skipped, all on `a967c43`, 11 Nov 2026.
2. Largest file: `src/lib/components/recipes/GroupedTextEditor.svelte` 571 lines (under the 600 bar); largest test `e2e/recipe.test.ts` 1888; `src/app.css` 1200 (1291 last sweep); component `<style>` 3328 lines (3489 on 10 Nov).
3. Components: 24 under `src/lib/components` · 3 with a local twin (PhotoField's 44px, Discover's `.lead-cook` hit, ReadBack's dot) · 1 pattern without an owner (the `lastUrl()` test helper) · 0 dead.
4. Closed set: `controls.test.ts` STRUCTURAL down from 17 entries to 10; `.btn-sm`, `.clear-ticks`, `.menu-row` and `.friends-filter` now have DESIGN rows. 0 controls outside the set (the last unit run passed).
5. Docs drift: 5 sentences the code contradicts (Friends filter on Search, breakpoint list, grid columns, app.css grid comment, decision-pack Discover deviation). 0 dead links in 13 docs (95 relative links), `docs/product/` included.
6. Tests: 7 files still slice `<style>` by hand-written regex now that `cssRule` exists; 1 test guards a class nothing has had since `efb56aa`; 18 test files type message strings that have a constant.
7. Hygiene: 0 `any` (the 3 grep hits are prose), 0 `@ts-ignore`, 24 disables (1 with no reason); 3 ponytail notes, all still true.
8. Database: journal 12 entries, idx 0–11, 12 SQL files and 12 snapshots, `prevId` chain intact; `db:generate` dry run skipped, unverified.
9. Since the 10 Nov reports: 18 closed, 13 still open, 11 new (section 6).
10. net: -140 lines possible (estimate), -0 deps.

## 2. Top 10

Score = (90-day commits on the files × copies) / effort (S=1, M=4). Commits counted with `git log --since=2026-08-13 --oneline -- <file> | wc -l`.

1. `drift:` the Layout section was not updated after the breakpoint merge. DESIGN.md:233 lists "699px, 768px, 1024px, 1100px", but 899 is in use (app.css:938 editor, Discover.svelte:191 lead) and so is 359 (RecipeActions). DESIGN.md:231 says "Recipe grids are 2 columns on a phone, 3 from 700px, 4 from 1100px", which is only `.recipe-grid`; `.cookbook-grid` is 1/2/4 and `.discover-grid` 1/2/3 with their own gaps (app.css:750-780). Add 899 and 359 to the list and one grid sentence per grid. [DESIGN.md:231,233] (S) — reach 152 × 4.
2. `drift:` DESIGN says the Friends filter leads the row "Discover and Search, signed in only", but Search never passes `friendsOnly` (`git log -S friendsOnly -- src/routes/search` is empty), and only `discover.server.ts:34` reads `friends=1`. Fix the two sentences, or build it on Search. This is Spencer's call. [DESIGN.md:278,311; src/routes/search/+page.svelte:19-22] (S) — reach 152 × 2.
3. `blind:` 7 test files still cut `<style>` with their own `indexOf`/regex and assert with `toMatch(/\.x \{[^}]*…/)` (16 asserts). `cssRule`/`cssRules` (`src/lib/testing/css.ts:23,30`) owns this. [ChoiceGroup.svelte.test.ts:43; TagInput.svelte.test.ts:271-309; Avatar.svelte.test.ts:25; VersionDiff.svelte.test.ts:367,397; RecipeForm.svelte.test.ts:25-34,135; recipes/[slug]/page.svelte.test.ts:134-140; Details.svelte.test.ts:92-95] (M) — reach 106 (app.css) × 9.
4. `extract:` the same thing done six ways: padding pulled back by margin to make a link's hit, each with its own px (css_complexity #15, still open). `.back-link` app.css:809, `.auth-switch a` :1151, `.arrow-link, .empty-state a` :1168, Discover `.empty a` :291, cookbook `.cookbook-none a` :220, beside `.hit-link` :514. Route them through `.hit-link` and re-measure each one. [src/app.css:514] (M) — reach 106 × 6.
5. `blind:` message strings typed in tests where a constant exists. "Your session ended. Log in in another tab, then try again." appears in 7 files that never import `SESSION_ENDED` (pendingEnhance, JournalEntry, DeleteEntry, RecipeActions, users page, MoreMenu, friends page `.svelte.test.ts`). "Not authorized" appears in 4 (`NOT_AUTHORIZED`, visibility.ts). "Title is required" appears in 7 (`REQUIRED_MESSAGES.title`, validation.ts:40). Import the constants. [e.g. src/routes/friends/page.svelte.test.ts:24; RecipeActions.svelte.test.ts:212] (M) — reach 30 × 18.
6. `shrink:` recipe page rules that only undo other rules (css_complexity cat 1, still open). The no-photo hero's 40px is reset to 24px at ≤1023, and the sticky sidebar is un-stuck (`position: static; max-height: none`) at ≤1023. Move both desktop sets into `@media (min-width: 1024px)`, about -8 lines. [src/routes/recipes/[slug]/+page.svelte:204-206,296; 258-261,370-371] (S) — reach 63 × 2.
7. `drift:` app.css:751 still says the Cookbook grid goes "two from 600", but the rule is `min-width: 700px` (app.css:764, since c0fadb7). Fix the comment. [src/app.css:751] (S) — reach 106 × 1.
8. `reuse:` PhotoField restates `.text-btn`'s phone/coarse 44px (`.photo-choose, .photo-keep { min-height: 44px }` under the same query as app.css:506-510; both elements carry `text-btn`). RecipeForm.svelte.test.ts:28-35 pins the copy rather than the owner. Delete the rule and point the test at app.css. [src/lib/components/recipes/PhotoField.svelte:172-178] (S) — reach 32 × 2.
9. `extract:` `lastUrl()` is identical in two tests (goto's last call, asserts `{ shallow: true, replace: true }`). Move it to `src/lib/testing/` as `lastShallowUrl(goto)`. [ServesControl.svelte.test.ts:34-38; RecipeActions.svelte.test.ts:367-371] (S) — reach 30 × 2.
10. `shrink:` VersionDiff's border-bottom on every row, then removed on `:last-child` and `.diff-item:last-child`, plus `.diff-content--meta { max-width: none }` undoing the 72ch cap (css_complexity cat 1). Use `* + *` borders and `:not(.diff-content--meta)`, about -8 lines. [src/lib/components/recipes/VersionDiff.svelte:248,257,291] (S) — reach 27 × 2.

## 3. Component status

Importers = non-test files importing the component by path (the component's own file excluded).

| Component | Importers | Local copies remaining | Drift / note |
|---|---|---|---|
| `Icons.svelte` | 12 | TabBar's Journal is a calendar (TabBar.svelte:35-37), `journalIcon` a notebook (Icons.svelte:160) | now a P1 design-backlog row (docs/product/ROADMAP.md:258); not a finding |
| `ui/Avatar` | 5 | none | ok |
| `ui/Username` + `.handle` | 5 | none | ok (RecipeCard handles landed in f2542e1) |
| `ui/CookLink` | 2 | Discover restates its phone hit for 700–899 (`min-height: 44px; margin-block: -8px`, Discover.svelte:203-206 vs CookLink.svelte:50-54) | two owners for one hit; long tail |
| `ui/ConfirmStep` | 3 | MoreMenu's block step (decided) | ok |
| `ui/FormActions` | 2 | none | ok |
| `ui/ChoiceGroup` | 2 | none | ok |
| `ui/EmptyPanel` | 3 | Discover `.empty` (Discover.svelte:107,287) twins `.empty-state` | wording: "No recipes found" (search/+page.svelte:33,42) vs "No recipes match" (Discover.svelte:109; cookbook/+page.svelte:86,90) |
| `ui/ResultStatus` | 3 | none | ok |
| `ui/Dropdown` | 2 | none: `.menu-panel`/`.menu-row` owned at Dropdown.svelte:93-130, both callers take them | closed (6ff27eb); MoreMenu a11y closed (347f340) |
| `ui/SearchFilters` | 3 | none | `friendsOnly` passed by Discover only, so Search has no Friends filter (Top 10 #2); `.friends-filter` is a STRUCTURAL entry with a DESIGN row; `eslint-disable` at :38 has no reason line |
| `ui/TagTabs` | 2 (SearchFilters, tags page) | none | new `leading` snippet has 1 user (SearchFilters:126), a stated need (DESIGN.md:278). CSS still lives in app.css:608-705; leave |
| `ui/TagInput` | 1 | EntryForm repeats the arrow/Enter/Escape walk (EntryForm.svelte:106-116 vs TagInput.svelte:71-89) | shapes differ; leave |
| `ui/Navbar`, `ui/TabBar` | 1 each | — | layout singletons. Safe-area and `viewport-fit=cover` match DESIGN.md:337 (Navbar.svelte:112, app.html:6) |
| `recipes/RecipeCard` | 4 | none | ok |
| `recipes/RecipeGrid` | 4 | — | `.recipe-grid` columns are the only ones DESIGN.md:231 records (Top 10 #1) |
| `recipes/RecipeForm` | 2 | — | 475 lines; ok |
| `recipes/GroupedTextEditor` | 2 | — | 571 lines; leave |
| `recipes/IngredientEditor`, `StepEditor` | 1 each | 68 differing lines after renaming | different parsers; leave |
| `recipes/ReadBack` | 2 | `.part + .part::before` twins `.dot-list` (ReadBack.svelte:42) | still open |
| `recipes/PhotoField` | 2 | local 44px (Top 10 #8) | DESIGN sentence fixed (d75181e) |
| `recipes/VersionDiff` | 1 | — | undo-only borders (Top 10 #10) |
| route-local `ServesControl` | 1 | — | `.factor` declared twice, at :114 and :121, and again in the phone query at :160 and :164: merge (-6). DESIGN.md:356 matches the code (left start, 24px parts, the 44px phone box, the 700–1023 row) |

## 4. Long tail

### Control inventory

- `grep -rnE "<button|role=\"button\"|class=\"[^\"]*btn"` gives 67 hits, 43 of them `<button>`; `controls.test.ts` passed in the last run, so 0 controls are outside the set. STRUCTURAL has 10 entries (controls.test.ts:11-26), each with a reason.
- `shrink:` `.relation button:not(.text-btn) { min-height: 44px }` sits on ghosts that are already 48.8px tall, so it is likely a no-op (the rendered height is unverified). [src/routes/users/[username]/+page.svelte:164-166] (S)
- `drift:` cookbook `.seg a` is `min-height: 38px` on desktop and 40px on a phone, under a comment saying "44px hits". One of the two is wrong. [src/routes/cookbook/+page.svelte:141,188,196] (S)

### Deduplication: helpers and server

- `reuse:` the server's today is still written inline, and `isRealDay` does its own round-trip. One `isoDay(date)` helper in `lib/journal.ts` should own both. [src/routes/journal/new/+page.server.ts:44; src/lib/server/journal.ts:52] (S)
- `reuse:` a hand-written `'private' | 'friends'` where `LOG_AUDIENCES`/`LogAudience` exists (schema.ts:151). [src/lib/server/db/seedData.ts:462] (S)
- `yagni:` 4 exports that no other module imports, tests included (a script grepped each `export` name outside its file): `SITE_URL` (seo.ts:20), `privatiseForksIn` (friends.ts:130), `FEED_LIMIT` (friends.ts:287), `valuesOf` (journal/entryForm.ts:22). Another 8 are exported types with no outside user (harmless). (S)
- Functions with the same name in 2+ files: all are test-local `makeX` builders with different shapes (makeTx ×4, makeRecipe ×4, makeData ×4, renderError ×3), except `lastUrl` (Top 10 #9). `digits` in journal/new wraps `wholeNumber`; fine.
- `ensureProfile`: unchanged since 10 Nov; leave (it has a stated reason).

### Deduplication: CSS

- `reuse:` ReadBack's dot rule should be `.dot-list`. [ReadBack.svelte:42] (S)
- `reuse:` Discover `.empty` should be `.empty-state`, with one wording for no results (see the EmptyPanel row). [Discover.svelte:107-112,287-293] (S)
- `reuse:` Discover's `.lead :global(.lead-cook)` restates CookLink's phone hit for 700–899. A `hit` prop on CookLink, or a container query inside it, would leave one owner. [Discover.svelte:201-206; CookLink.svelte:50-54] (S)
- `min-height: 44px` in 16 component rules: each one checked is a specific target (skip link, diff page Username, `.read-link`, section tabs, menu rows, ChoiceGroup rows) with no shared owner it duplicates, apart from the PhotoField and Discover copies above.
- 6 hand-written `display: -webkit-box` clamps against 1 `line-clamp-N` use (css_complexity cat 7). Still open; about -20 lines. (M)

### CSS complexity (open items from `css_complexity_2026-11-10.md`)

- Breakpoints now: `max-width: 699px` ×38, `min-width: 700px` ×7, `max-width: 1023px` ×5, `min-width: 768px` ×4, `max-width: 767px` ×3, `min-width: 1100px` ×2, `max-width: 899px` ×2, `min-width: 1024px` ×1, `max-width: 359px` ×1. 599, 600, 859 and `width < 699px`: 0. The breakpoint table is closed.
- `shrink:` friends `.link-row` goes column, then row at ≤1023, then column again at ≤699. One `(700px ≤ width ≤ 1023px)` rule would replace them. [src/routes/friends/+page.svelte:231,286,300] (S)
- `shrink:` friends `.feed > :global(:first-child)` cancels each entry's top rule. Use `* + *` borders. [friends/+page.svelte:151] (S)
- `shrink:` VersionBar `margin-left: 36px` twice; it is the chip's 26px plus the 10px gap. Use one custom property. [VersionBar.svelte:297,341] (S)
- `shrink:` RecipeActions pills have `padding: 8px 18px 8px 16px`, asymmetric with no reason given. Name the reason or make it symmetric. [RecipeActions.svelte:250] (S)
- Cookbook still uses `display: contents` and two `:global` reaches into SearchFilters (cookbook/+page.svelte:175-185). They still match SearchFilters' new markup (form, then TagTabs). A `layout` prop would own it (medium risk). (M)
- `versions-toggle` is down to three colour rules (VersionBar.svelte:209-221). It is a STRUCTURAL entry; leave.

### Dead code

- Routes: every route has an inbound link or redirect (`/confirm-email` from signup/+page.server.ts:61, `/reset-password` from forgot-password:19). Every route-local `.svelte` has 1 importer, and every `src/lib/components` file has at least 1.
- `delete:` the `.commit-bar` guard at diff/page.svelte.test.ts:260. The class has been gone from source since efb56aa (`grep -rn commit-bar src` finds only this line), so the assertion cannot fail. (S)

### Oversized files

- No component is over 600 lines and no server module over 800 (top: GroupedTextEditor 571, seedData.ts 539, RecipeForm 475). Leave.
- `e2e/recipe.test.ts` is 1888 lines; its seams are the `test.describe` blocks. Split it only when it next changes.

### Blind or stale tests

- Top 10 #3, #5 and #9, and the `.commit-bar` guard above.
- `blind:` two page tests grep their component's source for `formatDate(` and against `toLocaleDateString`, and the users test greps against `MoreMenu`. Those are implementation strings: render and assert the output instead. [recipes/[slug]/diff/page.svelte.test.ts:365-366; users/[username]/page.svelte.test.ts:111-112,152] (S)
- `extract:` `sqlOf` is still copied 3 times, plus 12 `new PgDialect()`. Move it into `src/lib/testing/drizzle.ts`. [discover.server.test.ts:22; cookbook/page.server.test.ts:23; tags/[slug]/page.server.test.ts:28] (S)
- `mockDb()` is used in 3 files, while 20 still mock `db/index` by hand (`grep -rn "vi.mock(" src | grep db/index`). How many fit the helper is unverified.
- Skips: 4 `describe.skipIf(!localDb)` (intended) and 7 `test.skip(!!row.auth !== signedIn())` in e2e/invariants.test.ts (the project split; 6 on 10 Nov). None stale.

### Docs drift

- Top 10 #1, #2 and #7, and the cookbook `.seg` comment above.
- `drift:` the decision pack's deviation list says "Discover's lead card and Recent changes hide while a filter is active". DESIGN.md:211 says they stay and draw from the filtered set, and so does the code: Discover.svelte:44,71 have no `filtered` guard. Add a one-line "superseded by DESIGN.md Layout, 9 Nov" note, since docs/README.md calls the pack current. [docs/design/2026-11-10-decision-pack/DESIGN-SUMMARY.md:106] (S)
- AGENTS.md shared helpers: all 30 named exports exist where stated (scripted check, 0 missing). Not listed: `loadPage` (src/lib/testing/actions.ts, 6 files use it), which the 10 Nov report named as the owner for typed load results. Optional one-line add.
- `docs/README.md`: every link and every backticked path resolves, including the six `docs/product/*.md` files. The three superseded planning docs and `docs/history/2026-10-milestones.md` each open with a pointer to `docs/product/`. No doc mentions the Supabase services trimmed in 5424b36.

### Hygiene

- `any`: 0 (the 3 grep hits are prose in rules.ts:10, actions.ts:56 and GroupedTextEditor.svelte:113). `@ts-ignore`: 0. `@ts-expect-error`: 1, with a reason (TagInput.svelte.test.ts:138).
- `eslint-disable`/`svelte-ignore`: 24. Each has a reason on its line or the line above, except `svelte/prefer-svelte-reactivity` at SearchFilters.svelte:38 (the comment above it is about navigation) and `no-control-regex` at localPath.ts:11 (the regex explains itself). Add the reason at :38: a throwaway `URLSearchParams`, not state. (S)
- Ponytail ledger: app.css:606 (tab wrap), discover.server.ts:67 (no pagination, P1), recipes/[slug]/edit/+page.server.ts:199 (fork race). All still true; none due.

### Database

- `drizzle/meta/_journal.json`: 12 entries, idx 0–11 contiguous, tags match the 12 `.sql` files, 12 snapshots with an unbroken `prevId` chain (scripted). The latest is `0011_list-indexes`.
- `as const` unions in schema.ts:86,132,151. There is one hand-written copy (seedData.ts:462, above).
- Indexes: author, parent, favorites by recipe and versions by creator were added in 0a455e0. `recipes.updatedAt`, which orders every list (recipeSearch.ts:20,43), still has none. Routed below.

### Dependencies

- 7 runtime and 28 dev dependencies, the same as 10 Nov. All are imported or named in a config or script, apart from `@types/node`, which the TypeScript toolchain uses. 34 caret ranges and 1 exact (`parse-ingredient@3.0.0`); the lockfile pins them. No change.

### Pool and connections

- `src/lib/server/db/index.ts`: `max: DB_POOL_MAX ?? 10`, `idle_timeout: 20`, a client kept on globalThis, `end({ timeout: 5 })` on SIGINT/SIGTERM and in `closeDb`. All 3 `*.db.test.ts` files call `closeDb`. vmThreads is set on the `client` project only (vite.config.ts:79), so the server and db tests are unaffected. Clean.

## 5. Could not be verified

- `pnpm db:generate` dry run: skipped, because it writes a migration when it finds drift. Schema/migration agreement is unverified.
- Unit, svelte-check, lint and e2e: not re-run, by brief. The numbers in summary line 1 come from the 11 Nov clean run on `a967c43`.
- No browser was run. Every CSS finding here is reasoned from source, not probed: rendered heights (`.relation`, `.seg`), the hit-link re-measure, and the undo-rule rewrites.
- Whether the 7 hand-sliced style tests can each take `cssRule` as is (some slice a whole `@media` block first). Whether the 20 hand-mocked db tests fit `mockDb()`.
- Whether the decision pack's "Still to do before prod" items (`db:migrate:prod`, the Netlify publish) have happened.
- The GroupedTextEditor `tool` DESIGN row (10 Nov long tail): not re-checked.

## 6. Delta vs 10 Nov (`code_health_2026-11-10.md`, plus `css_complexity_2026-11-10.md`)

**Closed: 18** (each checked by grep on `a967c43`):
- Top 10: #1 menu CSS (6ff27eb), #2 `cssRule` (12a7f43, now used by 15 test files), #3 BrowseSections (53829ff; both files gone), #4 dead app.css rules (efb56aa), #5 auth `fail()` (0406695; 0 raw `fail(` outside actions.ts), #6 `viewableRecipe` wording (d75181e), #7 `error(401)` (dacbe9c, 7e6d1fb; 0 left), #8 `pendingEnhance` twins (275b192), #10 CookLink (05f8834).
- Long tail: `.btn-sm` made a closed-set size (fb8d685); `.clear-ticks` (99b2c6c); the `friends-toggle` decision (now `.friends-filter` with a DESIGN row); `width < 699px` (b2ac967); 4 `as any` (7c67634); MoreMenu menu roles (347f340); list indexes on author and parent (0a455e0); RecipeCard handles (f2542e1).
- css_complexity: Top 15 #1–5, #7–14 (ddadb40, b1e6053, b80f771, 48a9fe7, f347a26, ae4351f, c136d27, a1f55b1); cat 7 utilities (71ddf28; 0 `m-0`/`p-0`/`list-none` left); cat 3 and cat 6 long tail (778715e); the 599/600 and 859 breakpoints (c0fadb7, e406a85). Counted as one closed item here.

**Still open: 13**:
- From 10 Nov: Top 10 #9 half (the PhotoField local 44px; Top 10 #8 here), `.relation` 44px, the inline ISO day, the seedData union, 4 yagni exports, ReadBack's dot, Discover `.empty` and its wording, `sqlOf` ×3, `mockDb` adoption, "Not authorized" literals (6 files, now 4), the TagInput/EntryForm walk (leave), the `recipes.updatedAt` index (routed).
- From css_complexity: #6 (reduced), #15 hit-link variants, the cat 1 undo rules (recipe page, friends, VersionDiff; Top 10 #6 and #10), cat 2 and cat 6 (`.seg` 38/40px, the 36px indent, asymmetric pill padding), cat 4 Cookbook `display: contents`, the Discover `.lead-cook` reach, cat 7 webkit clamps. Counted as one open item here.

**New: 11**:
- Docs: breakpoint list and grid columns in DESIGN (#1), the Friends filter on Search (#2), the app.css grid comment (#7), the decision-pack Discover deviation.
- Tests: hand-sliced style tests left after `cssRule` (#3), message literals beyond "Not authorized" (#5), `lastUrl` twin (#9), the `.commit-bar` guard, the source-string tests.
- Other: ServesControl `.factor` twice, the SearchFilters disable with no reason.

## 7. Route to code review (not analysed)

- perf: no index behind `ORDER BY recipes.updated_at DESC` on every list query (recipeSearch.ts:20,43; schema.ts:75-80 has fts, author and parent only). Send to `schema-reviewer` with EXPLAIN on realistic volume.
- No correctness or security bug was tripped over in this sweep.

net: -140 lines possible (estimate), -0 deps.
