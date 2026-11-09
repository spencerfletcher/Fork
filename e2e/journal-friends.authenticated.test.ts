import { expect, test } from '@playwright/test';
import { SEED_LOG } from '../src/lib/server/db/seedData';

// Signed in as the seed user (spencerfletcher's place in fork_e2e), whose
// friend devcooks and pending requester priyabakes the seed writes. The file
// name puts it in the chromium-auth project; global-setup resets the seed.

const mine = SEED_LOG.filter((e) => e.user === 'spencerfletcher');
const friendsFirst = SEED_LOG.find((e) => e.user === 'devcooks' && e.recipe === 'shakshuka')!;
const onPrivateRecipe = SEED_LOG.find((e) => e.recipe === 'miso-butter-noodles')!;

test.describe('Journal', () => {
	test('lists my entries newest first under month headings, audience in words', async ({
		page
	}) => {
		await page.goto('/journal');
		await expect(page.getByRole('heading', { level: 1, name: 'Journal' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 2, name: 'November 2026' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 2, name: 'October 2026' })).toBeVisible();
		const dishes = page.getByRole('heading', { level: 3 });
		await expect(dishes).toHaveText(mine.map((e) => e.dish));
		await expect(page.getByText('Improvised')).toBeVisible();
		// The note is the owner's alone and says so.
		await expect(page.getByText('Note for next time · only you').first()).toBeVisible();
	});

	test('Add to Journal logs an improvised dish, and the entry can be deleted', async ({ page }) => {
		await page.goto('/journal/new');
		await page.getByLabel(/Dish/).fill('E2E leftover fried rice');
		await expect(page.getByLabel(/Date/)).not.toHaveValue('');
		await expect(page.getByRole('radio', { name: 'Friends' })).toBeChecked(); // the remembered choice
		await page.getByRole('button', { name: 'Add to Journal' }).click();

		await expect(page).toHaveURL(/\/journal\?logged=\d+/);
		await expect(page.getByRole('status')).toContainText('Logged');
		const entry = page.locator('article', { hasText: 'E2E leftover fried rice' });
		await expect(entry).toContainText('Improvised');

		await entry.getByRole('link', { name: /Edit/ }).click();
		await page.getByRole('button', { name: 'Delete entry…' }).click();
		await page.getByRole('button', { name: 'Delete permanently' }).click();
		await expect(page).toHaveURL(/\/journal\?deleted=1/);
		await expect(page.getByText('E2E leftover fried rice')).toHaveCount(0);
	});

	test('a missing dish is refused in words, and what was typed stays', async ({ page }) => {
		await page.goto('/journal/new');
		await page.getByLabel(/Caption/).fill('Kept after the refusal');
		// The browser's own required check is bypassed, so the server's message shows.
		await page.locator('form.entry-form').evaluate((form) => form.setAttribute('novalidate', ''));
		await page.getByRole('button', { name: 'Add to Journal' }).click();
		await expect(page.getByRole('alert')).toHaveText('Dish is required');
		await expect(page.getByLabel(/Caption/)).toHaveValue('Kept after the refusal');
	});
});

test.describe('Recipe page entry points', () => {
	test('the personal line links the last entry; Cook carries the version and serves', async ({
		page
	}) => {
		const logged = mine[0];
		await page.goto('/journal');
		await page.locator('article', { hasText: logged.dish }).locator('.jsource a').click();

		await expect(page.getByText(/You cooked this on Sun 8 Nov/)).toBeVisible();
		await expect(page.getByRole('link', { name: 'Sun 8 Nov' })).toHaveAttribute(
			'href',
			/\/journal#entry-\d+/
		);

		await page.getByRole('button', { name: 'Cook' }).click();
		const url = new URL(page.url());
		url.searchParams.set('serves', '8');
		await page.goto(url.href);
		const add = page.getByRole('link', { name: 'Add to Journal' });
		await expect(add).toHaveAttribute('href', /recipe=.+&version=\d+&serves=8/);
		await add.click();

		await expect(page.getByLabel(/Dish/)).toHaveValue(logged.dish);
		await expect(page.getByLabel(/Servings/)).toHaveValue('8');
		await expect(page.getByLabel(/From a recipe/)).not.toHaveValue('');
	});
});

test.describe('Friends', () => {
	test("the feed shows a friend's entries and recipe events; a private recipe stays hidden", async ({
		page
	}) => {
		await page.goto('/friends');
		await expect(page.getByText('Newest first')).toBeVisible();
		await expect(page.getByRole('heading', { name: friendsFirst.dish })).toBeVisible();
		await expect(page.getByRole('heading', { name: onPrivateRecipe.dish })).toBeVisible();
		await expect(
			page.getByText('@devcooks cooked a private recipe. You can see the dish, not the recipe.')
		).toBeVisible();
		await expect(page.getByText(/shared Shakshuka with friends/)).toBeVisible();
		await expect(page.getByRole('button', { name: /Comment/ })).toHaveCount(0);
	});

	test('Like toggles with its count and aria-pressed, and survives a reload', async ({ page }) => {
		await page.goto('/friends');
		const entry = page.locator('article', {
			has: page.getByRole('heading', { name: friendsFirst.dish })
		});
		const like = entry.getByRole('button', { name: /^Like/ });
		// The seed has spencerfletcher liking it already.
		await expect(like).toHaveAttribute('aria-pressed', 'true');
		await expect(like).toHaveText('Like · 1');

		await like.click();
		await expect(like).toHaveAttribute('aria-pressed', 'false');
		await expect(like).toHaveText('Like');
		await page.reload();
		await expect(entry.getByRole('button', { name: /^Like/ })).toHaveAttribute(
			'aria-pressed',
			'false'
		);

		await entry.getByRole('button', { name: /^Like/ }).click();
		await expect(entry.getByRole('button', { name: /^Like/ })).toHaveText('Like · 1');
	});

	test('the waiting request from priyabakes is in Requests; ⋯ offers Block with its sentence', async ({
		page
	}) => {
		await page.goto('/friends');
		await expect(page.getByRole('button', { name: 'Accept @priyabakes' })).toBeVisible();
		const more = page.getByRole('button', { name: /^More for @devcooks/ }).first();
		await more.click();
		await page.getByRole('button', { name: 'Block' }).click();
		await expect(
			page.getByText('Blocking stops requests and interactions. Public recipes stay public.')
		).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(more).toHaveAttribute('aria-expanded', 'false');
	});

	test('the profile says where we stand', async ({ page }) => {
		await page.goto('/users/devcooks');
		await expect(page.getByText('Friends ✓')).toBeVisible();
		await page.goto('/users/priyabakes');
		await expect(page.getByRole('button', { name: 'Accept request' })).toBeVisible();
	});
});
