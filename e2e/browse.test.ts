import { expect, test, type Page } from '@playwright/test';

// End-of-day decisions on the browse surfaces (Spencer, 29 October 2026).
// Assumes the seed: four public recipes.

const height = async (page: Page, selector: string) =>
	(await page.locator(selector).first().boundingBox())!.height;

test.describe('Landing page', () => {
	test("the seed's four recent cards: one row at 1280, two by two on a phone", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/');
		const cards = page.locator('.browse-section .recipe-card');
		await expect(cards).toHaveCount(4);
		const tops = async () =>
			new Set(await cards.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top)))
				.size;
		expect(await tops()).toBe(1);
		await page.setViewportSize({ width: 390, height: 900 });
		expect(await tops()).toBe(2);
	});

	test('six recent cards never take more than two rows; a phone scrolls them sideways', async ({
		page
	}) => {
		// The seed has four, so two copies stand in for the fifth and sixth.
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/');
		// Clone only after hydration, or Svelte's hydration puts the four back.
		await page.waitForLoadState('networkidle');
		const strip = page.locator('.recent-strip');
		await strip.evaluate((el) => {
			for (const card of [...el.children].slice(0, 2)) el.append(card.cloneNode(true));
		});
		const cards = strip.locator('.recipe-card');
		await expect(cards).toHaveCount(6);
		const rows = async () =>
			new Set(await cards.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top)))
				.size;
		for (const width of [1280, 1024, 768, 390]) {
			await page.setViewportSize({ width, height: 900 });
			expect(await rows(), `${width}px`).toBe(2);
		}

		// At 390 the strip runs edge to edge, scrolls, and the page does not.
		const box = await strip.evaluate((el) => {
			const r = el.getBoundingClientRect();
			const cards = el.querySelectorAll('.recipe-card');
			const card = cards[0].getBoundingClientRect();
			return {
				left: r.left,
				right: r.right,
				scrolls: el.scrollWidth > el.clientWidth,
				cardWidth: card.width,
				cardLeft: card.left,
				// Flowed by column, two to a column: the fifth card opens the third.
				thirdLeft: cards[4].getBoundingClientRect().left,
				page: document.documentElement.scrollWidth
			};
		});
		expect(box.left).toBe(0);
		expect(box.right).toBe(390);
		expect(box.scrolls).toBe(true);
		expect(box.page).toBe(390);
		// 2.25 columns on the 18px gutters, so the third peeks in at the edge
		// and says the strip scrolls: (390 - 36 - 24) / 2.25.
		expect(box.cardLeft).toBe(18);
		expect(box.cardWidth).toBeCloseTo((390 - 36 - 24) / 2.25, 0);
		expect(box.thirdLeft).toBeLessThan(390);
	});

	test('the hero h1 takes the site clamp and the lede sits on the ramp', async ({ page }) => {
		for (const width of [1280, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/recipes');
			const browse = await page.locator('h1').evaluate((el) => getComputedStyle(el).fontSize);
			await page.goto('/');
			const hero = page.locator('h1');
			expect(await hero.evaluate((el) => getComputedStyle(el).fontSize)).toBe(browse);
			expect(await page.locator('.hero-lede').evaluate((el) => getComputedStyle(el).fontSize)).toBe(
				'17px'
			);
		}
	});

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

test.describe('Landing sample on a phone', () => {
	test('below 700px the sample drops its Details panel, so the food comes sooner', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		const details = page.getByRole('heading', { name: 'Details' });
		await expect(details).toBeHidden();
		await expect(page.getByRole('heading', { name: 'Method' })).toBeVisible();
		// 1698 with Details shown (wave 3 sweep, 29 October 2026).
		const card = (await page.locator('.recent-strip .recipe-card').first().boundingBox())!;
		expect(card.y).toBeLessThan(1698);
		await page.setViewportSize({ width: 768, height: 1024 });
		await expect(details).toBeVisible();
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

	test("a pressed filter wears the browse tabs' current underline, moves no neighbour, Clear all ends the row", async ({
		page
	}) => {
		// The look to match: the browse page's current tab.
		await page.goto('/recipes');
		const current = await page
			.getByRole('navigation', { name: 'Browse by tag' })
			.getByRole('link', { name: 'All' })
			.evaluate((el) => {
				const s = getComputedStyle(el);
				return [s.color, s.fontWeight, s.borderBottomColor, s.borderBottomWidth];
			});

		for (const width of [1280, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/search?q=cookie');
			const row = page.getByRole('group', { name: 'Filter by tag' });
			const tags = row.locator('button:not(.tag-tabs__clear)');
			const lefts = () =>
				tags.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().left));
			const before = await lefts();
			const [first, second] = await tags.evaluateAll((els) =>
				els.slice(0, 2).map((el) => el.textContent!.trim().toLowerCase())
			);

			await tags.first().click();
			await expect(page).toHaveURL(new RegExp(`tags=${first}`));
			await expect(tags.first()).toHaveAttribute('aria-pressed', 'true');
			expect(await lefts()).toEqual(before);

			await page.goto(`/search?q=cookie&tags=${first},${second}`);
			const pressed = row.locator('button[aria-pressed="true"]');
			await expect(pressed).toHaveCount(2);
			for (const style of await pressed.evaluateAll((els) =>
				els.map((el) => {
					const s = getComputedStyle(el);
					return [s.color, s.fontWeight, s.borderBottomColor, s.borderBottomWidth];
				})
			)) {
				expect(style).toEqual(current);
			}
			await expect(row.getByRole('button').last()).toHaveText('Clear all');
		}
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

test.describe('Spacing', () => {
	test('search results sit on the 8px scale under the filters', async ({ page }) => {
		await page.goto('/search?q=cookie');
		const margin = await page
			.locator('section.results')
			.evaluate((el) => getComputedStyle(el).marginTop);
		expect(margin).toBe('24px');
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

test.describe('Fonts', () => {
	test('the mono fallback face resolves to a local Menlo', async ({ page }) => {
		// Chromium matches local() by full or PostScript name: "Menlo Regular", not "Menlo".
		test.skip(process.platform !== 'darwin', 'Menlo ships with macOS only');
		await page.goto('/recipes');
		const status = await page.evaluate(async () => {
			await document.fonts.load('12px "JetBrains Mono Fallback"');
			return [...document.fonts].find((f) => f.family.includes('JetBrains Mono Fallback'))?.status;
		});
		expect(status).toBe('loaded');
	});

	test('the 600 weights are preloaded with the regular faces', async ({ page }) => {
		await page.goto('/recipes');
		const preloads = await page
			.locator('link[rel="preload"][as="font"]')
			.evaluateAll((els) => els.map((el) => el.getAttribute('href')!.split('/').pop()));
		expect(preloads).toEqual(
			expect.arrayContaining([
				'bitter-latin-600-normal.woff2',
				'source-sans-3-latin-600-normal.woff2',
				'jetbrains-mono-latin-600-normal.woff2'
			])
		);
	});
});
