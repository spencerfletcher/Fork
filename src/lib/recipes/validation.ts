import { error } from '@sveltejs/kit';
import type { Ingredient, Step, StepAnnotationType } from './types.js';

const ANNOTATION_TYPES: readonly StepAnnotationType[] = ['tip', 'warning', 'substitution'];

export type RecipeMeta = {
	title: string;
	description: string | null;
	servings: number | null;
	prepTimeMinutes: number | null;
	cookTimeMinutes: number | null;
	isPublic: boolean;
	tagNames: string[];
};

export type RecipeContent = {
	ingredients: Ingredient[];
	steps: Step[];
};

function text(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value.trim() : '';
}

function int(formData: FormData, key: string): number | null {
	return parseInt(text(formData, key)) || null;
}

/** Recipe metadata (the in-place-edited `recipes` row), from a submitted form. */
export function parseRecipeMeta(formData: FormData): RecipeMeta {
	const title = text(formData, 'title');
	if (!title) throw error(400, 'Title is required');

	return {
		title,
		description: text(formData, 'description') || null,
		servings: int(formData, 'servings'),
		prepTimeMinutes: int(formData, 'prepTimeMinutes'),
		cookTimeMinutes: int(formData, 'cookTimeMinutes'),
		isPublic: formData.get('isPublic') === 'on',
		tagNames: formData.getAll('tags').filter((t): t is string => typeof t === 'string')
	};
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAnnotationType(value: unknown): value is StepAnnotationType {
	return typeof value === 'string' && (ANNOTATION_TYPES as readonly string[]).includes(value);
}

/**
 * Rebuilds steps from client-submitted JSON: numbers them from 1 and keeps
 * only known fields. Throws 400 on a step without text. An annotation
 * survives only with a known type and non-empty text, since it comes from
 * the client and is rendered to readers.
 */
function normalizeSteps(raw: unknown[]): Step[] {
	return raw.map((s, i) => {
		if (!isObject(s)) throw error(400, `Step ${i + 1} is invalid`);
		const text = typeof s.text === 'string' ? s.text.trim() : '';
		if (!text) throw error(400, `Step ${i + 1} needs text`);
		const step: Step = { step: i + 1, text };
		if (isObject(s.annotation)) {
			const type = s.annotation.type;
			const note = typeof s.annotation.text === 'string' ? s.annotation.text.trim() : '';
			if (isAnnotationType(type) && note) step.annotation = { type, text: note };
		}
		return step;
	});
}

/** Versioned recipe content (ingredients and steps), from JSON fields in a submitted form. */
export function parseRecipeContent(formData: FormData): RecipeContent {
	let ingredients: unknown;
	let steps: unknown;
	try {
		ingredients = JSON.parse(text(formData, 'ingredients'));
		steps = JSON.parse(text(formData, 'steps'));
	} catch {
		throw error(400, 'Invalid ingredient or step data');
	}

	if (!Array.isArray(ingredients) || ingredients.length === 0) {
		throw error(400, 'At least one ingredient is required');
	}
	if (!Array.isArray(steps) || steps.length === 0) {
		throw error(400, 'At least one step is required');
	}

	return { ingredients, steps: normalizeSteps(steps) };
}
