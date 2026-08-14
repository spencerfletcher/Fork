import { db } from '$lib/server/db';
import { recipes, recipeVersions } from '$lib/server/db/schema';
import { and, count, eq, inArray } from 'drizzle-orm';

/**
 * Attach version and fork counts to a list of recipes.
 *
 * Two grouped aggregates for the whole list — never one query per recipe. The
 * fork aggregate is scoped to public recipes so a private fork cannot inflate a
 * public recipe's count on an unauthenticated page.
 */
export async function attachRecipeCounts<T extends { id: number }>(
	recipeList: T[]
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
		.where(and(inArray(recipes.parentId, ids), eq(recipes.isPublic, true)))
		.groupBy(recipes.parentId);

	const versionsById = new Map(versionCounts.map((r) => [r.recipeId, Number(r.count)]));
	const forksById = new Map(forkCounts.map((r) => [r.parentId, Number(r.count)]));

	return recipeList.map((r) => ({
		...r,
		versionCount: versionsById.get(r.id) ?? 0,
		forkCount: forksById.get(r.id) ?? 0
	}));
}
