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
	'room',
	'temperature',
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
	'spooned',
	'levelled',
	'leveled',
	'optional',
	'and',
	'at'
]);

const words = (text: string) => text.split(/\s+/).filter(Boolean);

// A trailing clause ("…, softened", "… (spooned and levelled)", "…, for
// topping") is dropped only when it is recognisably about handling. Anything
// else may name the ingredient ("salt, kosher", "flour (almond)") and is kept.
function isPrepClause(clause: string): boolean {
	if (/^(for |to taste|cut into )/.test(clause)) return true;
	return words(clause).every((word) => PREP_WORDS.has(word));
}

// Candidate keys for a name, most faithful first: the whole name as typed,
// then with recognised preparation text removed. When a clause is not
// recognised only the whole name is tried, so an unknown qualifier never
// falls back to a generic match.
function candidates(name: string): string[] {
	const lower = name.trim().toLowerCase().replace(/\s+/g, ' ');
	const clauses: string[] = [];
	const withoutParens = lower.replace(/\(([^)]*)\)/g, (_, inner: string) => {
		clauses.push(inner.trim());
		return ' ';
	});
	const [main, ...afterCommas] = withoutParens.split(',').map((part) => part.trim());
	clauses.push(...afterCommas);
	if (!clauses.every(isPrepClause)) return [lower];
	return [
		lower,
		words(main)
			.filter((word) => !PREP_WORDS.has(word))
			.join(' ')
	];
}

// Whole-name match only, so "peanut butter" is not butter and "rice flour" is
// not flour. A plural last word is tried in the singular: eggs, tomatoes, chives.
function lookup(table: Record<string, number>, name: string): number | null {
	const keys = candidates(name).flatMap((c) => [c, c.replace(/es$/, ''), c.replace(/s$/, '')]);
	const key = keys.find((candidate) => candidate in table);
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

/** A line with a unit converts by measure; otherwise, or when the "unit" is
 * really a count word such as "cloves", it is looked up as whole items. */
function convert(quantity: number, unit: string, name: string): GramResult | null {
	if (unit) {
		const grams = lookupGrams(quantity, unit, name);
		if (grams !== null) return { grams, grams2: null, approximate: false };
	}
	const grams = lookupPieceGrams(quantity, unit ? `${unit} ${name}` : name);
	return grams === null ? null : { grams, grams2: null, approximate: true };
}

/**
 * Weight for one parsed ingredient line from the local tables only, or null
 * when the line has no quantity or the tables do not know it. Measured lines
 * are conversions; counted lines are typical whole-item weights and are
 * flagged approximate.
 */
export function gramsFor(ingredient: Ingredient): GramResult | null {
	const { quantity, quantity2, unit, name } = ingredient;
	if (quantity === null) return null;
	const result = convert(quantity, unit, name);
	if (result === null) return null;
	const grams2 = quantity2 === null ? null : (convert(quantity2, unit, name)?.grams ?? null);
	return { ...result, grams2 };
}
