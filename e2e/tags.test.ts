/**
 * Tag page e2e tests.
 *
 * These run unauthenticated and rely on the seeded data:
 * - "Classic Chocolate Chip Cookies" tagged: Dessert, Baking, American
 * - "Chicken Tikka Masala" tagged: Dinner, Indian, Spicy
 */

import { test, expect } from '@playwright/test';

test.describe('Tag pages', () => {
	test('recipe cards link to tag pages', async ({ page }) => {
		await page.goto('/');
		// Tag links appear on recipe cards
		const firstTagLink = page.locator('a[href*="/tags/"]').first();
		await expect(firstTagLink).toBeVisible();
		await firstTagLink.click();
		await expect(page).toHaveURL(/\/tags\//);
	});

	test('tag page shows its tag name', async ({ page }) => {
		await page.goto('/tags/dessert');
		await expect(page.getByText(/dessert/i)).toBeVisible();
	});

	test('tag page shows recipes with that tag', async ({ page }) => {
		await page.goto('/tags/dessert');
		// Both cookie recipes are tagged Dessert
		await expect(page.getByText('Classic Chocolate Chip Cookies')).toBeVisible();
	});

	test('clicking a recipe card on a tag page navigates to the recipe', async ({ page }) => {
		await page.goto('/tags/dessert');
		await page.locator('a.recipe-card').first().click();
		await expect(page).toHaveURL(/\/recipes\//);
		await expect(page.locator('h1')).toBeVisible();
	});

	test('recipes on tag page link back to other tags', async ({ page }) => {
		await page.goto('/tags/indian');
		// Chicken Tikka Masala should appear
		await expect(page.getByText('Chicken Tikka Masala')).toBeVisible();
	});
});
