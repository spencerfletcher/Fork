import {db} from '$lib/server/db';
import {recipes} from '$lib/server/db/schema';
import {isNull} from 'drizzle-orm';
import type {PageServerLoad} from './$types';

export const load: PageServerLoad = async () => {
	const displayedRecipes = await db
		.select()
		.from(recipes)
		.where(isNull(recipes.userId));

	return {
		recipes: displayedRecipes,
	};
};