import { db } from '#lib/server/db/index.js';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { and, count, inArray, type SQL } from 'drizzle-orm';
import { byTagMatches } from './tagFilter.js';
import { visibleTo, type Viewer } from './visibility.js';
import { cookedCounts, type Cooked } from './journal.js';

/** The relations a recipe card renders: its author's id and handle, nothing more. */
export const CARD_WITH = { author: { columns: { id: true, username: true } } } as const;

/**
 * Attach version and fork counts to a list of recipes.
 *
 * Two grouped aggregates for the whole list — never one query per recipe. The
 * fork aggregate counts only forks `viewer` may see (visibleTo), so a fork they
 * cannot open never inflates a count; signed out that is public forks only.
 */
export async function attachRecipeCounts<T extends { id: number }>(
	recipeList: T[],
	viewer: Viewer = null
): Promise<(T & { versionCount: number; forkCount: number })[]> {
	const ids = recipeList.map((r) => r.id);

	if (ids.length === 0) {
		return [];
	}

	// recipe_versions is append-only — a row per edit, forever — so this
	// aggregate must never full-scan it. Scoped to the recipes actually passed in.
	const versionCounts = await db
		.select({ recipeId: recipeVersions.recipeId, count: count() })
		.from(recipeVersions)
		.where(inArray(recipeVersions.recipeId, ids))
		.groupBy(recipeVersions.recipeId);

	const forkCounts = await db
		.select({ parentId: recipes.parentId, count: count() })
		.from(recipes)
		.where(and(inArray(recipes.parentId, ids), visibleTo(viewer)))
		.groupBy(recipes.parentId);

	const versionsById = new Map(versionCounts.map((r) => [r.recipeId, Number(r.count)]));
	const forksById = new Map(forkCounts.map((r) => [r.parentId, Number(r.count)]));

	return recipeList.map((r) => ({
		...r,
		versionCount: versionsById.get(r.id) ?? 0,
		forkCount: forksById.get(r.id) ?? 0
	}));
}

/**
 * The recipe cards matching `where`, in `orderBy`, each with its counts for
 * `viewer`. With `tagRank` (a selection's match counts, passed only when no
 * text query ranks the list) recipes matching more selected tags come first.
 * With `cooked` (the viewer's own shelf only, never a list about the recipe)
 * a card the viewer has logged also carries their times and last cooked.
 */
export async function cardList(
	where: SQL | undefined,
	orderBy: SQL[],
	viewer: Viewer,
	{
		tagRank,
		limit,
		cooked
	}: { tagRank?: Map<number, number> | null; limit?: number; cooked?: boolean } = {}
) {
	// The search vector is the database's own, never a card's.
	const rows = await db.query.recipes.findMany({
		where,
		columns: { fts: false },
		with: CARD_WITH,
		orderBy,
		limit
	});
	if (tagRank && tagRank.size > 0) rows.sort(byTagMatches(tagRank));
	const withCounts = await attachRecipeCounts(rows, viewer);
	const cookedById =
		cooked && viewer
			? await cookedCounts(
					viewer.id,
					rows.map((r) => r.id)
				)
			: new Map<number, Cooked>();
	return withCounts.map((r) => ({ ...r, ...cookedById.get(r.id) }));
}
