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
});
