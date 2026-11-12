import { describe, test, expect } from 'vitest';
import { makeContent, makeIngredient } from './fixtures';
import {
	FRACTIONS,
	MAX_SCALE,
	NOT_SCALED,
	SCALED_NOTES,
	SCALE_MESSAGES,
	formatGrams,
	formatScaled,
	formatServes,
	linkedCount,
	readScale,
	scaleIngredient,
	scaleMakes,
	scaleQuantity,
	scaling
} from './scale';

const grams = (g: number, g2: number | null = null, approximate = false) => ({
	grams: g,
	grams2: g2,
	approximate,
	likeWater: false
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
		// Too small for a tenth: one significant digit rather than a zero.
		[0.03125, '0.03'],
		// ⅛ tsp at 0.25 of 12 serves.
		[0.125 * (0.25 / 12), '0.003'],
		[0, '0'],
		// A positive quantity stays positive whatever the unit: 0.0005 kg is half a gram.
		[0.0005, '0.0005'],
		[1e-7, '0.0000001'],
		[0, '0']
	])('%j → %j', (n, expected) => {
		expect(formatScaled(n)).toBe(expected);
	});
});

describe('formatGrams', () => {
	test.each([
		[grams(120), '120g'],
		[grams(5.66), '5.7g'],
		[grams(9.96), '10g'],
		// Too small for a tenth: one significant digit, as a quantity, never 0g.
		[grams(0.03), '0.03g'],
		[grams(0.004, 0.008), '0.004–0.008g'],
		[grams(100, null, true), '≈100g'],
		[grams(0), '0g']
	])('%j → %j', (result, expected) => {
		expect(formatGrams(result)).toBe(expected);
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

describe('readScale', () => {
	// On a recipe that serves 4: a bare number is a count in the box's units.
	const BASE = 4;
	test.each([
		['8', 8 / BASE],
		['0.5', 0.5 / BASE],
		['.5', 0.5 / BASE],
		['1/2', 0.5 / BASE],
		['1 1/2', 1.5 / BASE],
		['1,5', 1.5 / BASE],
		[' 6 ', 6 / BASE],
		['2.346', 2.346 / BASE],
		[FRACTIONS['1/2'], 0.5 / BASE],
		[`1${FRACTIONS['1/4']}`, 1.25 / BASE],
		[`2 ${FRACTIONS['3/4']}`, 2.75 / BASE],
		[FRACTIONS['1/3'], 1 / 3 / BASE],
		[FRACTIONS['2/3'], 2 / 3 / BASE],
		['2x', 2],
		['2 x', 2],
		['x2', 2],
		['X2', 2],
		['×1.5', 1.5],
		['1.5×', 1.5],
		['1/2x', 0.5],
		[`${FRACTIONS['1/2']}x`, 0.5],
		['1,5x', 1.5],
		['50%', 0.5],
		['150 %', 1.5],
		[`${MAX_SCALE}x`, MAX_SCALE],
		[`${1 / MAX_SCALE}x`, 1 / MAX_SCALE]
	])('%j reads as ×%d', (typed, factor) => {
		const read = readScale(typed, BASE);
		expect(read.ok && read.factor).toBeCloseTo(factor, 10);
	});

	test('with no count to scale by (a base of 1), a bare number is the multiplier', () => {
		expect(readScale('2', 1)).toEqual({ ok: true, factor: 2 });
	});

	test.each([
		['', 'unreadable'],
		['lots', 'unreadable'],
		['x', 'unreadable'],
		['2x2', 'unreadable'],
		['2xx', 'unreadable'],
		['1e3', 'unreadable'],
		['0x10', 'unreadable'],
		['Infinity', 'unreadable'],
		['1/0', 'unreadable'],
		['6abc', 'unreadable'],
		['%', 'unreadable'],
		['0', 'zero'],
		['0x', 'zero'],
		['0%', 'zero'],
		['0/2', 'zero'],
		['-2', 'negative'],
		['−2', 'negative'],
		['-50%', 'negative'],
		['-x2', 'negative'],
		[`${MAX_SCALE * 1.01}x`, 'outOfRange'],
		[String(MAX_SCALE * BASE + 1), 'outOfRange'],
		[`${MAX_SCALE * 100 + 1}%`, 'outOfRange'],
		[`${1 / MAX_SCALE / 2}x`, 'outOfRange']
	] as const)('%j is refused as %s, with its message', (typed, reason) => {
		expect(readScale(typed, BASE)).toEqual({ ok: false, reason });
		expect(SCALE_MESSAGES[reason]).toMatch(/\S/);
	});
});

describe('scaling', () => {
	const serves4 = makeContent({ servings: 4, makes: '12 buns' });
	const cookies = makeContent({ servings: null, makes: '36 cookies' });
	const loaf = makeContent({ servings: null, makes: 'one 9-inch loaf' });
	const pan = makeContent({ servings: null, makes: 'one 9x13 pan' });
	const params = (search: string) => new URLSearchParams(search);

	test('Serves drives and Makes follows: ?serves= is the count', () => {
		expect(scaling(serves4, linkedCount(serves4, params('?serves=6')))).toEqual({
			by: 'serves',
			base: 4,
			count: 6,
			factor: 1.5,
			scaled: true,
			unit: 'servings',
			serves: '6',
			makes: { text: '18 buns', scaled: true, flagged: false }
		});
	});

	test('a typed multiplier in ?serves= reads too; ?scale= is not a Serves recipe’s param', () => {
		expect(linkedCount(serves4, params('?serves=2x'))).toBe(8);
		expect(linkedCount(serves4, params('?scale=2'))).toBeNull();
	});

	test('unscaled, everything is as stored', () => {
		expect(scaling(serves4, null)).toMatchObject({
			count: 4,
			factor: 1,
			scaled: false,
			serves: '4',
			makes: { text: '12 buns', scaled: false, flagged: false }
		});
	});

	test('one serving is singular', () => {
		expect(scaling(serves4, 1)?.unit).toBe('serving');
	});

	test('Makes alone with a count scales by it: ?makes=72 is twice the batch', () => {
		expect(scaling(cookies, linkedCount(cookies, params('?makes=72')))).toEqual({
			by: 'makes',
			base: 36,
			count: 72,
			factor: 2,
			scaled: true,
			unit: 'cookies',
			serves: null,
			makes: { text: '72 cookies', scaled: true, flagged: false }
		});
		expect(linkedCount(cookies, params('?makes=x0.5'))).toBe(18);
		expect(linkedCount(cookies, params('?serves=8'))).toBeNull();
	});

	test('Makes with no leading number scales by a multiplier only: ?scale=2', () => {
		expect(scaling(loaf, linkedCount(loaf, params('?scale=2')))).toEqual({
			by: 'scale',
			base: 1,
			count: 2,
			factor: 2,
			scaled: true,
			unit: 'x',
			serves: null,
			makes: { text: 'one 9-inch loaf', scaled: false, flagged: false }
		});
	});

	test('a Makes with a pan size scales by multiplier, flagged as not scaled', () => {
		expect(scaling(pan, 2)).toMatchObject({
			by: 'scale',
			makes: { text: 'one 9x13 pan', scaled: false, flagged: true }
		});
	});

	test('no Serves and no Makes: nothing to scale', () => {
		const none = makeContent({ servings: null, makes: null });
		expect(scaling(none, null)).toBeNull();
		expect(linkedCount(none, params('?scale=2'))).toBeNull();
	});

	test('an unreadable or refused link is ignored', () => {
		for (const bad of ['lots', '0', '-2', String(MAX_SCALE * 4 + 1)])
			expect(linkedCount(serves4, params(`?serves=${bad}`))).toBeNull();
	});

	test('the count is kept to two decimals, and the factor follows the count kept', () => {
		const third = scaling(serves4, linkedCount(serves4, params('?serves=1/3')))!;
		expect(third.count).toBe(0.33);
		expect(third.factor).toBe(0.33 / 4);
	});
});

describe('scaled metric quantities', () => {
	// Spencer: "rounding to whole grams". Under 1 g or ml, one decimal, then
	// one significant digit: never 0.
	test.each([
		['800 g tomatoes', 7 / 3, '1867 g tomatoes'],
		['800 g tomatoes', 0.5, '400 g tomatoes'],
		['250 ml milk', 1 / 3, '83 ml milk'],
		['5 g salt', 0.5, '3 g salt'],
		['3 g salt', 1 / 4, '0.8 g salt'],
		['1 g saffron', 1 / 50, '0.02 g saffron'],
		['2-3 g yeast', 1.5, '3–5 g yeast'],
		['1.4 kg pork', 4 / 3, '1.87 kg pork'],
		['1 kg flour', 1.5, '1.5 kg flour'],
		['2 L stock', 1 / 3, '0.67 L stock'],
		['0.006 kg saffron', 0.25 / 12, '0.0001 kg saffron'],
		['1 dl cream', 1 / 3, '0.33 dl cream']
	])('%j ×%d reads %j', (line, factor, text) => {
		expect(scaleIngredient(makeIngredient(line), null, factor).ingredient.text).toBe(text);
	});

	test('cups, spoons and counts keep their glyphs', () => {
		expect(scaleIngredient(makeIngredient('1 cup sugar'), null, 2 / 3).ingredient.text).toBe(
			`${FRACTIONS['2/3']} cup sugar`
		);
		expect(scaleIngredient(makeIngredient('3 eggs'), null, 0.5).ingredient.text).toBe(
			`1${FRACTIONS['1/2']} eggs`
		);
	});
});

describe('the scaled notice', () => {
	test('keeps the owner’s sentence as its core, in both forms', () => {
		expect(NOT_SCALED).toBe('Pan sizes and oven temperatures are not scaled');
		for (const note of Object.values(SCALED_NOTES)) expect(note.startsWith(NOT_SCALED)).toBe(true);
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

	test('tiny quantities keep their value in any unit: kg, tsp and a counted line', () => {
		const small = 0.25 / 12;
		expect(scaleIngredient(makeIngredient('0.006 kg saffron'), null, small).ingredient.text).toBe(
			'0.0001 kg saffron'
		);
		expect(scaleIngredient(makeIngredient('1/8 tsp salt'), null, small).ingredient.text).toBe(
			'0.003 tsp salt'
		);
		expect(scaleIngredient(makeIngredient('1 egg'), null, small).ingredient.text).toBe('0.02 egg');
	});

	test('a tiny range keeps both ends positive', () => {
		expect(
			scaleIngredient(makeIngredient('0.02-0.04 kg yeast'), null, 0.25 / 12).ingredient.text
		).toBe('0.0004–0.0008 kg yeast');
	});

	test('a genuine zero stays zero at any multiplier', () => {
		expect(scaleIngredient(makeIngredient('0 g sugar'), null, 2).ingredient.text).toBe('0 g sugar');
		expect(scaleIngredient(makeIngredient('0 g sugar'), null, 0.25).ingredient.text).toBe(
			'0 g sugar'
		);
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

describe('scaleMakes', () => {
	test.each([
		['12 buns', 1.5, '18 buns'],
		['about 1.8 L', 0.5, 'about 0.9 L'],
		['≈ 2 loaves', 2, '≈ 4 loaves'],
		['1½ L', 2, '3 L'],
		['1/2 sheet cake', 2, '1 sheet cake'],
		['36 cookies', 0.5, '18 cookies'],
		['1 1/2 dozen', 1.5, '2¼ dozen'],
		['1 ½ L', 2, '3 L'],
		['about 2 1/2 cups', 2, 'about 5 cups']
	])('%j at ×%d reads %j, scaled', (makes, factor, text) => {
		expect(scaleMakes(makes, factor)).toEqual({ text, scaled: true, flagged: false });
	});

	test.each([
		['one 9x13 pan'],
		['9x13 pan'],
		['8 × 8 in tin'],
		['12 buns at 180°C'],
		['1 loaf, 350 F'],
		['12-14 buns'],
		['2 – 3 loaves']
	])(
		'%j has a size, temperature or range: not scaled, and flagged so the page says so',
		(makes) => {
			expect(scaleMakes(makes, 2)).toEqual({ text: makes, scaled: false, flagged: true });
		}
	);

	test.each([['a dozen'], ['one loaf']])(
		'%j has no single leading number: unchanged and not flagged',
		(makes) => {
			expect(scaleMakes(makes, 2)).toEqual({ text: makes, scaled: false, flagged: false });
		}
	);

	test.each([['12 buns'], ['9x13 pan']])('%j at ×1 is as typed, never flagged', (makes) => {
		expect(scaleMakes(makes, 1)).toEqual({ text: makes, scaled: false, flagged: false });
	});
});

// The yield's head noun follows the scaled count: one or less singular, more plural.
describe('scaleMakes inflects the head noun', () => {
	test.each([
		['1 loaf', 2, '2 loaves'],
		['36 cookies', 1 / 36, '1 cookie'],
		['1 loaf', 0.5, '½ loaf'],
		['1 loaf', 1.5, '1½ loaves'],
		['2 loaves', 0.5, '1 loaf'],
		['about 12 buns', 1 / 12, 'about 1 bun'],
		['≈ 2 loaves', 0.5, '≈ 1 loaf'],
		['2 loaves of bread', 0.5, '1 loaf of bread'],
		['1 loaf of bread', 3, '3 loaves of bread'],
		['12 large rolls', 1 / 12, '1 large roll'],
		['1 small round loaf, about 500 g', 2, '2 small round loaves, about 500 g'],
		['2 9-inch pies', 0.5, '1 9-inch pie'],
		['1 Loaf', 2, '2 Loaves'],
		['6 tortillas', 2, '12 tortillas'],
		['16 brownies', 1 / 16, '1 brownie'],
		['2 quiches', 0.5, '1 quiche'],
		['1 medium pizza', 2, '2 medium pizzas'],
		['1 sheet cake', 0.5, '½ sheet cake']
	])('%j at ×%d reads %j', (makes, factor, text) => {
		expect(scaleMakes(makes, factor).text).toBe(text);
	});

	test.each([
		['about 1.8 L', 0.5, 'about 0.9 L'],
		['500 ml sauce', 2, '1000 ml sauce'],
		['2 kg', 0.5, '1 kg'],
		['1 cup', 2, '2 cup'],
		['1 1/2 dozen', 1.5, '2¼ dozen'],
		['2 dozen cookies', 0.5, '1 dozen cookies'],
		['1 PBJ', 2, '2 PBJ'],
		['2 pcs.', 0.5, '1 pcs.'],
		['12 餃子', 0.5, '6 餃子']
	])(
		'%j at ×%d reads %j: a unit, abbreviation, count word or non-Latin noun is left as typed',
		(makes, factor, text) => {
			expect(scaleMakes(makes, factor).text).toBe(text);
		}
	);

	test('the stored text is never rewritten unscaled', () => {
		expect(scaleMakes('1 loaves', 1).text).toBe('1 loaves');
	});

	test('the scaler’s unit follows its count', () => {
		const loaf = makeContent({ servings: null, makes: '1 loaf' });
		expect(scaling(loaf, 2)?.unit).toBe('loaves');
		expect(scaling(loaf, null)?.unit).toBe('loaf');
	});
});
