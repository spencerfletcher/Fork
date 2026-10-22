import { describe, test, expect } from 'vitest';
import { parseRecipeMeta, parseRecipeContent } from './validation';

function form(fields: Record<string, string | string[]>): FormData {
	const fd = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		for (const v of Array.isArray(value) ? value : [value]) fd.append(key, v);
	}
	return fd;
}

const rejects = expect.objectContaining({ status: 400 });

describe('parseRecipeMeta', () => {
	test('parses all metadata fields', () => {
		const result = parseRecipeMeta(
			form({
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
		expect(parseRecipeMeta(form({ title: 'Cookies' }))).toEqual({
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
		const result = parseRecipeMeta(
			form({
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

	test('throws 400 when title is missing or blank', () => {
		expect(() => parseRecipeMeta(form({ title: '  ' }))).toThrow(rejects);
		expect(() => parseRecipeMeta(form({}))).toThrow(rejects);
	});

	describe('integer fields', () => {
		const bad = ['x', '2.5', '2.0', '4people', '-3', '1e2', '0x10', '+4'];

		test.each(bad)('throws 400 on servings %j', (value) => {
			expect(() => parseRecipeMeta(form({ title: 'Cookies', servings: value }))).toThrow(rejects);
		});

		test.each(bad)('throws 400 on prep time %j', (value) => {
			expect(() => parseRecipeMeta(form({ title: 'Cookies', prepTimeMinutes: value }))).toThrow(
				rejects
			);
		});

		test('throws 400 on zero servings', () => {
			expect(() => parseRecipeMeta(form({ title: 'Cookies', servings: '0' }))).toThrow(rejects);
		});

		test('keeps zero prep and cook time', () => {
			const result = parseRecipeMeta(
				form({ title: 'Cookies', prepTimeMinutes: '0', cookTimeMinutes: '0' })
			);
			expect(result.prepTimeMinutes).toBe(0);
			expect(result.cookTimeMinutes).toBe(0);
		});

		test('trims surrounding whitespace', () => {
			expect(parseRecipeMeta(form({ title: 'Cookies', servings: ' 4 ' })).servings).toBe(4);
		});

		test('throws 400 above the integer column limit', () => {
			expect(parseRecipeMeta(form({ title: 'Cookies', servings: '2147483647' })).servings).toBe(
				2147483647
			);
			expect(() => parseRecipeMeta(form({ title: 'Cookies', servings: '2147483648' }))).toThrow(
				rejects
			);
		});
	});
});

describe('parseRecipeContent', () => {
	const ingredients = JSON.stringify([{ amount: '1', unit: 'cup', name: 'flour' }]);
	const steps = JSON.stringify([{ text: 'Mix.' }]);

	test('parses ingredients and normalizes steps', () => {
		const result = parseRecipeContent(
			form({ ingredients, steps: JSON.stringify([{ step: 7, text: 'Mix.' }]) })
		);
		expect(result).toEqual({
			ingredients: [{ amount: '1', unit: 'cup', name: 'flour' }],
			steps: [{ step: 1, text: 'Mix.' }]
		});
	});

	test('throws 400 on invalid JSON', () => {
		expect(() => parseRecipeContent(form({ ingredients: '{bad', steps }))).toThrow(rejects);
		expect(() => parseRecipeContent(form({ ingredients, steps: '{bad' }))).toThrow(rejects);
	});

	test('throws 400 when a list is missing, not an array, or empty', () => {
		expect(() => parseRecipeContent(form({ steps }))).toThrow(rejects);
		expect(() => parseRecipeContent(form({ ingredients: '{}', steps }))).toThrow(rejects);
		expect(() => parseRecipeContent(form({ ingredients: '[]', steps }))).toThrow(rejects);
		expect(() => parseRecipeContent(form({ ingredients }))).toThrow(rejects);
		expect(() => parseRecipeContent(form({ ingredients, steps: '"Mix."' }))).toThrow(rejects);
		expect(() => parseRecipeContent(form({ ingredients, steps: '[]' }))).toThrow(rejects);
	});

	describe('steps', () => {
		function stepsOf(raw: unknown[]) {
			return parseRecipeContent(form({ ingredients, steps: JSON.stringify(raw) })).steps;
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
		])('throws 400 on %s', (_, step) => {
			expect(() => stepsOf([step])).toThrow(rejects);
		});
	});

	describe('ingredients', () => {
		function ingredientsOf(raw: unknown[]) {
			return parseRecipeContent(form({ ingredients: JSON.stringify(raw), steps })).ingredients;
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
		])('throws 400 on %s', (_, ingredient) => {
			expect(() => ingredientsOf([ingredient])).toThrow(rejects);
		});
	});
});
