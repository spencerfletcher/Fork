import { redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { recipes, favorites, recipesToTags } from '#lib/server/db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import { byTagMatches, tagMatchCounts, visibleTags } from '#lib/server/tagFilter.js';
import { canView } from '#lib/server/visibility.js';
import { parseFilters, textSearch } from '#lib/server/recipeSearch.js';
import { loginHref } from '#lib/auth/loginHref.js';
import type { PageServerLoad } from './$types';

const META = { title: 'Favorites' };

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	if (!user) {
		throw redirect(303, loginHref(url.pathname));
	}

	const { searchQuery, tagSlugs } = parseFilters(url);

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
	const favoriteIds = favoriteMappings.filter((f) => canView(f, user)).map((f) => f.recipeId);

	// With nothing favorited a query or tags filter nothing: the page hears of
	// neither, so it says "No favorites yet" rather than "No favorites match".
	if (favoriteIds.length === 0) {
		return { favoriteRecipes: [], allTags: [], searchQuery: '', selectedTags: [], meta: META };
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
			return { favoriteRecipes: [], allTags, searchQuery, selectedTags: tagSlugs, meta: META };
		}
	}

	// Search's matcher and order, so a favourite is found by an ingredient too.
	const text = textSearch(searchQuery);
	const rows = await db.query.recipes.findMany({
		where: and(inArray(recipes.id, candidateIds), text.where),
		with: {
			recipesToTags: { with: { tag: true } },
			author: true
		},
		orderBy: text.orderBy
	});

	// Rank by how many selected tags matched, unless searching, as Search does.
	if (!searchQuery && matchCounts.size > 0) rows.sort(byTagMatches(matchCounts));

	const withCounts = await attachRecipeCounts(rows);

	return { favoriteRecipes: withCounts, allTags, searchQuery, selectedTags: tagSlugs, meta: META };
};
