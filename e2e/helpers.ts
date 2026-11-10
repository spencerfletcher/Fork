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
	// Set by the root layout's onMount (src/routes/+layout.svelte).
	await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
}

/**
 * The cookies' own link on Discover or the home page. Recent changes also names
 * the recipe but links its diff, and which comes first depends on what the
 * parallel tests have just saved.
 */
export const cookiesLink = (page: Page) =>
	page.getByRole('link', { name: COOKIES_RE }).and(page.locator(':not([href*="/diff"])')).first();

// Per worker: each worker process loads this module once.
let cookiesHref: string | undefined;

/** Slugs carry a random suffix per seed, so the cookies' path is read from Discover, once per worker. */
export async function cookiesPath(page: Page) {
	if (!cookiesHref) {
		await page.goto('/discover');
		const href = await cookiesLink(page).getAttribute('href');
		if (!href || !/^\/recipes\/[^/?#]+$/.test(href)) throw new Error(`Cookies link is ${href}`);
		cookiesHref = href;
	}
	return cookiesHref;
}

export async function openCookies(page: Page) {
	await gotoHydrated(page, await cookiesPath(page));
}
