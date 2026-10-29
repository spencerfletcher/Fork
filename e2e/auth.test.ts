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

	for (const [path, name] of [['/login', 'Create one']] as const) {
		test(`on ${path} the "${name}" switch link is a 44px target on a phone, 24px at desktop, without moving`, async ({
			page
		}) => {
			await page.setViewportSize({ width: 1280, height: 900 });
			await page.goto(path);
			const link = page.locator('.auth-switch').getByRole('link', { name });
			const line = page.locator('.auth-switch');
			expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(24);
			await page.setViewportSize({ width: 390, height: 844 });
			const before = (await line.boundingBox())!;
			expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
			// The padding is pulled back by margin: the sentence keeps its line box.
			const lineHeight = await line.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
			expect(before.height).toBeLessThan(lineHeight * 1.5);
		});
	}

	test('sign-up states the username rules and says so in the field once the user leaves it', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/signup');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create an Account');
		const rule = page.getByText('Usernames are 3 to 30 characters: letters, digits, - or _');
		await expect(rule).toBeHidden();
		await page.getByLabel('Username').fill('jo');
		await page.getByLabel('Username').blur();
		await expect(rule).toBeVisible();
		await page.getByLabel('Username').fill('jo_cooks');
		await page.getByLabel('Username').blur();
		await expect(rule).toBeHidden();
	});

	test('a link inside the auth alert is underlined and stays on one line', async ({ page }) => {
		// The alert only renders after a submission; build one with the page's
		// own classes rather than submit the form.
		await page.goto('/signup');
		const style = await page.evaluate(() => {
			const alert = document.createElement('div');
			alert.className = 'auth-error';
			alert.innerHTML = 'That email already has an account. <a href="/login">Log in</a>';
			document.querySelector('.auth-card')!.prepend(alert);
			const s = getComputedStyle(alert.querySelector('a')!);
			return { line: s.textDecorationLine, wrap: s.whiteSpace };
		});
		expect(style).toEqual({ line: 'underline', wrap: 'nowrap' });
	});

	test('new recipe page redirects unauthenticated users to login', async ({ page }) => {
		await page.goto('/recipes/new');
		// Should either redirect to /login or show an error — not the new recipe form
		const url = page.url();
		const isRedirected = url.includes('/login');
		const hasForm = await page
			.locator('input[name="title"]')
			.isVisible()
			.catch(() => false);
		// Either redirected OR no recipe form visible
		expect(isRedirected || !hasForm).toBe(true);
	});
});
