import { expect, test, type Page } from '@playwright/test';
import { cookiesPath, gotoHydrated } from './helpers';
import { SEED } from '../src/lib/server/db/seedData';

// The recipe page on paper (DESIGN.md, Print), through print media emulation.

const DAL = SEED.find((r) => r.slug === 'red-lentil-dal')!.versions.at(-1)!.title;
const COOKIE_SERVES = SEED[0].versions.at(-1)!.servings!;

async function dalPath(page: Page) {
	await page.goto('/discover');
	const href = await page.getByRole('link', { name: DAL }).first().getAttribute('href');
	if (!href) throw new Error('No dal link on Discover');
	return href;
}

/** No element runs past the page's right edge. */
const overflowing = (page: Page) =>
	page.evaluate(() =>
		[...document.querySelectorAll('body *')]
			.filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
			.map((e) => e.tagName)
	);

for (const width of [390, 1280]) {
	test.describe(`printing at ${width}px`, () => {
		test.use({ viewport: { width, height: 900 } });

		test('the chrome hides; the title, version, groups and notes print', async ({ page }) => {
			await page.goto(await dalPath(page));
			await page.emulateMedia({ media: 'print' });

			await expect(page.getByRole('navigation', { name: 'Site' })).toBeHidden();
			await expect(page.locator('.hero')).toBeHidden();
			await expect(page.locator('.bar-row')).toBeHidden();
			await expect(page.locator('.section-tabs')).toBeHidden();
			await expect(page.locator('#recipe .serves')).toBeHidden();

			const head = page.locator('.print-header');
			await expect(head).toBeVisible();
			await expect(head).toContainText(DAL);
			await expect(head.locator('p').nth(2)).toHaveText(/^v\d+ · Serves 4\b/);

			// Both sections, whichever the phone tabs showed, with their groups and the tip.
			for (const name of ['Dal', 'Tarka', 'To finish']) {
				await expect(page.locator('#ingredients h3', { hasText: name })).toBeVisible();
				await expect(page.locator('#method h3', { hasText: name })).toBeVisible();
			}
			await expect(page.locator('#method')).toContainText('Pull the pan the moment');
			expect(await overflowing(page)).toEqual([]);
		});

		test('a scaled recipe prints the scale in effect, from cooking too', async ({ page }) => {
			const serves = COOKIE_SERVES * 2;
			await page.goto(`${await cookiesPath(page)}?cook=1&serves=${serves}`);
			await page.emulateMedia({ media: 'print' });

			await expect(page.locator('.cook-header')).toBeHidden();
			await expect(page.locator('.print-header')).toContainText(`Serves ${serves}, scaled 2x`);
			await expect(page.locator('.print-header')).not.toContainText('cook=1');
			await expect(page.locator('#ingredients')).toBeVisible();
			await expect(page.locator('#method')).toBeVisible();
			expect(await overflowing(page)).toEqual([]);
		});
	});
}

test('a ticked row prints un-struck and the tick circles go', async ({ page }) => {
	await page.goto(await cookiesPath(page));
	await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
	const row = page.locator('#ingredients label').first();
	await row.click();
	await page.emulateMedia({ media: 'print' });
	await expect(row).toHaveCSS('text-decoration-line', 'none');
	await expect(row.locator('.tick')).toBeHidden();
});

test('the screen never shows the print header', async ({ page }) => {
	await page.goto(await cookiesPath(page));
	await expect(page.locator('.print-header')).toBeHidden();
});

test('signed out, the ⋯ menu offers Print alone; it closes the menu and prints, the scale kept', async ({
	page
}) => {
	// The dialog itself is the browser's; the press is counted instead.
	await page.addInitScript(() => {
		(window as unknown as { printed: number }).printed = 0;
		window.print = () => void (window as unknown as { printed: number }).printed++;
	});
	const url = `${await cookiesPath(page)}?serves=${COOKIE_SERVES * 2}`;
	await gotoHydrated(page, url);
	const more = page.getByRole('button', { name: 'More actions' });
	await more.click();
	const menu = page.getByRole('menu', { name: 'More actions' });
	await expect(menu.getByRole('menuitem')).toHaveText(['Print']);
	await menu.getByRole('menuitem', { name: 'Print' }).click();
	await expect(menu).toBeHidden();
	await expect(more).toBeFocused();
	expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);
	await expect(page).toHaveURL(new RegExp(`\\?serves=${COOKIE_SERVES * 2}$`));
});
