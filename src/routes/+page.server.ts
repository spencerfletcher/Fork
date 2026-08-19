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
	const allRecipes = await db.query.recipes.findMany({
		where: eq(recipes.isPublic, true),
		with: {
			recipesToTags: { with: { tag: true } },
			author: true
		},
		orderBy: (r, { desc }) => [desc(r.createdAt)]
	});

	// The landing page renders three cards; the feed renders everything. Counting
	// is scoped to the rows one of those two actually needs, plus the showcase
	// candidates below, so the aggregates do not grow with the size of the site
	// on a page whose output is fixed.
	const displayed = user ? allRecipes : allRecipes.slice(0, 3);
	const showcasePool = user
		? []
		: allRecipes.filter((r) => r.author?.username === SHOWCASE_AUTHOR).slice(0, 5);

	const needed = [...displayed];
	for (const recipe of showcasePool) {
		if (!needed.some((r) => r.id === recipe.id)) needed.push(recipe);
	}

	// attachRecipeCounts preserves input order, and `needed` starts with exactly
	// the displayed rows, so the leading slice is the rendered set.
	const counted = await attachRecipeCounts(needed);
	const countedById = new Map(counted.map((r) => [r.id, r]));
	const withCounts = counted.slice(0, displayed.length);

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
		// showcasePool is already capped at five: nothing stops a bulk edit from
		// producing many same-author no-op second versions, and each candidate
		// costs a sequential round trip below.
		const candidates = showcasePool
			.map((r) => countedById.get(r.id))
			.filter((r) => r !== undefined)
			.filter((r) => r.versionCount >= 2);

		// Score every candidate and keep the strongest rather than breaking on the
		// first that differs at all. The landing diff is the shop window: a
		// one-line tweak on the newest recipe should not outrank a substantial
		// rewrite on an older one, and the e2e suite writes exactly such a tweak
		// on every run. Candidates are already capped at five, so this is at most
		// five round trips.
		let bestScore = 0;

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

			const changedRows = [...ingredientDiff, ...stepDiff].filter(
				(r) => r.status !== 'unchanged'
			).length;

			// Strictly greater, so an equal score leaves the newer candidate in
			// place — candidates arrive newest first.
			if (changedRows > bestScore) {
				bestScore = changedRows;
				sampleDiff = {
					recipeTitle: candidate.title,
					recipeSlug: candidate.slug,
					fromVersion: from.versionNumber,
					toVersion: to.versionNumber,
					ingredientDiff,
					stepDiff
				};
			}
		}
	}

	return {
		mode: user ? ('feed' as const) : ('landing' as const),
		recipes: withCounts,
		sampleDiff
	};
};
