import { redirect, error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.js';
import { parseContent, parseSettings, draftOf } from '#lib/recipes/validation.js';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { slugify } from '#lib/helpers.js';
import { nanoid } from 'nanoid';
import {
	imageFileFrom,
	uploadRecipeImage,
	removeRecipeImage,
	type UploadedImage
} from '#lib/server/images.js';
import { syncTags } from '#lib/server/tags.js';
import { ensureProfile } from '#lib/server/profiles.js';

export const load: PageServerLoad = async ({ locals: { user } }) => {
	if (!user) throw redirect(303, '/login');

	const allTags = await db.query.tags.findMany({
		orderBy: (t, { asc }) => [asc(t.name)]
	});

	return { allTags };
};

export const actions: Actions = {
	default: async ({ request, locals: { user, supabase } }) => {
		if (!user) throw error(401, 'Login required');

		const formData = await request.formData();
		// Everything as typed, handed back on any failure so nothing is lost.
		const draft = draftOf(formData);
		const content = parseContent(formData);
		if (!content.ok) return fail(400, { error: content.error, draft });
		const settings = parseSettings(formData);
		if (!settings.ok) return fail(400, { error: settings.error, draft });

		// Storage is outside the transaction: upload first, remove on a failed save.
		let image: UploadedImage | null = null;
		const file = imageFileFrom(formData);
		if (file) {
			try {
				image = await uploadRecipeImage(supabase, user.id, file);
			} catch {
				return fail(400, { error: 'Photo upload failed. Please try again.', draft });
			}
		}

		await ensureProfile(user);

		const { ingredients, steps, ...meta } = content.value;
		const slug = `${slugify(meta.title)}-${nanoid(6)}`;

		try {
			await db.transaction(async (tx) => {
				const [recipe] = await tx
					.insert(recipes)
					.values({
						slug,
						// Copies of version 1, per the ownership rule in schema.ts.
						...meta,
						imageUrl: image?.url ?? null,
						isPublic: settings.value.isPublic,
						authorId: user.id
					})
					.returning({ id: recipes.id });

				await syncTags(tx, recipe.id, settings.value.tagNames);

				await tx.insert(recipeVersions).values({
					recipeId: recipe.id,
					versionNumber: 1,
					commitMessage: 'Initial recipe',
					...meta,
					ingredients,
					steps,
					createdBy: user.id
				});
			});
		} catch (e) {
			console.error('Could not create recipe', e);
			if (image) await removeRecipeImage(supabase, image.path);
			return fail(500, { error: 'Could not save the recipe. Please try again.', draft });
		}

		throw redirect(303, `/recipes/${slug}`);
	}
};
