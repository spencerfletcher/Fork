import { expect, test } from '@playwright/test';

// These tests assume the DB has been seeded with the demo data:
// - "Classic Chocolate Chip Cookies" (2 versions)
// - "Brown Butter Chocolate Chip Cookies" (forked, 1 version)
// - "Chicken Tikka Masala" (3 versions)

test.describe('Recipe detail page', () => {
	test('recipe cards on the home page link to detail pages', async ({ page }) => {
		await page.goto('/');
		const cards = page.locator('div.recipe-card');
		await expect(cards.first()).toBeVisible();
		// Clicking the first card navigates to a recipe detail
		await cards.first().click();
		await expect(page).toHaveURL(/\/recipes\//);
		await expect(page.locator('h1')).toBeVisible();
	});

	test('recipe detail shows Ingredients section', async ({ page }) => {
		await page.goto('/');
		await page.locator('div.recipe-card').first().click();
		// Use heading role to avoid matching ingredient names that contain "ingredients"
		await expect(page.getByRole('heading', { name: /^ingredients$/i })).toBeVisible();
	});

	test('recipe detail shows Steps section', async ({ page }) => {
		await page.goto('/');
		await page.locator('div.recipe-card').first().click();
		await expect(page.getByRole('heading', { name: /^steps$/i })).toBeVisible();
	});

	test('"Classic Chocolate Chip Cookies" shows version history with 2 versions', async ({
		page
	}) => {
		await page.goto('/');
		// Find the cookie recipe card by title
		await page.getByText('Classic Chocolate Chip Cookies').click();
		await expect(page).toHaveURL(/\/recipes\//);
		// Version history is inside a <details> — open it
		const summary = page.locator('details.version-history summary');
		await summary.click();
		// Should show "2 versions"
		await expect(page.getByText(/2 versions/i)).toBeVisible();
	});

	test('"Brown Butter Chocolate Chip Cookies" shows fork attribution', async ({ page }) => {
		await page.goto('/');
		await page.getByText('Brown Butter Chocolate Chip Cookies').click();
		await expect(page).toHaveURL(/\/recipes\//);
		await expect(page.getByText(/forked from/i)).toBeVisible();
		await expect(page.getByText(/Classic Chocolate Chip Cookies/i)).toBeVisible();
	});

	test('viewing a specific version shows the history banner', async ({ page }) => {
		await page.goto('/');
		// Click through to Classic Chocolate Chip Cookies
		await page.getByText('Classic Chocolate Chip Cookies').first().click();
		await page.waitForURL(/\/recipes\//);
		// Append ?version=1 to the current recipe URL
		const recipeUrl = page.url().split('?')[0];
		await page.goto(`${recipeUrl}?version=1`);
		await page.waitForLoadState('networkidle');
		// Banner: "Viewing v1: "..." — View current version →"
		await expect(page.locator('.history-banner')).toBeVisible();
		await expect(page.getByRole('link', { name: /view current version/i })).toBeVisible();
	});

	test('Compare link on v2 navigates to diff page', async ({ page }) => {
		await page.goto('/');
		await page.getByText('Classic Chocolate Chip Cookies').click();
		// Open version history
		await page.locator('details.version-history summary').click();
		// Click Compare on v2
		await page
			.getByRole('link', { name: /compare/i })
			.first()
			.click();
		await expect(page).toHaveURL(/\/diff/);
		await expect(page.locator('h1')).toContainText(/compare/i);
	});
});
