import { and, eq, inArray, type SQL } from 'drizzle-orm';
import { db } from './db/index.js';
import { recipes, recipesToTags, tags } from './db/schema.js';
import type { TagChip } from '#lib/recipes/types.js';

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
 * Tag filtering is AND logic: every added tag narrows, so a recipe qualifies
 * only when it carries all the selected tags. Only those recipes appear in the map.
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
	for (const [recipeId, n] of counts) if (n < tagIds.length) counts.delete(recipeId);
	return counts;
}

/** Sort comparator: recipes matching more selected tags first. */
export function byTagMatches(counts: Map<number, number>) {
	return (a: { id: number }, b: { id: number }) =>
		(counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0);
}
