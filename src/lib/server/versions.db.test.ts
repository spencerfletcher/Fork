import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { asc, eq, sql } from 'drizzle-orm';

import { inRollback, localDb } from '#lib/testing/db.js';
import { makeContent, makeIngredient, makeStep } from '#lib/recipes/fixtures.js';
import { recipeCopies, restoredCommitMessage, versionContent } from '#lib/recipes/content.js';

// The pool is closed once the file is done, so no connection outlives the run.
afterAll(async () => {
	if (localDb) await (await import('#lib/server/db/index.js')).closeDb();
});

// Runs only against the local Supabase stack, each test inside a transaction
// that is always rolled back, so it leaves no row behind.
describe.skipIf(!localDb)('restoreVersion, against the real database', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let versions: typeof import('./versions.js');

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		versions = await import('./versions.js');
	});

	type Tx = import('./db/index.js').Tx;

	const V1 = makeContent({
		title: 'Plain loaf',
		description: 'The first bake',
		servings: 2,
		makes: '1 loaf',
		prepTimeMinutes: 15,
		cookTimeMinutes: 40,
		imageUrl: 'https://cdn/v1.png',
		ingredients: [makeIngredient('500 g flour')],
		steps: [makeStep('Knead.', { type: 'tip', text: 'Ten minutes.' })]
	});
	const V2 = makeContent({
		title: 'Seeded loaf',
		description: null,
		servings: 4,
		imageUrl: 'https://cdn/v2.png',
		ingredients: [makeIngredient('500 g flour'), makeIngredient('50 g seeds')],
		steps: [makeStep('Knead, then fold in the seeds.')]
	});
	const REVISION = 3;

	/** A Friends recipe at v2 with one tag, its row holding v2's copies; then rolled back. */
	async function withRecipe(
		body: (tx: Tx, ids: { recipeId: number; userId: string }) => Promise<void>
	) {
		const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		const userId = `test-restore-${stamp}`;
		await inRollback(async (tx) => {
			await tx.insert(schema.profiles).values({ id: userId, username: `r-${stamp}` });
			const [recipe] = await tx
				.insert(schema.recipes)
				.values({
					authorId: userId,
					slug: `restore-${stamp}`,
					...recipeCopies(V2),
					visibility: 'friends',
					editRevision: REVISION
				})
				.returning({ id: schema.recipes.id });
			const [tag] = await tx
				.insert(schema.tags)
				.values({ name: `Bread ${stamp}`, slug: `bread-${stamp}` })
				.returning({ id: schema.tags.id });
			await tx.insert(schema.recipesToTags).values({ recipeId: recipe.id, tagId: tag.id });
			await tx.insert(schema.recipeVersions).values([
				{ recipeId: recipe.id, versionNumber: 1, commitMessage: 'First', ...V1, createdBy: userId },
				{ recipeId: recipe.id, versionNumber: 2, commitMessage: 'Seeds', ...V2, createdBy: userId }
			]);
			await body(tx, { recipeId: recipe.id, userId });
		});
	}

	const versionRows = (tx: Tx, recipeId: number) =>
		tx.query.recipeVersions.findMany({
			where: eq(schema.recipeVersions.recipeId, recipeId),
			orderBy: [asc(schema.recipeVersions.versionNumber)]
		});
	const recipeRow = async (tx: Tx, recipeId: number) => {
		const [row] = await tx.select().from(schema.recipes).where(eq(schema.recipes.id, recipeId));
		return row;
	};
	test("restoring v1 appends v3 with v1's content; v1 and v2 are unchanged", async () => {
		await withRecipe(async (tx, { recipeId, userId }) => {
			const before = await versionRows(tx, recipeId);

			const outcome = await versions.restoreVersion(tx, recipeId, userId, REVISION, 1);

			expect(outcome).toEqual({ versionNumber: 3 });
			const after = await versionRows(tx, recipeId);
			expect(after).toHaveLength(before.length + 1);
			expect(after.slice(0, before.length)).toEqual(before);
			const [, , restored] = after;
			expect(restored).toMatchObject({
				versionNumber: 3,
				commitMessage: restoredCommitMessage(1),
				createdBy: userId
			});
			expect(versionContent(restored)).toEqual(V1);
		});
	});

	test("the recipe row's copies and search follow the restored content; audience and tags do not move", async () => {
		await withRecipe(async (tx, { recipeId, userId }) => {
			const tagsBefore = await tx.query.recipesToTags.findMany({
				where: eq(schema.recipesToTags.recipeId, recipeId)
			});

			await versions.restoreVersion(tx, recipeId, userId, REVISION, 1);

			const row = await recipeRow(tx, recipeId);
			expect(row).toMatchObject({
				...recipeCopies(V1),
				visibility: 'friends',
				editRevision: REVISION + 1
			});
			const [{ found }] = await tx
				.select({
					found: sql<boolean>`${schema.recipes.fts} @@ plainto_tsquery('english', 'plain')`
				})
				.from(schema.recipes)
				.where(eq(schema.recipes.id, recipeId));
			expect(found).toBe(true);
			expect(
				await tx.query.recipesToTags.findMany({
					where: eq(schema.recipesToTags.recipeId, recipeId)
				})
			).toEqual(tagsBefore);
		});
	});

	test('restoring content equal to the latest is refused and writes nothing', async () => {
		await withRecipe(async (tx, { recipeId, userId }) => {
			const before = await recipeRow(tx, recipeId);
			expect(await versions.restoreVersion(tx, recipeId, userId, REVISION, 2)).toBe('unchanged');
			expect(await versionRows(tx, recipeId)).toHaveLength(2);
			expect(await recipeRow(tx, recipeId)).toEqual(before);
		});
	});

	test('a revision that moved on is stale and writes nothing', async () => {
		await withRecipe(async (tx, { recipeId, userId }) => {
			expect(await versions.restoreVersion(tx, recipeId, userId, REVISION - 1, 1)).toBe('stale');
			expect(await versionRows(tx, recipeId)).toHaveLength(2);
			expect((await recipeRow(tx, recipeId)).editRevision).toBe(REVISION);
		});
	});

	test('a version number this recipe does not have is not found', async () => {
		await withRecipe(async (tx, { recipeId, userId }) => {
			expect(await versions.restoreVersion(tx, recipeId, userId, REVISION, 9)).toBe('not_found');
			expect(await versionRows(tx, recipeId)).toHaveLength(2);
		});
	});

	test("someone else's recipe is forbidden", async () => {
		await withRecipe(async (tx, { recipeId }) => {
			expect(await versions.restoreVersion(tx, recipeId, 'someone-else', REVISION, 1)).toBe(
				'forbidden'
			);
			expect(await versionRows(tx, recipeId)).toHaveLength(2);
		});
	});
});
