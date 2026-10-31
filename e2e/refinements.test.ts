import { expect, test } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';

const publicSeed = SEED.filter((r) => r.isPublic);
const latestTitle = (r: (typeof SEED)[number]) => r.versions.at(-1)!.title;
const seededTags = [...new Set(publicSeed.flatMap((r) => r.tags))];

test.describe('Text search', () => {
	test('a query alone answers with the recipes that match', async ({ page }) => {
		const tikka = publicSeed.find((r) => r.tags.includes('Indian') && r.tags.includes('Spicy'))!;
		const response = await page.goto('/search?q=chicken');
		expect(response?.status()).toBe(200);
		await expect(page.locator('div.recipe-card', { hasText: latestTitle(tikka) })).toBeVisible();
	});

	test('a query and a tag answer with the recipes that match both', async ({ page }) => {
		const response = await page.goto('/search?q=chocolate&tags=dessert');
		expect(response?.status()).toBe(200);
		const expected = publicSeed.filter(
			(r) => r.tags.includes('Dessert') && /chocolate/i.test(latestTitle(r))
		);
		await expect(page.locator('div.recipe-card')).toHaveCount(expected.length);
	});
});

test.describe('Tag links', () => {
	test('every seeded tag resolves from the tag tabs', async ({ page }) => {
		await page.goto('/tags/dessert');
		const nav = page.getByRole('navigation', { name: 'Browse by tag' });
		for (const name of seededTags) {
			const href = await nav.getByRole('link', { name, exact: true }).getAttribute('href');
			const response = await page.request.get(href!);
			expect(response.status(), `${name} → ${href}`).toBe(200);
		}
	});

	test('every tag link on every seeded recipe page resolves', async ({ page }) => {
		for (const recipe of publicSeed) {
			await page.goto('/');
			await page
				.locator('div.recipe-card', { hasText: latestTitle(recipe) })
				.first()
				.click();
			await page.waitForURL(/\/recipes\//);
			for (const name of recipe.tags) {
				const href = await page
					.locator('main a[href^="/tags/"]', { hasText: name })
					.first()
					.getAttribute('href');
				const response = await page.request.get(href!);
				expect(response.status(), `${latestTitle(recipe)}: ${name} → ${href}`).toBe(200);
			}
		}
	});
});
