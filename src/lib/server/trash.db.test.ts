import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

import { inRollback, localDb } from '#lib/testing/db.js';
import { TRASH_DAYS } from '#lib/trash.js';

// The pool is closed once the file is done, so no connection outlives the run.
afterAll(async () => {
	if (localDb) await (await import('#lib/server/db/index.js')).closeDb();
});

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

	test('a live recipe is never deleted for good', async () => {
		const id = await insertRecipe(`trash-live-${stamp}`, [photo('live')]);
		const remove = vi.fn();
		await trash.deleteForever(id, { storage: { from: () => ({ remove }) } } as never);
		expect(await db.query.recipes.findFirst({ where: eq(schema.recipes.id, id) })).toBeDefined();
		expect(remove).not.toHaveBeenCalled();
	});
});
