import { expect, test } from '@playwright/test';
import { gotoHydrated } from './helpers';
import { SEED } from '../src/lib/server/db/seedData';

// Signed in as the seed user. The file name puts it in the chromium-auth
// project. Tests that need no favorites live in favorites.authenticated.test.ts.

test.describe('Navbar, signed in', () => {
	test('the avatar is a 44px target at desktop', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/cookbook');
		const avatar = (await page.locator('nav .nav-avatar-button').first().boundingBox())!;
		expect(avatar.height).toBeGreaterThanOrEqual(44);
		expect(avatar.width).toBeGreaterThanOrEqual(44);
	});

	test('/ is your Cookbook', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/cookbook$/);
		await expect(page.getByRole('heading', { level: 1, name: 'Cookbook' })).toBeVisible();
	});
});

test.describe('Search, Friends filter', () => {
	// The seed user's one friend is devcooks; their private recipe stays hidden.
	const friendsTitles = SEED.filter((r) => r.author === 'devcooks' && r.visibility !== 'private')
		.map((r) => r.versions.at(-1)!.title)
		.sort();

	test("Friends' recipes lists only friends' recipes the viewer may see", async ({ page }) => {
		await gotoHydrated(page, '/search');
		await page.getByRole('button', { name: 'Friends’ recipes' }).click();
		await expect(page).toHaveURL(/[?&]friends=1/);
		await expect(page.getByRole('button', { name: 'Friends’ recipes' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		const titles = page.locator('.results h3');
		await expect(titles).toHaveCount(friendsTitles.length);
		expect((await titles.allTextContents()).sort()).toEqual(friendsTitles);
	});
});

test.describe('Cookbook filters', () => {
	test('All · Mine · Saved keep the search and the tags', async ({ page }) => {
		await page.goto('/cookbook?q=cookie&tags=dessert');
		const show = page.getByRole('group', { name: 'Show' });
		await expect(show.getByRole('link', { name: /^Saved/ })).toHaveAttribute(
			'href',
			'?q=cookie&tags=dessert&filter=saved'
		);
		await show.getByRole('link', { name: /^Mine/ }).click();
		await expect(page).toHaveURL(/filter=mine/);
		await expect(page.getByRole('searchbox')).toHaveValue('cookie');
	});
});

test.describe('Cookbook filter row', () => {
	for (const width of [1280, 834]) {
		test(`at ${width} the segments and the search box share a row, the pickers and the tools the row under it`, async ({
			page
		}) => {
			await page.setViewportSize({ width, height: 900 });
			await gotoHydrated(page, '/cookbook');
			const inner = (await page.locator('.page-inner').first().boundingBox())!;
			const seg = (await page.getByRole('group', { name: 'Show' }).boundingBox())!;
			const search = (await page.getByRole('searchbox').boundingBox())!;
			const sort = (await page.getByRole('combobox', { name: 'Sort', exact: true }).boundingBox())!;
			const views = (await page.getByRole('group', { name: 'View' }).boundingBox())!;
			const select = (await page
				.getByRole('button', { name: 'Select', exact: true })
				.boundingBox())!;
			expect(search.x).toBeGreaterThan(seg.x + seg.width);
			expect(Math.abs(search.y + search.height / 2 - (seg.y + seg.height / 2))).toBeLessThan(2);
			// Select ends the tools' row at the container's edge either way, after Grid | List.
			expect(Math.round(select.x + select.width)).toBe(Math.round(inner.x + inner.width));
			expect(select.x).toBeGreaterThan(views.x + views.width);
			expect(Math.abs(select.y + select.height / 2 - (views.y + views.height / 2))).toBeLessThan(2);
			// The box takes its row to the end; Collections and Tags lead the row
			// under it, Sort on their line.
			expect(Math.round(search.x + search.width)).toBe(Math.round(inner.x + inner.width));
			const collections = (await page
				.getByRole('button', { name: 'Collections', exact: true })
				.boundingBox())!;
			expect(Math.round(collections.x)).toBe(Math.round(inner.x));
			expect(collections.y).toBeGreaterThan(search.y + search.height);
			expect(sort.x).toBeGreaterThan(collections.x + collections.width);
			expect(
				Math.abs(sort.y + sort.height / 2 - (collections.y + collections.height / 2))
			).toBeLessThan(2);
		});
	}
});

test('one New recipe in the bar at each width: the words from 768, the + below', async ({
	page
}) => {
	const bar = page.getByRole('navigation', { name: 'Site' });
	for (const [width, name] of [
		[1280, '+ New recipe'],
		[768, '+ New recipe'],
		[390, 'New recipe']
	] as const) {
		await page.setViewportSize({ width, height: 900 });
		await gotoHydrated(page, '/cookbook');
		await expect(bar.getByRole('link', { name: /New recipe/ })).toHaveCount(1);
		await expect(bar.getByRole('link', { name, exact: true })).toBeVisible();
	}
});

test.describe('Navbar at 768, signed in', () => {
	test('the bar holds one row: links, the initial and the action fit', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 900 });
		await page.goto('/cookbook');
		const bar = (await page.locator('nav').first().boundingBox())!;
		const items = page.locator(
			'nav .navbar-link, nav .nav-avatar-button, nav a[href="/recipes/new"]'
		);
		await expect(items.first()).toBeVisible();
		const boxes = await items.evaluateAll((els) =>
			els
				.filter((el) => el.checkVisibility())
				.map((el) => {
					const r = el.getBoundingClientRect();
					return {
						top: r.top,
						bottom: r.bottom,
						right: r.right,
						lines: el.getClientRects().length
					};
				})
		);
		// The four destinations, the avatar and + New recipe.
		expect(boxes.length).toBeGreaterThanOrEqual(6);
		for (const box of boxes) {
			expect(box.lines).toBe(1);
			expect(box.top).toBeGreaterThanOrEqual(bar.y);
			expect(box.bottom).toBeLessThanOrEqual(bar.y + bar.height);
			expect(box.right).toBeLessThanOrEqual(768);
		}
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
			768
		);
		// The initial stands for the account at every width: no handle, no Log out.
		await expect(page.locator('nav .avatar').first()).toBeVisible();
		await expect(page.locator('nav').first()).not.toContainText('@spencerfletcher');
		await expect(page.getByRole('button', { name: 'Log out' })).toHaveCount(0);
	});
});

// P2: below 768 one View button beside Collections and Tags holds Sort,
// Grid | List, All · Mine · Saved and Select, in the pickers' sheet.
test.describe('Cookbook View on a phone', () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await gotoHydrated(page, '/cookbook');
	});

	test('the rows are gone; View is a 44px square on the pickers’ row', async ({ page }) => {
		await expect(page.getByRole('group', { name: 'Show' })).toHaveCount(0);
		await expect(page.getByRole('combobox', { name: 'Sort' })).toBeHidden();
		await expect(page.getByRole('button', { name: 'Select', exact: true })).toBeHidden();
		const view = (await page.getByRole('button', { name: 'View', exact: true }).boundingBox())!;
		const tags = (await page.getByRole('button', { name: 'Tags', exact: true }).boundingBox())!;
		expect(view.width).toBe(44);
		expect(view.height).toBe(44);
		expect(view.y).toBe(tags.y);
		expect(view.x + view.width).toBeLessThanOrEqual(390 - 16);
	});

	test('the sheet: All, Mine and Saved one row of 44px targets; a sort goes as a pill', async ({
		page
	}) => {
		await page.getByRole('button', { name: 'View', exact: true }).click();
		const boxes = await Promise.all(
			(await page.getByRole('group', { name: 'Show', exact: true }).getByRole('link').all()).map(
				async (link) => (await link.boundingBox())!
			)
		);
		expect(boxes).toHaveLength(3);
		for (const box of boxes) {
			expect(box.height).toBeGreaterThanOrEqual(44);
			expect(box.y).toBe(boxes[0].y);
		}
		await page.getByRole('menuitemradio', { name: 'Most cooked' }).click();
		await expect(page).toHaveURL(/[?&]sort=most\b/);
		await expect(page.getByRole('button', { name: 'View', exact: true })).toBeFocused();
		await page.getByRole('link', { name: 'Remove Most cooked' }).click();
		await expect(page).not.toHaveURL(/sort=/);
	});

	test('Select recipes from the sheet leaves the cards where they were', async ({ page }) => {
		const card = page.locator('.recipe-card').first();
		const before = (await card.boundingBox())!.y;
		await page.getByRole('button', { name: 'View', exact: true }).click();
		await page.getByRole('menuitem', { name: 'Select recipes' }).click();
		await expect(page.getByRole('region', { name: 'Selection' })).toBeVisible();
		expect((await card.boundingBox())!.y).toBe(before);
	});
});

test.describe('Cookbook cards: times and last cooked', () => {
	// The seed logs Chicken Tikka Masala once, on Sun 8 Nov, by the seed user.
	// A phone's two-across card wraps it further; cookbook-view's spec checks it fits.
	for (const width of [834, 1280]) {
		test(`a cooked recipe says so in its meta row, on at most two lines at ${width}`, async ({
			page
		}) => {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/cookbook');
			const card = page.locator('.recipe-card', { hasText: 'Chicken Tikka Masala' });
			const meta = card.locator('.meta-row');
			await expect(meta.locator('.meta-item').last()).toHaveText('Cooked on Sun 8 Nov');
			const lineHeight = await meta
				.locator('.meta-item')
				.last()
				.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
			expect((await meta.boundingBox())!.height).toBeLessThan(lineHeight * 3);
		});
	}

	test('Discover, about the recipe, never says who cooked it', async ({ page }) => {
		await page.goto('/discover');
		await expect(page.getByText('Chicken Tikka Masala').first()).toBeVisible();
		await expect(page.getByText(/^Cooked (on|\d)/)).toHaveCount(0);
	});
});

test.describe('Friends filter', () => {
	for (const width of [390, 1280]) {
		test(`the icon is centred on its words at ${width}`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/discover');
			const filter = page.getByRole('button', { name: 'Friends’ recipes' });
			const icon = (await filter.locator('svg').boundingBox())!;
			const words = (await filter.locator('span').boundingBox())!;
			const middle = (box: { y: number; height: number }) => box.y + box.height / 2;
			expect(Math.abs(middle(icon) - middle(words))).toBeLessThanOrEqual(1);
		});
	}
});
