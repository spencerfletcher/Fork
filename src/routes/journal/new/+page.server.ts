import { redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { logEntries } from '#lib/server/db/schema.js';
import { defaultAudience, recipeChoices, resolveRecipe } from '#lib/server/journal.js';
import { removeRecipeImage } from '#lib/server/images.js';
import { ensureProfile } from '#lib/server/profiles.js';
import { requireUser, SESSION_ENDED } from '#lib/server/actions.js';
import { wholeNumber } from '#lib/helpers.js';
import { entryFailure, type EntryValues, type RecipeChoice } from '../entryForm.js';
import { prepareEntry } from '../save.server.js';
import type { Actions, PageServerLoad } from './$types';

const digits = (value: string | null) => (value && wholeNumber(value) !== null ? value : '');

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	requireUser(url, user);

	// Cook's "Add to Journal" sends ?recipe=<slug>&version=<n>&serves=<n>.
	const slug = url.searchParams.get('recipe');
	const version = digits(url.searchParams.get('version'));
	const [linked, choices, audience] = await Promise.all([
		slug ? resolveRecipe(user, slug, version ? Number(version) : null) : null,
		recipeChoices(user),
		defaultAudience(user.id)
	]);

	// A recipe reached by link (a friend's, not saved) is offered too.
	const offered: RecipeChoice[] =
		linked && !choices.some((c) => c.slug === linked.slug)
			? [
					{
						slug: linked.slug,
						title: linked.title,
						visibility: linked.visibility,
						latestVersion: linked.versionNumber
					},
					...choices
				]
			: choices;

	const values: EntryValues = {
		dish: linked?.title ?? '',
		// The page sets the reader's own today once it runs; this is the server's.
		cookedOn: new Date().toISOString().slice(0, 10),
		servings: linked ? digits(url.searchParams.get('serves')) : '',
		caption: '',
		note: '',
		audience,
		recipe: linked?.slug ?? '',
		version: linked ? String(linked.versionNumber) : '',
		link: ''
	};

	return { values, choices: offered, meta: { title: 'Add to Journal' } };
};

export const actions: Actions = {
	default: async ({ request, locals: { user, supabase } }) => {
		const formData = await request.formData();
		if (!user) return entryFailure(401, 'unauthenticated', SESSION_ENDED('try again'), formData);

		// Before the upload, so a profile failure cannot orphan a stored file.
		try {
			await ensureProfile(user);
		} catch (e) {
			console.error('Could not ensure profile', e);
			return entryFailure(500, 'save_failed', 'Could not save the entry. Try again.', formData);
		}

		const prepared = await prepareEntry(formData, user, supabase);
		if (!prepared.ok) return prepared.failure;
		const { fields, source, image } = prepared;

		let id: number;
		try {
			const [row] = await db
				.insert(logEntries)
				.values({
					userId: user.id,
					...source,
					dish: fields.dish,
					cookedOn: fields.cookedOn,
					servings: fields.servings,
					photoUrl: image?.url ?? null,
					caption: fields.caption,
					note: fields.note,
					audience: fields.audience,
					sourceUrl: fields.sourceUrl
				})
				.returning({ id: logEntries.id });
			id = row.id;
		} catch (e) {
			console.error('Could not save log entry', e);
			if (image) await removeRecipeImage(supabase, image.path);
			return entryFailure(500, 'save_failed', 'Could not save the entry. Try again.', formData);
		}

		throw redirect(303, `/journal?logged=${id}`);
	}
};
