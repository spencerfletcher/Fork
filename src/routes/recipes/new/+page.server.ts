import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.js';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { draftOf } from '#lib/recipes/validation.js';
import { slugify, randomSuffix } from '#lib/helpers.js';
import { removeRecipeImage } from '#lib/server/images.js';
import { readSubmission, uploadPhoto, saveFailure } from '#lib/server/submission.js';
import { syncTags, listTags } from '#lib/server/tags.js';
import type { RecipeContent } from '#lib/recipes/types.js';
import { recipeCopies } from '#lib/recipes/content.js';
import { ensureProfile } from '#lib/server/profiles.js';
import { loginHref } from '#lib/auth/loginHref.js';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	if (!user) throw redirect(303, loginHref(url.pathname + url.search));

	const allTags = await listTags();

	return { allTags, meta: { title: 'New Recipe' } };
};

export const actions: Actions = {
	default: async ({ request, locals: { user, supabase } }) => {
		const formData = await request.formData();
		// A lapsed session hands the draft back too, so logging in again loses nothing.
		if (!user)
			return saveFailure(
				401,
				'unauthenticated',
				'Your session ended. Log in in another tab, then save again.',
				draftOf(formData)
			);
		const submission = readSubmission(formData);
		if (!submission.ok) return submission.failure;
		const { draft, content, settings } = submission;

		// Before the upload, so a profile failure cannot orphan a stored file.
		try {
			await ensureProfile(user);
		} catch (e) {
			console.error('Could not ensure profile', e);
			return saveFailure(500, 'save_failed', 'Could not save the recipe. Try again.', draft);
		}

		const upload = await uploadPhoto(formData, supabase, user.id, draft);
		if (!upload.ok) return upload.failure;
		const { image } = upload;

		const submitted: RecipeContent = { ...content, imageUrl: image?.url ?? null };
		const copies = recipeCopies(submitted);
		const slug = `${slugify(copies.title)}-${randomSuffix()}`;

		try {
			await db.transaction(async (tx) => {
				const [recipe] = await tx
					.insert(recipes)
					.values({
						slug,
						// Copies of version 1, per the ownership rule in schema.ts.
						...copies,
						isPublic: settings.isPublic,
						authorId: user.id
					})
					.returning({ id: recipes.id });

				await syncTags(tx, recipe.id, settings.tagNames);

				await tx.insert(recipeVersions).values({
					recipeId: recipe.id,
					versionNumber: 1,
					commitMessage: 'Initial recipe',
					...submitted,
					createdBy: user.id
				});
			});
		} catch (e) {
			console.error('Could not create recipe', e);
			if (image) await removeRecipeImage(supabase, image.path);
			return saveFailure(500, 'save_failed', 'Could not save the recipe. Try again.', draft);
		}

		throw redirect(303, `/recipes/${slug}`);
	}
};
