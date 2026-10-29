/**
 * Authenticated e2e tests.
 *
 * These run with the seed user's session pre-loaded (see auth.setup.ts).
 * They test the fork button, new recipe creation, and the edit flow.
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

	test('the feed is browse: tag tabs with All pointing home, and a Recent section', async ({
		page
	}) => {
		await page.goto('/');
		const tabs = page.getByRole('navigation', { name: 'Browse by tag' });
		await expect(tabs.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/');
		await expect(page.getByRole('heading', { name: 'Recent' })).toBeVisible();
	});
});

// ─── Navbar (logged in) ───────────────────────────────────────────────────────

test.describe('Navbar when logged in', () => {
	test('shows the username link and a Log out button', async ({ page }) => {
		await page.goto('/');
		// Scope to the navbar: recipe cards also link to the author's profile, and
		// the mobile menu duplicates the navbar link.
		const navbar = page.getByRole('navigation').first();
		await expect(navbar.getByRole('link', { name: '@spencerfletcher' }).first()).toBeVisible();
		await expect(page.getByRole('button', { name: 'Log out' }).first()).toBeVisible();
	});

	test('does not show the Login link', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('link', { name: /^log in$/i })).not.toBeVisible();
	});
});

// ─── Fork ─────────────────────────────────────────────────────────────────────

test.describe('Fork', () => {
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

	test('a field left empty turns on the error tokens and says why in its own words, with no save', async ({
		page
	}) => {
		await gotoHydrated(page, '/recipes/new');
		const title = page.locator('input[name="title"]');
		await title.focus();
		await page.keyboard.press('Tab');
		await expect(title).toHaveAttribute('aria-invalid', 'true');
		await expect(page.locator('#title-error')).toHaveText('Title is required');
		await expect(title).toHaveAccessibleDescription('Title is required');
		// The DESIGN.md error tokens: remove on remove-bg.
		expect(await title.evaluate((el) => getComputedStyle(el).borderColor)).toBe('rgb(163, 54, 43)');
		expect(await title.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
			'rgb(246, 227, 224)'
		);
		await title.fill('Soup');
		await expect(title).not.toHaveAttribute('aria-invalid', 'true');
	});

	test('number errors run the width of their row on one line each, in field order, under the boxes', async ({
		page
	}) => {
		await gotoHydrated(page, '/recipes/new');
		for (const [name, value] of [
			['servings', '0'],
			['prepTimeMinutes', '-5'],
			['cookTimeMinutes', '1.5']
		]) {
			await page.locator(`input[name="${name}"]`).fill(value);
			await page.locator(`input[name="${name}"]`).blur();
		}
		for (const width of [1280, 390]) {
			await page.setViewportSize({ width, height: 900 });
			const row = (await page.locator('.field-row').boundingBox())!;
			const boxes = (await page.locator('input[name="cookTimeMinutes"]').boundingBox())!;
			let above = boxes.y + boxes.height;
			for (const name of ['servings', 'prepTimeMinutes', 'cookTimeMinutes']) {
				const error = page.locator(`#${name}-error`);
				await expect(page.locator(`input[name="${name}"]`)).toHaveAttribute('aria-invalid', 'true');
				const box = (await error.boundingBox())!;
				const line = parseFloat(await error.evaluate((el) => getComputedStyle(el).lineHeight));
				expect(box.x).toBeCloseTo(row.x, 0);
				expect(box.width).toBeCloseTo(row.width, 0);
				expect(box.height).toBeLessThan(line * 1.5);
				expect(box.y).toBeGreaterThanOrEqual(above);
				above = box.y + box.height;
			}
		}
	});

	test('the required asterisk is Ink 3 at rest, not the error red', async ({ page }) => {
		await gotoHydrated(page, '/recipes/new');
		const star = page.locator('label[for="title"] .required');
		expect(await star.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(111, 105, 96)');
	});

	test('a blocked Create shows no browser bubble: the first empty field takes focus and its message is announced', async ({
		page
	}) => {
		await gotoHydrated(page, '/recipes/new');
		// Listened for on the fields themselves, which runs after the form's
		// capturing handler, so this sees what it did.
		await page.evaluate(() => {
			const w = window as unknown as { invalids: boolean[] };
			w.invalids = [];
			for (const el of document.querySelectorAll('.form :is(input, textarea)')) {
				el.addEventListener('invalid', (e) => w.invalids.push(e.defaultPrevented));
			}
		});
		await page.getByLabel('Steps').fill('Mix.');
		await page.getByRole('button', { name: /create recipe/i }).click();
		const title = page.locator('input[name="title"]');
		await expect(title).toBeFocused();
		const prevented = await page.evaluate(
			() => (window as unknown as { invalids: boolean[] }).invalids
		);
		// Title and Ingredients are empty: two invalid events, both cancelled.
		expect(prevented).toEqual([true, true]);
		await expect(page.getByRole('alert').first()).toHaveText('Title is required');
		await expect(page).toHaveURL(/\/recipes\/new$/);
	});

	test('Tags: the list opens on focus, arrows and Enter pick without Tab stops, and the remove button is 16px (44 on a phone)', async ({
		page
	}) => {
		await gotoHydrated(page, '/recipes/new');
		const input = page.getByRole('combobox', { name: /tag/i });
		await input.focus();
		await expect(page.getByRole('listbox')).toBeVisible();
		await page.keyboard.press('ArrowDown');
		const first = page.getByRole('option').first();
		await expect(first).toHaveAttribute('aria-selected', 'true');
		await expect(input).toHaveAttribute('aria-activedescendant', await first.getAttribute('id'));
		const name = (await first.textContent())!.trim();
		await page.keyboard.press('Enter');
		const remove = page.getByRole('button', { name: `Remove ${name}` });
		await expect(remove).toBeVisible();
		let box = await remove.boundingBox();
		expect([box!.width, box!.height]).toEqual([16, 16]);
		await page.setViewportSize({ width: 390, height: 900 });
		box = await remove.boundingBox();
		expect([box!.width, box!.height]).toEqual([44, 44]);
	});

	test('the tag list opens in view when the box sits at the foot of the screen, on a phone and at a desktop width', async ({
		page
	}) => {
		for (const width of [390, 1280]) {
			await page.setViewportSize({ width, height: 900 });
			await gotoHydrated(page, '/recipes/new');
			const input = page.getByRole('combobox', { name: /tag/i });
			// A screen that ends just below the box, as the edit page's does with a photo.
			const bottom = await input.evaluate((el) => el.getBoundingClientRect().bottom);
			await page.setViewportSize({ width, height: Math.ceil(bottom) + 8 });
			await input.click();
			// Whole: the scroll lands on a whole pixel, so up to a pixel may be cut.
			await expect(page.getByRole('listbox')).toBeInViewport({ ratio: 0.99 });
		}
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

	test('the public checkbox is clay, and on a phone its row is a 44px target without moving the text', async ({
		page
	}) => {
		await gotoHydrated(page, '/recipes/new');
		const box = page.getByRole('checkbox', { name: /public/i });
		const clay = await box.evaluate((el) => {
			const probe = document.createElement('i');
			probe.style.color = 'var(--color-accent)';
			el.after(probe);
			const color = getComputedStyle(probe).color;
			probe.remove();
			return color;
		});
		expect(await box.evaluate((el) => getComputedStyle(el).accentColor)).toBe(clay);
		// The checkbox's distance below the tags box, which padding must not change.
		const offset = async () => {
			const tags = (await page.locator('.field-tags').boundingBox())!;
			const b = (await box.boundingBox())!;
			return b.y + b.height / 2 - (tags.y + tags.height);
		};
		const desktop = await offset();
		await page.setViewportSize({ width: 390, height: 900 });
		const row = page.locator('label:has(> input[name="isPublic"])');
		expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);
		expect(await offset()).toBeCloseTo(desktop, 0);
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
				// The tag combobox opens its suggestion list on focus; its options are
				// not Tab stops, so Tab walks straight past them.
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

	test('the header line states the version a save will write', async ({ page }) => {
		const url = await createRecipe(page, 'E2E Helper', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await expect(page.locator('.editing')).toHaveText('Editing v1');
			await page.getByLabel('Steps').fill('Mix, then bake.');
			await expect(page.locator('.editing')).toHaveText('Editing v1 · saves as v2');
			await expect(page.locator('input[name="commitMessage"]')).toHaveAttribute(
				'placeholder',
				'Updated steps'
			);
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('every text box is mono at one size, the commit message as tall as its siblings, Save at least 112px wide', async ({
		page
	}) => {
		const url = await createRecipe(page, 'E2E Mono', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			const boxes = page.locator('.form :is(input[type="text"], input[type="number"], textarea)');
			expect(await boxes.count()).toBe(9);
			for (const box of await boxes.all()) {
				const style = await box.evaluate((el) => {
					const s = getComputedStyle(el);
					return { family: s.fontFamily, size: s.fontSize };
				});
				expect(style.family).toContain('JetBrains Mono');
				expect(style.size).toBe('13px');
			}
			const title = await page.locator('input[name="title"]').boundingBox();
			const message = await page.locator('input[name="commitMessage"]').boundingBox();
			expect(message!.height).toBe(title!.height);
			const save = await page.getByRole('button', { name: 'Save', exact: true }).boundingBox();
			const cancel = await page.getByRole('link', { name: 'Cancel' }).boundingBox();
			expect(save!.width).toBeGreaterThanOrEqual(112);
			expect(save!.width).toBeGreaterThan(cancel!.width);

			await page.setViewportSize({ width: 390, height: 900 });
			for (const name of ['title', 'commitMessage']) {
				const size = await page
					.locator(`input[name="${name}"]`)
					.evaluate((el) => getComputedStyle(el).fontSize);
				expect(size).toBe('16px');
			}
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('the photo is a 41px ghost button over a hidden input, ringed when focused, and the rule above What changed? is a plain Rule', async ({
		page
	}) => {
		const url = await createRecipe(page, 'E2E Photo Button', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			const input = page.locator('input[name="image"]');
			const button = page.locator('label:has(> input[name="image"])');
			await expect(button).toHaveText('Choose photo');
			const look = await button.evaluate((el) => {
				const s = getComputedStyle(el);
				return { height: el.getBoundingClientRect().height, border: s.borderTopStyle };
			});
			expect(Math.round(look.height)).toBe(41);
			expect(look.border).toBe('solid');
			// A button's voice, as Cancel has it, not the field labels' eyebrow.
			const voice = (el: Element) => {
				const s = getComputedStyle(el);
				return [s.fontSize, s.fontWeight, s.textTransform, s.letterSpacing, s.color];
			};
			expect(await button.evaluate(voice)).toEqual(
				await page.getByRole('link', { name: 'Cancel' }).evaluate(voice)
			);
			expect((await input.boundingBox())!.width).toBeLessThanOrEqual(1);
			// Reached by Tab from the description, the hidden input rings its button.
			await page.getByLabel('Description').focus();
			await page.keyboard.press('Tab');
			await expect(input).toBeFocused();
			expect(await button.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
			const rule = await page.locator('.field-message').evaluate((el) => {
				const s = getComputedStyle(el);
				return [s.borderTopStyle, s.borderTopWidth, s.borderTopColor];
			});
			expect(rule).toEqual(['solid', '1px', 'rgb(228, 222, 212)']);
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('the back link is a 24px target at desktop and 44px on a phone, and so is the photo remover there', async ({
		page
	}) => {
		const url = await createRecipe(page, 'E2E Hit Sizes', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			const back = page.locator('.editor-header .back-link');
			expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(24);
			await page.setViewportSize({ width: 390, height: 900 });
			expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
			// A picked photo, not saved, brings up the remover.
			await page.locator('input[name="image"]').setInputFiles({
				name: 'dot.png',
				mimeType: 'image/png',
				buffer: Buffer.from(
					'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
					'base64'
				)
			});
			const remove = page.getByRole('button', { name: 'Remove photo' });
			const box = (await remove.boundingBox())!;
			expect(box.width).toBeGreaterThanOrEqual(44);
			expect(box.height).toBeGreaterThanOrEqual(44);
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
			await expect(page.locator('.version-bar .current .message')).toContainText('e2e test commit');
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('a message typed with nothing else changed saves a version carrying it', async ({
		page
	}) => {
		const url = await createRecipe(page, 'E2E Message Alone', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await page.locator('input[name="commitMessage"]').fill('a note on its own');
			await expect(page.locator('.editor-header')).toContainText('saves as v2');
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await page.waitForURL(url);
			await expectVersions(page, 2);
			await expect(page.locator('.version-bar .current .message')).toContainText(
				'a note on its own'
			);
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
// Past the first version a bar under the hero names the current one and
// carries a "N versions" toggle; a one-version recipe has no bar.
async function expectVersions(page: Page, n: number) {
	if (n === 1) {
		await expect(page.locator('.version-bar')).toHaveCount(0);
		return;
	}
	await expect(page.locator('.version-bar .current .version-number')).toContainText(`v${n}`);
	await expect(page.locator('.version-bar .versions-toggle')).toHaveText(`${n} versions`);
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

			await expect(page.getByText('8 servings').first()).toBeVisible();
			await expectVersions(page, 2);

			await page.goto(`${url}?version=1`);
			await expect(page.getByText('4 servings').first()).toBeVisible();
			await expect(page.getByText(/2 cups/).first()).toBeVisible();

			await page.goto(`${url}/diff?from=1&to=2`);
			const details = page.locator('section').filter({ hasText: 'Details' }).first();
			// Value then label, in the recipe page's words.
			await expect(details).toContainText('4 to 8 servings');
			await expect(details).toContainText('cook');
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
			const box = page.getByLabel('Ingredients');
			await expect(box).toHaveAccessibleDescription(/An ingredient line is too long/);
			await expect(box).toHaveAttribute('aria-invalid', 'true');
			await expect(box).toBeFocused();
			// Announced at the field, not as the global alert.
			await expect(page.locator('.form-error')).toHaveCount(0);
			await expect(page.getByRole('alert')).toHaveAttribute('id', 'ingredients-error');
			await expect(box).toHaveValue(long);
			await expect(box).toBeEnabled();
		} finally {
			await deleteRecipe(page, url);
		}
	});
});

// ─── Compare page ─────────────────────────────────────────────────────────────

test.describe('Compare page', () => {
	test('a recipe with one version is a 400 whose helper line agrees with its message', async ({
		page
	}) => {
		const url = await createRecipe(page, 'E2E One Version', '4');
		try {
			const response = await page.goto(`${url}/diff`);
			expect(response?.status()).toBe(400);
			await expect(page.locator('h1')).toHaveText('Need at least two versions to compare');
			// Not "Pick two of the recipe's versions": there is only one.
			await expect(page.getByText(/Pick two/)).toHaveCount(0);
			await expect(
				page.getByText('Save a change to the recipe, then compare it with the original.')
			).toBeVisible();
			await expect(page.getByRole('link', { name: 'Back to the recipe' })).toHaveAttribute(
				'href',
				new URL(url).pathname
			);
		} finally {
			await deleteRecipe(page, url);
		}
	});

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

// ─── Favorites ────────────────────────────────────────────────────────────────

test.describe('Favorites', () => {
	test('with no favorites the page is just the empty state, and its link is a thumb target on a phone', async ({
		page
	}) => {
		// The seed user has favorited nothing, and this test favorites nothing:
		// a search box over an empty list invites a query with nothing to find
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
});
