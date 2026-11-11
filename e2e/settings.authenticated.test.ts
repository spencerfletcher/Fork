import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './helpers';

// Signed in as the seed user, @spencerfletcher. Each test puts back what it
// changed before it ends, since other files read the seed user's name and its
// Only me default; the file runs in order so the two never overlap.
test.describe.configure({ mode: 'serial' });

const SEED_NAME = 'spencerfletcher';

const section = (page: Page, name: string) => page.getByRole('region', { name });

async function saveUsername(page: Page, username: string) {
	await gotoHydrated(page, '/settings');
	const box = section(page, 'Username');
	await box.getByRole('textbox', { name: 'Username' }).fill(username);
	await box.getByRole('button', { name: 'Save' }).click();
	await expect(box.getByRole('status')).toHaveText('Saved.');
}

async function saveDefault(page: Page, audience: 'Only me' | 'Friends' | 'Public') {
	await gotoHydrated(page, '/settings');
	const box = section(page, 'Default audience');
	await box.getByRole('radio', { name: audience }).check();
	await box.getByRole('button', { name: 'Save' }).click();
	await expect(box.getByText('Saved.')).toBeVisible();
}

test.describe('Settings', () => {
	test('the account menu leads to Settings, which names the sign-in email', async ({ page }) => {
		await gotoHydrated(page, '/cookbook');
		await page.getByRole('button', { name: `Your account, @${SEED_NAME}` }).click();
		await page.getByRole('menuitem', { name: 'Settings' }).click();
		await expect(page).toHaveURL(/\/settings$/);
		await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
		await expect(
			section(page, 'Account').getByRole('link', { name: 'Change password' })
		).toHaveAttribute('href', '/forgot-password');
	});

	test('a new recipe starts at the default audience chosen in Settings', async ({ page }) => {
		try {
			await saveDefault(page, 'Friends');
			await gotoHydrated(page, '/recipes/new');
			await expect(page.getByRole('radio', { name: 'Friends' })).toBeChecked();
		} finally {
			await saveDefault(page, 'Only me');
		}
		await gotoHydrated(page, '/recipes/new');
		await expect(page.getByRole('radio', { name: 'Only me' })).toBeChecked();
	});

	test('a new username shows at once, and the old profile link redirects to it', async ({
		page
	}) => {
		const renamed = `${SEED_NAME}-e2e`;
		try {
			await saveUsername(page, renamed);
			// The bar's handle follows without a reload.
			await expect(page.getByRole('button', { name: `Your account, @${renamed}` })).toBeVisible();

			await page.goto(`/users/${SEED_NAME}`);
			await expect(page).toHaveURL(new RegExp(`/users/${renamed}$`));
			await expect(page.getByRole('heading', { level: 1 })).toHaveText(`@${renamed}`);
		} finally {
			// Taking the old name back is allowed: it is reserved to its owner.
			await saveUsername(page, SEED_NAME);
		}
		await page.goto(`/users/${renamed}`);
		await expect(page).toHaveURL(new RegExp(`/users/${SEED_NAME}$`));
	});

	test("another cook's name is refused as taken, on the field", async ({ page }) => {
		await gotoHydrated(page, '/settings');
		const box = section(page, 'Username');
		const field = box.getByRole('textbox', { name: 'Username' });
		await field.fill('devcooks');
		await box.getByRole('button', { name: 'Save' }).click();
		await expect(field).toHaveAttribute('aria-invalid', 'true');
		await expect(field).toHaveAccessibleDescription(/That username is taken/);
		await expect(field).toBeFocused();
	});
});

test.describe('Settings signed out', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('goes to log in, and back to Settings after', async ({ page }) => {
		await page.goto('/settings');
		await expect(page).toHaveURL(/\/login\?redirectTo=%2Fsettings$/);
	});
});
