import { expect, test } from '@playwright/test';

test.describe('Auth pages', () => {
	test('login page renders an email input and password input', async ({ page }) => {
		await page.goto('/login');
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
	});

	test('login page has a submit button', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByRole('button', { name: /log in|sign in|login/i })).toBeVisible();
	});

	test('signup page renders an email input and password input', async ({ page }) => {
		await page.goto('/signup');
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
	});

	test('signup page has a submit button', async ({ page }) => {
		await page.goto('/signup');
		await expect(page.getByRole('button', { name: /sign up|create account|register/i })).toBeVisible();
	});

	test('new recipe page redirects unauthenticated users to login', async ({ page }) => {
		await page.goto('/recipes/new');
		// Should either redirect to /login or show an error — not the new recipe form
		const url = page.url();
		const isRedirected = url.includes('/login');
		const hasForm = await page.locator('input[name="title"]').isVisible().catch(() => false);
		// Either redirected OR no recipe form visible
		expect(isRedirected || !hasForm).toBe(true);
	});
});
