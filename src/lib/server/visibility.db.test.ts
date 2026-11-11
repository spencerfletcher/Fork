import { describe, test, expect, beforeAll, vi } from 'vitest';
import { and, eq, inArray, type SQL } from 'drizzle-orm';

import { closeDbAfter, localDb, withProfiles } from '#lib/testing/db.js';
import type { Visibility } from '#lib/recipes/validation.js';

// The moderator is a profile made inside a test, so MODERATOR_IDS is read
// through a getter on each isModerator call.
const moderators = vi.hoisted(() => ({ ids: '' }));
vi.mock('$app/env/private', async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	get MODERATOR_IDS() {
		return moderators.ids;
	}
}));

closeDbAfter();

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
		await withProfiles(3, async (tx, [owner, friend, other]) => {
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

describe.skipIf(!localDb)('a recipe a moderator hid, against the real database', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let visibility: typeof import('./visibility.js');
	let sitemap: typeof import('./sitemap.js');
	type Tx = import('./db/index.js').Tx;

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		visibility = await import('./visibility.js');
		sitemap = await import('./sitemap.js');
	});

	const ids = async (tx: Tx, where: SQL, id: number) =>
		(
			await tx
				.select({ id: schema.recipes.id })
				.from(schema.recipes)
				.where(and(where, eq(schema.recipes.id, id)))
		).map((r) => r.id);

	test('only its author and moderators see it, savers lose it from their library and keep no copy, the sitemap leaves it out; Restore brings it all back', async () => {
		await withProfiles(5, async (tx, [author, friend, saver, stranger, moderator], s) => {
			moderators.ids = `someone-else, ${moderator}`;
			await tx
				.insert(schema.friendships)
				.values({ requesterId: author, addresseeId: friend, status: 'accepted' });
			const insert = async (visibility: Visibility, slug: string) =>
				(
					await tx
						.insert(schema.recipes)
						.values({ authorId: author, slug, title: 'T', visibility, suppressedAt: new Date() })
						.returning({ id: schema.recipes.id })
				)[0].id;
			const pub = await insert('public', `hidden-pub-${s}`);
			// Withdrawn, with a copy granted before it was hidden.
			const priv = await insert('private', `hidden-priv-${s}`);
			await tx.insert(schema.favorites).values([
				{ userId: saver, recipeId: pub },
				{ userId: saver, recipeId: priv, copyVersion: 1 }
			]);

			const sees = (viewer: { id: string } | null) => ids(tx, visibility.visibleTo(viewer), pub);
			for (const viewer of [null, { id: friend }, { id: saver }, { id: stranger }])
				expect(await sees(viewer)).toEqual([]);
			expect(await sees({ id: author })).toEqual([pub]);
			expect(await sees({ id: moderator })).toEqual([pub]);
			// A moderator does not see a private recipe for being one.
			expect(await ids(tx, visibility.visibleTo({ id: moderator }), priv)).toEqual([]);

			const library = (id: number) => ids(tx, visibility.inLibraryOf({ id: saver }), id);
			expect(await library(pub)).toEqual([]);
			expect(await library(priv)).toEqual([]);
			expect(await ids(tx, visibility.keptCopyOf({ id: saver }), priv)).toEqual([]);
			expect(await ids(tx, visibility.inLibraryOf({ id: author }), pub)).toEqual([pub]);
			const slugs = async () =>
				(await sitemap.sitemapUrls('https://x', tx)).map((u) => u.loc.split('/').at(-1));
			expect(await slugs()).not.toContain(`hidden-pub-${s}`);

			await tx
				.update(schema.recipes)
				.set({ suppressedAt: null })
				.where(inArray(schema.recipes.id, [pub, priv]));
			for (const viewer of [null, { id: friend }, { id: saver }, { id: stranger }])
				expect(await sees(viewer)).toEqual([pub]);
			expect(await library(pub)).toEqual([pub]);
			expect(await library(priv)).toEqual([priv]);
			expect(await slugs()).toContain(`hidden-pub-${s}`);
			moderators.ids = '';
		});
	});
});
