/**
 * Playwright global auth setup.
 *
 * Logs in as the seed user once, saves the browser storage state to
 * e2e/.auth/user.json, and re-uses it for every authenticated test so
 * we only pay the login round-trip once per test run.
 *
 * Prerequisites:
 *   1. Run `pnpm db:seed` so the test user exists in Supabase.
 *   2. Set E2E_USER_EMAIL + E2E_USER_PASSWORD in your .env (see .env.example).
 *      Without these the authenticated test suite is skipped.
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export const AUTH_FILE = path.join('e2e', '.auth', 'user.json');

setup('authenticate as seed user', async ({ page }) => {
	const email = process.env.E2E_USER_EMAIL;
	const password = process.env.E2E_USER_PASSWORD;

	if (!email || !password) {
		// Write an empty auth state so Playwright doesn't fail when loading the file.
		// The authenticated tests check for this and skip themselves.
		fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
		fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
		console.warn(
			'\n⚠️  E2E_USER_EMAIL / E2E_USER_PASSWORD not set — authenticated tests will be skipped.\n' +
				'   Add them to your .env (see .env.example) and re-run to include them.\n'
		);
		return;
	}

	await page.goto('/login');
	await page.locator('input[type="email"]').fill(email);
	await page.locator('input[type="password"]').fill(password);
	await page.locator('button[type="submit"]').click();

	// Use:enhance handles the redirect client-side; wait for the URL to change
	await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

	await page.context().storageState({ path: AUTH_FILE });
});
