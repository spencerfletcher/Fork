import {db} from '$lib/server/db';
import {recipes} from '$lib/server/db/schema';
import {eq} from 'drizzle-orm';
import type {PageServerLoad} from './$types';
import {redirect} from '@sveltejs/kit';

export const load: PageServerLoad = async ({locals: {user}}) => {
	if (!user) {
		throw redirect(303, '/login');
	}

	// USER IS LOGGED IN: Fetch their own recipes
	const displayedRecipes = await db
		.select()
		.from(recipes)
		.where(
			eq(recipes.userId, user.id)
		);

	return {
		recipes: displayedRecipes,
	};
};