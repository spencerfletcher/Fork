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
	const ingredients = '2¼ cups all-purpose flour\n2 large eggs';
	const steps = 'Mix.\n\nBake.\ntip: watch it';

	test('parses ingredient and step text', () => {
		const value = unwrap(content({ ingredients, steps }));
		expect(value.ingredients.map((i) => i.text)).toEqual([
			'2¼ cups all-purpose flour',
			'2 large eggs'
		]);
		expect(value.steps).toEqual([
			{ text: 'Mix.' },
			{ text: 'Bake.', annotation: { type: 'tip', text: 'watch it' } }
		]);
	});

	test('an unparsable ingredient line is kept, not rejected', () => {
		expect(unwrap(content({ ingredients: 'salt to taste', steps })).ingredients[0]).toMatchObject({
			quantity: null,
			name: 'salt to taste'
		});
	});

	test.each(['', '   \n\n'])('rejects ingredients %j with the existing message', (value) => {
		expect(content({ ingredients: value, steps })).toEqual({
			ok: false,
			error: 'At least one ingredient is required'
		});
	});

	test.each(['', '   \n\n'])('rejects steps %j with the existing message', (value) => {
		expect(content({ ingredients, steps: value })).toEqual({
			ok: false,
			error: 'At least one step is required'
		});
	});

	test('rejects an ingredient line longer than 300 characters before parsing it', () => {
		const long = '1/2 '.repeat(100);
		expect(content({ ingredients: `1 cup flour\n${long}`, steps })).toEqual({
			ok: false,
			error: 'An ingredient line is too long (300 characters max)'
		});
	});

	test('rejects step text longer than 20,000 characters', () => {
		expect(content({ ingredients, steps: 'x'.repeat(20_001) })).toEqual({
			ok: false,
			error: 'Steps are too long (20,000 characters max)'
		});
	});

	test('a missing field is treated as empty text', () => {
		expect(content({ steps })).toEqual({
			ok: false,
			error: 'At least one ingredient is required'
		});
	});
});
