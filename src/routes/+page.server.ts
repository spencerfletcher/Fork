import {db} from '$lib/server/db';
import {recipes} from '$lib/server/db/schema';
import {eq, or, isNull} from 'drizzle-orm';
import type {PageServerLoad} from './$types';

export const load: PageServerLoad = async ({locals: {session}}) => {
	let displayedRecipes;

	if (session) {
		// USER IS LOGGED IN: Fetch their own recipes AND public recipes.
		displayedRecipes = await db
			.select()
			.from(recipes)
			.where(
				or(
					eq(recipes.userId, session.user.id),
					isNull(recipes.userId)
				)
			);
	} else {
		// USER IS LOGGED OUT: Fetch ONLY public recipes.
		displayedRecipes = await db
			.select()
			.from(recipes)
			.where(isNull(recipes.userId));
	}

	return {
		recipes: displayedRecipes,
	};
};