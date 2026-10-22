import { diffWords } from 'diff';
import type { Ingredient, Step, StepAnnotation, StepAnnotationType } from '#lib/recipes/types.js';

export interface InlineSegment {
	type: 'added' | 'removed' | 'unchanged';
	text: string;
}

export type IngredientDiffRow =
	| { status: 'added' | 'removed' | 'unchanged'; ingredient: Ingredient }
	| { status: 'modified'; segments: InlineSegment[] };

export type AnnotationDiff = {
	status: 'added' | 'removed' | 'modified';
	type: StepAnnotationType;
	segments: InlineSegment[];
};

// Steps are numbered by position. A removed step has no position in the new
// version, so it carries none.
export type StepDiffRow =
	| { status: 'added' | 'unchanged'; stepNumber: number; step: Step }
	| { status: 'removed'; step: Step }
	| {
			status: 'modified';
			stepNumber: number;
			segments: InlineSegment[];
			annotation?: AnnotationDiff;
	  };

export function diffInline(a: string, b: string): InlineSegment[] {
	return diffWords(a, b).map((part) => ({
		type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
		text: part.value
	}));
}

// Ingredients are matched across versions by name, so "flour" in one version
// pairs with "flour" in the other regardless of position or case.
const nameKey = (i: Ingredient) => i.name.toLowerCase();

function annotationDiff(
	from: StepAnnotation | undefined,
	to: StepAnnotation | undefined
): AnnotationDiff | undefined {
	if (!to) {
		return from && { status: 'removed', type: from.type, segments: diffInline(from.text, '') };
	}
	if (!from) return { status: 'added', type: to.type, segments: diffInline('', to.text) };
	if (from.type === to.type && from.text === to.text) return undefined;
	return { status: 'modified', type: to.type, segments: diffInline(from.text, to.text) };
}

// Classifies one ingredient from the new version against its namesake in the
// old version, if any. Removed rows are handled by the caller, since they have
// no entry in the new list to iterate.
function ingredientRow(from: Ingredient | undefined, to: Ingredient): IngredientDiffRow {
	if (!from) return { status: 'added', ingredient: to };
	// Same name with the same measurement is unchanged even if the typed text
	// differs cosmetically ("1 cup" vs "1 cup  "); only a real change is shown.
	const same =
		from.quantity === to.quantity && from.quantity2 === to.quantity2 && from.unit === to.unit;
	if (same) return { status: 'unchanged', ingredient: to };
	// The inline diff is over the lines as typed, which is what the reader sees.
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
	// Iterating the map rather than `from` means a name listed twice in the old
	// version is reported removed once, matching how it was matched.
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
	// Every step in the new version has a row, paired with whatever sat at the
	// same position in the old version. The explicit `: StepDiffRow` on the
	// arrow keeps each literal's `status` as the union member, not plain string.
	const rows = to.map((toStep, i): StepDiffRow => {
		const stepNumber = i + 1;
		const fromStep = from[i];
		if (!fromStep) return { status: 'added', stepNumber, step: toStep };
		const annotation = annotationDiff(fromStep.annotation, toStep.annotation);
		if (fromStep.text === toStep.text && !annotation) {
			return { status: 'unchanged', stepNumber, step: toStep };
		}
		return {
			status: 'modified',
			stepNumber,
			segments: diffInline(fromStep.text, toStep.text),
			...(annotation && { annotation })
		};
	});
	// Positions the new version does not reach are the removed steps; they come
	// last because they have no place among the numbered rows.
	const removed = from.slice(to.length).map((step): StepDiffRow => ({ status: 'removed', step }));
	return [...rows, ...removed];
}
