import { test, expect } from '@playwright/test';
import { gotoHydrated } from './helpers';
import { SEED } from '../src/lib/server/db/seedData';

// Report on a recipe page: the ⋯ menu's Report row opens the step in place,
// and sending files it. The seed's friend devcooks shares Shakshuka with
// friends, so the seed cook can open it and report it. The report is a new
// row only; nothing another spec reads changes.
const shakshuka = SEED.find((r) => r.slug === 'shakshuka')!.versions.at(-1)!.title;

test("a friend's recipe is reported from its ⋯ menu", async ({ page }) => {
	await gotoHydrated(page, '/users/devcooks');
	await page.getByRole('link', { name: shakshuka }).first().click();
	await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
	await page.getByRole('button', { name: 'More actions' }).click();
	await page.getByRole('menuitem', { name: 'Report', exact: true }).click();
	const reason = page.getByRole('textbox', { name: "What's wrong?" });
	await expect(reason).toBeFocused();
	await reason.fill('Test report from e2e.');
	await page.getByRole('button', { name: 'Send report', exact: true }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Reported.' })).toHaveText(
		'Reported. Thanks; someone will read it.'
	);
});
