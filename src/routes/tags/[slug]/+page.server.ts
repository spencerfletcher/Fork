import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { eq, and, exists, sql } from 'drizzle-orm';
import { tags, recipes, recipesToTags } from '#lib/server/db/schema.js';
import { attachRecipeCounts, CARD_WITH } from '#lib/server/recipeCounts.js';
import { visibleTags } from '#lib/server/tagFilter.js';
import { clampDescription } from '#lib/seo.js';
import { plural } from '#lib/helpers.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const tag = await db.query.tags.findFirst({ where: eq(tags.slug, params.slug.toLowerCase()) });
	if (!tag) throw error(404, 'Tag not found');

	const [tagged, allTags] = await Promise.all([
		db.query.recipes.findMany({
			where: and(
				eq(recipes.visibility, 'public'),
				exists(
					db
						.select({ one: sql`1` })
						.from(recipesToTags)
						.where(and(eq(recipesToTags.recipeId, recipes.id), eq(recipesToTags.tagId, tag.id)))
				)
			),
			with: CARD_WITH,
			orderBy: (r, { desc }) => [desc(r.updatedAt)]
		}),
		visibleTags(eq(recipes.visibility, 'public'))
	]);
	const withCounts = await attachRecipeCounts(tagged);

	return {
		tag,
		recipes: withCounts,
		tags: allTags,
		meta: {
			title: tag.name,
			description: clampDescription(
				`${plural(withCounts.length, `${tag.name} recipe`)} on Fork, each with its full version history.`
			)
		}
	};
};
