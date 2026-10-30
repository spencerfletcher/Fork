import { error, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { diffIngredients, diffMeta, diffSteps } from '#lib/recipes/diff.js';
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

	// Number, not parseInt: "1.5" and "abc" are not versions, and neither is
	// worth echoing back in the message.
	const fromNum = fromParam ? Number(fromParam) : allVersions[0].versionNumber;
	const toNum = toParam ? Number(toParam) : allVersions[allVersions.length - 1].versionNumber;

	const fromVersion = allVersions.find((v) => v.versionNumber === fromNum);
	const toVersion = allVersions.find((v) => v.versionNumber === toNum);

	if (!fromVersion || !toVersion) {
		const missing = [fromVersion ? null : fromNum, toVersion ? null : toNum].filter(
			(n) => n !== null
		);
		// Only whole numbers are named; "abc" or "1.5" is not a version to echo.
		if (!missing.every(Number.isSafeInteger)) throw error(400, 'Version not found');
		throw error(
			400,
			missing.length === 1
				? `Version ${missing[0]} not found`
				: `Versions ${missing[0]} and ${missing[1]} not found`
		);
	}

	// The diff always reads older to newer; a reversed pair is swapped in the
	// URL too, so the pickers and the address agree.
	if (fromNum > toNum)
		throw redirect(303, `/recipes/${recipe.slug}/diff?from=${toNum}&to=${fromNum}`);

	const ingredientDiff = diffIngredients(fromVersion.ingredients, toVersion.ingredients);
	const stepDiff = diffSteps(fromVersion.steps, toVersion.steps);
	const metaDiff = diffMeta(fromVersion, toVersion);

	return {
		recipe,
		fromVersion,
		toVersion,
		metaDiff,
		ingredientDiff,
		stepDiff,
		allVersions,
		meta: {
			// One version on both sides is named once, not "v2 → v2".
			title:
				fromNum === toNum
					? `v${toNum} · same version · ${recipe.title}`
					: `v${fromNum} → v${toNum} · ${recipe.title}`,
			description: `What changed between v${fromNum} and v${toNum} of ${recipe.title} on Fork.`
		}
	};
};
