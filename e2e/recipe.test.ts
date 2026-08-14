import { expect, test } from '@playwright/test';

// These tests assume the DB has been seeded with the demo data:
// - "Classic Chocolate Chip Cookies" (2 versions)
// - "Brown Butter Chocolate Chip Cookies" (forked, 1 version)
// - "Chicken Tikka Masala" (3 versions)

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
		// Version history is in the sidebar — all versions visible without expanding.
		// Each row is a div with an explicit role="link"; nothing else on the page uses one.
		const versionRows = page.locator('[role="link"]').filter({ hasText: /v\d+ — / });
		await expect(versionRows).toHaveCount(2);
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
		await page.goto('/recipes/classic-chocolate-chip-cookies-0bNW21');

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

	test('on mobile, the photo leads above the recipe', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await page.goto('/recipes/classic-chocolate-chip-cookies-0bNW21');

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
		await page.goto('/recipes/classic-chocolate-chip-cookies-0bNW21');

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

	test('layout survives a recipe with no photo', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await page.goto('/recipes/classic-chocolate-chip-cookies-0bNW21');

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
});
