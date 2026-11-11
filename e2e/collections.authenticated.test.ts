/**
 * Collections: made, renamed and deleted on the Cookbook; filled from a
 * recipe's Add to collection; a trashed recipe leaves its collections and
 * comes back with them. Signed in as the seed user, in parallel with other
 * specs: each test makes its own collection and recipe under a name no other
 * test uses, and removes them, so nothing here counts the whole library.
 */

import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './helpers';
import { SEED } from '../src/lib/server/db/seedData';

const unique = (label: string) =>
	`${label} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const collectionsNav = (page: Page) => page.getByRole('navigation', { name: 'Collections' });

/** A private recipe of the seed user's own, returning its path. */
async function createRecipe(page: Page, title: string) {
	await gotoHydrated(page, '/recipes/new');
	await page.locator('textarea[name="title"]').fill(title);
	await page.getByRole('textbox', { name: 'Ingredients', exact: true }).fill('2 cups flour');
	await page.getByRole('textbox', { name: 'Method', exact: true }).fill('Mix all ingredients.');
	await page.getByRole('radio', { name: 'Only me' }).check();
	await page.getByRole('button', { name: /create recipe/i }).click();
	await page.waitForURL(/\/recipes\/(?!new)/);
	return new URL(page.url()).pathname;
}

/** Posts a form action from the page, as a cleanup step the test does not assert. */
async function post(page: Page, url: string, fields: Record<string, string>) {
	await page.evaluate(
		async ([u, body]) => {
			await fetch(u, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams(body).toString()
			});
		},
		[url, fields] as const
	);
}

test.describe('Collections', () => {
	test('a collection is made, opened empty, renamed and deleted on the Cookbook', async ({
		page
	}) => {
		const name = unique('E2E shelf');
		const renamed = unique('E2E renamed');
		await gotoHydrated(page, '/cookbook');

		await page.getByRole('button', { name: 'New collection' }).click();
		await page.getByRole('textbox', { name: 'Collection name' }).fill(name);
		await page.getByRole('button', { name: 'Create' }).click();
		await page.waitForURL(/\/cookbook\?collection=\d+$/);
		await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
		await expect(page.getByText(`Nothing in ${name} yet`)).toBeVisible();
		await expect(collectionsNav(page).getByRole('link', { name })).toHaveAttribute(
			'aria-current',
			'page'
		);

		await page.getByRole('button', { name: `Rename ${name}` }).click();
		await page.getByRole('textbox', { name: 'Collection name' }).fill(renamed);
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await expect(page.getByRole('heading', { level: 2, name: renamed })).toBeVisible();

		await page.getByRole('button', { name: 'Delete collection' }).click();
		const step = page.getByRole('group', { name: `Delete ${renamed}?` });
		await expect(step).toContainText('its recipes stay in your Cookbook');
		await step.getByRole('button', { name: 'Delete collection' }).click();
		await page.waitForURL(/\/cookbook$/);
		await expect(collectionsNav(page).getByRole('link', { name: renamed })).toHaveCount(0);
	});

	test('a recipe joins a new collection from its page, leaves it in the Trash, and returns on restore', async ({
		page
	}) => {
		test.slow();
		const title = unique('E2E Collected');
		const name = unique('E2E party');
		const path = await createRecipe(page, title);

		await page.getByRole('button', { name: 'Add to collection' }).click();
		await page.getByRole('menuitem', { name: 'New collection' }).click();
		await page.getByRole('textbox', { name: 'New collection' }).fill(name);
		await page.getByRole('button', { name: 'Create' }).click();
		const row = page.getByRole('menuitemcheckbox', { name });
		await expect(row).toHaveAttribute('aria-checked', 'true');

		await gotoHydrated(page, '/cookbook');
		await collectionsNav(page).getByRole('link', { name }).click();
		await page.waitForURL(/collection=\d+/);
		const collectionUrl = page.url();
		const id = new URL(collectionUrl).searchParams.get('collection')!;
		await expect(page.getByRole('link', { name: title })).toBeVisible();

		// The Trash hides it from the collection; restoring brings it back.
		await post(page, `${path}/edit?/deleteRecipe`, {});
		await gotoHydrated(page, collectionUrl);
		await expect(page.getByText(`Nothing in ${name} yet`)).toBeVisible();
		await gotoHydrated(page, '/cookbook/trash');
		await page.getByRole('button', { name: `Restore ${title}` }).click();
		await page.waitForURL(new RegExp(`${path}$`));
		await gotoHydrated(page, collectionUrl);
		await expect(page.getByRole('link', { name: title })).toBeVisible();

		// Unchecking takes it out; the collection stays.
		await gotoHydrated(page, path);
		await page.getByRole('button', { name: 'Add to collection' }).click();
		await page.getByRole('menuitemcheckbox', { name }).click();
		await expect(page.getByRole('menuitemcheckbox', { name })).toHaveAttribute(
			'aria-checked',
			'false'
		);
		await gotoHydrated(page, collectionUrl);
		await expect(page.getByText(`Nothing in ${name} yet`)).toBeVisible();

		await post(page, '/cookbook?/deleteCollection', { id });
		await post(page, `${path}/edit?/deleteRecipe`, {});
		await post(page, '/cookbook/trash?/deleteForever', { slug: path.split('/').pop()! });
	});

	test('the seed’s To cook lists its recipes; a recipe outside the library offers no collections', async ({
		page
	}) => {
		const dal = SEED.find((r) => r.slug === 'red-lentil-dal')!.versions.at(-1)!.title;
		await gotoHydrated(page, '/cookbook');
		await collectionsNav(page)
			.getByRole('link', { name: /^To cook/ })
			.click();
		await expect(page.getByRole('link', { name: dal })).toBeVisible();

		// devcooks' Shakshuka: shared with friends, not saved by the seed user.
		const shakshuka = SEED.find((r) => r.slug === 'shakshuka')!.versions.at(-1)!.title;
		await gotoHydrated(page, '/users/devcooks');
		await page.getByRole('link', { name: shakshuka }).first().click();
		await expect(page.getByRole('button', { name: /^Save/ })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Add to collection' })).toHaveCount(0);
	});
});
