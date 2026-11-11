import { describe, test, expect, beforeAll } from 'vitest';
import { and, eq, inArray, type SQL } from 'drizzle-orm';

import { closeDbAfter, localDb, withProfiles } from '#lib/testing/db.js';
import type { Visibility } from '#lib/recipes/validation.js';
import { NOTE_MAX } from '#lib/saves.js';

closeDbAfter();

// Runs only against the local Supabase stack, each test inside a transaction
// that is always rolled back, so it leaves no row behind.
describe.skipIf(!localDb)('kept copies, against the real database', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let visibility: typeof import('./visibility.js');
	let kept: typeof import('./keptCopies.js');
	let makeContent: typeof import('#lib/recipes/fixtures.js').makeContent;
	type Tx = import('./db/index.js').Tx;

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		visibility = await import('./visibility.js');
		kept = await import('./keptCopies.js');
		({ makeContent } = await import('#lib/recipes/fixtures.js'));
	});

	type People = { author: string; friend: string; stranger: string };

	/** An author, their friend and a stranger, then everything is rolled back. */
	async function withPeople(body: (tx: Tx, p: People) => Promise<void>) {
		await withProfiles(3, async (tx, [author, friend, stranger]) => {
			await tx
				.insert(schema.friendships)
				.values({ requesterId: friend, addresseeId: author, status: 'accepted' });
			await body(tx, { author, friend, stranger });
		});
	}

	let n = 0;
	/** A recipe with `versions` versions, each titled by its number. */
	async function makeRecipe(tx: Tx, authorId: string, visibility: Visibility, versions = 3) {
		const [row] = await tx
			.insert(schema.recipes)
			.values({ authorId, slug: `kept-${Date.now()}-${n++}`, title: 'T', visibility })
			.returning({ id: schema.recipes.id });
		await tx.insert(schema.recipeVersions).values(
			Array.from({ length: versions }, (_, i) => ({
				recipeId: row.id,
				versionNumber: i + 1,
				commitMessage: 'v',
				...makeContent({ title: `v${i + 1}` }),
				createdBy: authorId
			}))
		);
		return { id: row.id, authorId, visibility };
	}

	async function copyVersionOf(tx: Tx, userId: string, recipeId: number) {
		const row = await tx.query.favorites.findFirst({
			where: and(eq(schema.favorites.userId, userId), eq(schema.favorites.recipeId, recipeId))
		});
		return row?.copyVersion;
	}

	async function idsWhere(tx: Tx, where: SQL, among: number[]) {
		const rows = await tx
			.select({ id: schema.recipes.id })
			.from(schema.recipes)
			.where(and(where, inArray(schema.recipes.id, among)));
		return rows.map((r) => r.id);
	}

	test('withdrawing a public recipe grants every saver a copy: their kept version, else the latest then', async () => {
		await withPeople(async (tx, { author, friend, stranger }) => {
			const recipe = await makeRecipe(tx, author, 'public');
			await tx.insert(schema.favorites).values([
				{ userId: friend, recipeId: recipe.id },
				{ userId: stranger, recipeId: recipe.id, keptVersion: 2 }
			]);
			await kept.grantKeptCopies(tx, recipe);
			expect(await copyVersionOf(tx, friend, recipe.id)).toBe(3);
			expect(await copyVersionOf(tx, stranger, recipe.id)).toBe(2);
		});
	});

	test('withdrawing a Friends recipe grants a copy to savers who are friends only: an unfriended saver keeps nothing', async () => {
		await withPeople(async (tx, { author, friend, stranger }) => {
			const recipe = await makeRecipe(tx, author, 'friends');
			// The stranger saved it while a friend, then was unfriended: a pinned
			// version records the choice but grants no copy.
			await tx.insert(schema.favorites).values([
				{ userId: friend, recipeId: recipe.id },
				{ userId: stranger, recipeId: recipe.id, keptVersion: 1, copyVersion: 1 }
			]);
			await kept.grantKeptCopies(tx, recipe);
			expect(await copyVersionOf(tx, friend, recipe.id)).toBe(3);
			expect(await copyVersionOf(tx, stranger, recipe.id)).toBeNull();
		});
	});

	test("the author's own save of their recipe is never a copy", async () => {
		await withPeople(async (tx, { author }) => {
			const recipe = await makeRecipe(tx, author, 'public');
			await tx.insert(schema.favorites).values({ userId: author, recipeId: recipe.id });
			await kept.grantKeptCopies(tx, recipe);
			expect(await copyVersionOf(tx, author, recipe.id)).toBeNull();
		});
	});

	test('keptCopyOf holds only while the recipe is withdrawn (private or in the Trash), for the saver with a copy alone', async () => {
		await withPeople(async (tx, { author, friend, stranger }) => {
			const recipe = await makeRecipe(tx, author, 'public');
			await tx.insert(schema.favorites).values([
				{ userId: friend, recipeId: recipe.id, copyVersion: 3 },
				{ userId: stranger, recipeId: recipe.id }
			]);
			const set = (values: Partial<typeof schema.recipes.$inferInsert>) =>
				tx.update(schema.recipes).set(values).where(eq(schema.recipes.id, recipe.id));
			const keptBy = (id: string) => idsWhere(tx, visibility.keptCopyOf({ id }), [recipe.id]);

			// Live and public: the recipe itself is seen, not a copy.
			expect(await keptBy(friend)).toEqual([]);
			await set({ visibility: 'private' });
			expect(await keptBy(friend)).toEqual([recipe.id]);
			expect(await keptBy(stranger)).toEqual([]);
			expect(await keptBy(author)).toEqual([]);
			// Narrowed to Friends but not private: an audience change, not a withdrawal.
			await set({ visibility: 'friends' });
			expect(await keptBy(friend)).toEqual([]);
			await set({ visibility: 'public', deletedAt: new Date() });
			expect(await keptBy(friend)).toEqual([recipe.id]);
			await set({ erasedAt: new Date() });
			expect(await keptBy(friend)).toEqual([recipe.id]);
		});
	});

	test("inLibraryOf keeps a saver's copy of a withdrawn recipe; a save with no copy drops out", async () => {
		await withPeople(async (tx, { author, friend, stranger }) => {
			const recipe = await makeRecipe(tx, author, 'private');
			await tx.insert(schema.favorites).values([
				{ userId: friend, recipeId: recipe.id, copyVersion: 2 },
				{ userId: stranger, recipeId: recipe.id }
			]);
			expect(await idsWhere(tx, visibility.inLibraryOf({ id: friend }), [recipe.id])).toEqual([
				recipe.id
			]);
			expect(await idsWhere(tx, visibility.inLibraryOf({ id: stranger }), [recipe.id])).toEqual([]);
		});
	});

	test('keptVersionsOf gives the copy version for kept copies only, never a later private edit', async () => {
		await withPeople(async (tx, { author, friend }) => {
			const copy = await makeRecipe(tx, author, 'public');
			const live = await makeRecipe(tx, author, 'public');
			await tx.insert(schema.favorites).values([
				{ userId: friend, recipeId: copy.id },
				{ userId: friend, recipeId: live.id }
			]);
			await kept.grantKeptCopies(tx, copy);
			await tx
				.update(schema.recipes)
				.set({ visibility: 'private', title: 'Renamed in private' })
				.where(eq(schema.recipes.id, copy.id));
			const versions = await kept.keptVersionsOf({ id: friend }, [copy.id, live.id], tx);
			expect([...versions.keys()]).toEqual([copy.id]);
			expect(versions.get(copy.id)?.title).toBe('v3');
			expect(versions.get(copy.id)?.versionNumber).toBe(3);
		});
	});

	test('keep, follow and note write the save row only, and refuse a recipe the cook has not saved', async () => {
		await withPeople(async (tx, { author, friend, stranger }) => {
			const recipe = await makeRecipe(tx, author, 'public');
			await tx.insert(schema.favorites).values({ userId: friend, recipeId: recipe.id });

			expect(await kept.keepVersion(friend, recipe.id, 2, tx)).toBe(true);
			const row = () =>
				tx.query.favorites.findFirst({
					where: and(eq(schema.favorites.userId, friend), eq(schema.favorites.recipeId, recipe.id))
				});
			expect((await row())?.keptVersion).toBe(2);
			// A version the recipe does not have is refused.
			expect(await kept.keepVersion(friend, recipe.id, 9, tx)).toBe(false);
			expect((await row())?.keptVersion).toBe(2);
			expect(await kept.keepVersion(friend, recipe.id, null, tx)).toBe(true);
			expect((await row())?.keptVersion).toBeNull();

			expect(await kept.setNote(friend, recipe.id, '  Less salt next time  ', tx)).toBe(true);
			expect((await row())?.note).toBe('Less salt next time');
			expect(await kept.setNote(friend, recipe.id, '   ', tx)).toBe(true);
			expect((await row())?.note).toBeNull();

			expect(await kept.keepVersion(stranger, recipe.id, 1, tx)).toBe(false);
			expect(await kept.setNote(stranger, recipe.id, 'x', tx)).toBe(false);
		});
	});

	test('removing a copy finishes an erase only when, under the row lock, the recipe is erased and no copy is left', async () => {
		await withPeople(async (tx, { author, friend }) => {
			const trashed = await makeRecipe(tx, author, 'public');
			const erased = await makeRecipe(tx, author, 'public');
			await tx.insert(schema.favorites).values([
				{ userId: friend, recipeId: trashed.id, copyVersion: 3 },
				{ userId: friend, recipeId: erased.id, copyVersion: 3, note: 'Mine' }
			]);
			await tx
				.update(schema.recipes)
				.set({ deletedAt: new Date() })
				.where(inArray(schema.recipes.id, [trashed.id, erased.id]));
			// In the Trash, not erased: the author's restorable recipe is never finished.
			expect(await kept.removeCopy(friend, trashed.id, tx)).toBe(false);
			expect(await copyVersionOf(tx, friend, trashed.id)).toBeUndefined();
			// Erased after the saver's page was read: the erase is read under the lock.
			await tx
				.update(schema.recipes)
				.set({ erasedAt: new Date() })
				.where(eq(schema.recipes.id, erased.id));
			expect(await kept.removeCopy(friend, erased.id, tx)).toBe(true);
			expect(await copyVersionOf(tx, friend, erased.id)).toBeUndefined();
		});
	});

	test('removing one copy of an erased recipe leaves it while another saver keeps one', async () => {
		await withPeople(async (tx, { author, friend, stranger }) => {
			const recipe = await makeRecipe(tx, author, 'public');
			await tx
				.update(schema.recipes)
				.set({ deletedAt: new Date(), erasedAt: new Date() })
				.where(eq(schema.recipes.id, recipe.id));
			await tx.insert(schema.favorites).values([
				{ userId: friend, recipeId: recipe.id, copyVersion: 3 },
				{ userId: stranger, recipeId: recipe.id, copyVersion: 2 }
			]);
			expect(await kept.removeCopy(friend, recipe.id, tx)).toBe(false);
			expect(await copyVersionOf(tx, stranger, recipe.id)).toBe(2);
		});
	});

	test('the database refuses a note over NOTE_MAX characters', async () => {
		await withPeople(async (tx, { author, friend }) => {
			const recipe = await makeRecipe(tx, author, 'public');
			await expect(
				tx.insert(schema.favorites).values({
					userId: friend,
					recipeId: recipe.id,
					note: 'x'.repeat(NOTE_MAX + 1)
				})
			).rejects.toThrow();
		});
	});
});
