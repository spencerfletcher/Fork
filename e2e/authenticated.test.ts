/**
 * Authenticated e2e tests.
 *
 * These run with the seed user's session pre-loaded (see auth.setup.ts).
 * They test the fork button, new recipe creation, and the edit flow.
 */

import { expect, test, type Page } from '@playwright/test';
import { cookiesLink, gotoHydrated } from './helpers';

// ─── Home (logged in) ─────────────────────────────────────────────────────────

test.describe('Home when logged in', () => {
	test('/ is the Cookbook, not Discover', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/cookbook$/);
		await expect(page.getByRole('heading', { level: 1, name: 'Cookbook' })).toBeVisible();
	});
});

// ─── Navbar (logged in) ───────────────────────────────────────────────────────

test.describe('Navbar when logged in', () => {
	test('the avatar opens Profile, Settings and Log out; Escape closes it', async ({ page }) => {
		await page.goto('/');
		const avatar = page.getByRole('button', { name: 'Your account, @spencerfletcher' });
		await expect(page.getByRole('button', { name: 'Log out' })).toHaveCount(0);
		await avatar.focus();
		await page.keyboard.press('Enter');
		const menu = page.getByRole('menu');
		await expect(menu.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute(
			'href',
			'/users/spencerfletcher'
		);
		await expect(menu.getByRole('menuitem', { name: 'Profile' })).toBeFocused();
		await page.keyboard.press('ArrowDown');
		await expect(menu.getByRole('menuitem', { name: 'Settings' })).toBeFocused();
		await page.keyboard.press('ArrowDown');
		await expect(menu.getByRole('menuitem', { name: 'Log out' })).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(menu).toHaveCount(0);
		await expect(avatar).toBeFocused();
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
		await cookiesLink(page).click();
		await page.waitForURL(/\/recipes\//);
		// Owner should see Edit, not Fork
		await expect(page.getByRole('link', { name: /edit recipe/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /fork/i })).not.toBeVisible();
	});

	// The seed user owns every seeded recipe, so the owner's row is what renders:
	// Cook, Edit recipe and Add to Journal, no Save or Fork.
	test('at 320 each signed-in pill is at least 44px tall and its label holds one line', async ({
		page
	}) => {
		await page.setViewportSize({ width: 320, height: 900 });
		await page.goto('/recipes');
		await cookiesLink(page).click();
		await page.waitForURL(/\/recipes\//);
		const hero = page.locator('.hero');
		await expect(hero.getByRole('link', { name: 'Edit recipe' })).toBeVisible();
		const pills = await hero.locator('.actions a, .actions button').evaluateAll((els) =>
			els.map((el) => ({
				text: (el as HTMLElement).innerText.trim(),
				height: el.getBoundingClientRect().height,
				// Two lines of label plus the padding would pass this.
				twoLines: 2 * parseFloat(getComputedStyle(el).lineHeight)
			}))
		);
		expect(pills.map((p) => p.text.split(/\s/)[0])).toEqual(['Cook', 'Edit', 'Add']);
		for (const pill of pills) {
			expect(pill.height, pill.text).toBeGreaterThanOrEqual(44);
			expect(pill.height, pill.text).toBeLessThan(pill.twoLines);
			expect(pill.text, pill.text).not.toContain('\n');
		}
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
		await expect(page.locator('textarea[name="title"]')).toBeVisible();
		await expect(page.getByRole('button', { name: /create recipe/i })).toBeVisible();
	});

	test('shows ingredient and step editors', async ({ page }) => {
		await page.goto('/recipes/new');
		await expect(page.getByRole('textbox', { name: 'Ingredients', exact: true })).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Method', exact: true })).toBeVisible();
	});

	test('a field edited and left empty turns on the error tokens and says why in its own words, with no save; passing through says nothing', async ({
		page
	}) => {
		await gotoHydrated(page, '/recipes/new');
		const title = page.locator('textarea[name="title"]');
		await title.focus();
		await page.keyboard.press('Tab');
		await expect(title).not.toHaveAttribute('aria-invalid');
		await expect(title).not.toHaveCSS('border-color', 'rgb(163, 54, 43)');
		await title.fill('S');
		await title.fill('');
		await title.blur();
		await expect(title).toHaveAttribute('aria-invalid', 'true');
		await expect(page.locator('#title-error')).toHaveText('Title is required');
		await expect(title).toHaveAccessibleDescription('Title is required');
		// The red border, with no fill: an empty invalid box must not look filled.
		expect(await title.evaluate((el) => getComputedStyle(el).borderColor)).toBe('rgb(163, 54, 43)');
		expect(await title.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
			'rgb(255, 253, 249)'
		);
		await title.fill('Soup');
		await expect(title).not.toHaveAttribute('aria-invalid', 'true');
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
		await page.getByRole('textbox', { name: 'Method', exact: true }).fill('Mix.');
		await page.getByRole('button', { name: /create recipe/i }).click();
		const title = page.locator('textarea[name="title"]');
		await expect(title).toBeFocused();
		const prevented = await page.evaluate(
			() => (window as unknown as { invalids: boolean[] }).invalids
		);
		// Title and Ingredients are empty: two invalid events, both cancelled.
		expect(prevented).toEqual([true, true]);
		await expect(page.getByRole('alert').first()).toHaveText('Title is required');
		await expect(page).toHaveURL(/\/recipes\/new$/);
	});

	test('Tags: focus leaves the list shut, ArrowDown opens it, arrows and Enter pick without Tab stops', async ({
		page
	}) => {
		await gotoHydrated(page, '/recipes/new');
		const input = page.getByRole('combobox', { name: /tag/i });
		await input.focus();
		await expect(page.getByRole('listbox')).toBeHidden();
		await page.keyboard.press('ArrowDown');
		await expect(page.getByRole('listbox')).toBeVisible();
		const first = page.getByRole('option').first();
		await expect(first).toHaveAttribute('aria-selected', 'true');
		await expect(input).toHaveAttribute('aria-activedescendant', await first.getAttribute('id'));
		const name = (await first.textContent())!.trim();
		await page.keyboard.press('Enter');
		const remove = page.getByRole('button', { name: `Remove ${name}` });
		await expect(remove).toBeVisible();
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

	test('creates a recipe and redirects to its detail page', async ({ page }) => {
		let createdRecipeUrl: string | null = null;

		try {
			await page.goto('/recipes/new');

			await page.locator('textarea[name="title"]').fill('E2E Test Recipe');

			await page.getByRole('textbox', { name: 'Ingredients', exact: true }).fill('2 cups flour');
			await page.getByRole('textbox', { name: 'Method', exact: true }).fill('Mix all ingredients.');
			// Private, so the guest project's seed counts never see it.
			await page.getByRole('radio', { name: 'Only me' }).check();

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
		await cookiesLink(page).click();
		await page.waitForURL(/\/recipes\//);
		await page.getByRole('link', { name: /edit recipe/i }).click();
		await page.waitForURL(/\/edit/);
		await expect(page.locator('textarea[name="title"]')).toBeVisible();
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
			'makes',
			'tag-combobox',
			// One stop for the radio group, then each text box's Section heading before it.
			'visibility',
			'Section heading',
			'ingredients',
			'Section heading',
			'steps',
			'commitMessage',
			'Save',
			'Cancel'
		];
		const walk = async () => {
			await page.locator('textarea[name="title"]').focus();
			const seen: string[] = [];
			for (let i = 0; i < expected.length; i++) {
				const name = await page.evaluate(() => {
					const el = document.activeElement as HTMLElement;
					// The visible words only: a decorative aria-hidden glyph is not part of the name.
					const words = [...el.childNodes]
						.filter((n) => !(n instanceof Element && n.getAttribute('aria-hidden') === 'true'))
						.map((n) => n.textContent ?? '')
						.join('')
						.trim();
					return el.getAttribute('name') || el.id || words || '';
				});
				seen.push(name);
				// The tag combobox's options are not Tab stops, so Tab walks straight
				// past them.
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

	test('leaving a dirty editor asks nothing, the draft keeps the words; a chosen photo still asks', async ({
		page
	}) => {
		const url = await createRecipe(page, 'E2E Guard', '4');
		try {
			let dialogs = 0;
			const count = () => dialogs++;
			page.on('dialog', count);
			await gotoHydrated(page, `${url}/edit`);
			await page.locator('textarea[name="title"]').fill('E2E Guard Edited');
			await page.getByRole('link', { name: 'Cancel' }).click();
			await page.waitForURL(url);
			expect(dialogs).toBe(0);
			await gotoHydrated(page, `${url}/edit`);
			await expect(page.locator('textarea[name="title"]')).toHaveValue('E2E Guard Edited');

			// A chosen photo is not in the draft, so leaving asks and says so.
			page.off('dialog', count);
			await page.locator('input[name="image"]').setInputFiles({
				name: 'dot.png',
				mimeType: 'image/png',
				buffer: Buffer.from(
					'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
					'base64'
				)
			});
			// Playwright dismisses dialogs on its own, so wait for the event itself.
			const dialog = page.waitForEvent('dialog');
			await page.getByRole('link', { name: 'Cancel' }).click();
			const d = await dialog;
			expect(d.message()).toBe(
				"Leave without saving? The photo you chose won't be kept; the rest is saved as a draft on this device."
			);
			await d.dismiss();
			await expect(page).toHaveURL(/\/edit$/);
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('the header line states the version a save will write', async ({ page }) => {
		const url = await createRecipe(page, 'E2E Helper', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await expect(page.locator('.editing')).toHaveText('Editing v1');
			await page.getByRole('textbox', { name: 'Method', exact: true }).fill('Mix, then bake.');
			await expect(page.locator('.editing')).toHaveText('Editing v1 · saves as v2');
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
			const box = page.getByRole('textbox', { name: 'Ingredients', exact: true });
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
			await page
				.getByRole('textbox', { name: 'Method', exact: true })
				.fill('Updated step text from e2e test.');
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

async function createRecipe(page: Page, title: string, servings: string) {
	// A test that makes its own recipe also edits and deletes it: several
	// saves and page loads, which outrun 10s on a machine running the whole
	// suite in parallel. Triples the timeout for that test only.
	test.slow();
	await gotoHydrated(page, '/recipes/new');
	await page.locator('textarea[name="title"]').fill(title);
	await page.locator('input[name="servings"]').fill(servings);
	await page.locator('input[name="cookTimeMinutes"]').fill('20');
	await page.getByRole('textbox', { name: 'Ingredients', exact: true }).fill('2 cups flour');
	await page.getByRole('textbox', { name: 'Method', exact: true }).fill('Mix all ingredients.');
	// Private, so the guest project's seed counts never see it.
	await page.getByRole('radio', { name: 'Only me' }).check();
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

test.describe('Delete recipe', () => {
	test('the owner moves a recipe to the Trash from its editor, confirming first, and lands on the Trash', async ({
		page
	}) => {
		const url = await createRecipe(page, 'E2E Delete Me', '2');
		await gotoHydrated(page, `${url}/edit`);
		await page.getByRole('button', { name: 'Delete recipe' }).click();
		const step = page.getByRole('group', { name: 'Move E2E Delete Me to Trash?' });
		await expect(step).toBeFocused();
		await expect(step).toContainText('You can restore it for 30 days.');
		await page.getByRole('button', { name: 'Move to Trash' }).click();
		await page.waitForURL(/\/cookbook\/trash$/);
		await expect(trashRow(page, 'E2E Delete Me').first()).toContainText('Deleted today');

		const response = await page.goto(url);
		expect(response?.status()).toBe(404);
	});
});

// ─── Trash ────────────────────────────────────────────────────────────────────
//
// Other tests' cleanup moves their recipes to the Trash too, so these never
// assume an empty Trash: each finds its own row by a title no other test uses.

/** A title no other test or run shares, and its one searchable word. */
function uniqueTitle() {
	const word = `trashtest${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
	return { title: `E2E ${word}`, word };
}

const trashRow = (page: Page, title: string) =>
	page
		.getByRole('listitem')
		.filter({ has: page.getByRole('heading', { name: title, exact: true }) });

/** Whether the page at `path` links the recipe titled `title` (Discover can link it more than once). */
async function expectListed(page: Page, path: string, title: string, listed: boolean) {
	await page.goto(path);
	const links = page.getByRole('link', { name: title });
	if (listed) await expect(links.first()).toBeVisible();
	else await expect(links).toHaveCount(0);
}

test.describe('Trash', () => {
	test('a trashed recipe leaves the Cookbook, Discover and Search and 404s; Restore brings it back with its versions', async ({
		page
	}) => {
		const { title, word } = uniqueTitle();
		const url = await createRecipe(page, title, '2');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await page.locator('input[name="commitMessage"]').fill('a second version');
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await page.waitForURL(url);
			await expectVersions(page, 2);
			for (const path of [`/cookbook?q=${word}`, `/discover?q=${word}`, `/search?q=${word}`]) {
				await expectListed(page, path, title, true);
			}

			await gotoHydrated(page, `${url}/edit`);
			await page.getByRole('button', { name: 'Delete recipe' }).click();
			await page.getByRole('button', { name: 'Move to Trash' }).click();
			await page.waitForURL(/\/cookbook\/trash$/);
			const row = trashRow(page, title);
			await expect(row).toContainText('Deleted today');
			await expect(row).toContainText('30 days left');

			for (const path of [`/cookbook?q=${word}`, `/discover?q=${word}`, `/search?q=${word}`]) {
				await expectListed(page, path, title, false);
			}
			// The same 404 as a recipe that never existed, at any version, and its editor too.
			for (const path of [url, `${url}?version=1`, `${url}/edit`, `${url}/diff?from=1&to=2`]) {
				expect((await page.goto(path))?.status(), path).toBe(404);
			}

			// The Cookbook's foot leads to the Trash while it holds something.
			await page.goto('/cookbook');
			await page.getByRole('link', { name: /^Trash \(\d+\) →$/ }).click();
			await page.waitForURL(/\/cookbook\/trash$/);

			await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
			await trashRow(page, title)
				.getByRole('button', { name: `Restore ${title}` })
				.click();
			await page.waitForURL(url);
			await expect(page.locator('h1')).toContainText(title);
			await expectVersions(page, 2);
			await expectListed(page, `/cookbook?q=${word}`, title, true);
		} finally {
			await deleteRecipe(page, url);
		}
	});

	test('Delete forever, asked in place, removes the recipe for good', async ({ page }) => {
		const { title } = uniqueTitle();
		const url = await createRecipe(page, title, '2');
		await deleteRecipe(page, url);

		await gotoHydrated(page, '/cookbook/trash');
		const row = trashRow(page, title);
		await row.getByRole('button', { name: 'Delete forever' }).click();
		const step = page.getByRole('group', { name: `Delete ${title} forever?` });
		await expect(step).toBeFocused();
		await expect(step).toContainText('The recipe and its history cannot be restored.');
		await step.getByRole('button', { name: 'Delete forever' }).click();
		await expect(row).toHaveCount(0);
		await expect(page.getByRole('status').filter({ hasText: 'deleted forever' })).toContainText(
			`${title} deleted forever.`
		);

		await page.reload();
		await expect(trashRow(page, title)).toHaveCount(0);
		expect((await page.goto(url))?.status()).toBe(404);
	});

	test('a row spans the page column on one line at desktop, its step too, and stacks on a phone without overflow', async ({
		page
	}) => {
		const { title } = uniqueTitle();
		const url = await createRecipe(page, title, '2');
		await deleteRecipe(page, url);
		try {
			await page.setViewportSize({ width: 1280, height: 800 });
			await gotoHydrated(page, '/cookbook/trash');
			const row = trashRow(page, title);
			const heading = row.getByRole('heading', { name: title });
			const sameLine = async (other: ReturnType<Page['locator']>) => {
				const [a, b] = [await heading.boundingBox(), await other.boundingBox()];
				// Vertically overlapping boxes share the line.
				expect(a!.y < b!.y + b!.height && b!.y < a!.y + a!.height).toBe(true);
			};
			const rowBox = (await row.boundingBox())!;
			const columnBox = (await page.locator('.page-inner').first().boundingBox())!;
			expect(rowBox.width).toBeGreaterThan(columnBox.width - 2);
			await sameLine(row.getByRole('button', { name: `Restore ${title}` }));
			await row.getByRole('button', { name: 'Delete forever' }).click();
			const step = page.getByRole('group', { name: `Delete ${title} forever?` });
			await sameLine(step.getByRole('button', { name: 'Delete forever' }));
			await sameLine(step.getByText('The recipe and its history cannot be restored.'));

			for (const width of [390, 320]) {
				await page.setViewportSize({ width, height: 800 });
				await expect(step).toBeVisible();
				expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
					width
				);
				const restore = (await row
					.getByRole('button', { name: `Restore ${title}` })
					.boundingBox())!;
				expect(restore.height).toBeGreaterThanOrEqual(44);
				expect(restore.y).toBeGreaterThan((await heading.boundingBox())!.y);
			}
		} finally {
			await page.goto('/cookbook/trash');
			await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
			const row = trashRow(page, title);
			if (await row.count()) {
				await row.getByRole('button', { name: 'Delete forever' }).click();
				await page
					.getByRole('group', { name: `Delete ${title} forever?` })
					.getByRole('button', { name: 'Delete forever' })
					.click();
				await expect(row).toHaveCount(0);
			}
		}
	});
});

test.describe('One save', () => {
	test('one save records servings, times and ingredients as a new version', async ({ page }) => {
		const url = await createRecipe(page, 'E2E Four Servings', '4');
		try {
			await gotoHydrated(page, `${url}/edit`);
			await page.locator('input[name="servings"]').fill('8');
			await page.locator('input[name="cookTimeMinutes"]').fill('30');
			await page.getByRole('textbox', { name: 'Ingredients', exact: true }).fill('4 cups flour');
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await page.waitForURL(url);

			await expect(page.getByRole('spinbutton', { name: 'Servings' })).toHaveValue('8');
			await expectVersions(page, 2);

			await page.goto(`${url}?version=1`);
			await expect(page.getByRole('spinbutton', { name: 'Servings' })).toHaveValue('4');
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
			await page.locator('textarea[name="title"]').fill('E2E After Rename');
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
			// A tag is a setting; the recipe stays private.
			await page.getByRole('combobox', { name: /tag/i }).focus();
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Enter');
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

			await other.locator('textarea[name="title"]').fill('E2E Stale Edit');
			await other.getByRole('button', { name: 'Save', exact: true }).click();
			await expect(other.getByRole('alert')).toContainText(/changed in another tab/i);
			await expect(other.locator('textarea[name="title"]')).toHaveValue('E2E Stale Edit');
			await expect(other.locator('textarea[name="title"]')).toBeEnabled();

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
			await page.getByRole('textbox', { name: 'Ingredients', exact: true }).fill(long);
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			const box = page.getByRole('textbox', { name: 'Ingredients', exact: true });
			await expect(box).toHaveAccessibleDescription(/An ingredient line is too long/);
			await expect(box).toHaveAttribute('aria-invalid', 'true');
			await expect(box).toBeFocused();
			// Announced at the field, not as the global alert.
			await expect(page.locator('.form-error')).toHaveCount(0);
			await expect(page.getByRole('alert')).toHaveAttribute('id', 'ingredients-error');
			await expect(page.locator('textarea[name="ingredients"]')).toHaveValue(long);
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
			await expect(page.locator('h1')).toHaveText(
				'Error 400 – Need at least two versions to compare'
			);
			// Not "Pick two of the recipe's versions": there is only one.
			await expect(page.getByText(/Pick two/)).toHaveCount(0);
			await expect(
				page.getByText('Once the recipe has a second version you can compare them here.')
			).toBeVisible();
			await expect(page.getByRole('link', { name: 'Back to the recipe' })).toHaveAttribute(
				'href',
				new URL(url).pathname
			);
		} finally {
			await deleteRecipe(page, url);
		}
	});
});

// ─── Groups and yield ─────────────────────────────────────────────────────────

test.describe('Groups and yield', () => {
	// Create, edit, compare and fork: several saves and loads.
	test.slow();

	test('a pasted grouped recipe with a yield shows its groups and Makes, scales Makes, compares a renamed group, and forks with both', async ({
		page
	}) => {
		const INGREDIENTS =
			'# Dough\n3 cups bread flour\n1 cup warm milk\n\n# Filling\n½ cup brown sugar';
		let url: string | null = null;
		let forkUrl: string | null = null;
		try {
			await gotoHydrated(page, '/recipes/new');
			await page.locator('textarea[name="title"]').fill('E2E Cinnamon Buns');
			await page.locator('input[name="servings"]').fill('4');
			await page.getByLabel(/^Makes/).fill('12 buns');
			await page.getByRole('textbox', { name: 'Ingredients', exact: true }).fill(INGREDIENTS);
			await page
				.getByRole('textbox', { name: 'Method', exact: true })
				.fill('# Make the dough\nMix.\n\nKnead.\n\n# Bake\nBake 25 minutes.');
			// The split is read back before the save.
			await expect(page.locator('#ingredients-readback')).toHaveText(
				/Reads as 2 groups:\s*Dough 2 lines\s*Filling 1 line/
			);
			await expect(page.locator('#steps-readback')).toHaveText(
				/Reads as 3 steps in 2 groups:\s*Make the dough 1–2\s*Bake 3/
			);
			// Private, so the guest project's seed counts never see it.
			await page.getByRole('radio', { name: 'Only me' }).check();
			await page.getByRole('button', { name: /create recipe/i }).click();
			await page.waitForURL(/\/recipes\/(?!new)/);
			url = page.url().split('?')[0];

			const ingredients = page.locator('#ingredients');
			const method = page.locator('#method');
			const measure = page.locator('.recipe-header .details');
			await expect(ingredients.getByRole('heading', { level: 3 })).toHaveText(['Dough', 'Filling']);
			await expect(method.getByRole('heading', { level: 3 })).toHaveText([
				'Make the dough',
				'Bake'
			]);
			// Steps number straight through the groups.
			await expect(method.locator('li').nth(2)).toContainText('3');
			await expect(measure).toHaveText(/Serves\s*4\s*Makes\s*12 buns/);

			// Scaling servings scales the yield, in clay; it never reads servings from it.
			await page.goto(`${url}?serves=6`);
			await expect(measure.getByText('18 buns')).toHaveClass(/text-accent/);
			await expect(ingredients.getByText(/4½ cups/)).toBeVisible();

			// Cook keeps the headings.
			await page.goto(`${url}?cook=1`);
			await expect(method.getByRole('heading', { name: 'Bake' })).toBeVisible();

			// A second version renames a group; the editor round-trips the headings.
			await gotoHydrated(page, `${url}/edit`);
			const box = page.getByRole('textbox', { name: 'Ingredients', exact: true });
			await expect(page.locator('textarea[name="ingredients"]')).toHaveValue(INGREDIENTS);
			await expect(page.getByLabel(/^Makes/)).toHaveValue('12 buns');
			await box.fill(INGREDIENTS.replace('# Filling', '# Swirl'));
			await page.getByRole('button', { name: 'Save', exact: true }).click();
			await page.waitForURL(url);

			await page.goto(`${url}/diff?from=1&to=2`);
			const renamed = page.locator('.diff-group', { hasText: 'Swirl' });
			await expect(renamed.locator('del')).toHaveText('Filling');
			await expect(renamed.locator('ins')).toHaveText('Swirl');
			await expect(page.locator('.diff-group', { hasText: 'Dough' }).locator('del')).toHaveCount(0);

			// The owner can fork their own recipe by the action; the copy keeps both.
			// The action protocol answers with where it redirects, as the enhanced button reads it.
			const result = await page.evaluate(async (u) => {
				const response = await fetch(`${u}?/fork`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'x-sveltekit-action': 'true'
					},
					body: ''
				});
				return response.text();
			}, url);
			const { type, location } = JSON.parse(result) as { type: string; location: string };
			expect({ type, location }).toMatchObject({ type: 'redirect', location: /\/edit$/ });
			forkUrl = new URL(location.replace(/\/edit$/, ''), url).href;
			await page.goto(forkUrl);
			await expect(page.locator('.recipe-header .byline')).toContainText('forked from');
			await expect(ingredients.getByRole('heading', { level: 3 })).toHaveText(['Dough', 'Swirl']);
			await expect(measure).toContainText(/Makes\s*12 buns/);
		} finally {
			if (forkUrl) await deleteRecipe(page, forkUrl);
			if (url) await deleteRecipe(page, url);
		}
	});
});
