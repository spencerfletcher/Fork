import { expect, test } from '@playwright/test';

// Signed in as the seed user. The file name puts it in the chromium-auth
// project. Tests that need no favorites live in favorites.authenticated.test.ts.

test.describe('Navbar, signed in', () => {
	test('the handle is a 24px target at desktop', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/recipes');
		const handle = page.locator('nav a.username').first();
		expect((await handle.boundingBox())!.height).toBeGreaterThanOrEqual(24);
	});
});

test.describe('Page tops, signed in', () => {
	// Every list page starts at one spot: the h1 at the same y, then 24px to
	// the filter row if there is one, then 24px to the content.
	const top = (page: import('@playwright/test').Page, selector: string) =>
		page
			.locator(selector)
			.first()
			.evaluate((el) => el.getBoundingClientRect().top);
	const bottom = (page: import('@playwright/test').Page, selector: string) =>
		page
			.locator(selector)
			.first()
			.evaluate((el) => el.getBoundingClientRect().bottom);
	const content = 'main section, main .empty-state';

	test('the h1 lands at the same y on Recipes, My Recipes, Favorites and Search', async ({
		page
	}) => {
		for (const width of [1280, 390]) {
			await page.setViewportSize({ width, height: 900 });
			const ys: number[] = [];
			for (const path of ['/', '/recipes', '/favorites', '/search']) {
				await page.goto(path);
				ys.push(await top(page, 'h1'));
			}
			expect(new Set(ys).size).toBe(1);
		}
	});

	test('at desktop the tabs beside the title do not push the content down', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/recipes');
		const mine = await top(page, content);
		await page.goto('/');
		expect(await top(page, content)).toBe(mine);
	});

	test('on a phone the tab row sits 24px under the h1, as the search box does', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await page.goto('/search');
		const gap = (await top(page, '.search-filters')) - (await bottom(page, 'h1'));
		await page.goto('/');
		// The tab's text band: its box carries 15px of hit padding above.
		const tab = page.locator('.tag-tabs a').first();
		const text = await tab.evaluate(
			(el) => el.getBoundingClientRect().top + parseFloat(getComputedStyle(el).paddingTop)
		);
		expect(text - (await bottom(page, 'h1'))).toBeCloseTo(gap, 0);
		expect((await top(page, content)) - (await bottom(page, '.tag-tabs a'))).toBeCloseTo(24, 0);
	});
});
