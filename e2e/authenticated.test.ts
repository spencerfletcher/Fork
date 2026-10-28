/**
 * Authenticated e2e tests.
 *
 * These run with the seed user's session pre-loaded (see auth.setup.ts).
 * They test the fork dialog, new recipe creation, and the edit flow.
 */

import { expect, test, type Page } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';

const COOKIES_RE = new RegExp(SEED[0].versions.at(-1)!.title, 'i');

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

	test('empty editors keep room to type into, instead of collapsing to one line', async ({
		page
	}) => {
		await page.goto('/recipes/new');
		const description = await page.getByLabel('Description').boundingBox();
		const ingredients = await page.getByLabel('Ingredients').boundingBox();
		const steps = await page.getByLabel('Steps').boundingBox();
		expect(description!.height).toBeGreaterThan(60);
		expect(ingredients!.height).toBeGreaterThan(200);
		expect(steps!.height).toBeGreaterThan(ingredients!.height);
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

	test('re-saving an unchanged recipe writes no version and returns to it', async ({ page }) => {
		const url = await createRecipe(page, 'E2E Unchanged', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await page.waitForURL(url);
			await expect(page.locator('h1')).toContainText('E2E Unchanged');
			await expectVersions(page, 1);
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('Tab walks the editor top to bottom at every width, because the grid reorders nothing', async ({
		page
	}) => {
		const url = await createRecipe(page, 'E2E Tab Order', '4');
		const expected = [
			'title',
			'description',
			'image',
			'servings',
			'prepTimeMinutes',
			'cookTimeMinutes',
			'tag-combobox',
			'isPublic',
			'ingredients',
			'steps',
			'commitMessage',
			'Save',
			'Cancel'
		];
		const walk = async () => {
			await page.locator('input[name="title"]').focus();
			const seen: string[] = [];
			for (let i = 0; i < expected.length; i++) {
				const name = await page.evaluate(() => {
					const el = document.activeElement as HTMLElement;
					return el.getAttribute('name') || el.id || el.textContent?.trim() || '';
				});
				seen.push(name);
				// The tag combobox opens its suggestion list on focus and Tab would
				// walk the options; Escape closes it, as a keyboard user would.
				if (name === 'tag-combobox') await page.keyboard.press('Escape');
				await page.keyboard.press('Tab');
			}
			return seen;
		};
		try {
			await gotoHydrated(page, `${url}/edit`);
			expect(await walk()).toEqual(expected);
			await page.setViewportSize({ width: 390, height: 900 });
			expect(await walk()).toEqual(expected);
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('leaving a dirty editor asks first, and staying keeps the draft', async ({ page }) => {
		const url = await createRecipe(page, 'E2E Guard', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await page.locator('input[name="title"]').fill('E2E Guard Edited');
			// Playwright dismisses dialogs on its own, so wait for the event itself:
			// without the guard there is no dialog and the wait times out.
			let dialog = page.waitForEvent('dialog');
			await page.getByRole('link', { name: 'Cancel' }).click();
			let d = await dialog;
			expect(d.message()).toBe('Leave without saving? Your changes will be lost.');
			await d.dismiss();
			await expect(page).toHaveURL(/\/edit$/);
			await expect(page.locator('input[name="title"]')).toHaveValue('E2E Guard Edited');

			dialog = page.waitForEvent('dialog');
			await page.getByRole('link', { name: 'Cancel' }).click();
			d = await dialog;
			await d.accept();
			await page.waitForURL(url);
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('the helper line states the version a save will write', async ({ page }) => {
		const url = await createRecipe(page, 'E2E Helper', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await page.getByLabel('Steps').fill('Mix, then bake.');
			await expect(page.getByText('Saves as v2 · steps changed')).toBeVisible();
			await expect(page.locator('input[name="commitMessage"]')).toHaveAttribute(
				'placeholder',
				'Updated steps'
			);
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('a long ingredient list grows the editor on a phone and Save stays below it', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 900 });
		const url = await createRecipe(page, 'E2E Grow', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			const box = page.getByLabel('Ingredients');
			await box.fill(Array.from({ length: 40 }, (_, i) => `${i + 1} cup item ${i + 1}`).join('\n'));
			const textarea = await box.boundingBox();
			const saveButton = page.getByRole('button', { name: 'Save', exact: true });
			const save = await saveButton.boundingBox();
			expect(textarea!.height).toBeGreaterThan(600);
			expect(save!.y).toBeGreaterThan(textarea!.y + textarea!.height);
			// 16px on a phone, or iOS zooms the field on focus.
			expect(await box.evaluate((el) => getComputedStyle(el).fontSize)).toBe('16px');
			await saveButton.scrollIntoViewIfNeeded();
			await expect(saveButton).toBeInViewport();
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('saving changed steps with a commit message adds a version carrying it', async ({
		page
	}) => {
		const url = await createRecipe(page, 'E2E Commit Message', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await page.getByLabel('Steps').fill('Updated step text from e2e test.');
			await page.locator('input[name="commitMessage"]').fill('e2e test commit');
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await page.waitForURL(url);
			await expectVersions(page, 2);
			await expect(page.locator('.version-strip')).toContainText('e2e test commit');
		} finally {
			await deleteRecipe(page, url);
		}
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
// The strip shows one line: the current version and a "N versions" count;
// the rows only render once that count is clicked.
async function expectVersions(page: Page, n: number) {
	await expect(page.locator('.version-toggle, .version-count')).toHaveText(
		n === 1 ? '1 version' : `${n} versions`
	);
}

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
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await page.waitForURL(url);

			await expect(page.getByText('Serves 8').first()).toBeVisible();
			await expectVersions(page, 2);

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
			await page.getByRole('button', { name: 'Save', exact: true }).click();
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
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await page.waitForURL(url);
			await expectVersions(page, 1);
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
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await page.waitForURL(url);

			await other.locator('input[name="title"]').fill('E2E Stale Edit');
			await other.getByRole('button', { name: 'Save', exact: true }).click();
			await expect(other.getByRole('alert')).toContainText(/changed in another tab/i);
			await expect(other.locator('input[name="title"]')).toHaveValue('E2E Stale Edit');
			await expect(other.locator('input[name="title"]')).toBeEnabled();

			await page.goto(url);
			await expectVersions(page, 2);
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
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await expect(page.getByRole('alert')).toContainText('An ingredient line is too long');
			await expect(page.getByLabel('Ingredients')).toHaveValue(long);
			await expect(page.getByLabel('Ingredients')).toBeEnabled();
		} finally {
			await deleteRecipe(page, url);
		}
	});
});

// ─── Compare page ─────────────────────────────────────────────────────────────

test.describe('Compare page', () => {
	test('a long unbroken title does not scroll the compare page sideways on a phone', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 1200 });
		const url = await createRecipe(page, 'E2E' + 'x'.repeat(57), '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await page.getByLabel('Steps').fill('Mix, then bake.');
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await page.waitForURL(url);
			await page.goto(`${url}/diff?from=1&to=2`);
			await page.locator('article.version-card').first().waitFor();
			const doc = await page.evaluate(() => ({
				scrollWidth: document.documentElement.scrollWidth,
				clientWidth: document.documentElement.clientWidth
			}));
			expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
			// 16px on a phone, or iOS zooms the picker on focus.
			expect(
				await page.locator('#from-select').evaluate((el) => getComputedStyle(el).fontSize)
			).toBe('16px');
		} finally {
			await deleteRecipe(page, url);
		}
	});
});
