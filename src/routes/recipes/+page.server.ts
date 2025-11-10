import {db} from '$lib/server/db';
import {recipes} from '$lib/server/db/schema';
import {eq} from 'drizzle-orm';
import type {PageServerLoad} from './$types';
import {redirect} from '@sveltejs/kit';

export const load: PageServerLoad = async ({locals: {session}}) => {
	if (!session) {
		throw redirect(303, '/login');
	}
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