import { redirect } from '@sveltejs/kit';
import { and, count, eq, inArray, not, sql, type SQL } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { recipes } from '#lib/server/db/schema.js';
import { cardList } from '#lib/server/recipeCounts.js';
import { tagSelection, visibleTags } from '#lib/server/tagFilter.js';
import { inLibraryOf, keptCopyOf } from '#lib/server/visibility.js';
import { keptVersionsOf } from '#lib/server/keptCopies.js';
import { inTrashOf, purgeExpiredTrash } from '#lib/server/trash.js';
import { parseFilters, textSearch } from '#lib/server/recipeSearch.js';
import { BAD_FORM, failure, requireUser, signedOut } from '#lib/server/actions.js';
import {
	collectionsOf,
	createCollection,
	deleteCollection,
	recipeIdsIn,
	renameCollection
} from '#lib/server/collections.js';
import {
	collectAll,
	collectionsFor,
	newCollectionWith,
	selectedIds,
	tagAll,
	trashAll
} from '#lib/server/bulk.js';
import { tagsCapError } from '#lib/recipes/validation.js';
import { normaliseTagNames } from '#lib/recipes/tags.js';
import { oneOf, text, wholeNumber } from '#lib/helpers.js';
import { CARD_SORTS, listPage, type CardSort } from '#lib/listPage.js';
import {
	COOKBOOK_FILTERS,
	COOKBOOK_VIEWS,
	VIEW_COOKIE,
	type CookbookFilter,
	type CookbookView
} from './filters.js';
import type { Actions, PageServerLoad } from './$types';
import { privatePage } from '#lib/seo.js';

const META = privatePage('Cookbook');

/** The view is the device's: server-read (no grid-then-list flash), never sent to script. */
const VIEW_COOKIE_OPTIONS = {
	path: '/cookbook',
	httpOnly: true,
	sameSite: 'lax',
	maxAge: 60 * 60 * 24 * 365
} as const;

/**
 * The library's counts by segment, whole and inside `inCollection`: one pass
 * over the library that returns counts, never the rows.
 */
async function shelfCounts(user: { id: string }, inCollection: SQL | undefined) {
	const mine = eq(recipes.authorId, user.id);
	const counting = (condition: SQL | undefined) =>
		sql<number>`count(*) filter (where ${condition ?? sql`true`})`.mapWith(Number);
	const [row] = await db
		.select({
			all: count(),
			mine: counting(mine),
			inAll: counting(inCollection),
			inMine: counting(and(inCollection, mine))
		})
		.from(recipes)
		.where(inLibraryOf(user));
	const split = (all: number, own: number) => ({ all, mine: own, saved: all - own });
	return { library: split(row.all, row.mine), inView: split(row.inAll, row.inMine) };
}

export const load: PageServerLoad = async ({ url, cookies, locals: { user, supabase } }) => {
	requireUser(url, user);
	// The Cookbook is the frequent page every cook opens, so it runs the purge.
	await purgeExpiredTrash(supabase);

	const filter: CookbookFilter = oneOf(COOKBOOK_FILTERS, url.searchParams.get('filter')) ?? 'all';
	const { searchQuery, tagSlugs } = parseFilters(url);
	const sort: CardSort = oneOf(CARD_SORTS, url.searchParams.get('sort')) ?? 'newest';
	// A view in the URL is a choice (the switch's links), so the device keeps it;
	// it wins over the one kept.
	const askedView = oneOf(COOKBOOK_VIEWS, url.searchParams.get('view'));
	if (askedView) cookies.set(VIEW_COOKIE, askedView, VIEW_COOKIE_OPTIONS);
	const view: CookbookView =
		askedView ?? oneOf(COOKBOOK_VIEWS, cookies.get(VIEW_COOKIE) ?? null) ?? 'grid';

	const collectionId = wholeNumber(url.searchParams.get('collection') ?? '');

	const [trash, collections, memberIds] = await Promise.all([
		// For the Trash link, shown only when the Trash holds something.
		db.$count(recipes, inTrashOf(user.id)),
		collectionsOf(user),
		// Null for a collection that is not this cook's: the page reads as none chosen.
		collectionId === null ? null : recipeIdsIn(user, collectionId)
	]);

	// A collection narrows what the segments, search and tags work within.
	const inCollection = memberIds ? inArray(recipes.id, memberIds) : undefined;
	const notKept = not(keptCopyOf(user));
	// Chips come from the whole library, not the filtered subset, or narrowing
	// would remove the chips needed to widen again (as Favorites did). A kept
	// copy lends none: tags follow the recipe's visibility.
	const [{ library, inView }, allTags] = await Promise.all([
		shelfCounts(user, inCollection),
		visibleTags(and(inLibraryOf(user), notKept))
	]);
	const counts = { ...library, trash };
	const collection = memberIds ? (collections.find((c) => c.id === collectionId) ?? null) : null;
	const shelf = {
		collections,
		collection: collection && { id: collection.id, name: collection.name },
		inView
	};

	// With nothing in the library a query or tags filter nothing: the page hears
	// of neither, so it shows the empty cookbook rather than "0 recipes match".
	if (library.all === 0) {
		return {
			recipes: [],
			next: null,
			total: 0,
			counts,
			...shelf,
			filter,
			view,
			sort,
			allTags: [],
			searchQuery: '',
			selectedTags: [],
			meta: META
		};
	}

	const tags = tagSelection(allTags, tagSlugs);
	// Search's matcher and order, so a recipe is found by an ingredient too.
	const text = textSearch(searchQuery);
	const segment = {
		all: undefined,
		mine: eq(recipes.authorId, user.id),
		saved: sql`${recipes.authorId} IS DISTINCT FROM ${user.id}`
	}[filter];
	const where = and(
		inLibraryOf(user),
		inCollection,
		segment,
		// A text search leaves kept copies out: its matcher reads every version
		// and the recipe row, which may hold what the author wrote after withdrawing it.
		// ponytail: a copy is found by no word; match its kept version alone if missed.
		searchQuery ? notKept : undefined,
		tags.where,
		text.where
	);
	const [{ cards, next }, total] = await Promise.all([
		// A search orders by best match; the sort waits in the URL until it is cleared.
		cardList(where, text.rank, user, {
			...listPage(url),
			cooked: true,
			sort: searchQuery ? 'newest' : sort
		}),
		// Unfiltered, the segment's count is the total.
		searchQuery || tags.where ? db.$count(recipes, where) : inView[filter]
	]);

	// A copy's card takes only its identity and lineage from the row, which may
	// hold what the author wrote after withdrawing it, never a spread of it; its
	// words come from the kept version, and it shows no audience or counts of
	// the author's. The saver's own cooked line stays: it is theirs.
	const copies = await keptVersionsOf(
		user,
		cards.map((r) => r.id)
	);
	const isMine = (r: { authorId: string | null }) => r.authorId === user.id;
	return {
		recipes: cards.map((r) => {
			const copy = copies.get(r.id);
			if (!copy) return { ...r, saved: !isMine(r), kept: false };
			return {
				id: r.id,
				slug: r.slug,
				authorId: r.authorId,
				author: r.author,
				parentId: r.parentId,
				title: copy.title,
				description: copy.description,
				imageUrl: copy.imageUrl,
				prepTimeMinutes: copy.prepTimeMinutes,
				cookTimeMinutes: copy.cookTimeMinutes,
				versionCount: 0,
				forkCount: 0,
				...(r.timesCooked === undefined
					? {}
					: { timesCooked: r.timesCooked, lastCookedOn: r.lastCookedOn }),
				saved: true,
				kept: true
			};
		}),
		next,
		total,
		counts,
		...shelf,
		filter,
		view,
		sort,
		allTags,
		searchQuery,
		selectedTags: tags.selectedTags,
		meta: META
	};
};

/** What a collection that has gone (deleted in another tab) is told. */
const NO_SUCH_COLLECTION = 'That collection is no longer in your Cookbook.';

/** A select-mode request's form and its recipe ids (`ids`, "3,5,8"), null when malformed or over BULK_MAX. */
async function selection(request: Request) {
	const form = await request.formData();
	return { form, ids: selectedIds(text(form, 'ids')) };
}

export const actions: Actions = {
	// Opens the new collection, whose empty state says how to fill it.
	createCollection: async ({ request, locals: { user } }) => {
		if (!user) return signedOut();
		const name = text(await request.formData(), 'name');
		const result = await createCollection(user.id, name);
		if ('error' in result) return failure(400, 'invalid', result.error, { name, intent: 'create' });
		throw redirect(303, `/cookbook?collection=${result.id}`);
	},

	renameCollection: async ({ request, locals: { user } }) => {
		if (!user) return signedOut();
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
		if (!user) return signedOut('delete again');
		const id = wholeNumber(text(await request.formData(), 'id'));
		if (id === null) return failure(400, 'invalid', BAD_FORM);
		if (!(await deleteCollection(user.id, id)))
			return failure(404, 'not_found', NO_SUCH_COLLECTION);
		throw redirect(303, '/cookbook');
	},

	// Select mode's bar (src/lib/server/bulk.ts checks every id): each act
	// answers with how many it changed and how many it left alone.

	// The collections for Add to collection, each marked all, some or none.
	bulkCollections: async ({ request, locals: { user } }) => {
		if (!user) return signedOut();
		const { ids } = await selection(request);
		if (!ids) return failure(400, 'invalid', BAD_FORM);
		return { collections: await collectionsFor(user, ids) };
	},

	// Checked (member=1) puts the whole selection in; unchecked takes it all out.
	bulkCollect: async ({ request, locals: { user } }) => {
		if (!user) return signedOut();
		const { form, ids } = await selection(request);
		const collectionId = wholeNumber(text(form, 'collectionId'));
		const member = text(form, 'member');
		if (!ids || collectionId === null || (member !== '1' && member !== '0'))
			return failure(400, 'invalid', BAD_FORM);
		const counts = await collectAll(user, collectionId, ids, member === '1');
		if (!counts) return failure(404, 'not_found', NO_SUCH_COLLECTION);
		return { collected: collectionId, ...counts };
	},

	bulkNewCollection: async ({ request, locals: { user } }) => {
		if (!user) return signedOut();
		const { form, ids } = await selection(request);
		const name = text(form, 'name');
		if (!ids) return failure(400, 'invalid', BAD_FORM);
		const made = await newCollectionWith(user, name, ids);
		if ('error' in made) return failure(400, 'invalid', made.error, { name });
		const { id, ...counts } = made;
		return { collected: id, ...counts };
	},

	// The cook's own recipes only, under the editor's tag caps; the tags as
	// TagInput sends them.
	bulkTag: async ({ request, locals: { user } }) => {
		if (!user) return signedOut();
		const { form, ids } = await selection(request);
		const names = normaliseTagNames(form.getAll('tags').map(String));
		if (!ids || names.length === 0) return failure(400, 'invalid', BAD_FORM);
		const capped = tagsCapError(names);
		if (capped) return failure(400, 'invalid', capped);
		return { tagged: names, ...(await tagAll(user, names, ids)) };
	},

	// The cook's own recipes only, each as Delete recipe moves one.
	bulkTrash: async ({ request, locals: { user } }) => {
		if (!user) return signedOut();
		const { ids } = await selection(request);
		if (!ids) return failure(400, 'invalid', BAD_FORM);
		return await trashAll(user, ids);
	}
};
