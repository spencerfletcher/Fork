/**
 * Source, notes and times on a recipe the seed user makes, edits and then
 * moves to the Trash: typed in the editor, shown on the page, diffed after an
 * edit, and printed. Private, so no other spec's counts see it.
 */

import { expect, test } from '@playwright/test';
import { chooseAudience, deleteRecipe, gotoHydrated } from './helpers';

test('a source, a rest and notes show on the page, in the diff after an edit, and in print', async ({
	page
}) => {
	test.slow();
	await gotoHydrated(page, '/recipes/new');
	await page.locator('textarea[name="title"]').fill('E2E Overnight Focaccia');
	await page.getByLabel('Serves').fill('8');
	await page.getByLabel('Prep', { exact: true }).fill('20 min');
	await page.getByLabel('Cook', { exact: true }).fill('25');
	await page.getByLabel('Rest', { exact: true }).fill('overnight');
	await page.getByLabel('Source', { exact: true }).fill('Gran’s notebook');
	// Each Add button turns into its field with the cursor in it.
	await page.getByRole('button', { name: 'Add Link' }).click();
	await page.keyboard.type('example.com/focaccia');
	await page.getByRole('textbox', { name: 'Ingredients', exact: true }).fill('500 g flour');
	await page.getByRole('textbox', { name: 'Method', exact: true }).fill('Mix, rest, bake.');
	await page.getByRole('button', { name: 'Add Notes' }).click();
	await page.getByLabel('Notes').fill('Dimple it hard.\nMore oil than you think.');
	await page.getByRole('button', { name: 'Add Storage' }).click();
	await expect(page.getByLabel('Storage')).toBeFocused();
	await page.getByLabel('Storage').fill('Wrapped, one day');
	await chooseAudience(page, 'Only me');
	await page.getByRole('button', { name: /create recipe/i }).click();
	await page.waitForURL(/\/recipes\/(?!new)/);
	const url = page.url().split('?')[0];

	try {
		// The measure: each time its own pair, and no total.
		const measure = page.locator('.recipe-header .details');
		await expect(measure).toContainText('20 min prep');
		await expect(measure).toContainText('25 min cook');
		await expect(measure).toContainText('8 h rest');
		await expect(measure).not.toContainText('45 min');

		const source = page.getByRole('link', { name: 'Gran’s notebook' });
		await expect(source).toHaveAttribute('href', 'https://example.com/focaccia');
		await expect(source).toHaveAttribute('rel', 'noopener noreferrer nofollow');

		const notes = page.locator('#notes');
		await expect(notes).toContainText('Dimple it hard.');
		await expect(notes).toContainText('Wrapped, one day');

		await gotoHydrated(page, `${url}/edit`);
		await expect(page.getByLabel('Rest', { exact: true })).toHaveValue('8 h');
		await page.getByLabel('Rest', { exact: true }).fill('1 h 30');
		await page.getByLabel('Notes').fill('Dimple it harder.');
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await page.waitForURL(url);
		await expect(page.locator('.recipe-header .details')).toContainText('1 h 30 min rest');

		await page.goto(`${url}/diff?from=1&to=2`);
		const details = page.getByRole('list', { name: 'Details' });
		await expect(details).toContainText('8 h to 1 h 30 min rest');
		await expect(details).toContainText('Notes:');
		await expect(details).toContainText('Dimple it harder.');

		await page.goto(url);
		await page.emulateMedia({ media: 'print' });
		const head = page.locator('.print-header');
		await expect(head).toContainText('20 min prep · 25 min cook · 1 h 30 min rest');
		await expect(head).toContainText('Source: Gran’s notebook · https://example.com/focaccia');
		await expect(page.locator('#notes')).toBeVisible();
		await expect(page.locator('#notes')).toContainText('Wrapped, one day');
	} finally {
		await page.emulateMedia({ media: 'screen' });
		await deleteRecipe(page, url);
	}
});

test('a time the editor cannot read is named under its box and blocks the save', async ({
	page
}) => {
	await gotoHydrated(page, '/recipes/new');
	const rest = page.getByLabel('Rest', { exact: true });
	await rest.fill('a while');
	await rest.blur();
	await expect(rest).toHaveAttribute('aria-invalid', 'true');
	await expect(page.locator('#restTimeMinutes-error')).toHaveText(
		'Write the rest time like 45 min, 1 h 30 or 2 days'
	);
	await page.getByRole('button', { name: /create recipe/i }).click();
	await expect(page).toHaveURL(/\/recipes\/new$/);
});
