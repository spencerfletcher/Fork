import { expect, test } from '@playwright/test';

// Signed in as the seed user. The file name puts it in the chromium-auth
// project. Every test here needs an account with no favorites, which is the
// seed: global-setup resets fork_e2e before every run.

test.describe('Favorites, with none', () => {
	test('the empty state sits left under the h1 at every width, as the page reads', async ({
		page
	}) => {
		for (const width of [1280, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/favorites');
			const h1 = page.getByRole('heading', { level: 1, name: 'Favorites' });
			const empty = page.getByText(/No favorites yet/);
			await expect(empty).toBeVisible();
			expect(await empty.evaluate((el) => getComputedStyle(el).textAlign)).toBe('left');
			// The sentence starts on the h1's edge.
			const textLeft = await empty.evaluate((el) => {
				const range = document.createRange();
				range.selectNodeContents(el);
				return range.getClientRects()[0].left;
			});
			expect(Math.abs(textLeft - (await h1.boundingBox())!.x)).toBeLessThanOrEqual(1);
		}
	});

	test('the page is just the empty state, and its link is a thumb target on a phone', async ({
		page
	}) => {
		// A search box over an empty list invites a query with nothing to find
		// (decided 29 October 2026).
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/favorites');
		await expect(page.getByRole('heading', { level: 1, name: 'Favorites' })).toBeVisible();
		await expect(page.getByRole('searchbox')).toHaveCount(0);
		const explore = page.getByRole('link', { name: /explore recipes/i });
		await expect(explore).toBeVisible();
		const box = await explore.boundingBox();
		expect(box!.height).toBeGreaterThanOrEqual(44);
	});

	test('a query in the URL still reads "No favorites yet", with no filters', async ({ page }) => {
		await page.goto('/favorites?q=cookie&tags=dessert');
		await expect(page.getByText(/No favorites yet/)).toBeVisible();
		await expect(page.getByText(/No favorites match/)).toHaveCount(0);
		await expect(page.getByRole('searchbox')).toHaveCount(0);
	});

	test('"Explore recipes →" is a 24px target at desktop', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/favorites');
		const explore = page.getByRole('link', { name: 'Explore recipes →' });
		expect((await explore.boundingBox())!.height).toBeGreaterThanOrEqual(24);
	});
});
