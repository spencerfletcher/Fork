// Rows for the "no search vector reaches a page" db tests: a public parent
// and its public fork by one seed profile, removed by `remove`. The db module
// is imported inside, as in db.ts: it throws without DATABASE_URL.
import { inArray } from 'drizzle-orm';
import { makeContent } from '#lib/recipes/fixtures.js';

export async function parentAndFork() {
	const { db } = await import('#lib/server/db/index.js');
	const schema = await import('#lib/server/db/schema.js');
	const profile = await db.query.profiles.findFirst();
	if (!profile) throw new Error('Seed the local database first (pnpm db:seed)');
	const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	const [parentSlug, forkSlug] = [`fts-parent-${stamp}`, `fts-fork-${stamp}`];
	const [parent] = await db
		.insert(schema.recipes)
		.values({ authorId: profile.id, slug: parentSlug, title: 'Parent', visibility: 'public' })
		.returning({ id: schema.recipes.id });
	const [fork] = await db
		.insert(schema.recipes)
		.values({
			authorId: profile.id,
			slug: forkSlug,
			title: 'Fork',
			visibility: 'public',
			parentId: parent.id
		})
		.returning({ id: schema.recipes.id });
	await db.insert(schema.recipeVersions).values(
		[parent, fork].map(({ id }) => ({
			recipeId: id,
			versionNumber: 1,
			commitMessage: 'v',
			...makeContent(),
			createdBy: profile.id
		}))
	);
	return {
		username: profile.username,
		parentSlug,
		forkSlug,
		remove: () =>
			db.delete(schema.recipes).where(inArray(schema.recipes.slug, [parentSlug, forkSlug]))
	};
}
