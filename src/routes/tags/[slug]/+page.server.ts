import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { eq, and, exists, sql } from 'drizzle-orm';
import { tags, recipes, recipesToTags } from '#lib/server/db/schema.js';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import { clampDescription } from '#lib/seo.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const tag = await db.query.tags.findFirst({ where: eq(tags.slug, params.slug.toLowerCase()) });
	if (!tag) throw error(404, 'Tag not found');

	const tagged = await db.query.recipes.findMany({
		where: and(
			eq(recipes.isPublic, true),
			exists(
				db
					.select({ one: sql`1` })
					.from(recipesToTags)
					.where(and(eq(recipesToTags.recipeId, recipes.id), eq(recipesToTags.tagId, tag.id)))
			)
		),
		with: { recipesToTags: { with: { tag: true } }, author: true }
	});
	const withCounts = await attachRecipeCounts(tagged);

	return {
		tag,
		recipes: withCounts,
		meta: {
			title: tag.name,
			description: clampDescription(
				`${withCounts.length} ${tag.name} recipe${withCounts.length === 1 ? '' : 's'} on Fork, each with its full version history.`
			)
		}
	};
};
