import { db } from '#lib/server/db/index.js';
import { profiles, recipes, recipeVersions } from '#lib/server/db/schema.js';
import { and, count, eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import { clampDescription } from '#lib/seo.js';
import { plural } from '#lib/helpers.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { user } }) => {
	const profile = await db.query.profiles.findFirst({
		where: eq(profiles.username, params.username.toLowerCase())
	});

	if (!profile) throw error(404, 'User not found');

	const [publicRecipes, commitResult] = await Promise.all([
		db.query.recipes.findMany({
			where: and(eq(recipes.authorId, profile.id), eq(recipes.isPublic, true)),
			orderBy: (r, { desc }) => [desc(r.createdAt)]
		}),
		// Commits on public recipes only: the count appears in link previews,
		// and must not hint at private work.
		db
			.select({ commitCount: count() })
			.from(recipeVersions)
			.innerJoin(recipes, eq(recipes.id, recipeVersions.recipeId))
			.where(and(eq(recipeVersions.createdBy, profile.id), eq(recipes.isPublic, true)))
	]);

	const withCounts = await attachRecipeCounts(publicRecipes);

	const commitCount = commitResult[0]?.commitCount ?? 0;

	// Only the owner learns how much private work sits behind the page; for
	// anyone else the number is not even computed.
	const privateCount =
		user?.id === profile.id
			? await db.$count(recipes, and(eq(recipes.authorId, profile.id), eq(recipes.isPublic, false)))
			: 0;

	return {
		profile,
		recipes: withCounts,
		commitCount,
		privateCount,
		meta: {
			title: `@${profile.username}`,
			description: clampDescription(
				`${plural(withCounts.length, 'public recipe')} and ${plural(commitCount, 'change')} on Fork.`
			)
		}
	};
};
