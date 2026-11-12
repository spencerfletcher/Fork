import { test, expect, type Browser, type Page } from '@playwright/test';
import { gotoHydrated } from './helpers';

// Guest specs on purpose: each signs up throwaway cooks of its own (the local
// stack confirms no email), so marking things seen never changes what the
// seed cook's specs, running alongside, see on Friends.

async function signUp(browser: Browser, name: string): Promise<{ page: Page; username: string }> {
	const page = await (await browser.newContext()).newPage();
	const s = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
	const username = `${name}_${s}`;
	await gotoHydrated(page, '/signup');
	await page.getByLabel('Email').fill(`${username}@fork.local`);
	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill('Notify-Me-2026!');
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page).toHaveURL(/\/confirm-email/);
	return { page, username };
}

const bar = (page: Page) => page.getByRole('navigation', { name: 'Site' });
const lit = (page: Page) => bar(page).getByRole('link', { name: 'Friends, new activity' });
const quiet = (page: Page) => bar(page).getByRole('link', { name: 'Friends', exact: true });

test('a request lights the dot by Friends; For you lists it, a hover marks nothing seen, a visit does', async ({
	browser
}) => {
	test.slow();
	const ana = await signUp(browser, 'ana');
	const bo = await signUp(browser, 'bo');

	await gotoHydrated(ana.page, '/cookbook');
	await expect(quiet(ana.page)).toBeVisible();

	await gotoHydrated(bo.page, `/users/${ana.username}`);
	await bo.page.getByRole('button', { name: 'Add friend' }).click();
	await expect(bo.page.getByText('Request sent')).toBeVisible();

	await gotoHydrated(ana.page, '/cookbook');
	await expect(lit(ana.page)).toBeVisible();

	// A hover preloads Friends' data, which must not mark anything seen.
	const preload = ana.page.waitForResponse((r) => r.url().includes('/friends/__data.json'));
	await lit(ana.page).hover();
	await preload;
	await gotoHydrated(ana.page, '/cookbook');
	await expect(lit(ana.page)).toBeVisible();

	// The visit: the request For you, and no dot on Friends itself.
	const seen = ana.page.waitForResponse((r) => r.url().includes('/notifications?/seen'));
	await lit(ana.page).click();
	const band = ana.page.getByRole('region', { name: 'For you' });
	await expect(band).toContainText(`@${bo.username} wants to be friends`);
	await expect(quiet(ana.page)).toBeVisible();
	await seen;

	// The next page has no dot; the request still waits until answered.
	await bar(ana.page).getByRole('link', { name: 'Cookbook', exact: true }).click();
	await expect(ana.page).toHaveURL(/\/cookbook$/);
	await expect(quiet(ana.page)).toBeVisible();
	await expect(lit(ana.page)).toHaveCount(0);
	await gotoHydrated(ana.page, '/friends');
	await band.getByRole('button', { name: `Accept @${bo.username}` }).click();
	// Nothing waiting and nothing new: no band at all.
	await expect(band).toHaveCount(0);

	// bo hears of it, on the phone's tab bar too.
	await bo.page.setViewportSize({ width: 390, height: 844 });
	await gotoHydrated(bo.page, '/cookbook');
	const tab = bo.page
		.getByRole('navigation', { name: 'Main' })
		.getByRole('link', { name: 'Friends, new activity' });
	await tab.click();
	await expect(bo.page.getByRole('region', { name: 'For you' })).toContainText(
		`@${ana.username} accepted your request`
	);
});

test('Settings: the kinds left unticked stay unticked after a reload', async ({ browser }) => {
	test.slow();
	const { page } = await signUp(browser, 'cy');
	await gotoHydrated(page, '/settings');
	const section = page.getByRole('region', { name: 'Notifications' });
	const saves = section.getByRole('checkbox', { name: 'Saves of your recipes' });
	await expect(saves).toBeChecked();
	// The box is visually hidden; its row is the label.
	await section.getByText('Saves of your recipes').click();
	await expect(saves).not.toBeChecked();
	await section.getByRole('button', { name: 'Save' }).click();
	await expect(section.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible();
	await page.reload();
	await expect(section.getByRole('checkbox', { name: 'Saves of your recipes' })).not.toBeChecked();
	await expect(section.getByRole('checkbox', { name: 'Forks of your recipes' })).toBeChecked();
});
