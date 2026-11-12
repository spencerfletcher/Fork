import { test, expect } from '@playwright/test';
import { collectionRow, gotoHydrated } from './helpers';

// The Cookbook's collection and tag picker (F3 hybrid, Spencer, 12 November
// 2026): one panel from either button, a tag keeps it open, a collection
// closes it with the tags kept. The seed user's To cook and tags; nothing is
// written, so other specs acting as the same cook do not matter.

const findBox = 'Find a collection or tag';

test.describe('Cookbook picker', () => {
	test('a tag applies and the panel stays; a collection applies, keeps the tag and closes', async ({
		page
	}) => {
		await gotoHydrated(page, '/cookbook');
		const tags = page.getByRole('button', { name: 'Tags', exact: true });
		await tags.click();
		await expect(page.getByRole('searchbox', { name: findBox })).toBeFocused();
		const menu = page.getByRole('menu', { name: 'Collections and tags' });
		const first = menu.getByRole('menuitemcheckbox').first();
		const name = (await first.textContent())!.trim();
		await first.click();
		await expect(page).toHaveURL(/[?&]tags=[^&]+/);
		await expect(menu.getByRole('menuitemcheckbox', { name, exact: true })).toHaveAttribute(
			'aria-checked',
			'true'
		);

		await page.keyboard.press('Escape');
		await expect(menu).toHaveCount(0);
		await expect(tags).toBeFocused();
		await expect(page.getByRole('link', { name: `Remove ${name}`, exact: true })).toBeVisible();

		await (await collectionRow(page, 'To cook')).click();
		await expect(page).toHaveURL(/[?&]collection=\d+/);
		await expect(page).toHaveURL(/[?&]tags=[^&]+/);
		await expect(menu).toHaveCount(0);
		await expect(
			page.getByRole('button', { name: 'Collection: To cook', exact: true })
		).toBeFocused();
	});

	test('opened at the tags, the find box finds a collection too', async ({ page }) => {
		await gotoHydrated(page, '/cookbook');
		await page.getByRole('button', { name: 'Tags', exact: true }).click();
		await page.getByRole('searchbox', { name: findBox }).fill('To cook');
		const menu = page.getByRole('menu', { name: 'Collections and tags' });
		await expect(menu.getByRole('group', { name: 'Collections', exact: true })).toBeVisible();
		await expect(menu.getByRole('menuitemradio', { name: /^To cook/ })).toBeVisible();
	});

	test.describe('on a phone', () => {
		test.use({ viewport: { width: 390, height: 844 } });

		test('the sheet leaves the keyboard down, and Show N recipes sits clear of the tab bar', async ({
			page
		}) => {
			await gotoHydrated(page, '/cookbook');
			await page.getByRole('button', { name: 'Collections', exact: true }).click();
			await expect(page.getByRole('searchbox', { name: findBox })).not.toBeFocused();
			await expect(page.getByRole('menuitemradio', { name: 'All collections' })).toBeFocused();

			const show = page.getByRole('button', { name: /^Show \d+ recipes?$/ });
			const box = (await show.boundingBox())!;
			expect(box.height).toBeGreaterThanOrEqual(44);
			// Nothing over its middle: not the tab bar, not the page.
			const top = await page.evaluate(
				([x, y]) => document.elementFromPoint(x, y)?.closest('button')?.textContent?.trim(),
				[box.x + box.width / 2, box.y + box.height / 2] as const
			);
			expect(top).toMatch(/^Show \d+ recipes?$/);

			await show.click();
			await expect(page.getByRole('menu', { name: 'Collections and tags' })).toHaveCount(0);
		});
	});
});
