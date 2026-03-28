import { db } from '$lib/server/db';
import { profiles, recipes, recipeVersions } from '$lib/server/db/schema';
import { and, count, eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const profile = await db.query.profiles.findFirst({
		where: eq(profiles.username, params.username)
	});

	if (!profile) throw error(404, 'User not found');

	const [publicRecipes, commitResult] = await Promise.all([
		db.query.recipes.findMany({
			where: and(eq(recipes.authorId, profile.id), eq(recipes.isPublic, true)),
			with: {
				recipesToTags: { with: { tag: true } }
			},
			orderBy: (r, { desc }) => [desc(r.createdAt)]
		}),
		db
			.select({ commitCount: count() })
			.from(recipeVersions)
			.where(eq(recipeVersions.createdBy, profile.id))
	]);

	return {
		profile,
		recipes: publicRecipes,
		commitCount: commitResult[0]?.commitCount ?? 0
	};
};
