import { describe, test, expect } from 'vitest';
import { parseRecipeMeta, parseRecipeContent } from './validation';

function form(fields: Record<string, string | string[]>): FormData {
	const fd = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		for (const v of Array.isArray(value) ? value : [value]) fd.append(key, v);
	}
	return fd;
}

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

	test('defaults optional fields to null, false and empty', () => {
		const result = parseRecipeMeta(form({ title: 'Cookies', description: '  ', servings: 'x' }));
		expect(result).toEqual({
			title: 'Cookies',
			description: null,
			servings: null,
			prepTimeMinutes: null,
			cookTimeMinutes: null,
			isPublic: false,
			tagNames: []
		});
	});

	test('throws 400 when title is missing', () => {
		expect(() => parseRecipeMeta(form({ title: '  ' }))).toThrow(
			expect.objectContaining({ status: 400 })
		);
		expect(() => parseRecipeMeta(form({}))).toThrow(expect.objectContaining({ status: 400 }));
	});
});

describe('parseRecipeContent', () => {
	const ingredients = JSON.stringify([{ amount: '1', unit: 'cup', name: 'flour' }]);

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
		expect(() => parseRecipeContent(form({ ingredients: '{bad', steps: '[]' }))).toThrow(
			expect.objectContaining({ status: 400 })
		);
	});

	test('throws 400 when ingredients are empty', () => {
		expect(() =>
			parseRecipeContent(form({ ingredients: '[]', steps: JSON.stringify([{ text: 'Mix.' }]) }))
		).toThrow(expect.objectContaining({ status: 400 }));
	});

	test('throws 400 when steps are empty', () => {
		expect(() => parseRecipeContent(form({ ingredients, steps: '[]' }))).toThrow(
			expect.objectContaining({ status: 400 })
		);
	});

	describe('steps', () => {
		function steps(raw: unknown[]) {
			return parseRecipeContent(form({ ingredients, steps: JSON.stringify(raw) })).steps;
		}

		test('renumbers steps sequentially from 1', () => {
			expect(
				steps([
					{ step: 4, text: 'Mix.' },
					{ step: 9, text: 'Bake.' }
				])
			).toEqual([
				{ step: 1, text: 'Mix.' },
				{ step: 2, text: 'Bake.' }
			]);
		});

		test('keeps a valid annotation', () => {
			const result = steps([
				{ step: 1, text: 'Bake.', annotation: { type: 'warning', text: 'Oven runs hot.' } }
			]);
			expect(result[0].annotation).toEqual({ type: 'warning', text: 'Oven runs hot.' });
		});

		test('trims annotation text', () => {
			const result = steps([
				{ step: 1, text: 'Bake.', annotation: { type: 'tip', text: '  Use parchment.  ' } }
			]);
			expect(result[0].annotation).toEqual({ type: 'tip', text: 'Use parchment.' });
		});

		test('drops an annotation with empty text', () => {
			const result = steps([{ step: 1, text: 'Bake.', annotation: { type: 'tip', text: '   ' } }]);
			expect(result[0]).toEqual({ step: 1, text: 'Bake.' });
		});

		test('drops an annotation with an unknown type', () => {
			const result = steps([{ step: 1, text: 'Bake.', annotation: { type: 'script', text: 'x' } }]);
			expect(result[0]).toEqual({ step: 1, text: 'Bake.' });
		});

		test('drops an annotation that is not an object', () => {
			expect(steps([{ text: 'Bake.', annotation: 'tip' }])).toEqual([{ step: 1, text: 'Bake.' }]);
		});

		test('ignores fields other than step text and annotation', () => {
			const result = steps([{ step: 1, text: 'Bake.', injected: true }]);
			expect(result[0]).toEqual({ step: 1, text: 'Bake.' });
		});

		test('throws 400 on a null step', () => {
			expect(() => steps([null])).toThrow(expect.objectContaining({ status: 400 }));
		});

		test('throws 400 on a step without string text', () => {
			expect(() => steps([{ text: 42 }])).toThrow(expect.objectContaining({ status: 400 }));
		});
	});

	describe('ingredients', () => {
		function ingredientsOf(raw: unknown[]) {
			return parseRecipeContent(
				form({ ingredients: JSON.stringify(raw), steps: JSON.stringify([{ text: 'Mix.' }]) })
			).ingredients;
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

		test('drops a non-string amount', () => {
			expect(ingredientsOf([{ amount: 1, unit: 'cup', name: 'flour' }])).toEqual([
				{ amount: '', unit: 'cup', name: 'flour' }
			]);
		});

		test('ignores fields other than amount, unit and name', () => {
			expect(ingredientsOf([{ name: 'flour', injected: true }])).toEqual([
				{ amount: '', unit: '', name: 'flour' }
			]);
		});

		test('throws 400 on a null ingredient', () => {
			expect(() => ingredientsOf([null])).toThrow(expect.objectContaining({ status: 400 }));
		});

		test('throws 400 on an ingredient without a name', () => {
			expect(() => ingredientsOf([{}])).toThrow(expect.objectContaining({ status: 400 }));
		});

		test('throws 400 on a blank name', () => {
			expect(() => ingredientsOf([{ name: '  ' }])).toThrow(
				expect.objectContaining({ status: 400 })
			);
		});
	});
});
