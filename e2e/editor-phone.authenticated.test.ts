/**
 * The editor on a 390 × 844 phone: a quick fix to a filled recipe saves from
 * the pinned bar, and a save blocked inside the folded details opens them on
 * the bad box. The filled recipe is the seed's cookies at v3, made as the seed
 * user's own private copy: saving the seeded row would change the version
 * counts other specs read in parallel.
 */

import { expect, test } from '@playwright/test';
import { chooseAudience, deleteRecipe, gotoHydrated, uniqueTitle } from './helpers';
import { SEED } from '../src/lib/server/db/seedData';

const COOKIES = SEED.find((r) => r.slug === 'classic-chocolate-chip-cookies')!.versions.at(-1)!;
const PHONE = { width: 390, height: 844 };

test('on a phone, the filled cookie recipe takes a fix to its last step’s bake time and saves as a new version', async ({
	page
}) => {
	test.slow();
	const title = uniqueTitle('E2E Phone Cookies');
	await gotoHydrated(page, '/recipes/new');
	await page.locator('textarea[name="title"]').fill(title);
	await page.getByLabel('Description').fill(COOKIES.description!);
	await page.getByLabel('Serves').fill(String(COOKIES.servings));
	await page.getByLabel('Prep', { exact: true }).fill(`${COOKIES.prepTimeMinutes} min`);
	await page.getByLabel('Cook', { exact: true }).fill(`${COOKIES.cookTimeMinutes} min`);
	await page.getByLabel('Rest', { exact: true }).fill(`${COOKIES.restTimeMinutes} min`);
	await page.getByLabel('Source', { exact: true }).fill(COOKIES.sourceName!);
	await page
		.getByRole('textbox', { name: 'Ingredients', exact: true })
		.fill(COOKIES.ingredientsText.trim());
	await page.getByRole('textbox', { name: 'Method', exact: true }).fill(COOKIES.stepsText.trim());
	await page.getByRole('button', { name: 'Add Notes' }).click();
	await page.keyboard.type(COOKIES.notes!);
	await page.getByRole('button', { name: 'Add Make ahead' }).click();
	await page.keyboard.type(COOKIES.makeAhead!);
	await page.getByRole('button', { name: 'Add Storage' }).click();
	await page.keyboard.type(COOKIES.storage!);
	await chooseAudience(page, 'Only me');
	await page.getByRole('button', { name: /create recipe/i }).click();
	await page.waitForURL(/\/recipes\/(?!new)/);
	const url = page.url().split('?')[0];

	try {
		await page.setViewportSize(PHONE);
		await gotoHydrated(page, `${url}/edit`);
		// The facts are one summary line, so Ingredients is on the first screen.
		const summary = page.locator('summary');
		await expect(summary).toContainText(`Serves ${COOKIES.servings}`);
		await expect(summary).toContainText('Only me');
		await expect(summary).toContainText('Edit details');
		await expect(page.getByRole('textbox', { name: 'Ingredients', exact: true })).toBeInViewport();

		// The last step's "Bake 9–11 minutes" becomes 10–12, typed over in place.
		const method = page.getByRole('textbox', { name: 'Method', exact: true });
		const line = method.getByText(/Bake 9–11 minutes/);
		await line.click();
		await method.evaluate((box) => {
			const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
			for (let node = walker.nextNode(); node; node = walker.nextNode()) {
				const at = node.textContent!.indexOf('9–11');
				if (at < 0) continue;
				const range = document.createRange();
				range.setStart(node, at);
				range.setEnd(node, at + '9–11'.length);
				getSelection()!.removeAllRanges();
				getSelection()!.addRange(range);
				return;
			}
			throw new Error('No bake time in the method');
		});
		await page.keyboard.type('10–12');

		// The line being typed in stays above the pinned bar.
		const save = page.getByRole('button', { name: 'Save', exact: true });
		await expect(save).toBeInViewport();
		const edited = method.getByText(/Bake 10–12 minutes/);
		await expect(edited).toBeInViewport();
		const barTop = (await page.locator('.actions-bar').boundingBox())!.y;
		const lineBox = (await edited.boundingBox())!;
		expect(lineBox.y).toBeLessThan(barTop);

		await save.click();
		await page.waitForURL(url);
		await expect(page.locator('.version-bar .current .version-number')).toContainText('v2');
		await expect(page.locator('#method')).toContainText('Bake 10–12 minutes');
	} finally {
		await deleteRecipe(page, url);
	}
});

test('on a phone, a save blocked by a bad Rest time inside the closed details opens them with the cursor in Rest', async ({
	page
}) => {
	await page.setViewportSize(PHONE);
	await gotoHydrated(page, '/recipes/new');
	await page.locator('textarea[name="title"]').fill(uniqueTitle('E2E Phone Rest'));
	const details = page.locator('details');
	const summary = page.locator('summary');
	await expect(summary).toContainText('Add details');
	await summary.click();
	const rest = page.getByLabel('Rest', { exact: true });
	await rest.fill('a while');
	await summary.click();
	await expect(details).not.toHaveAttribute('open');
	await page.getByRole('textbox', { name: 'Ingredients', exact: true }).fill('2 cups flour');
	await page.getByRole('textbox', { name: 'Method', exact: true }).fill('Mix.');

	await page.getByRole('button', { name: /create recipe/i }).click();
	await expect(details).toHaveAttribute('open');
	await expect(rest).toBeFocused();
	await expect(page.locator('#restTimeMinutes-error')).toHaveText(
		'Write the rest time like 45 min, 1 h 30 or 2 days'
	);
	await expect(page).toHaveURL(/\/recipes\/new$/);
});
