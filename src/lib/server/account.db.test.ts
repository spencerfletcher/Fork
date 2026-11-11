import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import { and, eq, inArray, or } from 'drizzle-orm';

import { closeDbAfter, localDb, stamp } from '#lib/testing/db.js';
import type { Visibility } from '#lib/recipes/validation.js';

closeDbAfter();

// Runs only against the local Supabase stack. deleteAccount commits its own
// transactions (deleteForever's and removeCopy's), so this cannot roll back:
// every row is stamped and removed in afterAll.
describe.skipIf(!localDb)('deleting an account, against the real database', () => {
	let db: typeof import('./db/index.js').db;
	let schema: typeof import('./db/schema.js');
	let account: typeof import('./account.js');
	let visibility: typeof import('./visibility.js');
	let makeContent: typeof import('#lib/recipes/fixtures.js').makeContent;

	const s = stamp();
	const id = (who: string) => `test-acct-${who}-${s}`;
	// The owner who deletes; a friend who saves; a stranger who saves; one the
	// owner blocked, who saved; a cook who forked; an author whose erased recipe
	// the owner holds the last copy of.
	const owner = id('owner');
	const friend = id('friend');
	const stranger = id('stranger');
	const blocked = id('blocked');
	const forker = id('forker');
	const other = id('other');
	const people = [owner, friend, stranger, blocked, forker, other];
	const usernameOf = (p: string) => p.replace('test-acct-', 'ac-');
	// The owner's name and the one they gave up before deleting.
	const names = [usernameOf(owner), `ac-old-${s}`];
	const photo = (name: string) =>
		`http://127.0.0.1:54321/storage/v1/object/public/recipe-images/${owner}/${s}-${name}.png`;
	const recipeIds: number[] = [];

	let n = 0;
	async function makeRecipe(
		authorId: string,
		visibility: Visibility,
		{
			versions = 2,
			deletedAt = null,
			parentId = null,
			imageUrl = null
		}: {
			versions?: number;
			deletedAt?: Date | null;
			parentId?: number | null;
			imageUrl?: string | null;
		} = {}
	) {
		const slug = `acct-${s}-${n++}`;
		const [row] = await db
			.insert(schema.recipes)
			.values({ authorId, slug, title: slug, visibility, deletedAt, parentId })
			.returning({ id: schema.recipes.id });
		recipeIds.push(row.id);
		await db.insert(schema.recipeVersions).values(
			Array.from({ length: versions }, (_, i) => ({
				recipeId: row.id,
				versionNumber: i + 1,
				commitMessage: 'v',
				...makeContent({ title: `${slug} v${i + 1}`, imageUrl }),
				createdBy: authorId
			}))
		);
		return { id: row.id, slug };
	}

	type World = Awaited<ReturnType<typeof makeWorld>>;
	let world: World;

	async function makeWorld() {
		await db.insert(schema.profiles).values(
			people.map((p) => ({
				id: p,
				username: usernameOf(p),
				avatarUrl: p === owner ? photo('avatar') : null
			}))
		);
		await db.insert(schema.friendships).values([
			{ requesterId: friend, addresseeId: owner, status: 'accepted' },
			{ requesterId: owner, addresseeId: blocked, status: 'blocked' },
			{ requesterId: forker, addresseeId: owner, status: 'pending' }
		]);
		await db.insert(schema.mutes).values({ muterId: owner, mutedId: stranger });

		const pub = await makeRecipe(owner, 'public', { imageUrl: photo('pub') });
		const fri = await makeRecipe(owner, 'friends');
		// Made private earlier: the friend's copy from then stands.
		const priv = await makeRecipe(owner, 'private');
		// In the Trash: its copies were granted when it went there.
		const trashed = await makeRecipe(owner, 'public', { deletedAt: new Date() });
		const unsaved = await makeRecipe(owner, 'public', { imageUrl: photo('unsaved') });
		const fork = await makeRecipe(forker, 'public', { versions: 1, parentId: pub.id });
		// Erased already, the owner's copy the last one left.
		const erased = await makeRecipe(other, 'public');
		await db
			.update(schema.recipes)
			.set({ deletedAt: new Date(), erasedAt: new Date(), title: '' })
			.where(eq(schema.recipes.id, erased.id));
		const friendsOwn = await makeRecipe(friend, 'public');

		await db.insert(schema.favorites).values([
			{ userId: friend, recipeId: pub.id, keptVersion: 1 },
			{ userId: stranger, recipeId: pub.id },
			{ userId: blocked, recipeId: pub.id },
			{ userId: friend, recipeId: fri.id },
			{ userId: stranger, recipeId: fri.id },
			{ userId: friend, recipeId: priv.id, copyVersion: 1 },
			{ userId: friend, recipeId: trashed.id, copyVersion: 2 },
			{ userId: owner, recipeId: erased.id, copyVersion: 1 },
			{ userId: owner, recipeId: friendsOwn.id }
		]);
		const [col] = await db
			.insert(schema.collections)
			.values({ ownerId: owner, name: 'To cook' })
			.returning({ id: schema.collections.id });
		await db.insert(schema.collectionRecipes).values([
			{ collectionId: col.id, recipeId: friendsOwn.id },
			{ collectionId: col.id, recipeId: pub.id }
		]);
		const [ownEntry, friendEntry] = await db
			.insert(schema.logEntries)
			.values([
				{ userId: owner, dish: 'Owner dish', cookedOn: '2026-11-01', photoUrl: photo('entry') },
				{ userId: friend, dish: 'Friend dish', cookedOn: '2026-11-01', recipeId: pub.id }
			])
			.returning({ id: schema.logEntries.id });
		await db.insert(schema.likes).values([
			{ userId: friend, logEntryId: ownEntry.id },
			{ userId: owner, logEntryId: friendEntry.id }
		]);
		await db.insert(schema.reports).values({
			reporterId: owner,
			targetType: 'user',
			targetId: stranger,
			reason: 'r'
		});
		const { FORMER_USERNAME_DAYS } = await import('#lib/auth/rules.js');
		await db.insert(schema.formerUsernames).values([
			{ username: names[1], profileId: owner },
			// The owner's name was another cook's once, long enough ago to be free.
			{
				username: names[0],
				profileId: other,
				createdAt: new Date(Date.now() - (FORMER_USERNAME_DAYS + 1) * 24 * 60 * 60 * 1000)
			}
		]);
		return { pub, fri, priv, trashed, unsaved, fork, erased, friendsOwn, friendEntry };
	}

	// Recorded here, not read from the mock: mocks are cleared before each test.
	const removed: string[] = [];
	let late: { id: number; slug: string } | undefined;
	const remove = vi.fn(async (paths: string[]) => {
		removed.push(...paths);
		// The first removal (the one recipe nobody keeps): meanwhile another tab
		// writes a recipe, which the first attempt must refuse to orphan.
		late ??= await makeRecipe(owner, 'public');
		// Storage refusing the account's own photos does not stop the deletion.
		if (paths.some((p) => p.endsWith('-avatar.png'))) throw new Error('Storage down');
		return { error: null };
	});
	const supabase = { storage: { from: () => ({ remove }) } } as never;

	beforeAll(async () => {
		({ db } = await import('./db/index.js'));
		schema = await import('./db/schema.js');
		account = await import('./account.js');
		visibility = await import('./visibility.js');
		({ makeContent } = await import('#lib/recipes/fixtures.js'));
		world = await makeWorld();
		// A failure part way must leave an account the next attempt finishes.
		await expect(account.deleteAccount(owner, supabase)).rejects.toThrow('gained a recipe');
		vi.spyOn(console, 'error').mockImplementation(() => {});
		await account.deleteAccount(owner, supabase);
	});

	afterAll(async () => {
		// The names stay reserved after the profile, owned by no one.
		await db.delete(schema.formerUsernames).where(inArray(schema.formerUsernames.username, names));
		await db.delete(schema.reports).where(eq(schema.reports.targetId, stranger));
		await db.delete(schema.profiles).where(inArray(schema.profiles.id, people));
		await db.delete(schema.recipes).where(inArray(schema.recipes.id, recipeIds));
	});

	const favoriteOf = (userId: string, recipeId: number) =>
		db.query.favorites.findFirst({
			where: and(eq(schema.favorites.userId, userId), eq(schema.favorites.recipeId, recipeId))
		});
	const row = (recipeId: number) =>
		db.query.recipes.findFirst({ where: eq(schema.recipes.id, recipeId) });

	test('every recipe of theirs is gone for everyone: their URLs, search, Discover and the sitemap find none', async () => {
		const { pub, fri, priv, trashed, unsaved } = world;
		const theirs = [pub, fri, priv, trashed, unsaved];
		for (const viewer of [null, { id: friend }, { id: stranger }, { id: forker }]) {
			for (const r of theirs) expect(await visibility.viewableRecipe(r.slug, viewer)).toBeNull();
			const shown = await db
				.select({ id: schema.recipes.id })
				.from(schema.recipes)
				.where(
					and(
						visibility.visibleTo(viewer),
						inArray(
							schema.recipes.id,
							theirs.map((r) => r.id)
						)
					)
				);
			expect(shown).toEqual([]);
		}
		const { sitemapUrls } = await import('./sitemap.js');
		const locs = (await sitemapUrls('https://x')).map((u) => u.loc).join(' ');
		for (const r of theirs) expect(locs).not.toContain(r.slug);
		expect(locs).not.toContain(`ac-owner-${s}`);
		expect(await row(unsaved.id)).toBeUndefined();
		expect(late).toBeDefined();
		expect(await row(late!.id)).toBeUndefined();
	});

	test('savers who could see a recipe keep a read-only copy with no author; one they could not see, or blocked, keep nothing', async () => {
		const { pub, fri, priv, trashed } = world;
		expect((await favoriteOf(friend, pub.id))?.copyVersion).toBe(1);
		expect((await favoriteOf(stranger, pub.id))?.copyVersion).toBe(2);
		expect(await favoriteOf(blocked, pub.id)).toBeUndefined();
		expect((await favoriteOf(friend, fri.id))?.copyVersion).toBe(2);
		expect(await favoriteOf(stranger, fri.id)).toBeUndefined();
		expect((await favoriteOf(friend, priv.id))?.copyVersion).toBe(1);
		expect((await favoriteOf(friend, trashed.id))?.copyVersion).toBe(2);
		for (const r of [pub, fri, priv, trashed]) {
			const kept = await row(r.id);
			expect(kept?.erasedAt).not.toBeNull();
			expect(kept?.authorId).toBeNull();
			expect(await visibility.keptCopy(r.slug, { id: friend })).not.toBeNull();
		}

		const { exportFor } = await import('./export.js');
		const ex = await exportFor(friend, 'https://x');
		const saved = ex.saves.find((save) => save.slug === pub.slug);
		expect(saved).toMatchObject({ author: null, keptCopy: 1 });
	});

	test("a fork by another cook survives, pointing at the deleted original; another cook's Journal entry of it stays", async () => {
		const fork = await row(world.fork.id);
		expect(fork).toMatchObject({ authorId: forker, parentId: world.pub.id, deletedAt: null });
		const entry = await db.query.logEntries.findFirst({
			where: eq(schema.logEntries.id, world.friendEntry.id)
		});
		expect(entry?.recipeId).toBe(world.pub.id);
	});

	test("an erased recipe they held the last copy of is finished; others' recipes they saved are untouched", async () => {
		expect(await row(world.erased.id)).toBeUndefined();
		expect(await row(world.friendsOwn.id)).toMatchObject({ authorId: friend, deletedAt: null });
	});

	test('friends lists, requests and blocks no longer name them', async () => {
		expect(await visibility.friendIdsOf(friend)).not.toContain(owner);
		expect(await visibility.blockedIdsOf(blocked)).not.toContain(owner);
	});

	test('nothing keyed by their id is left, and the Journal photo and avatar were removed', async () => {
		const counts = await Promise.all([
			db.$count(schema.profiles, eq(schema.profiles.id, owner)),
			db.$count(schema.recipes, eq(schema.recipes.authorId, owner)),
			db.$count(schema.recipeVersions, eq(schema.recipeVersions.createdBy, owner)),
			db.$count(schema.favorites, eq(schema.favorites.userId, owner)),
			db.$count(schema.collections, eq(schema.collections.ownerId, owner)),
			db.$count(schema.logEntries, eq(schema.logEntries.userId, owner)),
			db.$count(schema.likes, eq(schema.likes.userId, owner)),
			db.$count(
				schema.friendships,
				or(eq(schema.friendships.requesterId, owner), eq(schema.friendships.addresseeId, owner))
			),
			db.$count(schema.mutes, or(eq(schema.mutes.muterId, owner), eq(schema.mutes.mutedId, owner))),
			db.$count(schema.reports, eq(schema.reports.reporterId, owner)),
			db.$count(schema.formerUsernames, eq(schema.formerUsernames.profileId, owner))
		]);
		expect(counts).toEqual(counts.map(() => 0));
		expect(removed).toEqual(
			expect.arrayContaining([`${owner}/${s}-entry.png`, `${owner}/${s}-avatar.png`])
		);
	});

	test('their name and the one they gave up stay reserved to no one: taken at sign-up, and an old link finds nobody', async () => {
		const { namedBy, usernameTaken } = await import('./profiles.js');
		for (const name of names) {
			expect(await usernameTaken(name)).toBe(true);
			expect(await db.$count(schema.profiles, namedBy(name))).toBe(0);
			const held = await db.query.formerUsernames.findFirst({
				where: eq(schema.formerUsernames.username, name)
			});
			expect(held).toMatchObject({ profileId: null });
		}
	});

	test('the reservation ends FORMER_USERNAME_DAYS after deletion', async () => {
		const { FORMER_USERNAME_DAYS } = await import('#lib/auth/rules.js');
		const { usernameTaken } = await import('./profiles.js');
		const day = 24 * 60 * 60 * 1000;
		const at = (days: number, minutes: number) =>
			db
				.update(schema.formerUsernames)
				.set({ createdAt: new Date(Date.now() - days * day + minutes * 60_000) })
				.where(eq(schema.formerUsernames.username, names[0]));
		await at(FORMER_USERNAME_DAYS, 1);
		expect(await usernameTaken(names[0])).toBe(true);
		await at(FORMER_USERNAME_DAYS, -1);
		expect(await usernameTaken(names[0])).toBe(false);
	});

	test('a report they filed stays, from no one', async () => {
		const kept = await db.query.reports.findMany({
			where: eq(schema.reports.targetId, stranger)
		});
		expect(kept).toMatchObject([{ reporterId: null, reason: 'r' }]);
	});

	test('running it again changes nothing and does not throw', async () => {
		await expect(account.deleteAccount(owner, supabase)).resolves.toBeUndefined();
		expect((await favoriteOf(friend, world.pub.id))?.copyVersion).toBe(1);
	});
});
