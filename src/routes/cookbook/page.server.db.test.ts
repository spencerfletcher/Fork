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

// A fresh cook's whole library, so every count is exact: two of their own, one
// saved, one kept copy, and one of the other cook's they never saved. Committed
// (the load reads through the pool), removed after with the two profiles.
describe.skipIf(!localDb)('the Cookbook filters and counts, against the real database', () => {
	let db: typeof import('#lib/server/db/index.js').db;
	let schema: typeof import('#lib/server/db/schema.js');
	let load: typeof import('./+page.server.js').load;
	const run = stamp();
	const cook = `test-cook-${run}`;
	const other = `test-other-${run}`;
	const lonely = `test-lonely-${run}`;
	const tag = (n: number) => ({ name: `Pg ${n} ${run}`, slug: `pg-${n}-${run}` });
	let collectionId: number;

	beforeAll(async () => {
		({ db } = await import('#lib/server/db/index.js'));
		schema = await import('#lib/server/db/schema.js');
		({ load } = await import('./+page.server.js'));
		const { makeContent } = await import('#lib/recipes/fixtures.js');
		await db.insert(schema.profiles).values([
			{ id: cook, username: `cook-${run}` },
			{ id: other, username: `other-${run}` },
			{ id: lonely, username: `lonely-${run}` }
		]);
		// Oldest first, a minute apart, so the newest-first order is known.
		const recipe = (n: number, authorId: string, title: string, visibility = 'public') => ({
			authorId,
			slug: `cb-${run}-${n}`,
			title,
			visibility: visibility as 'public' | 'private',
			updatedAt: new Date(Date.UTC(2021, 0, 1, 0, n))
		});
		const rows = await db
			.insert(schema.recipes)
			.values([
				recipe(1, cook, 'Mine alpha'),
				recipe(2, cook, 'Mine beta', 'private'),
				recipe(3, other, 'Theirs gamma'),
				recipe(4, other, 'Theirs delta'),
				// Withdrawn after the cook saved it, then rewritten.
				recipe(5, other, 'Zanzibar quokka', 'private')
			])
			.returning({ id: schema.recipes.id });
		const [r1, r2, r3, , r5] = rows.map((r) => r.id);
		await db.insert(schema.recipeVersions).values({
			recipeId: r5,
			versionNumber: 1,
			commitMessage: 'v',
			...makeContent({ title: 'Kept soup', description: 'As saved' }),
			createdBy: other
		});
		await db.insert(schema.favorites).values([
			{ userId: cook, recipeId: r3 },
			{ userId: cook, recipeId: r5, copyVersion: 1 }
		]);
		const [t1, t2, t3] = await db
			.insert(schema.tags)
			.values([tag(1), tag(2), tag(3)])
			.returning({ id: schema.tags.id });
		await db.insert(schema.recipesToTags).values([
			{ recipeId: r1, tagId: t1.id },
			{ recipeId: r2, tagId: t1.id },
			{ recipeId: r2, tagId: t2.id },
			{ recipeId: r3, tagId: t1.id },
			// Only on the kept copy: no chip, since tags follow the recipe's audience.
			{ recipeId: r5, tagId: t3.id }
		]);
		[{ id: collectionId }] = await db
			.insert(schema.collections)
			.values({ ownerId: cook, name: `Pg ${run}` })
			.returning({ id: schema.collections.id });
		await db.insert(schema.collectionRecipes).values([
			{ collectionId, recipeId: r2 },
			{ collectionId, recipeId: r3 }
		]);
	});

	afterAll(async () => {
		if (!db) return;
		await db.delete(schema.recipes).where(inArray(schema.recipes.authorId, [cook, other]));
		await db.delete(schema.tags).where(
			inArray(
				schema.tags.slug,
				[1, 2, 3].map((n) => tag(n).slug)
			)
		);
		await db.delete(schema.profiles).where(inArray(schema.profiles.id, [cook, other, lonely]));
	});

	const shelf = (search = '', user = cook) =>
		loadPage<PageData>(load, loadEvent({ path: `/cookbook${search}`, user: { id: user } }));
	const titles = (data: PageData) => data.recipes.map((r) => r.title);

	test('counts the whole library by segment, newest change first', async () => {
		const data = await shelf();
		expect(data.counts).toMatchObject({ all: 4, mine: 2, saved: 2 });
		expect(data.inView).toEqual({ all: 4, mine: 2, saved: 2 });
		expect(titles(data)).toEqual(['Kept soup', 'Theirs gamma', 'Mine beta', 'Mine alpha']);
	});

	test('Mine is own recipes, Saved the others’ and the kept copy', async () => {
		expect(titles(await shelf('?filter=mine'))).toEqual(['Mine beta', 'Mine alpha']);
		expect(titles(await shelf('?filter=saved'))).toEqual(['Kept soup', 'Theirs gamma']);
	});

	test('a collection narrows the list and the segment counts, not the subtitle', async () => {
		const data = await shelf(`?collection=${collectionId}`);
		expect(titles(data)).toEqual(['Theirs gamma', 'Mine beta']);
		expect(data.inView).toEqual({ all: 2, mine: 1, saved: 1 });
		expect(data.counts).toMatchObject({ all: 4 });
		expect(titles(await shelf(`?collection=${collectionId}&filter=mine`))).toEqual(['Mine beta']);
	});

	test('chips come from the whole library but the kept copy; tags AND together', async () => {
		const data = await shelf('?filter=mine');
		expect(data.allTags.map((t) => t.slug)).toEqual([tag(1).slug, tag(2).slug]);
		expect(titles(await shelf(`?tags=${tag(1).slug}`))).toEqual([
			'Theirs gamma',
			'Mine beta',
			'Mine alpha'
		]);
		expect(titles(await shelf(`?tags=${tag(1).slug},${tag(2).slug}`))).toEqual(['Mine beta']);
		expect(titles(await shelf(`?tags=${tag(3).slug}`))).toHaveLength(4);
	});

	test('a text search finds by word and never finds the kept copy, even by its row', async () => {
		expect(titles(await shelf('?q=alpha'))).toEqual(['Mine alpha']);
		expect(titles(await shelf('?q=quokka'))).toEqual([]);
		expect(titles(await shelf('?q=soup'))).toEqual([]);
	});

	test('pages follow the cursor, the kept copy among them, and the total stays the whole', async () => {
		const first = await shelf('?per=1');
		expect(titles(first)).toEqual(['Kept soup']);
		expect(first.total).toBe(4);
		const second = await shelf(`?per=1&after=${encodeURIComponent(first.next!)}`);
		expect(titles(second)).toEqual(['Theirs gamma']);
		expect(second.total).toBe(4);
		// Show more's link and what Back asks for: the first pages in one read.
		const two = await shelf('?per=2&page=2');
		expect(titles(two)).toEqual(['Kept soup', 'Theirs gamma', 'Mine beta', 'Mine alpha']);
		expect(two.next).toBeNull();
	});

	test('a filtered total counts the matches, not the page', async () => {
		const data = await shelf(`?per=1&tags=${tag(1).slug}`);
		expect(data.recipes).toHaveLength(1);
		expect(data.total).toBe(3);
		expect((await shelf('?per=1&filter=saved')).total).toBe(2);
	});

	test('an empty library hears of no query or tags', async () => {
		const data = await shelf(`?q=dal&tags=${tag(1).slug}`, lonely);
		expect(data).toMatchObject({
			recipes: [],
			counts: { all: 0, mine: 0, saved: 0 },
			searchQuery: '',
			selectedTags: []
		});
	});
});
