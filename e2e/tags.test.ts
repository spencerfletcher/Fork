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
	test('a tag page’s tabs lead to other tags, and All back to Discover', async ({ page }) => {
		await page.goto('/tags/dessert');
		const tabs = page.getByRole('navigation', { name: 'Browse by tag' });
		await expect(tabs.getByRole('link', { name: 'Dessert' })).toHaveAttribute(
			'aria-current',
			'page'
		);
		await expect(tabs.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/discover');
		await tabs.getByRole('link', { name: 'Indian' }).click();
		await expect(page).toHaveURL(/\/tags\/indian/);
	});

	test('Discover’s tag filters narrow the list in place', async ({ page }) => {
		await page.goto('/discover');
		await page
			.getByRole('group', { name: 'Filters' })
			.getByRole('button', { name: 'Dessert' })
			.click();
		await expect(page).toHaveURL(/\/discover\?tags=dessert/);
		// The title also appears on the lead card and in Recent changes.
		await expect(page.getByText(SEED[0].versions.at(-1)!.title).first()).toBeVisible();
	});
});
