import { failure, type FailureCode } from '#lib/server/actions.js';
import { oneOf, text } from '#lib/helpers.js';
import { LOG_AUDIENCES, type LogAudience } from '#lib/server/db/schema.js';
import type { recipeChoices } from '#lib/server/journal.js';

/** The form's fields as typed, for prefill and for handing back after a refusal. */
export type EntryValues = {
	dish: string;
	cookedOn: string;
	servings: string;
	caption: string;
	note: string;
	audience: LogAudience;
	recipe: string;
	version: string;
	link: string;
};

/** One recipe the form offers; its latestVersion is shown beside the title, and picking it links that version. */
export type RecipeChoice = Awaited<ReturnType<typeof recipeChoices>>[number];

function valuesOf(formData: FormData): EntryValues {
	return {
		dish: text(formData, 'dish'),
		cookedOn: text(formData, 'cookedOn'),
		servings: text(formData, 'servings'),
		caption: text(formData, 'caption'),
		note: text(formData, 'note'),
		audience: oneOf(LOG_AUDIENCES, text(formData, 'audience')) ?? 'private',
		recipe: text(formData, 'recipe'),
		version: text(formData, 'version'),
		link: text(formData, 'link')
	};
}

/** A refused save in the API's shape, with everything typed handed back. */
export function entryFailure(status: number, code: FailureCode, error: string, formData: FormData) {
	return failure(status, code, error, { values: valuesOf(formData) });
}
