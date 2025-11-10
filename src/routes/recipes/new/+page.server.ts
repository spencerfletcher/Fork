import {redirect, fail, error} from '@sveltejs/kit';
import type {Actions, PageServerLoad} from './$types';
import {db} from '$lib/server/db';
import {recipes, tags, recipesToTags} from '$lib/server/db/schema';
import {eq, inArray} from 'drizzle-orm';
import slugify from 'slugify';

export const load: PageServerLoad = async ({locals: {user}}) => {
	// Redirect unauthenticated users to login
	if (!user) {
		throw redirect(303, '/login');
	}

	// Fetch all existing tags to display them on the page
	const allTags = await db.query.tags.findMany({
		orderBy: (tags, {asc}) => [asc(tags.name)],
	});

	return {allTags};
};

export const actions: Actions = {
	default: async ({request, locals: {user}}) => {
		const formData = await request.formData();

		const title = formData.get('title') as string;
		const tagString = formData.get('tags') as string;
		const tagNames = tagString ? tagString.split(',').map(tag => tag.trim()) : [];
		const rating = Number(formData.get('rating'));
		const userId = user?.id ?? null;
		const description = formData.get('description') as string;
		const imageUrl = formData.get('imageUrl') as string;
		const ingredients = formData.get('ingredients') as string;
		const instructions = formData.get('instructions') as string;
		const cookTimeMinutes = Number(formData.get('cookTimeMinutes'));
		const prepTimeMinutes = Number(formData.get('prepTimeMinutes'));
		const servings = Number(formData.get('servings'));

		const MAX_TITLE_LENGTH = 200;
		const MAX_DESCRIPTION_LENGTH = 1000;
		const MAX_INGREDIENTS_LENGTH = 5000;
		const MAX_INSTRUCTIONS_LENGTH = 10000;

		// Comprehensive validation
		if (!title || typeof title !== 'string') {
			return fail(400, {message: 'A title is required.'});
		}

		if (title.trim().length === 0) {
			return fail(400, {message: 'Title cannot be empty.'});
		}

		if (title.length > MAX_TITLE_LENGTH) {
			return fail(400, {message: `Title must be less than ${MAX_TITLE_LENGTH} characters.`});
		}

		if (description && description.length > MAX_DESCRIPTION_LENGTH) {
			return fail(400, {message: 'Description is too long.'});
		}

		if (!ingredients || typeof ingredients !== 'string' || ingredients.trim().length === 0) {
			return fail(400, {message: 'Ingredients are required.'});
		}

		if (ingredients.length > MAX_INGREDIENTS_LENGTH) {
			return fail(400, {message: 'Ingredients are too long.'});
		}

		if (!instructions || typeof instructions !== 'string' || instructions.trim().length === 0) {
			return fail(400, {message: 'Instructions are required.'});
		}

		if (instructions.length > MAX_INSTRUCTIONS_LENGTH) {
			return fail(400, {message: 'Instructions are too long.'});
		}

		// URL validation (if provided)
		if (imageUrl && imageUrl.trim().length > 0) {
			try {
				new URL(imageUrl);
				// Optionally check for allowed protocols
				if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
					return fail(400, {message: 'Image URL must start with http:// or https://'});
				}
			} catch {
				return fail(400, {message: 'Invalid image URL format.'});
			}
		}

		// Numeric validation (already safe from SQL injection via parameterized queries)
		// But good to validate ranges
		if (!isNaN(cookTimeMinutes) && cookTimeMinutes < 0) {
			return fail(400, {message: 'Cook time cannot be negative.'});
		}

		if (!isNaN(prepTimeMinutes) && prepTimeMinutes < 0) {
			return fail(400, {message: 'Prep time cannot be negative.'});
		}

		if (!isNaN(servings) && servings < 0) {
			return fail(400, {message: 'Servings cannot be negative.'});
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
						rating: isNaN(rating) ? null : rating.toString(),
						cookTimeMinutes: isNaN(cookTimeMinutes) ? null : cookTimeMinutes,
						prepTimeMinutes: isNaN(prepTimeMinutes) ? null : prepTimeMinutes,
						servings: isNaN(servings) ? null : servings,
					})
					.returning({insertedId: recipes.id});

				const slug = `${slugify(title, { lower: true })}-${newRecipe.insertedId}`;

				await tx
					.update(recipes)
					.set({slug: slug})
					.where(eq(recipes.id, newRecipe.insertedId));

				newRecipeSlug = slug;

				if (tagNames.length > 0) {
					// Attempt to insert all tags. Existing tags will be ignored.
					await tx.insert(tags)
						.values(tagNames.map(name => ({name, slug: slugify(name, { lower: true })})))
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
			throw error(500, {message: 'Something went wrong while creating your recipe.'});
		}

		if (!newRecipeSlug) {
			throw error(500, {message: 'Failed to create recipe slug.'});
		}

		throw redirect(303, `/recipes/${newRecipeSlug}`);
	}
};