import { expect, test } from '@playwright/test';

// Signed in as the seed user. The file name puts it in the chromium-auth
// project. Tests that need no favorites live in favorites.authenticated.test.ts.

test.describe('Navbar, signed in', () => {
	test('the handle is a 24px target at desktop', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/recipes');
		const handle = page.locator('nav a.username').first();
		expect((await handle.boundingBox())!.height).toBeGreaterThanOrEqual(24);
	});
});

test.describe('Navbar at 768, signed in', () => {
	test('the bar holds one row: links, handle and action fit, the handle loses only a few characters', async ({
		page
	}) => {
		await page.setViewportSize({ width: 768, height: 900 });
		await page.goto('/recipes');
		const bar = (await page.locator('nav').first().boundingBox())!;
		const items = page.locator('nav .navbar-link, nav a.username, nav a[href="/recipes/new"]');
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
		// Links, Log out, the handle and + New recipe.
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
		// The handle is what gives way when the bar is full, but only by a few
		// characters at 768: it is still the account, not a stub.
		const handle = await page
			.locator('nav a.username')
			.first()
			.evaluate((el) => ({ shown: el.clientWidth, whole: el.scrollWidth }));
		expect(handle.shown).toBeGreaterThanOrEqual(handle.whole * 0.75);
	});
});
