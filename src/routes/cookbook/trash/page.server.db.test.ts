import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { formEvent, invokeAction } from '#lib/testing/actions.js';
import { closeDbAfter, localDb, stamp } from '#lib/testing/db.js';

closeDbAfter();

// Runs only against the local Supabase stack; the mock tests cover the rest.
// The load is not called: its purge would delete other rows for good.
describe.skipIf(!localDb)('the Trash, a hidden recipe, against the real database', () => {
	let db: typeof import('#lib/server/db/index.js').db;
	let recipes: typeof import('#lib/server/db/schema.js').recipes;
	let trash: typeof import('#lib/server/trash.js');
	let actions: typeof import('./+page.server').actions;
	let recipeId: number;
	let userId: string;
	const slug = `trash-hidden-${stamp()}`;
	const hiddenAt = new Date('2026-11-01T12:00:00Z');

	beforeAll(async () => {
		({ db } = await import('#lib/server/db/index.js'));
		({ recipes } = await import('#lib/server/db/schema.js'));
		trash = await import('#lib/server/trash.js');
		({ actions } = await import('./+page.server'));
		const profile = await db.query.profiles.findFirst();
		if (!profile) throw new Error('Seed the local database first (pnpm db:seed)');
		userId = profile.id;
		const [row] = await db
			.insert(recipes)
			.values({ slug, authorId: userId, title: 'Hidden', suppressedAt: hiddenAt })
			.returning({ id: recipes.id });
		recipeId = row.id;
	});

	afterAll(async () => {
		if (recipeId) await db.delete(recipes).where(eq(recipes.id, recipeId));
	});

	test('a recipe a moderator hid, moved to the Trash, is listed there and comes back still hidden', async () => {
		await trash.moveToTrash({ id: recipeId, authorId: userId });

		const listed = await db
			.select({ id: recipes.id })
			.from(recipes)
			.where(and(eq(recipes.id, recipeId), trash.inTrashOf(userId)));
		expect(listed).toHaveLength(1);
		expect(await trash.trashedRecipe(slug, userId)).toMatchObject({ id: recipeId });

		const result = await invokeAction(
			actions.restore,
			formEvent({ fields: { slug }, locals: { user: { id: userId, email: 'a@test.dev' } } })
		);
		expect(result).toMatchObject({ status: 303, location: `/recipes/${slug}` });

		const row = await db.query.recipes.findFirst({ where: eq(recipes.id, recipeId) });
		expect(row?.deletedAt).toBeNull();
		expect(row?.suppressedAt).toEqual(hiddenAt);
	});
});
