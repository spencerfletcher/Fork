import { redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { recipes, favorites, recipesToTags } from '#lib/server/db/schema.js';
import { eq, and, ilike, inArray } from 'drizzle-orm';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import { byTagMatches, tagMatchCounts, visibleTags } from '#lib/server/tagFilter.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	if (!user) {
		throw redirect(303, '/login');
	}

	const searchQuery = url.searchParams.get('q') || '';
	const tagSlugs = url.searchParams.get('tags')?.split(',').filter(Boolean) || [];

	const favoriteMappings = await db
		.select({
			recipeId: favorites.recipeId,
			isPublic: recipes.isPublic,
			authorId: recipes.authorId
		})
		.from(favorites)
		.innerJoin(recipes, eq(recipes.id, favorites.recipeId))
		.where(eq(favorites.userId, user.id));

	// A favourited recipe can be made private by its owner later. Drop it here,
	// before the filter chips and the recipe query, so neither reveals it.
	const favoriteIds = favoriteMappings
		.filter((f) => f.isPublic || f.authorId === user.id)
		.map((f) => f.recipeId);

	if (favoriteIds.length === 0) {
		return { favoriteRecipes: [], allTags: [], searchQuery, selectedTags: tagSlugs };
	}

	// Chips come from every favourite, not the filtered subset, or narrowing by
	// one tag would remove the chips needed to widen the filter again.
	const allTags = await visibleTags(inArray(recipesToTags.recipeId, favoriteIds));

	const selectedTagIds = allTags.filter((t) => tagSlugs.includes(t.slug)).map((t) => t.id);
	let matchCounts = new Map<number, number>();
	let candidateIds = favoriteIds;
	if (selectedTagIds.length > 0) {
		matchCounts = await tagMatchCounts(selectedTagIds, favoriteIds);
		candidateIds = [...matchCounts.keys()];
		if (candidateIds.length === 0) {
			return { favoriteRecipes: [], allTags, searchQuery, selectedTags: tagSlugs };
		}
	}

	const conditions = [inArray(recipes.id, candidateIds)];
	if (searchQuery) {
		conditions.push(ilike(recipes.title, `%${searchQuery}%`));
	}

	const rows = await db.query.recipes.findMany({
		where: and(...conditions),
		with: {
			recipesToTags: { with: { tag: true } },
			author: true
		}
	});

	if (matchCounts.size > 0) rows.sort(byTagMatches(matchCounts));

	const withCounts = await attachRecipeCounts(rows);

	return { favoriteRecipes: withCounts, allTags, searchQuery, selectedTags: tagSlugs };
};
