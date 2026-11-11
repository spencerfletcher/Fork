import { expect, test } from '@playwright/test';

// Signed in as the seed user. The file name puts it in the chromium-auth
// project. Every test here needs an account with no saved recipes, which is
// the seed: global-setup resets fork_e2e before every run.

test.describe('Favorites, now the Cookbook’s Saved filter', () => {
	test('/favorites lands on Saved, keeping a search and tags', async ({ page }) => {
		await page.goto('/favorites?q=cookie&tags=dessert');
		await expect(page).toHaveURL(/\/cookbook\?q=cookie&tags=dessert&filter=saved$/);
		const saved = page.getByRole('group', { name: 'Show' }).getByRole('link', { name: /^Saved/ });
		await expect(saved).toHaveAttribute('aria-current', 'page');
	});

	test('with nothing saved, Saved keeps the filters and says 0 recipes match', async ({ page }) => {
		await page.goto('/cookbook?filter=saved');
		await expect(page.getByRole('searchbox')).toBeVisible();
		await expect(page.getByRole('status').filter({ hasText: 'match' })).toHaveText(
			'0 recipes match'
		);
	});
});
