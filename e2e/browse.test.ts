import { expect, test, type Page } from '@playwright/test';

// End-of-day decisions on the browse surfaces (Spencer, 29 October 2026).
// Assumes the seed: four public recipes.

const height = async (page: Page, selector: string) =>
	(await page.locator(selector).first().boundingBox())!.height;

test.describe('Landing page', () => {
	test('"All recipes →" closes the page: 24px at desktop, 44px on a phone', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/');
		const all = page.getByRole('link', { name: 'All recipes →' });
		await expect(all).toHaveAttribute('href', '/recipes');
		expect((await all.boundingBox())!.height).toBeGreaterThanOrEqual(24);
		await page.setViewportSize({ width: 390, height: 900 });
		expect((await all.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	});

	test('"Open the full comparison →" is the arrow link: sans, 24px at desktop, 44px on a phone', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/');
		const open = page.getByRole('link', { name: 'Open the full comparison →' });
		const all = page.getByRole('link', { name: 'All recipes →' });
		const face = (el: Element) => getComputedStyle(el).fontFamily;
		expect(await open.evaluate(face)).toBe(await all.evaluate(face));
		expect((await open.boundingBox())!.height).toBeGreaterThanOrEqual(24);
		await page.setViewportSize({ width: 390, height: 900 });
		expect((await open.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	});

	test('the landing grid is below the fold, so no card photo loads eagerly', async ({ page }) => {
		await page.goto('/');
		const imgs = page.locator('.recipe-grid img');
		expect(await imgs.count()).toBeGreaterThan(0);
		const attrs = await imgs.evaluateAll((els) =>
			els.map((el) => [el.getAttribute('loading'), el.getAttribute('fetchpriority')])
		);
		expect(attrs.every(([loading, priority]) => loading === 'lazy' && priority === null)).toBe(
			true
		);
	});

	test('wherever the panels stack the sample diff folds its unchanged runs; side by side, every row shows', async ({
		page
	}) => {
		const shown = (sel: string) =>
			page
				.locator(sel)
				.evaluateAll((els) => els.filter((el) => getComputedStyle(el).display !== 'none').length);
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		const folds = await shown('.diff-fold');
		expect(folds).toBeGreaterThan(0);
		expect(await shown('.diff-folded')).toBe(0);
		await expect(page.locator('.diff-fold .diff-content').first()).toHaveText(/^\d+ unchanged$/);
		// A tablet stacks the panels too, so it folds the same runs.
		await page.setViewportSize({ width: 768, height: 1024 });
		expect(await shown('.diff-fold')).toBe(folds);
		expect(await shown('.diff-folded')).toBe(0);
		await page.setViewportSize({ width: 1280, height: 900 });
		expect(await shown('.diff-fold')).toBe(0);
		expect(await shown('.diff-folded')).toBe(await page.locator('.diff-folded').count());
	});
});

test.describe('Search filters', () => {
	test('a filter pressed from the keyboard keeps focus after the page navigates', async ({
		page
	}) => {
		await page.goto('/search');
		const dessert = page.getByRole('group', { name: 'Filter by tag' }).getByRole('button', {
			name: 'Dessert'
		});
		await dessert.focus();
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/tags=dessert/);
		await expect(dessert).toHaveAttribute('aria-pressed', 'true');
		await expect(dessert).toBeFocused();
	});

	test('a pressed filter with focus wears the ring on its own box, inside the row', async ({
		page
	}) => {
		for (const width of [1280, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/search?tags=dessert');
			const row = page.getByRole('group', { name: 'Filter by tag' });
			const dessert = row.getByRole('button', { name: 'Dessert' });
			await expect(dessert).toHaveAttribute('aria-pressed', 'true');
			await dessert.focus();
			const ring = await dessert.evaluate((el) => {
				const s = getComputedStyle(el);
				return {
					style: s.outlineStyle,
					width: s.outlineWidth,
					offset: s.outlineOffset,
					focused: el.matches(':focus-visible')
				};
			});
			expect(ring).toEqual({ style: 'solid', width: '2px', offset: '2px', focused: true });
			// The ring's top edge (box top minus offset and width) is not clipped
			// by the scrolling row.
			const clipped = await dessert.evaluate(
				(el) => el.getBoundingClientRect().top - 4 < el.parentElement!.getBoundingClientRect().top
			);
			expect(clipped).toBe(false);
		}
	});
});

test.describe('Search filters on a phone', () => {
	test('pressing the last filter scrolls it, ring and all, into view', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/search');
		const row = page.getByRole('group', { name: 'Filter by tag' });
		// Clear all appears after the last tag once it is pressed, so skip it.
		const last = row.locator('button:not(.tag-tabs__clear)').last();
		await last.focus();
		await page.keyboard.press('Enter');
		await expect(last).toHaveAttribute('aria-pressed', 'true');
		await expect(last).toBeFocused();
		// The ring sits 4px outside the button (2px offset, 2px width).
		await expect
			.poll(() =>
				last.evaluate((el) => {
					const r = el.getBoundingClientRect();
					const clip = el.parentElement!.getBoundingClientRect();
					return r.left - 4 >= Math.max(0, clip.left) && r.right + 4 <= Math.min(390, clip.right);
				})
			)
			.toBe(true);
	});
});

test.describe('Recipe cards', () => {
	test('the author link is a 24px target at desktop', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/recipes');
		expect(await height(page, '.recipe-card a.meta-author')).toBeGreaterThanOrEqual(24);
	});
});

test.describe('Buttons', () => {
	test('under forced colours the primary button keeps its box, the ghost beside it unmoved', async ({
		page
	}) => {
		await page.goto('/');
		const compare = await page
			.getByRole('link', { name: 'Open the full comparison →' })
			.getAttribute('href');
		// A version that does not exist: the compare page's 400, with both buttons.
		await page.emulateMedia({ forcedColors: 'active' });
		await page.goto(compare!.replace(/to=\d+/, 'to=999'));
		const primary = page.getByRole('link', { name: 'Compare first and latest' });
		const ghost = page.getByRole('link', { name: 'Back to the recipe' });
		const box = (el: Element) => {
			const s = getComputedStyle(el);
			return { width: s.borderTopWidth, style: s.borderTopStyle };
		};
		const p = await primary.evaluate(box);
		expect(p.width).toBe('1px');
		expect(p.style).toBe('solid');
		expect((await primary.boundingBox())!.height).toBe((await ghost.boundingBox())!.height);
	});
});
