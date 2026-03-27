import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { eq, and, inArray } from 'drizzle-orm';
import { tags, recipes, recipesToTags } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const tagSlug = params.slug.toLowerCase();

	const tag = await db.query.tags.findFirst({
		where: eq(tags.slug, tagSlug)
	});

	if (!tag) throw error(404, 'Tag not found');

	const recipeIdsResult = await db
		.select({ id: recipes.id })
		.from(recipes)
		.leftJoin(recipesToTags, eq(recipes.id, recipesToTags.recipeId))
		.where(and(eq(recipesToTags.tagId, tag.id), eq(recipes.isPublic, true)));

	const ids = recipeIdsResult.map((item) => item.id);

	if (ids.length === 0) {
		return { tag, recipes: [] };
	}

	const recipesData = await db.query.recipes.findMany({
		where: inArray(recipes.id, ids),
		with: {
			recipesToTags: { with: { tag: true } },
			author: true
		}
	});

	return { tag, recipes: recipesData };
};
