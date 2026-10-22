import { parseIngredient } from 'parse-ingredient';
import type { Ingredient } from './types.js';

const OPTIONS = {
	ignoreUOMs: ['large', 'medium', 'small']
};

function unparsed(text: string): Ingredient {
	return { text, quantity: null, quantity2: null, unit: '', name: text };
}

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

export function parseIngredientText(text: string): Ingredient[] {
	return text
		.replace(/\r\n/g, '\n')
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.map(parseIngredientLine);
}

export function ingredientsToText(rows: Ingredient[]): string {
	return rows.map((ingredient) => ingredient.text).join('\n');
}
