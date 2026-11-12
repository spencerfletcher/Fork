import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './helpers';

// Show more, signed out, on the seed's public recipes. `?per=1` shrinks a
// page (it never grows one) so a few recipes make several pages.

const cards = (page: Page) => page.locator('.discover-grid > *');
const showMore = (page: Page) => page.getByRole('link', { name: 'Show more' });

test.describe('Show more, signed out', () => {
	test('appends the next page, says so, focuses it, and writes the pages into the URL', async ({
		page
	}) => {
		await gotoHydrated(page, '/discover?per=1');
		await expect(cards(page)).toHaveCount(1);
		// The heading counts the whole set, not the page.
		const total = Number((await page.locator('.order').innerText()).match(/(\d+) recipes?/)![1]);
		expect(total).toBeGreaterThan(1);

		await showMore(page).click();

		await expect(cards(page)).toHaveCount(2);
		await expect(page.getByText('1 more recipe', { exact: true })).toBeAttached();
		await expect(cards(page).nth(1)).toBeFocused();
		await expect(page).toHaveURL(/[?&]page=2(&|$)/);
	});

	test('Back from a recipe and a reload come back to every page shown, and the scroll', async ({
		page
	}) => {
		await gotoHydrated(page, '/discover?per=1');
		await showMore(page).click();
		await expect(cards(page)).toHaveCount(2);
		await expect(page).toHaveURL(/page=2/);
		const second = cards(page).nth(1);
		await second.scrollIntoViewIfNeeded();
		const y = await page.evaluate(() => window.scrollY);

		await second.locator('a[href^="/recipes/"]').first().click();
		await page.waitForURL(/\/recipes\//);
		await page.goBack();

		await expect(cards(page)).toHaveCount(2);
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(y);

		await page.reload();
		await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
		await expect(cards(page)).toHaveCount(2);
	});

	// The lead is not repeated in the grid: walked to the end, every card is a
	// different recipe, none the lead, and with the lead they are the count.
	test('the lead never comes back in the grid, on any page, and the count is the lead and the cards', async ({
		page
	}) => {
		await gotoHydrated(page, '/discover?per=3');
		const lead = await page.locator('.lead a[href^="/recipes/"]').getAttribute('href');
		const total = Number(
			(await page.locator('.order').innerText()).match(/(\d+) recipes? in all/)![1]
		);
		while ((await showMore(page).count()) > 0) {
			const before = await cards(page).count();
			await showMore(page).click();
			await expect.poll(() => cards(page).count()).toBeGreaterThan(before);
		}
		const hrefs = await cards(page)
			.locator('a.card-stretched-link')
			.evaluateAll((links) => links.map((a) => a.getAttribute('href')));
		expect(hrefs).not.toContain(lead);
		expect(new Set(hrefs).size).toBe(hrefs.length);
		expect(hrefs.length + 1).toBe(total);
	});

	test('a filter starts the list over at its first page', async ({ page }) => {
		await gotoHydrated(page, '/discover?per=1');
		await showMore(page).click();
		await expect(page).toHaveURL(/page=2/);
		await page.getByRole('searchbox').fill('chicken');
		await page.getByRole('searchbox').press('Enter');
		await expect(page).toHaveURL(/q=chicken/);
		await expect(page).not.toHaveURL(/page=/);
	});
});

test.describe('A profile, signed out', () => {
	test('shows one page of its recipes, counts them all, and Show more appends the next', async ({
		page
	}) => {
		const grid = page.locator('.recipe-grid > *');
		await gotoHydrated(page, '/users/spencerfletcher?per=1');
		await expect(grid).toHaveCount(1);
		const heading = await page.getByRole('heading', { level: 2 }).innerText();
		expect(Number(heading.match(/(\d+) recipes?/i)![1])).toBeGreaterThan(1);

		await showMore(page).click();

		await expect(grid).toHaveCount(2);
		await expect(grid.nth(1)).toBeFocused();
		await expect(page).toHaveURL(/[?&]page=2(&|$)/);
	});
});

test.describe('Show more without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('the link renders every page up to it', async ({ page }) => {
		await page.goto('/discover?per=1');
		await expect(cards(page)).toHaveCount(1);
		await showMore(page).click();
		await page.waitForURL(/page=2/);
		await expect(cards(page)).toHaveCount(2);
	});
});
