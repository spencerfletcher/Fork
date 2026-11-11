import { and, count, desc, eq, gt, gte, inArray, type SQL } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { db } from '#lib/server/db/index.js';
import { favorites, profiles, recipes, recipeVersions } from '#lib/server/db/schema.js';
import { cardList } from '#lib/server/recipeCounts.js';
import { tagSelection, visibleTags } from '#lib/server/tagFilter.js';
import { authorIsFriendOf, visibleTo, type Viewer } from '#lib/server/visibility.js';
import { parseFilters, textSearch } from '#lib/server/recipeSearch.js';
import { namedBy } from '#lib/server/profiles.js';
import { listPage } from '#lib/listPage.js';

/** The lead card is the most-saved recipe in the set over this many days, else the set's newest. */
export const LEAD_WINDOW_DAYS = 7;
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
	const tags = tagSelection(allTags, tagSlugs);

	const byHandle = handle
		? inArray(
				recipes.authorId,
				new QueryBuilder().select({ id: profiles.id }).from(profiles).where(namedBy(handle))
			)
		: undefined;

	const inSet = and(
		visible,
		byHandle,
		friendsOnly && user ? authorIsFriendOf(user.id) : undefined,
		tags.where,
		text.where
	);
	// Show more's fetch (`after`) wants the next cards alone: no lead, no Recent changes.
	const { after, limit } = listPage(url);
	const [{ cards, next }, total, leadRows, recent] = await Promise.all([
		cardList(inSet, text.rank, user, { after, limit }),
		db.$count(recipes, inSet),
		after ? [] : mostSaved(inSet),
		after ? [] : recentChanges(inSet)
	]);
	const leadId = leadRows[0]?.recipeId;
	// Unranked, the first card is the newest; a text query orders by relevance.
	const lead = after
		? null
		: (cards.find((r) => r.id === leadId) ??
			(leadId === undefined && text.rank.length === 0
				? (cards[0] ?? null)
				: await newestOrLead(inSet, leadId, user)));
	return {
		allTags,
		searchQuery,
		selectedTags: tags.selectedTags,
		friendsOnly,
		lead,
		recentChanges: recent.map((v) => ({
			...v,
			href: `/recipes/${v.slug}/diff?from=${v.versionNumber - 1}&to=${v.versionNumber}`
		})),
		// The lead stays in the grid, so Newest first and its count are the whole set.
		recipes: cards,
		next,
		total
	};
}

/** The lead when it is not among the first cards: `leadId`'s card, else the set's newest. */
async function newestOrLead(inSet: SQL | undefined, leadId: number | undefined, user: Viewer) {
	const { cards } = await cardList(
		and(inSet, leadId === undefined ? undefined : eq(recipes.id, leadId)),
		[],
		user,
		{ after: null, limit: 1 }
	);
	return cards[0] ?? null;
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
