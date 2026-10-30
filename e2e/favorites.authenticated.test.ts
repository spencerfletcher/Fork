import { expect, test, type Browser, type Page } from '@playwright/test';

// Signed in as the seed user. The file name puts it in the chromium-auth
// project. Every test here needs an account with no favorites, so the
// describe clears whatever the account has and restores exactly that after.
// They live in one file because tests in a file run in order in one worker,
// and toggling is not idempotent: two files clearing at once would race.

/** The slugs on /favorites, read from each card's stretched link. */
async function favoriteSlugs(page: Page) {
	await page.goto('/favorites');
	await expect(page.getByRole('heading', { level: 1, name: 'Favorites' })).toBeVisible();
	return page
		.locator('a.card-stretched-link')
		.evaluateAll((els) => els.map((a) => new URL((a as HTMLAnchorElement).href).pathname));
}

/** Sent from the page so the browser sets Origin and SvelteKit's CSRF check passes. */
async function toggleFavorites(page: Page, paths: string[]) {
	for (const path of paths) {
		const status = await page.evaluate(
			async (p) =>
				(
					await fetch(`${p}?/toggleFavorite`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
						body: ''
					})
				).status,
			path
		);
		expect(status, `toggle ${path}`).toBe(200);
	}
}

async function signedInPage(browser: Browser) {
	const context = await browser.newContext({ storageState: test.info().project.use.storageState });
	const page = await context.newPage();
	// On a page of the app, so the toggle's relative URL resolves.
	await page.goto('/favorites');
	return page;
}

test.describe('Favorites, with none', () => {
	let removed: string[] = [];

	test.beforeAll(async ({ browser }) => {
		const page = await signedInPage(browser);
		removed = await favoriteSlugs(page);
		await toggleFavorites(page, removed);
		expect(await favoriteSlugs(page)).toEqual([]);
		await page.context().close();
	});

	test.afterAll(async ({ browser }) => {
		const page = await signedInPage(browser);
		// Restore in reverse so the newest-first order comes back as it was.
		await toggleFavorites(page, [...removed].reverse());
		expect((await favoriteSlugs(page)).sort()).toEqual([...removed].sort());
		await page.context().close();
	});

	test('the empty state sits left under the h1 at every width, as the page reads', async ({
		page
	}) => {
		for (const width of [1280, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/favorites');
			const h1 = page.getByRole('heading', { level: 1, name: 'Favorites' });
			const empty = page.getByText(/No favorites yet/);
			await expect(empty).toBeVisible();
			expect(await empty.evaluate((el) => getComputedStyle(el).textAlign)).toBe('left');
			// The sentence starts on the h1's edge.
			const textLeft = await empty.evaluate((el) => {
				const range = document.createRange();
				range.selectNodeContents(el);
				return range.getClientRects()[0].left;
			});
			expect(Math.abs(textLeft - (await h1.boundingBox())!.x)).toBeLessThanOrEqual(1);
		}
	});

	test('the page is just the empty state, and its link is a thumb target on a phone', async ({
		page
	}) => {
		// A search box over an empty list invites a query with nothing to find
		// (decided 29 October 2026).
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/favorites');
		await expect(page.getByRole('heading', { level: 1, name: 'Favorites' })).toBeVisible();
		await expect(page.getByRole('searchbox')).toHaveCount(0);
		const explore = page.getByRole('link', { name: /explore recipes/i });
		await expect(explore).toBeVisible();
		const box = await explore.boundingBox();
		expect(box!.height).toBeGreaterThanOrEqual(44);
	});

	test('a query in the URL still reads "No favorites yet", with no filters', async ({ page }) => {
		await page.goto('/favorites?q=cookie&tags=dessert');
		await expect(page.getByText(/No favorites yet/)).toBeVisible();
		await expect(page.getByText(/No favorites match/)).toHaveCount(0);
		await expect(page.getByRole('searchbox')).toHaveCount(0);
	});

	test('"Explore recipes →" is a 24px target at desktop', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/favorites');
		const explore = page.getByRole('link', { name: 'Explore recipes →' });
		expect((await explore.boundingBox())!.height).toBeGreaterThanOrEqual(24);
	});
});
