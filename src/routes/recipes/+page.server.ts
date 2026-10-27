import { db } from '#lib/server/db/index.js';
import { recipes } from '#lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import type { PageServerLoad } from './$types';

// Signed in: your own recipes, private ones included. Signed out: every public
// recipe, so the page is browsable without an account.
export const load: PageServerLoad = async ({ locals: { user } }) => {
	const rows = await db.query.recipes.findMany({
		where: user ? eq(recipes.authorId, user.id) : eq(recipes.isPublic, true),
		with: {
			recipesToTags: { with: { tag: true } },
			author: true
		},
		orderBy: (r, { desc }) => [desc(r.updatedAt)]
	});

	return { recipes: await attachRecipeCounts(rows), mine: !!user };
};
