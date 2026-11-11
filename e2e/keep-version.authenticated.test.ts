/**
 * Keep this version and the saver's private note, on devcooks' Shakshuka
 * (Friends, one version; the seed user is devcooks' friend). Signed in as the
 * seed user, who cannot act as the author: a recipe the author withdraws
 * (private, Trash, deleted for good), the arrival at an older kept version and
 * "The author's latest is v5" are covered by the server and component tests.
 * Each test saves the recipe and unsaves it in `finally`, leaving the seed as
 * it was; nothing here counts the whole library.
 */

import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './helpers';
import { SEED } from '../src/lib/server/db/seedData';

const SHAKSHUKA = SEED.find((r) => r.slug === 'shakshuka')!.versions.at(-1)!.title;

/** The Shakshuka's page, found from devcooks' profile (its slug has a random suffix). */
async function openShakshuka(page: Page) {
	await gotoHydrated(page, '/users/devcooks');
	await page.getByRole('link', { name: SHAKSHUKA, exact: true }).first().click();
	await page.waitForURL(/\/recipes\/shakshuka/);
	await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
	return new URL(page.url()).pathname;
}

const saveButton = (page: Page) => page.getByRole('button', { name: /^Save/ });

/** Saves the recipe on the page, or leaves it saved. */
async function save(page: Page) {
	if ((await saveButton(page).getAttribute('aria-pressed')) !== 'true')
		await saveButton(page).click();
	await expect(saveButton(page)).toHaveAttribute('aria-pressed', 'true');
}

/** Unsaves through the action, as a cleanup step the test does not assert. */
async function unsave(page: Page, path: string) {
	await gotoHydrated(page, path);
	if ((await saveButton(page).getAttribute('aria-pressed')) === 'true') {
		await saveButton(page).click();
		await expect(saveButton(page)).toHaveAttribute('aria-pressed', 'false');
	}
}

test.describe('Keep this version', () => {
	// One recipe, one save row: the tests would undo each other's saves side by side.
	test.describe.configure({ mode: 'serial' });

	test('a saver keeps the version they read, it lasts across visits, and following the latest again ends it', async ({
		page
	}) => {
		const path = await openShakshuka(page);
		try {
			// Not saved: nothing to keep.
			await expect(page.getByRole('button', { name: /Keep this version/ })).toHaveCount(0);
			await save(page);

			await page.getByRole('button', { name: 'Keep this version, v1' }).click();
			const line = page.locator('.keep-line');
			await expect(line).toContainText('Keeping v1');
			await expect(page.getByRole('button', { name: 'Follow latest version' })).toBeVisible();

			// A later visit, and a serves in the URL, keep it.
			await gotoHydrated(page, `${path}?serves=6`);
			await expect(line).toContainText('Keeping v1');
			await expect(page).toHaveURL(new RegExp(`${path}\\?serves=6$`));

			await page.getByRole('button', { name: 'Follow latest version' }).click();
			await expect(page.getByRole('button', { name: 'Keep this version, v1' })).toBeVisible();
			await expect(page.getByText(/^Keeping/)).toHaveCount(0);
			// The form applied in place: the page's query stays.
			await expect(page).toHaveURL(new RegExp(`${path}\\?serves=6$`));
		} finally {
			await unsave(page, path);
		}
	});

	test('unsaving clears the kept version: saving again follows the latest', async ({ page }) => {
		const path = await openShakshuka(page);
		try {
			await save(page);
			await page.getByRole('button', { name: 'Keep this version, v1' }).click();
			await expect(page.locator('.keep-line')).toContainText('Keeping v1');

			await saveButton(page).click();
			await expect(saveButton(page)).toHaveAttribute('aria-pressed', 'false');
			await expect(page.getByRole('button', { name: /Keep this version/ })).toHaveCount(0);

			await save(page);
			await expect(page.getByRole('button', { name: 'Keep this version, v1' })).toBeVisible();
			await expect(page.getByText(/^Keeping/)).toHaveCount(0);
		} finally {
			await unsave(page, path);
		}
	});

	test("the saver's note is written in place, shown to them alone, and edited or cleared", async ({
		page
	}) => {
		const note = `Half the cumin ${Date.now().toString(36)}`;
		const path = await openShakshuka(page);
		try {
			await save(page);
			await page.getByRole('button', { name: 'Add a note' }).click();
			const box = page.getByRole('textbox', { name: /Your note/ });
			await expect(box).toBeFocused();
			await box.fill(note);
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await expect(page.getByText(note)).toBeVisible();
			await expect(page.getByText('Your note · only you')).toBeVisible();

			// Kept across visits.
			await gotoHydrated(page, path);
			await expect(page.getByText(note)).toBeVisible();

			// Cleared, the note goes and Add a note returns.
			await page.getByRole('button', { name: 'Edit note' }).click();
			await page.getByRole('textbox', { name: /Your note/ }).fill('');
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await expect(page.getByRole('button', { name: 'Add a note' })).toBeVisible();
			await expect(page.getByText(note)).toHaveCount(0);
		} finally {
			await unsave(page, path);
		}
	});

	test('the author gets neither Keep this version nor a note on their own recipe', async ({
		page
	}) => {
		const cookies = SEED.find((r) => r.slug === 'classic-chocolate-chip-cookies')!;
		await gotoHydrated(page, '/cookbook?filter=mine');
		await page
			.getByRole('link', { name: cookies.versions.at(-1)!.title, exact: true })
			.first()
			.click();
		await page.waitForURL(/\/recipes\/classic-chocolate-chip-cookies/);
		await expect(page.getByRole('link', { name: 'Edit recipe' })).toBeVisible();
		await expect(page.getByRole('button', { name: /Keep this version/ })).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Add a note' })).toHaveCount(0);
	});
});
