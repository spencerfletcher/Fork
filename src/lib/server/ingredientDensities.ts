import { DENSITIES, ML_PER_UNIT, GRAMS_PER_WEIGHT_UNIT, PIECE_GRAMS } from './gramTables.js';
import type { Ingredient } from '#lib/recipes/types.js';

export type GramResult = { grams: number; approximate: boolean };

/**
 * Look up the gram equivalent of an ingredient from the local table.
 * Returns null if the unit is unknown or (for volumetric units) the ingredient is not in the table.
 */
export function lookupGrams(quantity: number, unit: string, name: string): number | null {
	const unitLower = unit.trim().toLowerCase();

	// Weight units — direct conversion, no density needed
	const gramsPerUnit = GRAMS_PER_WEIGHT_UNIT[unitLower];
	if (gramsPerUnit !== undefined) {
		return quantity * gramsPerUnit;
	}

	const mlPerUnit = ML_PER_UNIT[unitLower];
	if (!mlPerUnit) return null; // unknown unit (count, pinch, etc.)

	const nameLower = name.trim().toLowerCase();

	// Find best matching density key: exact match first, then substring
	let density: number | null = null;
	if (DENSITIES[nameLower] !== undefined) {
		density = DENSITIES[nameLower];
	} else {
		// Check if any key is contained in the ingredient name or vice-versa
		for (const [key, val] of Object.entries(DENSITIES)) {
			if (nameLower.includes(key) || key.includes(nameLower)) {
				density = val;
				break;
			}
		}
	}

	if (density === null) return null;

	return quantity * mlPerUnit * density;
}

// Longest key first, so a name containing "egg white" is matched before "egg".
const PIECE_KEYS = Object.keys(PIECE_GRAMS).sort((a, b) => b.length - a.length);

/** Grams for `quantity` whole items, or null when the name matches nothing in the table. */
export function lookupPieceGrams(quantity: number, name: string): number | null {
	const nameLower = name.trim().toLowerCase();
	const key = PIECE_KEYS.find((k) => nameLower.includes(k));
	return key === undefined ? null : quantity * PIECE_GRAMS[key];
}

/**
 * Weight for one parsed ingredient line from the local tables only, or null
 * when the line has no quantity or the tables do not know it. Measured lines
 * (with a unit) are exact conversions; counted lines are typical whole-item
 * weights and are flagged approximate.
 */
export function gramsFor(ingredient: Ingredient): GramResult | null {
	const { quantity, unit, name } = ingredient;
	if (quantity === null) return null;
	if (unit) {
		const grams = lookupGrams(quantity, unit, name);
		return grams === null ? null : { grams, approximate: false };
	}
	const grams = lookupPieceGrams(quantity, name);
	return grams === null ? null : { grams, approximate: true };
}
