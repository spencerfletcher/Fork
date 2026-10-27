import { z } from 'zod';
import type { Ingredient, Step, RecipeContent } from './types.js';
import { parseIngredientText } from './ingredients.js';
import { parseStepText } from './steps.js';
import { MAX_FIELD, MAX_LINE, FIELD_TOO_LONG, LINE_TOO_LONG } from './limits.js';

// Largest value a Postgres `integer` column holds.
const INT4_MAX = 2_147_483_647;

/** A whole number from a text input: blank is absent, otherwise digits only within [min, INT4_MAX]. */
const optionalInt = (min: number, label: string) =>
	z
		.string()
		.trim()
		.regex(/^\d*$/, `${label} must be a whole number`)
		.transform((s) => (s === '' ? null : Number(s)))
		.pipe(
			z
				.number()
				.min(min, `${label} must be at least ${min}`)
				.max(INT4_MAX, `${label} is too large`)
				.nullable()
		);

const textSchema = z.object({
	ingredients: z
		.string()
		.max(MAX_FIELD, FIELD_TOO_LONG('Ingredients'))
		.refine((s) => s.split('\n').every((line) => line.length <= MAX_LINE), LINE_TOO_LONG)
		.transform(parseIngredientText)
		.pipe(z.array(z.custom<Ingredient>()).min(1, 'At least one ingredient is required')),
	steps: z
		.string()
		.max(MAX_FIELD, FIELD_TOO_LONG('Steps'))
		.transform(parseStepText)
		.pipe(z.array(z.custom<Step>()).min(1, 'At least one step is required'))
});

const recipeContentSchema = z.object({
	title: z.string().trim().min(1, 'Title is required'),
	description: z
		.string()
		.trim()
		.transform((s) => s || null),
	servings: optionalInt(1, 'Servings'),
	prepTimeMinutes: optionalInt(0, 'Prep time'),
	cookTimeMinutes: optionalInt(0, 'Cook time'),
	...textSchema.shape
});

/** What a parser hands back: the typed value, or the first message to show the user. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

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

export function parseContent(formData: FormData): Result<RecipeContent> {
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
	tagNames: z.array(z.string()).transform((names) => {
		const seen = new Set<string>();
		return names
			.map((n) => n.trim())
			.filter((n) => n !== '' && !seen.has(n.toLowerCase()) && !!seen.add(n.toLowerCase()));
	})
});

export function parseSettings(formData: FormData): Result<Settings> {
	return parse(settingsSchema, {
		isPublic: formData.get('isPublic') === 'on',
		tagNames: formData.getAll('tags').filter((t): t is string => typeof t === 'string')
	});
}
/** Tag names as submitted, before any trimming or deduplication. */
function tagsOf(formData: FormData): string[] {
	return formData.getAll('tags').filter((t): t is string => typeof t === 'string');
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
