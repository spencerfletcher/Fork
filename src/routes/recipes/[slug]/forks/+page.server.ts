import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { recipes } from '#lib/server/db/schema.js';
import { and, desc, eq, or } from 'drizzle-orm';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import type { PageServerLoad } from './$types';

// The recipe's forks, newest first: the public ones, and the visitor's own
// private ones. The recipe itself is gated as its own page gates it.
export const load: PageServerLoad = async ({ params, locals: { user } }) => {
	const recipe = await db.query.recipes.findFirst({ where: eq(recipes.slug, params.slug) });
	if (!recipe) throw error(404, 'Recipe not found');
	if (!recipe.isPublic && recipe.authorId !== user?.id) throw error(404, 'Recipe not found');

	const visible = user
		? or(eq(recipes.isPublic, true), eq(recipes.authorId, user.id))
		: eq(recipes.isPublic, true);
	const forks = await db.query.recipes.findMany({
		where: and(eq(recipes.parentId, recipe.id), visible),
		with: { recipesToTags: { with: { tag: true } }, author: true },
		orderBy: [desc(recipes.createdAt)]
	});

	return {
		recipe: { slug: recipe.slug, title: recipe.title },
		forks: await attachRecipeCounts(forks),
		meta: { title: `Forks of ${recipe.title}` }
	};
};
