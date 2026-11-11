import { expect, test } from '@playwright/test';
import { COOKIES, gotoHydrated } from './helpers';

test.describe('Search results', () => {
	test('cards carry the author, like the feed', async ({ page }) => {
		await page.goto('/search?q=cookies');
		const card = page.locator('div.recipe-card').first();
		await card.waitFor();

		// Parity with the homepage: search used to load no relations at all.
		await expect(card.locator('a[href^="/users/"]')).toHaveCount(1);
	});

	test('cards carry a version mark from v2, like the feed; a v1 card has none', async ({
		page
	}) => {
		await page.goto('/search?q=cookies');
		// versionCount/forkCount used to be attached only on "/". The seed's
		// Thick and Chewy has three versions, Brown Butter one.
		const cards = page.locator('div.recipe-card');
		const edited = cards.filter({ hasText: 'Thick and Chewy' });
		await expect(edited.getByText(/^v3$/)).toBeVisible();
		const unedited = cards.filter({ hasText: 'Brown Butter' });
		await unedited.waitFor();
		await expect(unedited.getByText(/^v\d+$/)).toHaveCount(0);
	});

	test('tags that match no recipe are not offered as filters', async ({ page }) => {
		await page.goto('/search');
		const filters = page.getByRole('group', { name: 'Filters' });
		await filters.waitFor();

		// 'Unused' is seeded deliberately with no recipes attached.
		await expect(filters.getByText('Unused', { exact: true })).toHaveCount(0);
		await expect(filters.getByText('Dessert', { exact: true })).toHaveCount(1);
	});

	test('Clear filters with a query clears the tags only', async ({ page }) => {
		await page.goto('/search?q=zzzz&tags=dessert');
		await page.getByRole('link', { name: 'Clear filters' }).click();
		await expect(page).toHaveURL(/\/search\?q=zzzz$/);
		await expect(page.getByRole('searchbox')).toHaveValue('zzzz');
	});

	test('a new query keeps the tags; Clear search keeps them too', async ({ page }) => {
		await gotoHydrated(page, '/search?tags=dessert');
		await page.getByRole('searchbox').fill('zzzz');
		await page.getByRole('searchbox').press('Enter');
		await expect(page).toHaveURL(/[?&]tags=dessert/);
		await expect(page).toHaveURL(/[?&]q=zzzz/);
		await page.getByRole('link', { name: 'Clear search' }).click();
		await expect(page).toHaveURL(/\/search\?tags=dessert$/);
	});
});

test.describe('Search relevance', () => {
	const card = (page: import('@playwright/test').Page, title: string | RegExp) =>
		page.locator('div.recipe-card').filter({ hasText: title });

	test('the exact title comes first', async ({ page }) => {
		await page.goto('/search?q=' + encodeURIComponent('chicken tikka masala'));
		await expect(page.locator('div.recipe-card').first()).toContainText('Chicken Tikka Masala');
	});

	test('a match in the ingredients says so, the word marked', async ({ page }) => {
		await page.goto('/search?q=ginger');
		const match = card(page, 'Chicken Tikka Masala').locator('.card-match');
		await expect(match).toHaveText(/^Ingredient: fresh ginger/);
		await expect(match.locator('mark')).toHaveText('ginger');
	});

	test('a match only in an older version is found, labelled and ranked last', async ({ page }) => {
		// The seed's cookies were "Classic Chocolate Chip Cookies" until v3; the
		// brown-butter fork says "classic" in its current description.
		await page.goto('/search?q=classic');
		const cards = page.locator('div.recipe-card');
		await expect(card(page, COOKIES).locator('.card-match')).toHaveText(
			/^In an older version \(v2\): Classic Chocolate Chip Cookies/
		);
		await expect(card(page, 'Brown Butter').locator('.card-match')).toHaveText(/^Description: /);
		await expect(cards.last()).toContainText(COOKIES);
	});
});
