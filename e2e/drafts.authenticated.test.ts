/**
 * Editor drafts kept on the device: typed text survives a reload and a
 * navigation away, Discard draft returns to the server's content, and a
 * successful save forgets the draft. Each test has its own browser context,
 * so its localStorage starts empty.
 */

import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './helpers';

/** Waits until the debounced write has landed, so a reload has something to restore. */
async function draftStored(page: Page, title: string) {
	await expect
		.poll(() =>
			page.evaluate((t) => {
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i)!;
					if (key.startsWith('fork:draft:') && localStorage.getItem(key)!.includes(t)) return true;
				}
				return false;
			}, title)
		)
		.toBe(true);
}

/** The draft keeps the work, so leaving a dirty editor asks nothing: count any question. */
function countDialogs(page: Page) {
	const seen = { count: 0 };
	page.on('dialog', (d) => {
		seen.count++;
		void d.accept();
	});
	return seen;
}

const titleBox = (page: Page) => page.locator('textarea[name="title"]');
const stateLine = (page: Page) => page.locator('.editing');

async function createRecipe(page: Page, title: string) {
	test.slow();
	await gotoHydrated(page, '/recipes/new');
	await titleBox(page).fill(title);
	await page.getByRole('textbox', { name: 'Ingredients', exact: true }).fill('2 cups flour');
	await page.getByRole('textbox', { name: 'Method', exact: true }).fill('Mix all ingredients.');
	await page.getByRole('radio', { name: 'Only me' }).check();
	await page.getByRole('button', { name: /create recipe/i }).click();
	await page.waitForURL(/\/recipes\/(?!new)/);
	return page.url().split('?')[0];
}

async function deleteRecipe(page: Page, url: string) {
	await page.evaluate(async (u) => {
		await fetch(`${u}/edit?/deleteRecipe`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: ''
		});
	}, url);
}

test.describe('Editor drafts on this device', () => {
	test('an edit survives a reload, and the state line says it was restored', async ({ page }) => {
		const url = await createRecipe(page, 'E2E Draft Reload');
		try {
			const dialogs = countDialogs(page);
			await gotoHydrated(page, `${url}/edit`);
			await titleBox(page).fill('E2E Draft Reload Typed');
			await draftStored(page, 'E2E Draft Reload Typed');
			await page.reload();
			await expect(titleBox(page)).toHaveValue('E2E Draft Reload Typed');
			expect(dialogs.count).toBe(0);
			await expect(stateLine(page)).toContainText(/Draft from .+ restored\./);
			await expect(page.getByRole('button', { name: 'Discard draft' })).toBeVisible();
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('Discard draft returns to the saved recipe and stays gone after a reload', async ({
		page
	}) => {
		const url = await createRecipe(page, 'E2E Draft Discard');
		try {
			const dialogs = countDialogs(page);
			await gotoHydrated(page, `${url}/edit`);
			await titleBox(page).fill('E2E Draft Discard Typed');
			await draftStored(page, 'E2E Draft Discard Typed');
			await page.reload();
			await page.getByRole('button', { name: 'Discard draft' }).click();
			await expect(titleBox(page)).toHaveValue('E2E Draft Discard');
			await expect(page.getByRole('button', { name: 'Discard draft' })).toHaveCount(0);
			await page.reload();
			await expect(titleBox(page)).toHaveValue('E2E Draft Discard');
			await expect(stateLine(page)).not.toContainText('restored');
			expect(dialogs.count).toBe(0);
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('a successful save forgets the draft', async ({ page }) => {
		const url = await createRecipe(page, 'E2E Draft Save');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await titleBox(page).fill('E2E Draft Saved');
			await draftStored(page, 'E2E Draft Saved');
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await page.waitForURL(url);
			await gotoHydrated(page, `${url}/edit`);
			await expect(titleBox(page)).toHaveValue('E2E Draft Saved');
			await expect(page.getByRole('button', { name: 'Discard draft' })).toHaveCount(0);
			expect(
				await page.evaluate(() =>
					Object.keys(localStorage).filter((k) => k.startsWith('fork:draft:'))
				)
			).toEqual([]);
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('a new recipe’s draft survives leaving the editor and coming back', async ({ page }) => {
		const dialogs = countDialogs(page);
		await gotoHydrated(page, '/recipes/new');
		await titleBox(page).fill('E2E Draft New');
		await page.getByRole('textbox', { name: 'Method', exact: true }).fill('Stir.');
		await draftStored(page, 'E2E Draft New');
		await page.getByRole('link', { name: 'Cancel' }).click();
		await page.waitForURL(/\/cookbook/);
		expect(dialogs.count).toBe(0);
		await gotoHydrated(page, '/recipes/new');
		await expect(titleBox(page)).toHaveValue('E2E Draft New');
		await expect(page.locator('textarea[name="steps"]')).toHaveValue('Stir.');
		await expect(stateLine(page)).toContainText(/Draft from .+ restored\./);
	});
});
