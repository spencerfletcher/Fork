# UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the interface visual hierarchy, fix four correctness defects, and promote version control from sidebar metadata to a first-class element — without changing the palette or typefaces.

**Architecture:** Three groups, built in this order. Correctness first (no design judgement required, and it stops the visual work being evaluated against a broken site), then the accent hierarchy, then the logged-out landing page and version promotion. The homepage branches on `locals.user`: logged out gets a landing page, logged in gets today's feed unchanged.

**Tech Stack:** SvelteKit 2 (Svelte 5 runes), TypeScript strict, Drizzle ORM over PostgreSQL, Tailwind CSS v4 with CSS custom properties, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-13-ui-refresh-design.md`

## Global Constraints

- TypeScript strict. No `any`. Prefer `const`.
- Schema **and data** changes go through a migration file in `supabase/migrations/`. Never run `drizzle-kit push` against production — `drizzle.config.ts` loads `.env.local` with `override: true` and silently targets localhost.
- Tests before implementation: server logic, then component, then e2e.
- Unit test files sit next to their source: `Foo.svelte` → `Foo.svelte.test.ts`, `+page.server.ts` → `page.server.test.ts`.
- Use `vi.hoisted()` for any mock function referenced inside a `vi.mock()` factory.
- `RecipeCard.svelte.test.ts` asserts on the `.forked-badge` and `.forked-badge--hidden` class names. They must survive every restyle in this plan.
- Before every commit, all three CI gates must pass: `pnpm test:unit run`, `pnpm check`, and `pnpm lint`. CI runs all three as blocking jobs, and `pnpm test:unit` does **not** type-check — a task that only runs the unit suite can ship a red build.
- Run `pnpm exec prettier --write <files>` before committing; CI fails on formatting.
- Amber (`--color-accent`) means **action or version identity**. Nothing else may use it.
- **Visual tasks assert absolutes, not just relative positions.** "A above B" holds true in many broken layouts. Any task that changes layout or colour must also assert that the page fits its viewport (`scrollWidth <= clientWidth`) at 390px, and that colour changes leave text readable. Six regressions in Task 1 passed every relative-position test that existed at the time.
- Run e2e by file, never by `-g` name filter. Test names change during implementation, and a stale filter matches nothing and passes vacuously.

---

### Task 1: Mobile reading order on the recipe page

On a phone the sidebar renders above the recipe, so a reader scrolls past the photo, a Details box and the version history before reaching the ingredients. The `order: -1` is deliberate — the photo _should_ come first — so only the photo may keep it.

**Files:**

- Modify: `src/routes/recipes/[slug]/+page.svelte` (layout markup and the `@media (max-width: 860px)` block near line 80)
- Test: `e2e/recipe.test.ts`

**Interfaces:**

- Consumes: nothing
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Write the failing test**

Add to `e2e/recipe.test.ts` inside the `Recipe detail page` describe block:

```ts
test('on mobile, ingredients come before the details box', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 900 });
	await page.goto('/recipes/classic-chocolate-chip-cookies-0bNW21');

	// Compare document order of the two section headings.
	const order = await page.evaluate(() => {
		const headings = Array.from(document.querySelectorAll('h4, h3'));
		const text = headings.map((h) => h.textContent?.trim().toLowerCase() ?? '');
		return {
			ingredients: text.findIndex((t) => t.includes('ingredients')),
			details: text.findIndex((t) => t.includes('details'))
		};
	});

	expect(order.ingredients).toBeGreaterThanOrEqual(0);
	expect(order.details).toBeGreaterThanOrEqual(0);
	expect(order.ingredients).toBeLessThan(order.details);
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `pnpm exec playwright test --project=chromium -g "ingredients come before"`
Expected: FAIL — `ingredients` index is greater than `details`.

Note: Playwright's `webServer` builds and serves automatically. If a preview server is already running on 4173 it is reused.

- [ ] **Step 3: Hoist the photo out of the aside**

In `src/routes/recipes/[slug]/+page.svelte`, the photo currently lives at the top of `<aside>`. Move that `{#if recipe.imageUrl}` block out of `<aside>` so it is a direct grid child, and give it a class:

```svelte
{#if recipe.imageUrl}
	<div class="recipe-photo">
		<img
			src={recipe.imageUrl}
			alt={recipe.title}
			class="border-border-2 [aspect-ratio:4/3] w-full rounded-lg border object-cover"
		/>
	</div>
{/if}
```

Place it immediately before the main content column. On desktop it must not occupy a column of its own, so it is assigned to the sidebar column explicitly in CSS below.

- [ ] **Step 4: Update the layout CSS**

Replace the `@media (max-width: 860px)` block:

```css
.recipe-photo {
	grid-column: 2;
	grid-row: 1;
}

@media (max-width: 860px) {
	.content-layout {
		grid-template-columns: 1fr;
		padding: var(--space-5);
	}

	/* The photo leads on mobile; Details and Version History follow the recipe. */
	.recipe-photo {
		grid-column: 1;
		grid-row: auto;
		order: -1;
	}

	.content-layout aside {
		order: 1;
	}
}
```

- [ ] **Step 5: Run the test and confirm it passes**

Run: `pnpm exec playwright test --project=chromium -g "ingredients come before"`
Expected: PASS

- [ ] **Step 6: Verify the desktop layout did not regress**

Run: `pnpm exec playwright test --project=chromium e2e/recipe.test.ts`
Expected: all pass. Then check visually at 1440px that the photo still sits top-right in the sidebar column, not full width.

- [ ] **Step 7: Commit**

```bash
pnpm exec prettier --write "src/routes/recipes/[slug]/+page.svelte" e2e/recipe.test.ts
git add "src/routes/recipes/[slug]/+page.svelte" e2e/recipe.test.ts
git commit -m "Put the recipe before the sidebar on mobile

The aside carried order:-1 below 860px so the photo would lead, but
Details and Version History came with it — a phone reader scrolled past
three boxes to reach the ingredients. Only the photo leads now."
```

---

### Task 2: Search card parity

`search/+page.server.ts` builds results with `db.select().from(recipes)`, which loads no relations, while the homepage uses `db.query.recipes.findMany` with `author` and `recipesToTags`. The same `RecipeCard` therefore renders without author or tags on search, which reads as broken.

**Files:**

- Modify: `src/routes/search/+page.server.ts`
- Test: `src/routes/search/page.server.test.ts` (create)

**Interfaces:**

- Consumes: nothing
- Produces: the `load` function returns `recipes` as `RecipeWithRelations[]` — objects carrying `author` and `recipesToTags` exactly as the homepage loader does. Task 8 extends this same shape.

- [ ] **Step 1: Write the failing test**

Create `src/routes/search/page.server.test.ts`:

```ts
import { vi, describe, test, expect, beforeEach } from 'vitest';

const { selectMock, findManyMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	findManyMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		query: { recipes: { findMany: findManyMock } }
	}
}));

import { load } from './+page.server';

/** Drizzle-compatible chainable mock. */
function chain(resolved: unknown = []) {
	const p = Promise.resolve(resolved);
	const c: Record<string, unknown> = {
		then: p.then.bind(p),
		catch: p.catch.bind(p),
		finally: p.finally.bind(p)
	};
	for (const m of ['from', 'where', 'orderBy', 'innerJoin', 'leftJoin', 'groupBy', 'limit']) {
		c[m] = vi.fn().mockReturnValue(c);
	}
	return c;
}

function makeEvent(query = '') {
	return {
		url: new URL(`http://localhost/search?q=${encodeURIComponent(query)}`),
		locals: { user: null }
	} as unknown as Parameters<typeof load>[0];
}

describe('search load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('returns recipes carrying author and tag relations', async () => {
		selectMock.mockReturnValue(chain([{ id: 2 }, { id: 1 }]));
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'One', author: { id: 'u1', username: 'a' }, recipesToTags: [] },
			{ id: 2, title: 'Two', author: { id: 'u1', username: 'a' }, recipesToTags: [] }
		]);

		const result = await load(makeEvent('cookie'));

		expect(result.recipes.length).toBe(2);
		for (const r of result.recipes) {
			expect(r).toHaveProperty('author');
			expect(r).toHaveProperty('recipesToTags');
		}
	});

	test('preserves ranked order, not database order', async () => {
		// Ranking puts 2 before 1; findMany returns them the other way round.
		selectMock.mockReturnValue(chain([{ id: 2 }, { id: 1 }]));
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'One', author: null, recipesToTags: [] },
			{ id: 2, title: 'Two', author: null, recipesToTags: [] }
		]);

		const result = await load(makeEvent('cookie'));

		expect(result.recipes.map((r) => r.id)).toEqual([2, 1]);
	});

	test('hydrates with a single relational query', async () => {
		selectMock.mockReturnValue(chain([{ id: 1 }]));
		findManyMock.mockResolvedValue([{ id: 1, author: null, recipesToTags: [] }]);

		await load(makeEvent('cookie'));

		expect(findManyMock).toHaveBeenCalledTimes(1);
	});
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `pnpm exec vitest run src/routes/search/page.server.test.ts`
Expected: FAIL — results have no `author` property, and `findMany` was never called.

- [ ] **Step 3: Add the hydration step**

In `src/routes/search/+page.server.ts`, after `results` is assembled and after the existing tag-match sort, replace the final return. Add `inArray` to the existing `drizzle-orm` import if not already present.

```ts
// ── Hydrate relations ─────────────────────────────────────────────────────
// The ranking above works on bare recipe rows. RecipeCard needs author and
// tags, so re-fetch the ranked ids with relations and restore the order —
// Postgres does not preserve inArray ordering.
const rankedIds = results.map((r) => r.id);

let hydrated: Awaited<ReturnType<typeof db.query.recipes.findMany>> = [];
if (rankedIds.length > 0) {
	const rows = await db.query.recipes.findMany({
		where: inArray(recipes.id, rankedIds),
		with: {
			recipesToTags: { with: { tag: true } },
			author: true
		}
	});
	const byId = new Map(rows.map((r) => [r.id, r]));
	hydrated = rankedIds.map((id) => byId.get(id)).filter((r) => r !== undefined);
}

return { recipes: hydrated, allTags, searchQuery, selectedTags: tagSlugs };
```

Delete the old `return { recipes: results, ... }` line at the end of the function. Leave the early short-circuit return (the one for "tags specified but nothing matched") as it is — it already returns an empty array.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `pnpm exec vitest run src/routes/search/page.server.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Verify against real data**

Run the app and load `/search?q=butter`. Both result cards must now show `@spencerfletcher` and their tag chips, matching the homepage.

- [ ] **Step 6: Commit**

```bash
pnpm exec prettier --write src/routes/search/
pnpm test:unit run
git add src/routes/search/
git commit -m "Load author and tags on search results

Search built results with db.select().from(recipes), which loads no
relations, while the homepage used db.query.recipes.findMany with
author and recipesToTags. The same RecipeCard rendered without an author
or tags on search. Re-fetch the ranked ids with relations and restore
rank order, which Postgres does not preserve across inArray."
```

---

### Task 3: Stop offering tags that match nothing

Seven of thirteen tags have zero recipes (`Easy`, `Italian`, `John`, `Pasta`, `Quick`, `Russian`, `Vegetarian`), so more than half the filter chips lead to an empty page. Fix both the data and the query, or it regresses the first time a recipe is deleted.

**Files:**

- Create: `supabase/migrations/<timestamp>_delete_orphan_tags.sql`
- Modify: `src/routes/search/+page.server.ts` (the `allTags` query near line 16)
- Test: `src/routes/search/page.server.test.ts` (extend from Task 2)

**Interfaces:**

- Consumes: the `load` signature from Task 2
- Produces: `allTags` contains only tags with at least one recipe

- [ ] **Step 1: Write the failing test**

Append to `src/routes/search/page.server.test.ts`. Extend the `vi.mock` factory so `db.select` can be asserted on — it is already mocked; only the assertion is new.

```ts
test('offers only tags that have at least one recipe', async () => {
	// The tag query is the first db.select call; it must join through
	// recipes_to_tags rather than selecting the whole table.
	selectMock.mockReturnValue(chain([{ id: 1, name: 'Dessert', slug: 'dessert' }]));
	findManyMock.mockResolvedValue([]);

	const result = await load(makeEvent(''));

	expect(result.allTags).toEqual([{ id: 1, name: 'Dessert', slug: 'dessert' }]);
	// A bare select().from(tags) takes no join; the fixed query must.
	const firstCall = selectMock.mock.results[0].value;
	expect(firstCall.innerJoin).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `pnpm exec vitest run src/routes/search/page.server.test.ts -t "at least one recipe"`
Expected: FAIL — `innerJoin` was never called.

- [ ] **Step 3: Scope the tag query**

In `src/routes/search/+page.server.ts`, replace the `allTags` query:

```ts
// ── Fetch tags up front — always needed for the filter UI ────────────────
// Only tags that actually match something; a filter chip that leads to an
// empty page is worse than no chip. Tags drop off this list on their own
// when their last recipe goes away.
const allTags = await db
	.selectDistinct({ id: tags.id, name: tags.name, slug: tags.slug })
	.from(tags)
	.innerJoin(recipesToTags, eq(recipesToTags.tagId, tags.id))
	.orderBy(tags.name);
```

`selectDistinct` is required — the join produces one row per tag/recipe pair.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `pnpm exec vitest run src/routes/search/page.server.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Write the data migration**

Get a timestamp with `date +%Y%m%d%H%M%S`, then create `supabase/migrations/<timestamp>_delete_orphan_tags.sql`:

```sql
-- Delete tags that no recipe uses.
--
-- Seven of thirteen tags matched nothing, so more than half the filter chips
-- led to an empty page. The search query now only offers tags that join to a
-- recipe, so this is cleanup of existing rows rather than a behaviour change.
--
-- Written as a general delete rather than a hard-coded list so it is correct
-- whatever the data looks like when it runs.

DELETE FROM public.tags t
WHERE NOT EXISTS (
	SELECT 1 FROM public.recipes_to_tags rt WHERE rt.tag_id = t.id
);
```

- [ ] **Step 6: Verify the migration on a scratch database, not production**

Apply the full chain to an empty database and confirm it succeeds. CI does this on every push via `supabase start`, so pushing is sufficient verification. Do not run this against production yet — that is Step 8.

- [ ] **Step 7: Commit**

```bash
pnpm exec prettier --write src/routes/search/
pnpm test:unit run
git add src/routes/search/ supabase/migrations/
git commit -m "Offer only tags that match a recipe

Seven of thirteen tags had no recipes, so most filter chips led to an
empty page. The query now joins through recipes_to_tags, and a migration
clears the existing orphans. Either fix alone regresses: the query
without the delete leaves dead rows, the delete without the query lets
them come back."
```

- [ ] **Step 8: Apply to production after CI is green**

```bash
psql "$PROD_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/<timestamp>_delete_orphan_tags.sql
```

Then record it in the ledger so `supabase migration list` stays consistent:

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('<timestamp>', 'delete_orphan_tags')
ON CONFLICT (version) DO NOTHING;
```

---

### Task 4: Fix the recipe hero metadata

The breadcrumb prints a de-suffixed slug (`classic-chocolate-chip-cookies`), which wraps to two lines at 390px, and `@author` appears twice in the same header.

**Files:**

- Modify: `src/routes/recipes/[slug]/components/RecipeHero.svelte` (breadcrumb near line 50, meta row near line 96)

**Interfaces:**

- Consumes: nothing
- Produces: nothing

- [ ] **Step 1: Replace the slug with the title**

In the breadcrumb, replace:

```svelte
<span class="text-accent">{recipe.slug.split('-').slice(0, -1).join('-')}</span>
```

with:

```svelte
<span class="text-accent">{recipe.title}</span>
```

- [ ] **Step 2: Remove the duplicated author from the meta row**

The badges row ends with a `·` separator followed by a second author link. Delete the separator `<span>` and the author `<a>` from that row — the breadcrumb above already names the author. Leave `Serves {recipe.servings}` in place.

- [ ] **Step 3: Verify**

Load a recipe at 1440px and at 390px. The breadcrumb reads `@spencerfletcher / Classic Chocolate Chip Cookies` on one line at desktop and wraps gracefully at mobile. The author appears exactly once.

- [ ] **Step 4: Run the full suite**

Run: `pnpm test:unit run && pnpm exec playwright test --project=chromium`
Expected: all pass. If an e2e test asserted on the slug breadcrumb, update it deliberately in this commit.

- [ ] **Step 5: Commit**

```bash
pnpm exec prettier --write "src/routes/recipes/[slug]/components/RecipeHero.svelte"
git add "src/routes/recipes/[slug]/components/RecipeHero.svelte"
git commit -m "Show the title in the breadcrumb, not the slug

The breadcrumb printed a de-suffixed slug that wrapped to two lines on a
phone, and the author was named twice in the same header."
```

---

### Task 5: Give tags their own quiet identity

`--color-tag` and `--color-accent` are both `#e8a83a`, so tags carry the same weight as the primary button by construction. Tags are also styled in three disagreeing places. Consolidate onto one class with a dark-surface variant — the hero sits on `--color-hero-bg` (`#1a1408`), so a single treatment cannot serve both.

**Files:**

- Modify: `src/app.css` (`@theme inline` near line 34, `:root` near line 117, `[data-theme='dark']` near line 182, `.tag` rules near line 382)
- Modify: `src/lib/components/TagFilter.svelte:44`
- Modify: `src/routes/recipes/[slug]/components/RecipeHero.svelte` (tags loop near line 80)
- Test: `src/lib/components/RecipeCard.svelte.test.ts` (verify unchanged)

**Interfaces:**

- Consumes: nothing
- Produces: `.tag` and `.tag--on-dark` global classes; `--color-tag`, `--color-tag-border`, `--color-tag-hover-bg` tokens. Task 8 reuses `.tag` unchanged.

- [ ] **Step 1: Replace the tag tokens**

In `src/app.css` `@theme inline`, replace the `--color-tag-pale` registration with two new ones:

```css
--color-tag: var(--color-tag);
--color-tag-border: var(--color-tag-border);
--color-tag-hover-bg: var(--color-tag-hover-bg);
```

In `:root`, replace the tag block:

```css
/* Tag system — quiet by default. Amber is reserved for actions and versions. */
--color-tag: #6b5a3a;
--color-tag-border: #ddd0b4;
--color-tag-hover-bg: #f3ead6;
```

In `[data-theme='dark']`, replace the two tag lines:

```css
--color-tag: #b8a880;
--color-tag-border: #4a3a20;
--color-tag-hover-bg: #3a2a08;
```

`--color-tag-pale` must not survive anywhere. A dangling custom property renders `transparent` silently.

- [ ] **Step 2: Restyle the `.tag` class and add the dark variant**

Replace the `.tag` and `a.tag:hover` rules:

```css
.tag {
	font-family: var(--font-sans);
	font-size: 0.75rem;
	font-weight: 500;
	color: var(--color-tag);
	background: transparent;
	border: 1px solid var(--color-tag-border);
	border-radius: var(--radius-pill);
	padding: 2px 9px; /* 1px less than before to absorb the new border */
	display: inline-block;
	transition:
		background 0.15s,
		border-color 0.15s;
}

a.tag:hover {
	background: var(--color-tag-hover-bg);
	border-color: var(--color-tag);
}

/* The recipe hero sits on --color-hero-bg; the light border disappears there. */
.tag--on-dark {
	color: var(--color-text-tan);
	border-color: rgb(255 255 255 / 0.22);
}

a.tag--on-dark:hover {
	background: rgb(255 255 255 / 0.08);
	border-color: rgb(255 255 255 / 0.4);
}
```

- [ ] **Step 3: Point TagFilter at the class**

In `src/lib/components/TagFilter.svelte:44`, the unselected branch duplicates the tag styling inline. Replace that branch's class string with:

```
'tag cursor-pointer hover:bg-tag-hover-bg'
```

Leave the selected branch as it is — a selected filter _is_ an active control, so amber is correct there.

- [ ] **Step 4: Point the hero tags at the class**

In `RecipeHero.svelte`, replace the tag anchor's class:

```svelte
<a href="/tags/{tag.slug}" class="tag tag--on-dark no-underline">
	{tag.name}
</a>
```

- [ ] **Step 5: Run the component tests**

Run: `pnpm exec vitest run src/lib/components/RecipeCard.svelte.test.ts`
Expected: PASS unchanged — `RecipeCard` uses `class="tag"` and the class name has not moved.

- [ ] **Step 6: Confirm no token references survive**

Run: `grep -rn "tag-pale" src/`
Expected: no output. If anything matches, fix it before committing.

- [ ] **Step 6b: Prove the tags are actually readable on both surfaces**

The component tests assert text content, not colour, and jsdom does not apply `app.css` — so a tag rendered dark-brown-on-near-black would pass every existing test. The hero sits on `--color-hero-bg` (`#1a1408`); a `.tag--on-dark` variant that fails to apply leaves `--color-tag` (`#6b5a3a`) on it. This step exists to catch exactly that.

Add to `e2e/recipe.test.ts`:

```ts
test('tags stay readable on both the card and the hero surfaces', async ({ page }) => {
	await page.goto('/recipes/classic-chocolate-chip-cookies-0bNW21');

	// Relative luminance per WCAG, from a computed rgb() string.
	const contrast = (fg: string, bg: string) => {
		const lum = (c: string) => {
			const [r, g, b] = c
				.match(/\d+(\.\d+)?/g)!
				.slice(0, 3)
				.map(Number);
			const f = (v: number) => {
				const s = v / 255;
				return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
			};
			return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
		};
		const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
		return (a + 0.05) / (b + 0.05);
	};

	const heroTag = page.locator('header .tag').first();
	await heroTag.waitFor();
	const hero = await heroTag.evaluate((el) => {
		const cs = getComputedStyle(el);
		// Walk up for the first non-transparent background.
		let node: HTMLElement | null = el as HTMLElement;
		let bg = 'rgba(0, 0, 0, 0)';
		while (node && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
			bg = getComputedStyle(node).backgroundColor;
			node = node.parentElement;
		}
		return { color: cs.color, bg, borderColor: cs.borderColor };
	});

	expect(contrast(hero.color, hero.bg)).toBeGreaterThanOrEqual(4.5);
});
```

`4.5` is the WCAG AA threshold for body text. Demonstrate RED by temporarily removing `tag--on-dark` from the hero markup — the dark-on-dark result should fall far below it — then restore.

- [ ] **Step 7: Commit**

```bash
pnpm exec prettier --write src/app.css src/lib/components/TagFilter.svelte "src/routes/recipes/[slug]/components/RecipeHero.svelte"
pnpm test:unit run
git add src/app.css src/lib/components/TagFilter.svelte "src/routes/recipes/[slug]/components/RecipeHero.svelte"
git commit -m "Quiet the tags down and consolidate their styling

--color-tag and --color-accent were both #e8a83a, so a passive tag chip
carried the same weight as the primary button. Tags now use their own
muted tokens with an outline treatment.

They were also styled three different ways — a global .tag class, inline
utilities in TagFilter, and raw bg-accent in the hero. All three now use
.tag, with a --on-dark variant for the espresso hero."
```

---

### Task 6: Demote the filled badges and retire paprika

`26 min` renders as a solid paprika pill, which reads as a warning next to amber tags, and the `Forked` badge is a filled amber pill competing with the primary button. Both are metadata, not status or action. Removing the time pill also makes `--color-paprika` dead — it has exactly one consumer.

**Files:**

- Modify: `src/routes/recipes/[slug]/components/RecipeHero.svelte` (time pill near line 88)
- Modify: `src/lib/components/RecipeCard.svelte` (`.forked-badge` rule near line 144)
- Modify: `src/app.css` (`@theme inline` near line 31, `:root` near line 113, `[data-theme='dark']` near line 181)
- Test: `src/lib/components/RecipeCard.svelte.test.ts` (must pass unchanged)

**Interfaces:**

- Consumes: `.tag` from Task 5
- Produces: nothing

- [ ] **Step 0: Restyle the Forked badge as an outline**

In `RecipeCard.svelte`, replace the `.forked-badge` rule's fill with an outline. The class names `forked-badge` and `forked-badge--hidden` must not change — `RecipeCard.svelte.test.ts` asserts on both, and the e2e suite queries `.forked-badge:not(.forked-badge--hidden)`.

```css
.forked-badge {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-family: var(--font-mono);
	font-size: 0.65rem;
	font-weight: 600;
	background: transparent;
	color: var(--color-text-2);
	border: 1px solid var(--color-tag-border);
	border-radius: var(--radius-pill);
	padding: 2px 7px;
	align-self: flex-start;
}
```

The fork glyph `<svg>` stays as it is; `currentColor` picks up the new text colour automatically.

- [ ] **Step 0b: Confirm the badge tests still pass**

Run: `pnpm exec vitest run src/lib/components/RecipeCard.svelte.test.ts`
Expected: PASS — the restyle changes only colour properties, not class names.

- [ ] **Step 1: Render the time as metadata**

In `RecipeHero.svelte`, replace the time pill block:

```svelte
{#if totalMinutes > 0}
	<span class="text-text-bronze font-mono text-[0.85rem]">{formatTime(totalMinutes)}</span>
{/if}
```

It now sits alongside `Serves {recipe.servings}` in the same visual register rather than competing with the tags.

- [ ] **Step 2: Confirm paprika is dead**

Run: `grep -rn "paprika" src/`
Expected: matches only in `src/app.css`. If any component still uses it, stop and reassess — the spec assumed a single consumer.

- [ ] **Step 3: Delete the token**

Remove all three `--color-paprika` declarations from `src/app.css`: the `@theme inline` registration, the `:root` value, and the `[data-theme='dark']` override.

- [ ] **Step 4: Verify the build still resolves**

Run: `pnpm exec vite build`
Expected: success. Tailwind fails loudly on an unknown utility, so a surviving `bg-paprika` would break here.

- [ ] **Step 5: Assert the demotion, do not eyeball it**

"Exactly one amber element" is this task's whole point, so assert it. `--color-accent` is `#e8a83a`, which computes to `rgb(232, 168, 58)`. Add to `e2e/recipe.test.ts`:

```ts
test('the hero demotes metadata and keeps one accent element', async ({ page }) => {
	await page.goto('/recipes/classic-chocolate-chip-cookies-0bNW21');
	const hero = page.locator('header').first();
	await hero.waitFor();

	const accent = 'rgb(232, 168, 58)';

	// Nothing in the hero may use the accent as a fill any more.
	const filled = await hero.evaluate(
		(el, a) =>
			[...el.querySelectorAll('*')].filter((n) => getComputedStyle(n).backgroundColor === a).length,
		accent
	);
	expect(filled).toBe(0);

	// Cook time is metadata, not a pill: no background of its own.
	const time = page.getByText(/^\d+\s*(min|h)/).first();
	const timeBg = await time.evaluate((el) => getComputedStyle(el).backgroundColor);
	expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(timeBg);
});
```

Demonstrate RED before Step 1 (the filled time pill and filled tags should both trip it), then GREEN after.

- [ ] **Step 5b: Confirm the Forked badge is still visible**

An outline restyle can render a badge invisible while its class names — which the component tests assert on — survive untouched. Add to `e2e/recipe.test.ts`:

```ts
test('the forked badge reads as an outline, not a fill', async ({ page }) => {
	await page.goto('/');
	const badge = page.locator('.forked-badge:not(.forked-badge--hidden)').first();
	await badge.waitFor();

	const style = await badge.evaluate((el) => {
		const cs = getComputedStyle(el);
		return { bg: cs.backgroundColor, border: cs.borderStyle, width: cs.borderTopWidth };
	});

	expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(style.bg);
	expect(style.border).toBe('solid');
	expect(parseFloat(style.width)).toBeGreaterThan(0);
	await expect(badge).toBeVisible();
});
```

- [ ] **Step 6: Commit**

```bash
pnpm exec prettier --write src/app.css "src/routes/recipes/[slug]/components/RecipeHero.svelte"
pnpm test:unit run
git add src/app.css "src/routes/recipes/[slug]/components/RecipeHero.svelte"
git commit -m "Render cook time as metadata, not a red pill

A solid paprika pill next to amber tags read as a warning. Cook time is
metadata and now sits with Serves. That was paprika's only consumer, so
the token goes too."
```

---

### Task 7: Extract the diff renderer

The diff markup is inline in the compare page. The landing page needs the identical rendering, and so will pull requests (roadmap M1 Task 0). Extract once.

**Files:**

- Create: `src/lib/components/VersionDiff.svelte`
- Modify: `src/routes/recipes/[slug]/diff/+page.svelte`
- Test: `src/routes/recipes/[slug]/diff/page.svelte.test.ts` (must pass unchanged)

**Interfaces:**

- Consumes: `IngredientDiffRow`, `StepDiffRow` from `$lib/utils/diff`
- Produces: `VersionDiff.svelte` with props `{ ingredientDiff: IngredientDiffRow[]; stepDiff: StepDiffRow[] }`. Task 10 imports it.

- [ ] **Step 1: Confirm the existing tests pass before touching anything**

Run: `pnpm exec vitest run "src/routes/recipes/[slug]/diff/page.svelte.test.ts"`
Expected: PASS (13 tests). This is the safety net; do not proceed if it is already red.

- [ ] **Step 2: Create the component**

Create `src/lib/components/VersionDiff.svelte` containing the two `<section>` blocks currently in the compare page — the Ingredients section and the Steps section, including their `{#each}` blocks and the "No changes" placeholders. Move the `.diff-*` styles from the compare page's `<style>` block with them.

```svelte
<script lang="ts">
	import type { IngredientDiffRow, StepDiffRow } from '$lib/utils/diff';

	let {
		ingredientDiff,
		stepDiff
	}: {
		ingredientDiff: IngredientDiffRow[];
		stepDiff: StepDiffRow[];
	} = $props();
</script>
```

Copy the markup verbatim. Do not "improve" it while moving it — a behaviour change here is invisible until the tests fail, and the point of the safety net is that it stays taut.

- [ ] **Step 3: Use it from the compare page**

In `src/routes/recipes/[slug]/diff/+page.svelte`, delete the two sections and their styles, then render:

```svelte
<VersionDiff {ingredientDiff} {stepDiff} />
```

Add the import: `import VersionDiff from '$lib/components/VersionDiff.svelte';`

- [ ] **Step 4: Run the tests and confirm they still pass**

Run: `pnpm exec vitest run "src/routes/recipes/[slug]/diff/page.svelte.test.ts"`
Expected: PASS (13 tests), unchanged. Any failure means the move altered the rendering — fix the component, not the test.

- [ ] **Step 5: Verify the compare page in the browser**

Load a diff URL and confirm added, removed, modified and unchanged rows all still render, including the word-level inline segments.

- [ ] **Step 6: Commit**

```bash
pnpm exec prettier --write src/lib/components/VersionDiff.svelte "src/routes/recipes/[slug]/diff/+page.svelte"
pnpm test:unit run
git add src/lib/components/VersionDiff.svelte "src/routes/recipes/[slug]/diff/+page.svelte"
git commit -m "Extract VersionDiff from the compare page

The landing page needs the same rendering, and so will pull requests.
Markup moved verbatim; the compare page's 13 tests pass unchanged."
```

---

### Task 8: Show version and fork counts on cards

A card that says `v3 · 2 forks` communicates what this product is better than any amount of landing copy, and it is genuine signal for a cook choosing what to make.

**Files:**

- Modify: `src/lib/components/RecipeCard.svelte`
- Modify: `src/routes/+page.server.ts`
- Test: `src/lib/components/RecipeCard.svelte.test.ts`

**Interfaces:**

- Consumes: the relation-loaded recipe shape from Task 2
- Produces: `CardRecipe` gains two optional fields — `versionCount?: number` and `forkCount?: number`. Task 10 passes the same shape.

- [ ] **Step 1: Write the failing component tests**

Add to `src/lib/components/RecipeCard.svelte.test.ts`:

```ts
test('shows the latest version number', () => {
	render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 3 }) } });
	expect(screen.getByText(/^v3$/)).toBeInTheDocument();
});

test('shows the fork count when the recipe has forks', () => {
	render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 1, forkCount: 2 }) } });
	expect(screen.getByText(/2 forks/)).toBeInTheDocument();
});

test('omits the fork count when there are none', () => {
	render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 1, forkCount: 0 }) } });
	expect(screen.queryByText(/fork/i)).not.toBeInTheDocument();
});

test('uses the singular for one fork', () => {
	render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 1, forkCount: 1 }) } });
	expect(screen.getByText(/1 fork(?!s)/)).toBeInTheDocument();
});
```

The existing `makeRecipe()` helper takes an overrides object; pass the new fields through it. If it does not accept overrides, extend it — do not duplicate it.

Note: the "omits the fork count" test must not collide with the `Forked` badge, which renders the word "Forked" for forked recipes. `makeRecipe()` defaults `parentId` to `null`, so the badge is hidden and the assertion is safe.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm exec vitest run src/lib/components/RecipeCard.svelte.test.ts`
Expected: FAIL — four new tests cannot find the text.

- [ ] **Step 3: Extend the card's prop type**

In `RecipeCard.svelte`:

```ts
interface CardRecipe extends Omit<Recipe, 'fts'> {
	recipesToTags?: { tag: { id: number; name: string; slug: string } }[];
	author?: { id: string; username: string } | null;
	versionCount?: number;
	forkCount?: number;
}
```

- [ ] **Step 4: Render the counts**

In the meta row that currently holds the author and time, append:

```svelte
{#if recipe.versionCount}
	<span class="text-text-3 font-mono text-[0.72rem]">·</span>
	<span class="text-accent font-mono text-[0.72rem]">v{recipe.versionCount}</span>
{/if}
{#if recipe.forkCount}
	<span class="text-text-3 font-mono text-[0.72rem]">
		· {recipe.forkCount}
		{recipe.forkCount === 1 ? 'fork' : 'forks'}
	</span>
{/if}
```

The version number is amber deliberately — version identity is one of the two jobs amber is allowed to do.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `pnpm exec vitest run src/lib/components/RecipeCard.svelte.test.ts`
Expected: PASS (17 tests)

- [ ] **Step 6: Write the failing loader test**

Create `src/routes/page.server.test.ts`:

```ts
import { vi, describe, test, expect, beforeEach } from 'vitest';

const { findManyMock, selectMock } = vi.hoisted(() => ({
	findManyMock: vi.fn(),
	selectMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	db: { query: { recipes: { findMany: findManyMock } }, select: selectMock }
}));

import { load } from './+page.server';

function chain(resolved: unknown = []) {
	const p = Promise.resolve(resolved);
	const c: Record<string, unknown> = {
		then: p.then.bind(p),
		catch: p.catch.bind(p),
		finally: p.finally.bind(p)
	};
	for (const m of ['from', 'where', 'groupBy', 'innerJoin', 'leftJoin', 'orderBy']) {
		c[m] = vi.fn().mockReturnValue(c);
	}
	return c;
}

describe('homepage load', () => {
	beforeEach(() => vi.clearAllMocks());

	test('attaches version and fork counts without a query per card', async () => {
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'A', recipesToTags: [], author: null },
			{ id: 2, title: 'B', recipesToTags: [], author: null },
			{ id: 3, title: 'C', recipesToTags: [], author: null }
		]);
		selectMock
			.mockReturnValueOnce(
				chain([
					{ recipeId: 1, count: 2 },
					{ recipeId: 2, count: 1 }
				])
			)
			.mockReturnValueOnce(chain([{ parentId: 1, count: 4 }]));

		const result = await load({ locals: { user: null } } as unknown as Parameters<typeof load>[0]);

		expect(result.recipes[0].versionCount).toBe(2);
		expect(result.recipes[0].forkCount).toBe(4);
		expect(result.recipes[2].versionCount).toBe(0);
		// Two aggregates total, regardless of how many recipes came back.
		expect(selectMock).toHaveBeenCalledTimes(2);
	});
});
```

- [ ] **Step 7: Run it and confirm it fails**

Run: `pnpm exec vitest run src/routes/page.server.test.ts`
Expected: FAIL — `versionCount` is undefined.

- [ ] **Step 8: Add the aggregates to the loader**

In `src/routes/+page.server.ts`, after the existing `findMany`:

```ts
// Two grouped aggregates for the whole page — never one query per card.
const versionCounts = await db
	.select({ recipeId: recipeVersions.recipeId, count: count() })
	.from(recipeVersions)
	.groupBy(recipeVersions.recipeId);

const forkCounts = await db
	.select({ parentId: recipes.parentId, count: count() })
	.from(recipes)
	.where(isNotNull(recipes.parentId))
	.groupBy(recipes.parentId);

const versionsById = new Map(versionCounts.map((r) => [r.recipeId, Number(r.count)]));
const forksById = new Map(forkCounts.map((r) => [r.parentId, Number(r.count)]));

const withCounts = displayedRecipes.map((r) => ({
	...r,
	versionCount: versionsById.get(r.id) ?? 0,
	forkCount: forksById.get(r.id) ?? 0
}));

return { recipes: withCounts };
```

Add `count`, `isNotNull` to the `drizzle-orm` import and `recipeVersions` to the schema import.

- [ ] **Step 9: Run the tests and confirm they pass**

Run: `pnpm exec vitest run src/routes/page.server.test.ts src/lib/components/RecipeCard.svelte.test.ts`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
pnpm exec prettier --write src/lib/components/RecipeCard.svelte src/routes/+page.server.ts src/routes/page.server.test.ts src/lib/components/RecipeCard.svelte.test.ts
pnpm test:unit run
git add src/lib/components/RecipeCard.svelte src/routes/+page.server.ts src/routes/page.server.test.ts src/lib/components/RecipeCard.svelte.test.ts
git commit -m "Show version and fork counts on recipe cards

Version control was invisible on the feed. Counts come from two grouped
aggregates for the whole page, asserted by test so this cannot become a
query per card."
```

---

### Task 9: Promote version history to a strip under the hero

Version history is the third sidebar card, below the photo and a Details box. It is the product's differentiator and should not be furniture. This is also where pull requests will surface (roadmap M1).

**Files:**

- Create: `src/lib/components/VersionStrip.svelte`
- Modify: `src/routes/recipes/[slug]/+page.svelte`
- Test: `src/lib/components/VersionStrip.svelte.test.ts` (create)

**Interfaces:**

- Consumes: the same `allVersions` and `currentVersion` props `VersionHistory.svelte` takes today
- Produces: `VersionStrip.svelte` with props `{ versions, currentVersionNumber, recipeSlug, isViewingHistory }`

- [ ] **Step 1: Write the failing test**

Create `src/lib/components/VersionStrip.svelte.test.ts`:

```ts
import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import VersionStrip from './VersionStrip.svelte';

function makeVersion(n: number, message: string) {
	return {
		id: n,
		versionNumber: n,
		commitMessage: message,
		createdAt: new Date('2026-01-01'),
		creator: { id: 'u1', username: 'spencerfletcher' }
	};
}

const props = {
	versions: [makeVersion(1, 'Initial recipe'), makeVersion(2, 'Added espresso powder')],
	currentVersionNumber: 2,
	recipeSlug: 'classic-cookies-abc123',
	isViewingHistory: false
};

describe('VersionStrip', () => {
	test('renders every version', () => {
		render(VersionStrip, { props });
		expect(screen.getByText(/v1/)).toBeInTheDocument();
		expect(screen.getByText(/v2/)).toBeInTheDocument();
	});

	test('marks the current version', () => {
		render(VersionStrip, { props });
		expect(screen.getByLabelText(/current version/i)).toHaveTextContent('v2');
	});

	test('offers a compare link for versions after the first', () => {
		render(VersionStrip, { props });
		const link = screen.getByRole('link', { name: /compare/i });
		expect(link).toHaveAttribute('href', '/recipes/classic-cookies-abc123/diff?from=1&to=2');
	});

	test('hides compare links while viewing history', () => {
		render(VersionStrip, { props: { ...props, isViewingHistory: true } });
		expect(screen.queryByRole('link', { name: /compare/i })).not.toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm exec vitest run src/lib/components/VersionStrip.svelte.test.ts`
Expected: FAIL — the component does not exist.

- [ ] **Step 3: Build the component**

Create `src/lib/components/VersionStrip.svelte`:

```svelte
<script lang="ts">
	type StripVersion = {
		id: number;
		versionNumber: number;
		commitMessage: string;
		creator?: { id: string; username: string } | null;
	};

	let {
		versions,
		currentVersionNumber,
		recipeSlug,
		isViewingHistory = false
	}: {
		versions: StripVersion[];
		currentVersionNumber: number;
		recipeSlug: string;
		isViewingHistory?: boolean;
	} = $props();
</script>

<nav class="version-strip" aria-label="Version history">
	{#each versions as version (version.id)}
		{@const isCurrent = version.versionNumber === currentVersionNumber}
		<div class="version-entry" aria-label={isCurrent ? 'Current version' : undefined}>
			<a
				href="/recipes/{recipeSlug}?version={version.versionNumber}"
				class="version-number"
				class:is-current={isCurrent}
			>
				v{version.versionNumber}
			</a>
			<span class="version-message">{version.commitMessage}</span>
			{#if version.versionNumber > 1 && !isViewingHistory}
				<a
					href="/recipes/{recipeSlug}/diff?from={version.versionNumber -
						1}&to={version.versionNumber}"
					class="version-compare"
				>
					Compare
				</a>
			{/if}
		</div>
	{/each}
</nav>

<style>
	/* Scrolls rather than wraps: a wrapped history grows tall and pushes the
	   recipe down, which is the problem this component exists to solve. */
	.version-strip {
		display: flex;
		gap: var(--space-5);
		overflow-x: auto;
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--color-border);
		font-family: var(--font-mono);
		font-size: 0.78rem;
	}

	.version-entry {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.version-number {
		font-weight: 600;
		color: var(--color-text-3);
		text-decoration: none;
	}

	/* Version identity is one of the two jobs amber is allowed to do. */
	.version-number.is-current {
		color: var(--color-accent);
	}

	.version-message {
		color: var(--color-text-2);
		white-space: nowrap;
	}

	.version-compare {
		color: var(--color-text-3);
		text-decoration: none;
		font-size: 0.7rem;
	}

	.version-compare:hover {
		color: var(--color-accent);
	}
</style>
```

`aria-label` is set only on the current entry so the test's `getByLabelText(/current version/i)` resolves to exactly one element.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm exec vitest run src/lib/components/VersionStrip.svelte.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Place it on the recipe page**

In `src/routes/recipes/[slug]/+page.svelte`, render `<VersionStrip … />` directly below the hero and above `.content-layout`. Remove `<VersionHistory>` from the sidebar and delete the component file if nothing else imports it — check with `grep -rn "VersionHistory" src/`.

- [ ] **Step 6: Re-check the whole recipe-page layout suite**

Run the file, not a name filter — Task 1's tests were renamed during implementation and a stale `-g` pattern matches nothing and passes vacuously:

`DATABASE_URL="postgresql://postgres@127.0.0.1:55432/forkdev" pnpm exec playwright test --project=chromium e2e/recipe.test.ts`

Expected: all pass, including Task 1's mobile order, desktop two-column, no-photo, and no-horizontal-scroll tests. The strip sits above `.content-layout`, so ordering should be unaffected — confirm rather than assume.

- [ ] **Step 6b: Prove the strip does not overflow the page**

A horizontally scrolling row of `flex-shrink: 0` items is a classic source of page-level overflow — Task 1 shipped exactly that bug via a different route. The strip must scroll _within itself_ without widening the document.

```ts
test('the version strip scrolls without widening the page', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 900 });
	await page.goto('/recipes/classic-chocolate-chip-cookies-0bNW21');

	const strip = page.locator('.version-strip');
	await strip.waitFor();

	const doc = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);

	// The strip itself may scroll; it must not exceed its container.
	const box = await strip.boundingBox();
	expect(box!.width).toBeLessThanOrEqual(390);
});
```

Add it to `e2e/recipe.test.ts`. Demonstrate RED by temporarily removing `overflow-x: auto` from `.version-strip`, then restore.

- [ ] **Step 7: Commit**

```bash
pnpm exec prettier --write src/lib/components/VersionStrip.svelte src/lib/components/VersionStrip.svelte.test.ts "src/routes/recipes/[slug]/+page.svelte"
pnpm test:unit run
git add src/lib/components/VersionStrip.svelte src/lib/components/VersionStrip.svelte.test.ts "src/routes/recipes/[slug]/+page.svelte"
git commit -m "Promote version history to a strip under the hero

It was the third sidebar card, below the photo and a details box — the
product's differentiator presented as metadata. It now sits directly
under the hero, which is also where pull requests will surface."
```

---

### Task 10: Landing page for logged-out visitors

A visitor currently lands on a recipe grid and has no way to know what the project is. Logged-in users keep today's feed.

**Files:**

- Modify: `src/routes/+page.server.ts`
- Modify: `src/routes/+page.svelte`
- Create: `src/routes/LandingHero.svelte`
- Test: `src/routes/page.server.test.ts` (extend from Task 8)

**Interfaces:**

- Consumes: `VersionDiff.svelte` (Task 7), `RecipeCard` with counts (Task 8)
- Produces: the loader returns `{ mode: 'landing' | 'feed', recipes, sampleDiff? }`

- [ ] **Step 1: Write the failing loader tests**

Add to `src/routes/page.server.test.ts`:

```ts
test('returns feed mode for a logged-in user', async () => {
	findManyMock.mockResolvedValue([]);
	selectMock.mockReturnValue(chain([]));

	const result = await load({
		locals: { user: { id: 'u1' } }
	} as unknown as Parameters<typeof load>[0]);

	expect(result.mode).toBe('feed');
});

test('returns landing mode for an anonymous visitor', async () => {
	findManyMock.mockResolvedValue([]);
	selectMock.mockReturnValue(chain([]));

	const result = await load({ locals: { user: null } } as unknown as Parameters<typeof load>[0]);

	expect(result.mode).toBe('landing');
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm exec vitest run src/routes/page.server.test.ts -t "mode"`
Expected: FAIL — `mode` is undefined.

- [ ] **Step 3: Branch the loader**

`src/routes/+page.server.ts` takes `{ locals: { user } }` and, after the `withCounts` array from Task 8, appends this. It reuses Task 8's version-count aggregate to pick the sample rather than issuing another counting query.

```ts
// A real diff from real rows. If no recipe has two versions the section is
// omitted rather than fabricated — the landing page must not claim more
// than the data supports.
let sampleDiff: {
	recipeTitle: string;
	recipeSlug: string;
	ingredientDiff: ReturnType<typeof diffIngredients>;
	stepDiff: ReturnType<typeof diffSteps>;
} | null = null;

if (!user) {
	const best = withCounts
		.filter((r) => r.versionCount >= 2)
		.sort((a, b) => b.versionCount - a.versionCount)[0];

	if (best) {
		const latestTwo = await db.query.recipeVersions.findMany({
			where: eq(recipeVersions.recipeId, best.id),
			orderBy: [desc(recipeVersions.versionNumber)],
			limit: 2
		});
		const [to, from] = latestTwo; // ordered newest first
		if (from && to) {
			sampleDiff = {
				recipeTitle: best.title,
				recipeSlug: best.slug,
				ingredientDiff: diffIngredients(
					from.ingredients as Parameters<typeof diffIngredients>[0],
					to.ingredients as Parameters<typeof diffIngredients>[0]
				),
				stepDiff: diffSteps(
					from.steps as Parameters<typeof diffSteps>[0],
					to.steps as Parameters<typeof diffSteps>[0]
				)
			};
		}
	}
}

return {
	mode: user ? ('feed' as const) : ('landing' as const),
	recipes: user ? withCounts : withCounts.slice(0, 3),
	sampleDiff
};
```

Add to the imports: `desc` from `drizzle-orm`, `recipeVersions` from the schema, and `diffIngredients, diffSteps` from `$lib/utils/diff`.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm exec vitest run src/routes/page.server.test.ts`
Expected: PASS

- [ ] **Step 5: Build the hero**

Create `src/routes/LandingHero.svelte`. The copy names only what exists — linear version history with commit messages, forking with attribution, word-level diffs. No pull requests, no AI, nothing from the roadmap; the README's "Not built" section is the boundary.

```svelte
<script lang="ts">
	let { sampleSlug = null }: { sampleSlug?: string | null } = $props();
</script>

<section class="bg-hero-bg text-text-cream">
	<div class="mx-auto max-w-[900px] px-6 py-16 sm:py-20">
		<h1 class="m-0 font-serif text-[2.75rem] leading-[1.1] sm:text-[3.5rem]">
			Recipes, under version control.
		</h1>
		<p class="text-text-tan mt-5 mb-8 max-w-[46ch] text-[1.05rem] leading-[1.6]">
			Every edit is a version with a commit message. Fork anyone's recipe and your changes keep
			their attribution. Compare any two versions and see exactly which ingredient moved.
		</p>
		<div class="flex flex-wrap items-center gap-4">
			<a
				href="/recipes"
				class="bg-accent text-hero-bg rounded-pill px-6 py-3 font-sans text-[0.95rem] font-semibold no-underline transition-opacity duration-150 hover:opacity-90"
			>
				Browse recipes
			</a>
			{#if sampleSlug}
				<a
					href="/recipes/{sampleSlug}/diff"
					class="text-text-cream rounded-pill border border-white/25 px-6 py-3 font-sans text-[0.95rem] no-underline transition-colors duration-150 hover:border-white/50"
				>
					See a diff →
				</a>
			{/if}
		</div>
	</div>
</section>
```

"Browse recipes" is the only solid amber button on the page — the secondary action is an outline, so the hierarchy rule from Task 5 holds here too.

- [ ] **Step 6: Branch the page**

In `src/routes/+page.svelte`:

```svelte
{#if data.mode === 'landing'}
	<LandingHero sampleSlug={data.sampleDiff?.recipeSlug} />
	{#if data.sampleDiff}
		<section class="mx-auto max-w-[900px] px-6 py-10">
			<h2 class="eyebrow-label mb-3">A real change, diffed</h2>
			<VersionDiff
				ingredientDiff={data.sampleDiff.ingredientDiff}
				stepDiff={data.sampleDiff.stepDiff}
			/>
		</section>
	{/if}
{/if}
```

Then render the existing grid below, unchanged, for both modes.

- [ ] **Step 7: Write the e2e coverage**

Add to `e2e/recipe.test.ts` (guest context):

```ts
test('logged-out visitors see the premise and a diff', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: /browse recipes/i })).toBeVisible();
	await expect(page.locator('.diff-content').first()).toBeVisible();
});
```

Add to `e2e/authenticated.test.ts`:

```ts
test('logged-in users get the feed, not the landing page', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: /browse recipes/i })).not.toBeVisible();
});
```

- [ ] **Step 8: Run everything**

Run: `pnpm test:unit run && pnpm exec playwright test`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
pnpm exec prettier --write src/routes/
pnpm test:unit run
git add src/routes/ e2e/
git commit -m "Add a landing page for logged-out visitors

A visitor landed on a recipe grid with no way to know what the project
is. Logged out now gets the premise and a real diff built from actual
version rows; logged in keeps the feed unchanged.

The diff section is omitted when no recipe has two versions rather than
falling back to fixture data."
```

---

## Verification

After Task 10, confirm the whole plan landed:

- [ ] `pnpm test:unit run` — all green
- [ ] `pnpm exec playwright test` — all green
- [ ] `pnpm check` and `pnpm lint` — clean
- [ ] `grep -rn "tag-pale\|paprika" src/` — no output
- [ ] Screenshot `/` logged out, `/` logged in, a recipe at 1440px and 390px, and `/search?q=butter`; confirm one solid amber element per screen
- [ ] Push and confirm all three CI jobs pass
- [ ] Apply the Task 3 migration to production and re-verify the tag filter
