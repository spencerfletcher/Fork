import { readFile } from 'node:fs/promises';
import { expect, test, type Download } from '@playwright/test';
import { COOKIES, gotoHydrated, openCookies } from './helpers';
import { SEED } from '../src/lib/server/db/seedData';
import { EXPORT_FORMAT, exportHref, type ForkExport } from '../src/lib/export/archive';

// Signed in as the seed user, who wrote the cookies. The username is not
// pinned: settings.authenticated renames it and puts it back while this runs.
const FILE = (ext: string, slug = '') =>
	new RegExp(`^fork-export-[\\w-]+${slug}-\\d{4}-\\d{2}-\\d{2}\\.${ext}$`);

const text = async (download: Download) => readFile((await download.path())!, 'utf8');

test.describe('Export', () => {
	test('Settings downloads the whole library as JSON: the seed cookies with every version', async ({
		page
	}) => {
		await gotoHydrated(page, '/settings');
		const data = page.getByRole('region', { name: 'Your data' });
		const [download] = await Promise.all([
			page.waitForEvent('download'),
			data.getByRole('link', { name: 'Download JSON' }).click()
		]);
		expect(download.suggestedFilename()).toMatch(FILE('json'));
		const archive = JSON.parse(await text(download)) as ForkExport;
		expect(archive.format).toBe(EXPORT_FORMAT);
		const cookies = archive.recipes.find((r) => r.versions.at(-1)?.content.title === COOKIES);
		expect(cookies?.versions).toHaveLength(SEED[0].versions.length);
		expect(cookies!.versions.map((v) => v.content.title)).toEqual(
			SEED[0].versions.map((v) => v.title)
		);
	});

	test('the recipe’s ⋯ menu exports that recipe as Markdown for its owner', async ({ page }) => {
		await openCookies(page);
		const slug = new URL(page.url()).pathname.split('/').at(-1)!;
		await page.getByRole('button', { name: 'More actions' }).click();
		const [download] = await Promise.all([
			page.waitForEvent('download'),
			page.getByRole('menuitem', { name: 'Export Markdown' }).click()
		]);
		expect(download.suggestedFilename()).toMatch(FILE('md', `-${slug}`));
		const md = await text(download);
		expect(md).toContain(`## ${COOKIES}`);
		expect(md).toContain('### Earlier versions');
	});
});

test.describe('Export, signed out', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('the endpoint answers 401 in the { error, code } shape', async ({ page }) => {
		const res = await page.request.get(exportHref('json'));
		expect(res.status()).toBe(401);
		expect((await res.json()).code).toBe('unauthenticated');
	});
});
