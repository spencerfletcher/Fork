import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { recipes, recipeVersions, recipesToTags, tags } from '$lib/server/db/schema';
import { eq, desc, max, inArray } from 'drizzle-orm';
import { slugify } from '$lib/helpers';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals: { user } }) => {
	if (!user) throw redirect(303, '/login');

	const recipe = await db.query.recipes.findFirst({
		where: eq(recipes.slug, params.slug),
		with: {
			recipesToTags: { with: { tag: true } },
			versions: { orderBy: [desc(recipeVersions.versionNumber)], limit: 1 }
		}
	});

	if (!recipe) throw error(404, 'Recipe not found');
	if (recipe.authorId !== user.id) throw error(403, 'You do not own this recipe');

	const allTags = await db.query.tags.findMany({
		orderBy: (t, { asc }) => [asc(t.name)]
	});

	return {
		recipe,
		latestVersion: recipe.versions[0] ?? null,
		allTags
	};
};

export const actions: Actions = {
	// Update recipe metadata (no version bump)
	saveMeta: async ({ params, request, locals: { user } }) => {
		if (!user) throw error(401, 'Login required');

		const recipe = await db.query.recipes.findFirst({
			where: eq(recipes.slug, params.slug)
		});
		if (!recipe) throw error(404, 'Recipe not found');
		if (recipe.authorId !== user.id) throw error(403, 'Not authorized');

		const formData = await request.formData();
		const title = (formData.get('title') as string)?.trim();
		const description = (formData.get('description') as string)?.trim() || null;
		const rawImageUrl = (formData.get('imageUrl') as string)?.trim() || null;
		if (rawImageUrl) {
			let parsedUrl: URL;
			try {
				parsedUrl = new URL(rawImageUrl);
			} catch {
				throw error(400, 'Invalid image URL');
			}
			if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
				throw error(400, 'Image URL must use http or https');
			}
		}
		const imageUrl = rawImageUrl;
		const servings = parseInt(formData.get('servings') as string) || null;
		const prepTimeMinutes = parseInt(formData.get('prepTimeMinutes') as string) || null;
		const cookTimeMinutes = parseInt(formData.get('cookTimeMinutes') as string) || null;
		const isPublic = formData.get('isPublic') === 'on';
		const selectedTagNames = formData.getAll('tags') as string[];

		if (!title) throw error(400, 'Title is required');

		await db.transaction(async (tx) => {
			await tx
				.update(recipes)
				.set({
					title,
					description,
					imageUrl,
					servings,
					prepTimeMinutes,
					cookTimeMinutes,
					isPublic,
					updatedAt: new Date()
				})
				.where(eq(recipes.id, recipe.id));

			// Sync tags
			await tx.delete(recipesToTags).where(eq(recipesToTags.recipeId, recipe.id));
			if (selectedTagNames.length > 0) {
				// Upsert any new tags
				await tx
					.insert(tags)
					.values(selectedTagNames.map((name) => ({ name, slug: slugify(name) })))
					.onConflictDoNothing();
				const relevantTags = await tx.query.tags.findMany({
					where: inArray(tags.name, selectedTagNames)
				});
				if (relevantTags.length > 0) {
					await tx
						.insert(recipesToTags)
						.values(relevantTags.map((t) => ({ recipeId: recipe.id, tagId: t.id })));
				}
			}
		});

		throw redirect(303, `/recipes/${params.slug}`);
	},

	// Save new version (ingredients + steps)
	saveVersion: async ({ params, request, locals: { user } }) => {
		if (!user) throw error(401, 'Login required');

		const recipe = await db.query.recipes.findFirst({
			where: eq(recipes.slug, params.slug)
		});
		if (!recipe) throw error(404, 'Recipe not found');
		if (recipe.authorId !== user.id) throw error(403, 'Not authorized');

		const formData = await request.formData();
		const commitMessage = (formData.get('commitMessage') as string)?.trim();
		const ingredientsRaw = formData.get('ingredients') as string;
		const stepsRaw = formData.get('steps') as string;

		if (!commitMessage) throw error(400, 'Commit message is required');

		let ingredients, steps;
		try {
			ingredients = JSON.parse(ingredientsRaw);
			steps = JSON.parse(stepsRaw);
		} catch {
			throw error(400, 'Invalid ingredient or step data');
		}

		if (!Array.isArray(ingredients) || ingredients.length === 0) {
			throw error(400, 'At least one ingredient is required');
		}
		if (!Array.isArray(steps) || steps.length === 0) {
			throw error(400, 'At least one step is required');
		}

		// Normalize step numbers to be sequential
		steps = steps.map((s: { text: string }, i: number) => ({ step: i + 1, text: s.text }));

		await db.transaction(async (tx) => {
			// Get current max version
			const [{ maxVer }] = await tx
				.select({ maxVer: max(recipeVersions.versionNumber) })
				.from(recipeVersions)
				.where(eq(recipeVersions.recipeId, recipe.id));

			const nextVersion = (maxVer ?? 0) + 1;

			await tx.insert(recipeVersions).values({
				recipeId: recipe.id,
				versionNumber: nextVersion,
				commitMessage,
				ingredients,
				steps,
				createdBy: user.id
			});

			await tx.update(recipes).set({ updatedAt: new Date() }).where(eq(recipes.id, recipe.id));
		});

		throw redirect(303, `/recipes/${params.slug}`);
	},

	// Delete this recipe entirely
	deleteRecipe: async ({ params, locals: { user } }) => {
		if (!user) throw error(401, 'Login required');

		const recipe = await db.query.recipes.findFirst({
			where: eq(recipes.slug, params.slug)
		});
		if (!recipe) throw error(404, 'Recipe not found');
		if (recipe.authorId !== user.id) throw error(403, 'Not authorized');

		// recipeVersions and recipesToTags cascade-delete via FK
		await db.delete(recipes).where(eq(recipes.id, recipe.id));

		throw redirect(303, '/recipes');
	}
};
