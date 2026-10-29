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
			const card = el.querySelector('.recipe-card')!.getBoundingClientRect();
			return {
				left: r.left,
				right: r.right,
				scrolls: el.scrollWidth > el.clientWidth,
				cardWidth: card.width,
				cardLeft: card.left,
				page: document.documentElement.scrollWidth
			};
		});
		expect(box.left).toBe(0);
		expect(box.right).toBe(390);
		expect(box.scrolls).toBe(true);
		expect(box.page).toBe(390);
		// Two columns' width on the 18px gutters: (390 - 36 - 24) / 2.
		expect(box.cardLeft).toBe(18);
		expect(box.cardWidth).toBeCloseTo((390 - 36 - 24) / 2, 0);
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

	test('on a phone, two pressed pills keep a gap, the first is not clipped, Clear all is in view', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/search?q=cookie');
		const row = page.getByRole('group', { name: 'Filter by tag' });
		const tags = row.locator('button:not(.tag-tabs__clear)');
		const [first, second] = await tags.evaluateAll((els) =>
			els.slice(0, 2).map((el) => el.textContent!.trim().toLowerCase())
		);
		await page.goto(`/search?q=cookie&tags=${first},${second}`);
		await expect(row.locator('button[aria-pressed="true"]')).toHaveCount(2);

		// The pill is drawn by ::before; read its box from the button's rect.
		const pills = await row.locator('button[aria-pressed="true"]').evaluateAll((els) =>
			els.map((el) => {
				const r = el.getBoundingClientRect();
				const s = getComputedStyle(el, '::before');
				return { left: r.left + parseFloat(s.left), right: r.right - parseFloat(s.right) };
			})
		);
		expect(pills[1].left - pills[0].right).toBeGreaterThanOrEqual(4);
		const clip = await row.evaluate((el) => el.getBoundingClientRect().left);
		expect(pills[0].left).toBeGreaterThan(clip);

		const clear = row.getByRole('button', { name: 'Clear all' });
		const box = (await clear.boundingBox())!;
		expect(box.x).toBeGreaterThanOrEqual(0);
		expect(box.x + box.width).toBeLessThanOrEqual(390);
	});

	test('a pressed filter with focus wears the ring on its pill, inside the row', async ({
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
				const own = getComputedStyle(el);
				const pill = getComputedStyle(el, '::before');
				return {
					button: own.outlineStyle,
					pill: pill.outlineStyle,
					width: pill.outlineWidth,
					offset: pill.outlineOffset,
					focused: el.matches(':focus-visible')
				};
			});
			expect(ring).toEqual({
				button: 'none',
				pill: 'solid',
				width: '2px',
				offset: '2px',
				focused: true
			});
			// The ring's top edge (pill top minus offset and width) is not clipped
			// by the scrolling row.
			const clipped = await dessert.evaluate((el) => {
				const r = el.getBoundingClientRect();
				const top = r.top + parseFloat(getComputedStyle(el, '::before').top) - 4;
				return top < el.parentElement!.getBoundingClientRect().top;
			});
			expect(clipped).toBe(false);
		}
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
