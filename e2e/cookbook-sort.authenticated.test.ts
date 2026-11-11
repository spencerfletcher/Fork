import { test, expect, type Page } from '@playwright/test';
import { gotoHydrated } from './helpers';

// The Cookbook's Sort (roadmap L04, C1), by the cook's own Journal. The seed
// user logged Chicken Tikka Masala on Sun 8 Nov and Weeknight Dal on Wed 4 Nov;
// other specs may log more, so the orders are checked as properties.

const sortBox = (page: Page) => page.getByRole('combobox', { name: 'Sort', exact: true });

/** Each card's title and whether its meta row ends in the cook's cooked fact. */
async function shelf(page: Page) {
	const cards = page.locator('.cookbook-grid .recipe-card');
	return Promise.all(
		(await cards.all()).map(async (card) => ({
			title: (await card.locator('h3').first().textContent())!.trim(),
			cooked: /^Cooked/.test(
				(await card.locator('.meta-row .meta-item').last().textContent())?.trim() ?? ''
			)
		}))
	);
}

const TIKKA = 'Chicken Tikka Masala';
const DAL = 'Weeknight Red Lentil Dal';

/** Where `title` is on the shelf; it must be there. */
function at(cards: { title: string }[], title: string) {
	const i = cards.findIndex((c) => c.title === title);
	expect(i, title).toBeGreaterThanOrEqual(0);
	return i;
}

test.describe('Cookbook Sort', () => {
	test('Recently cooked puts the cooked first, the latest first, and the URL says so', async ({
		page
	}) => {
		await gotoHydrated(page, '/cookbook?view=grid');
		await sortBox(page).selectOption({ label: 'Recently cooked' });
		await expect(page).toHaveURL(/[?&]sort=cooked(&|$)/);
		await expect(sortBox(page)).toBeFocused();
		const cards = await shelf(page);
		const firstUncooked = cards.findIndex((c) => !c.cooked);
		expect(cards.slice(firstUncooked).every((c) => !c.cooked)).toBe(true);
		expect(at(cards, TIKKA)).toBeLessThan(at(cards, DAL));
	});

	test('Not cooked lately puts the never cooked first, then the longest ago', async ({ page }) => {
		await gotoHydrated(page, '/cookbook?view=grid&sort=stale');
		await expect(sortBox(page)).toHaveValue('stale');
		const cards = await shelf(page);
		const firstCooked = cards.findIndex((c) => c.cooked);
		expect(cards.slice(firstCooked).every((c) => c.cooked)).toBe(true);
		expect(at(cards, DAL)).toBeLessThan(at(cards, TIKKA));
	});

	test('Title A to Z ignores case; Newest change is the bare URL again', async ({ page }) => {
		await gotoHydrated(page, '/cookbook?view=grid&sort=title');
		const titles = (await shelf(page)).map((c) => c.title.toLowerCase());
		expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'en')));
		await sortBox(page).selectOption({ label: 'Newest change' });
		await expect(page).toHaveURL(/\/cookbook\?view=grid$/);
	});

	test('a search ranks by best match, the Sort disabled until it is cleared', async ({ page }) => {
		await gotoHydrated(page, '/cookbook?sort=most&q=dal');
		await expect(sortBox(page)).toBeDisabled();
		await expect(sortBox(page).locator('option:checked')).toHaveText('Best match');
	});

	test('the Journal’s summary links to what has waited longest', async ({ page }) => {
		await page.goto('/journal');
		await page.getByRole('link', { name: 'What haven’t I made lately? →' }).click();
		await expect(page).toHaveURL(/\/cookbook\?sort=stale$/);
		await expect(sortBox(page)).toHaveValue('stale');
	});
});

test.describe('Cookbook Sort without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('the select submits with its Sort button, keeping the filters', async ({ page }) => {
		await page.goto('/cookbook?filter=mine');
		await sortBox(page).selectOption({ label: 'Most cooked' });
		await page.getByRole('button', { name: 'Sort', exact: true }).click();
		await expect(page).toHaveURL(/\/cookbook\?filter=mine&sort=most$/);
		await expect(sortBox(page)).toHaveValue('most');
	});
});
