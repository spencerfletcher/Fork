import { db } from '#lib/server/db/index.js';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { desc, eq } from 'drizzle-orm';
import { diffIngredients, diffMeta, diffSteps } from '#lib/recipes/diff.js';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import type { PageServerLoad } from './$types';

/**
 * The landing page's sample diff is the site's shop window, so it is pinned to the
 * owner's own recipes. Signup is open, and without this any visitor could publish a
 * two-version recipe and take over the front page.
 */
const SHOWCASE_AUTHOR = 'spencerfletcher';

type SampleDiff = {
	recipeTitle: string;
	recipeSlug: string;
	fromVersion: number;
	toVersion: number;
	commitMessage: string | null;
	metaDiff: ReturnType<typeof diffMeta>;
	ingredientDiff: ReturnType<typeof diffIngredients>;
	stepDiff: ReturnType<typeof diffSteps>;
};

export const load: PageServerLoad = async ({ locals: { user } }) => {
	const allRecipes = await db.query.recipes.findMany({
		where: eq(recipes.isPublic, true),
		with: {
			recipesToTags: { with: { tag: true } },
			author: true
		},
		orderBy: (r, { desc }) => [desc(r.updatedAt)]
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

	// The showcase diff: the newest pair of versions that differs, from the
	// showcase author's recipes only (signup is open, so anyone else qualifying
	// here would be a takeover of the front page). Omitted when nothing differs
	// rather than fabricated. Ranked as [both panels changed, changed rows], so
	// a one-line tweak does not beat a real rewrite and a diff with one panel
	// all grey loses to a smaller one that moves both; ties keep the newer
	// recipe. showcasePool is capped at five, one round trip each.
	let best: { rank: [number, number]; diff: SampleDiff } | null = null;
	const candidates = showcasePool.flatMap((r) => {
		const counted = countedById.get(r.id);
		return counted && counted.versionCount >= 2 ? [counted] : [];
	});
	for (const candidate of candidates) {
		const [to, from] = await db.query.recipeVersions.findMany({
			where: eq(recipeVersions.recipeId, candidate.id),
			orderBy: [desc(recipeVersions.versionNumber)],
			limit: 2
		});
		if (!from || !to) continue;

		const metaDiff = diffMeta(from, to);
		const ingredientDiff = diffIngredients(from.ingredients, to.ingredients);
		const stepDiff = diffSteps(from.steps, to.steps);
		const changed = (rows: { status: string }[]) =>
			rows.filter((r) => r.status !== 'unchanged').length;
		const [i, s] = [changed(ingredientDiff), changed(stepDiff)];
		const rank: [number, number] = [i > 0 && s > 0 ? 1 : 0, i + s + metaDiff.length];
		const beatsBest =
			!best || (rank[0] === best.rank[0] ? rank[1] > best.rank[1] : rank[0] > best.rank[0]);
		if (rank[1] === 0 || !beatsBest) continue;

		best = {
			rank,
			diff: {
				recipeTitle: candidate.title,
				recipeSlug: candidate.slug,
				fromVersion: from.versionNumber,
				toVersion: to.versionNumber,
				commitMessage: to.commitMessage,
				metaDiff,
				ingredientDiff,
				stepDiff
			}
		};
	}

	return {
		mode: user ? ('feed' as const) : ('landing' as const),
		recipes: withCounts,
		sampleDiff: best?.diff ?? null
	};
};
