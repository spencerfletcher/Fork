import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { parseRecipeMeta, parseRecipeContent } from '#lib/recipes/validation.js';
import { recipes, recipeVersions, recipesToTags, tags } from '#lib/server/db/schema.js';
import { eq, desc, max, inArray } from 'drizzle-orm';
import { slugify } from '#lib/helpers.js';
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
		const meta = parseRecipeMeta(formData);
		if (!meta.ok) return fail(400, { error: meta.error });
		const { title, description, servings, prepTimeMinutes, cookTimeMinutes, isPublic, tagNames } =
			meta.value;
		const rawImageUrl = (formData.get('imageUrl') as string)?.trim() || null;
		if (rawImageUrl) {
			let parsedUrl: URL;
			try {
				parsedUrl = new URL(rawImageUrl);
			} catch {
				return fail(400, { error: 'Invalid image URL' });
			}
			if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
				return fail(400, { error: 'Image URL must use http or https' });
			}
		}
		const imageUrl = rawImageUrl;

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
			if (tagNames.length > 0) {
				// Upsert any new tags
				await tx
					.insert(tags)
					.values(tagNames.map((name) => ({ name, slug: slugify(name) })))
					.onConflictDoNothing();
				const relevantTags = await tx.query.tags.findMany({
					where: inArray(tags.name, tagNames)
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
		if (!commitMessage) return fail(400, { error: 'Commit message is required' });
		const content = parseRecipeContent(formData);
		if (!content.ok) return fail(400, { error: content.error });
		const { ingredients, steps } = content.value;

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
