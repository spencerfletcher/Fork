import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { recipes } from '#lib/server/db/schema.js';
import { and, desc, eq } from 'drizzle-orm';
import { attachRecipeCounts, CARD_WITH } from '#lib/server/recipeCounts.js';
import { PARENT_AUTHOR, viewableRecipe, visibleTo } from '#lib/server/visibility.js';
import { forkedFromLine } from '#lib/recipes/forkedFrom.js';
import type { PageServerLoad } from './$types';

// The recipe's forks, newest first: the ones visibleTo lets the visitor see, their own
// included. The recipe itself is gated as its own page gates it. Each
// fork carries its first version's line, read from this recipe, its parent.
export const load: PageServerLoad = async ({ params, locals: { user } }) => {
	const recipe = await viewableRecipe(params.slug, user, { author: PARENT_AUTHOR });
	if (!recipe) throw error(404, 'Recipe not found');

	const forks = await db.query.recipes.findMany({
		where: and(eq(recipes.parentId, recipe.id), visibleTo(user)),
		with: CARD_WITH,
		orderBy: [desc(recipes.createdAt)]
	});

	return {
		recipe: { slug: recipe.slug, title: recipe.title },
		forks: await attachRecipeCounts(
			forks.map((fork) => ({
				...fork,
				forkNote: forkedFromLine({ author: recipe.author?.username ?? null }, fork.parentVersion)
			})),
			user
		),
		meta: { title: `Forks of ${recipe.title}`, noindex: recipe.visibility !== 'public' }
	};
};
