import { diffWords } from 'diff';
import type { Ingredient, Step } from '#lib/recipes/types.js';

export type DiffStatus = 'added' | 'removed' | 'unchanged' | 'modified';

export interface InlineSegment {
	type: 'added' | 'removed' | 'unchanged';
	text: string;
}

export type IngredientDiffRow =
	| { status: 'added' | 'removed' | 'unchanged'; ingredient: Ingredient }
	| { status: 'modified'; segments: InlineSegment[] };

// Steps are numbered by position. A removed step has no position in the new
// version, so it carries none.
export type StepDiffRow =
	| { status: 'added' | 'unchanged'; stepNumber: number; step: Step }
	| { status: 'removed'; step: Step }
	| { status: 'modified'; stepNumber: number; segments: InlineSegment[] };

export function diffInline(a: string, b: string): InlineSegment[] {
	return diffWords(a, b).map((part) => ({
		type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
		text: part.value
	}));
}

/**
 * Diff two ingredient lists by ingredient name (case-insensitive).
 *
 * Known v1 limitations:
 * - Renamed ingredients show as removed+added (no fuzzy matching).
 */
export function diffIngredients(from: Ingredient[], to: Ingredient[]): IngredientDiffRow[] {
	const result: IngredientDiffRow[] = [];

	const fromMap = new Map(from.map((i) => [i.name.toLowerCase(), i]));
	const toMap = new Map(to.map((i) => [i.name.toLowerCase(), i]));

	// Removed: in from but not in to
	for (const [key, ingredient] of fromMap) {
		if (!toMap.has(key)) {
			result.push({ status: 'removed', ingredient });
		}
	}

	// Added or unchanged/modified: iterate to in original order
	for (const ingredient of to) {
		const key = ingredient.name.toLowerCase();
		const fromIngredient = fromMap.get(key);
		if (!fromIngredient) {
			result.push({ status: 'added', ingredient });
		} else {
			const unchanged =
				fromIngredient.quantity === ingredient.quantity &&
				fromIngredient.quantity2 === ingredient.quantity2 &&
				fromIngredient.unit === ingredient.unit;
			if (unchanged) {
				result.push({ status: 'unchanged', ingredient });
			} else {
				result.push({
					status: 'modified',
					segments: diffInline(fromIngredient.text, ingredient.text)
				});
			}
		}
	}

	return result;
}

/**
 * Diff two step lists by position.
 *
 * Known v1 limitations:
 * - Matching is by position, not LCS on text.
 * - Inserting a step in the middle causes cascade of apparent changes.
 * - LCS-based diffing deferred to v2.
 */
export function diffSteps(from: Step[], to: Step[]): StepDiffRow[] {
	const result: StepDiffRow[] = [];

	for (let i = 0; i < Math.max(from.length, to.length); i++) {
		const fromStep = from[i];
		const toStep = to[i];
		const stepNumber = i + 1;

		if (fromStep && !toStep) {
			result.push({ status: 'removed', step: fromStep });
		} else if (!fromStep && toStep) {
			result.push({ status: 'added', stepNumber, step: toStep });
		} else if (fromStep && toStep) {
			if (fromStep.text === toStep.text) {
				result.push({ status: 'unchanged', stepNumber, step: toStep });
			} else {
				result.push({
					status: 'modified',
					stepNumber,
					segments: diffInline(fromStep.text, toStep.text)
				});
			}
		}
	}

	return result;
}
