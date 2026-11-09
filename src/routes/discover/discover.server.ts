import { and, count, desc, eq, gt, gte, inArray } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { db } from '#lib/server/db/index.js';
import { favorites, profiles, recipes, recipeVersions } from '#lib/server/db/schema.js';
import { attachRecipeCounts, CARD_WITH } from '#lib/server/recipeCounts.js';
import { tagMatchCounts, visibleTags, byTagMatches } from '#lib/server/tagFilter.js';
import { friendIdsOf, visibleTo } from '#lib/server/visibility.js';
import { parseFilters, textSearch } from '#lib/server/recipeSearch.js';

/** The lead card is the most-saved recipe over this many days, else the newest. */
export const LEAD_WINDOW_DAYS = 7;
/** How many small cards the Recent changes row holds. */
export const RECENT_CHANGES = 3;

const HANDLE = /^@([\w-]+)$/;

/**
 * Discover, for `/discover` and the signed-out `/`: every recipe the viewer may
 * see (visibleTo), newest first. Unfiltered, a lead card and a Recent changes
 * row come first, drawn from the same set. Filters as Search: `q` (an `@handle`
 * word in it narrows to that cook), `tags`, and `friends=1` when signed in.
 */
export async function loadDiscover(url: URL, user: { id: string } | null) {
	const { searchQuery, tagSlugs } = parseFilters(url);
	const words = searchQuery.split(/\s+/).filter(Boolean);
	const handle = words.map((w) => HANDLE.exec(w)?.[1]).find(Boolean)?.toLowerCase();
	const text = textSearch(words.filter((w) => !HANDLE.test(w)).join(' '));
	const friendsOnly = user ? url.searchParams.get('friends') === '1' : undefined;

	const visible = visibleTo(user);
	const allTags = await visibleTags(visible);
	const selected = allTags.filter((t) => tagSlugs.includes(t.slug));
	const selectedTags = tagSlugs.filter((slug) => selected.some((t) => t.slug === slug));
	const filtered = !!searchQuery || selected.length > 0 || !!friendsOnly;

	const base = { allTags, searchQuery, selectedTags, friendsOnly };
	const empty = { ...base, lead: null, recentChanges: [], recipes: [] };

	let matchCounts = new Map<number, number>();
	if (selected.length > 0) {
		matchCounts = await tagMatchCounts(selected.map((t) => t.id));
		if (matchCounts.size === 0) return empty;
	}
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

	const [rows, leadRows, recent] = await Promise.all([
		db.query.recipes.findMany({
			where: and(
				visible,
				byHandle,
				friendsOnly ? inArray(recipes.authorId, friendIds) : undefined,
				matchCounts.size > 0 ? inArray(recipes.id, [...matchCounts.keys()]) : undefined,
				text.where
			),
			with: CARD_WITH,
			orderBy: text.orderBy
		}),
		filtered ? [] : mostSaved(user),
		filtered ? [] : recentChanges(user)
	]);
	if (!searchQuery && matchCounts.size > 0) rows.sort(byTagMatches(matchCounts));

	const counted = await attachRecipeCounts(rows, user);
	const lead = filtered
		? null
		: (counted.find((r) => r.id === leadRows[0]?.recipeId) ?? counted[0] ?? null);
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

/** The visible recipe saved most often in the lead window, if any was saved. */
function mostSaved(user: { id: string } | null) {
	const since = new Date(Date.now() - LEAD_WINDOW_DAYS * 86_400_000);
	return db
		.select({ recipeId: favorites.recipeId, saves: count() })
		.from(favorites)
		.innerJoin(recipes, eq(recipes.id, favorites.recipeId))
		.where(and(visibleTo(user), gte(favorites.createdAt, since)))
		.groupBy(favorites.recipeId)
		.orderBy(desc(count()), desc(favorites.recipeId))
		.limit(1);
}

/** The newest edits (v2 on) to visible recipes, each to diff against its predecessor. */
function recentChanges(user: { id: string } | null) {
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
		.where(and(visibleTo(user), gt(recipeVersions.versionNumber, 1)))
		.orderBy(desc(recipeVersions.createdAt))
		.limit(RECENT_CHANGES);
}
