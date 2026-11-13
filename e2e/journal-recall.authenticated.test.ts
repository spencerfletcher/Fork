import { expect, test, type Page } from '@playwright/test';
import { createRecipe, deleteRecipe, gotoHydrated, postAction, uniqueTitle } from './helpers';

// Journal recall (roadmap P2): a note for next time written after a cook
// comes back beside Cook on the next visit. In the chromium-account project,
// after the other signed-in specs: its entries would change the Journal's
// lists and counts that the Journal specs read.

/** Finish a cook of the recipe at `url` and land on its Journal entry form. */
async function finishCook(page: Page, url: string) {
	await gotoHydrated(page, `${url}?cook=1`);
	await page.getByRole('button', { name: 'Finish cooking' }).click();
	await expect(page).toHaveURL(/\/journal\/new\?recipe=.+&version=1/);
}

/** Saves the entry form and returns the new entry's id. */
async function logIt(page: Page) {
	await page.getByRole('button', { name: 'Add to Journal' }).click();
	await expect(page).toHaveURL(/\/journal\?logged=\d+/);
	return new URL(page.url()).searchParams.get('logged')!;
}

test('a note for next time comes back beside Cook; a later cook saved with no writing keeps it', async ({
	page
}) => {
	const url = await createRecipe(page, uniqueTitle('Recall ginger'), { servings: '4' });
	const entries: string[] = [];
	try {
		await finishCook(page, url);
		// The note leads the form; the cook's facts come filled in below it.
		const fields = page.locator('#entry-form').locator('input:not([type=hidden]), textarea');
		await expect(fields.first()).toHaveAttribute('name', 'note');
		await page.getByLabel('Note for next time').fill('Less ginger next time');
		entries.push(await logIt(page));

		await gotoHydrated(page, url);
		const recall = page.locator('.recall');
		await expect(recall).toHaveText(/^\s*Next time, from\s+.+,\s+v1:\s+Less ginger next time\s*$/);
		await expect(recall.getByRole('link')).toHaveAttribute('href', `/journal#entry-${entries[0]}`);
		// Seen before cooking: on arrival, in view with Cook.
		await expect(page.getByRole('link', { name: 'Cook', exact: true })).toBeInViewport();
		await expect(recall).toBeInViewport();

		// Cooked again, saved with nothing written: logged, and the advice stays.
		await finishCook(page, url);
		entries.push(await logIt(page));
		await gotoHydrated(page, url);
		await expect(page.locator('.personal')).toContainText('You cooked this 2 times');
		await expect(recall.getByRole('link')).toHaveAttribute('href', `/journal#entry-${entries[0]}`);
	} finally {
		for (const id of entries) await postAction(page, `/journal/${id}/edit?/deleteEntry`);
		await deleteRecipe(page, url);
	}
});
