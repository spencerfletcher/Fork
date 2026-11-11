import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { inArray } from 'drizzle-orm';

import { localDb } from '#lib/testing/db.js';
import { loadEvent, loadPage } from '#lib/testing/actions.js';
import type { PageData } from './$types';

// The pool is closed once the file is done, so no connection outlives the run.
afterAll(async () => {
	if (localDb) await (await import('#lib/server/db/index.js')).closeDb();
});

// What the saver's page data carries of a recipe its author withdrew and then
// rewrote: committed rows (the load reads through the pool) between two seed
// profiles, removed after.
describe.skipIf(!localDb)('a kept copy in the page data, against the real database', () => {
	let db: typeof import('#lib/server/db/index.js').db;
	let schema: typeof import('#lib/server/db/schema.js');
	let load: typeof import('./+page.server.js').load;
	const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	const copySlug = `page-kept-${stamp}`;
	const liveSlug = `page-live-${stamp}`;
	let author: string;
	let saver: string;
	// Words the author wrote after withdrawing it, which the saver was never given.
	const LATER = /quokka|zanzibar|pellucid|marmalad/i;

	beforeAll(async () => {
		({ db } = await import('#lib/server/db/index.js'));
		schema = await import('#lib/server/db/schema.js');
		({ load } = await import('./+page.server.js'));
		const { makeContent } = await import('#lib/recipes/fixtures.js');
		const profiles = await db.query.profiles.findMany({ limit: 2 });
		if (profiles.length < 2) throw new Error('Seed the local database first (pnpm db:seed)');
		[author, saver] = profiles.map((p) => p.id);
		const rows = await db
			.insert(schema.recipes)
			.values([
				{
					authorId: author,
					slug: copySlug,
					title: 'Zanzibar quokka',
					description: 'Pellucid marmalade',
					servings: 9,
					editRevision: 7,
					visibility: 'private'
				},
				{ authorId: author, slug: liveSlug, title: 'Soup', visibility: 'public' }
			])
			.returning({ id: schema.recipes.id });
		await db.insert(schema.recipeVersions).values(
			rows.map(({ id }) => ({
				recipeId: id,
				versionNumber: 1,
				commitMessage: 'v',
				...makeContent({ title: 'Soup v1', description: 'As saved' }),
				createdBy: author
			}))
		);
		await db
			.insert(schema.favorites)
			.values({ userId: saver, recipeId: rows[0].id, copyVersion: 1 });
	});

	afterAll(async () => {
		if (db)
			await db.delete(schema.recipes).where(inArray(schema.recipes.slug, [copySlug, liveSlug]));
	});

	const pageOf = (slug: string, userId: string) =>
		loadPage<PageData>(
			load,
			loadEvent({ path: `/recipes/${slug}`, user: { id: userId }, params: { slug } })
		);

	test("the copy's page data holds the kept version and the row's identity, nothing the author wrote later", async () => {
		const data = await pageOf(copySlug, saver);
		expect(data.keptCopy).toBe(true);
		expect(data.recipe).toMatchObject({ title: 'Soup v1', editRevision: 0 });
		const json = JSON.stringify(data);
		expect(json).not.toMatch(LATER);
		expect(Object.keys(data.recipe).sort()).toEqual(
			[
				'author',
				'authorId',
				'cookTimeMinutes',
				'description',
				'editRevision',
				'id',
				'imageUrl',
				'parent',
				'parentDeleted',
				'parentId',
				'prepTimeMinutes',
				'recipesToTags',
				'servings',
				'slug',
				'title',
				'versions'
			].sort()
		);
	});

	test("an ordinary recipe's page data carries no search vector", async () => {
		const data = await pageOf(liveSlug, saver);
		expect(data.recipe).not.toHaveProperty('fts');
	});
});
