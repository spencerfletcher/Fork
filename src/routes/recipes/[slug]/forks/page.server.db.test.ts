import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { localDb } from '#lib/testing/db.js';
import { loadEvent, loadPage } from '#lib/testing/actions.js';
import { parentAndFork } from '#lib/testing/ftsLeak.js';
import type { PageData } from './$types';

describe.skipIf(!localDb)('/recipes/[slug]/forks load, against the real database', () => {
	let rows: Awaited<ReturnType<typeof parentAndFork>>;
	beforeAll(async () => {
		rows = await parentAndFork();
	});
	afterAll(async () => {
		await rows?.remove();
		await (await import('#lib/server/db/index.js')).closeDb();
	});

	test('the serialised forks carry no search vector', async () => {
		const { load } = await import('./+page.server.js');
		const data = await loadPage<PageData>(load, loadEvent({ params: { slug: rows.parentSlug } }));
		expect(data.forks).toHaveLength(1);
		expect(JSON.stringify(data)).not.toContain('"fts"');
	});
});
