import { expect, test } from '@playwright/test';

// Signed in as the seed user, who has favorited nothing; nothing here
// favorites anything. The file name puts it in the chromium-auth project.

test.describe('Navbar, signed in', () => {
	test('the handle is a 24px target at desktop', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/recipes');
		const handle = page.locator('nav a.username').first();
		expect((await handle.boundingBox())!.height).toBeGreaterThanOrEqual(24);
	});
});

test.describe('Favorites, end-of-day decisions', () => {
	test('a query in the URL with no favorites still reads "No favorites yet", with no filters', async ({
		page
	}) => {
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
