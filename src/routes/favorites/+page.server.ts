import {redirect} from '@sveltejs/kit';
import {db} from '$lib/server/db';
import {recipes, favorites, recipesToTags} from '$lib/server/db/schema';
import {eq} from 'drizzle-orm';
import type {PageServerLoad} from './$types';

export const load: PageServerLoad = async ({locals: {user}}) => {
	if (!user) {
		throw redirect(303, '/login');
	}

	// Fetch all recipes favorited by the user, with their tags
	const favoriteRecipes = await db
		.select({
			recipe: recipes,
		})
		.from(favorites)
		.innerJoin(recipes, eq(favorites.recipeId, recipes.id))
		.where(eq(favorites.userId, user.id))
		.orderBy(favorites.createdAt);

	// Fetch tags for each recipe
	const recipesWithTags = await Promise.all(
		favoriteRecipes.map(async ({recipe}) => {
			const recipeTags = await db.query.recipesToTags.findMany({
				where: eq(recipesToTags.recipeId, recipe.id),
				with: {
					tag: true,
				},
			});
			return {
				...recipe,
				recipesToTags: recipeTags,
			};
		})
	);

	return {
		favoriteRecipes: recipesWithTags,
	};
};
