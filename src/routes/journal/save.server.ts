import type { SupabaseClient } from '@supabase/supabase-js';
import type { UploadedImage } from '#lib/server/images.js';
import { storePhoto } from '#lib/server/submission.js';
import { parseEntryForm, resolveRecipe, type EntryFields } from '#lib/server/journal.js';
import { ENTRY_MESSAGES, KEEP_SOURCE } from '#lib/journal.js';
import { entryFailure } from './entryForm.js';

type Stored = { recipeId: number | null; versionId: number | null };

/**
 * The Add to Journal and edit forms' shared save: the fields checked, the
 * recipe resolved against what the viewer may see, and the photo stored. A
 * refusal comes back ready to return. `stored` is the entry being edited,
 * whose source KEEP_SOURCE keeps.
 */
export async function prepareEntry(
	formData: FormData,
	user: { id: string },
	supabase: SupabaseClient,
	stored: Stored | null = null
): Promise<
	| { ok: false; failure: ReturnType<typeof entryFailure> }
	| { ok: true; fields: EntryFields; source: Stored; image: UploadedImage | null }
> {
	const parsed = parseEntryForm(formData);
	if (!parsed.ok)
		return { ok: false, failure: entryFailure(400, 'invalid', parsed.error, formData) };
	const fields = parsed.value;

	let source: Stored = { recipeId: null, versionId: null };
	if (fields.recipe === KEEP_SOURCE && stored) {
		source = { recipeId: stored.recipeId, versionId: stored.versionId };
	} else if (fields.recipe) {
		const link = await resolveRecipe(user, fields.recipe, fields.version);
		if (!link)
			return {
				ok: false,
				failure: entryFailure(400, 'invalid', ENTRY_MESSAGES.recipeUnavailable, formData)
			};
		source = { recipeId: link.recipeId, versionId: link.versionId };
	}

	const photo = await storePhoto(formData, supabase, user.id);
	if (!photo.ok)
		return { ok: false, failure: entryFailure(400, photo.code, photo.error, formData) };
	return { ok: true, fields, source, image: photo.image };
}
