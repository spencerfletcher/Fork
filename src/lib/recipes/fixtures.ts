// Test fixtures for recipe content. Build ingredients and steps through these
// rather than object literals, so a shape change touches one file.
import { parseIngredientLine } from './ingredients.js';
import type { Ingredient, Step, StepAnnotation } from './types.js';

export function makeIngredient(line: string): Ingredient {
	return parseIngredientLine(line);
}

export function makeStep(text: string, annotation?: StepAnnotation): Step {
	return annotation ? { text, annotation } : { text };
}
