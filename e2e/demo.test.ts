import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
	test('has an h1 heading', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toBeVisible();
	});

	test('shows at least one recipe card', async ({ page }) => {
		await page.goto('/');
		const cards = page.locator('div.recipe-card');
		await expect(cards.first()).toBeVisible();
	});

	test('recipe cards have a title', async ({ page }) => {
		await page.goto('/');
		const firstCard = page.locator('div.recipe-card').first();
		await expect(firstCard.locator('h3')).toBeVisible();
	});

	test('forked recipes show a "Forked" badge', async ({ page }) => {
		await page.goto('/');
		// Non-forked cards keep .forked-badge in DOM (for layout) but with .forked-badge--hidden
		await expect(page.locator('.forked-badge:not(.forked-badge--hidden)').first()).toBeVisible();
	});

	test('navbar shows Login link when not authenticated', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
	});
});
