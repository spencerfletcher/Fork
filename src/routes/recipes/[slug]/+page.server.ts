import {error} from '@sveltejs/kit';
import {db} from '$lib/server/db';
import {recipes} from '$lib/server/db/schema';
import {eq} from 'drizzle-orm';
import type {PageServerLoad} from './$types';

export const load: PageServerLoad = async ({params, locals: {session}}) => {
	// 1. Get the ID from the URL and convert it to a number
	const recipeSlug = params.slug;

	// 2. Query the database for the first recipe that matches the ID
	const recipe = await db.query.recipes.findFirst({
		where: eq(recipes.slug, recipeSlug),
		with: {
			recipesToTags: {
				with: {
					tag: true,
				},
			},
		},
	});

	// 3. If no recipe is found, throw a 404 error
	if (!recipe) {
		throw error(404, 'Recipe not found');
	}

	if (recipe.userId && (!session || recipe.userId !== session.user.id)) {
		throw error(403, 'Unauthorized');
	}

	// 4. Return the found recipe
	return {
		recipe,
	};
};