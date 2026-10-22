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

const nameKey = (i: Ingredient) => i.name.toLowerCase();

function ingredientRow(from: Ingredient | undefined, to: Ingredient): IngredientDiffRow {
	if (!from) return { status: 'added', ingredient: to };
	const same =
		from.quantity === to.quantity && from.quantity2 === to.quantity2 && from.unit === to.unit;
	if (same) return { status: 'unchanged', ingredient: to };
	return { status: 'modified', segments: diffInline(from.text, to.text) };
}

/**
 * Diff two ingredient lists by ingredient name (case-insensitive).
 * Removed rows come first, then the `to` list in its own order.
 *
 * Known v1 limitations:
 * - Renamed ingredients show as removed+added (no fuzzy matching).
 */
export function diffIngredients(from: Ingredient[], to: Ingredient[]): IngredientDiffRow[] {
	const fromByName = new Map(from.map((i) => [nameKey(i), i]));
	const toNames = new Set(to.map(nameKey));
	const removed = [...fromByName.values()]
		.filter((i) => !toNames.has(nameKey(i)))
		.map((ingredient): IngredientDiffRow => ({ status: 'removed', ingredient }));
	const rest = to.map((i) => ingredientRow(fromByName.get(nameKey(i)), i));
	return [...removed, ...rest];
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
	const rows = to.map((step, i): StepDiffRow => {
		const stepNumber = i + 1;
		const fromStep = from[i];
		if (!fromStep) return { status: 'added', stepNumber, step };
		if (fromStep.text === step.text) return { status: 'unchanged', stepNumber, step };
		return { status: 'modified', stepNumber, segments: diffInline(fromStep.text, step.text) };
	});
	const removed = from.slice(to.length).map((step): StepDiffRow => ({ status: 'removed', step }));
	return [...rows, ...removed];
}
