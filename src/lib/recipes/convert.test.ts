import { describe, test, expect } from 'vitest';
import { makeIngredient } from './fixtures';
import { scaleIngredient } from './scale';
import { convertIngredient, MIN_SPOON_GRAMS, TOLERANCE, UNITS } from './convert';
import type { Measurement } from '#lib/measurement.js';
import { gramsFor } from '#lib/server/ingredientDensities.js';
import { DENSITIES, ML_PER_UNIT } from '#lib/server/gramTables.js';

const grams = (g: number, liquid = false) => ({
	grams: g,
	grams2: null,
	approximate: false,
	liquid
});

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
		const g = grams(240, true);
		expect(convertIngredient(makeIngredient('1 cup milk'), g, 'metric').grams).toBe(g);
		expect(convertIngredient(makeIngredient('8 oz cheese'), grams(227), 'metric').grams).toBeNull();
		expect(convertIngredient(makeIngredient('250 g butter'), g, 'us').grams).toBeNull();
		expect(convertIngredient(makeIngredient('500 ml milk'), g, 'us').grams).toBe(g);
	});

	test('the converted row carries its quantities and unit', () => {
		const { ingredient } = convertIngredient(makeIngredient('2-3 cups milk'), null, 'metric');
		expect(ingredient).toMatchObject({ quantity: 475, quantity2: 710, unit: 'ml', name: 'milk' });
	});
});

/** The line with its own gram estimate, scaled first, as the page does. */
function weighed(line: string, to: Measurement = 'metric', factor = 1) {
	const typed = makeIngredient(line);
	const scaled = scaleIngredient(typed, gramsFor(typed), factor);
	const { ingredient, grams, written, estimate } = convertIngredient(
		scaled.ingredient,
		scaled.grams,
		to
	);
	return { text: ingredient.text, grams, written, estimate };
}

// Metric's steps: 1 g below 50, 5 g below 1000.
const metricGrams = (g: number) => (g < 50 ? Math.round(g) : Math.round(g / 5) * 5);
const cupsOf = (cups: number, key: string) => cups * ML_PER_UNIT.cup * DENSITIES[key];
const tspOf = (tsp: number, key: string) => tsp * ML_PER_UNIT.tsp * DENSITIES[key];

describe('convertIngredient: grams first for what is weighed', () => {
	test('a dry ingredient in cups leads with its weight, the cups in brackets, no second gram figure', () => {
		expect(weighed('2¼ cups all-purpose flour')).toEqual({
			text: `${metricGrams(cupsOf(2.25, 'all-purpose flour'))} g all-purpose flour`,
			grams: null,
			written: '2¼ cups',
			estimate: true
		});
	});

	test('a liquid stays in millilitres and keeps its gram hint', () => {
		const milk = weighed('1 cup milk');
		expect(milk).toMatchObject({ text: '235 ml milk', written: '1 cup', estimate: false });
		expect(milk.grams?.grams).toBeCloseTo(cupsOf(1, 'milk'));
	});

	test('honey is weighed, not poured', () => {
		expect(weighed('1/2 cup honey')).toMatchObject({
			text: `${metricGrams(cupsOf(0.5, 'honey'))} g honey`,
			written: '1/2 cup'
		});
	});

	test('a metric volume of something weighed leads with grams too', () => {
		expect(weighed('250 ml flour')).toMatchObject({
			text: `${metricGrams(250 * DENSITIES.flour)} g flour`,
			written: '250 ml'
		});
	});

	test(`a spoonful of at least ${MIN_SPOON_GRAMS} g leads with grams; under that, spoons stay`, () => {
		const tspSalt = tspOf(1, 'salt');
		expect(tspSalt).toBeGreaterThanOrEqual(MIN_SPOON_GRAMS);
		expect(weighed('1 tsp salt')).toMatchObject({
			text: `${metricGrams(tspSalt)} g salt`,
			written: '1 tsp',
			estimate: true
		});
		const at = MIN_SPOON_GRAMS / tspOf(1, 'salt');
		expect(weighed(`${at} tsp salt`).text).toBe(`${MIN_SPOON_GRAMS} g salt`);
		const under = (MIN_SPOON_GRAMS - 0.5) / tspOf(1, 'salt');
		expect(weighed(`${under} tsp salt`).written).toBeNull();
		// A whole gram under it rounds exactly, so only the threshold keeps the spoon.
		const whole = (MIN_SPOON_GRAMS - 1) / tspOf(1, 'salt');
		expect(weighed(`${whole} tsp salt`).written).toBeNull();
		expect(weighed('1/4 tsp espresso powder').written).toBeNull();
	});

	test('a spoonful of liquid stays a spoonful, however heavy', () => {
		expect(tspOf(2, 'vanilla extract')).toBeGreaterThanOrEqual(MIN_SPOON_GRAMS);
		expect(weighed('2 tsp vanilla extract').written).toBeNull();
		expect(weighed('2 tbsp lemon juice').written).toBeNull();
	});

	test('a weight that cannot round within tolerance leaves the spoon as written', () => {
		// 5.4 g rounds to 5 g, 7% off.
		const tsp = 5.4 / tspOf(1, 'salt');
		expect(Math.abs(5 - 5.4) / 5.4).toBeGreaterThan(TOLERANCE);
		expect(weighed(`${tsp} tsp salt`).written).toBeNull();
	});

	test('a volume with no estimate converts to millilitres as before', () => {
		expect(weighed('1 cup quinoa')).toMatchObject({ text: '235 ml quinoa', grams: null });
	});

	test('a range weighs both ends', () => {
		const [low, high] = [2, 3].map((n) => metricGrams(cupsOf(n, 'flour')));
		expect(weighed('2-3 cups flour')).toMatchObject({
			text: `${low}–${high} g flour`,
			written: '2-3 cups'
		});
	});

	test('scaled, the estimate is scaled first and rounded once', () => {
		// ⅓ cup is 42 g rounded; three of those would be 126 g, not a cup's 125 g.
		expect(metricGrams(cupsOf(1 / 3, 'flour')) * 3).not.toBe(metricGrams(cupsOf(1, 'flour')));
		expect(weighed('1/3 cup flour', 'metric', 3)).toMatchObject({
			text: `${metricGrams(cupsOf(1, 'flour'))} g flour`,
			written: '1 cup'
		});
		expect(weighed('1 cup flour', 'metric', 1.5)).toMatchObject({
			text: `${metricGrams(cupsOf(1.5, 'flour'))} g flour`,
			written: '1½ cups'
		});
	});

	test('a whole-item estimate is not promoted: counts stay counts', () => {
		expect(weighed('2 large eggs').written).toBeNull();
	});

	test('US is unchanged: cups stay cups, metric volumes become cups', () => {
		expect(weighed('2 cups flour', 'us').written).toBeNull();
		expect(weighed('1 tsp salt', 'us').written).toBeNull();
		expect(weighed('500 ml flour', 'us')).toMatchObject({
			text: '2 cups flour',
			estimate: false
		});
	});
});
