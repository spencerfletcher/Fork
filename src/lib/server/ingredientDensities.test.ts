import { describe, test, expect } from 'vitest';
import { gramsFor, lookupGrams, lookupPieceGrams, mlIsGrams } from './ingredientDensities';
import { makeIngredient } from '#lib/recipes/fixtures.js';
import { DENSITIES, ML_IS_GRAMS_TOLERANCE, ML_PER_UNIT, WEIGHED_NEAR_WATER } from './gramTables';

describe('lookupPieceGrams', () => {
	test('multiplies the quantity by the per-item weight', () => {
		expect(lookupPieceGrams(2, 'eggs')).toBe(100);
	});

	test('matches the longest key, so egg whites are not whole eggs', () => {
		expect(lookupPieceGrams(2, 'large egg whites')).toBe(66);
	});

	test('is case-insensitive', () => {
		expect(lookupPieceGrams(1, 'Egg Yolk')).toBe(18);
	});

	test('returns null for an unknown item', () => {
		expect(lookupPieceGrams(1, 'unicorn')).toBeNull();
	});

	test('a compound name is its own item, not the short item inside it', () => {
		expect(lookupPieceGrams(2, 'green onions')).toBe(30);
		expect(lookupPieceGrams(2, 'sweet potatoes')).toBe(260);
		expect(lookupPieceGrams(1, 'cherry tomatoes')).toBe(17);
	});

	test('an unknown compound is not the item inside it', () => {
		expect(lookupPieceGrams(1, 'lemon juice')).toBeNull();
		expect(lookupPieceGrams(1, 'tomato paste')).toBeNull();
		expect(lookupPieceGrams(1, 'egg noodles')).toBeNull();
		expect(lookupPieceGrams(1, 'apple cider vinegar')).toBeNull();
		expect(lookupPieceGrams(1, 'garlic powder')).toBeNull();
	});

	test('ignores size words and preparation notes', () => {
		expect(lookupPieceGrams(2, 'large eggs')).toBe(100);
		expect(lookupPieceGrams(1, 'medium onion, diced')).toBe(150);
		expect(lookupPieceGrams(3, 'garlic cloves, minced')).toBe(15);
		expect(lookupPieceGrams(3, 'cloves of garlic')).toBe(15);
	});

	test('matches whole words only, so eggplant is not an egg', () => {
		expect(lookupPieceGrams(2, 'eggplants')).toBeNull();
		expect(lookupPieceGrams(2, 'eggs')).toBe(100);
	});
});

describe('lookupGrams', () => {
	test('a weight unit converts directly, whatever the name', () => {
		expect(lookupGrams(2, 'oz', 'dragon fruit')).toBeCloseTo(56.7, 0);
	});

	test('prefers the most specific key when preparation text follows the name', () => {
		const cup = ML_PER_UNIT.cup;
		expect(lookupGrams(1, 'cup', 'almond flour, sifted')).toBe(cup * DENSITIES['almond flour']);
		expect(lookupGrams(1, 'cup', 'powdered sugar, sifted')).toBe(
			cup * DENSITIES['powdered sugar']!
		);
		expect(lookupGrams(1, 'tsp', 'kosher salt, divided')).toBe(
			ML_PER_UNIT.tsp * DENSITIES['kosher salt']
		);
	});

	test('a powder or juice uses its own density, not the fresh item it is named after', () => {
		expect(lookupGrams(1, 'tsp', 'garlic powder')).toBe(
			ML_PER_UNIT.tsp * DENSITIES['garlic powder']!
		);
		expect(lookupGrams(1, 'tsp', 'garlic powder')).not.toBe(ML_PER_UNIT.tsp * DENSITIES.garlic);
		expect(lookupGrams(1, 'cup', 'lemon juice')).toBe(ML_PER_UNIT.cup * DENSITIES['lemon juice']);
	});

	test('an unknown compound is not the ingredient inside it', () => {
		expect(lookupGrams(1, 'cup', 'peanut butter')).toBeNull();
		expect(lookupGrams(1, 'cup', 'rice flour')).toBeNull();
		expect(lookupGrams(1, 'cup', 'oil')).toBeNull();
		expect(lookupGrams(1, 'cup', 'flourish')).toBeNull();
	});

	test('an unrecognised qualifier never falls back to the generic ingredient', () => {
		expect(lookupGrams(1, 'cup', 'flour (almond)')).toBeNull();
		expect(lookupGrams(1, 'tsp', 'salt, kosher')).toBeNull();
	});

	test('a key that contains a preparation word is still reachable as typed', () => {
		expect(lookupGrams(1, 'cup', 'crushed tomatoes')).toBe(
			ML_PER_UNIT.cup * DENSITIES['crushed tomatoes']
		);
		expect(lookupGrams(1, 'cup', 'diced tomatoes')).toBe(
			ML_PER_UNIT.cup * DENSITIES['diced tomatoes']
		);
	});

	test('ignores preparation words that do not change density', () => {
		expect(lookupGrams(1, 'cup', 'cold unsalted butter')).toBe(
			ML_PER_UNIT.cup * DENSITIES['unsalted butter']
		);
		expect(lookupGrams(1, 'cup', 'packed brown sugar')).toBe(
			ML_PER_UNIT.cup * DENSITIES['brown sugar']
		);
		expect(lookupGrams(1, 'cup', 'all-purpose flour (spooned and levelled)')).toBe(
			ML_PER_UNIT.cup * DENSITIES['all-purpose flour']
		);
	});
});

describe('gramsFor', () => {
	test('converts a measured line from the density table, not approximate', () => {
		const result = gramsFor(makeIngredient('1 cup all-purpose flour'));
		expect(result?.approximate).toBe(false);
		expect(result?.grams).toBeGreaterThan(0);
	});

	test('converts a counted line from the per-item table, approximate', () => {
		expect(gramsFor(makeIngredient('2 eggs'))).toEqual({
			grams: 100,
			grams2: null,
			approximate: true,
			likeWater: false
		});
	});

	test('converts both ends of a range', () => {
		const cup = ML_PER_UNIT.cup;
		expect(gramsFor(makeIngredient('1-2 cups water'))).toEqual({
			grams: cup,
			grams2: 2 * cup,
			approximate: false,
			likeWater: true
		});
	});

	test('converts both ends of a counted range', () => {
		expect(gramsFor(makeIngredient('2-3 eggs'))).toEqual({
			grams: 100,
			grams2: 150,
			approximate: true,
			likeWater: false
		});
	});

	test('a count word parsed as a unit still finds the whole item', () => {
		expect(gramsFor(makeIngredient('4 cloves garlic, minced'))).toEqual({
			grams: 20,
			grams2: null,
			approximate: true,
			likeWater: false
		});
	});

	test('returns null for an unparsed line', () => {
		expect(gramsFor(makeIngredient('salt to taste'))).toBeNull();
	});

	test('millilitres read as grams within the tolerance of water, either side', () => {
		const t = ML_IS_GRAMS_TOLERANCE;
		expect(mlIsGrams(1 + t * 0.999)).toBe(true);
		expect(mlIsGrams(1 - t * 0.999)).toBe(true);
		expect(mlIsGrams(1 + t * 1.001)).toBe(false);
		expect(mlIsGrams(1 - t * 1.001)).toBe(false);
	});

	test('marks a liquid like water by the density key its name matched, handling words and all', () => {
		const likeWater = (line: string) => gramsFor(makeIngredient(line))?.likeWater;
		for (const line of [
			'1 cup water',
			'1 cup whole milk',
			'1 cup heavy cream, cold',
			'2 cups chicken broth',
			'1/2 cup orange juice',
			'2 tbsp vinegar',
			'1 cup white wine'
		])
			expect(likeWater(line), line).toBe(true);
		// Oil, syrups and sauces heavier than 6% off water are weighed; so are
		// the solids the density alone cannot tell.
		for (const line of [
			'1/4 cup olive oil',
			'1/2 cup honey',
			'1/4 cup maple syrup',
			'2 tbsp soy sauce',
			'2 tbsp balsamic vinegar',
			'1 cup all-purpose flour',
			'1 cup plain yogurt',
			'1/2 cup sour cream'
		])
			expect(likeWater(line), line).toBe(false);
	});

	test('every weighed-near-water key is a density the tolerance would otherwise pour', () => {
		for (const key of WEIGHED_NEAR_WATER) expect(mlIsGrams(DENSITIES[key]), key).toBe(true);
	});

	test('returns null for a line the tables do not know', () => {
		expect(gramsFor(makeIngredient('1 cup dragon fruit'))).toBeNull();
		expect(gramsFor(makeIngredient('3 dragon fruit'))).toBeNull();
	});
});
