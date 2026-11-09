import { expect, test, type Page } from '@playwright/test';

// The browse surfaces signed out. Assumes the seed: public recipes, one of
// them with a second version.

const height = async (page: Page, selector: string) =>
	(await page.locator(selector).first().boundingBox())!.height;

test.describe('Discover, signed out', () => {
	test('/ is Discover: the heading, a lead card and Recent changes', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1, name: 'Discover' })).toBeVisible();
		await expect(page.locator('a.lead')).toHaveCount(1);
		await expect(page.getByRole('heading', { name: 'Recent changes' })).toBeVisible();
	});

	test('each Recent changes card opens the diff of that version against the one before', async ({
		page
	}) => {
		await page.goto('/discover');
		const links = page.locator('.recent-row a');
		expect(await links.count()).toBeGreaterThan(0);
		for (const href of await links.evaluateAll((els) => els.map((a) => a.getAttribute('href')!))) {
			const match = href.match(/^\/recipes\/[^/]+\/diff\?from=(\d+)&to=(\d+)$/)!;
			expect(Number(match[2]) - Number(match[1])).toBe(1);
			const response = await page.request.get(href);
			expect(response.status()).toBe(200);
		}
	});

	test('the lead takes the first photo fetch; the grid follows it', async ({ page }) => {
		await page.goto('/discover');
		await expect(page.locator('a.lead img[fetchpriority="high"]')).toHaveCount(
			(await page.locator('a.lead img').count()) > 0 ? 1 : 0
		);
		await expect(page.locator('.discover-grid img[fetchpriority="high"]')).toHaveCount(0);
	});

	test('/recipes, now the Cookbook, asks a visitor to log in', async ({ page }) => {
		await page.goto('/recipes');
		await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcookbook$/);
	});
});

test.describe('Tab bar on a phone', () => {
	test('paper, 44px targets, Discover current on /, and no sideways scroll', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		const bar = page.getByRole('navigation', { name: 'Main' });
		await expect(bar).toBeVisible();
		const [barBg, pageBg] = await Promise.all([
			bar.evaluate((el) => getComputedStyle(el).backgroundColor),
			page.evaluate(() => getComputedStyle(document.body).backgroundColor)
		]);
		expect(barBg).toBe(pageBg);
		for (const box of await bar
			.getByRole('link')
			.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) {
			expect(box).toBeGreaterThanOrEqual(44);
		}
		await expect(bar.getByRole('link', { name: 'Discover' })).toHaveAttribute(
			'aria-current',
			'page'
		);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
			390
		);
	});

	test('hidden from 768', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/');
		await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
	});
});

test.describe('Search filters', () => {
	test('a filter pressed from the keyboard keeps focus after the page navigates', async ({
		page
	}) => {
		await page.goto('/search');
		const dessert = page.getByRole('group', { name: 'Filter by tag' }).getByRole('button', {
			name: 'Dessert'
		});
		await dessert.focus();
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/tags=dessert/);
		await expect(dessert).toHaveAttribute('aria-pressed', 'true');
		await expect(dessert).toBeFocused();
	});
});

test.describe('Search filters on a phone', () => {
	test('pressing the last filter scrolls it, ring and all, into view', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/search');
		const row = page.getByRole('group', { name: 'Filter by tag' });
		// Clear all appears after the last tag once it is pressed, so skip it.
		const last = row.locator('button:not(.tag-tabs__clear)').last();
		await last.focus();
		await page.keyboard.press('Enter');
		await expect(last).toHaveAttribute('aria-pressed', 'true');
		await expect(last).toBeFocused();
		// The ring sits 4px outside the button (2px offset, 2px width).
		await expect
			.poll(() =>
				last.evaluate((el) => {
					const r = el.getBoundingClientRect();
					const clip = el.parentElement!.getBoundingClientRect();
					return r.left - 4 >= Math.max(0, clip.left) && r.right + 4 <= Math.min(390, clip.right);
				})
			)
			.toBe(true);
	});
});

test.describe('Recipe cards', () => {
	test('the author link is a 24px target at desktop', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/tags/dessert');
		expect(await height(page, '.recipe-card a.meta-author')).toBeGreaterThanOrEqual(24);
	});
});
