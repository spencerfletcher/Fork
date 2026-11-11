import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { eq, and, exists, sql } from 'drizzle-orm';
import { tags, recipes, recipesToTags } from '#lib/server/db/schema.js';
import { cardList } from '#lib/server/recipeCounts.js';
import { visibleTags } from '#lib/server/tagFilter.js';
import { visibleTo } from '#lib/server/visibility.js';
import { clampDescription } from '#lib/seo.js';
import { plural } from '#lib/helpers.js';
import { listPage } from '#lib/listPage.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { user } }) => {
	const tag = await db.query.tags.findFirst({ where: eq(tags.slug, params.slug.toLowerCase()) });
	if (!tag) throw error(404, 'Tag not found');

	const visible = visibleTo(user);
	const where = and(
		visible,
		exists(
			db
				.select({ one: sql`1` })
				.from(recipesToTags)
				.where(and(eq(recipesToTags.recipeId, recipes.id), eq(recipesToTags.tagId, tag.id)))
		)
	);
	const [{ cards, next }, total, allTags] = await Promise.all([
		cardList(where, [], user, listPage(url)),
		db.$count(recipes, where),
		visibleTags(visible)
	]);

	return {
		tag,
		recipes: cards,
		next,
		total,
		tags: allTags,
		meta: {
			title: tag.name,
			description: clampDescription(
				`${plural(total, `${tag.name} recipe`)} on Fork, each with its full version history.`
			)
		}
	};
};
