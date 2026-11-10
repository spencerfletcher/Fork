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

// Per worker: each worker process loads this module once.
let cookiesPath: string | undefined;

/**
 * Slugs carry a random suffix per seed, so the cookies' URL is read from
 * Discover's link, once per worker, and each later call loads it directly.
 */
export async function openCookies(page: Page) {
	if (!cookiesPath) {
		await page.goto('/discover');
		const href = await page.getByRole('link', { name: COOKIES_RE }).first().getAttribute('href');
		if (!href?.startsWith('/recipes/')) throw new Error(`Cookies link is ${href}`);
		cookiesPath = href;
	}
	await gotoHydrated(page, cookiesPath);
}
