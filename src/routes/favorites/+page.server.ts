import { redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { recipes, favorites, recipesToTags } from '#lib/server/db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { attachRecipeCounts, CARD_WITH } from '#lib/server/recipeCounts.js';
import { byTagMatches, tagMatchCounts, visibleTags } from '#lib/server/tagFilter.js';
import { canView, friendIdsOf } from '#lib/server/visibility.js';
import { parseFilters, textSearch } from '#lib/server/recipeSearch.js';
import { loginHref } from '#lib/auth/loginHref.js';
import type { PageServerLoad } from './$types';

const META = { title: 'Favorites' };

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	if (!user) {
		throw redirect(303, loginHref(url.pathname + url.search));
	}

	const { searchQuery, tagSlugs } = parseFilters(url);

	const favoriteMappings = await db
		.select({
			recipeId: favorites.recipeId,
			visibility: recipes.visibility,
			authorId: recipes.authorId
		})
		.from(favorites)
		.innerJoin(recipes, eq(recipes.id, favorites.recipeId))
		.where(eq(favorites.userId, user.id));

	// A favourited recipe can be made private by its owner later, or its author
	// unfriended. Drop it here, before the filter chips and the recipe query, so
	// neither reveals it. Friends are looked up only when a friends recipe is saved.
	const needsFriends = favoriteMappings.some(
		(f) => f.visibility === 'friends' && f.authorId !== user.id
	);
	const friendIds = needsFriends ? await friendIdsOf(user.id) : [];
	const favoriteIds = favoriteMappings
		.filter((f) => canView(f, user, friendIds))
		.map((f) => f.recipeId);

	// With nothing favorited a query or tags filter nothing: the page hears of
	// neither, so it says "No favorites yet" rather than "No favorites match".
	if (favoriteIds.length === 0) {
		return { recipes: [], allTags: [], searchQuery: '', selectedTags: [], meta: META };
	}

	// Chips come from every favourite, not the filtered subset, or narrowing by
	// one tag would remove the chips needed to widen the filter again.
	const allTags = await visibleTags(inArray(recipesToTags.recipeId, favoriteIds));

	// A slug no chip carries filters nothing, and the page hears only of the known ones.
	const selected = allTags.filter((t) => tagSlugs.includes(t.slug));
	const selectedTags = tagSlugs.filter((slug) => selected.some((t) => t.slug === slug));
	const selectedTagIds = selected.map((t) => t.id);
	let matchCounts = new Map<number, number>();
	let candidateIds = favoriteIds;
	if (selectedTagIds.length > 0) {
		matchCounts = await tagMatchCounts(selectedTagIds, favoriteIds);
		candidateIds = [...matchCounts.keys()];
		if (candidateIds.length === 0) {
			return { recipes: [], allTags, searchQuery, selectedTags, meta: META };
		}
	}

	// Search's matcher and order, so a favourite is found by an ingredient too.
	const text = textSearch(searchQuery);
	const rows = await db.query.recipes.findMany({
		where: and(inArray(recipes.id, candidateIds), text.where),
		with: CARD_WITH,
		orderBy: text.orderBy
	});

	// Rank by how many selected tags matched, unless searching, as Search does.
	if (!searchQuery && matchCounts.size > 0) rows.sort(byTagMatches(matchCounts));

	const withCounts = await attachRecipeCounts(rows);

	return { recipes: withCounts, allTags, searchQuery, selectedTags, meta: META };
};
