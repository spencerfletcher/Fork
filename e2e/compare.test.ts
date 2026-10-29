import { expect, test, type Locator, type Page } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';

// The compare page after Spencer's end-of-day decisions (29 October 2026).
// Seed: the cookies have three versions and v3 renames the recipe.
const COOKIES_RE = new RegExp(SEED[0].versions.at(-1)!.title, 'i');

async function openCookiesCompare(page: Page, query = '?from=2&to=3') {
	await page.goto('/recipes');
	await page.getByRole('link', { name: COOKIES_RE }).first().click();
	await page.waitForURL(/\/recipes\//);
	await page.goto(new URL(page.url()).pathname + '/diff' + query);
	await page.locator('article.version-card').first().waitFor();
}

/** The hit box of an element whose target is widened by its ::before. */
const hitHeight = (el: Locator) =>
	el.evaluate((node) => {
		const s = getComputedStyle(node, '::before');
		return node.getBoundingClientRect().height - parseFloat(s.top) - parseFloat(s.bottom);
	});

test.describe('Compare page', () => {
	test('closed pickers show only the version, at their natural width; the arrow is mono at their size', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await openCookiesCompare(page);
		const from = page.getByRole('combobox', { name: 'From version' });
		await expect(from).toHaveValue('2');
		await expect(page.locator('.picker__face').first()).toHaveText(/^v2\s*▾$/);
		// The select's own text is not drawn; only the face shows.
		expect(await from.evaluate((el) => getComputedStyle(el).color)).toBe('rgba(0, 0, 0, 0)');
		expect((await from.boundingBox())!.width).toBeLessThan(100);
		// The open list carries the message.
		await expect(from.locator('option').nth(1)).toHaveText(/^v2 · \S/);
		const arrow = page.locator('.version-picker__arrow');
		await expect(arrow).toHaveAttribute('aria-hidden', 'true');
		const [arrowFont, selectFont] = await Promise.all([
			arrow.evaluate((el) => [getComputedStyle(el).fontFamily, getComputedStyle(el).fontSize]),
			from.evaluate((el) => [getComputedStyle(el).fontFamily, getComputedStyle(el).fontSize])
		]);
		expect(arrowFont).toEqual(selectFont);
		await expect(page.getByText('From', { exact: true })).toHaveCount(0);
	});

	test('the caret sits at the right edge of the picker at every width, so it reads as a select', async ({
		page
	}) => {
		// The gap between caret and picker edge is the face's own padding and
		// border, nothing more; on a phone the picker is ~164px wide.
		const caretGap = (n: number) =>
			page
				.locator('.picker')
				.nth(n)
				.evaluate((picker) => {
					const face = picker.querySelector('.picker__face')!;
					const caret = face.querySelector('.picker__caret')!;
					const s = getComputedStyle(face);
					const inset = parseFloat(s.paddingRight) + parseFloat(s.borderRightWidth);
					return picker.getBoundingClientRect().right - caret.getBoundingClientRect().right - inset;
				});
		await page.setViewportSize({ width: 390, height: 900 });
		await openCookiesCompare(page);
		expect((await page.locator('.picker').first().boundingBox())!.width).toBeGreaterThan(120);
		for (const n of [0, 1]) expect(Math.abs(await caretGap(n))).toBeLessThanOrEqual(1);
		await page.setViewportSize({ width: 1280, height: 900 });
		expect((await page.locator('.picker').first().boundingBox())!.width).toBeLessThan(100);
		for (const n of [0, 1]) expect(Math.abs(await caretGap(n))).toBeLessThanOrEqual(1);
	});

	test('at 1280 Method starts on the To card’s left edge; Details runs the column', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await openCookiesCompare(page, '?from=1&to=3');
		const to = (await page.locator('article.version-card--to').boundingBox())!;
		const method = (await page
			.locator('.diff-section', { has: page.getByRole('heading', { name: 'Method' }) })
			.boundingBox())!;
		expect(Math.abs(method.x - to.x)).toBeLessThanOrEqual(1);
		// The renamed title is one line in Details.
		const title = page.locator('.diff-row', { hasText: 'Title:' }).locator('.diff-content');
		const lineHeight = await title.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
		expect((await title.boundingBox())!.height).toBeLessThan(lineHeight * 1.5);
	});

	test('the back link is as wide as its text: 24px tall at desktop, 44px on a phone', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await openCookiesCompare(page);
		const back = page.locator('.compare .back-link');
		const text = await back.evaluate((el) => {
			const range = document.createRange();
			range.selectNodeContents(el);
			return range.getBoundingClientRect().width;
		});
		const box = (await back.boundingBox())!;
		expect(box.width).toBeLessThanOrEqual(Math.ceil(text) + 1);
		expect(box.height).toBeGreaterThanOrEqual(24);
		await page.setViewportSize({ width: 390, height: 900 });
		expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	});

	test('on a phone the card number links are 44px targets', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await openCookiesCompare(page);
		const numbers = page.locator('a.version-card__number');
		for (const n of [0, 1]) expect(await hitHeight(numbers.nth(n))).toBeGreaterThanOrEqual(44);
	});

	test('the same version on both sides is named once in the tab', async ({ page }) => {
		await openCookiesCompare(page, '?from=2&to=2');
		await expect(page).toHaveTitle(/^v2 · same version · /);
	});
});
