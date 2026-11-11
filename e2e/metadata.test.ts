import { expect, test, type Page } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';
import { parseIngredientText } from '../src/lib/recipes/ingredients';
import { COOKIES, cookiesPath } from './helpers';

// Signed out, as a crawler or a link preview sees the seed's public cookies.
const LATEST = SEED[0].versions.at(-1)!;

const content = (page: Page, selector: string) =>
	page.locator(selector).first().getAttribute('content');

async function recipeData(page: Page) {
	const scripts = page.locator('script[type="application/ld+json"]');
	await expect(scripts).toHaveCount(1);
	return JSON.parse((await scripts.textContent())!);
}

test.describe('Public recipe metadata', () => {
	test('a public recipe previews with absolute URLs and carries Recipe data', async ({ page }) => {
		const path = await cookiesPath(page);
		await page.goto(`${path}?serves=96`);
		const origin = new URL(page.url()).origin;

		expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(origin + path);
		expect(await content(page, 'meta[property="og:url"]')).toBe(origin + path);
		expect(await content(page, 'meta[property="og:title"]')).toBe(COOKIES);
		expect(await content(page, 'meta[property="og:image"]')).toBe(LATEST.imageUrl);
		expect(await content(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

		const data = await recipeData(page);
		expect(data).toMatchObject({ '@type': 'Recipe', name: COOKIES, url: origin + path });
		expect(data.recipeIngredient).toHaveLength(parseIngredientText(LATEST.ingredientsText).length);
		expect(data).not.toHaveProperty('totalTime');
	});

	test('an earlier version names the latest as canonical and carries no Recipe data', async ({
		page
	}) => {
		const path = await cookiesPath(page);
		await page.goto(`${path}?version=1`);
		const origin = new URL(page.url()).origin;
		expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(origin + path);
		expect(await content(page, 'meta[property="og:title"]')).toBe(SEED[0].versions[0].title);
		await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
	});

	test('robots.txt keeps crawlers out of the signed-in areas only', async ({ request }) => {
		const robots = await (await request.get('/robots.txt')).text();
		expect(robots).toContain('Disallow: /cookbook');
		expect(robots).not.toMatch(/Disallow: \/recipes\/?$/m);
	});
});
