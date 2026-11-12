import { describe, test, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';

import { closeDbAfter, localDb, withProfiles } from '#lib/testing/db.js';
import type { Visibility } from '#lib/recipes/validation.js';
import type { NotificationKind } from '#lib/notifications.js';

closeDbAfter();

// Runs only against the local Supabase stack, each test inside a transaction
// that is always rolled back, so it leaves no row behind. Inside one
// transaction now() never moves, so items that must order or be unseen get
// explicit times.
describe.skipIf(!localDb)('notifications, against the real database', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let n: typeof import('./notifications.js');

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		n = await import('./notifications.js');
	});

	type Tx = import('./db/index.js').Tx;
	const at = (day: string) => new Date(`2099-01-${day}T12:00:00Z`);

	let k = 0;
	async function recipe(
		tx: Tx,
		authorId: string | null,
		visibility: Visibility = 'public',
		extra: Partial<typeof schema.recipes.$inferInsert> = {}
	) {
		const [row] = await tx
			.insert(schema.recipes)
			.values({
				authorId,
				slug: `n-${Date.now()}-${k++}`,
				title: `Recipe ${k}`,
				visibility,
				...extra
			})
			.returning({ id: schema.recipes.id, slug: schema.recipes.slug, title: schema.recipes.title });
		return row;
	}

	async function entry(tx: Tx, userId: string, dish = 'Dal') {
		const [row] = await tx
			.insert(schema.logEntries)
			.values({ userId, dish, cookedOn: '2099-01-01', audience: 'friends' })
			.returning({ id: schema.logEntries.id });
		return row.id;
	}

	/** Every kind once, each by `actor` on `me`'s things, on the days given. */
	async function everyKind(tx: Tx, me: string, actor: string) {
		await tx
			.insert(schema.friendships)
			.values({ requesterId: actor, addresseeId: me, status: 'pending', createdAt: at('01') });
		const mine = await recipe(tx, me);
		await tx
			.insert(schema.favorites)
			.values({ userId: actor, recipeId: mine.id, createdAt: at('02') });
		await tx
			.insert(schema.likes)
			.values({ userId: actor, logEntryId: await entry(tx, me), createdAt: at('03') });
		await recipe(tx, actor, 'public', { parentId: mine.id, createdAt: at('04') });
		return mine;
	}

	const kinds = (items: { kind: NotificationKind }[]) => items.map((i) => i.kind);
	const read = (me: string, tx: Tx, limit = 20) =>
		n.notificationsFor({ id: me }, { limit, conn: tx });

	test('every kind, newest first, with its actor and what it points at', async () => {
		await withProfiles(3, async (tx, [me, b, c], s) => {
			const mine = await everyKind(tx, me, b);
			// My request to c, accepted on the 5th.
			await tx.insert(schema.friendships).values({
				requesterId: me,
				addresseeId: c,
				status: 'accepted',
				createdAt: at('01'),
				acceptedAt: at('05')
			});
			const items = await read(me, tx);
			expect(kinds(items)).toEqual(['accepted', 'fork', 'like', 'save', 'request']);
			expect(items[0]).toMatchObject({ username: `c-${s}`, at: at('05') });
			expect(items[1]).toMatchObject({
				username: `b-${s}`,
				recipe: { slug: mine.slug, title: mine.title },
				fork: { slug: expect.any(String), title: expect.any(String) }
			});
			expect(items[2]).toMatchObject({ entry: { dish: 'Dal' } });
			expect(items[3]).toMatchObject({ recipe: { slug: mine.slug } });
			expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
		});
	});

	test.each([
		['I blocked them', true],
		['they blocked me', false]
	])('nothing from someone in a block (%s)', async (_, iBlocked) => {
		await withProfiles(3, async (tx, [me, them, other]) => {
			await everyKind(tx, me, them);
			// The block's row replaces the request (one row per pair).
			await tx.delete(schema.friendships).where(eq(schema.friendships.requesterId, them));
			await tx.insert(schema.friendships).values({
				requesterId: iBlocked ? me : them,
				addresseeId: iBlocked ? them : me,
				status: 'blocked'
			});
			await everyKind(tx, me, other);
			const items = await read(me, tx);
			expect(kinds(items).sort()).toEqual(['fork', 'like', 'request', 'save']);
			expect(items.every((i) => i.username !== null && !i.username.startsWith('b-'))).toBe(true);
		});
	});

	test('nothing from someone I muted, of any kind; their mute of me changes nothing', async () => {
		await withProfiles(3, async (tx, [me, muted, muter]) => {
			await everyKind(tx, me, muted);
			await everyKind(tx, me, muter);
			await tx.insert(schema.mutes).values([
				{ muterId: me, mutedId: muted },
				{ muterId: muter, mutedId: me }
			]);
			const items = await read(me, tx);
			expect(items).toHaveLength(4);
			expect(items.every((i) => i.username?.startsWith('c-'))).toBe(true);
		});
	});

	test('my own save, fork and like of my own things are not news', async () => {
		await withProfiles(1, async (tx, [me]) => {
			const mine = await recipe(tx, me);
			await tx.insert(schema.favorites).values({ userId: me, recipeId: mine.id });
			await recipe(tx, me, 'public', { parentId: mine.id });
			await tx.insert(schema.likes).values({ userId: me, logEntryId: await entry(tx, me) });
			expect(await read(me, tx)).toEqual([]);
		});
	});

	test.each([
		['in the Trash', { deletedAt: new Date() }],
		['erased', { deletedAt: new Date(), erasedAt: new Date() }],
		['hidden by a moderator', { suppressedAt: new Date() }]
	])('a recipe of mine %s brings no save or fork', async (_, gone) => {
		await withProfiles(2, async (tx, [me, b]) => {
			const mine = await recipe(tx, me, 'public', gone);
			await tx.insert(schema.favorites).values({ userId: b, recipeId: mine.id });
			await recipe(tx, b, 'public', { parentId: mine.id });
			expect(await read(me, tx)).toEqual([]);
		});
	});

	test.each([
		['in the Trash', { deletedAt: new Date() }],
		['hidden by a moderator', { suppressedAt: new Date() }]
	])('a fork %s brings nothing', async (_, gone) => {
		await withProfiles(2, async (tx, [me, b]) => {
			const mine = await recipe(tx, me);
			await recipe(tx, b, 'public', { parentId: mine.id, ...gone });
			expect(await read(me, tx)).toEqual([]);
		});
	});

	test('a deleted entry takes its likes; a withdrawn request and an unsave take their item', async () => {
		await withProfiles(2, async (tx, [me, b]) => {
			const mine = await everyKind(tx, me, b);
			await tx.delete(schema.logEntries).where(eq(schema.logEntries.userId, me));
			await tx.delete(schema.friendships).where(eq(schema.friendships.requesterId, b));
			await tx.delete(schema.favorites).where(eq(schema.favorites.recipeId, mine.id));
			expect(kinds(await read(me, tx))).toEqual(['fork']);
		});
	});

	test('a fork I may not open is still news, without its title or slug', async () => {
		await withProfiles(3, async (tx, [me, stranger, friend]) => {
			const mine = await recipe(tx, me);
			await tx
				.insert(schema.friendships)
				.values({ requesterId: me, addresseeId: friend, status: 'accepted' });
			await recipe(tx, stranger, 'private', { parentId: mine.id, createdAt: at('03') });
			await recipe(tx, stranger, 'friends', { parentId: mine.id, createdAt: at('02') });
			const shared = await recipe(tx, friend, 'friends', {
				parentId: mine.id,
				createdAt: at('01')
			});
			const forks = (await read(me, tx)).flatMap((i) => (i.kind === 'fork' ? [i] : []));
			expect(forks.map((f) => f.fork)).toEqual([
				null,
				null,
				{ slug: shared.slug, title: shared.title }
			]);
			expect(forks.every((f) => f.recipe.slug === mine.slug)).toBe(true);
		});
	});

	test('a fork by an account that is gone names nobody', async () => {
		await withProfiles(1, async (tx, [me]) => {
			const mine = await recipe(tx, me);
			await recipe(tx, null, 'public', { parentId: mine.id });
			const [item] = await read(me, tx);
			expect(item).toMatchObject({ kind: 'fork', username: null });
		});
	});

	test('a pending request or one accepted before accepted_at existed is no "accepted" item', async () => {
		await withProfiles(3, async (tx, [me, b, c]) => {
			await tx.insert(schema.friendships).values([
				{ requesterId: me, addresseeId: b, status: 'pending' },
				{ requesterId: me, addresseeId: c, status: 'accepted' }
			]);
			expect(await read(me, tx)).toEqual([]);
		});
	});

	test('a muted kind gives up no place in the limit; a stored kind no longer in the list is ignored', async () => {
		await withProfiles(2, async (tx, [me, b]) => {
			await tx
				.update(schema.profiles)
				.set({ mutedNotifications: ['like', 'retired-kind'] as never })
				.where(eq(schema.profiles.id, me));
			// Likes newer than the one save.
			await everyKind(tx, me, b);
			const items = await read(me, tx, 2);
			expect(kinds(items)).toEqual(['fork', 'save']);
		});
	});

	test('unseen: newer than markSeen, by the database clock; never looked is all unseen', async () => {
		await withProfiles(2, async (tx, [me, b]) => {
			const mine = await recipe(tx, me);
			await tx
				.insert(schema.favorites)
				.values({ userId: b, recipeId: mine.id, createdAt: new Date('2000-01-01T00:00:00Z') });
			expect(await n.unseenCount({ id: me }, tx)).toBe(1);
			await n.markSeen(me, tx);
			expect(await n.unseenCount({ id: me }, tx)).toBe(0);
			await recipe(tx, b, 'public', { parentId: mine.id, createdAt: at('09') });
			expect(await n.unseenCount({ id: me }, tx)).toBe(1);
			expect((await read(me, tx)).map((i) => [i.kind, i.unseen])).toEqual([
				['fork', true],
				['save', false]
			]);
		});
	});

	test("markSeen writes only the cook's own profile", async () => {
		await withProfiles(2, async (tx, [me, b]) => {
			await n.markSeen(me, tx);
			const rows = await tx
				.select({ id: schema.profiles.id, seen: schema.profiles.notificationsSeenAt })
				.from(schema.profiles)
				.where(eq(schema.profiles.id, b));
			expect(rows).toEqual([{ id: b, seen: null }]);
		});
	});
});
