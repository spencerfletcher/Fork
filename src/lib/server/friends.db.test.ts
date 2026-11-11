import { describe, test, expect, beforeAll } from 'vitest';
import { and, eq, inArray, or } from 'drizzle-orm';

import { closeDbAfter, localDb, stamp, withProfiles } from '#lib/testing/db.js';
import type { Visibility } from '#lib/recipes/validation.js';

closeDbAfter();

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
		await withProfiles(2, async (tx, [a, b]) => {
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

	test("the Friends filter keeps a friend's recipes the viewer may see, never a stranger's or a blocked cook's", async () => {
		const { visibleTo, authorIsFriendOf } = await import('./visibility.js');
		await withFriends(async (tx, a, b) => {
			const stranger = `stranger-${a}`;
			const blocked = `blocked-${a}`;
			const pending = `pending-${a}`;
			await tx.insert(schema.profiles).values([
				{ id: stranger, username: `s-${a}` },
				{ id: blocked, username: `k-${a}` },
				{ id: pending, username: `p-${a}` }
			]);
			await tx.insert(schema.friendships).values([
				{ requesterId: blocked, addresseeId: a, status: 'blocked' },
				{ requesterId: a, addresseeId: pending, status: 'pending' }
			]);
			const bPublic = await makeRecipe(tx, b, 'public');
			const bFriends = await makeRecipe(tx, b, 'friends');
			const others = [
				await makeRecipe(tx, b, 'private'),
				await makeRecipe(tx, a, 'public'),
				await makeRecipe(tx, stranger, 'public'),
				await makeRecipe(tx, blocked, 'public'),
				await makeRecipe(tx, blocked, 'friends'),
				await makeRecipe(tx, pending, 'public')
			];
			const ids = [bPublic.id, bFriends.id, ...others.map((r) => r.id)];
			const rows = await tx.query.recipes.findMany({
				where: and(inArray(schema.recipes.id, ids), visibleTo({ id: a }), authorIsFriendOf(a)),
				columns: { id: true }
			});
			expect(rows.map((r) => r.id).sort((x, y) => x - y)).toEqual([bPublic.id, bFriends.id]);
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

	test("a fork unfriend makes private leaves its savers a kept copy, as any withdrawal does, and clears an old one's", async () => {
		await withFriends(async (tx, a, b) => {
			const run = stamp();
			const [saver, stranger] = [`test-s-${run}`, `test-x-${run}`];
			await tx.insert(schema.profiles).values([
				{ id: saver, username: `s-${run}` },
				{ id: stranger, username: `x-${run}` }
			]);
			// The saver is B's friend, so sees B's Friends fork; the stranger holds
			// a copy left by an earlier withdrawal and cannot see it now.
			await tx
				.insert(schema.friendships)
				.values({ requesterId: saver, addresseeId: b, status: 'accepted' });
			const aFriends = await makeRecipe(tx, a, 'friends');
			const fork = await makeRecipe(tx, b, 'friends', aFriends.id);
			const { makeContent } = await import('#lib/recipes/fixtures.js');
			await tx.insert(schema.recipeVersions).values(
				[1, 2].map((versionNumber) => ({
					recipeId: fork.id,
					versionNumber,
					commitMessage: 'v',
					...makeContent(),
					createdBy: b
				}))
			);
			await tx.insert(schema.favorites).values([
				{ userId: saver, recipeId: fork.id },
				{ userId: stranger, recipeId: fork.id, copyVersion: 1 }
			]);

			await friends.unfriendIn(tx, a, b);

			const saves = await tx
				.select({ userId: schema.favorites.userId, copy: schema.favorites.copyVersion })
				.from(schema.favorites)
				.where(eq(schema.favorites.recipeId, fork.id));
			expect(Object.fromEntries(saves.map((s) => [s.userId, s.copy]))).toEqual({
				[saver]: 2,
				[stranger]: null
			});
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

	test('a block ends the kept copies each side holds of the other’s recipes, and no one else’s', async () => {
		await withFriends(async (tx, a, b) => {
			const run = stamp();
			const other = `test-o-${run}`;
			await tx.insert(schema.profiles).values({ id: other, username: `o-${run}` });
			const aPrivate = await makeRecipe(tx, a, 'private');
			const bPublic = await makeRecipe(tx, b, 'public');
			await tx
				.update(schema.recipes)
				.set({ deletedAt: new Date() })
				.where(eq(schema.recipes.id, bPublic.id));
			await tx.insert(schema.favorites).values([
				{ userId: b, recipeId: aPrivate.id, copyVersion: 1 },
				{ userId: a, recipeId: bPublic.id, copyVersion: 1 },
				{ userId: other, recipeId: aPrivate.id, copyVersion: 1 }
			]);

			await friends.blockIn(tx, a, b);

			const copies = await tx
				.select({
					userId: schema.favorites.userId,
					recipeId: schema.favorites.recipeId,
					copy: schema.favorites.copyVersion
				})
				.from(schema.favorites)
				.where(inArray(schema.favorites.recipeId, [aPrivate.id, bPublic.id]));
			expect(copies.map((c) => [c.userId, c.recipeId, c.copy]).sort()).toEqual(
				[
					[b, aPrivate.id, null],
					[a, bPublic.id, null],
					[other, aPrivate.id, 1]
				].sort()
			);
			// The save stays but leaves the library, and lifting the block gives nothing back.
			const { inLibraryOf } = await import('./visibility.js');
			const inLibrary = (userId: string, id: number) =>
				tx.$count(schema.recipes, and(eq(schema.recipes.id, id), inLibraryOf({ id: userId })));
			expect(await inLibrary(b, aPrivate.id)).toBe(0);
			await tx.delete(schema.friendships).where(eq(schema.friendships.requesterId, a));
			expect(await inLibrary(b, aPrivate.id)).toBe(0);
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

describe.skipIf(!localDb)('the Friends feed, page by page, against the real database', () => {
	type Tx = import('./db/index.js').Tx;
	let schema: typeof import('#lib/server/db/schema.js');
	let friends: typeof import('./friends.js');
	let makeContent: typeof import('#lib/recipes/fixtures.js').makeContent;
	let friendIdsOf: typeof import('./visibility.js').friendIdsOf;

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		friends = await import('./friends.js');
		({ makeContent } = await import('#lib/recipes/fixtures.js'));
		({ friendIdsOf } = await import('./visibility.js'));
	});

	// One instant both sources share, to the microsecond.
	const TIE = new Date('2026-11-01T12:00:00.000Z');
	const LATER = new Date('2026-11-02T00:00:00.000Z');

	let n = 0;
	async function recipeWithVersions(
		tx: Tx,
		authorId: string,
		visibility: Visibility,
		versions: number,
		createdAt = TIE
	) {
		const [recipe] = await tx
			.insert(schema.recipes)
			.values({ authorId, slug: `feed-${stamp()}-${n++}`, title: 'T', visibility })
			.returning({ id: schema.recipes.id });
		await tx.insert(schema.recipeVersions).values(
			Array.from({ length: versions }, (_, i) => ({
				recipeId: recipe.id,
				versionNumber: i + 1,
				commitMessage: 'v',
				...makeContent(),
				createdBy: authorId,
				createdAt
			}))
		);
		return recipe.id;
	}

	async function entries(
		tx: Tx,
		userId: string,
		count: number,
		audience: 'friends' | 'private' = 'friends',
		createdAt = TIE
	) {
		await tx.insert(schema.logEntries).values(
			Array.from({ length: count }, () => ({
				userId,
				dish: 'D',
				cookedOn: '2026-11-01',
				audience,
				createdAt
			}))
		);
	}

	async function befriend(tx: Tx, a: string, b: string) {
		await tx
			.insert(schema.friendships)
			.values({ requesterId: a, addresseeId: b, status: 'accepted' });
	}

	const feed = async (tx: Tx, me: string, after: string | null, limit: number) =>
		friends.feedFor({ id: me }, await friendIdsOf(me, tx), { after, limit }, tx);

	/** Every page of `me`'s feed, `per` at a time, following each page's cursor. */
	async function walk(tx: Tx, me: string, per: number, between?: () => Promise<void>) {
		const pages: string[][] = [];
		let after: string | null = null;
		do {
			const page = await feed(tx, me, after, per);
			pages.push(page.items.map((i) => i.id));
			after = page.next;
			if (pages.length === 1) await between?.();
		} while (after && pages.length < 50);
		return pages;
	}

	test('pages through entries and versions that share one timestamp with no repeat or gap', async () => {
		await withProfiles(2, async (tx, [me, friend]) => {
			await befriend(tx, me, friend);
			await entries(tx, friend, 3);
			await recipeWithVersions(tx, friend, 'public', 2);
			await recipeWithVersions(tx, friend, 'friends', 2);

			const whole = await feed(tx, me, null, 50);
			expect(whole.items).toHaveLength(7);
			expect(new Set(whole.items.map((i) => i.id)).size).toBe(7);
			expect(whole.next).toBeNull();

			for (const per of [1, 2, 3]) {
				const pages = await walk(tx, me, per);
				expect(pages.flat()).toEqual(whole.items.map((i) => i.id));
				expect(pages.slice(0, -1).every((p) => p.length === per)).toBe(true);
			}
		});
	});

	test('an item added between pages shifts nothing: page two continues where page one ended', async () => {
		await withProfiles(2, async (tx, [me, friend]) => {
			await befriend(tx, me, friend);
			await entries(tx, friend, 2);
			await recipeWithVersions(tx, friend, 'public', 2);
			const before = (await feed(tx, me, null, 50)).items.map((i) => i.id);

			const pages = await walk(tx, me, 2, async () => {
				await entries(tx, friend, 1, 'friends', LATER);
				await recipeWithVersions(tx, friend, 'public', 1, LATER);
			});

			expect(pages.flat()).toEqual(before);
			// The newer items lead the feed read afresh.
			expect((await feed(tx, me, null, 50)).items).toHaveLength(before.length + 2);
		});
	});

	test("shows only what the viewer may see: no private entry or recipe, no stranger's, none once blocked", async () => {
		await withProfiles(3, async (tx, [me, friend, stranger]) => {
			await befriend(tx, me, friend);
			await entries(tx, friend, 1);
			await entries(tx, friend, 1, 'private');
			await recipeWithVersions(tx, friend, 'friends', 1);
			await recipeWithVersions(tx, friend, 'private', 1);
			const trashed = await recipeWithVersions(tx, friend, 'public', 1);
			await tx
				.update(schema.recipes)
				.set({ deletedAt: new Date() })
				.where(eq(schema.recipes.id, trashed));
			await entries(tx, stranger, 1);
			await recipeWithVersions(tx, stranger, 'public', 1);

			const page = await feed(tx, me, null, 50);
			expect(page.items.map((i) => i.kind).sort()).toEqual(['entry', 'event']);

			await friends.blockIn(tx, me, friend);
			expect((await feed(tx, me, null, 50)).items).toEqual([]);
		});
	});
});
