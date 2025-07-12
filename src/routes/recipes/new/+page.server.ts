import {redirect, error} from '@sveltejs/kit';
import type {Actions} from './$types';
import {db} from '$lib/server/db';
import {recipes} from '$lib/server/db/schema';
import {slugify} from '$lib/helpers';
import {eq} from 'drizzle-orm';

export const actions: Actions = {
	default: async ({request, locals: {session}}) => {
		const formData = await request.formData();

		const title = formData.get('title') as string;
		const userId = session?.user.id ?? null; // Assuming session contains user info
		const description = formData.get('description') as string;
		const imageUrl = formData.get('imageUrl') as string;
		const ingredients = formData.get('ingredients') as string;
		const instructions = formData.get('instructions') as string;
		const cookTimeMinutes = Number(formData.get('cookTimeMinutes'));
		const prepTimeMinutes = Number(formData.get('prepTimeMinutes'));
		const servings = Number(formData.get('servings'));

		// Basic validation
		if (!title) {
			return error(400, {message: 'A title is required.'});
		}

		let newRecipeSlug: string | null = null;

		try {
			// Use a transaction to ensure both steps (creating the recipe and creating the slug) succeed or fail together
			await db.transaction(async (tx) => {
				const [newRecipe] = await tx
					.insert(recipes)
					.values({
						userId,
						title,
						description,
						imageUrl,
						ingredients,
						instructions,
						cookTimeMinutes: isNaN(cookTimeMinutes) ? null : cookTimeMinutes,
						prepTimeMinutes: isNaN(prepTimeMinutes) ? null : prepTimeMinutes,
						servings: isNaN(servings) ? null : servings,
					})
					.returning({insertedId: recipes.id});

				const slug = `${slugify(title)}-${newRecipe.insertedId}`;

				await tx
					.update(recipes)
					.set({slug: slug})
					.where(eq(recipes.id, newRecipe.insertedId));

				newRecipeSlug = slug;
			});

		} catch (e) {
			console.error(e);
			return error(500, {message: 'Something went wrong while creating your recipe.'});
		}

		if (!newRecipeSlug) {
			return error(500, {message: 'Failed to create recipe slug.'});
		}

		throw redirect(303, `/recipes/${newRecipeSlug}`);
	}
};