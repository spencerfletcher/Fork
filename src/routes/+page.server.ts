import { db } from '$lib/server/db';
import { recipes, tags, recipesToTags } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { user } }) => {
	// Fetch all public recipes
	const allRecipes = await db.select().from(recipes).where(eq(recipes.public, true));

	// Fetch all tags
	const allTags = await db.select().from(tags);

	// Fetch recipe-to-tag mappings
	const mappings = await db.select().from(recipesToTags);

	return {
		recipes: allRecipes,
		tags: allTags,
		recipesToTags: mappings,
		user
	};
};
