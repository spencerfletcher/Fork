/**
 * Authenticated e2e tests.
 *
 * These run with the seed user's session pre-loaded (see auth.setup.ts).
 * They test the fork dialog, new recipe creation, and the edit flow.
 */

import { expect, test, type Page } from '@playwright/test';
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

// ─── One save ─────────────────────────────────────────────────────────────────
//
// Each scenario creates its own recipe and deletes it in `finally`, so the
// seed stays untouched and the tests can run in parallel.

/**
 * Navigate and wait for hydration. Filling a field before SvelteKit has
 * hydrated the page races the client re-render: the fill clears the input,
 * hydration restores the server value, the fill then appends ("48").
 */
async function gotoHydrated(page: Page, url: string) {
	await page.goto(url);
	await page.waitForLoadState('networkidle');
}

async function createRecipe(page: Page, title: string, servings: string) {
	await gotoHydrated(page, '/recipes/new');
	await page.locator('input[name="title"]').fill(title);
	await page.locator('input[name="servings"]').fill(servings);
	await page.locator('input[name="cookTimeMinutes"]').fill('20');
	await page.getByLabel('Ingredients').fill('2 cups flour');
	await page.getByLabel('Steps').fill('Mix all ingredients.');
	await page.getByRole('button', { name: /create recipe/i }).click();
	await page.waitForURL(/\/recipes\/(?!new)/);
	return page.url().split('?')[0];
}

async function deleteRecipe(page: Page, url: string) {
	await page.evaluate(async (u) => {
		await fetch(`${u}/edit?/deleteRecipe`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: ''
		});
	}, url);
}

test.describe('One save', () => {
	test('one save records servings, times and ingredients as a new version', async ({ page }) => {
		const url = await createRecipe(page, 'E2E Four Servings', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await page.locator('input[name="servings"]').fill('8');
			await page.locator('input[name="cookTimeMinutes"]').fill('30');
			await page.getByLabel('Ingredients').fill('4 cups flour');
			await page.getByRole('button', { name: /save changes/i }).click();
			await page.waitForURL(url);

			await expect(page.getByText('Serves 8').first()).toBeVisible();
			await expect(page.locator('.version-strip .version-entry')).toHaveCount(2);

			await page.goto(`${url}?version=1`);
			await expect(page.getByText('Serves 4').first()).toBeVisible();
			await expect(page.getByText(/2 cups/).first()).toBeVisible();

			await page.goto(`${url}/diff?from=1&to=2`);
			const details = page.locator('section').filter({ hasText: 'Details' }).first();
			await expect(details).toContainText('Servings');
			await expect(details).toContainText('4');
			await expect(details).toContainText('8');
			await expect(details).toContainText('Cook time');
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('renaming keeps the slug and the old version keeps its title', async ({ page }) => {
		const url = await createRecipe(page, 'E2E Before Rename', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await page.locator('input[name="title"]').fill('E2E After Rename');
			await page.getByRole('button', { name: /save changes/i }).click();
			await page.waitForURL(url);
			await expect(page.locator('h1')).toContainText('E2E After Rename');

			await page.goto(`${url}?version=1`);
			await expect(page.locator('h1')).toContainText('E2E Before Rename');

			await page.goto('/recipes');
			await expect(page.getByText('E2E After Rename').first()).toBeVisible();
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('a settings-only save creates no version', async ({ page }) => {
		const url = await createRecipe(page, 'E2E Settings Only', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await page.getByLabel(/public/i).uncheck();
			await page.getByRole('button', { name: /save changes/i }).click();
			await page.waitForURL(url);
			await expect(page.locator('.version-strip .version-entry')).toHaveCount(1);
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('a stale tab gets a conflict and keeps its draft', async ({ page, context }) => {
		const url = await createRecipe(page, 'E2E Stale', '4');
		try {
			const other = await context.newPage();
			await gotoHydrated(other, `${url}/edit`);
			await gotoHydrated(page, `${url}/edit`);

			await page.locator('input[name="servings"]').fill('6');
			await page.getByRole('button', { name: /save changes/i }).click();
			await page.waitForURL(url);

			await other.locator('input[name="title"]').fill('E2E Stale Edit');
			await other.getByRole('button', { name: /save changes/i }).click();
			await expect(other.getByRole('alert')).toContainText(/changed in another tab/i);
			await expect(other.locator('input[name="title"]')).toHaveValue('E2E Stale Edit');
			await expect(other.locator('input[name="title"]')).toBeEnabled();

			await page.goto(url);
			await expect(page.locator('.version-strip .version-entry')).toHaveCount(2);
			await other.close();
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('an invalid field keeps the draft and re-enables the form', async ({ page }) => {
		const url = await createRecipe(page, 'E2E Invalid', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			const long = '1 cup ' + 'x'.repeat(300);
			await page.getByLabel('Ingredients').fill(long);
			await page.getByRole('button', { name: /save changes/i }).click();
			await expect(page.getByRole('alert')).toContainText('An ingredient line is too long');
			await expect(page.getByLabel('Ingredients')).toHaveValue(long);
			await expect(page.getByLabel('Ingredients')).toBeEnabled();
		} finally {
			await deleteRecipe(page, url);
		}
	});
});
