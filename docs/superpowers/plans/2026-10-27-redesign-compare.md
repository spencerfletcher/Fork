# Redesign — Compare Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the compare page (`/recipes/[slug]/diff`) on the locked system: a header with inline pickers, two version cards, and the diff in two columns, matching the round-5 Compare boards at desktop and 390px.

**Architecture:** The loader already returns both versions with creator, ingredients and snapshot metadata, so nothing changes server-side. `VersionDiff.svelte` is shared with the landing page and gets the shared type and tone changes; the page itself gets the header, pickers and version cards. The diff column widens so the existing container query splits ingredients and steps side by side, as the board shows.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, scoped CSS on tokens from `src/app.css`, Vitest + Testing Library, Playwright.

**Spec:** `docs/research/2026-10-26-ui-design-directions.md`, "Round 5" and the "as built" paragraphs; the canvas at https://claude.ai/artifact/QFTDpwCLRwuknh754yNPzc, boards "Compare" and "Compare — 390px". Tokens: the foundation plan's Global Constraints.

## Global Constraints

- Branch `redesign`; every task commits there. No Co-Authored-By lines. Tests before markup.
- Page column: content `max-width: 784px` centred (the board is 880px with 48px gutters). Inside it the diff splits into two columns through the container query `VersionDiff` already has; under 700px everything is one column.
- Header, top to bottom: `a.back-link` reading "← {recipe title}"; `h1` "Compare versions" in Bitter 500, `2.125rem` desktop / `1.625rem` under 700px, line-height 1.1, clay (`--color-accent`, 5.01:1 on paper); the picker row: eyebrow label "From", a `select`, "→" in ink-3, eyebrow label "To", a `select`. Selects are mono `0.75rem`, `width: auto`, `min-width: 0`; under 700px the two labels are visually hidden (they stay as `<label for>`), the selects take `flex: 1` and `0.875rem`.
- Version cards: a two-column grid (`gap: 24px`; one column under 700px, `gap: 8px`) of `article.version-card`: surface, 1px border, radius lg, padding 16px (12px under 700px). Header line in mono `0.75rem`: `span.version-card__number` "v{n}" at `1.125rem` 600 ink-3, and on the "to" card ink on a marigold chip (`padding: 0 6px; border-radius: 3px`); then the date as `d MMM yyyy` (`toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })`) and " · @{creator}" when there is one. Then `p.version-card__message` mono `0.75rem` line-height 1.5 ink. Then a `dl` in sans `0.8125rem`, `dt` ink-3 inline: "Title", then on one row "Serves", "Prep", "Cook" (each only when set, times as "{n} min") and "Ingredients" (the count, always).
- Diff tones and type (shared with the landing page): rows mono `0.75rem` desktop, `0.875rem` under 700px; removed rows at full opacity, and `--color-remove` returns to the locked `#a3362b` (5.44:1 on its background without the blend); added inline segments underlined so a replaced word reads without colour; the step number in `--color-accent` and inheriting the row colour inside an added row; Details rows for prep and cook end in " min".
- No new hex values. The `.commit-bar` block on the landing page is untouched; only the compare page's stacked variant and its CSS go.

## Review Focus

- A commit message that is one long unbroken token in a version card: it must wrap inside the card, not widen the grid. Task 2 sets `overflow-wrap: anywhere` on the message; Task 2 Step 1 asserts the class so the rule has an owner, Task 3 looks at it.
- A version whose creator was deleted (`creator` null): the card shows the date alone, no stray separator. Task 2 Step 1.
- A version with `createdAt` null (the column defaults but is nullable): no "Invalid Date". Task 2 formats only when the date is set. Task 2 Step 1.
- A recipe with many versions on a phone: the select's longest option must not push the page wider than 390px. Task 3 Step 1 e2e.
- Removed rows at full opacity: the e2e contrast test still measures ≥ 4.5 by blending with the computed opacity, now 1. Task 1 Step 4 runs it.

---

### Task 1: VersionDiff on the locked system

**Files:**

- Modify: `src/lib/components/recipes/VersionDiff.svelte`
- Modify: `src/lib/components/recipes/VersionDiff.svelte.test.ts`
- Modify: `src/app.css` (the `--color-remove` token and its comment), `src/app.css.test.ts:55`

**Interfaces:**

- Consumes: nothing.
- Produces: the same component props. Row class names unchanged (`.diff-row`, `.diff-added`, `.diff-removed`, `.diff-modified`, `.diff-content`, `.step-num`, `.diff-gutter`).

- [ ] **Step 1: Write the failing tests**

In `VersionDiff.svelte.test.ts`, add:

```ts
test('a time change in Details carries its unit', () => {
	const { container } = render(VersionDiff, {
		props: {
			metaDiff: [{ field: 'cookTimeMinutes', from: 11, to: 13 }],
			ingredientDiff: [],
			stepDiff: []
		}
	});
	expect(
		container
			.querySelector('.diff-modified .diff-content')
			?.textContent?.replace(/\s+/g, ' ')
			.trim()
	).toBe('Cook time: 11 13 min');
});
```

In `src/app.css.test.ts`, change the exact-value assertion at line 55 to `expect(tokens['--color-remove']).toBe('#a3362b');`.

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run src/lib/components/recipes/VersionDiff.svelte.test.ts src/app.css.test.ts` Expected: FAIL: the Details text has no "min"; the token is `#922d23`.

- [ ] **Step 3: Change the component and the token**

`VersionDiff.svelte`: in the meta row, after `show(row.to)` render ` min` when `row.field === 'prepTimeMinutes' || row.field === 'cookTimeMinutes'`. CSS: `.diff-panel` font-size `0.75rem` with `@media (max-width: 699px) { .diff-panel { font-size: 0.875rem } }`; delete `opacity: 0.85` and its comment from `.diff-row.diff-removed`; add `text-decoration: underline` to `.diff-content .diff-added`; `.step-num` colour `var(--color-accent)` and add `.diff-row.diff-added .step-num { color: inherit }`. `app.css`: `--color-remove: #a3362b;` and replace the four-line comment above the diff colours with one line: `/* Semantic diff colors, AA against their own backgrounds (remove 5.44:1, add 5.47:1). */`.

- [ ] **Step 4: Run the tests, then the contrast e2e**

Run: `pnpm vitest run src/lib/components/recipes/VersionDiff.svelte.test.ts src/app.css.test.ts` Expected: PASS.

Run: `pnpm test:e2e e2e/recipe.test.ts -g "clear 4.5:1"` Expected: PASS (the blend with opacity 1 is the colour itself).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/recipes/VersionDiff.svelte src/lib/components/recipes/VersionDiff.svelte.test.ts src/app.css src/app.css.test.ts
git commit -m "Diff panels on the locked system: 12px mono, full-opacity removes on the locked tone, underlined adds, clay step numbers, minutes on time rows"
```

---

### Task 2: Compare page header, pickers and version cards

**Files:**

- Modify: `src/routes/recipes/[slug]/diff/+page.svelte`
- Modify: `src/routes/recipes/[slug]/diff/page.svelte.test.ts`
- Modify: `src/app.css` (delete `.commit-bar--stacked`, `.commit-bar__line`, `.commit-bar__arrow` and the comment above them, lines 601–621)

**Interfaces:**

- Consumes: `data.recipe`, `data.fromVersion`, `data.toVersion` (each with `versionNumber`, `commitMessage`, `createdAt: Date | null`, `creator: { username } | null`, `title`, `servings`, `prepTimeMinutes`, `cookTimeMinutes`, `ingredients`), `data.allVersions`; `VersionDiff` from Task 1.
- Produces: markup `div.compare` > `a.back-link`, `h1`, `div.version-picker` (two `label` + `select` pairs, ids `from-select` and `to-select`), `div.version-cards` > two `article.version-card` (the second with `.version-card--to`), then `VersionDiff`.

- [ ] **Step 1: Change the tests**

In `page.svelte.test.ts`, make `V1`/`V2` carry the snapshot fields: `title: 'Classic Chocolate Chip Cookies'`, `servings: 48`, `prepTimeMinutes: null`, `cookTimeMinutes: 11`, `ingredients: [ing('2 cups flour'), ing('1 tsp salt')]`, and `createdAt: new Date(Date.UTC(2026, 1, 28))`. Replace "renders the back link to the recipe page" with:

```ts
test('the back link is the recipe title and leads to the recipe', () => {
	render(DiffPage, { props: { data: makeData() } });
	const backLink = screen.getByRole('link', { name: /Classic Chocolate Chip Cookies/ });
	expect(backLink).toHaveAttribute('href', '/recipes/classic-cookies');
});
```

Add:

```ts
test('each version card shows its number, date, message and snapshot', () => {
	const { container } = render(DiffPage, { props: { data: makeData() } });
	const cards = container.querySelectorAll('article.version-card');
	expect(cards).toHaveLength(2);
	expect(cards[0]).toHaveTextContent('v1');
	expect(cards[0]).toHaveTextContent('28 Feb 2026');
	expect(cards[0]).toHaveTextContent('Initial recipe');
	expect(cards[0]).toHaveTextContent('Serves 48');
	expect(cards[0]).toHaveTextContent('Cook 11 min');
	expect(cards[0]).toHaveTextContent('Ingredients 2');
	expect(cards[0]).not.toHaveTextContent('Prep');
	expect(cards[1]).toHaveClass('version-card--to');
	expect(cards[1].querySelector('.version-card__message')).toBeInTheDocument();
});

test('a card without a creator or a date shows neither, with no stray separator', () => {
	const { container } = render(DiffPage, {
		props: { data: makeData({ fromVersion: { ...V1, createdAt: null, creator: null } }) }
	});
	const header = container.querySelector('article.version-card .version-card__head');
	expect(header?.textContent?.replace(/\s+/g, ' ').trim()).toBe('v1');
});

test('a card names its creator after the date', () => {
	const { container } = render(DiffPage, {
		props: {
			data: makeData({ fromVersion: { ...V1, creator: { id: 'u1', username: 'chef' } } })
		}
	});
	expect(container.querySelector('article.version-card .version-card__head')).toHaveTextContent(
		'28 Feb 2026 · @chef'
	);
});

test('the stacked commit bar is gone', () => {
	const { container } = render(DiffPage, { props: { data: makeData() } });
	expect(container.querySelector('.commit-bar')).toBeNull();
});
```

"shows commit messages for both versions", "version selectors are populated with all versions", "version pickers follow the loaded range" and the diff-row tests stay.

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run "src/routes/recipes/[slug]/diff/page.svelte.test.ts"` Expected: FAIL on the five changed or new tests (no `article.version-card`, `.commit-bar` present, back link named "Back to recipe").

- [ ] **Step 3: Rewrite the page**

Markup per Interfaces, values per Global Constraints. In script: `const when = (d: Date | null) => d?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })`; build the head line as one string so no separator is orphaned: `[when(v.createdAt), v.creator && \`@${v.creator.username}\`].filter(Boolean).join(' · ')`. Render each card through one `{#snippet card(v, isTo)}`. The `dl`holds`<div><dt>Serves</dt> <dd>{v.servings}</dd></div>`style pairs with`dt`/`dd`inline and a`&#32;`between them (Svelte trims the space).`.version-card__message`gets`overflow-wrap: anywhere`. The page wrapper is `div.page`>`div.compare`with`max-width: 784px; margin: 0 auto`. Delete the picker's existing `.version-picker__label`uppercase styling in favour of the`eyebrow-label`class on the labels, and the`.commit-bar--stacked`markup. Under 700px:`.version-picker label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0) }`and`.version-picker select { flex: 1; font-size: 0.875rem }`.

- [ ] **Step 4: Run the tests, check, lint**

Run: `pnpm vitest run "src/routes/recipes/[slug]/diff/page.svelte.test.ts" && pnpm check && pnpm lint` Expected: PASS, 0 errors, clean.

- [ ] **Step 5: Commit**

```bash
git add "src/routes/recipes/[slug]/diff/" src/app.css
git commit -m "Compare page: inline pickers, two version cards with the snapshot, diff in two columns"
```

---

### Task 3: E2e, look, record

**Files:**

- Modify: `e2e/recipe.test.ts:577-588` (the one-column test) and append one test
- Modify: `docs/research/2026-10-26-ui-design-directions.md`

- [ ] **Step 1: Rewrite the one-column e2e and add the phone test**

Replace "the compare page keeps the diff in one column even on a wide screen" with:

```ts
test('the compare page splits the diff on a wide screen and stacks it on a phone', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 1800 });
	await gotoClassicCookies(page);
	await page.goto(page.url().split('?')[0] + '/diff');
	const panels = page.locator('section').filter({ has: page.locator('.eyebrow-label') });
	const ingredients = panels.filter({ hasText: 'Ingredients' }).first();
	const steps = panels.filter({ hasText: 'Steps' }).first();
	const a = await ingredients.boundingBox();
	const b = await steps.boundingBox();
	expect(Math.abs(a!.y - b!.y)).toBeLessThan(2);
	expect(b!.x).toBeGreaterThan(a!.x + a!.width - 1);

	await page.setViewportSize({ width: 390, height: 1800 });
	const a2 = await ingredients.boundingBox();
	const b2 = await steps.boundingBox();
	expect(b2!.y).toBeGreaterThan(a2!.y + a2!.height - 40);
});
```

Append to the same describe:

```ts
test('the compare page does not scroll sideways on a phone', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 1200 });
	await gotoClassicCookies(page);
	await page.goto(page.url().split('?')[0] + '/diff');
	await page.locator('article.version-card').first().waitFor();
	const doc = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
});
```

- [ ] **Step 2: Run the whole e2e suite**

Run: `pnpm test:e2e` Expected: all pass, 0 failed. A failing geometry test is a CSS bug, not a test bug.

- [ ] **Step 3: Look at it**

Dev server, screenshots of the cookies diff at 1200 and 390 and the landing page at 1200 (the diff panels there changed size). Compare against the two Compare boards. Expected: back link is the title, clay h1, pickers inline, two cards with the "to" chip in marigold, Details then Ingredients beside Steps; at 390 the cards stack, the labels are hidden and the selects share the row.

- [ ] **Step 4: Record the rulings**

One paragraph after the "Card and browse, as built" paragraph in the design doc: the compare column is 784px, wider than the round-2 reading column, so the diff splits as the board shows; the version cards show the snapshot (title, serves, times, ingredient count) and the author stays on the phone card; removed rows are back on the locked tone at full opacity, and the "shipped remove text" note below becomes history. Edit that note's last sentence to say the compare step did drop the opacity on 2026-10-27.

```bash
git add e2e/recipe.test.ts docs/research/2026-10-26-ui-design-directions.md
git commit -m "Compare e2e for the two-column diff and the phone width; design directions rulings"
```
