/**
 * The editor's photo field (DESIGN.md, Inputs: the photo field): Add photo on
 * an empty field, Replace and Remove as paper pills over a photo, and a
 * removal that reads "Photo removed · Undo" until the save.
 */

import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './helpers';

const DOT_PNG = {
	name: 'dot.png',
	mimeType: 'image/png',
	buffer: Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
		'base64'
	)
};

const photoInput = (page: Page) => page.locator('input[name="image"]');
const preview = (page: Page) => page.getByRole('img', { name: 'Preview' });
const remove = (page: Page) => page.getByRole('button', { name: 'Remove photo' });
const undo = (page: Page) => page.getByRole('button', { name: 'Undo photo removal' });
const save = (page: Page) => page.getByRole('button', { name: /^save/i });

async function createWithPhoto(page: Page, title: string) {
	test.slow();
	await gotoHydrated(page, '/recipes/new');
	await page.locator('textarea[name="title"]').fill(title);
	await page.getByRole('textbox', { name: 'Ingredients', exact: true }).fill('2 cups flour');
	await page.getByRole('textbox', { name: 'Method', exact: true }).fill('Mix all ingredients.');
	await page.getByRole('radio', { name: 'Only me' }).check();
	await photoInput(page).setInputFiles(DOT_PNG);
	await expect(preview(page)).toBeVisible();
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

test.describe('Editor photo field', () => {
	test('empty: the tile and an Add photo pill in its button voice, not the label eyebrow', async ({
		page
	}) => {
		await gotoHydrated(page, '/recipes/new');
		const pill = page.locator('label.pill-btn');
		await expect(pill).toHaveText('Add photo');
		await expect(page.getByText('JPEG, PNG, WebP or GIF, up to 4 MB')).toBeVisible();
		// The old Choose a photo label took the field label's small caps and Ink 3.
		const look = await pill.evaluate((el) => {
			const s = getComputedStyle(el);
			return {
				size: s.fontSize,
				transform: s.textTransform,
				color: s.color,
				height: el.offsetHeight
			};
		});
		const colour = (selector: string) =>
			page
				.locator(selector)
				.first()
				.evaluate((el) => getComputedStyle(el).color);
		expect(look.size).toBe('15px');
		expect(look.transform).toBe('none');
		expect(look.color).not.toBe(await colour('label[for="image"]:not(.photo-slot)'));
		expect(look.color).toBe(await colour('.form-actions .btn-ghost'));
		expect(look.height).toBe(36);
	});

	test('add, save, edit: Remove shows Photo removed · Undo, Undo brings it back, Remove + Save removes it', async ({
		page
	}) => {
		const url = await createWithPhoto(page, 'E2E Photo Field');
		try {
			await expect(page.locator('.recipe-photo img').first()).toBeVisible();
			await gotoHydrated(page, `${url}/edit`);
			await expect(preview(page)).toBeVisible();
			await expect(photoInput(page)).toHaveAccessibleName('Replace photo');

			await remove(page).click();
			await expect(preview(page)).toHaveCount(0);
			await expect(page.locator('.photo-removed')).toHaveText(/Photo removed\s*·?\s*Undo/);
			await expect(undo(page)).toBeFocused();

			await undo(page).click();
			await expect(preview(page)).toBeVisible();
			await expect(photoInput(page)).toBeFocused();
			await expect(page.locator('input[name="removeImage"]')).toHaveCount(0);

			await remove(page).click();
			await save(page).click();
			await page.waitForURL((u) => !u.pathname.endsWith('/edit'));
			await expect(page.locator('.recipe-photo img')).toHaveCount(0);
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('on a phone the pills are 44px, side by side over the photo, with no sideways scroll', async ({
		page
	}) => {
		await page.setViewportSize({ width: 320, height: 700 });
		await gotoHydrated(page, '/recipes/new');
		await photoInput(page).setInputFiles(DOT_PNG);
		await expect(preview(page)).toBeVisible();
		const replace = await page.locator('label.pill-btn').boundingBox();
		const removeBox = await remove(page).boundingBox();
		const photo = await preview(page).boundingBox();
		expect(replace!.height).toBe(44);
		expect(removeBox!.height).toBe(44);
		expect(removeBox!.x).toBeGreaterThan(replace!.x + replace!.width);
		expect(removeBox!.y + removeBox!.height).toBeLessThanOrEqual(photo!.y + photo!.height);
		expect(photo!.height).toBeLessThanOrEqual(Math.ceil(320 * 0.56));
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
	});
});
