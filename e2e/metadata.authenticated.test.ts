import { expect, test } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';
import { gotoHydrated } from './helpers';

// devcooks' Shakshuka is Friends: the signed-in cook, a friend, may read it.
const SHAKSHUKA = SEED.find((r) => r.slug === 'shakshuka')!.versions.at(-1)!.title;

const PREVIEW_TAGS = [
	'meta[name="description"]',
	'link[rel="canonical"]',
	'meta[property^="og:"]',
	'meta[name^="twitter:"]',
	'script[type="application/ld+json"]'
];

test.describe('Metadata for pages not everyone may see', () => {
	test("a friend's Friends recipe has its title but noindex and no preview; signed out it is a bare 404", async ({
		page,
		browser
	}) => {
		await gotoHydrated(page, '/users/devcooks');
		await page.getByRole('link', { name: SHAKSHUKA, exact: true }).first().click();
		await page.waitForURL(/\/recipes\/shakshuka/);

		expect(await page.title()).toContain(SHAKSHUKA);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
		for (const selector of PREVIEW_TAGS) await expect(page.locator(selector)).toHaveCount(0);

		// A fresh context with no session: the visitor a shared link reaches.
		const guest = await browser.newContext({ storageState: { cookies: [], origins: [] } });
		const stranger = await guest.newPage();
		const response = await stranger.goto(page.url());
		expect(response?.status()).toBe(404);
		expect(await stranger.title()).not.toContain(SHAKSHUKA);
		await expect(stranger.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
		for (const selector of PREVIEW_TAGS) await expect(stranger.locator(selector)).toHaveCount(0);
		expect(await stranger.content()).not.toContain(SHAKSHUKA);
		await guest.close();
	});

	test('the Cookbook is noindex', async ({ page }) => {
		await page.goto('/cookbook');
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
		await expect(page.locator('meta[property="og:title"]')).toHaveCount(0);
	});
});
