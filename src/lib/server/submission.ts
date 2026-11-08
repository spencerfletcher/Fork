import { fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { draftOf, parseDraftContent, parseSettings, photoError } from '#lib/recipes/validation.js';
import { imageFileFrom, uploadRecipeImage } from '#lib/server/images.js';
import type { RecipeDraft } from '#lib/recipes/validation.js';

// The recipe editor's submission, shared by the new and edit actions. Parsing
// and the upload are two steps because each action does its own check between
// them (new ensures the profile, edit refuses a stale tab) before any file is
// stored. Every failure hands the draft back, so nothing typed is lost.

/** Why a save failed, for code that branches on it; `error` is what the reader sees. */
export type SaveFailureCode =
	'invalid' | 'stale' | 'upload_failed' | 'save_failed' | 'unauthenticated';

/** A save's failure in the editor's shape: the message, its code and the draft as typed. */
export function saveFailure(
	status: number,
	code: SaveFailureCode,
	error: string,
	draft: RecipeDraft
) {
	return fail(status, { error, code, draft });
}

/** The draft exactly as typed, its parsed content and its settings; or the 400 to return. */
export function readSubmission(formData: FormData) {
	const draft = draftOf(formData);
	const content = parseDraftContent(draft);
	if (!content.ok)
		return { ok: false as const, failure: saveFailure(400, 'invalid', content.error, draft) };
	const settings = parseSettings(formData);
	if (!settings.ok)
		return { ok: false as const, failure: saveFailure(400, 'invalid', settings.error, draft) };
	return { ok: true as const, draft, content: content.value, settings: settings.value };
}

/** Stores the chosen photo, if one was chosen; or the 400 to return. Storage is
 *  outside the transaction, so the caller removes it on a failed save. */
export async function uploadPhoto(
	formData: FormData,
	supabase: SupabaseClient,
	userId: string,
	draft: RecipeDraft
) {
	const file = imageFileFrom(formData);
	if (!file) return { ok: true as const, image: null };
	const refused = photoError(file);
	if (refused) return { ok: false as const, failure: saveFailure(400, 'invalid', refused, draft) };
	try {
		return { ok: true as const, image: await uploadRecipeImage(supabase, userId, file) };
	} catch {
		return {
			ok: false as const,
			failure: saveFailure(400, 'upload_failed', 'Photo upload failed. Try again.', draft)
		};
	}
}
