import { describe, test, expect, beforeAll } from 'vitest';
import { and, eq, inArray } from 'drizzle-orm';

import { closeDbAfter, localDb, withProfiles } from '#lib/testing/db.js';
import { CAPS } from '#lib/recipes/validation.js';

closeDbAfter();

// Runs only against the local Supabase stack, each test inside a transaction
// that is always rolled back, so it leaves no row behind.
describe.skipIf(!localDb)('Cookbook bulk actions, against the real database', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let bulk: typeof import('./bulk.js');
	let makeContent: typeof import('#lib/recipes/fixtures.js').makeContent;

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		bulk = await import('./bulk.js');
		({ makeContent } = await import('#lib/recipes/fixtures.js'));
	});

	type Tx = import('./db/index.js').Tx;
	type Recipe = typeof schema.recipes.$inferInsert;

	let n = 0;
	async function recipe(tx: Tx, authorId: string, values: Partial<Recipe> = {}) {
		const [row] = await tx
			.insert(schema.recipes)
			.values({
				slug: `bulk-${Date.now()}-${n++}`,
				title: 'R',
				authorId,
				visibility: 'public',
				...values
			})
			.returning({ id: schema.recipes.id });
		await tx.insert(schema.recipeVersions).values({
			recipeId: row.id,
			versionNumber: 1,
			commitMessage: 'v',
			...makeContent(),
			createdBy: authorId
		});
		return row.id;
	}

	/**
	 * Cook A's Cookbook: two of A's own, one of B's saved, a kept copy of B's
	 * withdrawn one; beside it B's public one A never saved, B's private one,
	 * A's own in the Trash and an id nobody has.
	 */
	async function library(tx: Tx, a: string, b: string) {
		const own1 = await recipe(tx, a);
		const own2 = await recipe(tx, a);
		const saved = await recipe(tx, b);
		const kept = await recipe(tx, b, { visibility: 'private' });
		const foreign = await recipe(tx, b);
		const hidden = await recipe(tx, b, { visibility: 'private' });
		const trashed = await recipe(tx, a, { deletedAt: new Date() });
		await tx.insert(schema.favorites).values([
			{ userId: a, recipeId: saved },
			{ userId: a, recipeId: kept, copyVersion: 1 }
		]);
		const outside = [foreign, hidden, trashed, 2_000_000_000];
		return { own1, own2, saved, kept, outside };
	}

	async function collection(tx: Tx, ownerId: string, name: string, members: number[] = []) {
		const [{ id }] = await tx
			.insert(schema.collections)
			.values({ ownerId, name })
			.returning({ id: schema.collections.id });
		if (members.length)
			await tx
				.insert(schema.collectionRecipes)
				.values(members.map((recipeId) => ({ collectionId: id, recipeId })));
		return id;
	}

	const membersOf = async (tx: Tx, collectionId: number) =>
		(
			await tx
				.select({ id: schema.collectionRecipes.recipeId })
				.from(schema.collectionRecipes)
				.where(eq(schema.collectionRecipes.collectionId, collectionId))
		)
			.map((r) => r.id)
			.sort((x, y) => x - y);

	const tagsOf = async (tx: Tx, recipeId: number) =>
		(
			await tx
				.select({ name: schema.tags.name })
				.from(schema.recipesToTags)
				.innerJoin(schema.tags, eq(schema.tags.id, schema.recipesToTags.tagId))
				.where(eq(schema.recipesToTags.recipeId, recipeId))
		).map((t) => t.name);

	const sorted = (ids: number[]) => [...ids].sort((x, y) => x - y);

	test('each collection says whether all, some or none of the selection is in it', async () => {
		await withProfiles(2, async (tx, [a, b]) => {
			const r = await library(tx, a, b);
			const all = await collection(tx, a, 'All in', [r.own1, r.saved]);
			const some = await collection(tx, a, 'Some in', [r.own1, r.outside[0]]);
			const none = await collection(tx, a, 'None in', [r.outside[0]]);
			await collection(tx, b, 'Not hers', [r.own1, r.saved]);
			const rows = await bulk.collectionsFor({ id: a }, [r.own1, r.saved, ...r.outside], tx);
			const has = Object.fromEntries(rows.map((c) => [c.id, c.has]));
			expect(has).toMatchObject({ [all]: true, [some]: 'mixed', [none]: false });
			expect(rows.map((c) => c.name)).not.toContain('Not hers');
		});
	});

	test('collect adds what is in the library, own, saved and kept alike, and counts the rest', async () => {
		await withProfiles(2, async (tx, [a, b]) => {
			const r = await library(tx, a, b);
			const id = await collection(tx, a, 'Weeknight', [r.own1]);
			const ids = [r.own1, r.saved, r.kept, ...r.outside];
			expect(await bulk.collectAll({ id: a }, id, ids, true, tx)).toEqual({
				changed: 2,
				skipped: r.outside.length
			});
			expect(await membersOf(tx, id)).toEqual(sorted([r.own1, r.saved, r.kept]));

			// Unchecking takes them all out again; nothing outside is touched.
			expect(await bulk.collectAll({ id: a }, id, ids, false, tx)).toEqual({
				changed: 3,
				skipped: r.outside.length
			});
			expect(await membersOf(tx, id)).toEqual([]);
		});
	});

	test("another cook's collection is refused, and nothing changes in it", async () => {
		await withProfiles(2, async (tx, [a, b]) => {
			const r = await library(tx, a, b);
			const theirs = await collection(tx, b, 'Theirs', [r.saved]);
			expect(await bulk.collectAll({ id: a }, theirs, [r.own1], true, tx)).toBeNull();
			expect(await bulk.collectAll({ id: a }, theirs, [r.saved], false, tx)).toBeNull();
			expect(await membersOf(tx, theirs)).toEqual([r.saved]);
		});
	});

	test('a new collection is made with the selection in it; a refused name makes nothing', async () => {
		await withProfiles(2, async (tx, [a, b]) => {
			const r = await library(tx, a, b);
			const made = await bulk.newCollectionWith(
				{ id: a },
				'  Sunday  ',
				[r.own1, r.kept, ...r.outside],
				tx
			);
			if (!('id' in made)) throw new Error(made.error);
			expect(made).toMatchObject({ changed: 2, skipped: r.outside.length });
			expect(await membersOf(tx, made.id)).toEqual(sorted([r.own1, r.kept]));

			const refused = await bulk.newCollectionWith({ id: a }, 'sunday', [r.own1], tx);
			expect(refused).toHaveProperty('error');
		});
	});

	test('a tag goes on the cook’s own recipes only, as a setting: no version, the revision moved on', async () => {
		await withProfiles(2, async (tx, [a, b], s) => {
			const r = await library(tx, a, b);
			const tag = `Quick ${s}`;
			const before = await tx.query.recipes.findFirst({ where: eq(schema.recipes.id, r.own1) });
			const result = await bulk.tagAll(
				{ id: a },
				tag,
				[r.own1, r.own2, r.saved, r.kept, ...r.outside],
				tx
			);
			expect(result).toEqual({ changed: 2, already: 0, full: 0, skipped: 2 + r.outside.length });
			expect(await tagsOf(tx, r.own1)).toEqual([tag]);
			expect(await tagsOf(tx, r.own2)).toEqual([tag]);
			for (const other of [r.saved, r.kept, ...r.outside])
				expect(await tagsOf(tx, other)).toEqual([]);

			const after = await tx.query.recipes.findFirst({ where: eq(schema.recipes.id, r.own1) });
			expect(after!.editRevision).toBe(before!.editRevision + 1);
			const versions = await tx
				.select({ n: schema.recipeVersions.versionNumber })
				.from(schema.recipeVersions)
				.where(eq(schema.recipeVersions.recipeId, r.own1));
			expect(versions).toHaveLength(1);

			// Again, in another case: the stored tag, already on both.
			expect(await bulk.tagAll({ id: a }, tag.toUpperCase(), [r.own1, r.own2], tx)).toEqual({
				changed: 0,
				already: 2,
				full: 0,
				skipped: 0
			});
			expect(await tagsOf(tx, r.own1)).toEqual([tag]);
		});
	});

	test('a recipe already holding the most tags is skipped, and counted', async () => {
		await withProfiles(1, async (tx, [a], s) => {
			const full = await recipe(tx, a);
			const roomy = await recipe(tx, a);
			const made = await tx
				.insert(schema.tags)
				.values(
					Array.from({ length: CAPS.tags }, (_, i) => ({
						name: `Full ${s} ${i}`,
						slug: `full-${s}-${i}`
					}))
				)
				.returning({ id: schema.tags.id });
			await tx
				.insert(schema.recipesToTags)
				.values(made.map((t) => ({ recipeId: full, tagId: t.id })));

			expect(await bulk.tagAll({ id: a }, `Extra ${s}`, [full, roomy], tx)).toEqual({
				changed: 1,
				already: 0,
				full: 1,
				skipped: 0
			});
			expect(await tagsOf(tx, full)).toHaveLength(CAPS.tags);
			expect(await tagsOf(tx, roomy)).toEqual([`Extra ${s}`]);
		});
	});

	test('Move to Trash takes the cook’s own only, each through moveToTrash: savers keep copies', async () => {
		await withProfiles(3, async (tx, [a, b, c]) => {
			const r = await library(tx, a, b);
			await tx.insert(schema.favorites).values({ userId: c, recipeId: r.own1 });
			const result = await bulk.trashAll({ id: a }, [r.own1, r.saved, r.kept, ...r.outside], tx);
			expect(result).toEqual({ moved: 1, skipped: 2 + r.outside.length });

			const rows = await tx
				.select({ id: schema.recipes.id, deletedAt: schema.recipes.deletedAt })
				.from(schema.recipes)
				.where(inArray(schema.recipes.id, [r.own1, r.own2, r.saved, r.outside[0]]));
			const gone = rows.filter((x) => x.deletedAt).map((x) => x.id);
			expect(gone).toEqual([r.own1]);

			const [save] = await tx
				.select({ copy: schema.favorites.copyVersion })
				.from(schema.favorites)
				.where(and(eq(schema.favorites.userId, c), eq(schema.favorites.recipeId, r.own1)));
			expect(save.copy).toBe(1);
		});
	});
});
