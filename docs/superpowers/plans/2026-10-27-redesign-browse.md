# Redesign Card and Browse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the recipe card to the locked system everywhere it appears, and give the browse page its sections and tag tabs from the mock.

**Architecture:** `RecipeCard` keeps its props and its outer `.recipe-card` wrapper (e2e selectors depend on it) and loses its chrome, description, tag pills and "Forked" badge; the no-photo state becomes the clay panel with the title inside. A pure helper groups a recipe list into the browse sections so the page stays markup. A small `TagTabs` component renders the filter row on the browse and tag pages, linking to the existing tag pages rather than adding filtering logic.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Tailwind 4 on the foundation tokens, Vitest, Playwright.

**Spec:** `docs/research/2026-10-26-ui-design-directions.md`, "Round 4", "Round 5" and the review notes; the canvas at https://claude.ai/artifact/QFTDpwCLRwuknh754yNPzc, boards "Browse" and "Browse — 390px". Tokens: the foundation plan's Global Constraints.

## Global Constraints

- Branch `redesign`; every task commits there. No Co-Authored-By lines. Tests before markup.
- Card: no surface, border or shadow; the photo is `aspect-ratio: 4 / 3`, `object-fit: cover`, 6px radius; title Bitter 500 `1.0625rem` line-height 1.25 in ink, clay on hover; meta line Source Sans `0.8125rem` ink-3 with `·` separators: `@author`, total time, `v{n}` (mono `0.6875rem` 600 clay), `{n} fork(s)` when > 0. No description, no tag pills, no "Forked" badge (the fork count and the recipe page's attribution carry that).
- No photo: a `--color-tint` panel at the same aspect and radius, padding 16px, the title inside it in Bitter 500 `1.0625rem` clay aligned to the bottom, and no title below. The meta line still follows.
- Under 700px the author is hidden on cards (`.meta-author` gets `display: none`).
- Browse page (`/recipes`, signed out): `h1` "Recipes" with the tag tabs on the same baseline, no subtitle; then sections, each an eyebrow heading with a bottom rule and a `.recipe-grid`: "Recent" (up to 8, newest `updatedAt` first), "Most forked" (up to 4 with `forkCount > 0`, most forks first; omitted when none has a fork), then "All recipes" with every recipe not already shown (omitted when empty). Signed in (`mine`): "My Recipes", no tabs, one grid, as today.
- Tag page: `h1` is the tag name, same tabs with that tag active, one grid, no subtitle.
- Tabs: `All` (`/recipes`) then every tag with at least one public recipe, alphabetical, each linking to `/tags/{slug}`; Source Sans `0.875rem` ink-2, the active one ink 600 with a 2px clay underline; the row is `overflow-x: auto; white-space: nowrap` with no scrollbar chrome.
- Grid breakpoints are the foundation's (2 / 3 / 4 at 700 and 1100). No new hex values.

## Review Focus

- A no-photo card with a long title: the title must stay inside the 4:3 panel. Task 1 sets `overflow: hidden` and a 4-line clamp on the panel title; Task 1 Step 1 asserts the panel and the absence of a second title.
- Browse with fewer than eight recipes, or none forked: "Recent" shows what exists, "Most forked" and "All recipes" disappear rather than render empty. Task 2 Step 1.
- A tag used only on private recipes must not appear as a tab. Task 3 Step 1 asserts the loaders call `visibleTags` with the public scope.
- Many tags on a phone: the tab row scrolls sideways on its own; the page does not. Task 4 Step 1 e2e.
- Keyboard: Tab reaches the card's stretched link (ring around the whole card, since it is `inset: 0`) and then the author link. Unchanged markup; Task 4 looks at it.

---

### Task 1: The card

**Files:**

- Modify: `src/lib/components/recipes/RecipeCard.svelte`
- Test: `src/lib/components/recipes/RecipeCard.svelte.test.ts`
- Modify: `e2e/search.test.ts:4-12`, `e2e/recipe.test.ts` (remove "the forked badge stays readable over an arbitrary photo")

**Interfaces:**

- Consumes: nothing from other tasks.
- Produces: the same `CardRecipe` props. Markup: `div.recipe-card` > `a.card-stretched-link`, then either `img.card-img` (photo) or `div.card-panel` holding `span.card-panel-title` (no photo), then `h3.card-title` (photo only) and `div.meta-row` with `.meta-item` spans, the author link carrying `.meta-author`.

- [ ] **Step 1: Change the tests**

Delete "shows 'Forked' badge when parentId is set", "omits the 'Forked' badge entirely when parentId is null", "shows description when present", "does not show description when absent", "renders up to 3 tags", "renders no tags when recipesToTags is absent". Add:

```ts
test('never shows a description, tags or a forked badge', () => {
	const recipe = {
		...makeRecipe({ description: 'A rich and moist cake.', parentId: 42 }),
		recipesToTags: [{ tag: { id: 1, name: 'Dessert', slug: 'dessert' } }]
	};
	const { container } = render(RecipeCard, { props: { recipe } });
	expect(screen.queryByText('A rich and moist cake.')).toBeNull();
	expect(screen.queryByRole('link', { name: 'Dessert' })).toBeNull();
	expect(container.querySelector('.forked-badge')).toBeNull();
});

test('a recipe with a photo shows it with the title below', () => {
	const { container } = render(RecipeCard, {
		props: { recipe: makeRecipe({ imageUrl: 'https://img/cake.jpg' }) }
	});
	expect(screen.getByRole('img', { name: 'Chocolate Cake' })).toHaveAttribute(
		'src',
		'https://img/cake.jpg'
	);
	expect(container.querySelector('h3.card-title')).toHaveTextContent('Chocolate Cake');
	expect(container.querySelector('.card-panel')).toBeNull();
});

test('a recipe without a photo shows its title inside the panel and nowhere else', () => {
	const { container } = render(RecipeCard, { props: { recipe: makeRecipe() } });
	expect(screen.queryByRole('img')).toBeNull();
	expect(container.querySelector('.card-panel .card-panel-title')).toHaveTextContent(
		'Chocolate Cake'
	);
	expect(container.querySelector('h3.card-title')).toBeNull();
	expect(screen.getAllByText('Chocolate Cake')).toHaveLength(1);
});

test('the author link is marked so the phone layout can hide it', () => {
	render(RecipeCard, {
		props: { recipe: { ...makeRecipe(), author: { id: 'u1', username: 'chefmaria' } } }
	});
	expect(screen.getByRole('link', { name: '@chefmaria' })).toHaveClass('meta-author');
});
```

The existing "renders the recipe title" test uses `getByText`; with the panel it still finds one element. "card links to the recipe slug", author, time, version and fork tests stay unchanged.

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run src/lib/components/recipes/RecipeCard.svelte.test.ts` Expected: FAIL on the four new tests (description renders, `/None.png` img renders, no `.card-panel`, no `.meta-author`).

- [ ] **Step 3: Rewrite the card**

Markup per Interfaces, values per Global Constraints. The photo and the panel are both the card's first visual block; the stretched link stays first in the DOM. Scoped CSS: drop `background`, `border`, `box-shadow`, `overflow: hidden` and the hover lift from `.recipe-card`; keep the hover title colour and the `scale(1.03)` on the image inside an `overflow: hidden` rounded wrapper; `.card-panel` is `aspect-ratio: 4 / 3; border-radius: var(--radius-md); background: var(--color-tint); padding: 16px; display: flex; align-items: flex-end; overflow: hidden`; `.card-panel-title` gets the 4-line clamp; `.meta-item` and `.meta-sep` become Source Sans `0.8125rem` ink-3, `.meta-item--accent` becomes mono `0.6875rem` 600 clay; `@media (max-width: 699px) { .meta-author { display: none } }` (and the separator after it: render the author's following separator inside the same element, or give the separator the class too). Remove the `forked-badge` CSS, the description CSS and the `/None.png` fallback.

- [ ] **Step 4: Run the card tests**

Run: `pnpm vitest run src/lib/components/recipes/RecipeCard.svelte.test.ts` Expected: PASS, all.

- [ ] **Step 5: Update the two e2e tests that read the old card**

`e2e/search.test.ts`: rename the first test "cards carry the author, like the feed" and delete its `.tag` count assertion. `e2e/recipe.test.ts`: delete "the forked badge stays readable over an arbitrary photo". Do not run e2e yet.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/recipes/RecipeCard.svelte src/lib/components/recipes/RecipeCard.svelte.test.ts e2e/search.test.ts e2e/recipe.test.ts
git commit -m "Recipe card on the locked system: no chrome, 4:3 photo or clay panel, sans meta with a mono version"
```

---

### Task 2: Browse sections helper

**Files:**

- Create: `src/lib/recipes/browse.ts`
- Test: `src/lib/recipes/browse.test.ts`

**Interfaces:**

- Produces: `browseSections<T extends { id: number; updatedAt: Date | null; forkCount: number }>(recipes: T[]): { title: 'Recent' | 'Most forked' | 'All recipes'; recipes: T[] }[]`. Sections appear in that order, empty ones omitted. "Recent" is the first 8 by `updatedAt` descending (a null date sorts last). "Most forked" is up to 4 with `forkCount > 0`, by `forkCount` descending, ties by the Recent order. "All recipes" is every input recipe not in either, in Recent order.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, test, expect } from 'vitest';
import { browseSections } from './browse.js';

const r = (id: number, daysAgo: number, forkCount = 0) => ({
	id,
	updatedAt: new Date(Date.UTC(2026, 9, 27 - daysAgo)),
	forkCount
});

describe('browseSections', () => {
	test('a small unforked collection is one Recent section', () => {
		const sections = browseSections([r(1, 2), r(2, 0), r(3, 1)]);
		expect(sections.map((s) => s.title)).toEqual(['Recent']);
		expect(sections[0].recipes.map((x) => x.id)).toEqual([2, 3, 1]);
	});

	test('forked recipes get their own section, most forks first', () => {
		const sections = browseSections([r(1, 0, 1), r(2, 1, 4), r(3, 2)]);
		expect(sections[1].title).toBe('Most forked');
		expect(sections[1].recipes.map((x) => x.id)).toEqual([2, 1]);
	});

	test('Recent is capped at eight and the rest land in All recipes', () => {
		const many = Array.from({ length: 10 }, (_, i) => r(i + 1, i));
		const sections = browseSections(many);
		expect(sections.map((s) => s.title)).toEqual(['Recent', 'All recipes']);
		expect(sections[0].recipes).toHaveLength(8);
		expect(sections[1].recipes.map((x) => x.id)).toEqual([9, 10]);
	});

	test('Most forked is capped at four', () => {
		const forked = Array.from({ length: 5 }, (_, i) => r(i + 1, i, 5 - i));
		expect(browseSections(forked)[1].recipes).toHaveLength(4);
	});

	test('an empty list gives no sections', () => {
		expect(browseSections([])).toEqual([]);
	});
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run src/lib/recipes/browse.test.ts` Expected: FAIL, module not found.

- [ ] **Step 3: Implement `browseSections` in `src/lib/recipes/browse.ts`**

Sort a copy by `updatedAt` descending with nulls last; slice 8 for Recent; filter and sort for Most forked; the remainder by id membership. Export the `RECENT_LIMIT = 8` and `FORKED_LIMIT = 4` constants beside it.

- [ ] **Step 4: Run the tests**

Run: `pnpm vitest run src/lib/recipes/browse.test.ts` Expected: PASS, 5.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recipes/browse.ts src/lib/recipes/browse.test.ts
git commit -m "Browse sections: Recent, Most forked, All recipes"
```

---

### Task 3: Tag tabs, loaders and the two pages

**Files:**

- Create: `src/lib/components/ui/TagTabs.svelte`, `src/lib/components/ui/TagTabs.svelte.test.ts`
- Modify: `src/routes/recipes/+page.server.ts`, `src/routes/recipes/page.server.test.ts`
- Modify: `src/routes/tags/[slug]/+page.server.ts`, and its test file if one exists (check `ls src/routes/tags/[slug]/`); if none, create `src/routes/tags/[slug]/page.server.test.ts` with one test following the `/recipes` test's mocking pattern
- Modify: `src/routes/recipes/+page.svelte`, `src/routes/tags/[slug]/+page.svelte`

**Interfaces:**

- Consumes: `browseSections` from Task 2; `visibleTags(scope)` and `TagChip` from `src/lib/server/tagFilter.ts`.
- Produces: `TagTabs` with props `tags: TagChip[]` and `active: string | null` (the active tag slug, `null` meaning All); renders `<nav class="tag-tabs" aria-label="Browse by tag">` with `<a>` links, the active one carrying `aria-current="page"`. Loaders return `tags: TagChip[]` (browse: only when not `mine`, else `[]`).

- [ ] **Step 1: Write the failing tests**

`TagTabs.svelte.test.ts`:

```ts
const tags = [
	{ id: 1, name: 'Baking', slug: 'baking' },
	{ id: 2, name: 'Dessert', slug: 'dessert' }
];

test('links All to the browse page and each tag to its page', () => {
	render(TagTabs, { props: { tags, active: null } });
	expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/recipes');
	expect(screen.getByRole('link', { name: 'Dessert' })).toHaveAttribute('href', '/tags/dessert');
});

test('marks the active tab for assistive tech', () => {
	render(TagTabs, { props: { tags, active: 'dessert' } });
	expect(screen.getByRole('link', { name: 'Dessert' })).toHaveAttribute('aria-current', 'page');
	expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current');
});

test('All is current when no tag is active', () => {
	render(TagTabs, { props: { tags, active: null } });
	expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page');
});
```

`src/routes/recipes/page.server.test.ts`: add `visibleTags` to the hoisted mocks (`vi.mock('#lib/server/tagFilter.js', () => ({ visibleTags: visibleTagsMock }))`, resolving `[{ id: 1, name: 'Dessert', slug: 'dessert' }]`), then:

```ts
test('a guest gets the tags with public recipes, for the tabs', async () => {
	const result = await load(event(null));
	expect(visibleTagsMock.mock.calls[0][0]).toEqual(eq(recipes.isPublic, true));
	expect(result.tags).toEqual([{ id: 1, name: 'Dessert', slug: 'dessert' }]);
});

test('a signed-in user browsing their own recipes gets no tabs', async () => {
	const result = await load(event({ id: 'u1' }));
	expect(visibleTagsMock).not.toHaveBeenCalled();
	expect(result.tags).toEqual([]);
});
```

Tag page loader test: one test, "returns the public tags for the tabs", mocking `db.query.tags.findFirst` to a tag, `db.query.recipes.findMany` to `[]`, `select` to `chain([])`, and `visibleTags` as above; assert `result.tags` equals the mock's value and `visibleTagsMock.mock.calls[0][0]` equals `eq(recipes.isPublic, true)`.

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run src/lib/components/ui/TagTabs.svelte.test.ts src/routes/recipes/page.server.test.ts "src/routes/tags/[slug]/page.server.test.ts"` Expected: FAIL: component missing; `result.tags` undefined.

- [ ] **Step 3: Build the component and extend the loaders**

`TagTabs`: a flex row (`gap: 16px`), link styles per Global Constraints, `aria-current="page"` on the active link; `overflow-x: auto; white-space: nowrap; scrollbar-width: none` and `::-webkit-scrollbar { display: none }`. Browse loader: `tags: user ? [] : await visibleTags(eq(recipes.isPublic, true))`, run with `Promise.all` beside the recipes query. Tag loader: `tags: await visibleTags(eq(recipes.isPublic, true))` likewise.

- [ ] **Step 4: Run the tests**

Run: the Step 2 command. Expected: PASS.

- [ ] **Step 5: Rewrite the two pages**

`/recipes`: header `div.browse-header` (`display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 20px`) with the `h1` and, when `!data.mine`, `<TagTabs tags={data.tags} active={null} />`; no subtitle. Body: when `data.mine`, the single grid and the empty states as today; otherwise `{#each browseSections(data.recipes) as section (section.title)}` rendering `<section>` with `<h2 class="eyebrow-label section-heading">{section.title}</h2>` (eyebrow plus `border-bottom: 1px solid var(--color-border); padding-bottom: 8px; margin-bottom: 14px`) and the grid; keep the "No public recipes yet." empty state. Sections are 34px apart. `/tags/[slug]`: same header with `<TagTabs tags={data.tags} active={data.tag.slug} />`, one grid, no subtitle. `browseSections` is imported into the page from `#lib/recipes/browse.js`.

- [ ] **Step 6: Type check and unit suite**

Run: `pnpm check && pnpm test:unit run` Expected: 0 errors, all pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/ui/TagTabs.svelte src/lib/components/ui/TagTabs.svelte.test.ts src/routes/recipes/ "src/routes/tags/[slug]/"
git commit -m "Browse: tag tabs, Recent and Most forked sections; tag page shares the tabs"
```

---

### Task 4: E2e, look, record

**Files:**

- Modify: `e2e/tags.test.ts` (append two tests)
- Modify: `docs/research/2026-10-26-ui-design-directions.md`

- [ ] **Step 1: Write the two e2e tests**

Append to `e2e/tags.test.ts`:

```ts
test('the browse page offers tag tabs that lead to the tag page', async ({ page }) => {
	await page.goto('/recipes');
	await expect(page.getByRole('heading', { name: 'Recent' })).toBeVisible();
	const tabs = page.getByRole('navigation', { name: 'Browse by tag' });
	await expect(tabs.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page');
	await tabs.getByRole('link', { name: 'Dessert' }).click();
	await expect(page).toHaveURL(/\/tags\/dessert/);
	await expect(
		page.getByRole('navigation', { name: 'Browse by tag' }).getByRole('link', { name: 'Dessert' })
	).toHaveAttribute('aria-current', 'page');
});

test('the tab row scrolls on a phone without widening the page', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 900 });
	await page.goto('/recipes');
	await page.getByRole('navigation', { name: 'Browse by tag' }).waitFor();
	const doc = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
});
```

- [ ] **Step 2: Run the whole e2e suite**

Run: `pnpm test:e2e` Expected: PASS (58: 59 minus the removed badge test plus these two... count whatever the runner reports, with 0 failed). A failing geometry test is a CSS bug, not a test bug.

- [ ] **Step 3: Look at it**

Dev server, screenshots of `/recipes` and `/tags/dessert` at 1200 and 390, and `/` signed out for the feed cards. Compare against the two Browse boards. Expected: cards without chrome, 4:3 photos, the panel card with its title inside, sans meta with a clay version number, tabs on the title's baseline, "Recent" eyebrow with its rule; at 390 two columns, no author on cards, tabs scrolling.

- [ ] **Step 4: Record the rulings**

One paragraph after the recipe-page paragraph in the design doc: cards drop the description, tag pills and the "Forked" badge (fork count and the recipe page carry lineage); tabs link to the existing tag pages rather than filtering in place; the browse sections are Recent (8), Most forked (4, only with forks) and All recipes (the rest), each omitted when empty; a signed-in user's own list keeps one grid and no tabs.

```bash
git add e2e/tags.test.ts docs/research/2026-10-26-ui-design-directions.md
git commit -m "Browse e2e for tabs and the phone tab row; design directions rulings"
```
