import { expect, test } from '@playwright/test';

test.describe('Search results', () => {
	test('cards carry the author and tags, like the feed', async ({ page }) => {
		await page.goto('/search?q=cookies');
		const card = page.locator('div.recipe-card').first();
		await card.waitFor();

		// Parity with the homepage: search used to load no relations at all.
		await expect(card.locator('a[href^="/users/"]')).toHaveCount(1);
		expect(await card.locator('.tag').count()).toBeGreaterThan(0);
	});
});
