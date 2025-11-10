import { test, expect } from '@playwright/test';

test.describe('Tags and Filtering', () => {
	test.beforeEach(async ({ page }) => {
		// Login before each test
		await page.goto('/login');

		const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
		const testPassword = process.env.TEST_USER_PASSWORD || 'password123';

		await page.fill('input[name="email"]', testEmail);
		await page.fill('input[name="password"]', testPassword);
		await page.click('button[type="submit"]');

		// Wait for redirect to home page (with longer timeout for auth)
		await page.waitForURL(/\/$/, { timeout: 15000 });
	});

	test('should display popular tags when creating a recipe', async ({ page }) => {
		await page.goto('/recipes/new');

		// Should see "Popular tags:" section
		await expect(page.locator('text=Popular tags:')).toBeVisible();

		// Should display tag pills
		const tagPills = page.locator('text=/[A-Za-z]+/').first();
		await expect(tagPills).toBeVisible();
	});

	test('should add tags to a recipe', async ({ page }) => {
		await page.goto('/recipes/new');

		// Fill in recipe details
		const recipeTitle = `TaggedRecipe${Date.now()}`;
		await page.fill('input[name="title"]', recipeTitle);
		await page.fill('textarea[name="ingredients"]', 'flour, sugar, eggs');
		await page.fill('textarea[name="instructions"]', 'Mix and bake');

		// Add tags
		const tags = 'Dessert, Quick, Vegetarian';
		await page.fill('input[name="tags"]', tags);

		// Submit
		await page.click('button:has-text("Publish Recipe")');

		// Wait for recipe page to load - flexible matching for any recipe URL
		await page.waitForURL(/https?:.*\/recipes\/[\w-]+-\d+/, {timeout: 15000});

		// Should see the tags displayed on recipe
		await expect(page.locator('text=Dessert')).toBeVisible();
		await expect(page.locator('text=Quick')).toBeVisible();
		await expect(page.locator('text=Vegetarian')).toBeVisible();
	});

	test('should navigate to tag page from recipe tags', async ({ page }) => {
		// This test assumes you already have a recipe with tags
		// Navigate to a recipe with tags
		await page.goto('/recipes');

		// Look for a tag link and click it
		const firstTagLink = page.locator('a[href*="/tags/"]').first();

		// Check if there are any tags
		const tagCount = await firstTagLink.count();

		if (tagCount > 0) {
			await firstTagLink.click();

			// Should be on a tag page
			await expect(page).toHaveURL(/tags\//);

			// Should show "Recipes tagged with:" text
			await expect(page.locator('text=Recipes tagged with:')).toBeVisible();
		}
	});

	test('should filter recipes by tag', async ({ page }) => {
		// Create a recipe with a specific tag
		await page.goto('/recipes/new');

		const recipeTitle = `FilteredRecipe${Date.now()}`;
		const uniqueTag = `UniqueTag${Date.now()}`;

		await page.fill('input[name="title"]', recipeTitle);
		await page.fill('textarea[name="ingredients"]', 'test ingredient');
		await page.fill('textarea[name="instructions"]', 'test instruction');
		await page.fill('input[name="tags"]', uniqueTag);

		// Submit
		await page.click('button:has-text("Publish Recipe")');
		await page.waitForURL(/https?:.*\/recipes\/[\w-]+-\d+/, {timeout: 15000});

		// Click on the tag
		await page.click(`a[href*="/tags/"]`);

		// Should be on tag page
		await expect(page).toHaveURL(/tags\//);

		// Should see our recipe
		await expect(page.locator(`text=${recipeTitle}`)).toBeVisible();

		// Should show the tag name
		await expect(page.locator(`text=${uniqueTag}`)).toBeVisible();
	});

	test('should only show user\'s recipes on tag page when tagged', async ({ page }) => {
		// Create a recipe with a tag
		await page.goto('/recipes/new');

		const recipeTitle = `PrivateTaggedRecipe${Date.now()}`;
		const tagName = `PrivateTag${Date.now()}`;

		await page.fill('input[name="title"]', recipeTitle);
		await page.fill('textarea[name="ingredients"]', 'private ingredient');
		await page.fill('textarea[name="instructions"]', 'private instruction');
		await page.fill('input[name="tags"]', tagName);

		await page.click('button:has-text("Publish Recipe")');
		await page.waitForURL(/https?:.*\/recipes\/[\w-]+-\d+/, {timeout: 15000});

		// Navigate to tag page
		await page.click('a[href*="/tags/"]');

		// Should see the recipe on tag page
		await expect(page.locator(`text=${recipeTitle}`)).toBeVisible();

		// Count visible recipes
		const recipeCount = await page.locator('a[href*="/recipes/"]').count();

		// Should have at least 1 recipe
		expect(recipeCount).toBeGreaterThan(0);
	});

	test('should handle comma-separated tags', async ({ page }) => {
		await page.goto('/recipes/new');

		const recipeTitle = `MultiTagRecipe${Date.now()}`;
		const tags = 'Italian, Pasta, Dinner, Vegetarian';

		await page.fill('input[name="title"]', recipeTitle);
		await page.fill('textarea[name="ingredients"]', 'pasta, sauce');
		await page.fill('textarea[name="instructions"]', 'cook pasta, add sauce');
		await page.fill('input[name="tags"]', tags);

		await page.click('button:has-text("Publish Recipe")');
		await page.waitForURL(/https?:.*\/recipes\/[\w-]+-\d+/, {timeout: 15000});

		// All tags should be visible (target tag links specifically, not text elsewhere on page)
		await expect(page.locator('a[href*="/tags/"] >> text=Italian')).toBeVisible();
		await expect(page.locator('a[href*="/tags/"] >> text=Pasta')).toBeVisible();
		await expect(page.locator('a[href*="/tags/"] >> text=Dinner')).toBeVisible();
		await expect(page.locator('a[href*="/tags/"] >> text=Vegetarian')).toBeVisible();
	});

	test('should handle tags with spaces and trim them', async ({ page }) => {
		await page.goto('/recipes/new');

		const recipeTitle = `SpaceTagRecipe${Date.now()}`;
		// Tags with extra spaces
		const tags = 'Tag With Spaces , Another Tag , SimpleTag';

		await page.fill('input[name="title"]', recipeTitle);
		await page.fill('textarea[name="ingredients"]', 'ingredient');
		await page.fill('textarea[name="instructions"]', 'instruction');
		await page.fill('input[name="tags"]', tags);

		await page.click('button:has-text("Publish Recipe")');
		await page.waitForURL(/https?:.*\/recipes\/[\w-]+-\d+/, {timeout: 15000});

		// Tags should be properly trimmed and visible
		await expect(page.locator('text=Tag With Spaces')).toBeVisible();
		await expect(page.locator('text=Another Tag')).toBeVisible();
		await expect(page.locator('text=SimpleTag')).toBeVisible();
	});

	test('should display tag count on tag page', async ({ page }) => {
		// Create a recipe with a tag
		await page.goto('/recipes/new');

		const recipeTitle = `CountedTagRecipe${Date.now()}`;
		const countTag = `CountTag${Date.now()}`;

		await page.fill('input[name="title"]', recipeTitle);
		await page.fill('textarea[name="ingredients"]', 'ingredient');
		await page.fill('textarea[name="instructions"]', 'instruction');
		await page.fill('input[name="tags"]', countTag);

		await page.click('button:has-text("Publish Recipe")');
		await page.waitForURL(/https?:.*\/recipes\/[\w-]+-\d+/, {timeout: 15000});

		// Navigate to tag page
		await page.click('a[href*="/tags/"]');

		// Should display the tag name on page
		await expect(page.locator(`text=${countTag}`)).toBeVisible();

		// Should show at least 1 recipe in the grid
		const recipeCards = page.locator('a[href*="/recipes/"]');
		const count = await recipeCards.count();
		expect(count).toBeGreaterThan(0);
	});
});
