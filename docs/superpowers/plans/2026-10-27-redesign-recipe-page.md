# Redesign Recipe Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the recipe page on the locked design system: light header on paper, capped wide photo, collapsed version strip, rule-free method, sticky sidebar, and the mobile stack from the mock.

**Architecture:** The page keeps its component split (header, strip, ingredients, method, details, actions) and its loader; each component is restyled in place with tokens from the foundation step, and the page's grid is rewritten for the new column order. The espresso hero becomes a paper header, renamed to say so. One new loader field (fork count) feeds the sidebar's counts line.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Tailwind 4 utilities on the foundation tokens, Vitest with `@testing-library/svelte`, Playwright.

**Spec:** `docs/research/2026-10-26-ui-design-directions.md`, "Round 4" and "Round 5"; the canvas at https://claude.ai/artifact/QFTDpwCLRwuknh754yNPzc, boards "Recipe" and "Recipe — 390px". Foundation tokens: `docs/superpowers/plans/2026-10-27-redesign-foundation.md`, Global Constraints.

## Global Constraints

- Branch `redesign`; every task commits there. No Co-Authored-By lines. Tests before markup, per AGENTS.md.
- Header on paper. Author line mono 12px ink-3 (`@user`, link to the profile). Title Bitter 500 clay, `clamp(1.75rem, 4vw, 2.75rem)`, with the version chip beside it: mono 600, `1.0625rem`, ink on marigold, 4px radius, padding 2px 10px. Description 17px/1.5 ink-2, max-width 720px. Meta line 14px ink-2: total time, "Serves N", then tags as comma-separated links, separated by `·` in ink-3. No `.tag` pills in the header.
- Photo: content width, `height: 420px`, `object-fit: cover`, 8px radius, below the meta line on desktop. On mobile (≤ 860px) it sits between the title row and the description, full-bleed, `aspect-ratio: 2 / 1`, no radius. No photo: nothing takes its place; the header's title is the headline already (ruling on the spec's "pages show the title inside the panel", which repeats the title on a page).
- Version strip, every width: 1px dotted `--color-input-border` above and below, mono 12px. Current version as a chip (mono 600, ink on marigold, 3px radius, padding 0 5px), its message with ellipsis, then "Compare with v{n-1}" (hidden on v1 and while viewing history) and a `<button aria-expanded aria-controls="version-history">` reading "N versions" that opens the full list: one row per version with `v{n}` linking to `?version={n}`, the message, and a Compare link to `/diff?from={n-1}&to={n}`. One version: plain text "1 version", no button.
- Ingredients: eyebrow heading (the `h4.eyebrow-label` from the foundation), rows 16px with 8px vertical padding and a `--color-border` rule between rows, quantities weight 600 in ink, grams 14px ink-3 roman. Check-off keeps the strike-through and 40% opacity.
- Method: eyebrow heading with a bottom rule, steps in a column with 18px gap and no rules between them, numeral Bitter 500 22px clay in a 30px column (plain `1`, not `01`), step text 17px/1.6, annotation 15px italic: tip ink-3, warning `--color-remove`, substitution ink-2. Source Sans 3 italic is imported for it.
- Check-off focus: the row `<label>` shows the clay ring when its hidden checkbox has focus (`has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-offset-2`).
- Sidebar, 320px, 56px gutter, sticky at 76px: Details as rows (dt 10px 600 0.08em uppercase ink-3, dd Source Sans 600 16px, rules between), then the actions (Fork is `.btn-primary`, Favorite and Edit are `.btn-ghost`), then a counts line in mono 12px ink-3: "N versions" plus " · M forks" when M > 0.
- The favourite control is "Favorite" / "Favorited", with `aria-label` "Favorite" / "Unfavorite".
- Mobile (≤ 860px): header, strip, then actions row (Fork `flex: 1`, Favorite beside it), details as a three-column row, counts line, ingredients, method. The DOM order is aside first, main second, at every width; desktop places them with grid columns.
- Every colour pair is one the foundation test already clears; no new hex values.

## Review Focus

- A recipe with no photo: header, strip and content follow each other with no 420px gap. Task 2 Step 1 asserts no `<img>` renders; the existing e2e "layout survives a recipe with no photo" keeps the sidebar top-aligned.
- A recipe with one version: no Compare link, "1 version" as plain text, no toggle. Task 3 Step 1.
- Viewing an older version: the chip shows the viewed version, Compare is hidden, the banner's "Current version →" link is the way back. Task 3 Step 1 and the existing e2e history-banner test.
- A long commit message in the collapsed strip must not widen the page. The existing e2e "the version strip scrolls without widening the page" keeps the `.version-strip` locator and the 390px assertion.
- Keyboard users reaching a check-off row see the ring on the row, not on a 1px hidden box. Task 4 Step 1 asserts the classes; Task 7 looks at it.

---

### Task 1: Fork count in the loader

**Files:**

- Modify: `src/routes/recipes/[slug]/+page.server.ts:63-72` (the `return`)
- Test: `src/routes/recipes/[slug]/page.server.test.ts` (the `load:` describe block and its `loadData` helper)

**Interfaces:**

- Produces: `data.forkCount: number`, the count of public recipes whose `parentId` is this recipe's id.

- [ ] **Step 1: Write the failing test**

In the `load: fork attribution` describe block (or a new `load: counts` block using the same `beforeEach`):

```ts
test('counts public forks of the recipe', async () => {
	findRecipeMock.mockResolvedValue(forkOf({ isPublic: true, authorId: 'original-author' }));
	selectMock.mockReturnValue(chain([{ count: 2 }]));
	const data = await loadData();
	expect(data.forkCount).toBe(2);
});
```

Add `forkCount: number` to the `loadData` return type.

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm vitest run "src/routes/recipes/[slug]/page.server.test.ts" -t "counts public forks"` Expected: FAIL, `expected undefined to be 2`.

- [ ] **Step 3: Query the count in `load`**

One query: `db.select({ count: count() }).from(recipes).where(and(eq(recipes.parentId, recipe.id), eq(recipes.isPublic, true)))`, read as `Number(rows[0]?.count ?? 0)`, returned as `forkCount`. Import `count` from `drizzle-orm`. Scoped to public forks for the same reason `attachRecipeCounts` is.

- [ ] **Step 4: Run the loader tests**

Run: `pnpm vitest run "src/routes/recipes/[slug]/page.server.test.ts"` Expected: PASS, all. (The existing `beforeEach` returns `[{ value: 0 }]` from `select`, which the `?? 0` fallback turns into 0.)

- [ ] **Step 5: Commit**

```bash
git add "src/routes/recipes/[slug]/+page.server.ts" "src/routes/recipes/[slug]/page.server.test.ts"
git commit -m "Recipe page: load the public fork count"
```

---

### Task 2: Header on paper

**Files:**

- Rename: `src/routes/recipes/[slug]/components/RecipeHero.svelte` → `RecipeHeader.svelte`, and its test file likewise (`git mv`).
- Modify: `src/routes/recipes/[slug]/+page.svelte` (import and the `<RecipeHero>` call only; the layout is Task 6)
- Test: `src/routes/recipes/[slug]/components/RecipeHeader.svelte.test.ts`

**Interfaces:**

- Consumes: nothing new from Task 1.
- Produces: `RecipeHeader` with props `recipe` (unchanged shape), `currentVersion: Pick<RecipeVersion, 'versionNumber' | 'commitMessage'> & Pick<RecipeContent, 'title' | 'description' | 'servings' | 'prepTimeMinutes' | 'cookTimeMinutes' | 'imageUrl'>`, `isViewingHistory`, `tags`. Renders `<header class="recipe-header">` containing, in DOM order: history banner (when viewing history), author line, title row with the chip, fork attribution, description, meta line, photo (`<figure class="recipe-photo">` with the `<img>`, only when `imageUrl`). The photo's mobile position is CSS `order`.

- [ ] **Step 1: Write the failing tests**

Rename the file first so the imports resolve, update the import to `RecipeHeader`, extend `VERSION` with `description: 'Crisp edges.'` and `imageUrl: null`, then add:

```ts
describe('RecipeHeader content', () => {
	test('shows the version as a chip beside the title', () => {
		renderHeader(makeRecipe(), { ...VERSION, versionNumber: 3 });
		expect(screen.getByText('v3')).toHaveClass('bg-marigold');
	});

	test('shows the description under the title', () => {
		renderHeader(makeRecipe(), VERSION);
		expect(screen.getByText('Crisp edges.')).toBeInTheDocument();
	});

	test('lists tags as comma-separated links, not pills', () => {
		render(RecipeHeader, {
			props: {
				recipe: makeRecipe(),
				currentVersion: VERSION,
				isViewingHistory: false,
				tags: [
					{ id: 1, name: 'Dessert', slug: 'dessert' },
					{ id: 2, name: 'Baking', slug: 'baking' }
				]
			}
		});
		const dessert = screen.getByRole('link', { name: 'Dessert' });
		expect(dessert).toHaveAttribute('href', '/tags/dessert');
		expect(dessert).not.toHaveClass('tag');
		expect(dessert.parentElement).toHaveTextContent('Dessert, Baking');
	});

	test('shows the photo when the version has one', () => {
		renderHeader(makeRecipe(), { ...VERSION, imageUrl: 'https://img/cookies.jpg' });
		expect(screen.getByRole('img', { name: 'Old Title' })).toHaveAttribute(
			'src',
			'https://img/cookies.jpg'
		);
	});

	test('renders no image and no placeholder without a photo', () => {
		const { container } = render(RecipeHeader, {
			props: { recipe: makeRecipe(), currentVersion: VERSION, isViewingHistory: false, tags: [] }
		});
		expect(screen.queryByRole('img')).toBeNull();
		expect(container.querySelector('.recipe-photo')).toBeNull();
	});

	test('links the author once in the author line', () => {
		renderHeader(makeRecipe({ author: { id: 'u1', username: 'chef' } }), VERSION);
		expect(screen.getAllByRole('link', { name: '@chef' })).toHaveLength(1);
	});
});
```

Keep the six existing tests (fork attribution, title, Serves) as they are; "Serves 4" moves to the meta line and still renders as that text.

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run "src/routes/recipes/[slug]/components/RecipeHeader.svelte.test.ts"` Expected: FAIL on the six new tests (no chip class, no description, tags carry `.tag`, no image, no author line); the six old ones pass.

- [ ] **Step 3: Rewrite the component**

Replace the espresso markup with the structure in Interfaces, using Global Constraints for sizes. Markup notes: the title row is `flex flex-wrap items-baseline gap-4`; the chip is a `<span class="bg-marigold text-text rounded-sm px-2.5 py-0.5 font-mono text-[1.0625rem] font-semibold">`; the meta line is one `<p>` whose parts are separated by `<span class="text-text-3">·</span>`, tags rendered as `<a href="/tags/{slug}" class="text-text-2 hover:text-text">` joined by `, `; the history banner becomes a paper strip (`bg-tint`, ink text, mono, `rounded-md`); fork attribution is Source Sans 14px ink-3 with the parent link in clay (no italic, no serif). The photo is `<figure class="recipe-photo m-0"><img … class="h-[420px] w-full rounded-lg object-cover"></figure>`. Scoped CSS: `.recipe-header` padding `34px 20px 0`, max-width 1200 centred, `display: flex; flex-direction: column; gap: 12px`; under 861px padding `16px 18px 0`, the photo gets `order` so it follows the title row (give the author line order 1, title row 2, photo 3, attribution 4, description 5, meta 6; desktop photo order 7), `margin: 0 -18px`, `width: calc(100% + 36px)`, `height: auto`, `aspect-ratio: 2 / 1`, `border-radius: 0`.

- [ ] **Step 4: Run the component tests**

Run: `pnpm vitest run "src/routes/recipes/[slug]/components/RecipeHeader.svelte.test.ts"` Expected: PASS, 12 tests.

- [ ] **Step 5: Type check and commit**

Run: `pnpm check` Expected: 0 errors (the page imports `RecipeHeader` and passes `currentVersion` unchanged; it already carries description and imageUrl).

```bash
git add -A "src/routes/recipes/[slug]/components/" "src/routes/recipes/[slug]/+page.svelte"
git commit -m "Recipe header on paper: author line, clay title, marigold chip, comma tags, capped photo"
```

---

### Task 3: Collapsed version strip

**Files:**

- Modify: `src/lib/components/recipes/VersionStrip.svelte`
- Test: `src/lib/components/recipes/VersionStrip.svelte.test.ts`

**Interfaces:**

- Consumes: the same props as today (`versions`, `currentVersionNumber`, `recipeSlug`, `isViewingHistory`).
- Produces: `<nav class="version-strip">` with, in order: the current chip (`.version-current`), the message (`.version-message`), the "Compare with v{n-1}" link (`.version-compare`, `href="/recipes/{slug}/diff?from={n-1}&to={n}"`), and a `<button type="button" class="version-toggle" aria-expanded={open} aria-controls="version-history">` reading "N versions". When open, `<div id="version-history" class="version-history">` lists every version as `.version-entry` rows (`a.version-number` with `aria-current` on the current one, `.version-message`, `.version-compare` for n > 1). With one version, `<span class="version-count">1 version</span>` replaces the button.

- [ ] **Step 1: Rewrite the tests**

Replace the file's four tests with:

```ts
test('shows the current version and its message without expanding', () => {
	render(VersionStrip, { props });
	expect(screen.getByText('v2')).toHaveClass('version-current');
	expect(screen.getByText('Added espresso powder')).toBeInTheDocument();
	expect(screen.queryByText('Initial recipe')).toBeNull();
});

test('offers a compare with the previous version', () => {
	render(VersionStrip, { props });
	expect(screen.getByRole('link', { name: 'Compare with v1' })).toHaveAttribute(
		'href',
		'/recipes/classic-cookies-abc123/diff?from=1&to=2'
	);
});

test('expands to every version with its own links', async () => {
	render(VersionStrip, { props });
	await fireEvent.click(screen.getByRole('button', { name: '2 versions' }));
	expect(screen.getByRole('link', { name: 'v1' })).toHaveAttribute(
		'href',
		'/recipes/classic-cookies-abc123?version=1'
	);
	expect(screen.getByText('Initial recipe')).toBeInTheDocument();
	expect(screen.getByRole('link', { name: 'v2' })).toHaveAttribute('aria-current', 'true');
});

test('a single version has nothing to expand and nothing to compare', () => {
	render(VersionStrip, {
		props: { ...props, versions: [makeVersion(1, 'Initial recipe')], currentVersionNumber: 1 }
	});
	expect(screen.getByText('1 version')).toBeInTheDocument();
	expect(screen.queryByRole('button')).toBeNull();
	expect(screen.queryByRole('link', { name: /compare/i })).toBeNull();
});

test('hides compare links while viewing history', () => {
	render(VersionStrip, { props: { ...props, isViewingHistory: true, currentVersionNumber: 1 } });
	expect(screen.getByText('v1')).toHaveClass('version-current');
	expect(screen.queryByRole('link', { name: /compare/i })).toBeNull();
});
```

Import `fireEvent` from `@testing-library/svelte`. The list renders only while open (`{#if open}`), which is why the first test finds no "Initial recipe".

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run src/lib/components/recipes/VersionStrip.svelte.test.ts` Expected: FAIL, five tests (no `.version-current`, no "Compare with v1" name, no "2 versions" button).

- [ ] **Step 3: Rewrite the component**

`let open = $state(false)` flipped by the button's `onclick`; rows render inside `{#if open}`. Styles per Global Constraints: `.version-strip` is `display: flex; align-items: center; gap: 14px; padding: 10px 20px; max-width 1200 centred; border-top/bottom 1px dotted var(--color-input-border); font: mono 0.75rem; white-space: nowrap`; `.version-message` has `flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis`; `.version-current` is the chip (ink on marigold, 3px radius, `padding: 0 5px`, weight 600); links are ink-3 underlined, hover ink; the history panel is `position: absolute` under the strip on a `--color-surface` panel with a `--color-border` edge and card shadow, so expanding never pushes the recipe down (the reason the old strip scrolled). Keep `.version-entry` on the expanded rows.

- [ ] **Step 4: Run the tests**

Run: `pnpm vitest run src/lib/components/recipes/VersionStrip.svelte.test.ts` Expected: PASS, 5.

- [ ] **Step 5: Update the two e2e tests that read the old strip**

In `e2e/recipe.test.ts`: "shows version history with 3 versions" clicks `page.getByRole('button', { name: '3 versions' })` before counting `.version-entry` rows and checking "Initial recipe"; its `getByRole('link', { name: /^v3$/ })` assertion becomes `expect(page.locator('.version-current')).toHaveText('v3')`. "Compare link on v2 navigates to diff page" keeps its href locator (the collapsed strip has one). Do not run e2e yet; Task 6 runs the suite once.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/recipes/VersionStrip.svelte src/lib/components/recipes/VersionStrip.svelte.test.ts e2e/recipe.test.ts
git commit -m "Version strip: current version, compare with previous, versions behind a disclosure"
```

---

### Task 4: Ingredients and method

**Files:**

- Modify: `src/app.css:1-8` (italic import)
- Modify: `src/routes/recipes/[slug]/components/RecipeIngredients.svelte`
- Modify: `src/routes/recipes/[slug]/components/RecipeMethod.svelte`
- Test: both components' `.svelte.test.ts`

**Interfaces:**

- Consumes: foundation tokens.
- Produces: unchanged props. Rows keep the `has-[:checked]` strike-through.

- [ ] **Step 1: Change the tests**

In `RecipeIngredients.svelte.test.ts`, the test "sets the weight apart as an accent" becomes "sets the weight apart in the muted tone" and asserts `toHaveClass('text-text-3')`. Add:

```ts
test('a check-off row shows the focus ring on the row, not the hidden box', () => {
	renderWith('1 cup flour', [null]);
	expect(rows()[0]).toHaveClass('has-[:focus-visible]:outline-2');
});
```

In `RecipeMethod.svelte.test.ts`, "numbers steps by position" asserts `getByText('1')` and `getByText('2')` (plain numerals). Add:

```ts
test('annotations keep their own tone', () => {
	render(RecipeMethod, {
		props: { steps: [{ text: 'Bake.', annotation: { type: 'warning', text: 'Hot.' } }] }
	});
	expect(screen.getByText('Hot.')).toHaveClass('text-remove');
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run "src/routes/recipes/[slug]/components/RecipeIngredients.svelte.test.ts" "src/routes/recipes/[slug]/components/RecipeMethod.svelte.test.ts"` Expected: FAIL on the three changed or new tests.

- [ ] **Step 3: Restyle both components**

Add `@import '@fontsource/source-sans-3/400-italic.css';` after the existing Source Sans imports in `app.css`. Ingredients: heading `h4.eyebrow-label mb-1`, rows `border-border border-b py-2 text-base` (last row keeps its rule, per the mock), quantity span `font-semibold` (the measured prefix before the name), grams `text-text-3 text-sm` instead of `text-sienna font-medium`, plus the focus classes from Global Constraints on the label. Method: heading `h4.eyebrow-label border-border mb-3.5 border-b pb-2`, list `flex flex-col gap-[18px]`, each row a `grid [grid-template-columns:30px_1fr] gap-[18px]` label with no border, numeral `font-serif text-[1.375rem] font-medium leading-[1.15] text-accent` showing `n` (drop `zeroPad`), text `text-[1.0625rem] leading-[1.6]`, annotation `text-[0.9375rem] italic` with the map `{ tip: 'text-text-3', warning: 'text-remove', substitution: 'text-text-2' }`.

- [ ] **Step 4: Run both test files**

Run: the Step 2 command. Expected: PASS, all.

- [ ] **Step 5: Commit**

```bash
git add src/app.css "src/routes/recipes/[slug]/components/RecipeIngredients.svelte" "src/routes/recipes/[slug]/components/RecipeIngredients.svelte.test.ts" "src/routes/recipes/[slug]/components/RecipeMethod.svelte" "src/routes/recipes/[slug]/components/RecipeMethod.svelte.test.ts"
git commit -m "Ingredients and method on the locked system: ink quantities, muted grams, plain clay numerals, no step rules"
```

---

### Task 5: Details and actions

**Files:**

- Modify: `src/routes/recipes/[slug]/components/Details.svelte`
- Modify: `src/routes/recipes/[slug]/components/RecipeActions.svelte`
- Test: both components' `.svelte.test.ts`

**Interfaces:**

- Produces: `Details` renders a bare `<dl class="details">` (no card, no "Details" heading; the heading was the old card's eyebrow). `RecipeActions` renders Fork as `.btn-primary`, Favorite and Edit as `.btn-ghost`, with the copy in Global Constraints.

- [ ] **Step 1: Change the tests**

`Details.svelte.test.ts`: keep both tests; add `expect(screen.queryByRole('heading')).toBeNull()` to the first. `RecipeActions.svelte.test.ts`: "reflects the initial favourite state" expects `getByRole('button', { name: 'Unfavorite' })` to have text "Favorited"; the rerender test expects `getByRole('button', { name: 'Favorite' })` to have text "Favorite".

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run "src/routes/recipes/[slug]/components/Details.svelte.test.ts" "src/routes/recipes/[slug]/components/RecipeActions.svelte.test.ts"` Expected: FAIL on the heading assertion and both button names.

- [ ] **Step 3: Restyle both components**

Details: drop the card wrapper and the `h4`; `dl` is `m-0 flex flex-col`, each row `flex items-baseline justify-between border-border border-t py-[7px]` (last row also `border-b`), `dt` is `text-text-3 text-[0.625rem] font-semibold tracking-[0.08em] uppercase`, `dd` is `m-0 font-sans text-base font-semibold`. Actions: the root `<div>` gets `class="actions flex flex-col gap-2"` (the page's mobile CSS targets `.actions`); the favourite button and the Edit link take `class="btn-ghost w-full"` plus the flex centring they have (drop the pill, accent and `border-[1.5px]` classes); the heart keeps `fill-accent` when favourited; copy per Global Constraints. The fork dialog is unchanged.

- [ ] **Step 4: Run the tests**

Run: the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/routes/recipes/[slug]/components/Details.svelte" "src/routes/recipes/[slug]/components/Details.svelte.test.ts" "src/routes/recipes/[slug]/components/RecipeActions.svelte" "src/routes/recipes/[slug]/components/RecipeActions.svelte.test.ts"
git commit -m "Recipe sidebar: bare details rows, marigold Fork, ink-outline Favorite and Edit"
```

---

### Task 6: Page layout and the e2e suite

**Files:**

- Modify: `src/routes/recipes/[slug]/+page.svelte`
- Modify: `e2e/recipe.test.ts` (the tests named below)

**Interfaces:**

- Consumes: `data.forkCount` (Task 1), `RecipeHeader` (Task 2), the strip (Task 3), the restyled components (Tasks 4 and 5).

- [ ] **Step 1: Rewrite the e2e assertions that encode the old layout**

In `e2e/recipe.test.ts`:

- "on mobile, ingredients render above the details box" becomes "on mobile, the actions and details sit above the ingredients": locate details by `page.locator('dl.details').first()` (the heading is gone) and assert `detailsBox.y < ingredientsBox.y`.
- "on desktop, the sidebar sits beside the recipe" and "layout survives a recipe with no photo": same `dl.details` locator; the x and y assertions stay.
- "on mobile, the photo leads above the recipe": the locator stays `.recipe-photo img`; the assertion stays.
- "the hero names the recipe once and the author once": rename "the header names…", locator `page.locator('header.recipe-header')`.
- "tags stay readable on both the card and the hero surfaces": the header part reads `page.locator('header.recipe-header a[href^="/tags/"]').first()` and keeps the 4.5:1 assertion.
- "the hero demotes metadata and keeps one accent element" becomes "the header has one marigold fill, the version chip, and no marigold text": `filled` expected `1`, `coloredText` expected `0`; the time-background assertion stays.
- "the version strip scrolls without widening the page" is unchanged.

- [ ] **Step 2: Rewrite the page**

DOM order inside `<article>`: `<RecipeHeader>`, `<VersionStrip>`, then `<div class="content-layout">` holding `<aside>` first and `<div class="main">` second. The aside holds `<div class="sidebar-sticky">` with `<Details content={currentVersion} />`, `<RecipeActions …>`, and `<p class="recipe-counts">{allVersions.length} version(s){#if data.forkCount > 0} · {data.forkCount} fork(s){/if}</p>` (mono 12px ink-3; pluralise both). Scoped CSS: `.content-layout` grid `grid-template-columns: minmax(0, 1fr) 320px; column-gap: 56px; padding: 30px 20px 40px; max-width 1200 centred; align-items: start`; `.main { grid-column: 1; grid-row: 1 }`, `aside { grid-column: 2; grid-row: 1 }`; `.sidebar-sticky { position: sticky; top: 76px; display: flex; flex-direction: column; gap: 22px }`. Under 861px: one column, `padding: 16px 18px 32px`, aside and main both `grid-column: 1` with `grid-row: auto`, the sticky becomes static with `gap: 12px`; the actions' flex column becomes a row (`:global(.actions)` on the RecipeActions root, Fork `flex: 1`); the details `dl` becomes a three-column row (`:global(dl.details)` `flex-direction: row`, each row `flex: 1; flex-direction: column; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border)`). Pass nothing new to the header; drop the photo block from the aside (the header owns it now).

- [ ] **Step 3: Unit and type check**

Run: `pnpm check && pnpm test:unit run` Expected: 0 errors; every test passes.

- [ ] **Step 4: E2e**

Run: `pnpm test:e2e` Expected: PASS, 57. If a layout assertion fails, the geometry is wrong, not the test: fix the CSS.

- [ ] **Step 5: Commit**

```bash
git add "src/routes/recipes/[slug]/+page.svelte" e2e/recipe.test.ts
git commit -m "Recipe page: paper layout, sticky sidebar first in the DOM, mobile stack from the mock"
```

---

### Task 7: Look at it and record

**Files:**

- Modify: `docs/research/2026-10-26-ui-design-directions.md` (one paragraph after the Round 5 notes)

- [ ] **Step 1: Screenshots**

Run the dev server and screenshot the cookies recipe at 1200 and 390 wide, the fork (for the attribution line), and the recipe viewed at `?version=1`. Compare against the two canvas boards. Expected: the header, strip, columns and mobile stack match the boards; Tab reaches the Fork button, the Favorite button, the versions toggle and a check-off row with a visible ring.

- [ ] **Step 2: Record the rulings**

One paragraph: no placeholder panel on the page without a photo (title already the headline); the version history opens as a toggle panel rather than a page, since no history page exists; fork count is public forks only; the DOM puts the sidebar before the recipe at every width so the mobile order needs no `order` tricks.

```bash
git add docs/research/2026-10-26-ui-design-directions.md
git commit -m "Design directions: recipe page rulings"
```
