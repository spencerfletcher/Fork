import { expect, test, type Page } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';

// The compare page after Spencer's end-of-day decisions (29 October 2026).
// Seed: the cookies have three versions and v3 renames the recipe.
const COOKIES_RE = new RegExp(SEED[0].versions.at(-1)!.title, 'i');

async function openCookiesCompare(page: Page, query = '?from=2&to=3') {
	await page.goto('/recipes');
	await page.getByRole('link', { name: COOKIES_RE }).first().click();
	await page.waitForURL(/\/recipes\//);
	await page.goto(new URL(page.url()).pathname + '/diff' + query);
	await page.locator('article.version-card').first().waitFor();
}

test.describe('Compare page', () => {
	test('each diff panel is a list in the browser’s tree, one item per row', async ({ page }) => {
		await openCookiesCompare(page, '?from=1&to=3');
		for (const name of ['Details', 'Ingredients', 'Method']) {
			const list = page.getByRole('list', { name });
			const rows = await list.locator('.diff-row').count();
			expect(rows).toBeGreaterThan(0);
			await expect(list.getByRole('listitem')).toHaveCount(rows);
		}
	});

	test('the same version on both sides is named once in the tab', async ({ page }) => {
		await openCookiesCompare(page, '?from=2&to=2');
		await expect(page).toHaveTitle(/^v2 · same version · /);
	});

	test('a reversed pick goes to the ordered pair, focus on the picker holding the picked version', async ({
		page
	}) => {
		await openCookiesCompare(page, '?from=3&to=3');
		await page.getByLabel('To version').selectOption('2');
		await page.waitForURL(/\?from=2&to=3$/);
		const from = page.getByLabel('From version');
		await expect(from).toHaveValue('2');
		await expect(page.getByLabel('To version')).toHaveValue('3');
		await expect(from).toBeFocused();
	});

	test('a recipe that does not exist answers as the root page does: the private-recipe lede, home, and a search', async ({
		page
	}) => {
		const response = await page.goto('/recipes/does-not-exist/diff');
		expect(response?.status()).toBe(404);
		await expect(
			page.getByText('It may be an old link, or a recipe its author keeps private.')
		).toBeVisible();
		await expect(page.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
		await expect(page.getByRole('link', { name: 'Search recipes' })).toHaveAttribute(
			'href',
			'/search'
		);
	});
});
