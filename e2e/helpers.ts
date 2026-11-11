import { test, type Page } from '@playwright/test';
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

/** `label` and a suffix no other test or run shares. */
export const uniqueTitle = (label: string) =>
	`${label} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * A private recipe of the signed-in cook's own ("Only me", so the guest
 * project's seed counts never see it), returning its URL without the query.
 */
export async function createRecipe(
	page: Page,
	title: string,
	{ servings, cookTimeMinutes }: { servings?: string; cookTimeMinutes?: string } = {}
) {
	// A test that makes its own recipe also edits and deletes it: several
	// saves and page loads, which outrun 10s on a machine running the whole
	// suite in parallel. Triples the timeout for that test only.
	test.slow();
	await gotoHydrated(page, '/recipes/new');
	await page.locator('textarea[name="title"]').fill(title);
	if (servings) await page.locator('input[name="servings"]').fill(servings);
	if (cookTimeMinutes) await page.locator('input[name="cookTimeMinutes"]').fill(cookTimeMinutes);
	await page.getByRole('textbox', { name: 'Ingredients', exact: true }).fill('2 cups flour');
	await page.getByRole('textbox', { name: 'Method', exact: true }).fill('Mix all ingredients.');
	await page.getByRole('radio', { name: 'Only me' }).check();
	await page.getByRole('button', { name: /create recipe/i }).click();
	await page.waitForURL(/\/recipes\/(?!new)/);
	return page.url().split('?')[0];
}

/**
 * Posts a form action from the page, as a cleanup step the test does not
 * assert: the browser sets the Origin header, so SvelteKit's CSRF check passes.
 */
export async function postAction(page: Page, url: string, fields: Record<string, string> = {}) {
	await page.evaluate(
		async ([u, body]) => {
			await fetch(u, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams(body).toString()
			});
		},
		[url, fields] as const
	);
}

/** Moves the signed-in owner's recipe at `url` to the Trash, as a test's cleanup. */
export const deleteRecipe = (page: Page, url: string) =>
	postAction(page, `${url}/edit?/deleteRecipe`);
