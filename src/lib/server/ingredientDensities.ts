import { DENSITIES, ML_PER_UNIT, GRAMS_PER_WEIGHT_UNIT, PIECE_GRAMS } from './gramTables.js';
import type { Ingredient } from '#lib/recipes/types.js';

/** grams2 is the upper end when the line gave a range such as "1-2 cups". */
export type GramResult = { grams: number; grams2: number | null; approximate: boolean };

type Matcher = { key: string; pattern: RegExp };

// Longest key first, so "almond flour, sifted" meets "almond flour" before
// "flour". Keys match as whole words, so "eggplant" is not an egg and "oil"
// alone is not "olive oil"; a trailing "s" is allowed for plurals.
function matchers(table: Record<string, number>): Matcher[] {
	return Object.keys(table)
		.sort((a, b) => b.length - a.length)
		.map((key) => ({
			key,
			pattern: new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`)
		}));
}

function lookup(table: Record<string, number>, table_matchers: Matcher[], name: string) {
	const nameLower = name.trim().toLowerCase();
	const match = table_matchers.find(({ pattern }) => pattern.test(nameLower));
	return match === undefined ? null : table[match.key];
}

const DENSITY_MATCHERS = matchers(DENSITIES);
const PIECE_MATCHERS = matchers(PIECE_GRAMS);

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

	const density = lookup(DENSITIES, DENSITY_MATCHERS, name);
	return density === null ? null : quantity * mlPerUnit * density;
}

/** Grams for `quantity` whole items, or null when the name matches nothing in the table. */
export function lookupPieceGrams(quantity: number, name: string): number | null {
	const grams = lookup(PIECE_GRAMS, PIECE_MATCHERS, name);
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
