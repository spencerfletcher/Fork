import { db } from '$lib/server/db';
import { recipes, recipeVersions } from '$lib/server/db/schema';
import { and, count, desc, eq, isNotNull } from 'drizzle-orm';
import { diffIngredients, diffSteps } from '$lib/utils/diff';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { user } }) => {
	const displayedRecipes = await db.query.recipes.findMany({
		where: eq(recipes.isPublic, true),
		with: {
			recipesToTags: { with: { tag: true } },
			author: true
		},
		orderBy: (r, { desc }) => [desc(r.createdAt)]
	});

	// Two grouped aggregates for the whole page — never one query per card.
	const versionCounts = await db
		.select({ recipeId: recipeVersions.recipeId, count: count() })
		.from(recipeVersions)
		.groupBy(recipeVersions.recipeId);

	const forkCounts = await db
		.select({ parentId: recipes.parentId, count: count() })
		.from(recipes)
		// Public feed, no auth: a private fork must not inflate a public recipe's count.
		.where(and(isNotNull(recipes.parentId), eq(recipes.isPublic, true)))
		.groupBy(recipes.parentId);

	const versionsById = new Map(versionCounts.map((r) => [r.recipeId, Number(r.count)]));
	const forksById = new Map(forkCounts.map((r) => [r.parentId, Number(r.count)]));

	const withCounts = displayedRecipes.map((r) => ({
		...r,
		versionCount: versionsById.get(r.id) ?? 0,
		forkCount: forksById.get(r.id) ?? 0
	}));

	// A real diff from real rows. If no recipe has two versions the section is
	// omitted rather than fabricated — the landing page must not claim more
	// than the data supports.
	let sampleDiff: {
		recipeTitle: string;
		recipeSlug: string;
		ingredientDiff: ReturnType<typeof diffIngredients>;
		stepDiff: ReturnType<typeof diffSteps>;
	} | null = null;

	if (!user) {
		// Pick the newest version pair that actually differs — "most versions" is not
		// the same as "has a visible change", and repeated no-op commits are common.
		const candidates = withCounts.filter((r) => r.versionCount >= 2);

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
