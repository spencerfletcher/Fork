import { db } from '$lib/server/db';
import { recipes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { user } }) => {
	if (!user) {
		return { recipes: null };
	}

	const userRecipes = await db.query.recipes.findMany({
		where: eq(recipes.authorId, user.id),
		with: {
			recipesToTags: { with: { tag: true } },
			author: true
		},
		orderBy: (r, { desc }) => [desc(r.updatedAt)]
	});

	return { recipes: userRecipes };
};
