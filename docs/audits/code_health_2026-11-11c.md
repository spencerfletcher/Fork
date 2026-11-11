# Code health · 11 Nov 2026 (third sweep)

Fourth sweep under `.agents/skills/code-health/SKILL.md`, read-only, started on master `6c0dd80` and finished on `d8c5d00` (two commits landed meanwhile: the roadmap line and migration `0018_profile-and-feed-indexes`; the evidence below holds on `d8c5d00`). 78 commits since the previous sweep's `b077e4e` (`git log --oneline b077e4e..HEAD | wc -l`), 179 files, +7960/−1841. One file written (this one). Fixes are separate builder items.

## 1. Summary

1. Last clean run (not re-run here): unit 2391 passed, `pnpm check` 0 errors, lint clean, e2e 315 passed.
2. Largest file: `src/lib/components/recipes/GroupedTextEditor.svelte` at 571 lines. No component is over 600 now (RecipeForm went from 753 to 561, and the recipe page from 652 to 530). The largest server module is `seedData.ts` at 573, `src/app.css` is 1475 lines, and the largest test is `e2e/recipe.test.ts` at 1759.
3. Components: 29 under `src/lib/components`, none dead. 4 have a local twin: `FieldError` (6 hand-written copies), `RecipeCard` (Discover's lead media), `EmptyPanel` (2 hit paddings) and `CookLink` (Discover's 44px, commented). 5 patterns still have no owner: the URL-param rewrite, the two unit-size tables, the tab count `.n`, `.keep`/`.personal`, and the server's ISO day.
4. Closed set: 93 control hits, 64 of them `<button>`. `controls.test.ts` has 7 `CLOSED_SET` classes and 10 STRUCTURAL entries, each with a reason, and the last unit run passed it.
5. Docs drift: DESIGN.md:140 still says bylines are set in mono, against DESIGN.md:451 and the code. `.impeccable/design.json` was generated on 28 Oct and DESIGN.md has had 213 commits since; it still describes a "cream wordmark". AGENTS is missing `fieldErrors` and `revokeKeptCopies`. The decision pack has 2 stale deviations. 0 dead links (10 docs, 181 refs), and all 154 AGENTS helper names resolve.
6. Tests: the db-test scaffolding and the e2e helpers are closed: 0 inline stamps or `closeDb` calls remain, and 1 inline POST, which reads the reply. The F. mark's paths are copied in Navbar and `src/error.html` and nothing pins them equal. Raw `sqlToQuery` calls went from 11 to 17.
7. Hygiene: 0 `any`, 0 `@ts-ignore`, 1 `@ts-expect-error` (with a reason). 32 disables, every one with a reason or self-evident (4 are new, all with a reason). 7 ponytail notes (2 new: export.ts:34, sitemap.ts:8), all still true.
8. Database: 19 journal entries, idx 0–18 contiguous, 19 SQL files and 19 snapshots, `prevId` chain intact (scripted). The list indexes are in flight, partly landed (0017, 0018).
9. Delta: 19 closed, 14 still open, 11 new (section 6).
10. net: about −60 lines possible (estimate), −0 deps.

## 2. Top 10

Score = (90-day commits on the busiest file touched × copies) / effort (S=1, M=4). Commits come from `git log --since=2026-08-13 --oneline -- <file> | wc -l`.

1. `reuse:` `FieldError` owns `<p class="field-error" id="{name}-error" role="alert">`, yet three recipe editors still hand-write the same line: IngredientEditor.svelte:70, StepEditor.svelte:37 and PhotoField.svelte:167. Three route forms write the same shape with their own ids: CookbookCollections.svelte:87, SaverNote.svelte:59 and MoreActions.svelte:121. Use `<FieldError name="ingredients|steps|image" />` in the three editors. Then move `FieldError` to `src/lib/components/ui/`, since its comment ("A recipe editor field's") is the only thing keeping it in `recipes/`, and use it in the three route forms. (S) — 67 × 6.
2. `drift:` DESIGN.md:140 says "Version chips, bylines and diffs are first-class marks, set in mono". DESIGN.md:451 says "set version ids, handles and diff text in JetBrains Mono, and nothing else". The byline is `font-sans` (RecipeHeader.svelte:84). Drop "bylines" from :140. (S) — 213 × 2.
3. `drift:` `.impeccable/design.json` was last written on 28 Oct (`ba05c7e`, `generatedAt 2026-10-28`), and DESIGN.md has had 213 commits since. It describes the Navbar as "cream wordmark", which the F. mark retired (DESIGN.md:361), and the Recipe Card as "mono meta", but the card meta is `--font-sans` (RecipeCard.svelte:320). It has 8 components against DESIGN's 13 shared ones. Regenerate it from DESIGN.md (the `impeccable-documenter` agent), or delete it if nothing reads it. (S) — 213 × 1.
4. `reuse:` `privatePage(title)` (seo.ts:47) is the signed-in page's `meta`, as AGENTS says, but no route calls it: 11 write `{ title, noindex: true }` inline, at journal/+page.server.ts:25, journal/new:54, journal/[id]/edit:67, friends:37, settings:31, cookbook:24, cookbook/trash:34, recipes/new:20, confirm-email:7, reset-password:10 and search:24. Use `privatePage`, or drop it and its AGENTS mention. (S) — 51 × 11 / 1, capped by low per-route reach.
5. `blind:` the F. mark's two `d` paths are byte-identical in Navbar.svelte:34,37 and error.html:163,166 (scripted compare), and error.html hard-codes the stop as `#eca620`, which is `--color-marigold` (app.css:227). `error.html` cannot import Svelte. Its test (error.test.ts:17-22) and Navbar.svelte.test.ts:80-88 each pin the viewBox and "2 paths", never the drawing, so a redraw in one file stays green. Add one test that reads both files and asserts the `d` attributes equal, and the stop's fill equals app.css's marigold. (S) — 50 × 2.
6. `extract:` "this page's URL with one param changed" is still written 3 times: cookbook/+page.svelte:32 `filterHref`, CookbookCollections.svelte:22 `hrefFor` and SearchFilters.svelte:44. The copies have now drifted. Pagination taught two of them `withoutPlace` (cookbook:33, SearchFilters:28), but `hrefFor` still copies `page.url.search` whole, so a collection link from `?page=3` keeps `page=3`. Add `hrefWith(url, name, value | null)` in `src/lib/listPage.ts`, built on `withoutPlace`, which also drops 2 `eslint-disable`s. The behaviour goes to code review (section 7). (S) — 24 × 3.
7. `drift:` AGENTS "Shared helpers":
   - `fieldErrors` (`src/lib/recipes/fieldErrors.svelte.ts:46`, with `typedMessage` :17; 3 importers) is not listed, nor is `FieldError`.
   - The `grantKeptCopies` line (AGENTS.md:62) lists the grants, but not `revokeKeptCopies(tx, a, b)` (keptCopies.ts:78), the block's revoke that DESIGN.md:404 documents.

   `wholeJournalOf` (1 caller, export.ts:150), `feedFor` (1 route), `blockedIdsOf` (1 caller, keptCopies.ts:42) and `sitemapUrls`/`urlset` (1 route) each have one production caller, so they are dismissed as not shared. (S) — 43 × 2.
8. `reuse:` `wholeNumber` and `text` are hand-rolled where they exist. recipes/[slug]/+page.server.ts:354-355 has `wholeNumber(String(formData.get('version') ?? ''))`, though `text` is already imported (:6). recipeCounts.ts:54 has `OFFSET = /^\d+$/` with `Number(after)` (:74), which is `wholeNumber(after)`. (S) — 51 × 3.
9. `drift:` the decision pack's deviation line (docs/design/2026-11-10-decision-pack/DESIGN-SUMMARY.md:106) still says "Discover's lead card and Recent changes hide while a filter is active". DESIGN.md:222 and the code say they stay; this was open last sweep too. A new contradiction since then: "the top-bar handle shows from 1024 and the initial alone from 768", where DESIGN.md:375 now has the avatar alone at every width. Fix both clauses. (S) — 213 × 2, but a history doc, so ranked down.
10. `reuse:` typography twins in the recipe header family. KeepLine `.keep` (KeepLine.svelte:76-81) is RecipeHeader `.personal` (RecipeHeader.svelte:269-274), with 4 identical declarations. RecipeActions also carries 4 `no-underline` (:99,105,124,168) and the journal page 2 (:46,55), where `a { text-decoration: none }` and the `.btn-*` classes already cover it. Move `.keep`/`.personal` into one app.css class and drop the 6 `no-underline`; the computed style is unverified. (S) — 63 × 2.

## 3. Component status

Importers = non-test files importing the component, the component's own file excluded.

| Component | Importers | Local copies remaining | Drift / note |
|---|---|---|---|
| `Icons.svelte` | 17 | none | ok |
| `recipes/FieldError` (new) | 4 (RecipeForm, MoreDetails, TimesRow, SourceFields) | 3 in recipe editors (IngredientEditor:70, StepEditor:37, PhotoField:167), 3 in routes (CookbookCollections:87, SaverNote:59, MoreActions:121) | Top 10 #1; no DESIGN Shared-components row |
| `recipes/MoreDetails`, `TimesRow`, `SourceFields` (new) | 1 each | none | RecipeForm's seams by design (last sweep's split); ok |
| `recipes/RecipeForm` | 2 | — | 561 lines, under the bar: split closed |
| `recipes/GroupedTextEditor` | 2 | — | 571; leave |
| `recipes/IngredientEditor`, `StepEditor` | 1 each | their error line (Top 10 #1) | — |
| `recipes/PhotoField` | 2 | its error line (Top 10 #1) | — |
| `recipes/ReadBack` | 2 | none: it uses `.dot-list` (ReadBack.svelte:43) | closed |
| `recipes/RecipeCard` | 4 | Discover `.lead-media`/`img`/`.change-note` (Discover.svelte:139,145) restate the card's panel, image and note | still open |
| `recipes/RecipeGrid` | 4 | — | ok |
| `recipes/VersionDiff` | 1 | — | ok |
| `ui/ShowMore` (new) | 5 | none: every paged list (Journal, Discover, Cookbook, tags, Search, profile, Friends) uses it, with `pagedList` and `listPage` | ok; one owner for pagination |
| `ui/Avatar` | 5 | none | ok |
| `ui/Username` | 5 | none | ok |
| `ui/CookLink` | 2 | Discover's 44px for 700–899 (Discover.svelte:207-209, commented as deliberate) | leave |
| `ui/ConfirmStep` | 7 | MoreMenu's block step (decided) | ok |
| `ui/FormActions` | 2 | none | ok |
| `ui/ChoiceGroup` | 3 | none | ok |
| `ui/EmptyPanel` | 4 | Discover `.empty a` (:298) and Cookbook `.cookbook-none a` (:282) set their own `padding-block: 10px` instead of `.hit-link` | still open |
| `ui/ResultStatus` | 3 | none | ok |
| `ui/Dropdown` | 3 | none | DESIGN row added (DESIGN.md:442): closed |
| `ui/SearchFilters` | 3 | the URL-rewrite shape (Top 10 #6) | DESIGN row added: closed |
| `ui/TagTabs` | 2 | CookbookCollections `.tag-tabs .n` (:161) restates cookbook `.seg .n` (:208) | DESIGN row added; `.n` open |
| `ui/TagInput` | 1 | EntryForm's key walk (leave) | ok |
| `ui/Navbar`, `ui/TabBar` | 1 each | the F. mark drawn again in `src/error.html` (unavoidable; Top 10 #5) | singletons |
| route `SectionSwitch` (new) | 1 | none | last sweep's split seam; in STRUCTURAL |
| route `KeepLine` | 1 | `.keep` = RecipeHeader `.personal` | Top 10 #10 |

## 4. Long tail

### Control inventory

- 93 hits, 64 of them `<button>`. 0 are outside the set (last unit run). DESIGN.md "Buttons" and `CLOSED_SET` agree.
- `shrink:` the RecipeActions pill padding `8px 18px 8px 16px` (RecipeActions.svelte:198) is still asymmetric with no reason given. (S)

### Deduplication: helpers and server

- Pagination is clean. All 7 list routes go through `listPage` (`grep -rn "listPage(" src/routes`), the 3 cursors live one per module (recipeCounts.ts:52, journal.ts:308, friends.ts:303), and `withoutPlace` is used by ShowMore, SearchFilters and the cookbook filter.
- `shrink:` the cursor timestamp group `\d{4}-\d\d-\d\d \d\d:\d\d:\d\d(?:\.\d{1,6})?` is written twice (recipeCounts.ts:52, friends.ts:303). Leave it unless a third list appears.
- Export is clean. `exportFor` reuses `canView`, `inLibraryOf`, `keptVersionsOf` and `wholeJournalOf`. Both endpoints are 4 lines through `exportRequest`/`exportResponse`. It has its own `refusal` (export.ts:201), the one `json({ error, code })` in `src`, because a GET has no `fail`. ok.
- The sitemap reuses `visibleTo(null)` (sitemap.ts:52), and robots.txt is a constant. Clean.
- Kept copies are clean. `blockedIdsOf` and `friendIdsOf` share `pairedWith` (visibility.ts:129-136), and `pairOf` in friends.ts:37 is `eitherWay`. No `'blocked'` query is written twice.
- `extract:` the two unit-size tables (`UNITS` convert.ts:21 against `ML_PER_UNIT`/`GRAMS_PER_WEIGHT_UNIT` gramTables.ts:212,240). Still open. (M)
- `extract:` `DAY_MS` is still defined twice (profiles.ts:9, trash.ts:28), and `86_400_000` is written inline (discover.server.ts:100). (S)
- `reuse:` the server's today is still inline (journal/new/+page.server.ts:44, journal.ts:60). (S)
- `reuse:` `'private' | 'friends'` is still hand-written where `LogAudience` exists (seedData.ts:496). (S)
- `yagni:` `privatiseForksIn` (friends.ts:132) is exported with no importer and no test. `valuesOf` (entryForm.ts:22) is the same. `SITE_URL` and `FEED_LIMIT` are gone: closed. (S)
- `extract:` the invalid/described-by pair `aria-invalid={e ? 'true' : undefined} aria-describedby={e ? '{name}-error …' : …}` is written 8 times in the recipe editors (MoreDetails:42, TimesRow:40, SourceFields:28,44, RecipeForm:411,458, PhotoField:135, GroupedTextEditor:373). Do it after Top 10 #1, as a FieldError-exported `described(name, error, hint?)`, only if it reads shorter. (S)

### Deduplication: CSS

- `reuse:` Settings' local `.form` (settings/+page.svelte:318) and `.setting-body` (:271,282) restate `.form-col`. Still open. (S)
- `extract:` the tab count `.n` is written twice (cookbook/+page.svelte:208, CookbookCollections.svelte:161). (S)
- `extract:` Discover's lead media restates RecipeCard's rules (component table). (S)
- `extract:` 7 `display: -webkit-box` clamps against 1 `line-clamp-N`. Unchanged. (M)
- `shrink:` VersionBar's new hover block (VersionBar.svelte:308-323, 7a92d40) repeats `text-decoration-line: underline` in the `[aria-expanded='true']:hover` rule (:317), which the `.versions-toggle:hover` rule above (:312) already sets. Only the colour differs. The `margin-left: 36px` is still written 3 times (:275,401,459). (S)
- `min-height: 44px`: 15 rules (14 last sweep). Media breakpoints: 699 ×40, 700 ×7, 1023 ×7, 768 ×4, 1024 ×3, 767 ×3, 1100 ×2, 899 ×2, 900 ×1, all in DESIGN.md:246. The 4 `max-width: 560px` are measures, not queries.

### CSS complexity (open from `css_complexity_2026-11-10.md`)

- `shrink:` friends `.link-row` still goes column, row, column (friends/+page.svelte:240,296,310). (S)
- Cookbook's `display: contents` reach into SearchFilters (cookbook/+page.svelte:225). Still open. (M)

### Dead code

- 0 components with no importer, and 0 route-local `.svelte` without an importer (scripted).
- 52 `src/lib` exports are referenced only in their own file plus tests. They are constants and units exported so tests can derive expected values (the CLAUDE.md rule), so they are not dead. The exceptions are the two `yagni:` lines above.
- Routes: `/sitemap.xml` and `/robots.txt` are new and reached by crawlers. `robots.txt` disallows `/favorites`, which is a live redirect route (`src/routes/favorites`). ok.

### Oversized files

- None over the bar. RecipeForm (561) and the recipe page (530) have been split along the seams named last sweep (MoreDetails, TimesRow, SourceFields, `fieldErrors.svelte.ts`, SectionSwitch). Leave GroupedTextEditor (571), seedData (573) and `e2e/recipe.test.ts` (1759).

### Blind or stale tests

- Top 10 #5.
- `reuse:` there are 17 raw `PgDialect().sqlToQuery` calls (11 last sweep), in visibility.test.ts ×5, recipeSearch.test.ts ×4, edit/page.server.test.ts ×3, friends.test.ts ×2, recipeCounts.test.ts ×2 (new) and search/page.server.test.ts ×1. The local `sqlOf` twin at search/page.server.test.ts:234 is still there. Use `sqlOf`. (S)
- `extract:` 15 hand slices of `<style>` in 10 test files (14 last sweep); a `styleOf(source)` in `src/lib/testing/css.ts`. VersionBar.svelte.test.ts has 18 `toMatch(/…/)`/`match(/…/)` calls. (S)
- `blind:` users/[username]/page.svelte.test.ts:129,130,170 still grep source for `formatDate(`, `toLocaleDateString` and `MoreMenu`. (S)
- `mockDb()` is used in 3 files, and 24 mock `db/index` by hand. How many fit the helper is unverified.
- e2e: one inline `page.evaluate(fetch(POST))` remains (authenticated.test.ts:852). It reads the fork's redirect from the reply, which `postAction` (helpers.ts:79) discards, so leave it. No e2e helper name is defined twice (scripted).
- Skips: 18 `describe.skipIf(!localDb)` (intended), and 7 `test.skip(!!row.auth !== signedIn())` in invariants.test.ts (the project split). None stale.

### Docs drift

- Top 10 #2, #3, #7 and #9.
- Dismissed: DESIGN.md mentions the retired "Fork." wordmark only as history. DESIGN.md:361 says the mark "replaced the 'Fork.' wordmark"; :363 sizes the F against "the retired wordmark's capitals". No current claim names it (`grep -n "wordmark\|Fork\." DESIGN.md`). The live mention is in `.impeccable/design.json` (Top 10 #3).
- `drift:` DESIGN "Shared components" (DESIGN.md:429-445) has no row for `FieldError`. Add it with Top 10 #1. (S)
- Checked and consistent:
  - The DESIGN front matter is nested again (`colors:` / `  paper:`, DESIGN.md:4-6).
  - The Metric sentence (measurement.ts:23 against DESIGN.md:245).
  - The action row ends in ⋯ (DESIGN.md:327).
  - Your data (settings/+page.svelte:237-251 against DESIGN.md:245).
  - Export JSON/Markdown in More (MoreActions.svelte:159 against DESIGN.md:405).
  - The Logo section against `static/` and the manifest (DESIGN.md:361-367, manifest.webmanifest, app.html:8-12).
  - Dropdown, SearchFilters, TagTabs and ShowMore rows (DESIGN.md:441-444).

### Hygiene

- `any`: 0 (all 4 grep hits are prose). `@ts-ignore`: 0. `@ts-expect-error`: 1, with a reason.
- 32 disables (29 last sweep). The new ones are 2 `no-unused-vars` on cursor strips (recipeCounts.ts:100, friends.ts:441) and 2 `prefer-svelte-reactivity` (pagedList.svelte.ts:30,50), each with a reason. CookbookCollections:23 still has no reason, and `hrefWith` (Top 10 #6) removes it.
- Ponytail ledger, all still true and none due: app.css:755, trash.ts:151 and :176, recipeSearch.ts:67, cookbook/+page.server.ts:114, export.ts:34 (new: in-memory export) and sitemap.ts:8 (new: one sitemap capped at 5,000). The note at discover.server.ts:63 is gone.

### Database

- Journal: 19 entries, idx 0–18, latest `0018_profile-and-feed-indexes`. 19 `.sql` files and 19 snapshots, `prevId` chain unbroken (scripted on `d8c5d00`).
- The previous sweep's routed indexes landed in 0017: `recipes_live_updated_idx` and `recipes_trash_idx` (schema.ts:118,123). Closed.
- **In flight (another builder, not findings):**
  - Landed during this sweep (f25e6ae): the profile's `(author_id, updated_at, id)` partial index (`recipes_author_live_updated_idx`) and the Friends feed's entries index (`log_entries_friends_created_idx`).
  - Still to come: `recipe_versions (recipe_id, created_at)`, since schema.ts:385 has `created_at` alone, and the search text matcher.
- `as const` unions: one hand-written copy remains (seedData.ts:496).

### Dependencies

- 7 runtime and 28 dev dependencies, unchanged. Every runtime dependency is imported (`zod` and `@supabase/ssr` by 1 file each). 34 caret ranges and 1 exact (`parse-ingredient 3.0.0`); the lockfile pins them.

### Pool and connections

- `db/index.ts` has `max: DB_POOL_MAX ?? 10` (:19), `idle_timeout: 20` (:20), the globalThis client (:14), and `end({ timeout: 5 })` on SIGINT/SIGTERM (:24-26) and in close (:43). All 18 `*.db.test.ts` close through `closeDbAfter` or `closeDb` (scripted). Clean.

## 5. Could not be verified

- Unit, check, lint and e2e: not re-run, by brief. Summary line 1 quotes the last clean run.
- `pnpm db:generate` dry run: skipped, because it writes a migration when it finds drift.
- No browser. The CSS findings are reasoned from source and unprobed: `no-underline` redundancy, `.keep`/`.personal`, and the VersionBar underline repeat.
- Whether anything reads `.impeccable/design.json`, apart from the impeccable skill. Delete or regenerate is Spencer's call.
- The `hrefFor` stale-`page` path (Top 10 #6) is traced from source only: the URL ShowMore writes is shallow (ShowMore.svelte:32), so the stale `page` appears only after a reload or Back to `?page=N`.
- How many of the 24 hand-mocked db tests fit `mockDb()`.
- DESIGN.md is 466 lines. Only Logo, Shared components, Settings, Measurement, the action row, Buttons and the mono rule were read against code; the rest was checked only by grepping each quoted label.

## 6. Delta vs `code_health_2026-11-11b.md`

**Closed: 19** (each checked by grep on `d8c5d00`):
- Top 10:
  - #1 `signedOut`: 0 inline 401s outside actions.ts. reset-password:57 has its own wording.
  - #2 `BAD_FORM`: the literal appears only at actions.ts:28.
  - #3 e2e helpers: `createRecipe`, `postAction` and `uniqueTitle` are in helpers.ts.
  - #4 the front matter is nested again.
  - #5 the Metric sentence was rewritten.
  - #6 the DESIGN rows for Dropdown, SearchFilters and TagTabs, and the ⋯ in the action-row sentence.
  - #7 "Not authorized": 0 test files.
  - #8 db-test setup: `stamp` (13 files), `closeDbAfter` (18) and `withProfiles` (9).
  - #9 AGENTS: `changeUsername` appears once, `gramsFor` is placed right, and `versions.ts` is listed.
  - #10 typed dots: CookHeader and RecipeActions use `.dot-list`.
- Long tail:
  - ReadBack's dot.
  - The RecipeForm split (561).
  - The recipe page split (530, SectionSwitch).
  - The `SITE_URL` and `FEED_LIMIT` exports.
  - The `recipes.updated_at` and `deleted_at` indexes (0017).
  - Settings' `sessionEnded` twin.
  - The discover ponytail.
  - `DAY_MS`, part: down to 2 consts.
  - Dropdown's missing DESIGN row.

**Still open: 14**:
- Discover lead media.
- EmptyPanel paddings.
- The two unit tables.
- The URL-param rewrite (now drifted: Top 10 #6).
- The inline ISO day.
- The seedData union.
- Settings `.form`.
- `.n` ×2.
- `.keep`/`.personal`.
- `no-underline` ×6.
- The webkit clamps.
- `styleOf` (now 15).
- `sqlOf` adoption (now 17).
- The users source-string test.
- The decision-pack deviation.

The css_complexity residue (friends `.link-row`, VersionBar 36px, cookbook `display: contents`, pill padding) is listed under CSS complexity and not counted here.

**New: 11**:
- Top 10: #1 the FieldError twins, #2 the byline-mono sentence, #3 the stale design.json, #4 `privatePage` unused, #5 the F. mark unpinned, #7 the AGENTS `fieldErrors`/`revokeKeptCopies` gaps, #8 `wholeNumber`/`text` reuse, and #9's new avatar clause.
- Long tail: the VersionBar hover repeat, the `privatiseForksIn` export, the aria-invalid pair ×8, and FieldError's missing DESIGN row.

## 7. Route to code review (not analysed)

- correctness, possible: CookbookCollections `hrefFor` (CookbookCollections.svelte:22-29) keeps `page`/`after` when switching collection, so `?page=3&collection=…` opens three pages of another list, and a stale `after` cursor applies to a different list. Send it to `/code-review` with a reload-at-`?page=3` case.
- correctness, possible: the two unit-size tables, carried over from the previous sweep.
- perf: `recipe_versions (recipe_id, created_at)` and the search matcher, which another builder is adding now. Nothing to route.

## Production publish blockers

None found by this sweep. Every finding above is duplication, drift or a test gap. The one possible behaviour bug (`hrefFor`, section 7) is a wrong page count after a reload, with no data at risk.

net: about −60 lines possible (estimate), −0 deps.
