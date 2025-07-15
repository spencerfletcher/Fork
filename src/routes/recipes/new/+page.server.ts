import {redirect, error} from '@sveltejs/kit';
import type {Actions, PageServerLoad} from './$types';
import {db} from '$lib/server/db';
import {recipes, tags, recipesToTags} from '$lib/server/db/schema';
import {slugify} from '$lib/helpers';
import {eq, inArray} from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	// Fetch all existing tags to display them on the page
	const allTags = await db.query.tags.findMany({
		orderBy: (tags, {asc}) => [asc(tags.name)],
	});

	return {allTags};
};

export const actions: Actions = {
	default: async ({request, locals: {session}}) => {
		const formData = await request.formData();

		const title = formData.get('title') as string;
		const tagString = formData.get('tags') as string;
		const tagNames = tagString ? tagString.split(',').map(tag => tag.trim()) : [];
		const rating = formData.get('rating') as string;
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
						rating,
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

				if (tagNames.length > 0) {
					// Attempt to insert all tags. Existing tags will be ignored.
					await tx.insert(tags)
						.values(tagNames.map(name => ({name, slug: slugify(name)})))
						.onConflictDoNothing();

					// Select all the tags needed to get their IDs.
					const relevantTags = await tx.query.tags.findMany({
						where: inArray(tags.name, tagNames)
					});

					// Create the links in the join table
					await tx.insert(recipesToTags).values(
						relevantTags.map(tag => ({
							recipeId: newRecipe.insertedId,
							tagId: tag.id
						}))
					);
				}
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