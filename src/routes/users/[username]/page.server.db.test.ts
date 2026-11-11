import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { localDb } from '#lib/testing/db.js';
import { loadEvent, loadPage } from '#lib/testing/actions.js';
import { parentAndFork } from '#lib/testing/ftsLeak.js';
import type { PageData } from './$types';

describe.skipIf(!localDb)('/users/[username] load, against the real database', () => {
	let rows: Awaited<ReturnType<typeof parentAndFork>>;
	beforeAll(async () => {
		rows = await parentAndFork();
	});
	afterAll(async () => {
		await rows?.remove();
		await (await import('#lib/server/db/index.js')).closeDb();
	});

	test("the serialised profile's recipes carry no search vector", async () => {
		const { load } = await import('./+page.server.js');
		const data = await loadPage<PageData>(
			load,
			loadEvent({ path: `/users/${rows.username}`, params: { username: rows.username } })
		);
		expect(data.recipes.length).toBeGreaterThan(0);
		expect(JSON.stringify(data)).not.toContain('"fts"');
	});
});
