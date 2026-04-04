import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { recipes, recipeVersions } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { diffIngredients, diffSteps } from '$lib/utils/diff';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const recipe = await db.query.recipes.findFirst({
		where: eq(recipes.slug, params.slug),
		with: {
			versions: {
				orderBy: [asc(recipeVersions.versionNumber)],
				with: { creator: true }
			},
			author: true
		}
	});

	if (!recipe) throw error(404, 'Recipe not found');
	if (!recipe.isPublic && recipe.authorId !== locals.user?.id) throw error(404, 'Recipe not found');
	if (recipe.versions.length < 2) throw error(400, 'Need at least two versions to compare');

	const allVersions = recipe.versions;

	const fromParam = url.searchParams.get('from');
	const toParam = url.searchParams.get('to');

	const fromNum = fromParam ? parseInt(fromParam, 10) : allVersions[0].versionNumber;
	const toNum = toParam ? parseInt(toParam, 10) : allVersions[allVersions.length - 1].versionNumber;

	const fromVersion = allVersions.find((v) => v.versionNumber === fromNum);
	const toVersion = allVersions.find((v) => v.versionNumber === toNum);

	if (!fromVersion) throw error(400, `Version ${fromNum} not found`);
	if (!toVersion) throw error(400, `Version ${toNum} not found`);

	const ingredientDiff = diffIngredients(
		fromVersion.ingredients as Parameters<typeof diffIngredients>[0],
		toVersion.ingredients as Parameters<typeof diffIngredients>[0]
	);
	const stepDiff = diffSteps(
		fromVersion.steps as Parameters<typeof diffSteps>[0],
		toVersion.steps as Parameters<typeof diffSteps>[0]
	);

	return {
		recipe,
		fromVersion,
		toVersion,
		ingredientDiff,
		stepDiff,
		allVersions
	};
};
