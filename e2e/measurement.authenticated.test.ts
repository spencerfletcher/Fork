import { expect, test, type Page } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';
import { parseIngredientText } from '../src/lib/recipes/ingredients';
import { convertIngredient } from '../src/lib/recipes/convert';
import { gotoHydrated, openCookies } from './helpers';

// Signed in as the seed user. The preference goes back to As written in a
// finally, since other files read recipe pages as this user.

// The cookies' latest version is written in US units; its first row is flour
// in cups, which Metric shows in millilitres.
const flour = parseIngredientText(SEED[0].versions.at(-1)!.ingredientsText)[0];
const metric = convertIngredient(flour, null, 'metric');
const converted = metric.ingredient.text.slice(0, -flour.name.length).trim();
const written = metric.written!;

async function saveMeasurement(page: Page, choice: 'As written' | 'Metric' | 'US') {
	await gotoHydrated(page, '/settings');
	const box = page.getByRole('region', { name: 'Measurement' });
	await box.getByRole('radio', { name: choice }).check();
	await box.getByRole('button', { name: 'Save' }).click();
	// The choice group's hint is a status too; the Save row's is the one that says Saved.
	await expect(box.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible();
}

const flourRow = (page: Page) =>
	page.locator('#ingredients label').filter({ hasText: flour.name }).first();

test('Metric in Settings converts a US recipe on its page, in clay, and As written puts it back', async ({
	page
}) => {
	try {
		await saveMeasurement(page, 'Metric');
		await openCookies(page);
		const measure = flourRow(page).locator('.font-semibold');
		await expect(measure).toHaveText(converted);
		await expect(measure).toHaveClass(/text-accent/);
		await expect(flourRow(page)).toContainText(`written as (${written}`);
		await expect(page.getByText('Converted to metric; as written in parentheses.')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Change in Settings' })).toHaveAttribute(
			'href',
			'/settings#measurement-heading'
		);

		// The longest converted rows still fit a 320px phone: nothing scrolls sideways.
		await page.setViewportSize({ width: 320, height: 640 });
		await expect
			.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
			.toBe(true);
	} finally {
		await page.setViewportSize({ width: 1280, height: 720 });
		await saveMeasurement(page, 'As written');
	}

	await openCookies(page);
	const measure = flourRow(page).locator('.font-semibold');
	await expect(measure).toHaveText(written);
	await expect(measure).not.toHaveClass(/text-accent/);
	await expect(page.getByText(/^Converted to/)).toHaveCount(0);
});
