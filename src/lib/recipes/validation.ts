import { error } from '@sveltejs/kit';
import { z } from 'zod';
import type { Ingredient, Step } from './types.js';

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

const ingredientSchema = z.object({
	amount: z.string().trim().default(''),
	unit: z.string().trim().default(''),
	name: z.string().trim().min(1, 'Each ingredient needs a name')
});

const annotationSchema = z.object({
	type: z.enum(['tip', 'warning', 'substitution'], 'Unknown annotation type'),
	text: z.string().trim()
});

const stepSchema = z.object({
	text: z.string().trim().min(1, 'Each step needs text'),
	annotation: annotationSchema.optional()
});

// Steps are renumbered from 1 and keep only known fields. An annotation the
// editor added but left blank is dropped rather than rejected.
const stepsSchema = z
	.array(stepSchema)
	.min(1, 'At least one step is required')
	.transform((steps) =>
		steps.map(({ text, annotation }, i): Step => {
			const step: Step = { step: i + 1, text };
			if (annotation?.text) step.annotation = annotation;
			return step;
		})
	);

const contentSchema = z.object({
	ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required'),
	steps: stepsSchema
});

export type RecipeMeta = z.output<typeof metaSchema>;
export type RecipeContent = { ingredients: Ingredient[]; steps: Step[] };

function text(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value : '';
}

function json(formData: FormData, key: string): unknown {
	try {
		return JSON.parse(text(formData, key));
	} catch {
		throw error(400, 'Invalid ingredient or step data');
	}
}

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
	const result = schema.safeParse(input);
	if (!result.success) throw error(400, result.error.issues[0].message);
	return result.data;
}

/** Recipe metadata (the in-place-edited `recipes` row), from a submitted form. */
export function parseRecipeMeta(formData: FormData): RecipeMeta {
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

/** Versioned recipe content (ingredients and steps), from JSON fields in a submitted form. */
export function parseRecipeContent(formData: FormData): RecipeContent {
	return parse(contentSchema, {
		ingredients: json(formData, 'ingredients'),
		steps: json(formData, 'steps')
	});
}
