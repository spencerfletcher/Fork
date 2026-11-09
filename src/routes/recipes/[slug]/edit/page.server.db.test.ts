import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

try {
	process.loadEnvFile('.env.local');
} catch {
	// CI has no .env.local; it sets the variables itself.
}
const local = process.env.DATABASE_URL?.includes('127.0.0.1') ?? false;

// Runs only against the local Supabase stack; the mock tests cover everything
// else. This one proves the row lock and revision check hold under a real race.
describe.skipIf(!local)('save, against the real database', () => {
	// Imported in beforeAll, not at collection time: a skipped suite still runs
	// its describe body, and the db module throws without DATABASE_URL.
	let db: typeof import('#lib/server/db/index.js').db;
	let recipes: typeof import('#lib/server/db/schema.js').recipes;
	let recipeVersions: typeof import('#lib/server/db/schema.js').recipeVersions;
	let actions: typeof import('./+page.server').actions;

	let recipeId: number;
	let userId: string;
	const slug = `race-test-${Date.now()}`;

	beforeAll(async () => {
		({ db } = await import('#lib/server/db/index.js'));
		({ recipes, recipeVersions } = await import('#lib/server/db/schema.js'));
		({ actions } = await import('./+page.server'));
		const { makeContent } = await import('#lib/recipes/fixtures.js');
		const profile = await db.query.profiles.findFirst();
		if (!profile) throw new Error('Seed the local database first (pnpm db:seed)');
		userId = profile.id;
		const content = makeContent({ title: 'Race' });
		const { title, description, servings, prepTimeMinutes, cookTimeMinutes } = content;
		const [recipe] = await db
			.insert(recipes)
			.values({
				slug,
				authorId: userId,
				title,
				description,
				servings,
				prepTimeMinutes,
				cookTimeMinutes
			})
			.returning({ id: recipes.id });
		recipeId = recipe.id;
		await db.insert(recipeVersions).values({
			recipeId,
			versionNumber: 1,
			commitMessage: 'Initial recipe',
			...content,
			createdBy: userId
		});
	});

	afterAll(async () => {
		if (recipeId) await db.delete(recipes).where(eq(recipes.id, recipeId));
	});

	function event(title: string) {
		const fd = new FormData();
		for (const [k, v] of Object.entries({
			title,
			description: '',
			servings: '4',
			prepTimeMinutes: '10',
			cookTimeMinutes: '20',
			ingredients: '1 cup flour',
			steps: 'Mix.',
			visibility: 'private',
			editRevision: '0'
		}))
			fd.append(k, v);
		return {
			params: { slug },
			request: { formData: async () => fd },
			locals: { user: { id: userId, email: 'race@test.dev' }, supabase: {} }
		};
	}

	test('two saves with the same revision: one wins, one gets 409, one version is written', async () => {
		const run = (title: string) =>
			(actions.save(event(title) as never) as Promise<unknown>).then(
				(r) => r,
				(e) => e
			);
		const results = (await Promise.all([run('Race A'), run('Race B')])) as {
			status: number;
			data?: { error: string };
		}[];
		const statuses = results.map((r) => r.status).sort();
		expect(statuses).toEqual([303, 409]);

		const versions = await db.query.recipeVersions.findMany({
			where: eq(recipeVersions.recipeId, recipeId)
		});
		expect(versions).toHaveLength(2);
		const recipe = await db.query.recipes.findFirst({ where: eq(recipes.id, recipeId) });
		expect(recipe?.editRevision).toBe(1);
		const winner = versions.find((v) => v.versionNumber === 2)!;
		expect(recipe?.title).toBe(winner.title);
	});
});

// Proves the "still shown elsewhere" query against real rows: a fork's first
// version copies its parent's photo url.
describe.skipIf(!local)('deleteRecipe, against the real database', () => {
	let db: typeof import('#lib/server/db/index.js').db;
	let recipes: typeof import('#lib/server/db/schema.js').recipes;
	let recipeVersions: typeof import('#lib/server/db/schema.js').recipeVersions;
	let actions: typeof import('./+page.server').actions;
	let makeContent: typeof import('#lib/recipes/fixtures.js').makeContent;
	let userId: string;
	const stamp = Date.now();
	const photo = (name: string) =>
		`http://127.0.0.1:54321/storage/v1/object/public/recipe-images/u/${stamp}-${name}.png`;
	const ids: number[] = [];

	/** A recipe with one version per photo. */
	async function insertRecipe(slug: string, photos: string[], parentId: number | null = null) {
		const content = makeContent({ title: slug });
		const [{ id }] = await db
			.insert(recipes)
			.values({ slug, authorId: userId, title: content.title, parentId })
			.returning({ id: recipes.id });
		ids.push(id);
		await db.insert(recipeVersions).values(
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

	beforeAll(async () => {
		({ db } = await import('#lib/server/db/index.js'));
		({ recipes, recipeVersions } = await import('#lib/server/db/schema.js'));
		({ actions } = await import('./+page.server'));
		({ makeContent } = await import('#lib/recipes/fixtures.js'));
		const profile = await db.query.profiles.findFirst();
		if (!profile) throw new Error('Seed the local database first (pnpm db:seed)');
		userId = profile.id;
	});

	afterAll(async () => {
		if (ids.length) await db.delete(recipes).where(inArray(recipes.id, ids));
	});

	test("removes the parent's own photos and keeps the one its fork still shows", async () => {
		const slug = `delete-test-${stamp}`;
		const parentId = await insertRecipe(slug, [photo('shared'), photo('own'), photo('own')]);
		await insertRecipe(`delete-test-fork-${stamp}`, [photo('shared')], parentId);
		const remove = vi.fn().mockResolvedValue({ error: null });
		const result = await Promise.resolve(
			actions.deleteRecipe({
				params: { slug },
				locals: {
					user: { id: userId, email: 'delete@test.dev' },
					supabase: { storage: { from: () => ({ remove }) } }
				}
			} as never)
		).catch((e: unknown) => e);

		expect(result).toMatchObject({ status: 303, location: '/cookbook' });
		expect(await db.query.recipes.findFirst({ where: eq(recipes.id, parentId) })).toBeUndefined();
		expect(remove).toHaveBeenCalledTimes(1);
		expect(remove).toHaveBeenCalledWith([`u/${stamp}-own.png`]);
	});
});
