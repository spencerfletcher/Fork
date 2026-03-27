import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { recipes, favorites, tags, recipesToTags } from '$lib/server/db/schema';
import { eq, and, ilike, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	if (!user) {
		throw redirect(303, '/login');
	}

	const searchQuery = url.searchParams.get('q') || '';
	const tagSlugs = url.searchParams.get('tags')?.split(',').filter(Boolean) || [];

	// Get base favorited recipe IDs
	const favoriteMappings = await db
		.select({ recipeId: favorites.recipeId })
		.from(favorites)
		.where(eq(favorites.userId, user.id));

	let favoriteRecipeIds = favoriteMappings.map((f) => f.recipeId);

	if (favoriteRecipeIds.length === 0) {
		return {
			favoriteRecipes: [],
			allTags: [],
			searchQuery,
			selectedTags: tagSlugs
		};
	}

	// Tag filtering with OR logic and sorting by match count
	if (tagSlugs.length > 0) {
		const selectedTags = await db.select().from(tags).where(inArray(tags.slug, tagSlugs));
		const tagIds = selectedTags.map((t) => t.id);

		if (tagIds.length > 0) {
			// Get recipe IDs that have ANY of these tags (OR logic)
			const taggedRecipes = await db
				.select({ recipeId: recipesToTags.recipeId })
				.from(recipesToTags)
				.where(inArray(recipesToTags.tagId, tagIds));

			const taggedRecipeIds = [...new Set(taggedRecipes.map((r) => r.recipeId))];

			// Intersect: recipes that are BOTH favorited AND have ANY of the tags
			favoriteRecipeIds = favoriteRecipeIds.filter((id) => taggedRecipeIds.includes(id));

			if (favoriteRecipeIds.length === 0) {
				return {
					favoriteRecipes: [],
					allTags: [],
					searchQuery,
					selectedTags: tagSlugs
				};
			}

			// Build conditions for recipe fetch
			const conditions = [inArray(recipes.id, favoriteRecipeIds)];

			if (searchQuery) {
				conditions.push(ilike(recipes.title, `%${searchQuery}%`));
			}

			// Fetch recipes with their tags
			const filteredRecipes = await db.query.recipes.findMany({
				where: and(...conditions),
				with: {
					recipesToTags: {
						with: {
							tag: true
						}
					}
				}
			});

			// Count tag matches for each recipe
			const recipesWithMatchCount = filteredRecipes.map((recipe) => {
				const matchCount = taggedRecipes.filter((r) => r.recipeId === recipe.id).length;
				return { ...recipe, matchCount };
			});

			// Sort by match count descending
			recipesWithMatchCount.sort((a, b) => b.matchCount - a.matchCount);

			const allTags = await db.select().from(tags);

			return {
				favoriteRecipes: recipesWithMatchCount,
				allTags,
				searchQuery,
				selectedTags: tagSlugs
			};
		}
	}

	// Build conditions for recipe fetch without tag filtering
	const conditions = [inArray(recipes.id, favoriteRecipeIds)];

	if (searchQuery) {
		conditions.push(ilike(recipes.title, `%${searchQuery}%`));
	}

	// Fetch recipes with their tags
	const filteredRecipes = await db.query.recipes.findMany({
		where: and(...conditions),
		with: {
			recipesToTags: {
				with: {
					tag: true
				}
			}
		}
	});

	const allTags = await db.select().from(tags);

	return {
		favoriteRecipes: filteredRecipes,
		allTags,
		searchQuery,
		selectedTags: tagSlugs
	};
};
