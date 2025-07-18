import {db} from '$lib/server/db';
import {recipes} from '$lib/server/db/schema';
import {eq} from 'drizzle-orm';
import type {PageServerLoad} from './$types';

export const load: PageServerLoad = async ({locals: {session}}) => {
	let displayedRecipes = null;
	if (session) {
		// USER IS LOGGED IN: Fetch their own recipes and NOT public recipes.
		displayedRecipes = await db
			.select()
			.from(recipes)
			.where(
				eq(recipes.userId, session.user.id)
			);
	}

	return {
		recipes: displayedRecipes,
	};
};