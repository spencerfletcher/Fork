import { redirect } from '@sveltejs/kit';
import { and, inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { recipes, recipesToTags } from '#lib/server/db/schema.js';
import { cardList } from '#lib/server/recipeCounts.js';
import { tagSelection, visibleTags } from '#lib/server/tagFilter.js';
import { inLibraryOf } from '#lib/server/visibility.js';
import { inTrashOf, purgeExpiredTrash } from '#lib/server/trash.js';
import { parseFilters, textSearch } from '#lib/server/recipeSearch.js';
import { failure, requireUser, SESSION_ENDED } from '#lib/server/actions.js';
import {
	collectionsOf,
	createCollection,
	deleteCollection,
	recipeIdsIn,
	renameCollection
} from '#lib/server/collections.js';
import { oneOf, text, wholeNumber } from '#lib/helpers.js';
import { COOKBOOK_FILTERS, type CookbookFilter } from './filters.js';
import type { Actions, PageServerLoad } from './$types';

const META = { title: 'Cookbook' };

export const load: PageServerLoad = async ({ url, locals: { user, supabase } }) => {
	requireUser(url, user);
	// The Cookbook is the frequent page every cook opens, so it runs the purge.
	await purgeExpiredTrash(supabase);

	const filter: CookbookFilter = oneOf(COOKBOOK_FILTERS, url.searchParams.get('filter')) ?? 'all';
	const { searchQuery, tagSlugs } = parseFilters(url);

	const collectionId = wholeNumber(url.searchParams.get('collection') ?? '');

	const [library, trash, collections, memberIds] = await Promise.all([
		db
			.select({ id: recipes.id, authorId: recipes.authorId })
			.from(recipes)
			.where(inLibraryOf(user)),
		// For the Trash link, shown only when the Trash holds something.
		db.$count(recipes, inTrashOf(user.id)),
		collectionsOf(user),
		// Null for a collection that is not this cook's: the page reads as none chosen.
		collectionId === null ? null : recipeIdsIn(user, collectionId)
	]);

	const isMine = (r: { authorId: string | null }) => r.authorId === user.id;
	const countOf = (rows: { authorId: string | null }[]) => {
		const mine = rows.filter(isMine).length;
		return { all: rows.length, mine, saved: rows.length - mine };
	};
	const counts = { ...countOf(library), trash };

	// A collection narrows what the segments, search and tags work within.
	const members = memberIds && new Set(memberIds);
	const inCollection = members ? library.filter((r) => members.has(r.id)) : library;
	const inView = countOf(inCollection);
	const collection = members ? (collections.find((c) => c.id === collectionId) ?? null) : null;
	const shelf = {
		collections,
		collection: collection && { id: collection.id, name: collection.name },
		inView
	};

	// With nothing in the library a query or tags filter nothing: the page hears
	// of neither, so it shows the empty cookbook rather than "0 recipes match".
	if (library.length === 0) {
		return {
			recipes: [],
			counts,
			...shelf,
			filter,
			allTags: [],
			searchQuery: '',
			selectedTags: [],
			meta: META
		};
	}

	const inFilter = inCollection.filter((r) =>
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
		return {
			recipes: [],
			counts,
			...shelf,
			filter,
			allTags,
			searchQuery,
			selectedTags,
			meta: META
		};

	// Search's matcher and order, so a recipe is found by an ingredient too.
	const text = textSearch(searchQuery);
	const withCounts = await cardList(
		and(inArray(recipes.id, candidateIds), text.where),
		text.orderBy,
		user,
		{ tagRank: searchQuery ? null : matches, cooked: true }
	);

	return {
		recipes: withCounts.map((r) => ({ ...r, saved: !isMine(r) })),
		counts,
		...shelf,
		filter,
		allTags,
		searchQuery,
		selectedTags,
		meta: META
	};
};

/** What a collection that has gone (deleted in another tab) is told. */
const NO_SUCH_COLLECTION = 'That collection is no longer in your Cookbook.';
const BAD_FORM = 'Invalid form state, reload the page';

export const actions: Actions = {
	// Opens the new collection, whose empty state says how to fill it.
	createCollection: async ({ request, locals: { user } }) => {
		if (!user) return failure(401, 'unauthenticated', SESSION_ENDED('try again'));
		const name = text(await request.formData(), 'name');
		const result = await createCollection(user.id, name);
		if ('error' in result) return failure(400, 'invalid', result.error, { name, intent: 'create' });
		throw redirect(303, `/cookbook?collection=${result.id}`);
	},

	renameCollection: async ({ request, locals: { user } }) => {
		if (!user) return failure(401, 'unauthenticated', SESSION_ENDED('try again'));
		const form = await request.formData();
		const id = wholeNumber(text(form, 'id'));
		const name = text(form, 'name');
		if (id === null) return failure(400, 'invalid', BAD_FORM);
		const result = await renameCollection(user.id, id, name);
		if ('error' in result) return failure(400, 'invalid', result.error, { name, intent: 'rename' });
		if (!result.renamed) return failure(404, 'not_found', NO_SUCH_COLLECTION);
		return { renamed: id };
	},

	// The recipes stay where they are; only the collection and its links go.
	deleteCollection: async ({ request, locals: { user } }) => {
		if (!user) return failure(401, 'unauthenticated', SESSION_ENDED('delete again'));
		const id = wholeNumber(text(await request.formData(), 'id'));
		if (id === null) return failure(400, 'invalid', BAD_FORM);
		if (!(await deleteCollection(user.id, id)))
			return failure(404, 'not_found', NO_SUCH_COLLECTION);
		throw redirect(303, '/cookbook');
	}
};
