import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { and, eq, inArray, or } from 'drizzle-orm';

import { inRollback, localDb } from '#lib/testing/db.js';
import type { Visibility } from '#lib/recipes/validation.js';

// The pool is closed once the file is done, so no connection outlives the run.
afterAll(async () => {
	if (localDb) await (await import('#lib/server/db/index.js')).closeDb();
});

// Runs only against the local Supabase stack, each test inside a transaction
// that is always rolled back, so it leaves no row behind.
describe.skipIf(!localDb)('unfriend and block, against the real database', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let friends: typeof import('./friends.js');

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		friends = await import('./friends.js');
	});

	type Tx = import('./db/index.js').Tx;

	/** Runs `body` on a fresh pair of friends, A and B, then rolls everything back. */
	async function withFriends(body: (tx: Tx, a: string, b: string) => Promise<void>) {
		const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		const a = `test-a-${stamp}`;
		const b = `test-b-${stamp}`;
		await inRollback(async (tx) => {
			await tx.insert(schema.profiles).values([
				{ id: a, username: `a-${stamp}` },
				{ id: b, username: `b-${stamp}` }
			]);
			await tx
				.insert(schema.friendships)
				.values({ requesterId: a, addresseeId: b, status: 'accepted' });
			await body(tx, a, b);
		});
	}

	let n = 0;
	async function makeRecipe(
		tx: Tx,
		authorId: string,
		visibility: Visibility,
		parentId: number | null = null
	) {
		const [row] = await tx
			.insert(schema.recipes)
			.values({ authorId, slug: `t-${Date.now()}-${n++}`, title: 'T', visibility, parentId })
			.returning({ id: schema.recipes.id, editRevision: schema.recipes.editRevision });
		return row;
	}

	async function visibilityOf(tx: Tx, ids: number[]) {
		const rows = await tx
			.select({ id: schema.recipes.id, visibility: schema.recipes.visibility })
			.from(schema.recipes)
			.where(inArray(schema.recipes.id, ids));
		return Object.fromEntries(rows.map((r) => [r.id, r.visibility]));
	}

	async function pairRows(tx: Tx, a: string, b: string) {
		const { friendships: f } = schema;
		return tx
			.select({ requesterId: f.requesterId, status: f.status })
			.from(f)
			.where(
				or(
					and(eq(f.requesterId, a), eq(f.addresseeId, b)),
					and(eq(f.requesterId, b), eq(f.addresseeId, a))
				)
			);
	}

	test("visibleTo shows each friend the other's Friends recipes, whichever asked, and a stranger neither", async () => {
		const { visibleTo } = await import('./visibility.js');
		await withFriends(async (tx, a, b) => {
			const aFriends = await makeRecipe(tx, a, 'friends');
			const bFriends = await makeRecipe(tx, b, 'friends');
			const ids = [aFriends.id, bFriends.id];
			// Through db.query, whose where re-aliases columns: the friendships
			// columns must stay on the subquery's own alias.
			const seenBy = async (id: string) =>
				(
					await tx.query.recipes.findMany({
						where: and(inArray(schema.recipes.id, ids), visibleTo({ id })),
						columns: { id: true }
					})
				)
					.map((r) => r.id)
					.sort((x, y) => x - y);
			expect(await seenBy(a)).toEqual(ids);
			expect(await seenBy(b)).toEqual(ids);
			expect(await seenBy(`stranger-${a}`)).toEqual([]);
		});
	});

	test("unfriend privatises each side's forks of the other's Friends recipes, nothing else", async () => {
		await withFriends(async (tx, a, b) => {
			const aFriends = await makeRecipe(tx, a, 'friends');
			const aPublic = await makeRecipe(tx, a, 'public');
			const bFriends = await makeRecipe(tx, b, 'friends');
			const bForkOfA = await makeRecipe(tx, b, 'friends', aFriends.id);
			const bForkOfAPublic = await makeRecipe(tx, b, 'public', aPublic.id);
			const aForkOfB = await makeRecipe(tx, a, 'friends', bFriends.id);
			// A's own fork of A's recipe is not the other side's: it stays.
			const aForkOfOwn = await makeRecipe(tx, a, 'friends', aFriends.id);

			await friends.unfriendIn(tx, a, b);

			expect(await pairRows(tx, a, b)).toEqual([]);
			expect(
				await visibilityOf(tx, [
					bForkOfA.id,
					aForkOfB.id,
					bForkOfAPublic.id,
					aForkOfOwn.id,
					aFriends.id
				])
			).toEqual({
				[bForkOfA.id]: 'private',
				[aForkOfB.id]: 'private',
				[bForkOfAPublic.id]: 'public',
				[aForkOfOwn.id]: 'friends',
				[aFriends.id]: 'friends'
			});
			// An editor open on the fork holds the old revision and is refused.
			const [fork] = await tx
				.select({ editRevision: schema.recipes.editRevision })
				.from(schema.recipes)
				.where(eq(schema.recipes.id, bForkOfA.id));
			expect(fork.editRevision).toBe(bForkOfA.editRevision + 1);
		});
	});

	test('a second unfriend or a block leaves an already-private fork as it is, revision included', async () => {
		await withFriends(async (tx, a, b) => {
			const aFriends = await makeRecipe(tx, a, 'friends');
			const bForkOfA = await makeRecipe(tx, b, 'friends', aFriends.id);
			const revisionOf = async () => {
				const [row] = await tx
					.select({ editRevision: schema.recipes.editRevision })
					.from(schema.recipes)
					.where(eq(schema.recipes.id, bForkOfA.id));
				return row.editRevision;
			};

			await friends.unfriendIn(tx, a, b);
			const afterFirst = await revisionOf();
			await friends.unfriendIn(tx, a, b);
			expect(await revisionOf()).toBe(afterFirst);
			await friends.blockIn(tx, a, b);
			expect(await revisionOf()).toBe(afterFirst);
			expect(await visibilityOf(tx, [bForkOfA.id])).toEqual({ [bForkOfA.id]: 'private' });
		});
	});

	test('block unfriends, privatises the forks and leaves one blocked row with the blocker as requester', async () => {
		await withFriends(async (tx, a, b) => {
			const aFriends = await makeRecipe(tx, a, 'friends');
			const bForkOfA = await makeRecipe(tx, b, 'friends', aFriends.id);

			await friends.blockIn(tx, b, a);

			expect(await pairRows(tx, a, b)).toEqual([{ requesterId: b, status: 'blocked' }]);
			expect(await visibilityOf(tx, [bForkOfA.id])).toEqual({ [bForkOfA.id]: 'private' });

			// Blocking back changes nothing; unfriending never lifts a block.
			await friends.blockIn(tx, a, b);
			await friends.unfriendIn(tx, a, b);
			expect(await pairRows(tx, a, b)).toEqual([{ requesterId: b, status: 'blocked' }]);
		});
	});

	test('the blocked person’s like is kept but no longer counted', async () => {
		await withFriends(async (tx, a, b) => {
			const [entry] = await tx
				.insert(schema.logEntries)
				.values({ userId: a, dish: 'Dal', cookedOn: '2026-11-08', audience: 'friends' })
				.returning({ id: schema.logEntries.id });
			await tx.insert(schema.likes).values({ userId: b, logEntryId: entry.id });
			expect(await friends.likeCounts([entry.id], tx)).toEqual(new Map([[entry.id, 1]]));

			await friends.blockIn(tx, a, b);

			expect(await friends.likeCounts([entry.id], tx)).toEqual(new Map());
			const kept = await tx
				.select()
				.from(schema.likes)
				.where(eq(schema.likes.logEntryId, entry.id));
			expect(kept).toHaveLength(1);
		});
	});

	test('the database refuses a reverse duplicate and a friendship with oneself', async () => {
		await withFriends(async (tx, a, b) => {
			// Each insert in a savepoint, so its failure leaves the outer transaction usable.
			const refusal = (requesterId: string, addresseeId: string) =>
				tx
					.transaction(async (sp) => {
						await sp
							.insert(schema.friendships)
							.values({ requesterId, addresseeId, status: 'pending' });
					})
					.then(() => 'accepted')
					.catch((e: unknown) => String(e instanceof Error ? (e.cause ?? e) : e));
			expect(await refusal(b, a)).toContain('friendships_pair_idx');
			expect(await refusal(a, a)).toContain('friendships_not_self');
		});
	});
});
