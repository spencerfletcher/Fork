import { db } from '#lib/server/db/index.js';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { namedBy } from '#lib/server/profiles.js';
import { and, count, eq } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import { clampDescription } from '#lib/seo.js';
import { NO_FTS, visibleTo } from '#lib/server/visibility.js';
import { plural } from '#lib/helpers.js';
import { relationOf } from '#lib/server/friends.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { user } }) => {
	// Usernames are stored lowercased: one canonical URL per profile.
	const username = params.username.toLowerCase();
	if (username !== params.username) {
		throw redirect(301, `/users/${encodeURIComponent(username)}${url.search}`);
	}
	const profile = await db.query.profiles.findFirst({ where: namedBy(username) });

	if (!profile) throw error(404, 'User not found');
	// A former name: old links follow the cook to their current one. Not a
	// permanent redirect: a browser keeps those, and a cook who takes the old
	// name back would loop between the two.
	if (profile.username !== username) {
		throw redirect(302, `/users/${encodeURIComponent(profile.username)}${url.search}`);
	}

	const [shownRecipes, commitResult, relation] = await Promise.all([
		db.query.recipes.findMany({
			// Strangers see public recipes, friends also friends ones, the owner all.
			where: and(eq(recipes.authorId, profile.id), visibleTo(user)),
			columns: NO_FTS,
			orderBy: (r, { desc }) => [desc(r.createdAt)]
		}),
		// Commits on public recipes only, as a signed-out visitor sees them: the
		// count appears in link previews, and must not hint at private or trashed work.
		db
			.select({ commitCount: count() })
			.from(recipeVersions)
			.innerJoin(recipes, eq(recipes.id, recipeVersions.recipeId))
			.where(and(eq(recipeVersions.createdBy, profile.id), visibleTo(null))),
		// Where the viewer stands with this person, for the relationship control.
		user ? relationOf(user.id, profile.id) : null
	]);

	const withCounts = await attachRecipeCounts(shownRecipes, user);
	// The link preview names public recipes only, whoever loaded the page.
	const publicCount = withCounts.filter((r) => r.visibility === 'public').length;

	const commitCount = commitResult[0]?.commitCount ?? 0;

	return {
		profile,
		recipes: withCounts,
		commitCount,
		relation,
		meta: {
			title: `@${profile.username}`,
			description: clampDescription(
				`${plural(publicCount, 'public recipe')} and ${plural(commitCount, 'change')} on Fork.`
			),
			// Nothing public to show a search engine or a preview.
			noindex: publicCount === 0
		}
	};
};
