/**
 * Playwright global auth setup: logs in as the seed user once and saves the
 * browser storage state for every authenticated test, so the login round-trip
 * is paid once per run. E2E_USER_EMAIL / E2E_USER_PASSWORD come from .env.e2e,
 * and global-setup seeds that user.
 */

import { test as setup, expect } from '@playwright/test';
import { AUTH_FILE } from '../playwright.config';

setup('authenticate as seed user', async ({ page }) => {
	await page.goto('/login');
	await page.locator('input[type="email"]').fill(process.env.E2E_USER_EMAIL ?? '');
	await page.locator('input[type="password"]').fill(process.env.E2E_USER_PASSWORD ?? '');
	await page.locator('button[type="submit"]').click();

	// Use:enhance handles the redirect client-side; wait for the URL to change
	await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

	await page.context().storageState({ path: AUTH_FILE });
});
