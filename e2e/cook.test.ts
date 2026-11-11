import { expect, test, type Page } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';
import { gotoHydrated, openCookies } from './helpers';

// Cooking (Spencer, 11 November 2026): a paper header with Exit, the whole
// method in one scrolling list, an Ingredients | Method switch at the bottom
// on a phone that keeps each view's place, both lists side by side from
// 1024, and Finish cooking after the last step. Headless Chromium has no
// screen to keep awake, so the Screen Wake Lock API is replaced in the page
// by a stand-in that counts requests and releases.

const TIKKA = SEED.find((r) => r.slug === 'chicken-tikka-masala')!.versions.at(-1)!.title;

/** The tikka's own link on Discover (slugs carry a random suffix per seed). */
async function openTikka(page: Page, search = '') {
	await page.goto('/discover');
	const href = await page
		.getByRole('link', { name: new RegExp(TIKKA, 'i') })
		.and(page.locator(':not([href*="/diff"])'))
		.first()
		.getAttribute('href');
	await gotoHydrated(page, `${href}${search}`);
}

async function mockWakeLock(page: Page) {
	await page.addInitScript(() => {
		const log = { requests: 0, releases: 0 };
		Object.assign(window, { wakeLockLog: log });
		Object.defineProperty(navigator, 'wakeLock', {
			configurable: true,
			value: {
				request: async () => {
					log.requests++;
					const sentinel = {
						released: false,
						release: async () => {
							sentinel.released = true;
							log.releases++;
						}
					};
					return sentinel;
				}
			}
		});
	});
}

const wakeLockLog = (page: Page) =>
	page.evaluate(
		() => (window as unknown as { wakeLockLog: { requests: number; releases: number } }).wakeLockLog
	);

const stepSize = (page: Page) =>
	page
		.locator('#method .step-text')
		.first()
		.evaluate((el) => ({
			text: getComputedStyle(el).fontSize,
			line: getComputedStyle(el).lineHeight,
			numeral: getComputedStyle(el.closest('label')!.querySelector('span')!).fontSize
		}));

const switcher = (page: Page) => page.getByRole('navigation', { name: 'Recipe sections' });
const segment = (page: Page, name: 'Ingredients' | 'Method') =>
	switcher(page).getByRole('button', { name });
const scrollY = (page: Page) => page.evaluate(() => window.scrollY);
const top = (page: Page, selector: string) =>
	page.locator(selector).evaluate((el) => el.getBoundingClientRect().top);

test.describe('Cooking', () => {
	test('Cook swaps the band for the cooking header and holds the screen awake; Exit restores the page with the ticks kept', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await mockWakeLock(page);
		await openCookies(page);
		await expect(page.locator('.version-bar')).toBeVisible();
		expect(await stepSize(page)).toEqual({ text: '17px', line: '27.2px', numeral: '18px' });

		await page.getByRole('link', { name: 'Cook' }).click();
		await expect(page).toHaveURL(/[?&]cook=1/);
		const header = page.locator('header.cook-header');
		await expect(header.getByText('Cooking', { exact: true })).toBeVisible();
		// One h1, the cooking header's; the band, its pills, the bar and the espresso nav are gone.
		await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
		await expect(header.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.locator('.hero')).toHaveCount(0);
		await expect(page.locator('.version-bar')).toHaveCount(0);
		await expect(page.locator('.nav-shell')).toBeHidden();
		await expect(header.getByRole('button', { name: 'Exit' })).toBeVisible();
		// Wide: both lists side by side, no switch.
		await expect(page.locator('#ingredients')).toBeVisible();
		await expect(page.locator('#method')).toBeVisible();
		await expect(switcher(page)).toBeHidden();
		expect(await stepSize(page)).toEqual({ text: '22px', line: '33px', numeral: '28px' });
		await expect.poll(() => wakeLockLog(page)).toEqual({ requests: 1, releases: 0 });

		const step = page.locator('#method input[type="checkbox"]').first();
		await page.locator('#method label').first().click();
		await expect(step).toBeChecked();
		await header.getByRole('button', { name: 'Exit' }).click();
		await expect(page).not.toHaveURL(/cook=/);
		await expect(page.locator('.hero')).toBeVisible();
		await expect(page.locator('.version-bar')).toBeVisible();
		await expect(page.locator('.nav-shell')).toBeVisible();
		await expect(step).toBeChecked();
		expect(await stepSize(page)).toEqual({ text: '17px', line: '27.2px', numeral: '18px' });
		await expect.poll(() => wakeLockLog(page)).toEqual({ requests: 1, releases: 1 });
	});

	test('a done step keeps a check and quieter text, never a strike; reading keeps the strike', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await mockWakeLock(page);
		await openCookies(page);
		const row = page.locator('#method label').first();
		const ingredient = page.locator('#ingredients label').first();
		await row.click();
		await ingredient.click();
		const strike = (l: typeof row) => l.evaluate((el) => getComputedStyle(el).textDecorationLine);
		expect(await strike(row)).toBe('line-through');
		await expect(row.locator('.step-check')).toBeHidden();

		await page.getByRole('link', { name: 'Cook' }).click();
		expect(await strike(row)).toBe('none');
		expect(await strike(ingredient)).toBe('none');
		await expect(row.locator('.step-check')).toBeVisible();
		// Ink 3, 4.9:1 on paper.
		expect(await row.locator('.step-text').evaluate((el) => getComputedStyle(el).color)).toBe(
			'rgb(111, 105, 96)'
		);
	});

	test('?cook=1 survives a reload on Method and keeps a scale; a scale keeps ?cook=1', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await mockWakeLock(page);
		await openCookies(page);
		await page.getByRole('link', { name: 'Cook' }).click();
		await expect(page).toHaveURL(/[?&]cook=1/);
		await segment(page, 'Ingredients').click();
		const servings = page.getByRole('spinbutton', { name: 'Servings' });
		await servings.fill('8');
		await servings.press('Enter');
		await expect(page).toHaveURL(/serves=8/);
		await expect(page).toHaveURL(/[?&]cook=1/);
		// The header says it: Serves 8 and the multiplier, in clay.
		await expect(page.locator('header.cook-header .serves .text-accent').first()).toHaveText('8');

		await page.reload();
		await expect(page.getByRole('button', { name: 'Exit' })).toBeVisible();
		await expect(segment(page, 'Method')).toHaveAttribute('aria-pressed', 'true');
		await expect(page.locator('.version-bar')).toHaveCount(0);
		await segment(page, 'Ingredients').click();
		await expect(servings).toHaveValue('8');
		await expect.poll(() => wakeLockLog(page)).toMatchObject({ requests: 1 });
	});

	test('without the Screen Wake Lock API cooking still works and says the screen may sleep', async ({
		page
	}) => {
		await page.addInitScript(() => {
			Reflect.deleteProperty(Navigator.prototype, 'wakeLock');
		});
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));
		await openCookies(page);
		await page.getByRole('link', { name: 'Cook' }).click();
		await expect(page.getByRole('button', { name: 'Exit' })).toBeVisible();
		await expect(page.getByText('Your screen may still sleep.')).toBeVisible();
		expect(errors).toEqual([]);
	});

	// The owner's prototype test: hand someone a phone on step 5 and ask how
	// much ginger goes in; they answer and come back to the same line.
	test('the ginger lookup: each view comes back to exactly where it was, with no history added', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 700 });
		await mockWakeLock(page);
		await openTikka(page);
		await page.getByRole('link', { name: 'Cook' }).click();
		await expect(segment(page, 'Method')).toHaveAttribute('aria-pressed', 'true');
		const history = await page.evaluate(() => history.length);

		const step5 = '#method li:nth-child(5)';
		await page.locator(step5).evaluate((el) => el.scrollIntoView({ block: 'center' }));
		const methodY = await scrollY(page);
		expect(methodY).toBeGreaterThan(0);
		const reading = await top(page, step5);

		await segment(page, 'Ingredients').click();
		await expect(segment(page, 'Ingredients')).toHaveAttribute('aria-pressed', 'true');
		await expect(segment(page, 'Ingredients')).toBeFocused();
		await expect(page.locator('#method')).toBeHidden();
		// Find the ginger; that place in the ingredients is kept too.
		const ginger = page.locator('#ingredients label', { hasText: /ginger/ });
		await ginger.scrollIntoViewIfNeeded();
		await expect(ginger).toBeInViewport();
		const ingredientsY = await scrollY(page);
		expect(ingredientsY).toBeGreaterThan(0);

		await segment(page, 'Method').click();
		await expect(page.locator('#ingredients')).toBeHidden();
		expect(Math.abs((await top(page, step5)) - reading)).toBeLessThanOrEqual(2);
		await segment(page, 'Ingredients').click();
		expect(Math.abs((await scrollY(page)) - ingredientsY)).toBeLessThanOrEqual(2);

		expect(await page.evaluate(() => history.length)).toBe(history);
	});

	test('on a phone the switch is one bottom bar of thumb targets; the site bars step aside', async ({
		page
	}) => {
		await page.setViewportSize({ width: 320, height: 700 });
		await mockWakeLock(page);
		await openCookies(page);
		await expect(page.locator('.tab-bar')).toBeVisible();
		await page.getByRole('link', { name: 'Cook' }).click();
		await expect(page.locator('.tab-bar')).toBeHidden();
		await expect(page.locator('.nav-shell')).toBeHidden();
		const bar = (await switcher(page).boundingBox())!;
		expect(bar.y + bar.height).toBeCloseTo(700, 0);
		for (const name of ['Ingredients', 'Method'] as const)
			expect((await segment(page, name).boundingBox())!.height).toBeGreaterThanOrEqual(44);
		expect(await stepSize(page)).toEqual({ text: '21px', line: '30.45px', numeral: '26px' });
		const doc = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth
		}));
		expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
	});

	test('on a phone a row focused by Tab never sits under the bar, and the page ends clear of it', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 600 });
		await mockWakeLock(page);
		await openTikka(page);
		await page.getByRole('link', { name: 'Cook' }).click();
		await segment(page, 'Ingredients').click();
		const barTop = await top(page, '.section-tabs');
		const boxes = page.locator('#ingredients input[type="checkbox"]');
		await boxes.first().focus();
		for (let i = 1; i < (await boxes.count()); i++) {
			await page.keyboard.press('Tab');
			await expect(boxes.nth(i)).toBeFocused();
			const bottom = await boxes
				.nth(i)
				.evaluate((el) => el.closest('label')!.getBoundingClientRect().bottom);
			expect(bottom).toBeLessThanOrEqual(barTop);
		}

		await segment(page, 'Method').click();
		await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
		const finish = (await page.getByRole('button', { name: 'Finish cooking' }).boundingBox())!;
		expect(finish.y + finish.height).toBeLessThanOrEqual(barTop);
	});

	test('entering Cook with steps ticked lands on the first open step', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 700 });
		await mockWakeLock(page);
		await openTikka(page);
		await segment(page, 'Method').click();
		await page.locator('#method label').nth(0).click();
		await page.locator('#method label').nth(1).click();
		await page.evaluate(() => window.scrollTo(0, 0));
		await page.getByRole('link', { name: 'Cook' }).click();
		await expect(page.locator('#method li').nth(2)).toBeInViewport();
		expect(await scrollY(page)).toBeGreaterThan(0);
	});

	test('signed out, Finish cooking after the last step returns to reading', async ({ page }) => {
		await mockWakeLock(page);
		await openCookies(page);
		await page.getByRole('link', { name: 'Cook' }).click();
		await page.getByRole('button', { name: 'Finish cooking' }).click();
		await expect(page).not.toHaveURL(/cook=/);
		await expect(page.locator('.hero')).toBeVisible();
		await expect.poll(() => wakeLockLog(page)).toEqual({ requests: 1, releases: 1 });
	});
});

// Cook is a link, so it cooks before hydration and without script: the
// server renders cooking from ?cook=1, the serves kept.
test.describe('Cook without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('the link opens cooking at the same serves', async ({ page }) => {
		await page.goto('/discover');
		const href = await page
			.getByRole('link', { name: new RegExp(TIKKA, 'i') })
			.and(page.locator(':not([href*="/diff"])'))
			.first()
			.getAttribute('href');
		await page.goto(`${href}?serves=8`);
		await page.getByRole('link', { name: 'Cook' }).click();
		await page.waitForURL(/[?&]cook=1/);
		await expect(page).toHaveURL(/[?&]serves=8/);
		await expect(page.locator('header.cook-header')).toBeVisible();
		await expect(page.locator('.hero')).toHaveCount(0);
	});
});
