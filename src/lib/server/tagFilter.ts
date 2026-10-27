import { and, eq, inArray, type SQL } from 'drizzle-orm';
import { db } from './db/index.js';
import { recipes, recipesToTags, tags } from './db/schema.js';

export type TagChip = { id: number; name: string; slug: string };

/**
 * Tags for the filter chips: only those on at least one recipe matching
 * `scope`. A chip that leads to an empty page is worse than no chip, and a tag
 * used only on a recipe the viewer cannot see must not appear at all.
 */
export async function visibleTags(scope: SQL | undefined): Promise<TagChip[]> {
	return db
		.selectDistinct({ id: tags.id, name: tags.name, slug: tags.slug })
		.from(tags)
		.innerJoin(recipesToTags, eq(recipesToTags.tagId, tags.id))
		.innerJoin(recipes, eq(recipes.id, recipesToTags.recipeId))
		.where(scope)
		.orderBy(tags.name);
}

/**
 * Tag filtering is OR logic: a recipe qualifies on any selected tag, and the
 * count says how many it matched so callers can rank by it. Only recipes with
 * at least one match appear in the map.
 */
export async function tagMatchCounts(
	tagIds: number[],
	withinRecipeIds?: number[]
): Promise<Map<number, number>> {
	const rows = await db
		.select({ recipeId: recipesToTags.recipeId })
		.from(recipesToTags)
		.where(
			and(
				inArray(recipesToTags.tagId, tagIds),
				withinRecipeIds ? inArray(recipesToTags.recipeId, withinRecipeIds) : undefined
			)
		);
	const counts = new Map<number, number>();
	for (const { recipeId } of rows) counts.set(recipeId, (counts.get(recipeId) ?? 0) + 1);
	return counts;
}

/** Sort comparator: recipes matching more selected tags first. */
export function byTagMatches(counts: Map<number, number>) {
	return (a: { id: number }, b: { id: number }) =>
		(counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0);
}
