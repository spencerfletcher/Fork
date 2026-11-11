import { test, expect } from '@playwright/test';
import { gotoHydrated } from './helpers';
import { ACCOUNT_DELETED, GOODBYE, TYPE_USERNAME } from '../src/lib/account';

// A guest spec on purpose: it signs up its own throwaway account (the local
// stack confirms no email) and deletes that, never a seed user. Its auth user
// stays in local Auth, marked deleted: the app cannot delete auth users.
test('Delete account asks for the username typed, then signs out to the goodbye, and the account cannot sign back in', async ({
	page
}) => {
	test.slow();
	const s = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
	const email = `delete-${s}@fork.local`;
	const username = `del_${s}`;
	const password = 'Delete-Me-2026!';

	await gotoHydrated(page, '/signup');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page).toHaveURL(/\/confirm-email/);

	await gotoHydrated(page, '/settings');
	const section = page.getByRole('region', { name: 'Delete account' });
	await section.getByRole('button', { name: 'Delete account' }).click();
	const step = section.getByRole('group', { name: 'Delete your account?' });
	const field = step.getByRole('textbox', { name: `Type ${username} to confirm` });

	await field.fill(`${username}x`);
	await step.getByRole('button', { name: 'Delete my account' }).click();
	await expect(section.getByRole('alert')).toHaveText(TYPE_USERNAME);
	await expect(page).toHaveURL('/settings');

	await field.fill(username);
	await step.getByRole('button', { name: 'Delete my account' }).click();
	await expect(page).toHaveURL(ACCOUNT_DELETED);
	await expect(page.getByRole('status').filter({ hasText: GOODBYE })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Log in' }).first()).toBeVisible();
	expect((await page.goto(`/users/${username}`))?.status()).toBe(404);

	// Signing in again succeeds at Supabase, but the app treats it as signed
	// out and makes no new profile.
	await gotoHydrated(page, '/login');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Log in' }).click();
	await page.waitForLoadState('networkidle');
	await page.goto('/settings');
	await expect(page).toHaveURL(/\/login/);
	expect((await page.goto(`/users/${username}`))?.status()).toBe(404);
});
