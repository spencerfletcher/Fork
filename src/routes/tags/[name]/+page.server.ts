import {error} from '@sveltejs/kit';
import {db} from '$lib/server/db';
import {eq, and, or, isNull, inArray} from 'drizzle-orm';
import {tags, recipes, recipesToTags} from '$lib/server/db/schema';
import type {PageServerLoad} from './$types';

export const load: PageServerLoad = async ({params, locals: {session}}) => {
	const tagName = params.name;

	// First, get the tag's name to display on the page
	const tag = await db.query.tags.findFirst({
		columns: {
			id: true,
			name: true,
		},
		where: eq(tags.name, tagName),
	});

	if (!tag) {
		throw error(404, 'Tag not found');
	}

	// Next, find the IDs of all recipes that match the tag AND the user's auth status
	const recipeIdsQuery = db
		.select({id: recipes.id})
		.from(recipes)
		.leftJoin(recipesToTags, eq(recipes.id, recipesToTags.recipeId))
		.where(
			and(
				eq(recipesToTags.tagId, tag.id),
				session
					? or(eq(recipes.userId, session.user.id), isNull(recipes.userId))
					: isNull(recipes.userId)
			)
		);

	const recipeIdsResult = await recipeIdsQuery;
	const ids = recipeIdsResult.map(item => item.id);

	// If there are no matching recipes, we can return early
	if (ids.length === 0) {
		return {
			tag,
			recipes: []
		};
	}

	// Finally, fetch the full data for only those filtered recipes,
	// including all of their tags for the RecipeCard component.
	const recipesData = await db.query.recipes.findMany({
		where: inArray(recipes.id, ids),
		with: {
			recipesToTags: {
				with: {
					tag: true,
				},
			},
		},
	});

	return {
		tag,
		recipes: recipesData,
	};
};
