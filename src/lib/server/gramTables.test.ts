import { describe, test, expect } from 'vitest';
import { parseIngredientText } from '#lib/recipes/ingredients.js';
import { gramsFor } from './ingredientDensities';
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
});
