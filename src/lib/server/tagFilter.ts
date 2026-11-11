import { eq, inArray, sql, type SQL } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
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
 * The tags `slugs` names that are among `allTags` (the chips), in the URL's
 * order, and the condition for the recipes carrying all of them: tag
 * filtering is AND logic, every added tag narrows. A slug no chip carries
 * filters nothing: `where` is undefined when no known tag is selected.
 */
export function tagSelection(allTags: TagChip[], slugs: string[]) {
	const selected = allTags.filter((t) => slugs.includes(t.slug));
	const selectedTags = slugs.filter((slug) => selected.some((t) => t.slug === slug));
	if (selected.length === 0) return { selectedTags, where: undefined };
	const carryingAll = new QueryBuilder()
		.select({ id: recipesToTags.recipeId })
		.from(recipesToTags)
		.where(
			inArray(
				recipesToTags.tagId,
				selected.map((t) => t.id)
			)
		)
		.groupBy(recipesToTags.recipeId)
		.having(sql`count(*) = ${selected.length}`);
	return { selectedTags, where: inArray(recipes.id, carryingAll) };
}
