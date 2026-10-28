import { expect, test } from '@playwright/test';

test.describe('Search results', () => {
	test('cards carry the author, like the feed', async ({ page }) => {
		await page.goto('/search?q=cookies');
		const card = page.locator('div.recipe-card').first();
		await card.waitFor();

		// Parity with the homepage: search used to load no relations at all.
		await expect(card.locator('a[href^="/users/"]')).toHaveCount(1);
	});

	test('the search box is 16px on a phone, so iOS does not zoom it', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await page.goto('/search');
		const box = page.getByRole('searchbox');
		await box.waitFor();
		expect(await box.evaluate((el) => getComputedStyle(el).fontSize)).toBe('16px');
	});

	test('cards carry a version badge, like the feed', async ({ page }) => {
		await page.goto('/search?q=cookies');
		const card = page.locator('div.recipe-card').first();
		await card.waitFor();

		// versionCount/forkCount used to be attached only on "/" — search cards
		// rendered without the "v{n}" badge even though every recipe has a version.
		await expect(card.getByText(/^v\d+$/)).toBeVisible();
	});

	test('tags that match no recipe are not offered as filters', async ({ page }) => {
		await page.goto('/search');
		// "Filter by tag" sits in its own row; the tag buttons are a sibling row
		// one level up (see TagFilter.svelte) — walk up two levels to scope both.
		const filters = page.getByText('Filter by tag', { exact: false }).locator('../..');
		await filters.waitFor();

		// 'Unused' is seeded deliberately with no recipes attached.
		await expect(filters.getByText('Unused', { exact: true })).toHaveCount(0);
		await expect(filters.getByText('Dessert', { exact: true })).toHaveCount(1);
	});
});
