import { and, inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { recipes, recipesToTags } from '#lib/server/db/schema.js';
import { cardList } from '#lib/server/recipeCounts.js';
import { tagSelection, visibleTags } from '#lib/server/tagFilter.js';
import { inLibraryOf } from '#lib/server/visibility.js';
import { parseFilters, textSearch } from '#lib/server/recipeSearch.js';
import { requireUser } from '#lib/server/actions.js';
import { oneOf } from '#lib/helpers.js';
import { COOKBOOK_FILTERS, type CookbookFilter } from './filters.js';
import type { PageServerLoad } from './$types';

const META = { title: 'Cookbook' };

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	requireUser(url, user);

	const filter: CookbookFilter = oneOf(COOKBOOK_FILTERS, url.searchParams.get('filter')) ?? 'all';
	const { searchQuery, tagSlugs } = parseFilters(url);

	const library = await db
		.select({ id: recipes.id, authorId: recipes.authorId })
		.from(recipes)
		.where(inLibraryOf(user));

	const isMine = (r: { authorId: string | null }) => r.authorId === user.id;
	const mine = library.filter(isMine).length;
	const counts = { all: library.length, mine, saved: library.length - mine };

	// With nothing in the library a query or tags filter nothing: the page hears
	// of neither, so it shows the empty cookbook rather than "0 recipes match".
	if (library.length === 0) {
		return {
			recipes: [],
			counts,
			filter,
			allTags: [],
			searchQuery: '',
			selectedTags: [],
			meta: META
		};
	}

	const inFilter = library.filter((r) =>
		filter === 'all' ? true : filter === 'mine' ? isMine(r) : !isMine(r)
	);

	// Chips come from the whole library, not the filtered subset, or narrowing
	// would remove the chips needed to widen again (as Favorites did).
	const allTags = await visibleTags(
		inArray(
			recipesToTags.recipeId,
			library.map((r) => r.id)
		)
	);
	const inFilterIds = inFilter.map((r) => r.id);
	const { selectedTags, matches } = await tagSelection(allTags, tagSlugs, inFilterIds);
	const candidateIds = matches ? [...matches.keys()] : inFilterIds;
	if (candidateIds.length === 0)
		return { recipes: [], counts, filter, allTags, searchQuery, selectedTags, meta: META };

	// Search's matcher and order, so a recipe is found by an ingredient too.
	const text = textSearch(searchQuery);
	const withCounts = await cardList(
		and(inArray(recipes.id, candidateIds), text.where),
		text.orderBy,
		user,
		{ tagRank: searchQuery ? null : matches }
	);

	return {
		recipes: withCounts.map((r) => ({ ...r, saved: !isMine(r) })),
		counts,
		filter,
		allTags,
		searchQuery,
		selectedTags,
		meta: META
	};
};
