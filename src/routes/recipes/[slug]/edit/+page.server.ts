import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { parseDraftContent, parseSettings, draftOf } from '#lib/recipes/validation.js';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import {
	contentChanged,
	changedGroups,
	generatedCommitMessage,
	recipeCopies
} from '#lib/recipes/content.js';
import { sameTags } from '#lib/recipes/tags.js';
import type { RecipeContent } from '#lib/recipes/types.js';
import {
	imageFileFrom,
	uploadRecipeImage,
	removeRecipeImage,
	type UploadedImage
} from '#lib/server/images.js';
import { syncTags, listTags } from '#lib/server/tags.js';
import { loginHref } from '#lib/auth/loginHref.js';

const STALE_MESSAGE =
	'This recipe was changed in another tab. Reload to see the latest version, then reapply your edits.';

export const load: PageServerLoad = async ({ params, url, locals: { user } }) => {
	if (!user) throw redirect(303, loginHref(url.pathname));

	const recipe = await db.query.recipes.findFirst({
		where: eq(recipes.slug, params.slug),
		with: {
			recipesToTags: { with: { tag: true } },
			versions: { orderBy: [desc(recipeVersions.versionNumber)], limit: 1 }
		}
	});

	if (!recipe) throw error(404, 'Recipe not found');
	if (recipe.authorId !== user.id) throw error(403, 'You do not own this recipe');

	const allTags = await listTags();

	return {
		recipe,
		latestVersion: recipe.versions[0] ?? null,
		allTags,
		meta: { title: `Edit ${recipe.versions[0]?.title ?? 'recipe'}` }
	};
};

export const actions: Actions = {
	// One save for the whole edit form: settings are updated in place, and a
	// new version is appended when the content changed or a message was typed,
	// which is never dropped.
	save: async ({ params, request, locals: { user, supabase } }) => {
		if (!user) throw error(401, 'Login required');
		const recipe = await db.query.recipes.findFirst({
			where: eq(recipes.slug, params.slug),
			with: { recipesToTags: { with: { tag: true } } }
		});
		if (!recipe) throw error(404, 'Recipe not found');
		if (recipe.authorId !== user.id) throw error(403, 'Not authorized');

		const formData = await request.formData();
		// Everything as typed, handed back on any failure so nothing is lost.
		const draft = draftOf(formData);
		const content = parseDraftContent(draft);
		if (!content.ok) return fail(400, { error: content.error, draft });
		const settings = parseSettings(formData);
		if (!settings.ok) return fail(400, { error: settings.error, draft });

		if (!/^\d+$/.test(draft.editRevision)) {
			return fail(400, { error: 'Invalid form state, reload the page', draft });
		}
		const editRevision = Number(draft.editRevision);
		// A tab that is already stale need not upload its photo first; the check
		// that counts is the one under the row lock below.
		if (recipe.editRevision !== editRevision) return fail(409, { error: STALE_MESSAGE, draft });

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

		let outcome: 'stale' | 'forbidden' | 'saved' | 'unchanged';
		try {
			outcome = await db.transaction(async (tx) => {
				// Serialise saves on this recipe. The recipe row and its tags were read
				// before this lock only for auth and the tag comparison; any concurrent
				// change to either bumps editRevision, which is rechecked right here.
				const [locked] = await tx
					.select()
					.from(recipes)
					.where(eq(recipes.id, recipe.id))
					.for('update');
				if (!locked || locked.authorId !== user.id) return 'forbidden';
				if (locked.editRevision !== editRevision) return 'stale';

				const latest = await tx.query.recipeVersions.findFirst({
					where: eq(recipeVersions.recipeId, recipe.id),
					orderBy: [desc(recipeVersions.versionNumber)]
				});

				// The photo is content: a new upload or a removal changes the version.
				// Otherwise the latest version's photo carries forward unchanged.
				const imageUrl = image ? image.url : draft.removeImage ? null : (latest?.imageUrl ?? null);
				const submitted: RecipeContent = { ...content.value, imageUrl };
				const changed = latest ? contentChanged(latest, submitted) : true;
				const copies = recipeCopies(submitted);

				const tagsChanged = !sameTags(
					recipe.recipesToTags.map((r) => r.tag.name),
					settings.value.tagNames
				);
				const visibilityChanged = locked.isPublic !== settings.value.isPublic;

				const message = draft.commitMessage.trim();
				if (!changed && !visibilityChanged && !tagsChanged && !message) return 'unchanged';

				if (tagsChanged) await syncTags(tx, recipe.id, settings.value.tagNames);

				if (changed || message) {
					await tx.insert(recipeVersions).values({
						recipeId: recipe.id,
						versionNumber: (latest?.versionNumber ?? 0) + 1,
						commitMessage:
							message ||
							generatedCommitMessage(latest ? changedGroups(latest, submitted) : ['title']),
						...submitted,
						createdBy: user.id
					});
				}

				// One update: the copies when the content changed, the settings that
				// moved, and always the revision bump.
				await tx
					.update(recipes)
					.set({
						...(changed ? copies : {}),
						...(visibilityChanged ? { isPublic: settings.value.isPublic } : {}),
						editRevision: sql`${recipes.editRevision} + 1`,
						updatedAt: new Date()
					})
					.where(eq(recipes.id, recipe.id));
				return 'saved';
			});
		} catch (e) {
			console.error('Could not save recipe', e);
			if (image) await removeRecipeImage(supabase, image.path);
			return fail(500, { error: 'Could not save the recipe. Please try again.', draft });
		}

		if (outcome === 'stale' || outcome === 'forbidden') {
			if (image) await removeRecipeImage(supabase, image.path);
			if (outcome === 'forbidden') throw error(403, 'Not authorized');
			return fail(409, { error: STALE_MESSAGE, draft });
		}
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
