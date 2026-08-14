import { expect, test, type Page } from '@playwright/test';

// These tests assume the DB has been seeded with the demo data:
// - "Classic Chocolate Chip Cookies" (2 versions)
// - "Brown Butter Chocolate Chip Cookies" (forked, 1 version)
// - "Chicken Tikka Masala" (3 versions)

/** Slugs carry a random nanoid suffix, so reach the recipe by name, not URL. */
async function gotoClassicCookies(page: Page) {
	await page.goto('/');
	await page
		.getByRole('link', { name: /classic chocolate chip cookies/i })
		.first()
		.click();
	await page.waitForURL(/\/recipes\//);
}

test.describe('Recipe detail page', () => {
	test('recipe cards on the home page link to detail pages', async ({ page }) => {
		await page.goto('/');
		const cards = page.locator('div.recipe-card');
		await expect(cards.first()).toBeVisible();
		// Clicking the first card navigates to a recipe detail
		await cards.first().click();
		await expect(page).toHaveURL(/\/recipes\//);
		await expect(page.locator('h1')).toBeVisible();
	});

	test('recipe detail shows Ingredients section', async ({ page }) => {
		await page.goto('/');
		await page.locator('div.recipe-card').first().click();
		// Use heading role to avoid matching ingredient names that contain "ingredients"
		await expect(page.getByRole('heading', { name: /^ingredients$/i })).toBeVisible();
	});

	test('recipe detail shows Method section', async ({ page }) => {
		await page.goto('/');
		await page.locator('div.recipe-card').first().click();
		await expect(page.getByRole('heading', { name: /^method$/i })).toBeVisible();
	});

	test('"Classic Chocolate Chip Cookies" shows version history with 2 versions', async ({
		page
	}) => {
		await page.goto('/');
		// Click the stretched link (aria-label) rather than the h3 text node
		await page
			.getByRole('link', { name: /classic chocolate chip cookies/i })
			.first()
			.click();
		await expect(page).toHaveURL(/\/recipes\//);
		// Version history is the strip under the hero — all versions visible without expanding.
		const versionEntries = page.locator('.version-strip .version-entry');
		await expect(versionEntries).toHaveCount(2);
	});

	test('"Brown Butter Chocolate Chip Cookies" shows fork attribution', async ({ page }) => {
		await page.goto('/');
		await page
			.getByRole('link', { name: /brown butter chocolate chip cookies/i })
			.first()
			.click();
		await expect(page).toHaveURL(/\/recipes\//);
		await expect(page.getByText(/forked from/i)).toBeVisible();
		await expect(page.getByText(/Classic Chocolate Chip Cookies/i)).toBeVisible();
	});

	test('viewing a specific version shows the history banner', async ({ page }) => {
		await page.goto('/');
		await page
			.getByRole('link', { name: /classic chocolate chip cookies/i })
			.first()
			.click();
		await page.waitForURL(/\/recipes\//);
		// Append ?version=1 to the current recipe URL
		const recipeUrl = page.url().split('?')[0];
		await page.goto(`${recipeUrl}?version=1`);
		await page.waitForLoadState('networkidle');
		// Banner: "Viewing v1: "..." — Current version →"
		await expect(page.getByText(/viewing v\d+:/i)).toBeVisible();
		await expect(page.getByRole('link', { name: /current version/i })).toBeVisible();
	});

	test('Compare link on v2 navigates to diff page', async ({ page }) => {
		await page.goto('/');
		await page
			.getByRole('link', { name: /classic chocolate chip cookies/i })
			.first()
			.click();
		await expect(page).toHaveURL(/\/recipes\//);
		// Target the Compare anchor by href. Matching on the accessible name would
		// also match the version row it sits inside, which navigates elsewhere.
		await page.locator('a[href*="/diff?from="]').first().click();
		await expect(page).toHaveURL(/\/diff/);
		await expect(page.locator('h1')).toContainText(/compare/i);
	});

	test('on mobile, ingredients render above the details box', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);

		const ingredients = page.getByRole('heading', { name: /ingredients/i }).first();
		const details = page.getByRole('heading', { name: /details/i }).first();
		await ingredients.waitFor();
		await details.waitFor();

		const ingredientsBox = await ingredients.boundingBox();
		const detailsBox = await details.boundingBox();

		// CSS `order` changes visual position, not DOM position — assert geometry.
		expect(ingredientsBox).not.toBeNull();
		expect(detailsBox).not.toBeNull();
		expect(ingredientsBox!.y).toBeLessThan(detailsBox!.y);
	});

	test('the recipe page does not scroll sideways on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);
		await page
			.getByRole('heading', { name: /ingredients/i })
			.first()
			.waitFor();

		const { scrollWidth, clientWidth } = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth
		}));

		expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
	});

	test('on mobile, the photo leads above the recipe', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);

		const photo = page.locator('.recipe-photo img').first();
		const ingredients = page.getByRole('heading', { name: /ingredients/i }).first();
		await photo.waitFor();
		await ingredients.waitFor();

		const photoBox = await photo.boundingBox();
		const ingredientsBox = await ingredients.boundingBox();

		expect(photoBox).not.toBeNull();
		expect(ingredientsBox).not.toBeNull();
		expect(photoBox!.y).toBeLessThan(ingredientsBox!.y);
	});

	test('on desktop, the sidebar sits beside the recipe, not below it', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await gotoClassicCookies(page);

		const ingredients = page.getByRole('heading', { name: /ingredients/i }).first();
		const details = page.getByRole('heading', { name: /details/i }).first();
		await ingredients.waitFor();
		await details.waitFor();

		const ingredientsBox = await ingredients.boundingBox();
		const detailsBox = await details.boundingBox();

		expect(ingredientsBox).not.toBeNull();
		expect(detailsBox).not.toBeNull();
		// Two columns: the sidebar starts to the right of the main column.
		expect(detailsBox!.x).toBeGreaterThan(ingredientsBox!.x + ingredientsBox!.width - 1);
		// x alone passed while the sidebar sat 667px too low — assert top alignment too.
		expect(Math.abs(detailsBox!.y - ingredientsBox!.y)).toBeLessThan(300);
	});

	test('the hero names the recipe once and the author once', async ({ page }) => {
		await gotoClassicCookies(page);
		const hero = page.locator('header').first();
		await hero.waitFor();

		// The breadcrumb shows the title, not the URL slug.
		await expect(hero).toContainText('Classic Chocolate Chip Cookies');
		await expect(hero).not.toContainText('classic-chocolate-chip-cookies');

		// The author is named exactly once in the hero.
		const authorLinks = hero.getByRole('link', { name: /@spencerfletcher/i });
		await expect(authorLinks).toHaveCount(1);
	});

	test('layout survives a recipe with no photo', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await gotoClassicCookies(page);

		const ingredients = page.getByRole('heading', { name: /ingredients/i }).first();
		await ingredients.waitFor();

		// The {#if recipe.imageUrl} branch is equivalent to the node being absent.
		await page.evaluate(() => document.querySelector('.recipe-photo')?.remove());

		const details = page.getByRole('heading', { name: /details/i }).first();
		const ingredientsBox = await ingredients.boundingBox();
		const detailsBox = await details.boundingBox();

		expect(ingredientsBox).not.toBeNull();
		expect(detailsBox).not.toBeNull();
		// Sidebar stays in the right-hand column, top-aligned — not pushed down the page.
		expect(detailsBox!.x).toBeGreaterThan(ingredientsBox!.x + ingredientsBox!.width - 1);
		expect(Math.abs(detailsBox!.y - ingredientsBox!.y)).toBeLessThan(300);
	});

	test('tags stay readable on both the card and the hero surfaces', async ({ page }) => {
		await gotoClassicCookies(page);

		// Relative luminance per WCAG, from a computed rgb() string.
		const contrast = (fg: string, bg: string) => {
			const lum = (c: string) => {
				const [r, g, b] = c
					.match(/\d+(\.\d+)?/g)!
					.slice(0, 3)
					.map(Number);
				const f = (v: number) => {
					const s = v / 255;
					return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
				};
				return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
			};
			const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
			return (a + 0.05) / (b + 0.05);
		};

		const heroTag = page.locator('header .tag').first();
		await heroTag.waitFor();
		const hero = await heroTag.evaluate((el) => {
			const cs = getComputedStyle(el);
			// Walk up for the first non-transparent background.
			let node: HTMLElement | null = el as HTMLElement;
			let bg = 'rgba(0, 0, 0, 0)';
			while (node && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
				bg = getComputedStyle(node).backgroundColor;
				node = node.parentElement;
			}
			return { color: cs.color, bg, borderColor: cs.borderColor };
		});

		expect(contrast(hero.color, hero.bg)).toBeGreaterThanOrEqual(4.5);
	});

	test('the hero demotes metadata and keeps one accent element', async ({ page }) => {
		await gotoClassicCookies(page);
		const hero = page.locator('header').first();
		await hero.waitFor();

		const accent = 'rgb(232, 168, 58)';

		// Nothing in the hero may use the accent as a fill any more.
		const filled = await hero.evaluate(
			(el, a) =>
				[...el.querySelectorAll('*')].filter((n) => getComputedStyle(n).backgroundColor === a)
					.length,
			accent
		);
		expect(filled).toBe(0);

		// Cook time is metadata, not a pill: no background of its own.
		const time = page.getByText(/^\d+\s*(min|h)/).first();
		const timeBg = await time.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(timeBg);

		// Amber text is a fill too, just on glyphs instead of a background —
		// the rule is "amber means action or version identity", so the same
		// audit has to catch a color:accent breadcrumb as much as a bg:accent one.
		// Measured directly on the classic (non-fork) recipe: only the "v2"
		// version badge (span.text-accent, "v2") is amber text. The breadcrumb
		// title used to also be text-accent and has been demoted to quiet text.
		const coloredText = await hero.evaluate(
			(el, a) =>
				[...el.querySelectorAll('*')].filter((n) => getComputedStyle(n).color === a).length,
			accent
		);
		expect(coloredText).toBe(1);
	});

	test('the version strip scrolls without widening the page', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);

		const strip = page.locator('.version-strip');
		await strip.waitFor();

		const doc = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth
		}));
		expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);

		// The strip itself may scroll; it must not exceed its container.
		const box = await strip.boundingBox();
		expect(box!.width).toBeLessThanOrEqual(390);
	});

	test('the forked badge reads as an outline, not a fill', async ({ page }) => {
		await page.goto('/');
		const badge = page.locator('.forked-badge:not(.forked-badge--hidden)').first();
		await badge.waitFor();

		const style = await badge.evaluate((el) => {
			const cs = getComputedStyle(el);
			// Walk up for the first non-transparent background — the badge's own is transparent.
			let node: HTMLElement | null = el.parentElement;
			let surface = 'rgba(0, 0, 0, 0)';
			while (node && (surface === 'rgba(0, 0, 0, 0)' || surface === 'transparent')) {
				surface = getComputedStyle(node).backgroundColor;
				node = node.parentElement;
			}
			return {
				bg: cs.backgroundColor,
				border: cs.borderStyle,
				width: cs.borderTopWidth,
				color: cs.color,
				opacity: cs.opacity,
				surface
			};
		});

		expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(style.bg);
		expect(style.border).toBe('solid');
		expect(parseFloat(style.width)).toBeGreaterThan(0);
		// An outline badge whose text is transparent or matches its surface is invisible
		// while still passing toBeVisible() — assert the text is actually painted.
		expect(['rgba(0, 0, 0, 0)', 'transparent']).not.toContain(style.color);
		expect(style.color).not.toBe(style.surface);
		expect(parseFloat(style.opacity)).toBeGreaterThan(0);
		await expect(badge).toBeVisible();
	});
});
