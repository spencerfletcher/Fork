import { describe, test, expect } from 'vitest';
import { parseRecipeMeta, parseRecipeContent, type Result } from './validation';

function form(fields: Record<string, string | string[]>): FormData {
	const fd = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		for (const v of Array.isArray(value) ? value : [value]) fd.append(key, v);
	}
	return fd;
}

const rejected = { ok: false, error: expect.any(String) };

function unwrap<T>(result: Result<T>): T {
	if (!result.ok) throw new Error(result.error);
	return result.value;
}

function meta(fields: Record<string, string | string[]>) {
	return parseRecipeMeta(form(fields));
}

function content(fields: Record<string, string | string[]>) {
	return parseRecipeContent(form(fields));
}

describe('parseRecipeMeta', () => {
	test('parses all metadata fields', () => {
		const result = unwrap(
			meta({
				title: '  Cookies ',
				description: ' Chewy ',
				servings: '12',
				prepTimeMinutes: '15',
				cookTimeMinutes: '10',
				isPublic: 'on',
				tags: ['dessert', 'baking']
			})
		);
		expect(result).toEqual({
			title: 'Cookies',
			description: 'Chewy',
			servings: 12,
			prepTimeMinutes: 15,
			cookTimeMinutes: 10,
			isPublic: true,
			tagNames: ['dessert', 'baking']
		});
	});

	test('treats missing optional fields as absent', () => {
		expect(unwrap(meta({ title: 'Cookies' }))).toEqual({
			title: 'Cookies',
			description: null,
			servings: null,
			prepTimeMinutes: null,
			cookTimeMinutes: null,
			isPublic: false,
			tagNames: []
		});
	});

	test('treats blank optional fields as absent', () => {
		const result = unwrap(
			meta({
				title: 'Cookies',
				description: '  ',
				servings: '',
				prepTimeMinutes: ' ',
				cookTimeMinutes: ''
			})
		);
		expect(result).toMatchObject({
			description: null,
			servings: null,
			prepTimeMinutes: null,
			cookTimeMinutes: null
		});
	});

	test('rejects when title is missing or blank', () => {
		expect(meta({ title: '  ' })).toEqual(rejected);
		expect(meta({})).toEqual(rejected);
	});

	describe('integer fields', () => {
		const bad = ['x', '2.5', '2.0', '4people', '-3', '1e2', '0x10', '+4'];

		test.each(bad)('rejects servings %j', (value) => {
			expect(meta({ title: 'Cookies', servings: value })).toEqual(rejected);
		});

		test.each(bad)('rejects prep time %j', (value) => {
			expect(meta({ title: 'Cookies', prepTimeMinutes: value })).toEqual(rejected);
		});

		test('rejects zero servings', () => {
			expect(meta({ title: 'Cookies', servings: '0' })).toEqual(rejected);
		});

		test('keeps zero prep and cook time', () => {
			const result = unwrap(meta({ title: 'Cookies', prepTimeMinutes: '0', cookTimeMinutes: '0' }));
			expect(result.prepTimeMinutes).toBe(0);
			expect(result.cookTimeMinutes).toBe(0);
		});

		test('trims surrounding whitespace', () => {
			expect(unwrap(meta({ title: 'Cookies', servings: ' 4 ' })).servings).toBe(4);
		});

		test('rejects above the integer column limit', () => {
			expect(unwrap(meta({ title: 'Cookies', servings: '2147483647' })).servings).toBe(2147483647);
			expect(meta({ title: 'Cookies', servings: '2147483648' })).toEqual(rejected);
		});
	});
});

describe('parseRecipeContent', () => {
	const ingredients = JSON.stringify([{ amount: '1', unit: 'cup', name: 'flour' }]);
	const steps = JSON.stringify([{ text: 'Mix.' }]);

	test('parses ingredients and normalizes steps', () => {
		const result = unwrap(
			content({ ingredients, steps: JSON.stringify([{ step: 7, text: 'Mix.' }]) })
		);
		expect(result).toEqual({
			ingredients: [{ amount: '1', unit: 'cup', name: 'flour' }],
			steps: [{ step: 1, text: 'Mix.' }]
		});
	});

	test('rejects invalid JSON', () => {
		expect(content({ ingredients: '{bad', steps })).toEqual(rejected);
		expect(content({ ingredients, steps: '{bad' })).toEqual(rejected);
	});

	test('rejects when a list is missing, not an array, or empty', () => {
		expect(content({ steps })).toEqual(rejected);
		expect(content({ ingredients: '{}', steps })).toEqual(rejected);
		expect(content({ ingredients: '[]', steps })).toEqual(rejected);
		expect(content({ ingredients })).toEqual(rejected);
		expect(content({ ingredients, steps: '"Mix."' })).toEqual(rejected);
		expect(content({ ingredients, steps: '[]' })).toEqual(rejected);
	});

	describe('steps', () => {
		function stepsOf(raw: unknown[]) {
			return unwrap(content({ ingredients, steps: JSON.stringify(raw) })).steps;
		}

		test('renumbers steps sequentially from 1', () => {
			expect(
				stepsOf([
					{ step: 4, text: 'Mix.' },
					{ step: 9, text: 'Bake.' }
				])
			).toEqual([
				{ step: 1, text: 'Mix.' },
				{ step: 2, text: 'Bake.' }
			]);
		});

		test('trims step text', () => {
			expect(stepsOf([{ text: '  Mix.  ' }])).toEqual([{ step: 1, text: 'Mix.' }]);
		});

		test('keeps a valid annotation', () => {
			const result = stepsOf([
				{ step: 1, text: 'Bake.', annotation: { type: 'warning', text: 'Oven runs hot.' } }
			]);
			expect(result[0].annotation).toEqual({ type: 'warning', text: 'Oven runs hot.' });
		});

		test('trims annotation text', () => {
			const result = stepsOf([
				{ step: 1, text: 'Bake.', annotation: { type: 'tip', text: '  Use parchment.  ' } }
			]);
			expect(result[0].annotation).toEqual({ type: 'tip', text: 'Use parchment.' });
		});

		test('drops an annotation the editor added but left blank', () => {
			const result = stepsOf([
				{ step: 1, text: 'Bake.', annotation: { type: 'tip', text: '   ' } }
			]);
			expect(result[0]).toEqual({ step: 1, text: 'Bake.' });
		});

		test('ignores fields other than step text and annotation', () => {
			const result = stepsOf([{ step: 1, text: 'Bake.', injected: true }]);
			expect(result[0]).toEqual({ step: 1, text: 'Bake.' });
		});

		test.each([
			['an unknown annotation type', { text: 'Bake.', annotation: { type: 'script', text: 'x' } }],
			['a non-object annotation', { text: 'Bake.', annotation: 'tip' }],
			['non-string annotation text', { text: 'Bake.', annotation: { type: 'tip', text: 1 } }],
			['a null step', null],
			['a string step', 'Bake.'],
			['a step without text', {}],
			['blank step text', { text: '   ' }],
			['non-string step text', { text: 42 }]
		])('rejects %s', (_, step) => {
			expect(content({ ingredients, steps: JSON.stringify([step]) })).toEqual(rejected);
		});
	});

	describe('ingredients', () => {
		function ingredientsOf(raw: unknown[]) {
			return unwrap(content({ ingredients: JSON.stringify(raw), steps })).ingredients;
		}

		test('passes a full ingredient through unchanged', () => {
			expect(ingredientsOf([{ amount: 'to taste', unit: '', name: 'salt' }])).toEqual([
				{ amount: 'to taste', unit: '', name: 'salt' }
			]);
		});

		test('defaults missing amount and unit to empty strings', () => {
			expect(ingredientsOf([{ name: 'salt' }])).toEqual([{ amount: '', unit: '', name: 'salt' }]);
		});

		test('trims string fields', () => {
			expect(ingredientsOf([{ amount: ' 1 ', unit: ' cup ', name: ' flour ' }])).toEqual([
				{ amount: '1', unit: 'cup', name: 'flour' }
			]);
		});

		test('ignores fields other than amount, unit and name', () => {
			expect(ingredientsOf([{ name: 'flour', injected: true }])).toEqual([
				{ amount: '', unit: '', name: 'flour' }
			]);
		});

		test.each([
			['a null ingredient', null],
			['a string ingredient', 'flour'],
			['an ingredient without a name', {}],
			['a blank name', { name: '  ' }],
			['a non-string name', { name: 1 }],
			['a non-string amount', { amount: 1, unit: 'cup', name: 'flour' }],
			['a non-string unit', { amount: '1', unit: ['cup'], name: 'flour' }]
		])('rejects %s', (_, ingredient) => {
			expect(content({ ingredients: JSON.stringify([ingredient]), steps })).toEqual(rejected);
		});
	});
});
