import { describe, test, expect } from 'vitest';
import { normaliseTagNames, sameTags, tagKey } from './tags';

describe('tagKey', () => {
	test('ignores case and surrounding space', () => {
		expect(tagKey('  Dessert ')).toBe('dessert');
	});
});

describe('normaliseTagNames', () => {
	test('trims, drops blanks and keeps the first spelling of a repeat', () => {
		expect(normaliseTagNames(['Dessert', ' dessert ', '', 'Baking'])).toEqual([
			'Dessert',
			'Baking'
		]);
	});
});

describe('sameTags', () => {
	test('is true for the same tags in any order, case or repetition', () => {
		expect(sameTags(['Dessert', 'Baking'], ['baking', 'DESSERT', 'Baking'])).toBe(true);
	});

	test('is false when a tag differs', () => {
		expect(sameTags(['Dessert'], ['Dessert', 'Spicy'])).toBe(false);
		expect(sameTags(['Dessert', 'Spicy'], ['Dessert'])).toBe(false);
	});
});
