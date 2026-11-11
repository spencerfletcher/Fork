# Code health · 11 Nov 2026 (second sweep)

Third sweep under `.agents/skills/code-health/SKILL.md` (identical to `.claude/skills/code-health/SKILL.md`), read-only, on master `b077e4e`. 213 commits landed since the morning sweep (`git log --since="2026-11-11 00:00" | wc -l`). One file written (this one). Fixes are separate builder items.

## 1. Summary

1. Last clean run on `b077e4e` (not re-run here): unit 2258 passed, `pnpm check` 0 errors, lint clean, e2e 299 passed.
2. Largest file: `src/lib/components/recipes/RecipeForm.svelte` 753 lines, now over the 600 bar (it was 475 this morning), and `src/routes/recipes/[slug]/+page.svelte` 652 is over it too. The largest test is `e2e/recipe.test.ts` at 1759. `src/app.css` is 1466 lines (1200 this morning).
3. Components: 24 under `src/lib/components` (0 dead). 3 have a local twin: ReadBack's dot, Discover's CookLink hit, and Discover's `.empty` hit. 6 patterns have no owner: the signed-out failure, `BAD_FORM`, the e2e recipe/POST helpers, the db-test setup, the unit-size tables, and the URL-param rewrite.
4. Closed set: `controls.test.ts` STRUCTURAL has 9 entries (10 this morning), and `CLOSED_SET` now includes `pill-btn` and `more-button`. There are 64 `<button>` and 92 control hits; 0 are outside the set (the last unit run passed).
5. Docs drift: DESIGN.md's YAML front matter has been flattened by merges since `d3ae48d`, so the tokens no longer nest. AGENTS.md lists `changeUsername` twice with conflicting signatures, puts `gramsFor` in the wrong file, and leaves out `versions.ts`. Three DESIGN sentences now contradict the code. 0 dead links in 11 docs (155 refs).
6. Tests: 15 `*.db.test.ts` files repeat the same close/stamp/profile setup (12 stamp copies, 15 `closeDb` blocks, 7 `withX` builders). `createRecipe` is copied 3 times in e2e and the form POST via `fetch` 5 times. "Not authorized" is a literal in 6 test files.
7. Hygiene: 0 `any`, 0 `@ts-ignore`, 1 `@ts-expect-error` (with a reason). 29 disables, every one with a reason or self-evident. 6 ponytail notes (3 new), all still true.
8. Database: journal 17 entries, idx 0–16 contiguous, 17 SQL files and 17 snapshots, `prevId` chain intact (scripted). `db:generate` dry run skipped (unverified).
9. Delta since the morning sweep: 16 closed, 15 still open, 17 new (section 6).
10. net: -130 lines possible (estimate), -0 deps.

## 2. Top 10

Score = (90-day commits on the busiest file touched × copies) / effort (S=1, M=4). Commits come from `git log --since=2026-08-13 --oneline -- <file> | wc -l`.

1. `extract:` the signed-out refusal is written out 21 times in 8 action files as `failure(401, 'unauthenticated', SESSION_ENDED('…'))`, and settings has its own `sessionEnded` twin (settings/+page.server.ts:33). Add `signedOut(retry = 'try again')` beside `SESSION_ENDED` in `src/lib/server/actions.ts`. [recipes/[slug]/+page.server.ts:180,206,221,234,246,256,269,277; cookbook/+page.server.ts:175,183,196; cookbook/trash/+page.server.ts:51,64; friends/+page.server.ts:101,111; journal/[id]/edit/+page.server.ts:113; recipes/[slug]/edit/+page.server.ts:170] (S) — 48 × 21.
2. `extract:` "Invalid form state, reload the page" is typed 5 times, and cookbook has its own `BAD_FORM` const (cookbook/+page.server.ts:170). Export `BAD_FORM` from `src/lib/server/actions.ts`. [recipes/[slug]/+page.server.ts:211,236,351; recipes/[slug]/edit/+page.server.ts:94; cookbook/trash/+page.server.ts:41] (S) — 48 × 6.
3. `extract:` e2e helpers that each new spec copied:
   - `createRecipe` 3 times (authenticated.test.ts:468, collections.authenticated.test.ts:19, drafts.authenticated.test.ts:39), with 3 different returns, servings handling and `test.slow()`.
   - The `page.evaluate(fetch(POST))` body 5 times (helpers.ts:48 `deleteRecipe`, collections `post` :32, authenticated.test.ts:233 and invariants.test.ts:68, both inline deletes, and authenticated.test.ts:866 fork).
   - A unique title 3 times (authenticated.test.ts:511, collections.authenticated.test.ts:13, authenticated.test.ts:512 stamp).

   Move `createRecipe(page, title, { servings? })`, `postAction(page, url, fields?)` (with `deleteRecipe` built on it) and `uniqueTitle(label)` into `e2e/helpers.ts`. (M) — 89 × 11 / 4.
4. `drift:` DESIGN.md's YAML front matter is flat. `colors:`, `typography:`, `components:` and the rest have lost their indentation, so every token sits at the top level and `fontFamily`/`fontSize` repeat as duplicate keys. Branch commits keep it nested (146c7a9, e077d91, 00b2632) and the merges flatten it (e1225b8, e173c8d, d3ae48d, and every merge since). Re-indent it, and find the merge step that strips it (a conflict resolution or a formatter on merge), or it will come back. [DESIGN.md:3-120] (S) — 193 × 1.
5. `drift:` Settings' Metric sentence still reads "Grams where a conversion is certain; water, milk and stock in millilitres." Metric now leads with gram **estimates** for weighed volumes (6bac2ae, aebe9b6), and the recipe page itself says "Weights from volume measures are estimates." (`WEIGHED_NOTE`). It is also wrong on oil and vanilla: they are liquids, but they are weighed. The wording is Spencer's call; DESIGN quotes it. [src/lib/measurement.ts:23; DESIGN.md:240] (S) — 193 × 2.
6. `drift:` DESIGN "Shared components" (DESIGN.md:412-424) has no row for `Dropdown`, though it has 3 importers (Navbar, MoreMenu, MoreActions) and owns `.menu-panel`/`.menu-row`, with `.more-button` (app.css:488) its trigger. `SearchFilters` and `TagTabs` have no row either. Separately, DESIGN.md:320 still lists the action row as "Cook, Edit recipe, Save, Fork, Add to Journal" without the ⋯ that DESIGN.md:388 and RecipeActions.svelte:173 now end it with. Add the three rows and fix the sentence. (S) — 193 × 2.
7. `blind:` "Not authorized" is a literal in 6 test files while `NOT_AUTHORIZED` exists (visibility.ts:96). Up from 4 this morning. Import it. [pendingEnhance.svelte.test.ts; recipes/[slug]/error.svelte.test.ts; recipes/[slug]/edit/page.svelte.test.ts; edit/DeleteRecipe.svelte.test.ts, among others] (S) — 30 × 6.
8. `extract:` the db-test scaffolding is repeated across the 15 `*.db.test.ts` files:
   - `afterAll(… closeDb())` 15 times.
   - The run stamp `` `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` `` 12 times (visibility:28, friends:27,174, journal:27,117, collections:31, versions:59, profiles:26, keptCopies:33, ftsLeak:12, cookbook db:26, recipes/[slug] db:20).
   - 7 local "N throwaway profiles in a rollback" builders (`withTwo` ×2, `withPeople` ×2, `withFriends`, `withKitchen`, `withRecipe`), with 9 `tx.insert(schema.profiles)`.
   - "two seed profiles + a committed recipe + teardown" 3 times (journal.db:127, recipes/[slug]/page.server.db:33, cookbook/page.server.db:39), two of them with the same `LATER` regex.

   Add `stamp()`, `closeDbAfter()` and `withProfiles(n, body)` to `src/lib/testing/db.ts`. (M) — 44 × 15 / 4.
9. `drift:` AGENTS.md's Shared helpers list:
   - `changeUsername` is listed twice, as `(id, username, conn?)` at :53 and `(id, name)` at :65. The code is `(id, username, conn?)` returning `{ result: 'changed' | 'taken' | 'too_soon' }` (profiles.ts:95). Merge them into one line.
   - Line 78 says `gramsFor` is in `gramTables.ts`; it is in `src/lib/server/ingredientDensities.ts:149`, and `likeWater` is a private function there (:103).
   - Not listed: `lockForSave`/`appendVersion`/`commitSave`/`restoreVersion` (`src/lib/server/versions.ts`: the append-only write path the restore builder added), `text(formData, key)` (helpers.ts:48, 19 files), `setShallowParam` (5 files), `parseFilters` (recipeSearch.ts:7), and the test helpers `loadPage`/`invokeAction`/`localDb` (12, 14 and 16 files).

   (S) — 36 × 4.
10. `reuse:` typed dot separators where `.dot-list` (app.css:612) owns the drawn, silent dot. CookHeader `<span class="dot" aria-hidden="true">·</span>` (CookHeader.svelte:72, with its `.dot` colour rule at :135), RecipeActions Save count (RecipeActions.svelte:127), and ReadBack's own `.part + .part::before` (ReadBack.svelte:42, still open). (S) — 53 × 3.

## 3. Component status

Importers = non-test files importing the component, the component's own file excluded.

| Component | Importers | Local copies remaining | Drift / note |
|---|---|---|---|
| `Icons.svelte` | 17 | none. An AST pass found 0 SVG `d` paths drawn twice across files; CollectionToggle's check (:27) and RecipeActions' Cook/Edit glyphs are drawn once | ok; Journal drawing unified (DESIGN.md:416) |
| `ui/Avatar` | 5 | none | ok |
| `ui/Username` + `.handle` | 5 | none | ok |
| `ui/CookLink` | 2 | Discover restates its 44px hit for 700–899 (Discover.svelte:197-201 vs CookLink.svelte:50-54) | still open |
| `ui/ConfirmStep` | 7 | MoreMenu's block step (decided) | ok; Trash, collections and Restore adopted it |
| `ui/FormActions` | 2 | none | ok |
| `ui/ChoiceGroup` | 3 (+Settings ×2) | none | ok: Settings' audience and measurement both use it |
| `ui/EmptyPanel` | 4 | Discover `.empty a` and Cookbook `.cookbook-none a` add their own `padding-block: 10px` hit (Discover.svelte:286, cookbook/+page.svelte:269) instead of `.hit-link` | wording now one ("No recipes match"): closed |
| `ui/ResultStatus` | 3 | none | ok |
| `ui/Dropdown` | 3 (Navbar, MoreMenu, MoreActions) | none | no DESIGN Shared-components row (Top 10 #6) |
| `ui/SearchFilters` | 3 | the URL-rewrite shape it shares with cookbook (long tail) | Search now has the Friends filter: closed |
| `ui/TagTabs` | 2 | CookbookCollections' `.tag-tabs .n` restates cookbook's `.seg .n` (long tail) | no DESIGN row |
| `ui/TagInput` | 1 | EntryForm's key walk (leave, as before) | ok |
| `ui/Navbar`, `ui/TabBar` | 1 each | — | layout singletons |
| `recipes/RecipeCard` | 4 | Discover `.lead-media`/`.lead-media img`/`.change-note` match `.card-panel`/`.card-img`/`.card-description` (RecipeCard.svelte:217,223,306 vs Discover.svelte:129,135,244) | three identical bodies; long tail |
| `recipes/RecipeGrid` | 4 | — | ok |
| `recipes/RecipeForm` | 2 | — | 753 lines: split (long tail) |
| `recipes/GroupedTextEditor` | 2 | — | 571; leave |
| `recipes/IngredientEditor`, `StepEditor` | 1 each | — | leave |
| `recipes/ReadBack` | 2 | `.part + .part::before` twins `.dot-list` | Top 10 #10 |
| `recipes/PhotoField` | 2 | none: its local 44px is gone and it uses `.pill-btn` (PhotoField.svelte:127,145) | closed |
| `recipes/VersionDiff` | 1 | — | border undo-rules closed (`:not(:last-child)`, :256) |
| `app.css .row-list/.list-row` | 2 (TrashRow, CookbookDrafts) | none | new, adopted by both new lists |
| route-local `KeepLine` | 1 | `.keep` restates RecipeHeader `.personal` (KeepLine.svelte:76 vs RecipeHeader.svelte:269; the comment says so) | long tail |

## 4. Long tail

### Control inventory

- 92 hits, 64 of them `<button>`. STRUCTURAL has 9 entries (controls.test.ts:19-33), each with a reason; DESIGN.md:297 lists the same 7 classes as `CLOSED_SET` (controls.test.ts:8-16).
- `shrink:` the RecipeActions pill padding `8px 18px 8px 16px` is asymmetric with no reason given (RecipeActions.svelte:197). Still open. (S)

### Deduplication: helpers and server

- `extract:` there are two unit-size tables. `UNITS` (convert.ts:21: tsp 4.9289216, cup 236.58824, oz 28.349523) and `ML_PER_UNIT`/`GRAMS_PER_WEIGHT_UNIT` (gramTables.ts:206,234: tsp 4.929, cup 236.588) each state a cup's size, at different precision. Gram estimates and conversions therefore read different sizes for one cup. Derive the gram tables' sizes from `UNITS` plus an alias list. (M) — about -25 lines.
- `extract:` `DAY_MS` is defined 3 times (profiles.ts:9, trash.ts:28, and `86_400_000` inline at discover.server.ts:89). Put it in `src/lib/helpers.ts`. (S)
- `extract:` "this page's URL with one param changed" is written 3 times (cookbook/+page.svelte:22-26 `filterHref`, CookbookCollections.svelte:21-27 `hrefFor`, SearchFilters.svelte:38-41), each with its own `eslint-disable`. A `hrefWith(url, name, value | null)` in `src/lib/helpers.ts` would also drop the 3 disables. (S)
- `shrink:` `` timeSpans(...).map(({ value, word }) => `${value} ${word}`) `` appears twice (PrintHeader.svelte:55, RecipeCard.svelte:91). Leave it unless a third copy appears.
- `reuse:` the server's today is still written inline (journal/new/+page.server.ts:44, journal.ts:60). Still open. (S)
- `reuse:` `'private' | 'friends'` is hand-written where `LogAudience` exists (seedData.ts:496; schema.ts:184). Still open. (S)
- `yagni:` `SITE_URL`, `privatiseForksIn`, `FEED_LIMIT` and `valuesOf` are still exported but used only in their own file (`grep -rlw` gives 1 file each). (S)
- Same-name functions across files: none in `.ts`. In `.svelte` there are only local handlers (`close` ×5, `show` ×3, `cook` ×2, `discard` ×2), each with a different body.
- Version writes: fork (recipes/[slug]/+page.server.ts:326) and new (recipes/new/+page.server.ts:66) insert v1 directly, while edit and restore go through `versions.ts`. `appendVersion` is for v(n+1), so that is fine; noted for the reviewer.
- Access checks: kept copies are confined to `keptCopies.ts`, `visibility.ts` and `trash.ts` (every `copyVersion` read). `libraryRecipe` is local to the recipe route (+page.server.ts:172) and has 3 callers. ok.

### Deduplication: CSS

- `reuse:` Settings' local `.form { display: flex; flex-direction: column; gap: var(--space-4) }` and `.setting-body` restate app.css `.form-col` (app.css:1098), under the name of the global `.form` (gap 24px). Use `.form-col`. [settings/+page.svelte:250,297] (S)
- `extract:` the count after a tab, `.n { margin-left: 4px; font-weight: 400; color: Ink 3 }`, appears twice (cookbook/+page.svelte:198, CookbookCollections.svelte:161). Move it to app.css beside `.tag-tabs`. (S)
- `reuse:` KeepLine `.keep` = RecipeHeader `.personal` (4 declarations). Move it to one app.css class or have KeepLine take RecipeHeader's. (S)
- `extract:` RecipeCard/Discover lead media, image and two-line note: 3 identical rule bodies (see the component table). (S)
- `shrink:` 6 components still use `class="… no-underline"` (journal/+page.svelte:39,48; RecipeActions.svelte:95,101,120,167), but app.css:333-336 already sets `a { text-decoration: none }`, and nothing underlines a `.btn-*`. The computed style is unverified. (S)
- `extract:` `display: -webkit-box` clamps: 7 now (6 this morning; CookHeader.svelte:111 is new) against 1 `line-clamp-N`. (M)
- Hover/underline: app.css:975-1012 owns one underline (1px, 3px) for `.text-btn`, `.arrow-link`, `.back-link`, `.clear-ticks`, `.inline-action`, `.username` and `.handle`. Every other `text-decoration` in components is forced-colours only (Navbar.svelte:275) or diff marks (VersionDiff.svelte:325-342). CookLink:44 and Username:44 each own the hover for their own element. Clean.
- `min-height: 44px`: 14 rules (16 this morning), each one checked for a specific target. Breakpoints: 699 ×39, 700 ×7, 1023 ×6, 768 ×4, 1024 ×3, 767 ×3, 1100 ×2, 899 ×2, 900 ×1, 359 ×1. All of them appear in DESIGN.md:246.

### CSS complexity (open from `css_complexity_2026-11-10.md`)

- `shrink:` the friends `.link-row` goes column, then row, then column again (friends/+page.svelte:229,285,299), and `.feed > :global(:first-child)` (:151). Still open. (S)
- `shrink:` VersionBar's `margin-left: 36px` is now written 3 times (VersionBar.svelte:279,387,445; it was 2). Use one custom property. (S)
- Cookbook's `display: contents` reach into SearchFilters (cookbook/+page.svelte:215). Still open. (M)

### Dead code

- 0 components with no importer; every route-local `.svelte` has 1. 4 component files have no own test (CookbookDrafts, TrashRow, CollectionToggle, ReadBack); the first three are covered through their parent's test (cookbook/page.svelte.test.ts, trash/page.svelte.test.ts, MoreActions.svelte.test.ts). Icons is covered by icons.test.ts.
- Routes: Settings is reached from the account menu (DESIGN.md:240), and Trash from the Cookbook and redirects. Every link and backticked path in the docs resolves (scripted).

### Oversized files

- `split:` RecipeForm.svelte, 753 lines, 62 commits in 90 days. Seams:
  - the "More details" `<details>` block (:611-658, with `MORE_FIELDS` :156), which could become `MoreDetails.svelte`;
  - the live field-validation state (`typedMessage` and the inline-error effect, about :163-250), which could become `src/lib/recipes/fieldErrors.svelte.ts`;
  - the style block (:668-753).

  (M)
- `split:` recipes/[slug]/+page.svelte, 652 lines (336 of markup and script, 315 of style), 75 commits. The seam is the bottom section switch (`nav.section-tabs`, :279-298, and its CSS), which could become `SectionSwitch.svelte`. Leave the rest. (M)
- Server modules are all under 800 (the top is seedData.ts at 573). `e2e/recipe.test.ts` is 1759; leave it.

### Blind or stale tests

- Top 10 #3, #7 and #8.
- `extract:` the 10 files that now take `cssRule` still slice the style themselves with `source.slice(source.indexOf('<style>'))` or `split('<style>')`: 14 copies. A `styleOf(source)` in `src/lib/testing/css.ts` would own that. VersionBar.svelte.test.ts:214,224,245,246 still match brace regexes by hand. (S)
- `reuse:` `sqlOf` is in `src/lib/testing/drizzle.ts:6`, yet search/page.server.test.ts:216 defines its own, and 11 raw `new PgDialect().sqlToQuery` calls remain (recipeSearch.test.ts:31,37,38,48; friends.test.ts:165,229; visibility.test.ts:190,203,219; edit/page.server.test.ts:630,631,682). (S)
- `mockDb()` is used in 4 files, while 25 mock `db/index` by hand (it was 20). How many fit the helper is unverified.
- `blind:` users/[username]/page.svelte.test.ts:112,113,153 still grep source for `formatDate(`, `toLocaleDateString` and `MoreMenu`. The diff page's twin is closed (:223 now renders). (S)
- Skips: 17 `describe.skipIf(!localDb)` (intended), and 7 `test.skip(!!row.auth !== signedIn())` in e2e/invariants.test.ts (the project split, unchanged). None stale.

### Docs drift

- Top 10 #4, #5, #6 and #9.
- `drift:` the decision pack's deviation line still says "Discover's lead card and Recent changes hide while a filter is active". DESIGN.md:222 and the code say they stay. [docs/design/2026-11-10-decision-pack/DESIGN-SUMMARY.md:106] (S)
- Checked and consistent:
  - Collections in More (DESIGN.md:388 vs MoreActions.svelte, CollectionToggle.svelte).
  - Cooking: Finish cooking, Exit, the bottom switch (DESIGN.md:389 vs CookHeader.svelte:78, +page.svelte:279).
  - The closed sets (DESIGN.md:278-318 vs controls.test.ts), `.pill-btn` (DESIGN.md:289 vs app.css:535-585), Print (DESIGN.md:390 vs app.css:1366), breakpoints (DESIGN.md:246).
  - The measurement mechanics (DESIGN.md:380 vs convert.ts, gramTables.ts:187,193).
  - AGENTS' 34 helper lines: every name exists where stated, except the two in Top 10 #9 (scripted).

### Hygiene

- `any`: 0 (the 4 grep hits are prose). `@ts-ignore`: 0. `@ts-expect-error`: 1, with a reason (TagInput.svelte.test.ts:139).
- 29 `eslint-disable`/`svelte-ignore`: 13 are `state_referenced_locally` on seeded `$state` (the reason is self-evident); 3 are `prefer-svelte-reactivity` on throwaway `URLSearchParams` (SearchFilters' has a reason; cookbook:23 and CookbookCollections:23 do not, and `hrefWith` above removes all 3); the rest carry a reason.
- Ponytail ledger, all still true and none due: app.css:755, recipeSearch.ts:67 (versions parsed per search, new), trash.ts:151 and :176 (new), discover.server.ts:63, cookbook/+page.server.ts:100 (new).

### Database

- Journal: 17 entries, idx 0–16, latest `0016_source-notes-times`. 17 `.sql` and 17 snapshots, `prevId` chain unbroken (scripted).
- `as const` unions: schema.ts:119,165,184; `Visibility`/`Measurement` come in by type import (schema.ts:3, 42-44, 88). One hand-written copy remains (seedData.ts:496).
- Indexes: there is still none on `recipes.updated_at`, which orders every list, and none on `recipes.deleted_at`, which `inTrashOf` and `purgeExpiredTrash` filter on (schema.ts:96,109-113). Routed below.

### Dependencies

- 7 runtime and 28 dev dependencies, unchanged. `@types/node`, the two prettier plugins, `svelte-check` and `tsx` are used by config and scripts, not imports. 34 caret ranges and 1 exact; the lockfile pins them.

### Pool and connections

- `src/lib/server/db/index.ts` has `max: DB_POOL_MAX ?? 10` (:19), `idle_timeout: 20` (:20), the globalThis client (:14), and `end({ timeout: 5 })` on SIGINT/SIGTERM (:24-26) and in `closeDb` (:43). All 15 `*.db.test.ts` close it. Clean.

## 5. Could not be verified

- `pnpm db:generate` dry run: skipped, because it writes a migration when it finds drift. Schema/migration agreement is unverified.
- Unit, check, lint and e2e: not re-run, by brief. Summary line 1 quotes the last clean run on `b077e4e`.
- No browser. Every CSS finding is reasoned from source: `no-underline` being redundant, Settings `.form` → `.form-col`, and the `.keep`/`.personal` merge are unprobed.
- Which tool flattens DESIGN.md's front matter on merge (Top 10 #4). The commit pattern is certain; the cause is not.
- Whether `UNITS` and `ML_PER_UNIT` ever give a visibly different number (precision differs in the 4th decimal place).
- How many of the 25 hand-mocked db tests fit `mockDb()`.
- DESIGN.md is 445 lines of very long paragraphs. Only the sections named in the brief (actions, collections, measurement, cooking, menus, buttons, shared components, print) were read against code; the rest was grep-checked by quoted label only.

## 6. Delta vs this morning (`code_health_2026-11-11.md`)

**Closed: 16** (each checked by grep on `b077e4e`):
- Top 10 #1: breakpoints and grids are in DESIGN.md:244,246.
- Top 10 #2: Search has the Friends filter (search/+page.server.ts:26).
- Top 10 #6: the sticky sidebar now sits in a min-width query (+page.svelte:477).
- Top 10 #7: the app.css grid comment (:900) now says 700.
- Top 10 #8: PhotoField's 44px is gone.
- Top 10 #9: `lastShallowUrl` (testing/navigation.ts:4).
- Top 10 #10: VersionDiff `:not(:last-child)` (:256).
- Top 10 #3, part: `cssRule` is in all 10 hand-sliced files.
- Top 10 #4, part: `.hit-link` groups `.auth-switch a`, `.arrow-link`, `.empty-state a` and `.back-link` (app.css:589-608).
- Top 10 #5, part: the SESSION_ENDED and "Title is required" literals are at 0.
- Long tail: `.relation` 44px (gone), cookbook `.seg` 38/40 (now commented), the `.commit-bar` guard, the SearchFilters disable reason, ServesControl `.factor`, the empty-state wording, and the diff page's source-string test.

**Still open: 15**:
- From this morning's Top 10: #3's residue (VersionBar regexes), #4's residue (Discover `.empty a`, `.cookbook-none a`), and #5's residue ("Not authorized", now 6 files).
- From this morning's long tail: the Discover CookLink reach, ReadBack's dot, the inline ISO day, the seedData union, 4 yagni exports, `sqlOf` adoption, `mockDb` adoption, the users source-string test, and the decision-pack deviation.
- From css_complexity: friends `.link-row` and feed, the VersionBar 36px (now ×3), the asymmetric pill padding, cookbook `display: contents`, and the webkit clamps (now 7).
- Routed: the `recipes.updated_at` index.

**New: 17**:
- Top 10: #1 `signedOut`, #2 `BAD_FORM`, #3 e2e helpers, #4 the front matter, #5 the Metric copy, #6 the DESIGN shared list and action-row sentence, #8 the db-test setup, #9 the AGENTS list, #10 typed dots in CookHeader and RecipeActions.
- Long tail: the two unit tables, `DAY_MS` ×3, the URL-param rewrite ×3, Settings `.form`, `.n` ×2, `.keep`/`.personal`, RecipeCard/Discover media rules, `no-underline` ×6, the RecipeForm and recipe page splits, and `styleOf` ×14.

## 7. Route to code review (not analysed)

- perf: there is no index behind `ORDER BY recipes.updated_at DESC` (recipeSearch.ts) or the Trash's `deleted_at` filters (trash.ts:40,183). Send both to `schema-reviewer` with EXPLAIN on realistic volume.
- correctness, possible: the two unit-size tables (section 4, helpers) could make the gram estimate and the conversion disagree by rounding at a boundary. Send it to `/code-review` with a cup-boundary case.

net: -130 lines possible (estimate), -0 deps.
