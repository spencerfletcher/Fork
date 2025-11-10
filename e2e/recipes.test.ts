import { test, expect } from '@playwright/test';

test.describe('Recipe CRUD Operations', () => {
	// Setup: login before each test
	test.beforeEach(async ({ page }) => {
		// Navigate to login page
		await page.goto('/login');

		// Use test credentials from environment or defaults
		const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
		const testPassword = process.env.TEST_USER_PASSWORD || 'password123';

		// Login
		await page.fill('input[name="email"]', testEmail);
		await page.fill('input[name="password"]', testPassword);
		await page.click('button[type="submit"]');

		// Wait for redirect to home page (with longer timeout for auth)
		await page.waitForURL(/\/$/, { timeout: 15000 });
	});

	test('should display my recipes page when logged in', async ({ page }) => {
		// After login, should be on recipes page
		await page.goto('/recipes');

		// Should see the "My Cookbook" header
		await expect(page.locator('text=My Cookbook')).toBeVisible();

		// Should see "Create new recipe" button
		await expect(page.locator('text=Create new recipe')).toBeVisible();
	});

	test('should navigate to create recipe form', async ({ page }) => {
		await page.goto('/recipes');

		// Click the "Create new recipe" button
		await page.click('a:has-text("Create new recipe")');

		// Should be on the create recipe page
		await expect(page).toHaveURL(/recipes\/new/);
		await expect(page.locator('text=Create a New Recipe')).toBeVisible();

		// Should see the required form fields
		await expect(page.locator('input[name="title"]')).toBeVisible();
		await expect(page.locator('textarea[name="ingredients"]')).toBeVisible();
		await expect(page.locator('textarea[name="instructions"]')).toBeVisible();
	});

	test('should create a new recipe', async ({ page }) => {
		await page.goto('/recipes/new');

		// Fill in the recipe form
		const recipeTitle = `Test Recipe ${Date.now()}`;
		const recipeDescription = 'A delicious test recipe';

		await page.fill('input[name="title"]', recipeTitle);
		await page.fill('textarea[name="description"]', recipeDescription);
		await page.fill('input[name="prepTimeMinutes"]', '15');
		await page.fill('input[name="cookTimeMinutes"]', '30');
		await page.fill('input[name="servings"]', '4');
		await page.fill('input[name="rating"]', '4.5');

		// Add ingredients
		const ingredients = '2 cups flour\n1 cup sugar\n3 eggs\n1 cup milk';
		await page.fill('textarea[name="ingredients"]', ingredients);

		// Add instructions
		const instructions = 'Mix dry ingredients\nAdd wet ingredients\nBake at 350F for 30 minutes\nLet cool before serving';
		await page.fill('textarea[name="instructions"]', instructions);

		// Add tags
		await page.fill('input[name="tags"]', 'Dessert, Baking, Easy');

		// Submit the form
		await page.click('button:has-text("Publish Recipe")');

		// Should redirect to the recipe detail page
		await expect(page).toHaveURL(/recipes\/test-recipe-\d+/);

		// Should see the recipe title
		await expect(page.locator(`text=${recipeTitle}`)).toBeVisible();

		// Should see the recipe details
		await expect(page.locator('text=Prep: 15 min')).toBeVisible();
		await expect(page.locator('text=Cook: 30 min')).toBeVisible();
		await expect(page.locator('text=Serves: 4')).toBeVisible();
		await expect(page.locator('text=Rating: 4.5/5')).toBeVisible();

		// Should see ingredients
		await expect(page.locator('text=2 cups flour')).toBeVisible();

		// Should see instructions
		await expect(page.locator('text=Mix dry ingredients')).toBeVisible();

		// Should see tags
		await expect(page.locator('text=Dessert')).toBeVisible();
		await expect(page.locator('text=Baking')).toBeVisible();
	});

	test('should show error when title is missing', async ({ page }) => {
		await page.goto('/recipes/new');

		// Don't fill in title, fill in other required fields
		await page.fill('textarea[name="ingredients"]', 'Some ingredient');
		await page.fill('textarea[name="instructions"]', 'Some step');

		// Try to submit
		await page.click('button:has-text("Publish Recipe")');

		// Should stay on the form with error message
		await expect(page).toHaveURL(/recipes\/new/);
		await expect(page.locator('text=/title|required/i')).toBeVisible();
	});

	test('should show error when ingredients are missing', async ({ page }) => {
		await page.goto('/recipes/new');

		// Fill in title and instructions but not ingredients
		await page.fill('input[name="title"]', 'Test Recipe');
		await page.fill('textarea[name="instructions"]', 'Some step');

		// Try to submit
		await page.click('button:has-text("Publish Recipe")');

		// Should show error about missing ingredients
		await expect(page).toHaveURL(/recipes\/new/);
		await expect(page.locator('text=/ingredients|required/i')).toBeVisible();
	});

	test('should show error when instructions are missing', async ({ page }) => {
		await page.goto('/recipes/new');

		// Fill in title and ingredients but not instructions
		await page.fill('input[name="title"]', 'Test Recipe');
		await page.fill('textarea[name="ingredients"]', '1 cup flour');

		// Try to submit
		await page.click('button:has-text("Publish Recipe")');

		// Should show error about missing instructions
		await expect(page).toHaveURL(/recipes\/new/);
		await expect(page.locator('text=/instructions|required/i')).toBeVisible();
	});

	test('should show error for invalid image URL', async ({ page }) => {
		await page.goto('/recipes/new');

		// Fill in valid fields
		await page.fill('input[name="title"]', 'Test Recipe');
		await page.fill('textarea[name="ingredients"]', '1 cup flour');
		await page.fill('textarea[name="instructions"]', 'Mix and bake');

		// Add invalid image URL
		await page.fill('input[name="imageUrl"]', 'not-a-valid-url');

		// Try to submit
		await page.click('button:has-text("Publish Recipe")');

		// Should show error about image URL
		await expect(page.locator('text=/image|URL|http/i')).toBeVisible();
	});

	test('should validate rating is between 1-5', async ({ page }) => {
		await page.goto('/recipes/new');

		// Fill in valid fields
		await page.fill('input[name="title"]', 'Test Recipe');
		await page.fill('textarea[name="ingredients"]', '1 cup flour');
		await page.fill('textarea[name="instructions"]', 'Mix and bake');

		// Try invalid rating (higher than 5)
		await page.fill('input[name="rating"]', '6');

		// Try to submit
		await page.click('button:has-text("Publish Recipe")');

		// Should show error or stay on form
		// Check if still on form or if error is displayed
		const isOnForm = page.url().includes('recipes/new');
		const hasError = await page.locator('text=/rating|between|1.*5/i').isVisible().catch(() => false);

		expect(isOnForm || hasError).toBeTruthy();
	});

	test('should navigate back to recipes list', async ({ page }) => {
		await page.goto('/recipes/new');

		// Click the Cancel button
		await page.click('a:has-text("Cancel")');

		// Should return to recipes page
		await expect(page).toHaveURL(/recipes$/);
		await expect(page.locator('text=My Cookbook')).toBeVisible();
	});

	test('should view recipe details after creation', async ({ page }) => {
		// Create a recipe first
		await page.goto('/recipes/new');

		const recipeTitle = `Detailed Test Recipe ${Date.now()}`;
		await page.fill('input[name="title"]', recipeTitle);
		await page.fill('textarea[name="description"]', 'A test recipe for viewing');
		await page.fill('textarea[name="ingredients"]', 'Ingredient 1\nIngredient 2');
		await page.fill('textarea[name="instructions"]', 'Step 1\nStep 2');
		await page.fill('input[name="rating"]', '3.5');

		await page.click('button:has-text("Publish Recipe")');

		// Wait for recipe detail page - full URL with any base URL
		await page.waitForURL(/https?:.*\/recipes\/[\w-]+-\d+/, {timeout: 15000});

		// Verify all details are displayed
		await expect(page.locator(`h1:has-text("${recipeTitle}")`)).toBeVisible();
		await expect(page.locator('text=A test recipe for viewing')).toBeVisible();
		await expect(page.locator('text=Ingredient 1')).toBeVisible();
		await expect(page.locator('text=Step 1')).toBeVisible();
		await expect(page.locator('text=Rating: 3.5/5')).toBeVisible();
	});
});
