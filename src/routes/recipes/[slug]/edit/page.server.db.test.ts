import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';

config({ path: '.env.local', override: true, quiet: true });
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
			isPublic: 'on',
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
