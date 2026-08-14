import { db } from '$lib/server/db';
import { recipes, recipeVersions } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { diffIngredients, diffSteps } from '$lib/utils/diff';
import { attachRecipeCounts } from '$lib/server/recipeCounts';
import type { PageServerLoad } from './$types';

/**
 * The landing page's sample diff is the site's shop window, so it is pinned to the
 * owner's own recipes. Signup is open, and without this any visitor could publish a
 * two-version recipe and take over the front page.
 */
const SHOWCASE_AUTHOR = 'spencerfletcher';

export const load: PageServerLoad = async ({ locals: { user } }) => {
	const displayedRecipes = await db.query.recipes.findMany({
		where: eq(recipes.isPublic, true),
		with: {
			recipesToTags: { with: { tag: true } },
			author: true
		},
		orderBy: (r, { desc }) => [desc(r.createdAt)]
	});

	const withCounts = await attachRecipeCounts(displayedRecipes);

	// A real diff from real rows. If no recipe has two versions the section is
	// omitted rather than fabricated — the landing page must not claim more
	// than the data supports.
	let sampleDiff: {
		recipeTitle: string;
		recipeSlug: string;
		fromVersion: number;
		toVersion: number;
		ingredientDiff: ReturnType<typeof diffIngredients>;
		stepDiff: ReturnType<typeof diffSteps>;
	} | null = null;

	if (!user) {
		// Pick the newest version pair that actually differs — "most versions" is not
		// the same as "has a visible change", and repeated no-op commits are common.
		// Restricted to the showcase author: this is the site's shop window, and
		// signup is open, so any other author's recipe qualifying here would be a
		// takeover of the front page, not a fallback worth having.
		// Belt-and-braces bound: the showcase-author filter above already keeps this
		// pool small, but nothing stops a bulk edit from producing many same-author
		// no-op second versions, each costing a sequential round trip below.
		const candidates = withCounts
			.filter((r) => r.versionCount >= 2 && r.author?.username === SHOWCASE_AUTHOR)
			.slice(0, 5);

		for (const candidate of candidates) {
			const versions = await db.query.recipeVersions.findMany({
				where: eq(recipeVersions.recipeId, candidate.id),
				orderBy: [desc(recipeVersions.versionNumber)],
				limit: 2
			});
			const [to, from] = versions;
			if (!from || !to) continue;

			const ingredientDiff = diffIngredients(
				from.ingredients as Parameters<typeof diffIngredients>[0],
				to.ingredients as Parameters<typeof diffIngredients>[0]
			);
			const stepDiff = diffSteps(
				from.steps as Parameters<typeof diffSteps>[0],
				to.steps as Parameters<typeof diffSteps>[0]
			);

			const hasChange =
				ingredientDiff.some((r) => r.status !== 'unchanged') ||
				stepDiff.some((r) => r.status !== 'unchanged');

			if (hasChange) {
				sampleDiff = {
					recipeTitle: candidate.title,
					recipeSlug: candidate.slug,
					fromVersion: from.versionNumber,
					toVersion: to.versionNumber,
					ingredientDiff,
					stepDiff
				};
				break;
			}
		}
	}

	return {
		mode: user ? ('feed' as const) : ('landing' as const),
		recipes: user ? withCounts : withCounts.slice(0, 3),
		sampleDiff
	};
};
