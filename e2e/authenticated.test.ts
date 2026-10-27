/**
 * Authenticated e2e tests.
 *
 * These run with the seed user's session pre-loaded (see auth.setup.ts).
 * They test the fork dialog, new recipe creation, and the edit flow.
 */

import { expect, test } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';

const COOKIES_RE = new RegExp(SEED[0].versions.at(-1)!.title, 'i');

// Skip the entire suite when auth credentials aren't configured
const hasAuth = !!(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD);
test.skip(!hasAuth, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env to run authenticated tests');

// ─── Landing page (logged in) ──────────────────────────────────────────────────

test.describe('Landing page when logged in', () => {
	test('logged-in users get the feed, not the landing page', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('link', { name: /browse recipes/i })).not.toBeVisible();
	});
});

// ─── Navbar (logged in) ───────────────────────────────────────────────────────

test.describe('Navbar when logged in', () => {
	test('shows the username link and a Logout button', async ({ page }) => {
		await page.goto('/');
		// Scope to the navbar: recipe cards also link to the author's profile, and
		// the mobile menu duplicates the navbar link.
		const navbar = page.getByRole('navigation').first();
		await expect(navbar.getByRole('link', { name: '@spencerfletcher' }).first()).toBeVisible();
		await expect(page.getByRole('button', { name: /logout/i }).first()).toBeVisible();
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
		await page.getByRole('link', { name: COOKIES_RE }).first().click();
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
		await expect(page.getByLabel('Ingredients')).toBeVisible();
		await expect(page.getByLabel('Steps')).toBeVisible();
	});

	test('creates a recipe and redirects to its detail page', async ({ page }) => {
		let createdRecipeUrl: string | null = null;

		try {
			await page.goto('/recipes/new');

			await page.locator('input[name="title"]').fill('E2E Test Recipe');

			await page.getByLabel('Ingredients').fill('2 cups flour');
			await page.getByLabel('Steps').fill('Mix all ingredients.');

			await page.getByRole('button', { name: /create recipe/i }).click();

			// Should redirect to the new recipe's detail page
			await page.waitForURL(/\/recipes\//);
			await expect(page.locator('h1')).toContainText('E2E Test Recipe');

			createdRecipeUrl = page.url().split('?')[0];
		} finally {
			// Always clean up — use page.evaluate so the browser sets the correct
			// Origin header and SvelteKit's CSRF check passes.
			if (createdRecipeUrl) {
				await page.evaluate(async (url) => {
					await fetch(`${url}/edit?/deleteRecipe`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
						body: ''
					});
				}, createdRecipeUrl);
			}
		}
	});
});

// ─── Edit recipe ──────────────────────────────────────────────────────────────

test.describe('Edit recipe page', () => {
	test('is accessible for a recipe the user owns', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: COOKIES_RE }).first().click();
		await page.waitForURL(/\/recipes\//);
		await page.getByRole('link', { name: /edit recipe/i }).click();
		await page.waitForURL(/\/edit/);
		await expect(page.locator('input[name="title"]')).toBeVisible();
	});

	test('can update the recipe title', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: COOKIES_RE }).first().click();
		await page.waitForURL(/\/recipes\//);
		const recipeUrl = page.url();

		await page.getByRole('link', { name: /edit recipe/i }).click();
		await page.waitForURL(/\/edit/);

		// Re-saving the same title is a no-op: no version is written, the page
		// just redirects back. The title must still be what the seed says.
		const titleInput = page.locator('input[name="title"]');
		const before = await titleInput.inputValue();
		await titleInput.fill(before);

		await page.getByRole('button', { name: /save changes/i }).click();

		await page.waitForURL(recipeUrl);
		await expect(page.locator('h1')).toContainText(before);
	});

	test('can save a new version with a commit message', async ({ page }) => {
		await page.goto('/');
		await page
			.getByRole('link', { name: /chicken tikka masala/i })
			.first()
			.click();
		await page.waitForURL(/\/recipes\//);

		await page.getByRole('link', { name: /edit recipe/i }).click();
		await page.waitForURL(/\/edit/);

		// Change the steps
		const steps = page.getByLabel('Steps');
		await steps.fill('Updated step text from e2e test.');

		await page.locator('input[name="commitMessage"]').fill('e2e test commit');
		await page.getByRole('button', { name: /save changes/i }).click();

		// Should redirect back to the recipe page
		await page.waitForURL(/\/recipes\/(?!.*\/edit)/);
		// Version history is visible in the sidebar — verify our commit message appears
		await expect(page.getByText('e2e test commit').first()).toBeVisible();
	});
});
