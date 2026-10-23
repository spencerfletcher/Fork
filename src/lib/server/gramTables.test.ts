import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseIngredientText } from '#lib/recipes/ingredients.js';
import { gramsFor } from './ingredientDensities';

// seed.ts runs on import, so its ingredient literals are read as text.
const seed = readFileSync(new URL('./db/seed.ts', import.meta.url), 'utf8');
const seedIngredients = [...seed.matchAll(/parseIngredientText\(`([\s\S]*?)`\)/g)]
	.flatMap((m) => parseIngredientText(m[1]))
	.filter((ingredient) => ingredient.quantity !== null);

describe('gram tables', () => {
	// Matching is whole-name, so a new seed ingredient the tables do not know
	// shows no weight. This fails there instead of on the recipe page.
	test('know every measured ingredient in the seed', () => {
		expect(seedIngredients.length).toBeGreaterThan(20);
		const misses = seedIngredients.filter((i) => gramsFor(i) === null).map((i) => i.text);
		expect(misses).toEqual([]);
	});
});
