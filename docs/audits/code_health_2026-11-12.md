# Code health · 12 Nov 2026

Fifth sweep under `.agents/skills/code-health/SKILL.md` (`.claude/skills/code-health` is a symlink to it), read-only, on master `87b72ce`. 250 commits since the previous sweep's `d8c5d00` (`git log --oneline d8c5d00..HEAD | wc -l`): 310 files, +31165/−3298 (`git diff --shortstat`). This is the "more than ~1000 lines / more than two parallel slices" trigger, so the three Deduplication rows and Docs drift were read hardest. One file written (this one). Fixes are separate builder items.

## 1. Summary

1. Last clean run (today, on `87b72ce`; not re-run here): unit 4091 passed, `pnpm check` 0 errors 0 warnings, lint clean, e2e 367 passed / 69 skipped.
2. Largest file: `src/routes/cookbook/CookbookPicker.svelte` at 697 lines. Three components are over the 600 bar: CookbookPicker 697, `cookbook/+page.svelte` 658, RecipeForm 612. Largest server module: `seedData.ts` 577. `app.css` is 1651 lines. Largest test: `e2e/recipe.test.ts` 1832.
3. Components: 39 under `src/lib/components`, none dead (every one has at least 1 non-test importer, scripted). 4 have a hand-rolled twin: `CollectionChecks` (its naming step, copied twice in CookbookPicker), `FieldError` (6 hand-written in auth and Settings), `RecipeCard` (Discover's lead media) and `EmptyPanel` (2 hit paddings). 4 patterns have no owner: the removable pill's ×, the pseudo-element hit area, the combobox's wrapping arrow walk, and the two unit-size tables.
4. Closed set: 133 control hits, 92 of them `<button>`. `controls.test.ts` has 7 `CLOSED_SET` classes and 11 STRUCTURAL entries, each with a reason, and the last unit run passed it.
5. Docs drift: DESIGN.md contradicts itself twice. :494 says the clay exception is "the editor's checkbox", but :178 says it is the audience radios. :493 says "Don't add a gradient", but :469 documents Dropdown's gradient shade. `.impeccable/design.json` is still dated 28 Oct. ROADMAP has 2 stale status lines. The `.tick` comment in app.css (:1338) names only the strike rows, though 4 surfaces use it. 0 dead links (6 docs, 53 refs, scripted). AGENTS "Shared helpers" is current: every new helper with 2 or more importers is listed, and no removed name is listed (`parseServes`, `MIN_SERVES` and `CookbookCollections` have 0 hits anywhere).
6. Tests: 18 hand `<style>` slices in 10 files ignore `cssRule`, and 18 raw `sqlToQuery` calls ignore `sqlOf`. The throwaway-cook sign-up is written 3 times in e2e.
7. Hygiene: 0 `any`, 0 `@ts-ignore`, 1 `@ts-expect-error` (with a reason). 41 disables (32 last sweep), each with a reason on or above its line. 17 ponytail notes, all still true. 18 leftover agent worktrees, all merged into master. A stray empty `--help` file sits at the repo root.
8. Database: 25 journal entries, idx 0–24 contiguous, 25 SQL files and 25 snapshots, `prevId` chain intact (scripted). `schema.ts` and the 0024 snapshot agree on all 14 tables and 21 index names.
9. Delta: 17 closed, 15 still open, 14 new (section 6).
10. net: about −120 lines possible (estimate), −0 deps.

## 2. Top 10

Score = (90-day commits on the busiest file touched × copies) / effort (S=1, M=4). Commits come from `git log --since=2026-08-14 --oneline -- <file> | wc -l`: DESIGN.md 302, app.css 138, RecipeActions 60, ROADMAP 51, cookbook/+page 37, TagInput 27, signup 22, CookbookPicker 13.

1. `drift:` DESIGN.md:494 says "Don't fill anything with clay (the editor's checkbox is the one exception)". DESIGN.md:178 says the one exception is "the audience radios in Settings and the Journal form", and that the editor has had no radio since 12 Nov. The code agrees with :178: `accent-color` appears only at ChoiceGroup.svelte:90. Reword :494 to say "the audience radios". (S) — 302 × 2.
2. `drift:` DESIGN.md:493 says "Don't add a second dark surface, a gradient, a blur or a glow". Two gradients now ship by decision: Dropdown's scroll shade, documented in its own row (DESIGN.md:469; Dropdown.svelte:183-187); the recipe aside's mask fade (`recipes/[slug]/+page.svelte:465`). Add "except the scroll shades (Dropdown, the aside)" to :493, or move the rule to "no decorative gradient". (S) — 302 × 2.
3. `drift:` `.impeccable/design.json` still has `generatedAt 2026-10-28` (last commit 28 Oct), and DESIGN.md has had 302 commits since. Open since the last sweep. Regenerate it with `impeccable-documenter`, or delete it if nothing but the skill reads it (Spencer's call). (S) — 302 × 1.
4. `reuse:` `cssRule`/`cssRules` (`src/lib/testing/css.ts`, 32 test files use it), but 18 tests still slice `source.slice(source.indexOf('<style>'))` by hand: RecipeActions.svelte.test.ts:242,429,441; VersionBar.svelte.test.ts:207,220,249; RecipeForm.svelte.test.ts:31,476,485,603; Navbar:39, TagInput:320, cookbook/page:15, ScalePanel:15, Details:127, RecipeMethod:151; app.css.test.ts:87,319. Move each to `cssRule(source, selector)`. (M) — 60 × 10 / 4.
5. `drift:` the `.tick` comment (app.css:1338) says "The recipe page's strike rows". `.tick` is now also used by: the Cookbook List select (RecipeRow.svelte:71); the card select disc (RecipeCard.svelte:195); Settings' notification kinds (settings/+page.svelte:295, decided at DESIGN.md:249). Name them all in the comment, so a strike-row change is seen to reach them. (S) — 138 × 1.
6. `reuse:` `FieldError` (`ui/`, 18 importers) is hand-written 6 times: signup/+page.svelte:99,131; login:63; forgot-password:76; confirm-email:81; settings/+page.svelte:205. These copies drop `role="alert"`, which DESIGN.md's FieldError row requires. Use `<FieldError name="email|username" error={…} />`. The `username-rule` hint (signup:134) stays: it is a hint, not an error. Whether these were left unannounced on purpose is unverified. (S) — 22 × 6.
7. `reuse:` `sqlOf` (`src/lib/testing/drizzle.ts:6`), yet there are 18 raw `PgDialect().sqlToQuery` calls: visibility.test ×6, recipeSearch.test ×4, edit/page.server.test ×3, friends.test ×2, recipeCounts.test ×2 and search/page.server.test ×1. The local `sqlOf` twin is still at search/page.server.test.ts:238. (S) — 21 × 6.
8. `drift:` ROADMAP has 2 stale lines: The Scaler workstream (docs/product/ROADMAP.md:163) says "S01 … and S04 … built 12 November 2026", yet its status is still `later`. Split the row, or mark it "in flight (S01, S04 built)"; the ":52 In flight, not yet landed" line still lists "the 'Friends' recipes' toggle moved into the tag row as one filter bar", which has shipped (SearchFilters.svelte:125; DESIGN.md "SearchFilters" row: "led by the friends filter"). Drop that clause. The three `next` rows (Media access check, Backup and restore, Photo access) are genuinely unbuilt: `getPublicUrl` is still at images.ts:190. (S) — 51 × 2.
9. `reuse:` `EmptyPanel`'s way-out link sets its own `padding-block: 10px` instead of `.hit-link` (app.css:597), at Discover.svelte:303 and cookbook/+page.svelte:655. Open since 11 Nov. (S) — 37 × 2.
10. `extract:` the naming step is written 3 times: CollectionChecks.svelte:170-201 (`.name-step`, CSS :239-262); CookbookPicker.svelte:317-343, New collection (`.picker-naming`, CSS :618-639); CookbookPicker.svelte:402-428, Rename. Each copy has the same `<label>`, the same text input with `maxlength={COLLECTION_NAME_MAX}`, the same `aria-invalid`/`aria-describedby` pair, the same Escape-goes-back handler, a `btn-primary btn-sm` submit and a `FieldError`. The copies have drifted: CollectionChecks stacks in a column, and the picker wraps in a row (`flex-wrap`, label `flex-basis: 100%`). Extract `src/lib/components/ui/NameStep.svelte` with props `{ id, label, action, enhance, value?, error, pending, submitLabel, onback, hidden? }`. This also takes CookbookPicker under 600 lines (about −70). The formula scores it 10. It is ranked in because one fix closes two findings and it is the newest twin. (M) — 13 × 3 / 4.

## 3. Component status

Importers = non-test files importing the component, the component's own file excluded (scripted).

| Component | Importers | Local copies remaining | Drift / note |
|---|---|---|---|
| `Icons` | 22 | none | ok |
| `HideControl` (new) | 2 (Moderation.svelte, /moderation) | none | ok |
| `ReportStep` (new) | 2 (MoreActions, friends MoreMenu) | none; `maxlength="1000"` literal (:31) | long tail |
| `recipes/CollectionChecks` (new) | 2 (MoreActions, SelectBar) | its naming step ×2 in CookbookPicker | Top 10 #10 |
| `recipes/CollectionToggle` (new) | 1 (CollectionChecks) | none | its seam; ok |
| `recipes/MoreActions` (new) | 3 | none | ok |
| `recipes/RecipeRow` (new) | 1 (cookbook) | none: takes RecipeCard's `metaPartsOf`, `metaItem`, `cardMenu` | ok |
| `recipes/SaveBar`, `ServesRow` (new) | 1 each (RecipeForm) | none | RecipeForm's seams; ok |
| `recipes/RecipeForm` | 2 | — | 612 lines, over the bar (long tail) |
| `recipes/GroupedTextEditor` | 2 | — | 571; leave |
| `recipes/MoreDetails`, `TimesRow`, `SourceFields` | 1 each | none | ok |
| `recipes/IngredientEditor`, `StepEditor` | 1 each | none: their error line is `FieldError` now | closed |
| `recipes/PhotoField` | 2 | none | closed |
| `recipes/ReadBack` | 2 | none | ok |
| `recipes/RecipeCard` | 5 | Discover `.lead-media` (Discover.svelte:56,143) | still open |
| `recipes/RecipeGrid` | 4 | — | ok |
| `recipes/VersionDiff` | 1 | — | ok |
| `ui/AddFields` (new) | 3 | none | ok |
| `ui/ChoiceSelect` (new) | 1 (RecipeForm) | its arrow walk clamps; TagInput and EntryForm wrap (by APG, so not a twin) | ok |
| `ui/FieldError` (moved to `ui/`) | 18 | 6 hand copies in auth and Settings | Top 10 #6 |
| `ui/ChoiceGroup` | 2 | none | ok |
| `ui/Avatar` | 5 | none | ok |
| `ui/Username` | 6 | none | ok |
| `ui/CookLink` | 2 | Discover's 44px (commented) | leave |
| `ui/ConfirmStep` | 11 | none (SelectBar uses it) | ok |
| `ui/FormActions` | 2 | none | ok |
| `ui/EmptyPanel` | 5 | 2 `padding-block: 10px` | Top 10 #9 |
| `ui/ResultStatus` | 3 | none | ok |
| `ui/Dropdown` | 6 | none: CookbookSheet composes its `.menu-panel` (CookbookSheet.svelte:28), and every `role="menu"` sits inside a Dropdown | ok |
| `ui/SearchFilters` | 3 | none: URL rewrites go through `hrefWith` (9 callers) | ok |
| `ui/TagTabs` | 2 | none (`.n` lives only in cookbook `.seg`) | closed |
| `ui/TagInput` | 2 (RecipeForm, SelectBar) | its removable pill × against CookbookPicker's (long tail) | — |
| `ui/ShowMore` | 5 | none | ok |
| `ui/Navbar`, `ui/TabBar` | 1 each | the wordmark is text in both Navbar:32 and error.html:169 | singletons |
| route `CookbookSheet` (new) | 2 (picker, View) | none | a layer on Dropdown, not a twin |
| route `ScalePanel` (new) | 1 (Details) | none: an in-flow `role="group"`, not a panel twin; its ± use `.hit-link`'s method on the inline axis, commented at :244-247 | clears the "three sheet implementations" suspect |
| route `SelectBar` (new) | 1 | none: TagInput, ConfirmStep, Dropdown, CollectionChecks reused | 509; ok |

## 4. Long tail

### Control inventory

- 133 hits, 92 of them `<button>`. 0 are outside the set (last unit run).
- `shrink:` the RecipeActions pill padding `8px 18px 8px 16px` (RecipeActions.svelte:210) is still asymmetric with no reason. (S)

### Deduplication: helpers and server

- Clean, each with evidence: `hrefWith` has 9 callers, and `filterHref`, `viewHref` and `sortHref` go through it (cookbook/+page.svelte:46-60); `todayFor`: 0 inline `toISOString().slice(0, 10)` todays. The 2 hits are a month key (journal.ts:84) and a date check (server/journal.ts:72); `/^\d+$/` is only in `wholeNumber` (helpers.ts:79); `formData.get` is direct only for File and checkbox reads (images.ts:219, validation.ts:438,462, journal edit:81); `stripMetadata` has 1 owner, which `scripts/strip-stored-photos.ts:11` imports; the 5 notification reads (notifications.ts:76-250) share `unseenAt` and `heardFrom`. Each reads its own table: leave; the SelectBar tag step uses TagInput (SelectBar.svelte:237), and select mode uses `selection.svelte.ts`.
- `reuse:` the report cap is written as a literal: `maxlength="1000"` at ReportStep.svelte:31, while `MAX_REPORT` (server/moderation.ts:90) cannot be imported client-side. friends/+page.server.ts:144 retypes the `REPORT_ERRORS.tooLong` sentence (moderation.ts:105). Move `MAX_REPORT` to `src/lib/moderation.ts`, and use `REPORT_ERRORS.tooLong`. (S)
- `reuse:` search/+page.server.ts:18-25 writes `noindex: true` inline. The other 12 routes use `privatePage`, or `recipeMeta`. Search keeps a description, so either `privatePage` grows an optional description or this stays. (S)
- `extract:` `DAY_MS` is defined twice (profiles.ts:9, trash.ts:31), and `86_400_000` is written inline at discover.server.ts:104. (S)
- `extract:` the combobox's wrapping arrow walk is written twice (TagInput.svelte:91-97, EntryForm.svelte:106-111, the same 4 lines). Extract a `wrapStep(active, count, key)` only if a third appears. (S)
- `extract:` the two unit-size tables (`UNITS` convert.ts:20, `ML_PER_UNIT`/`GRAMS_PER_WEIGHT_UNIT` gramTables.ts:212,240). Still open. (M)
- `yagni:` `privatiseForksIn` (friends.ts:132) and `valuesOf` (entryForm.ts:22) are exported, but only their own file calls them. (S)
- `reuse:` `'private' | 'friends'` is still hand-written at seedData.ts:500, where `LOG_AUDIENCES` (schema.ts:216) exists. (S)

### Deduplication: CSS

- `extract:` removable pills, two ways on the same `.tag`: TagInput (TagInput.svelte:143-152): a `<button class="tag-remove">` with a 16px × in Ink 3 at 1rem and a `::before` hit (:253-282); CookbookPicker (CookbookPicker.svelte:365-373): an `<a class="tag picker-pill">` whose × inherits `.tag`'s colour, with an `::after` hit (:691-695). Different elements, by need (a form value against a link). The × glyph's size, colour and hit should be one `.tag-x` in app.css. (S)
- `extract:` the pseudo-element hit area is a second mechanism beside `.hit-link`, written 4 times with 4 insets: TagInput:272/282 (−4/−14px), CookbookPicker:694 (−10px 0), diff/+page.svelte:243 (−11px 0) and VersionBar.svelte:332/430 (−4/−11px 0). Add an app.css `.hit-pseudo` with `--hit`, or write the rule in DESIGN "Buttons". (M)
- `reuse:` the typed `·` in markup at JournalEntry.svelte:36, journal/+page.svelte:36 and diff/+page.svelte:78, where `.dot-list` exists (19 users). Details.svelte:157 `.not-scaled::before` draws its own `content: '·' / ''` with its own padding. The status strings in new/edit (`' · '`) are text and stay. (S)
- `reuse:` Settings `.form` (settings/+page.svelte:449-453) is `.form-col` (app.css:1174-1178) declaration for declaration. Open since 11 Nov. (S)
- Segmented controls: one definition, cookbook `.seg` (cookbook/+page.svelte:459-495), used twice in the same file. SectionSwitch is underline tabs, a different look (SectionSwitch.svelte:87-98). Suspect cleared.
- Settings check looks: ChoiceGroup's native radios are for single choices, and the `.tick` checkboxes (settings:287-295) are for the multi-choice kinds, both decided (DESIGN.md:249). CollectionToggle's 16px SVG box (CollectionToggle.svelte:49-67) is a third mark, for menu checkboxes (DESIGN.md:472). Suspect cleared, as decided; only the `.tick` comment drifts (Top 10 #5).
- `extract:` 7 `display: -webkit-box` clamps against `line-clamp`. Unchanged. (M)
- `min-height: 44px`: 17 rules (15 last sweep). Breakpoints: 699 ×44, 700 ×9, 767 ×7, 1023 ×7, 768 ×6, 900 ×4, 1024 ×3, 1100 ×2, 899 ×2, 359 ×1. All are named in DESIGN.md:269.

### CSS complexity (open from `css_complexity_2026-11-10.md`)

- `shrink:` VersionBar `margin-left: 36px` is written 3 times (:268,394,452). The `[aria-expanded='true']:hover` rule (:308) repeats the underline set at :305. (S)
- `shrink:` friends `.link-row` still goes column, row, column (friends/+page.svelte:306,364,388). (S)
- Cookbook's `display: contents` (cookbook/+page.svelte:508) still reaches into SearchFilters. (M)

### Dead code

- 0 components with no importer. 0 route-local `.svelte` files with no importer (scripted).
- `/moderation` has no inbound link, by decision (DESIGN.md:425, "linked from nowhere"). `/report` is linked from the footer (+layout.svelte:111). `/favorites` and `/notifications` are action or redirect routes. ok.
- 29 exported functions are referenced only in their own file plus tests. They are exported for tests (the notification reads, the friends `*In` helpers, the fixtures, `scaleQuantity`), so they are not dead. The exceptions are the `yagni:` line above.

### Oversized files

- `split:` CookbookPicker.svelte (697). The seam is the naming step (Top 10 #10), which takes it to about 625. A second seam is the no-script fallback lists (:378-398 with their CSS). (M)
- `split:` cookbook/+page.svelte (658, 37 commits). The seam is the phone View: the snippets `showSegments`, `viewSegments`, `viewMenu`, `slidersIcon` and `viewIcon` (:307-447), plus `.seg` and `.view-sheet` CSS (:459-495, :612-630), become `CookbookView.svelte` with props `{ data, labelledby }`. (M)
- `split:` RecipeForm.svelte (612, 75 commits). The seam is draft persistence: the leave guard, the debounced store and the reply-wins rule (:203-317) become a `draftSync.svelte.ts` rune module beside `fieldErrors.svelte.ts`. (M)
- Leave: GroupedTextEditor (571), seedData (577) and `e2e/recipe.test.ts` (1832).

### Blind or stale tests

- Top 10 #4 and #7.
- `extract:` the throwaway-cook sign-up is written 3 times: notifications.test.ts:8-19, a local `signUp`; delete-account.test.ts:13-23; auth.test.ts:103-109. The suffix `Date.now().toString(36)+Math.random()…` is a fourth copy of `uniqueTitle`'s (helpers.ts:49). Add `uniqueSuffix()` and `signUpCook(page, label)` to `e2e/helpers.ts`, returning `{ username, email }`. (S)
- e2e collection rows: `collectionRow` (helpers.ts:111) is used in 4 specs. The other `getByRole('menuitemcheckbox', { name })` calls are plain locators, not copies. Suspect cleared.
- `blind:` users/[username]/page.svelte.test.ts:139,140,180 still grep the source for `formatDate(`, `toLocaleDateString` and `MoreMenu`. (S)
- `mockDb()` is used by 3 files, and 27 files mock `db/index` by hand (24 last sweep). How many fit the helper is unverified.
- Skips: 36 `describe.skipIf(!localDb)` (intended), and 7 `test.skip(!!row.auth !== signedIn())` in invariants.test.ts (the project split). None stale.

### Docs drift

- Top 10 #1, #2, #3, #5 and #8.
- Checked and consistent: the AGENTS helper list against `src/lib` (scripted: 288 names, 0 unresolved identifiers, and 0 new exports with 2 or more importers missing); the DESIGN "Shared components" rows for every new shared component: AddFields, ChoiceSelect, FieldError, Dropdown (placement and shade), MoreActions, ReportStep, CollectionChecks and RecipeRow (DESIGN.md:453-472); the wordmark (Navbar.svelte:32 against DESIGN.md:395); the breakpoints (DESIGN.md:269); `/moderation` (DESIGN.md:425); the Settings notification ticks (DESIGN.md:249); `E2E_PORT` (playwright.config.ts:19-26); the decision pack's two deviations from last sweep (0 grep hits).
- Not checked: DESIGN.md is 497 lines. Only Shared components, Buttons, Clay, Do's and Don'ts, Settings, Notifications, Logo and Breakpoints were read against code.

### Hygiene

- `any`: 0 (all 5 grep hits are prose). `@ts-ignore`: 0. `@ts-expect-error`: 1, with a reason (TagInput.svelte.test.ts:140).
- 41 disables (32 last sweep). There are 11 new `svelte-ignore`s; each has its reason on the comment line above (for example, TagInput:194, ChoiceSelect:137, ScalePanel:124 and cookbook/+page:361) or inline (SelectBar:226, ConfirmStep:114, Dropdown:139).
- Ponytail ledger: 17 notes. New since the last sweep: rateLimit.ts:98, count-then-insert race; moderation.ts:21, no paging; moderation.ts:35, no target index (routed below); bulk.ts:198; images.ts:88; account.ts:101; journal.ts:469; validation.ts:79; cookbook/+page.server.ts:147; app.css:794. All still true. None is due at pilot scale. app.css:755's note moved to :794.
- Worktrees (list only, not removed): 18 under `.claude/worktrees/agent-*` (`git worktree list`), 7 of them `locked`. Each has a `worktree-agent-*` branch, and all 18 are merged into master (`git branch --merged master | grep -c worktree` printed 18; `--no-merged` is empty). `.claude/worktrees/` is untracked (git status).
- A stray empty file `--help` (0 bytes, 11 Nov 20:12) at the repo root, untracked. Reported, not touched.

### Database

- Journal: 25 entries, idx 0–24, latest `0024_notifications`. 25 `.sql` files and 25 snapshots, `prevId` chain unbroken (scripted).
- `schema.ts` and `drizzle/` were last changed in the same commit (`c9b81fd`). Against the 0024 snapshot: 14 of 14 tables and 21 of 21 index names match (scripted). Columns were not compared.
- `pnpm db:generate` dry run: not run, since it writes a migration when it finds drift.
- `as const` unions: one hand-written copy remains (seedData.ts:500).

### Dependencies

- 7 runtime and 28 dev dependencies (7 and 28 last sweep). Every runtime dependency is imported (`zod`, `diff` and `@supabase/ssr` by 1 file each). 34 caret ranges and 1 exact (`parse-ingredient 3.0.0`); the lockfile pins them.

### Pool and connections

- `db/index.ts` has `max: DB_POOL_MAX ?? 10` (:19), `idle_timeout: 20` (:20), the globalThis client (:14), and `end({ timeout: 5 })` on signal (:26) and in close (:43). All 26 `*.db.test.ts` close through `closeDbAfter` or `closeDb` (scripted). Clean.

## 5. Could not be verified

- Unit, check, lint and e2e: not re-run, by brief. Summary line 1 quotes the last clean run.
- `pnpm db:generate`: not run (section 4, Database). Columns in `schema.ts` against the snapshot were not compared.
- No browser. The CSS findings come from reading source and were not probed: the `.tag-x` and `.hit-pseudo` extractions, and the `.form`/`.form-col` equality (by declarations).
- Whether the auth routes' unannounced error lines (Top 10 #6) were made that way on purpose: they are checked on blur by `emailCheck`, and announcing them may be a design question.
- Whether anything besides the impeccable skill reads `.impeccable/design.json`.
- How many of the 27 hand-mocked db tests fit `mockDb()`.
- Literal UI strings asserted where a constant exists were only sampled: 0 of 4 constants checked were retyped in tests.

## 6. Delta vs `code_health_2026-11-11c.md`

**Closed: 17** (each checked by grep on `87b72ce`):
- Top 10: #1 FieldError twins in the recipe editors and route forms: 0 remain there, and FieldError moved to `ui/`; #2 the byline-mono sentence: "bylines" has 0 hits in DESIGN.md; #4 `privatePage`: 12 callers, with 1 deliberate inline left (long tail); #5 the F. mark: unpinned no more, because both Navbar and error.html set the text wordmark; #6 `hrefWith`: it has landed, and CookbookCollections is gone; #7 AGENTS `fieldErrors` and `revokeKeptCopies` are listed; #8 `wholeNumber`/`text` reuse: 0 hits; #9 the decision-pack deviation: 0 hits; #10 `.keep`/`.personal`, and the 6 `no-underline` (0 left).
- Long tail: the `.n` twin; the inline ISO today (`todayFor`); FieldError's DESIGN row; the `hrefFor` stale-page path (routed last time); the 2 recipe-editor error lines (IngredientEditor, StepEditor); PhotoField's error line; `CookbookCollections`'s disable; the decision pack's avatar clause.

**Still open: 15**:
- Top 10 #3 (`design.json`).
- Discover lead media.
- EmptyPanel paddings (now Top 10 #9).
- The two unit tables.
- `DAY_MS`.
- The seedData union.
- Settings `.form`.
- The webkit clamps.
- `styleOf`, now "use `cssRule`" (18 slices, Top 10 #4).
- `sqlOf` adoption (18, Top 10 #7).
- The users source-string test.
- `privatiseForksIn`/`valuesOf`.
- The RecipeActions pill padding.
- VersionBar 36px plus the hover repeat.
- Friends `.link-row`, and cookbook `display: contents`.

**New: 14**:
- Top 10: #1 the clay-exception contradiction; #2 the gradient rule; #5 the `.tick` comment; #6 the auth FieldError copies (6); #8 the ROADMAP lines; #10 the naming step ×3.
- Long tail: the report cap literal; the removable pill ×; the pseudo-element hit area ×4; the typed dots ×3 plus Details' own dot; the arrow walk ×2; the e2e sign-up ×3; the three over-600 splits (CookbookPicker, cookbook page, RecipeForm); 18 merged worktrees and the `--help` file.

Suspects from the brief that were cleared with evidence: the three sheet/panel implementations (one Dropdown, one layer, one in-flow group), the Settings check looks (decided), segmented controls (one definition), ScalePanel's hit padding (commented `.hit-link` method), the duplicated e2e collection rows, and AGENTS' stale or missing helpers.

## 7. Route elsewhere (not analysed)

- perf: `reports` has no index on its target, so `/moderation` reads every live report (moderation.ts:35, its own ponytail). Route to `schema-reviewer` before the list grows.
- correctness, possible: `rateLimited` counts then inserts, so two concurrent writes can both pass at max − 1 (rateLimit.ts:98, its own ponytail). Route to `/code-review` only if the limits guard abuse rather than cost.
- security: photos are public URLs (`getPublicUrl`, images.ts:190), against ROADMAP:107 "Photo access follows audience: next". This is known and on the roadmap, so nothing new to route.

## Production publish blockers

None found by this sweep. Every finding above is duplication, drift or a test gap.

net: about −120 lines possible (estimate), −0 deps.
