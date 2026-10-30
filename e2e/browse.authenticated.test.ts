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
