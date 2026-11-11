import { test, expect } from '@playwright/test';
import { createRecipe, gotoHydrated, postAction, uniqueTitle } from './helpers';
import { TRASH_DAYS } from '../src/lib/trash';

// Select mode on the Cookbook (roadmap Library growth, B1): Select turns the
// cards into checkboxes, and the pinned bar acts on the chosen ones. Scoped
// to two recipes this test makes, found by a word only they share, since
// other specs act as the same cook meanwhile.

test.describe('Cookbook select mode', () => {
	test('two recipes go into a new collection, take a tag, then go to the Trash together', async ({
		page
	}) => {
		const word = uniqueTitle('x').split(' ')[1];
		const titles = [`E2E Select ${word} one`, `E2E Select ${word} two`];
		const slugs: string[] = [];
		for (const title of titles) slugs.push((await createRecipe(page, title)).split('/').pop()!);
		const name = uniqueTitle('E2E Bulk');
		const tag = `Bulk ${word}`;
		let collectionId: string | null = null;
		try {
			const listUrl = `/cookbook?q=${encodeURIComponent(word)}`;
			await gotoHydrated(page, listUrl);
			const select = page.getByRole('button', { name: 'Select', exact: true });
			await expect(select).toHaveAttribute('aria-pressed', 'false');
			await select.click();
			await expect(select).toHaveAttribute('aria-pressed', 'true');

			const bar = page.getByRole('region', { name: 'Selection' });
			const selectAll = bar.getByRole('button', { name: 'Select all 2 shown', exact: true });
			await expect(selectAll).toBeFocused();
			// The cards are checkboxes now, not links.
			await expect(page.getByRole('link', { name: titles[0], exact: true })).toHaveCount(0);
			await page.getByRole('checkbox', { name: titles[0], exact: true }).focus();
			await page.keyboard.press('Space');
			await expect(bar).toContainText('1 selected');
			await selectAll.click();
			await expect(bar).toContainText('2 selected');

			// A new collection from the bar holds both.
			await bar.getByRole('button', { name: 'Add to collection' }).click();
			const menu = page.getByRole('menu', { name: 'Add to collection' });
			await menu.getByRole('menuitem', { name: 'New collection' }).click();
			await page.getByRole('textbox', { name: 'New collection' }).fill(name);
			await page.getByRole('button', { name: 'Create', exact: true }).click();
			await expect(bar.getByRole('status').filter({ hasText: 'Added' })).toHaveText(
				`Added 2 recipes to ${name}.`
			);
			await expect(menu.getByRole('menuitemcheckbox', { name })).toHaveAttribute(
				'aria-checked',
				'true'
			);
			const link = page.getByRole('navigation', { name: 'Collections' }).getByRole('link', {
				name: new RegExp(name)
			});
			await expect(link).toContainText('2');
			collectionId = new URL((await link.getAttribute('href'))!, page.url()).searchParams.get(
				'collection'
			);
			await page.keyboard.press('Escape');
			await expect(bar).toContainText('2 selected');

			// A tag on both, no version written: the selection stays.
			await bar.getByRole('button', { name: 'Add tag', exact: true }).click();
			const box = bar.getByRole('combobox', { name: 'Search or create a tag' });
			await expect(box).toBeFocused();
			await box.fill(tag);
			await box.press('Enter');
			await bar.getByRole('button', { name: 'Add', exact: true }).click();
			await expect(bar.getByRole('status').filter({ hasText: 'Added' })).toHaveText(
				`Added “${tag}” to 2 recipes.`
			);
			await expect(bar).toContainText('2 selected');

			// Then both to the Trash, asked once.
			await bar.getByRole('button', { name: 'Move to Trash', exact: true }).click();
			const step = page.getByRole('group', { name: 'Move 2 recipes to Trash?' });
			await expect(step).toBeFocused();
			await expect(step).toContainText(
				`Moves your 2 recipes to your Trash. You can restore them for ${TRASH_DAYS} days.`
			);
			await step.getByRole('button', { name: 'Move to Trash' }).click();
			await expect(bar.getByRole('status').filter({ hasText: 'moved' })).toContainText(
				'2 recipes moved to Trash.'
			);
			await expect(page.locator('.recipe-card', { hasText: word })).toHaveCount(0);
			await expect(bar).toContainText('None selected');
			await expect(page).toHaveURL(listUrl);

			// Cancel leaves, focus back on Select.
			await bar.getByRole('button', { name: 'Cancel', exact: true }).click();
			await expect(bar).toHaveCount(0);
			await expect(select).toBeFocused();
		} finally {
			for (const slug of slugs) {
				await postAction(page, `/recipes/${slug}/edit?/deleteRecipe`);
				await postAction(page, '/cookbook/trash?/deleteForever', { slug });
			}
			if (collectionId) await postAction(page, '/cookbook?/deleteCollection', { id: collectionId });
		}
	});

	test('a new search clears the selection and says so; Escape leaves the mode', async ({
		page
	}) => {
		const word = uniqueTitle('x').split(' ')[1];
		const title = `E2E Select ${word} solo`;
		const slug = (await createRecipe(page, title)).split('/').pop()!;
		try {
			await gotoHydrated(page, `/cookbook?q=${encodeURIComponent(word)}`);
			await page.getByRole('button', { name: 'Select', exact: true }).click();
			const bar = page.getByRole('region', { name: 'Selection' });
			await page.getByRole('checkbox', { name: title, exact: true }).check();
			await expect(bar).toContainText('1 selected');

			await page.getByRole('link', { name: /^List/ }).click();
			await expect(bar).toContainText('Selection cleared: the list changed.');
			await expect(bar).toContainText('None selected');

			await page.getByRole('checkbox', { name: title, exact: true }).focus();
			await page.keyboard.press('Escape');
			await expect(bar).toHaveCount(0);
			await expect(page.getByRole('button', { name: 'Select', exact: true })).toBeFocused();
		} finally {
			await postAction(page, `/recipes/${slug}/edit?/deleteRecipe`);
			await postAction(page, '/cookbook/trash?/deleteForever', { slug });
		}
	});
});
