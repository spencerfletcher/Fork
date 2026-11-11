import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './helpers';

// The browse surfaces signed out. Assumes the seed: public recipes, one of
// them with a second version.

const height = async (page: Page, selector: string) =>
	(await page.locator(selector).first().boundingBox())!.height;

test.describe('Discover, signed out', () => {
	test('/ is Discover: the heading, a lead card and Recent changes', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1, name: 'Discover' })).toBeVisible();
		await expect(page.locator('.lead')).toHaveCount(1);
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
		await expect(page.locator('.lead img[fetchpriority="high"]')).toHaveCount(
			(await page.locator('.lead img').count()) > 0 ? 1 : 0
		);
		await expect(page.locator('.discover-grid img[fetchpriority="high"]')).toHaveCount(0);
	});

	test('the lead and every grid card: the cook is one profile link, tabbed before the recipe', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/discover');
		for (const card of [
			page.locator('.lead'),
			page.locator('.discover-grid .recipe-card').first()
		]) {
			const hrefs = await card
				.locator('a')
				.evaluateAll((els) => els.map((a) => a.getAttribute('href')));
			expect(hrefs[0]).toMatch(/^\/users\//);
			expect(hrefs[1]).toMatch(/^\/recipes\//);
			const cook = card.locator('a[href^="/users/"]');
			expect((await cook.boundingBox())!.height).toBeGreaterThanOrEqual(24);
		}
		await expect(page.getByText('Open recipe')).toHaveCount(0);
	});

	test('a tag filter keeps the lead and draws it from the filtered set', async ({ page }) => {
		await page.goto('/discover?tags=dessert');
		await expect(page.locator('.lead')).toHaveCount(1);
		const href = (await page.locator('.lead a[href^="/recipes/"]').getAttribute('href'))!;
		await page.goto(href);
		await expect(page.getByRole('link', { name: 'Dessert' }).first()).toBeVisible();
	});

	test('/recipes, now the Cookbook, asks a visitor to log in', async ({ page }) => {
		await page.goto('/recipes');
		await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcookbook$/);
	});
});

// Safari 26 tints the status bar from a fixed box at the top edge. Chromium
// can only check the geometry; the tint itself is checked on an iPhone.
test.describe('Status strip on a phone', () => {
	test('at rest a full-width fixed strip in the bar colour; a screen down nothing pinned at the top', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await gotoHydrated(page, '/discover');
		const navBg = await page
			.getByRole('navigation', { name: 'Site' })
			.evaluate((el) => getComputedStyle(el).backgroundColor);
		const strip = await page.locator('.status-strip').evaluate((el) => {
			const r = el.getBoundingClientRect();
			const cs = getComputedStyle(el);
			return {
				top: r.top,
				bottom: r.bottom,
				width: r.width,
				position: cs.position,
				bg: cs.backgroundColor
			};
		});
		expect(strip.position).toBe('fixed');
		expect(strip.top).toBeLessThanOrEqual(0);
		expect(strip.bottom).toBeGreaterThan(0);
		expect(strip.width).toBe(390);
		expect(strip.bg).toBe(navBg);

		await page.evaluate(() => window.scrollTo(0, window.innerHeight));
		expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
		await expect(page.locator('.status-strip')).toHaveCount(0);
		const pinnedAtTop = await page.evaluate(() =>
			[...document.querySelectorAll('body *')]
				.filter((el) => {
					const { position } = getComputedStyle(el);
					const r = el.getBoundingClientRect();
					return (
						(position === 'fixed' || position === 'sticky') &&
						r.width > 0 &&
						r.height > 0 &&
						r.top < 100 &&
						r.bottom > 0
					);
				})
				.map((el) => el.outerHTML.slice(0, 80))
		);
		expect(pinnedAtTop).toEqual([]);
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
		const dessert = page.getByRole('group', { name: 'Filters' }).getByRole('button', {
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
		const row = page.getByRole('group', { name: 'Filters' });
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
		expect(await height(page, '.recipe-card .meta-author a')).toBeGreaterThanOrEqual(24);
	});

	test('the version chip wears the shared .vid look, not the meta row sans', async ({ page }) => {
		// Component styles are unlayered and beat app.css, so the card's own
		// .meta-item rule must not reach the chip.
		await page.goto('/tags/dessert');
		const chip = page.locator('.recipe-card .vid').first();
		const look = await chip.evaluate((el) => {
			const c = getComputedStyle(el);
			return [c.fontFamily, c.fontWeight, c.color];
		});
		expect(look[0]).toMatch(/JetBrains Mono/);
		expect(look.slice(1)).toEqual(['600', 'rgb(178, 60, 0)']);
	});
});
