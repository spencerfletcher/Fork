import {redirect, error} from '@sveltejs/kit';
import type {Actions} from './$types';
import {db} from '$lib/server/db';
import {recipes, type NewRecipe} from '$lib/server/db/schema';

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

		// Create a new recipe object matching the Drizzle insert type
		const newRecipe: NewRecipe = {
			title,
			userId: userId,
			description,
			imageUrl,
			ingredients,
			instructions,
			cookTimeMinutes,
			prepTimeMinutes,
			servings,
		};

		let insertedId: number;

		try {
			// STEP 1: The `try` block now ONLY handles the database operation.
			const result = await db
				.insert(recipes)
				.values(newRecipe)
				.returning({insertedId: recipes.id});

			// If the insert was successful but returned nothing, throw an error.
			if (!result || result.length === 0) {
				throw new Error('Database insertion failed to return the new ID.');
			}

			insertedId = result[0].insertedId;

		} catch (e) {
			// STEP 2: The `catch` block now handles ONLY database errors.
			console.error('Failed to create recipe:', e);
			return error(500, {message: 'Something went wrong while creating your recipe.'});
		}

		// STEP 3: The redirect is now OUTSIDE and AFTER the try...catch block.
		// It will only execute if the `try` block completed successfully.
		throw redirect(303, `/recipes/${insertedId}`);
	}
};