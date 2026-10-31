import type { Page } from '@playwright/test';

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
