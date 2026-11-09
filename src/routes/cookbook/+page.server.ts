import { redirect } from '@sveltejs/kit';
import { and, inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { recipes, recipesToTags } from '#lib/server/db/schema.js';
import { attachRecipeCounts, CARD_WITH } from '#lib/server/recipeCounts.js';
import { byTagMatches, tagMatchCounts, visibleTags } from '#lib/server/tagFilter.js';
import { inLibraryOf } from '#lib/server/visibility.js';
import { parseFilters, textSearch } from '#lib/server/recipeSearch.js';
import { loginHref } from '#lib/auth/loginHref.js';
import { COOKBOOK_FILTERS, type CookbookFilter } from './filters.js';
import type { PageServerLoad } from './$types';

const META = { title: 'Cookbook' };

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	if (!user) {
		throw redirect(303, loginHref(url.pathname + url.search));
	}

	const filter: CookbookFilter =
		COOKBOOK_FILTERS.find((f) => f === url.searchParams.get('filter')) ?? 'all';
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
	const selected = allTags.filter((t) => tagSlugs.includes(t.slug));
	const selectedTags = tagSlugs.filter((slug) => selected.some((t) => t.slug === slug));
	const empty = { recipes: [], counts, filter, allTags, searchQuery, selectedTags, meta: META };

	let candidateIds = inFilter.map((r) => r.id);
	let matchCounts = new Map<number, number>();
	if (selected.length > 0 && candidateIds.length > 0) {
		matchCounts = await tagMatchCounts(
			selected.map((t) => t.id),
			candidateIds
		);
		candidateIds = [...matchCounts.keys()];
	}
	if (candidateIds.length === 0) return empty;

	// Search's matcher and order, so a recipe is found by an ingredient too.
	const text = textSearch(searchQuery);
	const rows = await db.query.recipes.findMany({
		where: and(inArray(recipes.id, candidateIds), text.where),
		with: CARD_WITH,
		orderBy: text.orderBy
	});
	if (!searchQuery && matchCounts.size > 0) rows.sort(byTagMatches(matchCounts));

	const withCounts = await attachRecipeCounts(rows, user);

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
