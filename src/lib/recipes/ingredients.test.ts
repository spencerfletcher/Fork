import { describe, test, expect } from 'vitest';
import { parseIngredientLine, parseIngredientText, ingredientsToText } from './ingredients';

describe('parseIngredientLine', () => {
	test.each([
		['2¼ cups all-purpose flour', 2.25, null, 'cups', 'all-purpose flour'],
		['2 large eggs', 2, null, '', 'large eggs'],
		['1 cup packed brown sugar', 1, null, 'cup', 'packed brown sugar'],
		['1 1/2 tsp vanilla', 1.5, null, 'tsp', 'vanilla'],
		['2-3 cloves garlic', 2, 3, 'cloves', 'garlic'],
		['100–150 g sugar', 100, 150, 'g', 'sugar'],
		['2 tbsp. olive oil', 2, null, 'tbsp.', 'olive oil'],
		['1 cup of flour', 1, null, 'cup', 'flour'],
		['salt to taste', null, null, '', 'salt to taste'],
		['juice of half a lemon', null, null, '', 'juice of half a lemon'],
		['flaky sea salt, for topping', null, null, '', 'flaky sea salt, for topping'],
		['1 cup', 1, null, '', 'cup']
	])('%j', (line, quantity, quantity2, unit, name) => {
		expect(parseIngredientLine(line)).toEqual({ text: line, quantity, quantity2, unit, name });
	});

	test('trims the line and stores the trimmed text', () => {
		expect(parseIngredientLine('  1 cup flour  ').text).toBe('1 cup flour');
	});
});

describe('parseIngredientText', () => {
	test('splits on \\r\\n and \\n, drops blank and whitespace-only lines', () => {
		const result = parseIngredientText('1 cup flour\r\n\r\n   \n2 eggs  \n');
		expect(result.map((i) => i.text)).toEqual(['1 cup flour', '2 eggs']);
	});

	test('empty text gives an empty list', () => {
		expect(parseIngredientText('   \n  ')).toEqual([]);
	});
});

describe('ingredientsToText', () => {
	test('joins each line with a single newline', () => {
		const rows = [parseIngredientLine('1 cup flour'), parseIngredientLine('2 eggs')];
		expect(ingredientsToText(rows)).toBe('1 cup flour\n2 eggs');
	});
});
