import {error, redirect} from '@sveltejs/kit';
import {db} from '$lib/server/db';
import {recipes, favorites} from '$lib/server/db/schema';
import {eq, and} from 'drizzle-orm';
import type {PageServerLoad, Actions} from './$types';

export const load: PageServerLoad = async ({params, locals: {user}}) => {
	// 1. Get the ID from the URL and convert it to a number
	const recipeSlug = params.slug;

	// 2. Query the database for the first recipe that matches the ID
	const recipe = await db.query.recipes.findFirst({
		where: eq(recipes.slug, recipeSlug),
		with: {
			recipesToTags: {
				with: {
					tag: true,
				},
			},
		},
	});

	// 3. If no recipe is found, throw a 404 error
	if (!recipe) {
		throw error(404, 'Recipe not found');
	}

	if (!recipe.public) {
		// This is a private recipe
		if (!user || recipe.userId !== user.id) {
			throw error(403, 'You do not have permission to view this recipe');
		}
	}

	// Check if current user has favorited this recipe
	let isFavorited = false;
	if (user) {
		const favorite = await db.query.favorites.findFirst({
			where: and(
				eq(favorites.userId, user.id),
				eq(favorites.recipeId, recipe.id)
			),
		});
		isFavorited = !!favorite;
	}

	// 4. Return the found recipe with user info and favorite status
	return {
		recipe,
		user,
		isFavorited,
	};
};

export const actions: Actions = {
	togglePublic: async ({params, locals: {user}}) => {
		// Check if user is authenticated
		if (!user) {
			throw error(401, 'You must be logged in to update a recipe');
		}

		// Get the recipe
		const recipe = await db.query.recipes.findFirst({
			where: eq(recipes.slug, params.slug),
		});

		// Check if recipe exists
		if (!recipe) {
			throw error(404, 'Recipe not found');
		}

		// Check if user owns the recipe
		if (recipe.userId !== user.id) {
			throw error(403, 'You do not have permission to update this recipe');
		}

		// Toggle the public flag
		const updatedRecipe = await db
			.update(recipes)
			.set({public: !recipe.public})
			.where(eq(recipes.id, recipe.id))
			.returning();

		return {
			public: updatedRecipe[0].public,
		};
	},

	delete: async ({params, locals: {user}}) => {
		// Check if user is authenticated
		if (!user) {
			throw error(401, 'You must be logged in to delete a recipe');
		}

		// Get the recipe
		const recipe = await db.query.recipes.findFirst({
			where: eq(recipes.slug, params.slug),
		});

		// Check if recipe exists
		if (!recipe) {
			throw error(404, 'Recipe not found');
		}

		// Check if user owns the recipe
		if (recipe.userId !== user.id) {
			throw error(403, 'You do not have permission to delete this recipe');
		}

		// Delete the recipe (cascade will handle recipesToTags)
		await db.delete(recipes).where(eq(recipes.id, recipe.id));

		// Redirect to recipes page
		throw redirect(303, '/recipes');
	},

	toggleFavorite: async ({params, locals: {user}}) => {
		// Check if user is authenticated
		if (!user) {
			throw error(401, 'You must be logged in to favorite a recipe');
		}

		// Get the recipe
		const recipe = await db.query.recipes.findFirst({
			where: eq(recipes.slug, params.slug),
		});

		// Check if recipe exists
		if (!recipe) {
			throw error(404, 'Recipe not found');
		}

		// Check if recipe is already favorited
		const existingFavorite = await db.query.favorites.findFirst({
			where: and(
				eq(favorites.userId, user.id),
				eq(favorites.recipeId, recipe.id)
			),
		});

		let isFavorited = false;

		if (existingFavorite) {
			// Remove from favorites
			await db.delete(favorites).where(
				and(
					eq(favorites.userId, user.id),
					eq(favorites.recipeId, recipe.id)
				)
			);
			isFavorited = false;
		} else {
			// Add to favorites
			await db.insert(favorites).values({
				userId: user.id,
				recipeId: recipe.id,
			});
			isFavorited = true;
		}

		return {
			isFavorited,
		};
	},
};