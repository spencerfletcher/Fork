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

function int(value: string, min: number, label: string): number | null {
	if (!value) return null;
	if (!/^\d+$/.test(value) || Number(value) < min) {
		throw error(400, `${label} must be a whole number of at least ${min}`);
	}
	return Number(value);
}

/** Recipe metadata (the in-place-edited `recipes` row), from a submitted form. */
export function parseRecipeMeta(formData: FormData): RecipeMeta {
	const title = text(formData, 'title');
	if (!title) throw error(400, 'Title is required');

	return {
		title,
		description: text(formData, 'description') || null,
		servings: int(text(formData, 'servings'), 1, 'Servings'),
		prepTimeMinutes: int(text(formData, 'prepTimeMinutes'), 0, 'Prep time'),
		cookTimeMinutes: int(text(formData, 'cookTimeMinutes'), 0, 'Cook time'),
		isPublic: formData.get('isPublic') === 'on',
		tagNames: formData.getAll('tags').filter((t): t is string => typeof t === 'string')
	};
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function isAnnotationType(value: unknown): value is StepAnnotationType {
	return typeof value === 'string' && (ANNOTATION_TYPES as readonly string[]).includes(value);
}

/**
 * Rebuilds steps from client-submitted JSON: numbers them from 1 and keeps
 * only known fields. Throws 400 on a step that is not an object or has no
 * text. An annotation survives only with a known type and non-empty text,
 * since it comes from the client and is rendered to readers.
 */
function normalizeSteps(raw: unknown[]): Step[] {
	return raw.map((s, i) => {
		if (!isObject(s)) throw error(400, `Step ${i + 1} is invalid`);
		const text = str(s.text);
		if (!text) throw error(400, `Step ${i + 1} needs text`);
		const step: Step = { step: i + 1, text };
		if (isObject(s.annotation)) {
			const type = s.annotation.type;
			const note = str(s.annotation.text);
			if (isAnnotationType(type) && note) step.annotation = { type, text: note };
		}
		return step;
	});
}

function parseIngredient(raw: unknown, i: number): Ingredient {
	if (!isObject(raw)) throw error(400, `Ingredient ${i + 1} is invalid`);
	const name = str(raw.name);
	if (!name) throw error(400, `Ingredient ${i + 1} needs a name`);
	return {
		amount: str(raw.amount),
		unit: str(raw.unit),
		name
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

	return { ingredients: ingredients.map(parseIngredient), steps: normalizeSteps(steps) };
}
