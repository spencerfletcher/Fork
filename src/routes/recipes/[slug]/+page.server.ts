import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { recipes, recipeVersions, recipesToTags, profiles } from '$lib/server/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { slugify } from '$lib/helpers';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { user } }) => {
	const recipeSlug = params.slug;
	const versionParam = url.searchParams.get('version');
	const requestedVersion = versionParam ? parseInt(versionParam, 10) : null;

	const recipe = await db.query.recipes.findFirst({
		where: eq(recipes.slug, recipeSlug),
		with: {
			recipesToTags: { with: { tag: true } },
			author: true,
			parent: { with: { author: true } },
			versions: {
				orderBy: [desc(recipeVersions.versionNumber)],
				with: { creator: true },
			},
		},
	});

	if (!recipe) throw error(404, 'Recipe not found');

	// Resolve which version's content to display
	let currentVersion = recipe.versions[0] ?? null;
	let isViewingHistory = false;

	if (requestedVersion !== null) {
		const found = recipe.versions.find(v => v.versionNumber === requestedVersion);
		if (!found) throw error(404, 'Version not found');
		currentVersion = found;
		isViewingHistory = found.versionNumber !== recipe.versions[0]?.versionNumber;
	}

	return {
		recipe,
		currentVersion,
		allVersions: recipe.versions,
		isViewingHistory,
	};
};

export const actions: Actions = {
	fork: async ({ params, locals: { user }, request }) => {
		if (!user) throw error(401, 'Login required to fork a recipe');

		const formData = await request.formData();
		const commitMessage = (formData.get('commitMessage') as string)?.trim() || 'Forked recipe';

		// Load source recipe + latest version
		const source = await db.query.recipes.findFirst({
			where: eq(recipes.slug, params.slug),
			with: {
				versions: { orderBy: [desc(recipeVersions.versionNumber)], limit: 1 },
				recipesToTags: true,
			},
		});

		if (!source) throw error(404, 'Source recipe not found');

		const latestVersion = source.versions[0];
		if (!latestVersion) throw error(400, 'Source recipe has no versions');

		// Upsert profile for the forking user (guard against missing profile)
		await db
			.insert(profiles)
			.values({
				id: user.id,
				username: user.email?.split('@')[0] ?? user.id.slice(0, 8),
			})
			.onConflictDoNothing();

		let newSlug: string | null = null;

		await db.transaction(async (tx) => {
			const slug = `${slugify(source.title)}-${nanoid(6)}`;

			const [newRecipe] = await tx
				.insert(recipes)
				.values({
					authorId: user.id,
					slug,
					title: source.title,
					description: source.description,
					imageUrl: source.imageUrl,
					servings: source.servings,
					prepTimeMinutes: source.prepTimeMinutes,
					cookTimeMinutes: source.cookTimeMinutes,
					isPublic: source.isPublic,
					parentId: source.id,
					forkedAt: new Date(),
				})
				.returning();

			// Copy tags
			if (source.recipesToTags.length > 0) {
				await tx.insert(recipesToTags).values(
					source.recipesToTags.map(rt => ({
						recipeId: newRecipe.id,
						tagId: rt.tagId,
					}))
				);
			}

			// Create version 1 as a copy of the source's latest version
			await tx.insert(recipeVersions).values({
				recipeId: newRecipe.id,
				versionNumber: 1,
				commitMessage,
				ingredients: latestVersion.ingredients,
				steps: latestVersion.steps,
				createdBy: user.id,
			});

			newSlug = newRecipe.slug;
		});

		throw redirect(303, `/recipes/${newSlug}/edit`);
	},
};
