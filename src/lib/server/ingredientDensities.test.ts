import { describe, test, expect } from 'vitest';
import { gramsFor, lookupPieceGrams } from './ingredientDensities';
import { makeIngredient } from '#lib/recipes/fixtures.js';

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

describe('gramsFor', () => {
	test('converts a measured line from the density table, not approximate', () => {
		const result = gramsFor(makeIngredient('1 cup all-purpose flour'));
		expect(result?.approximate).toBe(false);
		expect(result?.grams).toBeGreaterThan(0);
	});

	test('converts a counted line from the per-item table, approximate', () => {
		expect(gramsFor(makeIngredient('2 eggs'))).toEqual({ grams: 100, approximate: true });
	});

	test('marks a range as approximate and uses its lower bound', () => {
		expect(gramsFor(makeIngredient('1-2 cups all-purpose flour'))).toMatchObject({
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
