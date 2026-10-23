import { describe, test, expect } from 'vitest';
import { lookupPieceGrams } from './ingredientDensities';

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
});
