import { describe, test, expect } from 'vitest';
import { makeIngredient } from './fixtures';
import {
	FRACTIONS,
	MIN_SERVES,
	formatScaled,
	formatServes,
	parseServes,
	scaleIngredient,
	scaleQuantity
} from './scale';

const grams = (g: number, g2: number | null = null, approximate = false) => ({
	grams: g,
	grams2: g2,
	approximate
});

describe('scaleQuantity', () => {
	test.each([
		[2, 2, 4],
		[2, 0.5, 1],
		[2, 1.5, 3],
		[null, 2, null]
	])('%j × %j = %j', (q, factor, expected) => {
		expect(scaleQuantity(q, factor)).toBe(expected);
	});
});

describe('formatScaled', () => {
	test.each([
		[4, '4'],
		[0.5, FRACTIONS['1/2']],
		[4.5, `4${FRACTIONS['1/2']}`],
		[1 / 3, FRACTIONS['1/3']],
		[2 + 2 / 3, `2${FRACTIONS['2/3']}`],
		[0.75, FRACTIONS['3/4']],
		[0.125, FRACTIONS['1/8']],
		[1.375, `1${FRACTIONS['3/8']}`],
		[0.625, FRACTIONS['5/8']],
		[0.875, FRACTIONS['7/8']],
		// Not a clean fraction: one decimal.
		[1.3, '1.3'],
		[2.25 * 1.1, '2.5'],
		[0.4166, '0.4'],
		// Rounding: float noise reads as the clean value.
		[0.1 + 0.2 + 0.2, FRACTIONS['1/2']],
		[2.999999, '3'],
		// Too small for a tenth: two places rather than a zero.
		[0.03125, '0.03']
	])('%j → %j', (n, expected) => {
		expect(formatScaled(n)).toBe(expected);
	});
});

describe('formatServes', () => {
	test.each([
		[4, '4'],
		[1.5, '1.5'],
		[0.375, '0.38'],
		[2.1, '2.1'],
		[6.0, '6']
	])('%j → %j', (n, expected) => {
		expect(formatServes(n)).toBe(expected);
	});
});

describe('parseServes', () => {
	test.each([
		['6', 6],
		['1.5', 1.5],
		['1,5', 1.5],
		[' 8 ', 8],
		[String(MIN_SERVES), MIN_SERVES],
		['2.346', 2.35]
	])('%j applies as %j', (param, expected) => {
		expect(parseServes(param, 4)).toBe(expected);
	});

	test.each([
		[null],
		[''],
		['abc'],
		['0'],
		['-2'],
		[String(MIN_SERVES / 2)],
		['1e3'],
		['0x10'],
		['Infinity'],
		['6abc']
	])('%j is ignored: the stored serves stand', (param) => {
		expect(parseServes(param, 4)).toBe(4);
	});
});

describe('scaleIngredient', () => {
	test('×2 rewrites the measure, pluralises the unit and doubles the grams', () => {
		const row = scaleIngredient(makeIngredient('1 cup unsalted butter, softened'), grams(227), 2);
		expect(row.ingredient.text).toBe('2 cups unsalted butter, softened');
		expect(row.ingredient.quantity).toBe(2);
		expect(row.grams).toEqual(grams(454));
	});

	test('÷2 halves into a glyph and keeps a unit that is already singular', () => {
		const row = scaleIngredient(makeIngredient('1 cup packed brown sugar'), grams(200), 0.5);
		expect(row.ingredient.text).toBe(`${FRACTIONS['1/2']} cup packed brown sugar`);
		expect(row.grams).toEqual(grams(100));
	});

	test('a plural unit goes singular at one or less', () => {
		const row = scaleIngredient(makeIngredient('2 cups chocolate chips'), null, 0.5);
		expect(row.ingredient.text).toBe('1 cup chocolate chips');
	});

	test('×1.5 on a typed glyph', () => {
		const row = scaleIngredient(makeIngredient('2¼ cups all-purpose flour'), grams(281), 1.5);
		expect(row.ingredient.text).toBe(`3${FRACTIONS['3/8']} cups all-purpose flour`);
		expect(row.grams?.grams).toBeCloseTo(421.5);
	});

	test('thirds and eighths', () => {
		expect(scaleIngredient(makeIngredient('1 tsp baking soda'), null, 1 / 3).ingredient.text).toBe(
			`${FRACTIONS['1/3']} tsp baking soda`
		);
		expect(
			scaleIngredient(makeIngredient('¼ tsp espresso powder'), null, 0.5).ingredient.text
		).toBe(`${FRACTIONS['1/8']} tsp espresso powder`);
	});

	test('a counted line scales its number and keeps its words', () => {
		const row = scaleIngredient(makeIngredient('2 large eggs'), grams(100, null, true), 1.5);
		expect(row.ingredient.text).toBe('3 large eggs');
		expect(row.grams).toEqual(grams(150, null, true));
	});

	test('a range scales both ends', () => {
		const row = scaleIngredient(makeIngredient('2-3 cloves garlic'), grams(10, 15), 2);
		expect(row.ingredient.text).toBe('4–6 cloves garlic');
		expect(row.grams).toEqual(grams(20, 30));
	});

	test('words between unit and name stay', () => {
		expect(scaleIngredient(makeIngredient('1 cup of flour'), null, 2).ingredient.text).toBe(
			'2 cups of flour'
		);
	});

	test('a number inside the name is not touched', () => {
		expect(
			scaleIngredient(makeIngredient('2 3-inch cinnamon sticks'), null, 2).ingredient.text
		).toBe('4 3-inch cinnamon sticks');
	});

	test.each([
		'salt to taste',
		'juice of half a lemon',
		'flaky sea salt, for topping',
		'zest of 1 lemon',
		'Butter, 2 tbsp'
	])('an unscalable line %j is returned unchanged', (line) => {
		const ingredient = makeIngredient(line);
		const row = scaleIngredient(ingredient, null, 2);
		expect(row.ingredient).toBe(ingredient);
		expect(row.grams).toBeNull();
	});

	test('at ×1 nothing is rewritten, typed text and grams included', () => {
		const ingredient = makeIngredient('1 1/2 tsp vanilla');
		const g = grams(6);
		const row = scaleIngredient(ingredient, g, 1);
		expect(row.ingredient).toBe(ingredient);
		expect(row.grams).toBe(g);
	});
});
