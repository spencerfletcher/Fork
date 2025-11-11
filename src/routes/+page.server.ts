import {db} from '$lib/server/db';
import {recipes} from '$lib/server/db/schema';
import {eq} from 'drizzle-orm';
import type {PageServerLoad} from './$types';

export const load: PageServerLoad = async () => {
	const displayedRecipes = await db
		.select()
		.from(recipes)
		.where(eq(recipes.public, true));

	return {
		recipes: displayedRecipes,
	};
};