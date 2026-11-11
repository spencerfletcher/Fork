import { test, expect } from '@playwright/test';
import { createRecipe, gotoHydrated, postAction, uniqueTitle } from './helpers';
import { TRASH_DAYS } from '../src/lib/trash';

// The recipe's ⋯ on a Cookbook card (D1, roadmap L07): the recipe page's menu,
// its collections asked for as it opens, every action run in place so the
// Cookbook keeps its query.

test.describe('a Cookbook card’s ⋯', () => {
	test('the owner collects, then moves the recipe to the Trash; the page keeps its query and the card goes', async ({
		page
	}) => {
		const title = uniqueTitle('E2E Card menu');
		const path = await createRecipe(page, title);
		const slug = path.split('/').pop()!;
		try {
			const listUrl = `/cookbook?filter=mine&q=${encodeURIComponent(title)}`;
			await gotoHydrated(page, listUrl);
			const card = page.locator('.recipe-card', { hasText: title });
			const more = card.getByRole('button', { name: `More actions for ${title}` });

			// Opening is not opening the recipe.
			const asked = page.waitForResponse((r) => r.url().includes('?/collections'));
			await more.click();
			await asked;
			await expect(page).toHaveURL(listUrl);
			const menu = page.getByRole('menu', { name: 'More actions' });
			for (const row of ['Add to Journal', 'Edit recipe', 'Export JSON', 'Move to Trash'])
				await expect(menu.getByRole('menuitem', { name: row })).toBeVisible();
			await expect(menu.getByRole('menuitem', { name: 'Fork' })).toHaveCount(0);
			await expect(menu.getByRole('menuitem', { name: 'Print' })).toHaveCount(0);

			// A check flips in place; the menu stays open and the URL keeps its query.
			const toCook = menu.getByRole('menuitemcheckbox', { name: 'To cook' });
			const saved = page.waitForResponse((r) => r.url().includes('?/collect'));
			await toCook.click();
			await saved;
			await expect(toCook).toHaveAttribute('aria-checked', 'true');
			await expect(page).toHaveURL(listUrl);

			// Reopened, the menu asks again and the check is the server's.
			await page.keyboard.press('Escape');
			await expect(more).toBeFocused();
			await more.click();
			await expect(menu.getByRole('menuitemcheckbox', { name: 'To cook' })).toHaveAttribute(
				'aria-checked',
				'true'
			);

			await menu.getByRole('menuitem', { name: 'Move to Trash' }).click();
			await expect(
				page.getByText(`Moves ${title} to your Trash. You can restore it for ${TRASH_DAYS} days.`)
			).toBeVisible();
			await page.getByRole('button', { name: 'Move to Trash' }).click();

			await expect(page.getByRole('status').filter({ hasText: 'Moved' })).toHaveText(
				`Moved ${title} to your Trash. Open Trash`
			);
			await expect(card).toHaveCount(0);
			await expect(page).toHaveURL(listUrl);
			await expect(page.getByRole('link', { name: 'Open Trash' })).toHaveAttribute(
				'href',
				'/cookbook/trash'
			);
		} finally {
			await postAction(page, '/cookbook/trash?/deleteForever', { slug });
		}
	});

	test('a saved recipe’s menu offers Fork, nothing of the owner’s', async ({ page }) => {
		await gotoHydrated(page, '/cookbook?filter=saved');
		const card = page.locator('.recipe-card', { hasText: 'Saved from' }).first();
		await card.getByRole('button', { name: /^More actions for / }).click();
		const menu = page.getByRole('menu', { name: 'More actions' });
		await expect(menu.getByRole('menuitem', { name: 'Fork' })).toBeVisible();
		await expect(menu.getByRole('menuitem', { name: 'Add to Journal' })).toBeVisible();
		for (const row of ['Edit recipe', 'Move to Trash', 'Export JSON'])
			await expect(menu.getByRole('menuitem', { name: row })).toHaveCount(0);
	});
});
