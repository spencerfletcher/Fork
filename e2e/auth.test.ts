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
		await expect(
			page.getByRole('button', { name: /sign up|create account|register/i })
		).toBeVisible();
	});

	// Neither form is ever submitted here.
	test('"Log in" is the verb on the login page: tab, button and the navbar agree', async ({
		page
	}) => {
		await page.goto('/login');
		await expect(page).toHaveTitle('Log in — Fork');
		await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
		await expect(page.getByText(/sign in/i)).toHaveCount(0);
	});

	test('sent from favorites, the login subtitle says why', async ({ page }) => {
		await page.goto('/favorites');
		await expect(page).toHaveURL(/\/login\?redirectTo=/);
		await expect(page.locator('.auth-subtitle')).toHaveText('Log in to see your favorites');
	});

	test('sign-up states the username rules and says so in the field once the user leaves it', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/signup');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create an account');
		const rule = page.getByText('Usernames are 3 to 30 characters: letters, digits, - or _');
		await expect(rule).toBeHidden();
		await page.getByLabel('Username').fill('jo');
		await page.getByLabel('Username').blur();
		await expect(rule).toBeVisible();
		await page.getByLabel('Username').fill('jo_cooks');
		await page.getByLabel('Username').blur();
		await expect(rule).toBeHidden();
	});

	test('a rejected username is told to screen readers and its rule printed once', async ({
		page
	}) => {
		await page.goto('/signup');
		const field = page.getByLabel('Username');
		await field.fill('Jane Doe');
		await field.blur();
		await expect(field).toHaveAttribute('aria-invalid', 'true');
		await expect(field).toHaveAccessibleDescription(
			/^Usernames are 3 to 30 characters: letters, digits, - or _ Your public handle/
		);
		await expect(page.getByText('3 to 30 letters, digits, - or _.')).toHaveCount(0);
	});

	// Submits to the local Supabase stack, whose mail lands in its own inbox.
	test('"Forgot password?" leads to a reset form that says the link was sent, not whether the account exists', async ({
		page
	}) => {
		const email = process.env.E2E_USER_EMAIL ?? '';
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/login');
		const forgot = page.getByRole('link', { name: 'Forgot password?' });
		expect((await forgot.boundingBox())!.height).toBeGreaterThanOrEqual(24);
		await page.setViewportSize({ width: 390, height: 844 });
		expect((await forgot.boundingBox())!.height).toBeGreaterThanOrEqual(44);

		await forgot.click();
		await expect(page).toHaveURL('/forgot-password');
		await page.getByLabel('Email').fill(email);
		await page.getByRole('button', { name: 'Send reset link' }).click();

		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your email');
		await expect(
			page.getByText(`If ${email} has an account, a link to set a new password is on its way.`)
		).toBeVisible();
	});

	test('new recipe page redirects unauthenticated users to login', async ({ page }) => {
		await page.goto('/recipes/new');
		// Should either redirect to /login or show an error — not the new recipe form
		const url = page.url();
		const isRedirected = url.includes('/login');
		const hasForm = await page
			.locator('textarea[name="title"]')
			.isVisible()
			.catch(() => false);
		// Either redirected OR no recipe form visible
		expect(isRedirected || !hasForm).toBe(true);
	});
});
