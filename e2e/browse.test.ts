import { expect, test, type Page } from '@playwright/test';

// End-of-day decisions on the browse surfaces (Spencer, 29 October 2026).
// Assumes the seed: four public recipes.

const height = async (page: Page, selector: string) =>
	(await page.locator(selector).first().boundingBox())!.height;

test.describe('Landing page', () => {
	test('four recent cards: one row at 1280, two by two on a phone', async ({ page }) => {
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
