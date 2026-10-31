import { db } from '#lib/server/db/index.js';
import { recipes } from '#lib/server/db/schema.js';
import { and, inArray } from 'drizzle-orm';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import { byTagMatches, tagMatchCounts, visibleTags } from '#lib/server/tagFilter.js';
import { clampDescription } from '#lib/seo.js';
import { visibleTo } from '#lib/server/visibility.js';
import { parseFilters, textSearch } from '#lib/server/recipeSearch.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	const { searchQuery, tagSlugs } = parseFilters(url);

	const searchMeta = (count: number) => ({
		title: searchQuery ? `“${searchQuery}” — Search` : 'Search',
		description: clampDescription(
			searchQuery
				? `${count} recipe${count === 1 ? '' : 's'} matching “${searchQuery}” on Fork.`
				: 'Search recipes by name, description or ingredient.'
		)
	});

	const visibilityCondition = visibleTo(user);

	const allTags = await visibleTags(visibilityCondition);

	// Tag filter: OR over the selected tags, ranked by how many matched below.
	let matchCounts = new Map<number, number>();
	if (tagSlugs.length > 0) {
		const tagIds = allTags.filter((t) => tagSlugs.includes(t.slug)).map((t) => t.id);
		if (tagIds.length > 0) matchCounts = await tagMatchCounts(tagIds);
		if (matchCounts.size === 0) {
			return { recipes: [], allTags, searchQuery, selectedTags: tagSlugs, meta: searchMeta(0) };
		}
	}

	const text = textSearch(searchQuery);

	const rows = await db.query.recipes.findMany({
		where: and(
			visibilityCondition,
			matchCounts.size > 0 ? inArray(recipes.id, [...matchCounts.keys()]) : undefined,
			text.where
		),
		with: { recipesToTags: { with: { tag: true } }, author: true },
		orderBy: text.orderBy
	});

	// Rank by how many selected tags matched, unless searching: FTS rank wins then.
	if (!searchQuery && matchCounts.size > 0) rows.sort(byTagMatches(matchCounts));

	const withCounts = await attachRecipeCounts(rows);

	return {
		recipes: withCounts,
		allTags,
		searchQuery,
		selectedTags: tagSlugs,
		meta: searchMeta(withCounts.length)
	};
};
