import { and, count, desc, eq, gt, gte, inArray, ne, notExists, type SQL } from 'drizzle-orm';
import { alias, QueryBuilder } from 'drizzle-orm/pg-core';
import { db } from '#lib/server/db/index.js';
import { favorites, profiles, recipes, recipeVersions } from '#lib/server/db/schema.js';
import { cardList } from '#lib/server/recipeCounts.js';
import { tagSelection, visibleTags } from '#lib/server/tagFilter.js';
import { authorIsFriendOf, visibleTo } from '#lib/server/visibility.js';
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
 * first, drawn from the same set, filtered or not; the grid is the set less
 * the lead, so no recipe shows twice, and `total` counts the whole set.
 * Filters as Search, all ANDed: `q` (an `@handle` word in it narrows to that cook), `tags`, and
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
	// Show more's fetch (`after`) wants the next cards alone: no lead card, no
	// Recent changes; but it still leaves the lead out, so no page repeats it.
	// ponytail: the lead is found again on each fetch, so a save landing between
	// two fetches can move it and show one recipe twice or not at all; carry the
	// lead's id in the cursor if that ever matters.
	const { after, limit } = listPage(url);
	const leadId = await leadOf(inSet);
	const grid = leadId === undefined ? inSet : and(inSet, ne(recipes.id, leadId));
	const [{ cards, next }, total, leadCard, recent] = await Promise.all([
		cardList(grid, text.rank, user, { after, limit }),
		db.$count(recipes, inSet),
		after || leadId === undefined
			? null
			: cardList(and(inSet, eq(recipes.id, leadId)), [], user, { after: null, limit: 1 }),
		after ? [] : recentChanges(inSet)
	]);
	return {
		allTags,
		searchQuery,
		selectedTags: tags.selectedTags,
		friendsOnly,
		lead: leadCard?.cards[0] ?? null,
		recentChanges: recent.map((v) => ({
			...v,
			href: `/recipes/${v.slug}/diff?from=${v.versionNumber - 1}&to=${v.versionNumber}`
		})),
		// The set less the lead; `total` is the whole set, lead included.
		recipes: cards,
		next,
		total
	};
}

/** The lead's id: the most-saved recipe in `inSet` this week, else its newest change. */
async function leadOf(inSet: SQL | undefined): Promise<number | undefined> {
	const [saved] = await mostSaved(inSet);
	if (saved) return saved.recipeId;
	// cardList's unranked order: newest change, then id.
	const [newest] = await db
		.select({ id: recipes.id })
		.from(recipes)
		.where(inSet)
		.orderBy(desc(recipes.updatedAt), desc(recipes.id))
		.limit(1);
	return newest?.id;
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

/**
 * The newest edits (v2 on) to recipes in `inSet`, one per recipe (its latest
 * version), each to diff against its predecessor.
 */
function recentChanges(inSet: SQL | undefined) {
	const newer = alias(recipeVersions, 'newer');
	const isLatest = notExists(
		new QueryBuilder()
			.select({ id: newer.id })
			.from(newer)
			.where(
				and(
					eq(newer.recipeId, recipeVersions.recipeId),
					gt(newer.versionNumber, recipeVersions.versionNumber)
				)
			)
	);
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
		.where(and(inSet, gt(recipeVersions.versionNumber, 1), isLatest))
		.orderBy(desc(recipeVersions.createdAt))
		.limit(RECENT_CHANGES);
}
