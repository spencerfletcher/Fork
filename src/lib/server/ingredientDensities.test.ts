import { describe, test, expect } from 'vitest';
import { gramsFor, lookupGrams, lookupPieceGrams } from './ingredientDensities';
import { makeIngredient } from '#lib/recipes/fixtures.js';
import { DENSITIES, ML_PER_UNIT } from './gramTables';

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
		expect(lookupGrams(1, 'cup', 'powdered sugar, sifted')).toBe(cup * DENSITIES['powdered sugar']);
		expect(lookupGrams(1, 'tsp', 'kosher salt, divided')).toBe(
			ML_PER_UNIT.tsp * DENSITIES['kosher salt']
		);
	});

	test('matches whole words only and never guesses from a key that merely contains the name', () => {
		expect(lookupGrams(1, 'cup', 'oil')).toBeNull();
		expect(lookupGrams(1, 'cup', 'flourish')).toBeNull();
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
			approximate: true
		});
	});

	test('converts both ends of a range', () => {
		const cup = ML_PER_UNIT.cup;
		expect(gramsFor(makeIngredient('1-2 cups water'))).toEqual({
			grams: cup,
			grams2: 2 * cup,
			approximate: false
		});
	});

	test('converts both ends of a counted range', () => {
		expect(gramsFor(makeIngredient('2-3 eggs'))).toEqual({
			grams: 100,
			grams2: 150,
			approximate: true
		});
	});

	test('returns null for an unparsed line', () => {
		expect(gramsFor(makeIngredient('salt to taste'))).toBeNull();
	});

	test('returns null for a line the tables do not know', () => {
		expect(gramsFor(makeIngredient('1 cup dragon fruit'))).toBeNull();
		expect(gramsFor(makeIngredient('3 dragon fruit'))).toBeNull();
	});
});
