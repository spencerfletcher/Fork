import { describe, test, expect } from 'vitest';
import { makeIngredient } from './fixtures';
import { scaleIngredient } from './scale';
import { convertIngredient, TOLERANCE, UNITS } from './convert';
import type { Measurement } from '#lib/measurement.js';

const grams = (g: number) => ({ grams: g, grams2: null, approximate: false });

/** The line as the cook's units show it, or null when it stays as written. */
function shown(line: string, to: Measurement | null, factor = 1) {
	const scaled = scaleIngredient(makeIngredient(line), null, factor).ingredient;
	const { ingredient, written } = convertIngredient(scaled, null, to);
	return written === null ? null : { text: ingredient.text, written };
}

describe('convertIngredient: to metric', () => {
	test.each([
		// mass
		['8 oz cream cheese', '225 g cream cheese', '8 oz'],
		['1 ounce chocolate', '28 g chocolate', '1 ounce'],
		['1 lb ground beef', '455 g ground beef', '1 lb'],
		['2 pounds potatoes', '905 g potatoes', '2 pounds'],
		['3 lbs pork shoulder', '1.36 kg pork shoulder', '3 lbs'],
		// volume
		['1 cup milk', '235 ml milk', '1 cup'],
		['1/2 cup milk', '120 ml milk', '1/2 cup'],
		['1/3 cup oil', '80 ml oil', '1/3 cup'],
		['4 fl oz cream', '120 ml cream', '4 fl oz'],
		['1 pint stock', '475 ml stock', '1 pint'],
		['1 quart water', '945 ml water', '1 quart'],
		['2 quarts water', '1.89 L water', '2 quarts'],
		['1 gallon water', '3.79 L water', '1 gallon'],
		['2 Cups flour', '475 ml flour', '2 Cups']
	])('%s → %s', (line, text, written) => {
		expect(shown(line, 'metric')).toEqual({ text, written });
	});

	test('small spoon measures stay as written', () => {
		for (const line of [
			'1/2 tsp salt',
			'1 Tbsp sugar',
			'2 tablespoons oil',
			'1 T butter',
			'3 tsp vanilla'
		])
			expect(shown(line, 'metric')).toBeNull();
	});

	test('quantities already metric keep the author’s numbers', () => {
		for (const line of [
			'250 g butter',
			'1.5 kg potatoes',
			'500 ml stock',
			'1 L water',
			'100g sugar'
		])
			expect(shown(line, 'metric')).toBeNull();
	});
});

describe('convertIngredient: to US', () => {
	test.each([
		// mass
		['250 g butter', '8¾ oz butter', '250 g'],
		['100g sugar', '3½ oz sugar', '100g'],
		['454 g beef', '1 lb beef', '454 g'],
		['500 g pasta', '17¾ oz pasta', '500 g'],
		['1 kg potatoes', '2¼ lb potatoes', '1 kg'],
		// volume
		['500 ml stock', '2 cups stock', '500 ml'],
		['250 ml milk', '1 cup milk', '250 ml'],
		['300 ml cream', '1¼ cups cream', '300 ml'],
		['150 ml water', '⅔ cup water', '150 ml'],
		['60 ml oil', '¼ cup oil', '60 ml'],
		['45 ml oil', '3 tbsp oil', '45 ml'],
		['15 ml vinegar', '1 tbsp vinegar', '15 ml'],
		['5 ml vanilla', '1 tsp vanilla', '5 ml'],
		['1 L water', '1 quart water', '1 L'],
		['2 l water', '2 quarts water', '2 l']
	])('%s → %s', (line, text, written) => {
		expect(shown(line, 'us')).toEqual({ text, written });
	});

	test('natural units: 3 tsp is a tablespoon, 16 tbsp a cup, 16 oz a pound', () => {
		const ml = (id: keyof typeof UNITS, n: number) => `${UNITS[id].size * n} ml water`;
		expect(shown(ml('teaspoon', 3), 'us')?.text).toBe('1 tbsp water');
		expect(shown(ml('tablespoon', 16), 'us')?.text).toBe('1 cup water');
		expect(shown(`${UNITS.ounce.size * 16} g flour`, 'us')?.text).toBe('1 lb flour');
	});

	test('a size no cookable measure is within tolerance of stays as written', () => {
		// 200 ml is between ¾ and 1 cup and over the 4 tbsp a cook would spoon.
		expect(shown('200 ml milk', 'us')).toBeNull();
		// 5 g is ⅙ oz: no kitchen fraction of an ounce is near it.
		expect(shown('5 g yeast', 'us')).toBeNull();
	});

	test('quantities already US keep the author’s numbers', () => {
		for (const line of [
			'2 cups flour',
			'8 oz cream cheese',
			'1 lb beef',
			'1/2 tsp salt',
			'1 pint stock'
		])
			expect(shown(line, 'us')).toBeNull();
	});
});

describe('convertIngredient: what never converts', () => {
	test.each([
		'3 cloves garlic',
		'2 large eggs',
		'1 pinch salt',
		'1 stick butter',
		'salt to taste',
		'1 (14 oz) can tomatoes',
		'zest of 1 lemon'
	])('%s stays as written in both', (line) => {
		expect(shown(line, 'metric')).toBeNull();
		expect(shown(line, 'us')).toBeNull();
	});

	test('no preference is as written: the same objects come back', () => {
		const ingredient = makeIngredient('2 cups flour');
		const g = grams(250);
		const result = convertIngredient(ingredient, g, null);
		expect(result.ingredient).toBe(ingredient);
		expect(result.grams).toBe(g);
		expect(result.written).toBeNull();
	});

	test('a size too small to round within tolerance stays as written', () => {
		// 0.05 oz is 1.4 g; 1 g is further off than the tolerance allows.
		expect(Math.abs(1 - 0.05 * UNITS.ounce.size) / (0.05 * UNITS.ounce.size)).toBeGreaterThan(
			TOLERANCE
		);
		expect(shown('0.05 oz saffron', 'metric')).toBeNull();
	});
});

describe('convertIngredient: rounding', () => {
	test.each([
		// 1 g steps below 50 g, 5 g from 50, 10 g from 1 kg (shown in kg)
		[`${49.4 / UNITS.ounce.size} oz x`, '49 g x'],
		[`${51.4 / UNITS.ounce.size} oz x`, '50 g x'],
		[`${53 / UNITS.ounce.size} oz x`, '55 g x'],
		[`${998 / UNITS.ounce.size} oz x`, '1 kg x'],
		[`${1234 / UNITS.ounce.size} oz x`, '1.23 kg x']
	])('%s → %s', (line, text) => {
		expect(shown(line, 'metric')?.text).toBe(text);
	});
});

describe('convertIngredient: ranges and scaling', () => {
	test('a range converts both ends in one unit', () => {
		expect(shown('2-3 cups milk', 'metric')).toEqual({
			text: '475–710 ml milk',
			written: '2-3 cups'
		});
		expect(shown('1-2 kg potatoes', 'us')?.text).toBe('2¼–4½ lb potatoes');
	});

	test('a range whose top end cannot round stays as written', () => {
		expect(shown('150-200 ml milk', 'us')).toBeNull();
	});

	test('scale first, then convert, rounding once from the full-precision quantity', () => {
		// ⅓ cup × 3 is exactly 1 cup; rounding the scaled ⅓ first would drift.
		expect(shown('1/3 cup oil', 'metric', 3)).toEqual({ text: '235 ml oil', written: '1 cup' });
		expect(shown('227 g butter', 'us', 2)).toEqual({ text: '1 lb butter', written: '454 g' });
	});

	test('the gram hint stays on volumes; a converted weight already shows grams on one side', () => {
		const g = grams(125);
		expect(convertIngredient(makeIngredient('1 cup flour'), g, 'metric').grams).toBe(g);
		expect(convertIngredient(makeIngredient('8 oz cheese'), grams(227), 'metric').grams).toBeNull();
		expect(convertIngredient(makeIngredient('250 g butter'), g, 'us').grams).toBeNull();
		expect(convertIngredient(makeIngredient('500 ml milk'), g, 'us').grams).toBe(g);
	});

	test('the converted row carries its quantities and unit', () => {
		const { ingredient } = convertIngredient(makeIngredient('2-3 cups milk'), null, 'metric');
		expect(ingredient).toMatchObject({ quantity: 475, quantity2: 710, unit: 'ml', name: 'milk' });
	});
});
