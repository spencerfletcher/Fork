import { db } from '#lib/server/db/index.js';
import { recipes } from '#lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import { visibleTags } from '#lib/server/tagFilter.js';
import type { PageServerLoad } from './$types';

// Signed in: your own recipes, private ones included. Signed out: every public
// recipe, so the page is browsable without an account, with tag tabs to narrow it.
export const load: PageServerLoad = async ({ locals: { user } }) => {
	const [rows, tags] = await Promise.all([
		db.query.recipes.findMany({
			where: user ? eq(recipes.authorId, user.id) : eq(recipes.isPublic, true),
			with: {
				recipesToTags: { with: { tag: true } },
				author: true
			},
			orderBy: (r, { desc }) => [desc(r.updatedAt)]
		}),
		user ? [] : visibleTags(eq(recipes.isPublic, true))
	]);

	return {
		recipes: await attachRecipeCounts(rows),
		mine: !!user,
		tags,
		meta: { title: user ? 'My Recipes' : 'Recipes' }
	};
};
