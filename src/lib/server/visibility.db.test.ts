import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { and, eq, inArray, type SQL } from 'drizzle-orm';

import { inRollback, localDb } from '#lib/testing/db.js';
import type { Visibility } from '#lib/recipes/validation.js';

// The pool is closed once the file is done, so no connection outlives the run.
afterAll(async () => {
	if (localDb) await (await import('#lib/server/db/index.js')).closeDb();
});

// Runs only against the local Supabase stack, each test inside a transaction
// that is always rolled back, so it leaves no row behind.
describe.skipIf(!localDb)('the Trash in the visibility SQL, against the real database', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let visibility: typeof import('./visibility.js');
	type Tx = import('./db/index.js').Tx;

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		visibility = await import('./visibility.js');
	});

	/** An owner, their friend and a stranger, then everything is rolled back. */
	async function withPeople(
		body: (tx: Tx, owner: string, friend: string, other: string) => Promise<void>
	) {
		const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		const [owner, friend, other] = ['o', 'f', 'x'].map((p) => `test-${p}-${stamp}`);
		await inRollback(async (tx) => {
			await tx.insert(schema.profiles).values([
				{ id: owner, username: `o-${stamp}` },
				{ id: friend, username: `f-${stamp}` },
				{ id: other, username: `x-${stamp}` }
			]);
			await tx
				.insert(schema.friendships)
				.values({ requesterId: owner, addresseeId: friend, status: 'accepted' });
			await body(tx, owner, friend, other);
		});
	}

	let n = 0;
	async function makeRecipe(
		tx: Tx,
		authorId: string,
		visibility: Visibility,
		deletedAt: Date | null
	) {
		const [row] = await tx
			.insert(schema.recipes)
			.values({ authorId, slug: `trash-t-${Date.now()}-${n++}`, title: 'T', visibility, deletedAt })
			.returning({ id: schema.recipes.id });
		return row.id;
	}

	async function idsWhere(tx: Tx, where: SQL, among: number[]) {
		const rows = await tx
			.select({ id: schema.recipes.id })
			.from(schema.recipes)
			.where(and(where, inArray(schema.recipes.id, among)));
		return rows.map((r) => r.id).sort();
	}

	test('visibleTo hides a trashed recipe from everyone, its owner included, and shows it again once restored', async () => {
		await withPeople(async (tx, owner, friend, other) => {
			const live = await makeRecipe(tx, owner, 'public', null);
			const trashed = await Promise.all(
				(['public', 'friends', 'private'] as const).map((v) => makeRecipe(tx, owner, v, new Date()))
			);
			const all = [live, ...trashed];
			for (const viewer of [null, { id: other }, { id: friend }, { id: owner }]) {
				expect(await idsWhere(tx, visibility.visibleTo(viewer), all)).toEqual([live]);
			}

			await tx
				.update(schema.recipes)
				.set({ deletedAt: null })
				.where(inArray(schema.recipes.id, trashed));
			expect(await idsWhere(tx, visibility.visibleTo({ id: owner }), all)).toEqual(all.sort());
			expect(await idsWhere(tx, visibility.visibleTo({ id: friend }), all)).toEqual(
				[live, trashed[0], trashed[1]].sort()
			);
		});
	});

	test("inLibraryOf drops a trashed recipe from its owner's and a saver's library, keeping the save for a restore", async () => {
		await withPeople(async (tx, owner, friend) => {
			const id = await makeRecipe(tx, owner, 'public', new Date());
			await tx.insert(schema.favorites).values({ userId: friend, recipeId: id });
			expect(await idsWhere(tx, visibility.inLibraryOf({ id: owner }), [id])).toEqual([]);
			expect(await idsWhere(tx, visibility.inLibraryOf({ id: friend }), [id])).toEqual([]);

			await tx.update(schema.recipes).set({ deletedAt: null }).where(eq(schema.recipes.id, id));
			expect(await idsWhere(tx, visibility.inLibraryOf({ id: owner }), [id])).toEqual([id]);
			expect(await idsWhere(tx, visibility.inLibraryOf({ id: friend }), [id])).toEqual([id]);
		});
	});
});
