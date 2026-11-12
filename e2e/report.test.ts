import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './helpers';

// Signed out, as a rights holder who is not a cook on Fork would come. The
// words are written out: e2e files cannot import the app's #lib modules.

// By the box's name: each label also carries its Required mark.
const link = (page: Page) => page.getByRole('textbox', { name: 'Link on Fork', exact: true });
const what = (page: Page) => page.getByRole('textbox', { name: "What's wrong", exact: true });
const contact = (page: Page) => page.getByRole('textbox', { name: 'Your email', exact: true });
const send = (page: Page) => page.getByRole('button', { name: 'Send report', exact: true });

test.describe('Report a problem, signed out', () => {
	test('the footer leads to it, and it is kept out of search', async ({ page }) => {
		await gotoHydrated(page, '/discover');
		await page.getByRole('link', { name: 'Report a problem', exact: true }).click();
		await expect(page).toHaveURL(/\/report$/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
	});

	test('refusals show inline beside each field, with what was typed kept', async ({ page }) => {
		await gotoHydrated(page, '/report');
		await link(page).fill('https://elsewhere.example/recipes/soup');
		await contact(page).fill('me at example.com');
		await send(page).click();

		await expect(page.locator('#link-error')).toHaveText(
			'Use a link to a page on Fork, copied from the address bar.'
		);
		await expect(page.locator('#what-error')).toHaveText('Say what is wrong.');
		await expect(page.locator('#contact-error')).toHaveText(
			'Enter an email address like name@example.com'
		);
		await expect(link(page)).toHaveAttribute('aria-invalid', 'true');
		await expect(link(page)).toHaveValue('https://elsewhere.example/recipes/soup');
		await expect(contact(page)).toHaveValue('me at example.com');
		// The address never goes into the page's URL.
		expect(page.url()).not.toContain('example.com');
	});

	test('a valid report is received, and the page says what happens next', async ({ page }) => {
		await gotoHydrated(page, '/report');
		const origin = new URL(page.url()).origin;
		await link(page).fill(`${origin}/discover`);
		await what(page).fill('An e2e report: nothing is wrong.');
		await contact(page).fill('E2E@Example.com');
		await send(page).click();

		const heading = page.getByRole('heading', { level: 1, name: 'Report sent', exact: true });
		await expect(heading).toBeFocused();
		await expect(page.getByText('Someone at Fork reads every report')).toBeVisible();
		expect(page.url()).not.toContain('example.com');
	});

	test('the trap field is out of reach, and a bot that fills it is thanked the same', async ({
		page
	}) => {
		await gotoHydrated(page, '/report');
		const trap = page.locator('input[name="website"]');
		await expect(trap).toHaveAttribute('tabindex', '-1');
		// A bot posts whatever it finds, fields wrong or not.
		await trap.evaluate((el: HTMLInputElement) => (el.value = 'https://spam.example'));
		await send(page).click();
		await expect(
			page.getByRole('heading', { level: 1, name: 'Report sent', exact: true })
		).toBeVisible();
	});
});
