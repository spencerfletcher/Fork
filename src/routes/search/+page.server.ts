import { recipes } from '#lib/server/db/schema.js';
import { and, inArray } from 'drizzle-orm';
import { cardList } from '#lib/server/recipeCounts.js';
import { tagSelection, visibleTags } from '#lib/server/tagFilter.js';
import { clampDescription } from '#lib/seo.js';
import { plural } from '#lib/helpers.js';
import { visibleTo } from '#lib/server/visibility.js';
import { parseFilters, textSearch } from '#lib/server/recipeSearch.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	const { searchQuery, tagSlugs } = parseFilters(url);

	const searchMeta = (count: number) => ({
		title: searchQuery ? `“${searchQuery}” — Search` : 'Search',
		description: clampDescription(
			searchQuery
				? `${plural(count, 'recipe')} matching “${searchQuery}” on Fork.`
				: 'Search recipes by name, description or ingredient.'
		)
	});

	const visibilityCondition = visibleTo(user);

	const allTags = await visibleTags(visibilityCondition);

	// Tag filter: AND over the selected tags; the page hears only of the known ones.
	const { selectedTags, matches } = await tagSelection(allTags, tagSlugs);
	if (matches?.size === 0) {
		return { recipes: [], allTags, searchQuery, selectedTags, meta: searchMeta(0) };
	}

	const text = textSearch(searchQuery);
	// Rank by how many selected tags matched, unless searching: FTS rank wins then.
	const withCounts = await cardList(
		and(
			visibilityCondition,
			matches ? inArray(recipes.id, [...matches.keys()]) : undefined,
			text.where
		),
		text.orderBy,
		user,
		{ tagRank: searchQuery ? null : matches }
	);

	return {
		recipes: withCounts,
		allTags,
		searchQuery,
		selectedTags,
		meta: searchMeta(withCounts.length)
	};
};
