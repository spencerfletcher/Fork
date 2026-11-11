import { error, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { draftOf } from '#lib/recipes/validation.js';
import { and, eq, desc, isNull, sql } from 'drizzle-orm';
import { appendVersion, commitSave, lockForSave } from '#lib/server/versions.js';
import type { PageServerLoad, Actions } from './$types';
import {
	changedGroups,
	generatedCommitMessage,
	recipeCopies,
	type ContentGroup
} from '#lib/recipes/content.js';
import { sameTags } from '#lib/recipes/tags.js';
import type { RecipeContent } from '#lib/recipes/types.js';
import { removeRecipeImage } from '#lib/server/images.js';
import { readSubmission, STALE_MESSAGE, uploadPhoto } from '#lib/server/submission.js';
import { BAD_FORM, failure, requireUser, signedOut } from '#lib/server/actions.js';
import { wholeNumber } from '#lib/helpers.js';
import { syncTags, listTags } from '#lib/server/tags.js';
import { grantKeptCopies } from '#lib/server/keptCopies.js';
import {
	canSetVisibility,
	canViewRow,
	LOST_PARENT_ACCESS,
	NOT_AUTHORIZED,
	ownRecipe,
	WIDENS_PARENT
} from '#lib/server/visibility.js';

export const load: PageServerLoad = async ({ params, url, locals: { user } }) => {
	requireUser(url, user);

	const recipe = await ownRecipe(params.slug, user.id, {
		recipesToTags: { with: { tag: true } },
		versions: { orderBy: [desc(recipeVersions.versionNumber)], limit: 1 }
	});
	// Creation and forking write version 1 with the recipe, so there is always one.
	const latestVersion = recipe.versions[0];

	// Any visibility: the forks hint is about whether forks exist, not who sees
	// them. A fork in the Trash does not count.
	const [allTags, forkCount] = await Promise.all([
		listTags(),
		db.$count(recipes, and(eq(recipes.parentId, recipe.id), isNull(recipes.deletedAt)))
	]);

	return {
		recipe,
		latestVersion,
		allTags,
		forkCount,
		meta: { title: `Edit ${latestVersion.title}`, noindex: true }
	};
};

export const actions: Actions = {
	// One save for the whole edit form: settings are updated in place, and a
	// new version is appended when the content changed or a message was typed,
	// which is never dropped.
	save: async ({ params, request, locals: { user, supabase } }) => {
		const formData = await request.formData();
		// A lapsed session hands the draft back too, so logging in again loses nothing.
		if (!user)
			return signedOut('save again', {
				draft: draftOf(formData)
			});
		const recipe = await ownRecipe(params.slug, user.id, {
			recipesToTags: { with: { tag: true } },
			parent: { columns: { visibility: true, authorId: true, deletedAt: true } }
		});

		const submission = readSubmission(formData);
		if (!submission.ok) return submission.failure;
		const { draft, content, settings } = submission;

		// Forks never widen access past both the parent, as the forker can see it
		// now, and the fork's own current audience, so a fork already wider than a
		// narrowed parent keeps saving. A Friends parent the forker lost sight of
		// counts as private.
		const { visibility } = settings;
		const { parent } = recipe;
		if (parent && parent.visibility !== 'public') {
			const lostAccess = parent.visibility === 'friends' && !(await canViewRow(parent, user));
			const seen = lostAccess ? 'private' : parent.visibility;
			if (!canSetVisibility(seen, recipe.visibility, visibility)) {
				const message = lostAccess ? LOST_PARENT_ACCESS : WIDENS_PARENT[parent.visibility];
				return failure(400, 'invalid', message, { draft });
			}
		}

		const editRevision = wholeNumber(draft.editRevision);
		if (editRevision === null) {
			return failure(400, 'invalid', BAD_FORM, { draft });
		}
		// A tab that is already stale need not upload its photo first; the check
		// that counts is the one under the row lock below.
		if (recipe.editRevision !== editRevision)
			return failure(409, 'stale', STALE_MESSAGE, { draft });

		const upload = await uploadPhoto(formData, supabase, user.id, draft);
		if (!upload.ok) return upload.failure;
		const { image } = upload;

		let outcome: 'stale' | 'forbidden' | 'saved' | 'unchanged';
		try {
			outcome = await db.transaction(async (tx) => {
				// Serialise saves on this recipe. The recipe row and its tags were read
				// before this lock only for auth and the tag comparison; any concurrent
				// change to either bumps editRevision, which is rechecked right here.
				const lock = await lockForSave(tx, recipe.id, user.id, editRevision);
				if (typeof lock === 'string') return lock;
				const { locked, latest } = lock;

				// The photo is content: a new upload or a removal changes the version.
				// Otherwise the latest version's photo carries forward unchanged.
				const imageUrl = image ? image.url : draft.removeImage ? null : (latest?.imageUrl ?? null);
				const submitted: RecipeContent = { ...content, imageUrl };
				const groups: ContentGroup[] = latest ? changedGroups(latest, submitted) : ['title'];
				const changed = groups.length > 0;
				const copies = recipeCopies(submitted);

				const tagsChanged = !sameTags(
					recipe.recipesToTags.map((r) => r.tag.name),
					settings.tagNames
				);
				const visibilityChanged = locked.visibility !== visibility;

				const message = draft.commitMessage.trim();
				if (!changed && !visibilityChanged && !tagsChanged && !message) return 'unchanged';

				if (tagsChanged) await syncTags(tx, recipe.id, settings.tagNames);
				// Unpublishing leaves each saver who could see it a read-only copy.
				if (visibilityChanged && visibility === 'private')
					await grantKeptCopies(tx, {
						id: recipe.id,
						authorId: user.id,
						visibility: locked.visibility
					});

				if (changed || message) {
					const commitMessage = message || generatedCommitMessage(groups);
					await appendVersion(tx, recipe.id, user.id, latest, submitted, commitMessage);
				}

				await commitSave(tx, recipe.id, {
					...(changed ? copies : {}),
					...(visibilityChanged ? { visibility } : {})
				});
				return 'saved';
			});
		} catch (e) {
			console.error('Could not save recipe', e);
			if (image) await removeRecipeImage(supabase, image.path);
			return failure(500, 'save_failed', 'Could not save the recipe. Try again.', { draft });
		}

		if (outcome === 'stale' || outcome === 'forbidden') {
			if (image) await removeRecipeImage(supabase, image.path);
			if (outcome === 'forbidden') throw error(403, NOT_AUTHORIZED);
			return failure(409, 'stale', STALE_MESSAGE, { draft });
		}
		throw redirect(303, `/recipes/${params.slug}`);
	},

	// To the Trash: hidden everywhere, restorable by the owner for TRASH_DAYS,
	// then deleted for good (#lib/server/trash.ts). The revision moves on, so a
	// save already past its ownRecipe check is refused as stale under its lock.
	deleteRecipe: async ({ params, locals: { user } }) => {
		if (!user) return signedOut('delete again');

		const recipe = await ownRecipe(params.slug, user.id);
		// Each saver who could see it keeps a read-only copy, granted under the
		// save's row lock from the audience the move ends, so a save changing it
		// meanwhile either lands first (and is read here) or waits.
		await db.transaction(async (tx) => {
			const [locked] = await tx
				.select({ visibility: recipes.visibility })
				.from(recipes)
				.where(eq(recipes.id, recipe.id))
				.for('update');
			if (locked && locked.visibility !== 'private')
				await grantKeptCopies(tx, {
					id: recipe.id,
					authorId: recipe.authorId,
					visibility: locked.visibility
				});
			await tx
				.update(recipes)
				.set({ deletedAt: new Date(), editRevision: sql`${recipes.editRevision} + 1` })
				.where(eq(recipes.id, recipe.id));
		});

		throw redirect(303, '/cookbook/trash');
	}
};
