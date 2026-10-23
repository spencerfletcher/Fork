import { z } from 'zod';
import type { Ingredient, Step } from './types.js';
import { parseIngredientText } from './ingredients.js';
import { parseStepText } from './steps.js';

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

const metaSchema = z.object({
	title: z.string().trim().min(1, 'Title is required'),
	description: z
		.string()
		.trim()
		.transform((s) => s || null),
	servings: optionalInt(1, 'Servings'),
	prepTimeMinutes: optionalInt(0, 'Prep time'),
	cookTimeMinutes: optionalInt(0, 'Cook time'),
	isPublic: z.boolean(),
	tagNames: z.array(z.string())
});

// parse-ingredient's run time grows with the square of a line's length, so a
// line is capped before it reaches the parser; the whole fields are capped so a
// save cannot carry an arbitrarily large body.
const MAX_LINE = 300;
const MAX_FIELD = 20_000;

const contentSchema = z.object({
	ingredients: z
		.string()
		.max(MAX_FIELD, 'Ingredients are too long (20,000 characters max)')
		.refine(
			(s) => s.split('\n').every((line) => line.length <= MAX_LINE),
			'An ingredient line is too long (300 characters max)'
		)
		.transform(parseIngredientText)
		.pipe(z.array(z.custom<Ingredient>()).min(1, 'At least one ingredient is required')),
	steps: z
		.string()
		.max(MAX_FIELD, 'Steps are too long (20,000 characters max)')
		.transform(parseStepText)
		.pipe(z.array(z.custom<Step>()).min(1, 'At least one step is required'))
});

export type RecipeMeta = z.output<typeof metaSchema>;
export type RecipeContent = { ingredients: Ingredient[]; steps: Step[] };

/** What a parser hands back: the typed value, or the first message to show the user. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function text(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value : '';
}

function parse<T>(schema: z.ZodType<T>, input: unknown): Result<T> {
	const result = schema.safeParse(input);
	return result.success
		? { ok: true, value: result.data }
		: { ok: false, error: result.error.issues[0].message };
}

/** Recipe metadata (the in-place-edited `recipes` row), from a submitted form. */
export function parseRecipeMeta(formData: FormData): Result<RecipeMeta> {
	return parse(metaSchema, {
		title: text(formData, 'title'),
		description: text(formData, 'description'),
		servings: text(formData, 'servings'),
		prepTimeMinutes: text(formData, 'prepTimeMinutes'),
		cookTimeMinutes: text(formData, 'cookTimeMinutes'),
		isPublic: formData.get('isPublic') === 'on',
		tagNames: formData.getAll('tags').filter((t): t is string => typeof t === 'string')
	});
}

/** Versioned recipe content (ingredients and steps), from text fields in a submitted form. */
export function parseRecipeContent(formData: FormData): Result<RecipeContent> {
	return parse(contentSchema, {
		ingredients: text(formData, 'ingredients'),
		steps: text(formData, 'steps')
	});
}
