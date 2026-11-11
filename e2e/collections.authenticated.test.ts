/**
 * Collections: made, renamed and deleted on the Cookbook; filled from a
 * recipe's ⋯ menu; a trashed recipe leaves its collections and
 * comes back with them. Signed in as the seed user, in parallel with other
 * specs: each test makes its own collection and recipe under a name no other
 * test uses, and removes them, so nothing here counts the whole library.
 */

import { expect, test, type Page } from '@playwright/test';
import { createRecipe, deleteRecipe, gotoHydrated, postAction, uniqueTitle } from './helpers';
import { SEED } from '../src/lib/server/db/seedData';

const collectionsNav = (page: Page) => page.getByRole('navigation', { name: 'Collections' });

/** The seed user's own private recipe, by its path. */
const createdPath = async (page: Page, title: string, servings?: string) =>
	new URL(await createRecipe(page, title, { servings })).pathname;

test.describe('Collections', () => {
	test('a collection is made, opened empty, renamed and deleted on the Cookbook', async ({
		page
	}) => {
		const name = uniqueTitle('E2E shelf');
		const renamed = uniqueTitle('E2E renamed');
		await gotoHydrated(page, '/cookbook');

		await page.getByRole('button', { name: 'New collection' }).click();
		await page.getByRole('textbox', { name: 'Collection name' }).fill(name);
		await page.getByRole('button', { name: 'Create' }).click();
		await page.waitForURL(/\/cookbook\?collection=\d+$/);
		await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();
		await expect(page.getByText(`Nothing in ${name} yet`)).toBeVisible();
		await expect(collectionsNav(page).getByRole('link', { name })).toHaveAttribute(
			'aria-current',
			'page'
		);

		// A search inside the collection, so the rename has a whole query to keep.
		await gotoHydrated(page, `${page.url()}&q=e2e`);
		await page.getByRole('button', { name: `Rename ${name}` }).click();
		await page.getByRole('textbox', { name: 'Collection name' }).fill(renamed);
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		// Still inside the collection, with its search, after the rename.
		await expect(page.getByRole('heading', { level: 2, name: renamed, exact: true })).toBeVisible();
		await expect(page).toHaveURL(/\/cookbook\?collection=\d+&q=e2e$/);

		// Reloaded at ?page=3 (Show more wrote it), leaving the collection starts
		// the list at its first page, the search kept.
		await gotoHydrated(page, `${page.url()}&page=3`);
		await expect(collectionsNav(page).getByRole('link', { name: 'All recipes' })).toHaveAttribute(
			'href',
			'?q=e2e'
		);

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
		const title = uniqueTitle('E2E Collected');
		const name = uniqueTitle('E2E party');
		const path = await createdPath(page, title);

		await page.getByRole('button', { name: 'More actions' }).click();
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
		await deleteRecipe(page, path);
		await gotoHydrated(page, collectionUrl);
		await expect(page.getByText(`Nothing in ${name} yet`)).toBeVisible();
		await gotoHydrated(page, '/cookbook/trash');
		await page.getByRole('button', { name: `Restore ${title}` }).click();
		await page.waitForURL(new RegExp(`${path}$`));
		await gotoHydrated(page, collectionUrl);
		await expect(page.getByRole('link', { name: title })).toBeVisible();

		// Unchecking takes it out; the collection stays.
		await gotoHydrated(page, path);
		await page.getByRole('button', { name: 'More actions' }).click();
		// The row flips before the server answers; leaving sooner would abort the request.
		const saved = page.waitForResponse((r) => r.url().includes('?/collect'));
		await page.getByRole('menuitemcheckbox', { name }).click();
		await saved;
		await expect(page.getByRole('menuitemcheckbox', { name })).toHaveAttribute(
			'aria-checked',
			'false'
		);
		await gotoHydrated(page, collectionUrl);
		await expect(page.getByText(`Nothing in ${name} yet`)).toBeVisible();

		await postAction(page, '/cookbook?/deleteCollection', { id });
		await deleteRecipe(page, path);
		await postAction(page, '/cookbook/trash?/deleteForever', { slug: path.split('/').pop()! });
	});

	test('a collection toggle keeps the page’s query: the scale on the latest, the version on a past one, and the menu open', async ({
		page
	}) => {
		test.slow();
		const title = uniqueTitle('E2E Scaled');
		const name = uniqueTitle('E2E scaled shelf');
		const path = await createdPath(page, title, '4');
		let id: string | null = null;
		try {
			await page.getByRole('button', { name: 'More actions' }).click();
			await page.getByRole('menuitem', { name: 'New collection' }).click();
			await page.getByRole('textbox', { name: 'New collection' }).fill(name);
			await page.getByRole('button', { name: 'Create' }).click();
			await expect(page.getByRole('menuitemcheckbox', { name })).toHaveAttribute(
				'aria-checked',
				'true'
			);
			await gotoHydrated(page, '/cookbook');
			const href = await collectionsNav(page).getByRole('link', { name }).getAttribute('href');
			id = new URLSearchParams(href!.split('?')[1]).get('collection');

			/**
			 * Flips the row and returns the query the page's data was reloaded with:
			 * an in-place refresh asks for this URL's data, a navigation to the
			 * action's URL would ask without the query.
			 */
			async function toggle(checked: 'true' | 'false') {
				const reloaded = page.waitForResponse((r) => r.url().includes('/__data.json'));
				await page.getByRole('menuitemcheckbox', { name }).click();
				const query = new URL((await reloaded).url()).searchParams;
				await expect(page.getByRole('menuitemcheckbox', { name })).toHaveAttribute(
					'aria-checked',
					checked
				);
				return query;
			}

			// Scaled to 8 from 4: 2 cups reads 4 cups, and stays so after each toggle.
			await gotoHydrated(page, `${path}?serves=8`);
			const ingredients = page.locator('#ingredients');
			await expect(ingredients.getByText(/4 cups/)).toBeVisible();
			await page.getByRole('button', { name: 'More actions' }).click();
			expect((await toggle('false')).get('serves')).toBe('8');
			expect((await toggle('true')).get('serves')).toBe('8');
			await expect(page).toHaveURL(new RegExp(`${path}\\?serves=8$`));
			await expect(page.getByRole('menuitemcheckbox', { name })).toBeVisible();
			await expect(ingredients.getByText(/4 cups/)).toBeVisible();

			// A second version, so v1 is history; a toggle there stays on v1.
			await gotoHydrated(page, `${path}/edit`);
			await page.getByRole('textbox', { name: 'Ingredients', exact: true }).fill('3 cups flour');
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await page.waitForURL(new RegExp(`${path}$`));
			await gotoHydrated(page, `${path}?version=1`);
			await page.getByRole('button', { name: 'More actions' }).click();
			expect((await toggle('false')).get('version')).toBe('1');
			await expect(page).toHaveURL(new RegExp(`${path}\\?version=1$`));
			await expect(ingredients.getByText(/2 cups/)).toBeVisible();
		} finally {
			if (id) await postAction(page, '/cookbook?/deleteCollection', { id });
			await deleteRecipe(page, path);
			await postAction(page, '/cookbook/trash?/deleteForever', { slug: path.split('/').pop()! });
		}
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
		await page.getByRole('button', { name: 'More actions' }).click();
		await expect(page.getByRole('menuitem', { name: 'Print' })).toBeVisible();
		await expect(page.getByRole('menuitemcheckbox')).toHaveCount(0);
	});
});
