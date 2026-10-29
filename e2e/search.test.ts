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

	test('cards carry a version mark from v2, like the feed; a v1 card has none', async ({
		page
	}) => {
		await page.goto('/search?q=cookies');
		// versionCount/forkCount used to be attached only on "/". The seed's
		// Thick and Chewy has three versions, Brown Butter one.
		const cards = page.locator('div.recipe-card');
		const edited = cards.filter({ hasText: 'Thick and Chewy' });
		await expect(edited.getByText(/^v3$/)).toBeVisible();
		const unedited = cards.filter({ hasText: 'Brown Butter' });
		await unedited.waitFor();
		await expect(unedited.getByText(/^v\d+$/)).toHaveCount(0);
	});

	test('tags that match no recipe are not offered as filters', async ({ page }) => {
		await page.goto('/search');
		const filters = page.getByRole('group', { name: 'Filter by tag' });
		await filters.waitFor();

		// 'Unused' is seeded deliberately with no recipes attached.
		await expect(filters.getByText('Unused', { exact: true })).toHaveCount(0);
		await expect(filters.getByText('Dessert', { exact: true })).toHaveCount(1);
	});

	test('the empty-state links are 24px targets at desktop and 44px on a phone', async ({
		page
	}) => {
		for (const [url, name] of [
			['/search?q=zzzz', 'Clear search'],
			['/search?q=zzzz&tags=dessert', 'Clear filters']
		]) {
			await page.setViewportSize({ width: 1280, height: 900 });
			await page.goto(url);
			const link = page.getByRole('link', { name });
			const desktop = (await link.boundingBox())!;
			expect(desktop.height).toBeGreaterThanOrEqual(24);
			// The text keeps its size and weight: only the hit grows.
			expect(await link.evaluate((el) => getComputedStyle(el).fontSize)).toBe('16px');
			expect(await link.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('400');
			await page.setViewportSize({ width: 390, height: 900 });
			expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
		}
	});

	test('Clear filters with a query clears the tags only', async ({ page }) => {
		await page.goto('/search?q=zzzz&tags=dessert');
		await page.getByRole('link', { name: 'Clear filters' }).click();
		await expect(page).toHaveURL(/\/search\?q=zzzz$/);
		await expect(page.getByRole('searchbox')).toHaveValue('zzzz');
	});
});
