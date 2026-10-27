// Ingredients are typed as plain text, one per line, and parsed into
// quantity, unit and name on save. The typed line is kept as the source of
// truth and is what the recipe page prints; the parsed fields exist for
// scaling and gram weights, and are null or empty when a line does not parse.
import { parseIngredient } from 'parse-ingredient';
import type { Ingredient } from './types.js';

// Strict units: parse-ingredient's own list, minus size words, so "2 large
// eggs" keeps "large eggs" as the name instead of reading "large" as a unit.
// Swapping to a looser parse is a change to this one object.
const OPTIONS = {
	ignoreUOMs: ['large', 'medium', 'small']
};

/** A line the parser could not read: saved as written, cannot be scaled. */
function unparsed(text: string): Ingredient {
	return { text, quantity: null, quantity2: null, unit: '', name: text };
}

/** One typed line to its structured form; the whole line becomes the name when it does not parse. */
export function parseIngredientLine(line: string): Ingredient {
	const text = line.trim();
	const [parsed] = parseIngredient(text, OPTIONS);
	if (!parsed) {
		return unparsed(text);
	}
	return {
		text,
		quantity: parsed.quantity,
		quantity2: parsed.quantity2,
		unit: parsed.unitOfMeasure ?? '',
		name: parsed.description
	};
}

/** The textarea's contents to ingredients: one per non-blank line, Windows line endings tolerated. */
export function parseIngredientText(text: string): Ingredient[] {
	return text
		.replace(/\r\n/g, '\n')
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.map(parseIngredientLine);
}

/** The inverse of parseIngredientText, for refilling the editor from a saved version. */
export function ingredientsToText(rows: Ingredient[]): string {
	return rows.map((ingredient) => ingredient.text).join('\n');
}
