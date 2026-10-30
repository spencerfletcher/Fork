import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
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

/** A select's text area, in its own font's ch. */
const textAreaInCh = (select: Locator) =>
	select.evaluate((el) => {
		const s = getComputedStyle(el);
		const probe = document.createElement('span');
		Object.assign(probe.style, {
			display: 'inline-block',
			width: '1ch',
			fontFamily: s.fontFamily,
			fontSize: s.fontSize
		});
		document.body.append(probe);
		const ch = probe.getBoundingClientRect().width;
		probe.remove();
		return (el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)) / ch;
	});

test.describe('Compare page', () => {
	test('closed pickers show the version and its message, clipped at 22ch; the arrow is mono at their size', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await openCookiesCompare(page);
		const from = page.getByRole('combobox', { name: 'From version' });
		await expect(from).toHaveValue('2');
		// The select draws its own text: no face over it.
		await expect(page.locator('.picker__face')).toHaveCount(0);
		expect(await from.evaluate((el: HTMLSelectElement) => el.selectedOptions[0].text)).toMatch(
			/^v2 · \S/
		);
		expect(await from.evaluate((el) => getComputedStyle(el).color)).not.toBe('rgba(0, 0, 0, 0)');
		// 22ch of label, "v2 · Increased vanilla", not the message's own width.
		expect(await textAreaInCh(from)).toBeCloseTo('v2 · Increased vanilla'.length, 0);
		// Pressed, the list keeps the same labels: there is no swap.
		await from.dispatchEvent('pointerdown');
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
		// The gap between the caret and the select's right edge is the select's
		// own padding and border, nothing more; on a phone the picker is ~164px.
		const caretGap = (n: number) =>
			page
				.locator('.picker')
				.nth(n)
				.evaluate((picker) => {
					const select = picker.querySelector('select')!;
					const caret = picker.querySelector('.picker__caret')!;
					return select.getBoundingClientRect().right - caret.getBoundingClientRect().right;
				});
		await page.setViewportSize({ width: 390, height: 900 });
		await openCookiesCompare(page);
		expect((await page.locator('.picker select').first().boundingBox())!.width).toBeGreaterThan(
			120
		);
		for (const n of [0, 1]) expect(await caretGap(n)).toBeLessThanOrEqual(12);
		await page.setViewportSize({ width: 1280, height: 900 });
		expect((await page.locator('.picker select').first().boundingBox())!.width).toBeLessThan(300);
		for (const n of [0, 1]) expect(await caretGap(n)).toBeLessThanOrEqual(12);
	});

	test('on a phone the closed box shows the long label clipped at the caret, the whole box the tap target', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await openCookiesCompare(page);
		const from = page.getByRole('combobox', { name: 'From version' });
		expect(await from.evaluate((el: HTMLSelectElement) => el.selectedOptions[0].text)).toMatch(
			/^v2 · \S/
		);
		// Room for more than "v2 · ", so the message starts in the closed box.
		expect(await textAreaInCh(from)).toBeGreaterThan('v2 · '.length);
		expect((await from.boundingBox())!.width).toBeGreaterThan(120);
	});

	test('in forced colours the picker keeps its label and its caret, unclipped', async ({
		page
	}) => {
		await page.emulateMedia({ forcedColors: 'active' });
		for (const width of [1280, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await openCookiesCompare(page);
			const from = page.getByRole('combobox', { name: 'From version' });
			expect(await from.evaluate((el: HTMLSelectElement) => el.selectedOptions[0].text)).toMatch(
				/^v2 · \S/
			);
			const caret = page.locator('.picker__caret').first();
			await expect(caret).toBeVisible();
			const [c, f] = [(await caret.boundingBox())!, (await from.boundingBox())!];
			expect(c.x + c.width).toBeLessThanOrEqual(f.x + f.width);
		}
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

	test("a card's username is Username's own step under the line, at every width", async ({
		page
	}) => {
		// The step is Username's em, read from its source so a change there
		// moves this test with it.
		const username = readFileSync('src/lib/components/ui/Username.svelte', 'utf8');
		const step = Number(/\.username\s*{[^}]*font-size:\s*([\d.]+)em/.exec(username)![1]);
		await openCookiesCompare(page);
		const ratio = () =>
			page
				.locator('.version-card__head .username')
				.first()
				.evaluate(
					(el) =>
						parseFloat(getComputedStyle(el).fontSize) /
						parseFloat(getComputedStyle(el.closest('.version-card__head')!).fontSize)
				);
		for (const width of [1280, 390]) {
			await page.setViewportSize({ width, height: 900 });
			expect(await ratio()).toBeCloseTo(step, 3);
		}
	});

	test('on a phone the card number links are 44px targets', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await openCookiesCompare(page);
		const numbers = page.locator('a.version-card__number');
		for (const n of [0, 1]) expect(await hitHeight(numbers.nth(n))).toBeGreaterThanOrEqual(44);
	});

	test('each diff panel is a list in the browser’s tree, one item per row', async ({ page }) => {
		await openCookiesCompare(page, '?from=1&to=3');
		for (const name of ['Details', 'Ingredients', 'Method']) {
			const list = page.getByRole('list', { name });
			const rows = await list.locator('.diff-row').count();
			expect(rows).toBeGreaterThan(0);
			await expect(list.getByRole('listitem')).toHaveCount(rows);
		}
	});

	test('the same version on both sides is named once in the tab', async ({ page }) => {
		await openCookiesCompare(page, '?from=2&to=2');
		await expect(page).toHaveTitle(/^v2 · same version · /);
	});

	test('a reversed pick goes to the ordered pair, focus on the picker holding the picked version', async ({
		page
	}) => {
		await openCookiesCompare(page, '?from=3&to=3');
		await page.getByLabel('To version').selectOption('2');
		await page.waitForURL(/\?from=2&to=3$/);
		const from = page.getByLabel('From version');
		await expect(from).toHaveValue('2');
		await expect(page.getByLabel('To version')).toHaveValue('3');
		await expect(from).toBeFocused();
	});

	test('a recipe that does not exist answers as the root page does: the private-recipe lede, home, and a search', async ({
		page
	}) => {
		const response = await page.goto('/recipes/does-not-exist/diff');
		expect(response?.status()).toBe(404);
		await expect(
			page.getByText('It may be an old link, or a recipe its author keeps private.')
		).toBeVisible();
		await expect(page.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
		await expect(page.getByRole('link', { name: 'Search recipes' })).toHaveAttribute(
			'href',
			'/search'
		);
	});
});
