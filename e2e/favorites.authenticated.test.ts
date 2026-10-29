import { expect, test } from '@playwright/test';

// Signed in as the seed user, who has favorited nothing; nothing here
// favorites anything. The file name puts it in the chromium-auth project.

test.describe('Favorites empty state', () => {
	test('sits left under the h1 at every width, as the page reads', async ({ page }) => {
		for (const width of [1280, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/favorites');
			const h1 = page.getByRole('heading', { level: 1, name: 'Favorites' });
			const empty = page.getByText(/No favorites yet/);
			await expect(empty).toBeVisible();
			expect(await empty.evaluate((el) => getComputedStyle(el).textAlign)).toBe('left');
			// The sentence starts on the h1's edge.
			const textLeft = await empty.evaluate((el) => {
				const range = document.createRange();
				range.selectNodeContents(el);
				return range.getClientRects()[0].left;
			});
			expect(Math.abs(textLeft - (await h1.boundingBox())!.x)).toBeLessThanOrEqual(1);
		}
	});
});
