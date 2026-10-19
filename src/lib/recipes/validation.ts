import { error } from '@sveltejs/kit';
import type { Ingredient, Step } from './types.js';
import { normalizeSteps } from './steps.js';

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
