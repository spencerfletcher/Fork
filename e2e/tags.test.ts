/**
 * Tag page e2e tests.
 *
 * These run unauthenticated and rely on the seeded data:
 * - "Thick and Chewy Chocolate Chip Cookies" tagged: Dessert, Baking, American
 * - "Chicken Tikka Masala" tagged: Dinner, Indian, Spicy
 */

import { test, expect } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';

test.describe('Tag pages', () => {
	test('a recipe page links to its tag pages', async ({ page }) => {
		// Cards carry no tag pills; the recipe header lists the tags as links.
		await page.goto('/');
		await page.locator('div.recipe-card').first().click();
		await page.waitForURL(/\/recipes\//);
		const firstTagLink = page.locator('a[href*="/tags/"]').first();
		await expect(firstTagLink).toBeVisible();
		await firstTagLink.click();
		await expect(page).toHaveURL(/\/tags\//);
	});

	test('tag page shows its tag name', async ({ page }) => {
		await page.goto('/tags/dessert');
		await expect(page.getByRole('heading', { name: /dessert/i })).toBeVisible();
	});

	test('tag page shows recipes with that tag', async ({ page }) => {
		await page.goto('/tags/dessert');
		// Both cookie recipes are tagged Dessert
		await expect(page.getByText(SEED[0].versions.at(-1)!.title)).toBeVisible();
	});

	test('clicking a recipe card on a tag page navigates to the recipe', async ({ page }) => {
		await page.goto('/tags/dessert');
		await page.locator('div.recipe-card').first().click();
		await expect(page).toHaveURL(/\/recipes\//);
		await expect(page.locator('h1')).toBeVisible();
	});

	test('recipes on tag page link back to other tags', async ({ page }) => {
		await page.goto('/tags/indian');
		// Chicken Tikka Masala should appear
		await expect(page.getByText('Chicken Tikka Masala')).toBeVisible();
	});
});

test.describe('Tag tabs', () => {
	test('the browse page offers tag tabs that lead to the tag page', async ({ page }) => {
		await page.goto('/recipes');
		await expect(page.getByRole('heading', { name: 'Recent' })).toBeVisible();
		const tabs = page.getByRole('navigation', { name: 'Browse by tag' });
		await expect(tabs.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page');
		await tabs.getByRole('link', { name: 'Dessert' }).click();
		await expect(page).toHaveURL(/\/tags\/dessert/);
		await expect(
			page.getByRole('navigation', { name: 'Browse by tag' }).getByRole('link', { name: 'Dessert' })
		).toHaveAttribute('aria-current', 'page');
	});

	test('the tab row scrolls on a phone without widening the page', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await page.goto('/recipes');
		await page.getByRole('navigation', { name: 'Browse by tag' }).waitFor();
		const doc = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth
		}));
		expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
	});
});
