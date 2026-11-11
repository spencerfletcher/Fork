import { test, expect, type Page } from '@playwright/test';
import { createRecipe, gotoHydrated, postAction, uniqueTitle } from './helpers';

// The Cookbook's Grid | List (roadmap L01, A1): links, so it works before
// JavaScript; the choice goes into the URL and this device's cookie, which the
// server reads, so the first paint is already the cook's view. The seed logs
// Chicken Tikka Masala once, on Sun 8 Nov, by the seed user.

const views = (page: Page) => page.getByRole('group', { name: 'View' });
const viewLink = (page: Page, name: 'Grid' | 'List') =>
	views(page).getByRole('link', { name, exact: true });
const rows = (page: Page) => page.getByRole('list', { name: 'Recipes', exact: true });

test.describe('Cookbook Grid | List', () => {
	test('List shows a row per card, and this device keeps it until Grid is chosen', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await gotoHydrated(page, '/cookbook');
		await expect(viewLink(page, 'Grid')).toHaveAttribute('aria-current', 'page');

		await viewLink(page, 'List').click();
		await expect(page).toHaveURL(/\/cookbook\?view=list$/);
		await expect(rows(page)).toBeVisible();
		// Other specs add and trash the seed cook's recipes meanwhile, so the rows
		// are counted against this same page's All, not an earlier grid.
		const all = Number(
			await page
				.getByRole('group', { name: 'Show' })
				.locator('a')
				.first()
				.locator('.n')
				.textContent()
		);
		await expect(rows(page).getByRole('listitem')).toHaveCount(all);
		await expect(viewLink(page, 'List')).toHaveAttribute('aria-current', 'page');
		const tikka = rows(page).getByRole('listitem').filter({ hasText: 'Chicken Tikka Masala' });
		await expect(tikka.locator('.row-cooked')).toHaveText('Cooked on Sun 8 Nov');

		// The bare URL is the device's choice now, painted by the server.
		const html = await (await page.request.get('/cookbook')).text();
		expect(html).toContain('aria-label="Recipes"');
		await page.goto('/cookbook');
		await expect(rows(page)).toBeVisible();
		await expect(page.locator('.cookbook-grid')).toHaveCount(0);

		await viewLink(page, 'Grid').click();
		await expect(page).toHaveURL(/\/cookbook\?view=grid$/);
		await page.goto('/cookbook');
		await expect(page.locator('.cookbook-grid')).toBeVisible();
	});

	test('the view keeps the filters and survives Show more', async ({ page }) => {
		await gotoHydrated(page, '/cookbook?filter=mine&per=1&view=list');
		await expect(rows(page).getByRole('listitem')).toHaveCount(1);
		await page.getByRole('link', { name: 'Show more' }).click();
		await expect(rows(page).getByRole('listitem')).toHaveCount(2);
		await expect(viewLink(page, 'Grid')).toHaveAttribute('href', '?filter=mine&per=1&view=grid');
	});

	test('a row’s ⋯ is the card’s: Move to Trash takes the row away in place', async ({ page }) => {
		const title = uniqueTitle('E2E Row menu');
		const slug = (await createRecipe(page, title)).split('/').pop()!;
		try {
			const listUrl = `/cookbook?filter=mine&view=list&q=${encodeURIComponent(title)}`;
			await gotoHydrated(page, listUrl);
			const row = rows(page).getByRole('listitem').filter({ hasText: title });
			await row.getByRole('button', { name: `More actions for ${title}` }).click();
			await page.getByRole('menuitem', { name: 'Move to Trash' }).click();
			await page.getByRole('button', { name: 'Move to Trash' }).click();
			await expect(page.getByRole('status').filter({ hasText: 'Moved' })).toHaveText(
				`Moved ${title} to your Trash. Open Trash`
			);
			await expect(page).toHaveURL(listUrl);
			await expect(row).toHaveCount(0);
		} finally {
			await postAction(page, '/cookbook/trash?/deleteForever', { slug });
		}
	});

	test('on a phone the cards are two across, and the ⋯ and the cooked line fit inside one', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/cookbook?view=grid');
		const cards = page.locator('.cookbook-grid .recipe-card');
		const [first, second] = [
			(await cards.nth(0).boundingBox())!,
			(await cards.nth(1).boundingBox())!
		];
		expect(Math.abs(first.y - second.y)).toBeLessThan(1);
		const card = cards.filter({ hasText: 'Chicken Tikka Masala' });
		const box = (await card.boundingBox())!;
		const more = (await card.getByRole('button', { name: /^More actions for/ }).boundingBox())!;
		const cooked = (await card.locator('.meta-item').last().boundingBox())!;
		expect(more.x + more.width).toBeLessThanOrEqual(box.x + box.width + 1);
		expect(cooked.x + cooked.width).toBeLessThanOrEqual(box.x + box.width + 1);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
	});

	test('on a phone the List row folds the cooked fact into its meta line', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/cookbook?view=list');
		const tikka = rows(page).getByRole('listitem').filter({ hasText: 'Chicken Tikka Masala' });
		await expect(tikka.locator('.row-cooked')).toBeHidden();
		await expect(tikka.locator('.row-meta .fold-cooked')).toHaveText('Cooked on Sun 8 Nov');
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
	});
});

test.describe('Cookbook Grid | List without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('the switch is two plain links', async ({ page }) => {
		await page.goto('/cookbook');
		await viewLink(page, 'List').click();
		await expect(page).toHaveURL(/\/cookbook\?view=list$/);
		await expect(rows(page)).toBeVisible();
	});
});
