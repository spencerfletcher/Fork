import { expect, test } from '@playwright/test';

// Signed in as the seed user. The file name puts it in the chromium-auth
// project. Tests that need no favorites live in favorites.authenticated.test.ts.

test.describe('Navbar, signed in', () => {
	test('the avatar is a 44px target at desktop', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/cookbook');
		const avatar = (await page.locator('nav .nav-avatar-button').first().boundingBox())!;
		expect(avatar.height).toBeGreaterThanOrEqual(44);
		expect(avatar.width).toBeGreaterThanOrEqual(44);
	});

	test('/ is your Cookbook', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/cookbook$/);
		await expect(page.getByRole('heading', { level: 1, name: 'Cookbook' })).toBeVisible();
	});
});

test.describe('Cookbook filters', () => {
	test('All · Mine · Saved keep the search and the tags', async ({ page }) => {
		await page.goto('/cookbook?q=cookie&tags=dessert');
		const show = page.getByRole('group', { name: 'Show' });
		await expect(show.getByRole('link', { name: /^Saved/ })).toHaveAttribute(
			'href',
			'?q=cookie&tags=dessert&filter=saved'
		);
		await show.getByRole('link', { name: /^Mine/ }).click();
		await expect(page).toHaveURL(/filter=mine/);
		await expect(page.getByRole('searchbox')).toHaveValue('cookie');
	});
});

test.describe('Navbar at 768, signed in', () => {
	test('the bar holds one row: links, the initial and the action fit', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 900 });
		await page.goto('/cookbook');
		const bar = (await page.locator('nav').first().boundingBox())!;
		const items = page.locator(
			'nav .navbar-link, nav .nav-avatar-button, nav a[href="/recipes/new"]'
		);
		await expect(items.first()).toBeVisible();
		const boxes = await items.evaluateAll((els) =>
			els
				.filter((el) => el.checkVisibility())
				.map((el) => {
					const r = el.getBoundingClientRect();
					return {
						top: r.top,
						bottom: r.bottom,
						right: r.right,
						lines: el.getClientRects().length
					};
				})
		);
		// The four destinations, the avatar and + New recipe.
		expect(boxes.length).toBeGreaterThanOrEqual(6);
		for (const box of boxes) {
			expect(box.lines).toBe(1);
			expect(box.top).toBeGreaterThanOrEqual(bar.y);
			expect(box.bottom).toBeLessThanOrEqual(bar.y + bar.height);
			expect(box.right).toBeLessThanOrEqual(768);
		}
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
			768
		);
		// The initial stands for the account at every width: no handle, no Log out.
		await expect(page.locator('nav .nav-avatar').first()).toBeVisible();
		await expect(page.locator('nav').first()).not.toContainText('@spencerfletcher');
		await expect(page.getByRole('button', { name: 'Log out' })).toHaveCount(0);
	});
});
