import type { SupabaseClient } from '@supabase/supabase-js';
import {
	capError,
	draftOf,
	parseDraftContent,
	parseSettings,
	photoError,
	PHOTO_TYPE_MESSAGE
} from '#lib/recipes/validation.js';
import {
	imageFileFrom,
	photoTypeOf,
	uploadRecipeImage,
	UnreadablePhoto,
	type UploadedImage
} from '#lib/server/images.js';
import { failure, type FailureCode } from '#lib/server/actions.js';
import type { CapBefore, RecipeDraft } from '#lib/recipes/validation.js';

// The recipe editor's submission, shared by the new and edit actions. Parsing
// and the upload are two steps because each action does its own check between
// them (new ensures the profile, edit refuses a stale tab) before any file is
// stored. Every failure hands the draft back, so nothing typed is lost.
// storePhoto is the journal forms' photo step too.

/** What a save from a tab behind the recipe's latest edit is told. */
export const STALE_MESSAGE =
	'This recipe was changed in another tab. Reload to see the latest version, then reapply your edits.';

/**
 * The draft exactly as typed, its parsed content and its settings; or the 400
 * to return. An edit passes what the recipe has now, `before`, so a long value
 * saved before the caps is never what refuses it.
 */
export function readSubmission(formData: FormData, before?: CapBefore) {
	const draft = draftOf(formData);
	const content = parseDraftContent(draft);
	if (!content.ok)
		return { ok: false as const, failure: failure(400, 'invalid', content.error, { draft }) };
	const settings = parseSettings(formData);
	if (!settings.ok)
		return { ok: false as const, failure: failure(400, 'invalid', settings.error, { draft }) };
	const capped = capError(
		{ ...content.value, commitMessage: draft.commitMessage, tagNames: settings.value.tagNames },
		before
	);
	if (capped) return { ok: false as const, failure: failure(400, 'invalid', capped, { draft }) };
	return { ok: true as const, draft, content: content.value, settings: settings.value };
}

export const PHOTO_UPLOAD_FAILED = 'Photo upload failed. Try again.';

/**
 * Stores the photo chosen in `formData`, if one was chosen; or why it was
 * refused, for the caller's own failure shape. Storage is outside any
 * transaction, so the caller removes the image when its save then fails.
 */
export async function storePhoto(
	formData: FormData,
	supabase: SupabaseClient,
	userId: string
): Promise<
	{ ok: true; image: UploadedImage | null } | { ok: false; code: FailureCode; error: string }
> {
	const file = imageFileFrom(formData);
	if (!file) return { ok: true, image: null };
	const refused = photoError(file);
	if (refused) return { ok: false, code: 'invalid', error: refused };
	const type = await photoTypeOf(file);
	if (type === null) return { ok: false, code: 'invalid', error: PHOTO_TYPE_MESSAGE };
	try {
		return { ok: true, image: await uploadRecipeImage(supabase, userId, file, type) };
	} catch (e) {
		if (e instanceof UnreadablePhoto)
			return { ok: false, code: 'invalid', error: PHOTO_TYPE_MESSAGE };
		return { ok: false, code: 'upload_failed', error: PHOTO_UPLOAD_FAILED };
	}
}

/** Stores the chosen photo, if one was chosen; or the 400 to return. Storage is
 *  outside the transaction, so the caller removes it on a failed save. */
export async function uploadPhoto(
	formData: FormData,
	supabase: SupabaseClient,
	userId: string,
	draft: RecipeDraft
) {
	const photo = await storePhoto(formData, supabase, userId);
	if (!photo.ok)
		return { ok: false as const, failure: failure(400, photo.code, photo.error, { draft }) };
	return { ok: true as const, image: photo.image };
}
