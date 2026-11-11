import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

import { closeDbAfter, inRollback, localDb } from '#lib/testing/db.js';
import { TRASH_DAYS } from '#lib/trash.js';

closeDbAfter();

const DAY = 86_400_000;

// Runs only against the local Supabase stack; trash.test.ts covers the rest.
describe.skipIf(!localDb)('the Trash, against the real database', () => {
	let db: typeof import('#lib/server/db/index.js').db;
	let schema: typeof import('#lib/server/db/schema.js');
	let trash: typeof import('./trash.js');
	let makeContent: typeof import('#lib/recipes/fixtures.js').makeContent;
	let userId: string;
	const stamp = Date.now();
	const photo = (name: string) =>
		`http://127.0.0.1:54321/storage/v1/object/public/recipe-images/u/${stamp}-${name}.png`;
	const ids: number[] = [];

	beforeAll(async () => {
		({ db } = await import('#lib/server/db/index.js'));
		schema = await import('#lib/server/db/schema.js');
		trash = await import('./trash.js');
		({ makeContent } = await import('#lib/recipes/fixtures.js'));
		const profile = await db.query.profiles.findFirst();
		if (!profile) throw new Error('Seed the local database first (pnpm db:seed)');
		userId = profile.id;
	});

	afterAll(async () => {
		if (ids.length) await db.delete(schema.recipes).where(inArray(schema.recipes.id, ids));
	});

	/** A recipe with one version per photo, deleted at `deletedAt`. */
	async function insertRecipe(
		slug: string,
		photos: string[],
		{
			parentId = null,
			deletedAt = null
		}: { parentId?: number | null; deletedAt?: Date | null } = {}
	) {
		const content = makeContent({ title: slug });
		const [{ id }] = await db
			.insert(schema.recipes)
			.values({ slug, authorId: userId, title: content.title, parentId, deletedAt })
			.returning({ id: schema.recipes.id });
		ids.push(id);
		await db.insert(schema.recipeVersions).values(
			photos.map((imageUrl, i) => ({
				recipeId: id,
				versionNumber: i + 1,
				commitMessage: 'v',
				...content,
				imageUrl,
				createdBy: userId
			}))
		);
		return id;
	}

	test('the Trash holds a recipe until TRASH_DAYS after its deletion, and not a moment past', async () => {
		const now = new Date();
		await inRollback(async (tx) => {
			const at = (days: number) => new Date(now.getTime() - days * DAY);
			const rows = await tx
				.insert(schema.recipes)
				.values(
					[0, TRASH_DAYS - 0.01, TRASH_DAYS, TRASH_DAYS + 0.01].map((days, i) => ({
						authorId: userId,
						slug: `trash-days-${stamp}-${i}`,
						title: 'T',
						deletedAt: at(days)
					}))
				)
				.returning({ id: schema.recipes.id, slug: schema.recipes.slug });
			const held = await tx
				.select({ slug: schema.recipes.slug })
				.from(schema.recipes)
				.where(trash.inTrashOf(userId, now));
			const mine = held.map((r) => r.slug).filter((s) => s.startsWith(`trash-days-${stamp}`));
			expect(mine.sort()).toEqual([rows[0].slug, rows[1].slug].sort());
		});
	});

	test('deleting for good removes the row and its own photos, keeping the one its fork still shows', async () => {
		const slug = `trash-forever-${stamp}`;
		const parentId = await insertRecipe(slug, [photo('shared'), photo('own'), photo('own')], {
			deletedAt: new Date()
		});
		const forkId = await insertRecipe(`trash-forever-fork-${stamp}`, [photo('shared')], {
			parentId
		});
		const remove = vi.fn().mockResolvedValue({ error: null });

		await trash.deleteForever(parentId, { storage: { from: () => ({ remove }) } } as never);

		const gone = await db.query.recipes.findFirst({ where: eq(schema.recipes.id, parentId) });
		expect(gone).toBeUndefined();
		const fork = await db.query.recipes.findFirst({ where: eq(schema.recipes.id, forkId) });
		expect(fork?.parentId).toBe(parentId);
		expect(remove).toHaveBeenCalledTimes(1);
		expect(remove).toHaveBeenCalledWith([`u/${stamp}-own.png`]);
	});

	test("deleting for good while a saver keeps a copy erases it: the saver's version and its photo stay, everything else goes", async () => {
		const savers = await db.query.profiles.findMany({
			where: (p, { ne }) => ne(p.id, userId),
			limit: 2
		});
		if (savers.length < 2) throw new Error('Seed the local database first (pnpm db:seed)');
		const [keeper, other] = savers.map((p) => p.id);
		const id = await insertRecipe(
			`trash-erase-${stamp}`,
			[photo('erase-1'), photo('erase-2'), photo('erase-3')],
			{ deletedAt: new Date() }
		);
		await db.insert(schema.favorites).values([
			{ userId: keeper, recipeId: id, copyVersion: 2, note: 'Mine' },
			{ userId: other, recipeId: id }
		]);
		const remove = vi.fn().mockResolvedValue({ error: null });
		const client = { storage: { from: () => ({ remove }) } } as never;

		await trash.deleteForever(id, client);

		const row = await db.query.recipes.findFirst({ where: eq(schema.recipes.id, id) });
		expect(row?.erasedAt).toBeInstanceOf(Date);
		const versions = await db.query.recipeVersions.findMany({
			where: eq(schema.recipeVersions.recipeId, id)
		});
		expect(versions.map((v) => v.versionNumber)).toEqual([2]);
		const saves = await db.query.favorites.findMany({ where: eq(schema.favorites.recipeId, id) });
		expect(saves.map((s) => [s.userId, s.note])).toEqual([[keeper, 'Mine']]);
		expect(remove).toHaveBeenCalledWith(
			expect.arrayContaining([`u/${stamp}-erase-1.png`, `u/${stamp}-erase-3.png`])
		);
		expect(remove.mock.calls.flat(2)).not.toContain(`u/${stamp}-erase-2.png`);
		// Gone from the author's Trash, and the purge passes over it.
		expect(await trash.trashedRecipe(`trash-erase-${stamp}`, userId)).toBeNull();

		// The last copy removed, the next deleteForever takes the rest.
		await db.delete(schema.favorites).where(eq(schema.favorites.recipeId, id));
		remove.mockClear();
		await trash.deleteForever(id, client);
		expect(await db.query.recipes.findFirst({ where: eq(schema.recipes.id, id) })).toBeUndefined();
		expect(remove).toHaveBeenCalledWith([`u/${stamp}-erase-2.png`]);
	});

	test("an erased recipe's row keeps none of the author's latest words, times or photo", async () => {
		const [keeper] = await db.query.profiles.findMany({
			where: (p, { ne }) => ne(p.id, userId),
			limit: 1
		});
		const id = await insertRecipe(`trash-erase-blank-${stamp}`, [photo('blank-1')], {
			deletedAt: new Date()
		});
		await db
			.update(schema.recipes)
			.set({
				title: 'Renamed in private',
				description: 'Written after',
				imageUrl: photo('blank-later'),
				servings: 4,
				prepTimeMinutes: 5,
				cookTimeMinutes: 6
			})
			.where(eq(schema.recipes.id, id));
		await db.insert(schema.favorites).values({ userId: keeper.id, recipeId: id, copyVersion: 1 });
		const remove = vi.fn().mockResolvedValue({ error: null });

		await trash.deleteForever(id, { storage: { from: () => ({ remove }) } } as never);

		const row = await db.query.recipes.findFirst({ where: eq(schema.recipes.id, id) });
		expect(row).toMatchObject({
			title: '',
			description: null,
			imageUrl: null,
			servings: null,
			prepTimeMinutes: null,
			cookTimeMinutes: null
		});
		expect(JSON.stringify(row)).not.toMatch(/renamed|written/i);
	});

	test('the purge finishes an erased recipe whose last copy went another way', async () => {
		const slug = `trash-stranded-${stamp}`;
		const id = await insertRecipe(slug, [photo('stranded')], { deletedAt: new Date() });
		// Erased, then its last saver's profile went (the save by cascade).
		await db.update(schema.recipes).set({ erasedAt: new Date() }).where(eq(schema.recipes.id, id));
		const kept = await insertRecipe(`trash-erased-kept-${stamp}`, [photo('kept')], {
			deletedAt: new Date()
		});
		const erasedAt = new Date(Date.now() - DAY);
		await db.update(schema.recipes).set({ erasedAt }).where(eq(schema.recipes.id, kept));
		const [keeper] = await db.query.profiles.findMany({
			where: (p, { ne }) => ne(p.id, userId),
			limit: 1
		});
		await db.insert(schema.favorites).values({ userId: keeper.id, recipeId: kept, copyVersion: 1 });
		const remove = vi.fn().mockResolvedValue({ error: null });

		await trash.purgeExpiredTrash({ storage: { from: () => ({ remove }) } } as never);

		expect(await db.query.recipes.findFirst({ where: eq(schema.recipes.id, id) })).toBeUndefined();
		expect(remove).toHaveBeenCalledWith([`u/${stamp}-stranded.png`]);
		// One still kept is passed over, not erased again.
		const still = await db.query.recipes.findFirst({ where: eq(schema.recipes.id, kept) });
		expect(still?.erasedAt).toEqual(erasedAt);
	});

	test('a live recipe is never deleted for good', async () => {
		const id = await insertRecipe(`trash-live-${stamp}`, [photo('live')]);
		const remove = vi.fn();
		await trash.deleteForever(id, { storage: { from: () => ({ remove }) } } as never);
		expect(await db.query.recipes.findFirst({ where: eq(schema.recipes.id, id) })).toBeDefined();
		expect(remove).not.toHaveBeenCalled();
	});
});
