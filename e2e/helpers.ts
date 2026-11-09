import type { Page } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';

/** The seed's cookies (3 versions, renamed in v3), read from the seed so a rename cannot strand a test. */
export const COOKIES = SEED[0].versions.at(-1)!.title;
export const COOKIES_RE = new RegExp(COOKIES, 'i');

/**
 * Navigate and wait for hydration. Acting before SvelteKit has hydrated the
 * page races the client: a fill is cleared and re-appended ("48"), a blur or a
 * click lands before its handler exists. The suite runs fully parallel, so a
 * loaded machine hydrates late; any test that types, leaves a field or clicks
 * a control straight after loading goes through here.
 */
export async function gotoHydrated(page: Page, url: string) {
	await page.goto(url);
	await page.waitForLoadState('networkidle');
}

/** Slugs carry a random suffix, so reach the cookies by name from Discover, not by URL. */
export async function openCookies(page: Page) {
	await page.goto('/discover');
	await page.getByRole('link', { name: COOKIES_RE }).first().click();
	await page.waitForURL(/\/recipes\//);
}
