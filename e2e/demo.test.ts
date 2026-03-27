import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
	test('has an h1 heading', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toBeVisible();
	});

	test('shows at least one recipe card', async ({ page }) => {
		await page.goto('/');
		const cards = page.locator('a.recipe-card');
		await expect(cards.first()).toBeVisible();
	});

	test('recipe cards have a title', async ({ page }) => {
		await page.goto('/');
		const firstCard = page.locator('a.recipe-card').first();
		await expect(firstCard.locator('h3')).toBeVisible();
	});

	test('forked recipes show a "Forked" badge', async ({ page }) => {
		await page.goto('/');
		// At least one card should have the Forked badge (Brown Butter cookies is seeded as a fork)
		await expect(page.locator('.forked-badge').first()).toBeVisible();
	});

	test('navbar shows Login link when not authenticated', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
	});
});
