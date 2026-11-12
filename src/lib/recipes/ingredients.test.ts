import { describe, test, expect } from 'vitest';
import { parseIngredientLine, parseIngredientText, ingredientsToText } from './ingredients';
import { inGroup, makeIngredient } from './fixtures';

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
		['1 cup', 1, null, '', 'cup'],
		// The parser takes the unit from after a can's size, leaving a name that
		// no longer ends the line, which nothing can rescale; the size stays in the name.
		['1 (15 oz) can chickpeas', 1, null, '', '(15 oz) can chickpeas'],
		['2 (14-ounce) cans coconut milk', 2, null, '', '(14-ounce) cans coconut milk'],
		['1 cup (240 ml) milk', 1, null, 'cup', '(240 ml) milk'],
		// A typed zero is the cook's number: kept, and shown as typed.
		['0 cups flour', 0, null, 'cups', 'flour'],
		// The parser drops a minus sign and the name with it ("-1 egg" read as
		// 1 of nothing, which scales to a bare "2"), so a negative stays as written.
		['-1 egg', null, null, '', '-1 egg'],
		['−1 egg', null, null, '', '−1 egg'],
		['-0.5 tsp salt', null, null, '', '-0.5 tsp salt'],
		// A number too large to be finite is no number to scale.
		['1e999 g salt', null, null, '', '1e999 g salt']
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

describe('grouped ingredients', () => {
	test('each row under a "# Name" line carries that group; rows before it carry none', () => {
		const rows = parseIngredientText('salt\n# Dough\n1 cup flour\n2 eggs\n\n# Icing\n1 cup sugar');
		expect(rows.map((i) => [i.group, i.text])).toEqual([
			[undefined, 'salt'],
			['Dough', '1 cup flour'],
			['Dough', '2 eggs'],
			['Icing', '1 cup sugar']
		]);
		expect(rows[0]).not.toHaveProperty('group');
	});

	test('an ungrouped list parses exactly as before: no group key at all', () => {
		expect(parseIngredientText('1 cup flour\n2 eggs')).toEqual([
			parseIngredientLine('1 cup flour'),
			parseIngredientLine('2 eggs')
		]);
	});

	test('a heading with no rows under it adds nothing', () => {
		expect(parseIngredientText('# Dough\n# Icing\nsugar').map((i) => i.group)).toEqual(['Icing']);
	});

	test('ingredientsToText writes a "# Name" line where the group changes, a blank line above it', () => {
		const rows = [
			makeIngredient('salt'),
			...inGroup('Dough', [makeIngredient('1 cup flour'), makeIngredient('2 eggs')]),
			...inGroup('Icing', [makeIngredient('1 cup sugar')])
		];
		const text = ingredientsToText(rows);
		expect(text).toBe('salt\n\n# Dough\n1 cup flour\n2 eggs\n\n# Icing\n1 cup sugar');
		expect(parseIngredientText(text)).toEqual(rows);
	});

	test('a list that starts grouped starts with its heading', () => {
		expect(ingredientsToText(inGroup('Dough', [makeIngredient('flour')]))).toBe('# Dough\nflour');
	});
});
