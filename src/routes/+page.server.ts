import {db} from '$lib/server/db';
import {recipes} from '$lib/server/db/schema';
import type {PageServerLoad} from './$types';


export const load: PageServerLoad = async () => {
	// Fetch all recipes from your Supabase database using Drizzle
	const allRecipes = await db.select().from(recipes);

	// Return the live data
	return {
		recipes: allRecipes
	};
};