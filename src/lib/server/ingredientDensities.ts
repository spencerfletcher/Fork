import { DENSITIES, ML_PER_UNIT, GRAMS_PER_WEIGHT_UNIT, PIECE_GRAMS } from './gramTables.js';
import type { Ingredient } from '#lib/recipes/types.js';

/** grams2 is the upper end when the line gave a range such as "1-2 cups". */
export type GramResult = { grams: number; grams2: number | null; approximate: boolean };

// Words that describe handling, not what the thing is. Size words survive
// parsing because parse-ingredient is told they are not units.
const PREP_WORDS = new Set([
	'large',
	'medium',
	'small',
	'extra-large',
	'jumbo',
	'cold',
	'chilled',
	'softened',
	'melted',
	'warm',
	'room-temperature',
	'packed',
	'sifted',
	'divided',
	'chopped',
	'diced',
	'minced',
	'grated',
	'crushed',
	'sliced',
	'peeled',
	'beaten',
	'optional'
]);

// "Large Eggs, beaten (room temp)" -> "eggs". Text after a comma or in
// parentheses is preparation, never part of what the ingredient is.
function normalise(name: string): string {
	return name
		.toLowerCase()
		.replace(/\(.*?\)/g, '')
		.split(',')[0]
		.split(/\s+/)
		.filter((word) => word && !PREP_WORDS.has(word))
		.join(' ');
}

// Whole-name match only, so "peanut butter" is not butter and "rice flour" is
// not flour. A plural last word is tried in the singular: eggs, tomatoes, chives.
function lookup(table: Record<string, number>, name: string): number | null {
	const base = normalise(name);
	const candidates = [base, base.replace(/es$/, ''), base.replace(/s$/, '')];
	const key = candidates.find((candidate) => candidate in table);
	return key === undefined ? null : table[key];
}

/**
 * Grams for a measured line. Weight units convert directly; volume units go
 * through the density table and return null when the name is not in it.
 */
export function lookupGrams(quantity: number, unit: string, name: string): number | null {
	const unitLower = unit.trim().toLowerCase();
	const gramsPerUnit = GRAMS_PER_WEIGHT_UNIT[unitLower];
	if (gramsPerUnit !== undefined) return quantity * gramsPerUnit;

	const mlPerUnit = ML_PER_UNIT[unitLower];
	if (!mlPerUnit) return null; // unknown unit (pinch, etc.)

	const density = lookup(DENSITIES, name);
	return density === null ? null : quantity * mlPerUnit * density;
}

/** Grams for `quantity` whole items, or null when the name matches nothing in the table. */
export function lookupPieceGrams(quantity: number, name: string): number | null {
	const grams = lookup(PIECE_GRAMS, name);
	return grams === null ? null : quantity * grams;
}

/**
 * Weight for one parsed ingredient line from the local tables only, or null
 * when the line has no quantity or the tables do not know it. Measured lines
 * (with a unit) are conversions; counted lines are typical whole-item weights
 * and are flagged approximate.
 */
export function gramsFor(ingredient: Ingredient): GramResult | null {
	const { quantity, quantity2, unit, name } = ingredient;
	if (quantity === null) return null;
	const convert = (q: number) => (unit ? lookupGrams(q, unit, name) : lookupPieceGrams(q, name));
	const grams = convert(quantity);
	if (grams === null) return null;
	return { grams, grams2: quantity2 === null ? null : convert(quantity2), approximate: !unit };
}
