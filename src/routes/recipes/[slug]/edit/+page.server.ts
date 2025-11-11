import {redirect, fail, error} from '@sveltejs/kit';
import type {Actions, PageServerLoad} from './$types';
import {db} from '$lib/server/db';
import {recipes, tags, recipesToTags} from '$lib/server/db/schema';
import {eq, inArray, count, desc} from 'drizzle-orm';

export const load: PageServerLoad = async ({params, locals: {user}}) => {
	if (!user) {
		throw redirect(303, '/login');
	}

	// Get the recipe
	const recipe = await db.query.recipes.findFirst({
		where: eq(recipes.slug, params.slug),
		with: {
			recipesToTags: {
				with: {
					tag: true,
				},
			},
		},
	});

	if (!recipe) {
		throw error(404, 'Recipe not found');
	}

	// Check ownership
	if (recipe.userId !== user.id) {
		throw error(403, 'You do not have permission to edit this recipe');
	}

	// Fetch top 10 tags sorted by popularity (count of recipes using each tag)
	const allTags = await db
		.select({
			id: tags.id,
			name: tags.name,
			slug: tags.slug,
			recipeCount: count(recipesToTags.recipeId),
		})
		.from(tags)
		.leftJoin(recipesToTags, eq(tags.id, recipesToTags.tagId))
		.groupBy(tags.id)
		.orderBy(({ recipeCount }) => desc(recipeCount))
		.limit(10);

	return {
		recipe,
		allTags,
	};
};

export const actions: Actions = {
	default: async ({params, request, locals: {user}}) => {
		if (!user) {
			throw redirect(303, '/login');
		}

		// Get the recipe to check ownership
		const recipe = await db.query.recipes.findFirst({
			where: eq(recipes.slug, params.slug),
		});

		if (!recipe) {
			throw error(404, 'Recipe not found');
		}

		if (recipe.userId !== user.id) {
			throw error(403, 'You do not have permission to edit this recipe');
		}

		const formData = await request.formData();

		const title = formData.get('title') as string;
		const tagString = formData.get('tags') as string;
		const tagNames = tagString ? tagString.split(',').map(tag => tag.trim()) : [];
		const rating = Number(formData.get('rating'));
		const description = formData.get('description') as string;
		const imageUrl = formData.get('imageUrl') as string;
		const ingredients = formData.get('ingredients') as string;
		const instructions = formData.get('instructions') as string;
		const cookTimeMinutes = Number(formData.get('cookTimeMinutes'));
		const prepTimeMinutes = Number(formData.get('prepTimeMinutes'));
		const servings = Number(formData.get('servings'));
		const isPublic = formData.get('public') === 'on';

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

		// Numeric validation
		if (!isNaN(cookTimeMinutes) && cookTimeMinutes < 0) {
			return fail(400, {message: 'Cook time cannot be negative.'});
		}

		if (!isNaN(prepTimeMinutes) && prepTimeMinutes < 0) {
			return fail(400, {message: 'Prep time cannot be negative.'});
		}

		if (!isNaN(servings) && servings < 0) {
			return fail(400, {message: 'Servings cannot be negative.'});
		}

		try {
			// Use a transaction to ensure all updates succeed or fail together
			await db.transaction(async (tx) => {
				// Update the recipe
				await tx
					.update(recipes)
					.set({
						title,
						description,
						imageUrl,
						ingredients,
						instructions,
						rating: isNaN(rating) ? null : rating.toString(),
						cookTimeMinutes: isNaN(cookTimeMinutes) ? null : cookTimeMinutes,
						prepTimeMinutes: isNaN(prepTimeMinutes) ? null : prepTimeMinutes,
						servings: isNaN(servings) ? null : servings,
						public: isPublic,
					})
					.where(eq(recipes.id, recipe.id));

				// Remove all existing tags for this recipe
				await tx.delete(recipesToTags).where(eq(recipesToTags.recipeId, recipe.id));

				// Add new tags if any
				if (tagNames.length > 0) {
					// Attempt to insert all tags. Existing tags will be ignored.
					await tx.insert(tags)
						.values(tagNames.map(name => ({name, slug: name.toLowerCase().replace(/\s+/g, '-')})))
						.onConflictDoNothing();

					// Select all the tags needed to get their IDs.
					const relevantTags = await tx.query.tags.findMany({
						where: inArray(tags.name, tagNames)
					});

					// Create the links in the join table
					await tx.insert(recipesToTags).values(
						relevantTags.map(tag => ({
							recipeId: recipe.id,
							tagId: tag.id
						}))
					);
				}
			});
		} catch (e) {
			console.error(e);
			throw error(500, {message: 'Something went wrong while updating your recipe.'});
		}

		throw redirect(303, `/recipes/${recipe.slug}`);
	}
};
