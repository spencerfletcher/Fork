import { describe, test, expect } from 'vitest';
import { parseIngredientText } from '#lib/recipes/ingredients.js';
import { gramsFor } from './ingredientDensities';
import { GRAMS_PER_WEIGHT_UNIT, ML_PER_UNIT } from './gramTables';
import { UNITS, unitId } from '#lib/recipes/convert.js';
import { SEED } from './db/seedData';

const seedIngredients = SEED.flatMap((recipe) => recipe.versions)
	.flatMap((version) => parseIngredientText(version.ingredientsText))
	.filter((ingredient) => ingredient.quantity !== null);

describe('gram tables', () => {
	// Matching is whole-name, so a new seed ingredient the tables do not know
	// shows no weight. This fails there instead of on the recipe page.
	test('know every measured ingredient in the seed', () => {
		expect(seedIngredients.length).toBeGreaterThan(20);
		const misses = seedIngredients.filter((i) => gramsFor(i) === null).map((i) => i.text);
		expect(misses).toEqual([]);
	});

	// One cup for the gram estimate and the conversion alike: each word the
	// estimates weigh by is the unit the conversion reads it as, at its size.
	test.each([
		['volume', ML_PER_UNIT],
		['mass', GRAMS_PER_WEIGHT_UNIT]
	] as const)('size each %s word as the conversion does', (dimension, table) => {
		for (const [word, size] of Object.entries(table)) {
			const id = unitId(word);
			expect(id, word).toBeDefined();
			expect(UNITS[id!].dimension, word).toBe(dimension);
			expect(size, word).toBe(UNITS[id!].size);
		}
	});
});
