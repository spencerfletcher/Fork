import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { parseContent, parseSettings, draftOf } from '#lib/recipes/validation.js';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { contentChanged, changedGroups, generatedCommitMessage } from '#lib/recipes/content.js';
import {
	imageFileFrom,
	uploadRecipeImage,
	removeRecipeImage,
	type UploadedImage
} from '#lib/server/images.js';
import { syncTags } from '#lib/server/tags.js';

const STALE_MESSAGE =
	'This recipe was changed in another tab. Reload to see the latest version, then reapply your edits.';

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
	// One save for the whole edit form: settings are updated in place, and a
	// new version is appended only when the content actually changed.
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
		const content = parseContent(formData);
		if (!content.ok) return fail(400, { error: content.error, draft });
		const settings = parseSettings(formData);
		if (!settings.ok) return fail(400, { error: settings.error, draft });

		if (!/^\d+$/.test(draft.editRevision)) {
			return fail(400, { error: 'Invalid form state, reload the page', draft });
		}
		const editRevision = Number(draft.editRevision);

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

		const { title, description, servings, prepTimeMinutes, cookTimeMinutes } = content.value;
		const copies = { title, description, servings, prepTimeMinutes, cookTimeMinutes };

		let outcome: 'stale' | 'saved' | 'unchanged';
		try {
			outcome = await db.transaction(async (tx) => {
				// Serialise saves on this recipe; nothing is read before the lock.
				const [locked] = await tx
					.select()
					.from(recipes)
					.where(eq(recipes.id, recipe.id))
					.for('update');
				if (!locked || locked.authorId !== user.id) throw error(403, 'Not authorized');
				if (locked.editRevision !== editRevision) return 'stale';

				const latest = await tx.query.recipeVersions.findFirst({
					where: eq(recipeVersions.recipeId, recipe.id),
					orderBy: [desc(recipeVersions.versionNumber)]
				});

				const changed = latest ? contentChanged(latest, content.value) : true;

				const storedTags = new Set(recipe.recipesToTags.map((r) => r.tag.name.toLowerCase()));
				const submittedTags = new Set(settings.value.tagNames.map((n) => n.toLowerCase()));
				const tagsChanged =
					storedTags.size !== submittedTags.size ||
					[...submittedTags].some((n) => !storedTags.has(n));
				const imageChanged = image !== null || (draft.removeImage && locked.imageUrl !== null);
				const visibilityChanged = locked.isPublic !== settings.value.isPublic;

				if (!changed && !imageChanged && !visibilityChanged && !tagsChanged) return 'unchanged';

				if (tagsChanged) await syncTags(tx, recipe.id, settings.value.tagNames);

				if (changed) {
					await tx.insert(recipeVersions).values({
						recipeId: recipe.id,
						versionNumber: (latest?.versionNumber ?? 0) + 1,
						commitMessage:
							draft.commitMessage.trim() ||
							generatedCommitMessage(latest ? changedGroups(latest, content.value) : ['title']),
						...content.value,
						createdBy: user.id
					});
				}

				// One update: the copies when the content changed, the settings that
				// moved, and always the revision bump.
				await tx
					.update(recipes)
					.set({
						...(changed ? copies : {}),
						...(image ? { imageUrl: image.url } : {}),
						...(draft.removeImage && !image ? { imageUrl: null } : {}),
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

		if (outcome === 'stale') {
			if (image) await removeRecipeImage(supabase, image.path);
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
