import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import { inArray } from 'drizzle-orm';

import { closeDbAfter, localDb, stamp } from '#lib/testing/db.js';
import { loadEvent, loadPage } from '#lib/testing/actions.js';
import type { PageData } from './$types';

// The purge deletes for good across every owner; this file reads the Cookbook only.
vi.mock('#lib/server/trash.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/trash.js')>()),
	purgeExpiredTrash: vi.fn()
}));

closeDbAfter();

// A saver's Cookbook card for a recipe its author withdrew and then rewrote:
// committed rows (the load reads through the pool) between two seed profiles,
// removed after.
describe.skipIf(!localDb)("a kept copy's Cookbook card, against the real database", () => {
	let db: typeof import('#lib/server/db/index.js').db;
	let schema: typeof import('#lib/server/db/schema.js');
	let load: typeof import('./+page.server.js').load;
	const run = stamp();
	const slug = `cookbook-kept-${run}`;
	let author: string;
	let saver: string;
	let collectionId: number;
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
		const [{ id }] = await db
			.insert(schema.recipes)
			.values({
				authorId: author,
				slug,
				title: 'Zanzibar quokka',
				description: 'Pellucid marmalade',
				visibility: 'private'
			})
			.returning({ id: schema.recipes.id });
		await db.insert(schema.recipeVersions).values({
			recipeId: id,
			versionNumber: 1,
			commitMessage: 'v',
			...makeContent({ title: 'Soup v1', description: 'As saved' }),
			createdBy: author
		});
		await db.insert(schema.favorites).values({ userId: saver, recipeId: id, copyVersion: 1 });
		[{ id: collectionId }] = await db
			.insert(schema.collections)
			.values({ ownerId: saver, name: `Kept ${run}` })
			.returning({ id: schema.collections.id });
		await db.insert(schema.collectionRecipes).values({ collectionId, recipeId: id });
	});

	afterAll(async () => {
		if (!db) return;
		await db.delete(schema.collections).where(inArray(schema.collections.id, [collectionId]));
		await db.delete(schema.recipes).where(inArray(schema.recipes.slug, [slug]));
	});

	const cookbook = (path: string) =>
		loadPage<PageData>(load, loadEvent({ path, user: { id: saver } }));

	test.each(['/cookbook', '/cookbook?filter=saved', 'collection'])(
		'%s: the card holds the kept version and the row identity, nothing the author wrote later',
		async (path) => {
			const data = await cookbook(
				path === 'collection' ? `/cookbook?collection=${collectionId}` : path
			);
			const card = data.recipes.find((r) => r.slug === slug);
			expect(card).toMatchObject({ title: 'Soup v1', kept: true, forkCount: 0 });
			expect(JSON.stringify(data.recipes)).not.toMatch(LATER);
			expect(Object.keys(card!).sort()).toEqual(
				[
					'author',
					'authorId',
					'cookTimeMinutes',
					'description',
					'forkCount',
					'id',
					'imageUrl',
					'kept',
					'parentId',
					'prepTimeMinutes',
					'saved',
					'slug',
					'title',
					'versionCount'
				].sort()
			);
		}
	);

	test('no card carries the search vector', async () => {
		const data = await cookbook('/cookbook');
		expect(data.recipes.length).toBeGreaterThan(0);
		for (const card of data.recipes) expect(card).not.toHaveProperty('fts');
	});
});
