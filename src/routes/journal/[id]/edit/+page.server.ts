import { error, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { logEntries } from '#lib/server/db/schema.js';
import { ownEntry, recipeChoices } from '#lib/server/journal.js';
import { KEEP_SOURCE } from '#lib/journal.js';
import { imagePathOf, removeRecipeImage } from '#lib/server/images.js';
import { failure, requireUser, SESSION_ENDED } from '#lib/server/actions.js';
import { wholeNumber } from '#lib/helpers.js';
import { entryFailure, type EntryValues, type RecipeChoice } from '../../entryForm.js';
import { prepareEntry } from '../../save.server.js';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Entry not found';

/** The viewer's own entry at the `id` param, with its source; a 404 for a bad id or anyone else's. */
async function entryAt(user: { id: string }, param: string) {
	const id = wholeNumber(param);
	const entry = id === null ? null : await ownEntry(user, id);
	if (!entry) throw error(404, NOT_FOUND);
	return entry;
}

export const load: PageServerLoad = async ({ params, url, locals: { user } }) => {
	requireUser(url, user);
	const [entry, choices] = await Promise.all([entryAt(user, params.id), recipeChoices(user)]);

	const { source } = entry;
	let offered: RecipeChoice[] = choices;
	if (source.kind === 'recipe' && !choices.some((c) => c.slug === source.slug)) {
		offered = [
			{
				slug: source.slug,
				title: source.title,
				visibility: source.visibility,
				latestVersion: source.versionNumber
			},
			...choices
		];
	}
	// A deleted or withheld recipe cannot be offered by name; the form keeps it as stored.
	const keepLabel =
		source.kind === 'deleted'
			? 'Recipe deleted'
			: source.kind === 'hidden'
				? 'A recipe no longer shared with you'
				: null;

	const values: EntryValues = {
		dish: entry.dish,
		cookedOn: entry.cookedOn,
		servings: entry.servings === null ? '' : String(entry.servings),
		caption: entry.caption ?? '',
		note: entry.note ?? '',
		audience: entry.audience,
		recipe: source.kind === 'recipe' ? source.slug : keepLabel ? KEEP_SOURCE : '',
		version: source.kind === 'recipe' && source.versionNumber ? String(source.versionNumber) : '',
		link: source.kind === 'link' ? source.url : ''
	};

	return {
		id: entry.id,
		values,
		choices: offered,
		keepLabel,
		photoUrl: entry.photoUrl,
		meta: { title: `Edit ${entry.dish}` }
	};
};

export const actions: Actions = {
	save: async ({ params, request, locals: { user, supabase } }) => {
		const formData = await request.formData();
		if (!user) return entryFailure(401, 'unauthenticated', SESSION_ENDED('try again'), formData);
		const stored = await entryAt(user, params.id);

		const prepared = await prepareEntry(formData, user, supabase, stored);
		if (!prepared.ok) return prepared.failure;
		const { fields, source, image } = prepared;
		const removing = formData.get('removeImage') === 'on';
		const photoUrl = image ? image.url : removing ? null : stored.photoUrl;

		try {
			await db
				.update(logEntries)
				.set({
					...source,
					dish: fields.dish,
					cookedOn: fields.cookedOn,
					servings: fields.servings,
					photoUrl,
					caption: fields.caption,
					note: fields.note,
					audience: fields.audience,
					sourceUrl: fields.sourceUrl
				})
				.where(and(eq(logEntries.id, stored.id), eq(logEntries.userId, user.id)));
		} catch (e) {
			console.error('Could not save log entry', e);
			if (image) await removeRecipeImage(supabase, image.path);
			return entryFailure(500, 'save_failed', 'Could not save the entry. Try again.', formData);
		}

		// The old photo, once nothing points at it.
		const oldPath =
			stored.photoUrl && photoUrl !== stored.photoUrl ? imagePathOf(stored.photoUrl) : null;
		if (oldPath) await removeRecipeImage(supabase, oldPath);

		throw redirect(303, `/journal?logged=${stored.id}`);
	},

	deleteEntry: async ({ params, locals: { user, supabase } }) => {
		if (!user) return failure(401, 'unauthenticated', SESSION_ENDED('delete again'));
		const stored = await entryAt(user, params.id);
		await db
			.delete(logEntries)
			.where(and(eq(logEntries.id, stored.id), eq(logEntries.userId, user.id)));
		const path = stored.photoUrl ? imagePathOf(stored.photoUrl) : null;
		if (path) await removeRecipeImage(supabase, path);
		throw redirect(303, '/journal?deleted=1');
	}
};
