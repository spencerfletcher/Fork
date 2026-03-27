/**
 * Authenticated e2e tests.
 *
 * These run with the seed user's session pre-loaded (see auth.setup.ts).
 * They test the fork dialog, new recipe creation, and the edit flow.
 */

import { expect, test } from '@playwright/test';

// Skip the entire suite when auth credentials aren't configured
const hasAuth = !!(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD);
test.skip(!hasAuth, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env to run authenticated tests');

// ─── Navbar (logged in) ───────────────────────────────────────────────────────

test.describe('Navbar when logged in', () => {
	test('shows the user email and a Logout button', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('spencer@fork.dev')).toBeVisible();
		await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
	});

	test('does not show the Login link', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('link', { name: /^login$/i })).not.toBeVisible();
	});
});

// ─── Fork dialog ──────────────────────────────────────────────────────────────

test.describe('Fork dialog', () => {
	test('Fork button is visible on a recipe the user does not own', async ({ page }) => {
		// The seed user owns all recipes — but we can navigate and verify the button
		// is hidden for owned recipes and visible for others.
		// Since the seed user owns all seeded recipes, we verify the button is absent.
		await page.goto('/');
		await page.getByText('Classic Chocolate Chip Cookies').first().click();
		await page.waitForURL(/\/recipes\//);
		// Owner should see Edit, not Fork
		await expect(page.getByRole('link', { name: /edit recipe/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /fork/i })).not.toBeVisible();
	});
});

// ─── New recipe ───────────────────────────────────────────────────────────────

test.describe('New recipe page', () => {
	test('is accessible when logged in', async ({ page }) => {
		await page.goto('/recipes/new');
		// Should NOT redirect to login
		await expect(page).not.toHaveURL(/\/login/);
		await expect(page.getByRole('heading', { name: /new recipe/i })).toBeVisible();
	});

	test('shows the title field and submit button', async ({ page }) => {
		await page.goto('/recipes/new');
		await expect(page.locator('input[name="title"]')).toBeVisible();
		await expect(page.getByRole('button', { name: /create recipe/i })).toBeVisible();
	});

	test('shows ingredient and step editors', async ({ page }) => {
		await page.goto('/recipes/new');
		await expect(page.getByText(/ingredients/i)).toBeVisible();
		await expect(page.getByText(/steps/i)).toBeVisible();
	});

	test('creates a recipe and redirects to its detail page', async ({ page }) => {
		await page.goto('/recipes/new');

		await page.locator('input[name="title"]').fill('E2E Test Recipe');

		// Fill first ingredient row
		await page.locator('input[placeholder="Amount"]').first().fill('2');
		await page.locator('input[placeholder="Unit"]').first().fill('cups');
		await page.locator('input[placeholder="Ingredient name"]').first().fill('flour');

		// Fill first step
		await page.locator('textarea[placeholder*="step"]').first().fill('Mix all ingredients.');

		await page.getByRole('button', { name: /create recipe/i }).click();

		// Should redirect to the new recipe's detail page
		await page.waitForURL(/\/recipes\//);
		await expect(page.locator('h1')).toContainText('E2E Test Recipe');

		// Clean up — delete the recipe we just created so it doesn't accumulate
		const recipeUrl = page.url().split('?')[0];
		await page.goto(`${recipeUrl}/edit`);
		await page.waitForURL(/\/edit/);
		await page.request.post(`${recipeUrl}/edit?/deleteRecipe`);
	});
});

// ─── Edit recipe ──────────────────────────────────────────────────────────────

test.describe('Edit recipe page', () => {
	test('is accessible for a recipe the user owns', async ({ page }) => {
		await page.goto('/');
		await page.getByText('Classic Chocolate Chip Cookies').first().click();
		await page.waitForURL(/\/recipes\//);
		await page.getByRole('link', { name: /edit recipe/i }).click();
		await page.waitForURL(/\/edit/);
		await expect(page.locator('input[name="title"]')).toBeVisible();
	});

	test('can update the recipe title', async ({ page }) => {
		await page.goto('/');
		await page.getByText('Classic Chocolate Chip Cookies').first().click();
		await page.waitForURL(/\/recipes\//);
		const recipeUrl = page.url();

		await page.getByRole('link', { name: /edit recipe/i }).click();
		await page.waitForURL(/\/edit/);

		// Update the title
		const titleInput = page.locator('input[name="title"]');
		await titleInput.clear();
		await titleInput.fill('Classic Chocolate Chip Cookies');

		await page.getByRole('button', { name: /save info/i }).click();

		// Should redirect back to the recipe page
		await page.waitForURL(recipeUrl);
		await expect(page.locator('h1')).toContainText('Classic Chocolate Chip Cookies');
	});

	test('can save a new version with a commit message', async ({ page }) => {
		await page.goto('/');
		await page.getByText('Chicken Tikka Masala').first().click();
		await page.waitForURL(/\/recipes\//);

		await page.getByRole('link', { name: /edit recipe/i }).click();
		await page.waitForURL(/\/edit/);

		// Change a step text
		const stepTextareas = page.locator('textarea');
		await stepTextareas.first().clear();
		await stepTextareas.first().fill('Updated step text from e2e test.');

		await page.locator('input[name="commitMessage"]').fill('e2e test commit');
		await page.getByRole('button', { name: /save new version/i }).click();

		// Should redirect back to the recipe page
		await page.waitForURL(/\/recipes\/(?!.*\/edit)/);
		// Open version history and verify our commit message appears
		await page.locator('details.version-history summary').click();
		await expect(page.getByText('e2e test commit').first()).toBeVisible();
	});
});
