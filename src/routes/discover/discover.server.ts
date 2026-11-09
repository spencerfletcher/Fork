import { and, count, desc, eq, gt, gte, inArray, type SQL } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { db } from '#lib/server/db/index.js';
import { favorites, profiles, recipes, recipeVersions } from '#lib/server/db/schema.js';
import { cardList } from '#lib/server/recipeCounts.js';
import { tagSelection, visibleTags } from '#lib/server/tagFilter.js';
import { friendIdsOf, visibleTo } from '#lib/server/visibility.js';
import { parseFilters, textSearch } from '#lib/server/recipeSearch.js';

/** The lead card is the most-saved recipe in the set over this many days, else the set's newest. */
export const LEAD_WINDOW_DAYS = 7;
/** The most recipes one Discover page lists, lead included. */
export const DISCOVER_LIMIT = 60;
/** How many small cards the Recent changes row holds. */
export const RECENT_CHANGES = 3;

const HANDLE = /^@([\w-]+)$/;

/**
 * Discover, for `/discover` and the signed-out `/`: every recipe the viewer may
 * see (visibleTo), newest first. A lead card and a Recent changes row come
 * first, drawn from the same set, filtered or not. Filters as Search, all
 * ANDed: `q` (an `@handle` word in it narrows to that cook), `tags`, and
 * `friends=1` when signed in.
 */
export async function loadDiscover(url: URL, user: { id: string } | null) {
	const { searchQuery, tagSlugs } = parseFilters(url);
	const words = searchQuery.split(/\s+/).filter(Boolean);
	const handle = words
		.map((w) => HANDLE.exec(w)?.[1])
		.find(Boolean)
		?.toLowerCase();
	const text = textSearch(words.filter((w) => !HANDLE.test(w)).join(' '));
	const friendsOnly = user ? url.searchParams.get('friends') === '1' : undefined;

	const visible = visibleTo(user);
	const allTags = await visibleTags(visible);
	const { selectedTags, matches } = await tagSelection(allTags, tagSlugs);

	const base = { allTags, searchQuery, selectedTags, friendsOnly };
	const empty = { ...base, lead: null, recentChanges: [], recipes: [] };

	if (matches?.size === 0) return empty;
	const friendIds = friendsOnly && user ? await friendIdsOf(user.id) : [];
	if (friendsOnly && friendIds.length === 0) return empty;

	const byHandle = handle
		? inArray(
				recipes.authorId,
				new QueryBuilder()
					.select({ id: profiles.id })
					.from(profiles)
					.where(eq(profiles.username, handle))
			)
		: undefined;

	const inSet = and(
		visible,
		byHandle,
		friendsOnly ? inArray(recipes.authorId, friendIds) : undefined,
		matches ? inArray(recipes.id, [...matches.keys()]) : undefined,
		text.where
	);
	const [counted, leadRows, recent] = await Promise.all([
		cardList(inSet, text.orderBy, user, {
			tagRank: searchQuery ? null : matches,
			// ponytail: no pagination yet, P1 adds it
			limit: DISCOVER_LIMIT
		}),
		mostSaved(inSet),
		recentChanges(inSet)
	]);
	// A text query orders by relevance, so the newest is not always first.
	const newest = counted.reduce<(typeof counted)[number] | null>(
		(a, r) => (!a || r.updatedAt > a.updatedAt ? r : a),
		null
	);
	const lead = counted.find((r) => r.id === leadRows[0]?.recipeId) ?? newest;
	return {
		...base,
		lead,
		recentChanges: recent.map((v) => ({
			...v,
			href: `/recipes/${v.slug}/diff?from=${v.versionNumber - 1}&to=${v.versionNumber}`
		})),
		recipes: counted.filter((r) => r !== lead)
	};
}

/** The recipe in `inSet` saved most often in the lead window, if any was saved. */
function mostSaved(inSet: SQL | undefined) {
	const since = new Date(Date.now() - LEAD_WINDOW_DAYS * 86_400_000);
	return db
		.select({ recipeId: favorites.recipeId, saves: count() })
		.from(favorites)
		.innerJoin(recipes, eq(recipes.id, favorites.recipeId))
		.where(and(inSet, gte(favorites.createdAt, since)))
		.groupBy(favorites.recipeId)
		.orderBy(desc(count()), desc(favorites.recipeId))
		.limit(1);
}

/** The newest edits (v2 on) to recipes in `inSet`, each to diff against its predecessor. */
function recentChanges(inSet: SQL | undefined) {
	return db
		.select({
			versionNumber: recipeVersions.versionNumber,
			commitMessage: recipeVersions.commitMessage,
			slug: recipes.slug,
			title: recipes.title,
			username: profiles.username
		})
		.from(recipeVersions)
		.innerJoin(recipes, eq(recipes.id, recipeVersions.recipeId))
		.leftJoin(profiles, eq(profiles.id, recipes.authorId))
		.where(and(inSet, gt(recipeVersions.versionNumber, 1)))
		.orderBy(desc(recipeVersions.createdAt))
		.limit(RECENT_CHANGES);
}
