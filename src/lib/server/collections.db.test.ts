import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';

import { inRollback, localDb } from '#lib/testing/db.js';
import {
	COLLECTION_NAME_ERROR,
	COLLECTION_NAME_MAX,
	STARTER_COLLECTIONS
} from '#lib/collections.js';

afterAll(async () => {
	if (localDb) await (await import('#lib/server/db/index.js')).closeDb();
});

// Runs only against the local Supabase stack, each test inside a transaction
// that is always rolled back, so it leaves no row behind.
describe.skipIf(!localDb)('collections, against the real database', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let c: typeof import('./collections.js');

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		c = await import('./collections.js');
	});

	type Tx = import('./db/index.js').Tx;
	type Recipe = typeof schema.recipes.$inferInsert;

	/** Two cooks, A and B, rolled back after. */
	async function withTwo(body: (tx: Tx, a: { id: string }, b: { id: string }) => Promise<void>) {
		const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		await inRollback(async (tx) => {
			const a = { id: `test-a-${stamp}` };
			const b = { id: `test-b-${stamp}` };
			await tx.insert(schema.profiles).values([
				{ id: a.id, username: `a-${stamp}` },
				{ id: b.id, username: `b-${stamp}` }
			]);
			await body(tx, a, b);
		});
	}

	let n = 0;
	async function recipe(tx: Tx, authorId: string, values: Partial<Recipe> = {}) {
		const [row] = await tx
			.insert(schema.recipes)
			.values({ slug: `coll-${Date.now()}-${n++}`, title: 'R', authorId, ...values })
			.returning({ id: schema.recipes.id });
		return row.id;
	}

	const names = async (tx: Tx, user: { id: string }) =>
		(await c.collectionsOf(user, tx)).map((x) => x.name);

	async function created(tx: Tx, user: { id: string }, name: string) {
		const result = await c.createCollection(user.id, name, tx);
		if (!('id' in result)) throw new Error(result.error);
		return result.id;
	}

	test('the starters are made the first time, in order, and never again once deleted', async () => {
		await withTwo(async (tx, a) => {
			expect(await names(tx, a)).toEqual([...STARTER_COLLECTIONS]);
			expect(await names(tx, a)).toEqual([...STARTER_COLLECTIONS]);
			for (const { id } of await c.collectionsOf(a, tx)) await c.deleteCollection(a.id, id, tx);
			expect(await names(tx, a)).toEqual([]);
		});
	});

	test('a new name is trimmed and unique per cook whatever its case; another cook may share it', async () => {
		await withTwo(async (tx, a, b) => {
			// Every create follows a listing (the Cookbook, the recipe's menu), which makes the starters.
			await names(tx, a);
			await created(tx, a, '  Quick  ');
			expect(await c.createCollection(a.id, 'QUICK', tx)).toEqual({
				error: COLLECTION_NAME_ERROR.taken('QUICK')
			});
			expect(await c.createCollection(a.id, 'x'.repeat(COLLECTION_NAME_MAX + 1), tx)).toEqual({
				error: COLLECTION_NAME_ERROR.long
			});
			await created(tx, b, 'quick');
			expect(await names(tx, a)).toEqual([...STARTER_COLLECTIONS, 'Quick']);
		});
	});

	test('rename keeps the rules, may change only the case, and finds no other cook’s collection', async () => {
		await withTwo(async (tx, a, b) => {
			const quick = await created(tx, a, 'Quick');
			await created(tx, a, 'Italian');
			expect(await c.renameCollection(a.id, quick, 'italian', tx)).toEqual({
				error: COLLECTION_NAME_ERROR.taken('italian')
			});
			expect(await c.renameCollection(a.id, quick, 'QUICK', tx)).toEqual({ renamed: true });
			expect(await c.renameCollection(b.id, quick, 'Mine now', tx)).toEqual({ renamed: false });
			expect(await names(tx, a)).toContain('QUICK');
		});
	});

	test('a recipe joins only from the cook’s library: their own, or saved and still visible', async () => {
		await withTwo(async (tx, a, b) => {
			const quick = await created(tx, a, 'Quick');
			const own = await recipe(tx, a.id);
			const publicUnsaved = await recipe(tx, b.id, { visibility: 'public' });
			const privateSaved = await recipe(tx, b.id, { visibility: 'private' });
			const publicSaved = await recipe(tx, b.id, { visibility: 'public' });
			await tx.insert(schema.favorites).values([
				{ userId: a.id, recipeId: privateSaved },
				{ userId: a.id, recipeId: publicSaved }
			]);

			expect(await c.setMembership(a, quick, own, true, tx)).toBe(true);
			expect(await c.setMembership(a, quick, publicSaved, true, tx)).toBe(true);
			expect(await c.setMembership(a, quick, publicUnsaved, true, tx)).toBe(false);
			expect(await c.setMembership(a, quick, privateSaved, true, tx)).toBe(false);
			// Someone else's collection is not found, even for B's own recipe.
			expect(await c.setMembership(b, quick, publicSaved, true, tx)).toBe(false);
			// Adding twice is one membership.
			expect(await c.setMembership(a, quick, own, true, tx)).toBe(true);

			expect(await c.recipeIdsIn(a, quick, tx)).toEqual(expect.arrayContaining([own, publicSaved]));
			expect((await c.collectionsOf(a, tx)).find((x) => x.id === quick)?.count).toBe(2);
			expect(await c.recipeIdsIn(b, quick, tx)).toBeNull();

			expect(await c.setMembership(a, quick, own, false, tx)).toBe(true);
			expect(await c.recipeIdsIn(a, quick, tx)).toEqual([publicSaved]);
		});
	});

	test('a cook’s collection memberships of one recipe', async () => {
		await withTwo(async (tx, a) => {
			const [toCook, favorites] = (await c.collectionsOf(a, tx)).map((x) => x.id);
			const own = await recipe(tx, a.id);
			await c.setMembership(a, favorites, own, true, tx);
			expect(await c.collectionsOf(a, tx, own)).toEqual([
				{ id: toCook, name: 'To cook', count: 0, has: false },
				{ id: favorites, name: 'Favorites', count: 1, has: true }
			]);
		});
	});

	test('a trashed or no longer visible recipe drops out of counts and lists, and returns with its rows', async () => {
		await withTwo(async (tx, a, b) => {
			const quick = await created(tx, a, 'Quick');
			const own = await recipe(tx, a.id);
			const saved = await recipe(tx, b.id, { visibility: 'public' });
			await tx.insert(schema.favorites).values({ userId: a.id, recipeId: saved });
			await c.setMembership(a, quick, own, true, tx);
			await c.setMembership(a, quick, saved, true, tx);

			const trash = (id: number, deletedAt: Date | null) =>
				tx.update(schema.recipes).set({ deletedAt }).where(eq(schema.recipes.id, id));
			await trash(own, new Date());
			await tx
				.update(schema.recipes)
				.set({ visibility: 'private' })
				.where(eq(schema.recipes.id, saved));
			expect(await c.recipeIdsIn(a, quick, tx)).toEqual([]);
			expect((await c.collectionsOf(a, tx)).find((x) => x.id === quick)?.count).toBe(0);

			await trash(own, null);
			expect(await c.recipeIdsIn(a, quick, tx)).toEqual([own]);
		});
	});

	test('unsaving takes the recipe out of the saver’s collections only', async () => {
		await withTwo(async (tx, a, b) => {
			const recipeId = await recipe(tx, b.id, { visibility: 'public' });
			await tx.insert(schema.favorites).values({ userId: a.id, recipeId });
			const aQuick = await created(tx, a, 'Quick');
			const bQuick = await created(tx, b, 'Quick');
			await c.setMembership(a, aQuick, recipeId, true, tx);
			await c.setMembership(b, bQuick, recipeId, true, tx);

			await c.leaveCollections(a.id, recipeId, tx);
			const rows = await tx.select().from(schema.collectionRecipes);
			expect(rows.filter((r) => r.recipeId === recipeId).map((r) => r.collectionId)).toEqual([
				bQuick
			]);
		});
	});

	test('deleting a collection keeps its recipes; deleting a recipe for good takes its memberships', async () => {
		await withTwo(async (tx, a) => {
			const quick = await created(tx, a, 'Quick');
			const party = await created(tx, a, 'Party');
			const kept = await recipe(tx, a.id);
			const gone = await recipe(tx, a.id);
			await c.setMembership(a, quick, kept, true, tx);
			await c.setMembership(a, party, gone, true, tx);

			expect(await c.deleteCollection(a.id, quick, tx)).toBe(true);
			expect(await tx.$count(schema.recipes, eq(schema.recipes.id, kept))).toBe(1);
			await tx.delete(schema.recipes).where(eq(schema.recipes.id, gone));
			expect(
				await tx.$count(schema.collectionRecipes, eq(schema.collectionRecipes.collectionId, party))
			).toBe(0);
		});
	});
});
