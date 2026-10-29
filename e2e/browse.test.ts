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
