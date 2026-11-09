import { db } from '#lib/server/db/index.js';
import { profiles, recipes, recipeVersions } from '#lib/server/db/schema.js';
import { and, count, eq } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import { clampDescription } from '#lib/seo.js';
import { visibleTo } from '#lib/server/visibility.js';
import { plural } from '#lib/helpers.js';
import { relationOf } from '#lib/server/friends.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { user } }) => {
	// Usernames are stored lowercased: one canonical URL per profile.
	const username = params.username.toLowerCase();
	if (username !== params.username) {
		throw redirect(301, `/users/${encodeURIComponent(username)}${url.search}`);
	}
	const profile = await db.query.profiles.findFirst({
		where: eq(profiles.username, username)
	});

	if (!profile) throw error(404, 'User not found');

	const [shownRecipes, commitResult, relation] = await Promise.all([
		db.query.recipes.findMany({
			// Strangers see public recipes, friends also friends ones, the owner all.
			where: and(eq(recipes.authorId, profile.id), visibleTo(user)),
			orderBy: (r, { desc }) => [desc(r.createdAt)]
		}),
		// Commits on public recipes only: the count appears in link previews,
		// and must not hint at private work.
		db
			.select({ commitCount: count() })
			.from(recipeVersions)
			.innerJoin(recipes, eq(recipes.id, recipeVersions.recipeId))
			.where(and(eq(recipeVersions.createdBy, profile.id), eq(recipes.visibility, 'public'))),
		// Where the viewer stands with this person, for the relationship control.
		user ? relationOf(user.id, profile.id) : null
	]);

	const withCounts = await attachRecipeCounts(shownRecipes, user);
	// The link preview names public recipes only, whoever loaded the page.
	const publicCount = withCounts.filter((r) => r.visibility === 'public').length;

	const commitCount = commitResult[0]?.commitCount ?? 0;

	// Only the owner learns how much private work sits behind the page; for
	// anyone else the number is not even computed.
	const privateCount =
		user?.id === profile.id
			? await db.$count(
					recipes,
					and(eq(recipes.authorId, profile.id), eq(recipes.visibility, 'private'))
				)
			: 0;

	return {
		profile,
		recipes: withCounts,
		commitCount,
		privateCount,
		relation,
		meta: {
			title: `@${profile.username}`,
			description: clampDescription(
				`${plural(publicCount, 'public recipe')} and ${plural(commitCount, 'change')} on Fork.`
			)
		}
	};
};
