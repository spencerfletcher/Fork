import type { Ingredient, Step } from '$lib/server/db/schema';

export type DiffStatus = 'added' | 'removed' | 'unchanged';

export interface IngredientDiffRow {
	status: DiffStatus;
	ingredient: Ingredient;
}

export interface StepDiffRow {
	status: DiffStatus;
	step: Step;
}

/**
 * Diff two ingredient lists by ingredient name (case-insensitive).
 *
 * Known v1 limitations:
 * - Renamed ingredients show as removed+added (no fuzzy matching).
 * - Changed amount/unit on the same name emits a removed+added pair.
 */
export function diffIngredients(from: Ingredient[], to: Ingredient[]): IngredientDiffRow[] {
	const result: IngredientDiffRow[] = [];

	const fromMap = new Map(from.map(i => [i.name.toLowerCase(), i]));
	const toMap = new Map(to.map(i => [i.name.toLowerCase(), i]));

	// Removed: in from but not in to
	for (const [key, ingredient] of fromMap) {
		if (!toMap.has(key)) {
			result.push({ status: 'removed', ingredient });
		}
	}

	// Added or unchanged: iterate to in original order
	for (const ingredient of to) {
		const key = ingredient.name.toLowerCase();
		const fromIngredient = fromMap.get(key);
		if (!fromIngredient) {
			result.push({ status: 'added', ingredient });
		} else {
			// Same name — check if amount or unit changed
			const unchanged =
				fromIngredient.amount === ingredient.amount &&
				fromIngredient.unit === ingredient.unit;
			if (unchanged) {
				result.push({ status: 'unchanged', ingredient });
			} else {
				// Emit removed (old) then added (new)
				result.push({ status: 'removed', ingredient: fromIngredient });
				result.push({ status: 'added', ingredient });
			}
		}
	}

	return result;
}

/**
 * Diff two step lists by step number.
 *
 * Known v1 limitations:
 * - Matching is by step number, not LCS on text.
 * - Inserting a step in the middle causes cascade of apparent changes.
 * - LCS-based diffing deferred to v2.
 */
export function diffSteps(from: Step[], to: Step[]): StepDiffRow[] {
	const result: StepDiffRow[] = [];

	const fromMap = new Map(from.map(s => [s.step, s]));
	const toMap = new Map(to.map(s => [s.step, s]));

	const allStepNumbers = new Set([...fromMap.keys(), ...toMap.keys()]);
	const sorted = [...allStepNumbers].sort((a, b) => a - b);

	for (const num of sorted) {
		const fromStep = fromMap.get(num);
		const toStep = toMap.get(num);

		if (fromStep && !toStep) {
			result.push({ status: 'removed', step: fromStep });
		} else if (!fromStep && toStep) {
			result.push({ status: 'added', step: toStep });
		} else if (fromStep && toStep) {
			if (fromStep.text === toStep.text) {
				result.push({ status: 'unchanged', step: toStep });
			} else {
				result.push({ status: 'removed', step: fromStep });
				result.push({ status: 'added', step: toStep });
			}
		}
	}

	return result;
}
