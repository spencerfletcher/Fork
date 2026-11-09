import { failure, type FailureCode } from '#lib/server/actions.js';
import { oneOf, text } from '#lib/helpers.js';
import { LOG_AUDIENCES, type LogAudience } from '#lib/server/db/schema.js';

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

/** One recipe the form offers. */
export type RecipeChoice = {
	slug: string;
	title: string;
	visibility: 'private' | 'friends' | 'public';
	/** Shown beside the title; picking a recipe links its latest version. */
	latestVersion: number | null;
};

export function valuesOf(formData: FormData): EntryValues {
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
