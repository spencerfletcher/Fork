import { db } from '$lib/server/db';
import { recipes, tags, recipesToTags } from '$lib/server/db/schema';
import { ilike, eq, and, or, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	const searchQuery = url.searchParams.get('q') || '';
	const tagSlugs = url.searchParams.get('tags')?.split(',').filter(Boolean) || [];

	let conditions = [];

	// Text search on title (case-insensitive)
	if (searchQuery) {
		conditions.push(ilike(recipes.title, `%${searchQuery}%`));
	}

	// Public filter (show public recipes, or user's own recipes if authenticated)
	conditions.push(
		user ? or(eq(recipes.isPublic, true), eq(recipes.authorId, user.id)) : eq(recipes.isPublic, true)
	);

	// Tag filtering with OR logic and sorting by match count
	if (tagSlugs.length > 0) {
		// First get tag IDs from slugs
		const selectedTags = await db.select().from(tags).where(inArray(tags.slug, tagSlugs));
		const tagIds = selectedTags.map((t) => t.id);

		if (tagIds.length > 0) {
			// Get recipe IDs that have ANY of these tags (OR logic)
			const mappings = await db
				.select({ recipeId: recipesToTags.recipeId })
				.from(recipesToTags)
				.where(inArray(recipesToTags.tagId, tagIds));

			const recipeIds = [...new Set(mappings.map((m) => m.recipeId))];

			if (recipeIds.length > 0) {
				conditions.push(inArray(recipes.id, recipeIds));

				// Execute query
				const filteredRecipes = await db
					.select()
					.from(recipes)
					.where(conditions.length > 0 ? and(...conditions) : undefined);

				// Count tag matches for each recipe
				const recipesWithMatchCount = filteredRecipes.map((recipe) => {
					const matchCount = mappings.filter((m) => m.recipeId === recipe.id).length;
					return { ...recipe, matchCount };
				});

				// Sort by match count descending
				recipesWithMatchCount.sort((a, b) => b.matchCount - a.matchCount);

				const allTags = await db.select().from(tags);

				return {
					recipes: recipesWithMatchCount,
					allTags,
					searchQuery,
					selectedTags: tagSlugs
				};
			} else {
				// No recipes match these tags
				return { recipes: [], allTags: [], searchQuery, selectedTags: tagSlugs };
			}
		}
	}

	// Execute query without tag filtering
	const filteredRecipes = await db
		.select()
		.from(recipes)
		.where(conditions.length > 0 ? and(...conditions) : undefined);

	// Fetch all tags for the filter UI
	const allTags = await db.select().from(tags);

	return {
		recipes: filteredRecipes,
		allTags,
		searchQuery,
		selectedTags: tagSlugs
	};
};
