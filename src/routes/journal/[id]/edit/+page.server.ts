import { error, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { logEntries } from '#lib/server/db/schema.js';
import { KEEP_SOURCE, ownEntry, recipeChoices } from '#lib/server/journal.js';
import { imagePathOf, removeRecipeImage } from '#lib/server/images.js';
import { loginHref } from '#lib/auth/loginHref.js';
import { entryFailure, type EntryValues, type RecipeChoice } from '../../entryForm.js';
import { prepareEntry } from '../../save.server.js';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Entry not found';

function idOf(param: string): number {
	if (!/^\d+$/.test(param)) throw error(404, NOT_FOUND);
	return Number(param);
}

export const load: PageServerLoad = async ({ params, url, locals: { user } }) => {
	if (!user) throw redirect(303, loginHref(url.pathname + url.search));
	const [entry, choices] = await Promise.all([
		ownEntry(user, idOf(params.id)),
		recipeChoices(user)
	]);
	if (!entry) throw error(404, NOT_FOUND);

	const { source } = entry;
	let offered: RecipeChoice[] = choices;
	if (source.kind === 'recipe' && !choices.some((c) => c.slug === source.slug)) {
		offered = [
			{ slug: source.slug, title: source.title, visibility: source.visibility },
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
		version: source.kind === 'recipe' && source.versionNumber ? String(source.versionNumber) : ''
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

/** The viewer's own stored row, or a 404 for anyone else's id. */
async function storedRow(userId: string, id: number) {
	const [row] = await db
		.select()
		.from(logEntries)
		.where(and(eq(logEntries.id, id), eq(logEntries.userId, userId)))
		.limit(1);
	if (!row) throw error(404, NOT_FOUND);
	return row;
}

export const actions: Actions = {
	save: async ({ params, request, locals: { user, supabase } }) => {
		const formData = await request.formData();
		if (!user)
			return entryFailure(
				401,
				'unauthenticated',
				'Your session ended. Log in in another tab, then try again.',
				formData
			);
		const stored = await storedRow(user.id, idOf(params.id));

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
					audience: fields.audience
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
		if (!user) throw error(401, 'Login required');
		const stored = await storedRow(user.id, idOf(params.id));
		await db
			.delete(logEntries)
			.where(and(eq(logEntries.id, stored.id), eq(logEntries.userId, user.id)));
		const path = stored.photoUrl ? imagePathOf(stored.photoUrl) : null;
		if (path) await removeRecipeImage(supabase, path);
		throw redirect(303, '/journal?deleted=1');
	}
};
