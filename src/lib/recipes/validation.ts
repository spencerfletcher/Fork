import { z } from 'zod';
import type { Ingredient, Step, RecipeContent } from './types.js';
import { parseIngredientText } from './ingredients.js';
import { parseStepText } from './steps.js';
import { limitError } from './limits.js';
import { normaliseTagNames } from './tags.js';

// Largest value a Postgres `integer` column holds.
const INT4_MAX = 2_147_483_647;

/** The number fields: their name in messages, their floor, and what a whole one counts. */
export const NUMBER_FIELDS = {
	servings: { label: 'Servings', min: 1, unit: '' },
	prepTimeMinutes: { label: 'Prep time', min: 0, unit: ' of minutes' },
	cookTimeMinutes: { label: 'Cook time', min: 0, unit: ' of minutes' }
} as const;

export type NumberField = keyof typeof NUMBER_FIELDS;

/** What a number field says when it is not whole, or below its floor; the editor shows the same live. */
export function numberMessages(field: NumberField) {
	const { label, min, unit } = NUMBER_FIELDS[field];
	return {
		whole: `${label} must be a whole number${unit}`,
		belowMin: min === 0 ? `${label} can't be negative` : `${label} must be at least ${min}`
	};
}

/** A whole number from a text input: blank is absent, otherwise an integer within [min, INT4_MAX]. */
const optionalInt = (field: NumberField) => {
	const { label, min } = NUMBER_FIELDS[field];
	const messages = numberMessages(field);
	return (
		z
			.string()
			.trim()
			// The sign passes here so a negative is told it is below the floor.
			.regex(/^(-?\d+)?$/, messages.whole)
			.transform((s) => (s === '' ? null : Number(s)))
			.pipe(
				z.number().min(min, messages.belowMin).max(INT4_MAX, `${label} is too large`).nullable()
			)
	);
};

/** Raw editor text, refused with the same message the editor shows live. */
const bounded = (label: string, perLine: boolean) =>
	z.string().superRefine((s, ctx) => {
		const message = limitError(s, label, perLine);
		if (message) ctx.addIssue({ code: 'custom', message });
	});

const recipeContentSchema = z.object({
	title: z.string().trim().min(1, 'Title is required'),
	description: z
		.string()
		.trim()
		.transform((s) => s || null),
	servings: optionalInt('servings'),
	prepTimeMinutes: optionalInt('prepTimeMinutes'),
	cookTimeMinutes: optionalInt('cookTimeMinutes'),
	ingredients: bounded('Ingredients', true)
		.transform(parseIngredientText)
		.pipe(z.array(z.custom<Ingredient>()).min(1, 'At least one ingredient is required')),
	steps: bounded('Steps', false)
		.transform(parseStepText)
		.pipe(z.array(z.custom<Step>()).min(1, 'At least one step is required'))
});

/** What a parser hands back: the typed value, or the first message to show the user. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** The content fields a form carries as text. The photo is a file and is resolved by the action. */
export type ContentFields = Omit<RecipeContent, 'imageUrl'>;

export type Settings = {
	isPublic: boolean;
	tagNames: string[];
};

export type RecipeDraft = {
	title: string;
	description: string;
	servings: string;
	prepTimeMinutes: string;
	cookTimeMinutes: string;
	ingredients: string;
	steps: string;
	commitMessage: string;
	editRevision: string;
	isPublic: boolean;
	tags: string[];
	hadPhoto: boolean;
	removeImage: boolean;
};

/** A form field as a string: missing or non-string (a File) reads as empty. */
export function text(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value : '';
}

function parse<T>(schema: z.ZodType<T>, input: unknown): Result<T> {
	const result = schema.safeParse(input);
	return result.success
		? { ok: true, value: result.data }
		: { ok: false, error: result.error.issues[0].message };
}

/** The versioned content from the recipe form: title, description, servings, times, ingredients, steps. */
export function parseContent(formData: FormData): Result<ContentFields> {
	return parse(recipeContentSchema, {
		title: text(formData, 'title'),
		description: text(formData, 'description'),
		servings: text(formData, 'servings'),
		prepTimeMinutes: text(formData, 'prepTimeMinutes'),
		cookTimeMinutes: text(formData, 'cookTimeMinutes'),
		ingredients: text(formData, 'ingredients'),
		steps: text(formData, 'steps')
	});
}

const settingsSchema = z.object({
	isPublic: z.boolean(),
	tagNames: z.array(z.string()).transform(normaliseTagNames)
});

/** The same content parse, fed from the form's own draft strings instead of FormData. */
export function parseDraftContent(draft: RecipeDraft): Result<ContentFields> {
	return parse(recipeContentSchema, {
		title: draft.title,
		description: draft.description,
		servings: draft.servings,
		prepTimeMinutes: draft.prepTimeMinutes,
		cookTimeMinutes: draft.cookTimeMinutes,
		ingredients: draft.ingredients,
		steps: draft.steps
	});
}

/** Tag names as submitted, before any trimming or deduplication. */
function tagsOf(formData: FormData): string[] {
	return formData.getAll('tags').filter((t): t is string => typeof t === 'string');
}

/** The recipe-level settings from the form: visibility and tags. The photo is a file, handled by the action. */
export function parseSettings(formData: FormData): Result<Settings> {
	return parse(settingsSchema, {
		isPublic: formData.get('isPublic') === 'on',
		tagNames: tagsOf(formData)
	});
}

/**
 * Every submitted field exactly as typed, so a failed save can hand the form
 * back what the user entered, invalid values included. Nothing here is
 * validated or trimmed; that is the parsers' job.
 */
export function draftOf(formData: FormData): RecipeDraft {
	const image = formData.get('image');
	return {
		title: text(formData, 'title'),
		description: text(formData, 'description'),
		servings: text(formData, 'servings'),
		prepTimeMinutes: text(formData, 'prepTimeMinutes'),
		cookTimeMinutes: text(formData, 'cookTimeMinutes'),
		ingredients: text(formData, 'ingredients'),
		steps: text(formData, 'steps'),
		commitMessage: text(formData, 'commitMessage'),
		editRevision: text(formData, 'editRevision'),
		isPublic: formData.get('isPublic') === 'on',
		tags: tagsOf(formData),
		// The file itself cannot be echoed back; the page uses this to say so.
		hadPhoto: image instanceof File && image.size > 0,
		removeImage: formData.get('removeImage') === 'on'
	};
}
