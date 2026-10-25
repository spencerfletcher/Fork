import { describe, test, expect } from 'vitest';
import {
	parseRecipeMeta,
	parseRecipeContent,
	parseContent,
	parseSettings,
	draftOf,
	type Result
} from './validation';

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

// ─── One-save parsers ─────────────────────────────────────────────────────────

const FULL = {
	title: 'Cookies',
	description: 'Crisp edges.',
	servings: '4',
	prepTimeMinutes: '10',
	cookTimeMinutes: '20',
	ingredients: '1 cup flour\n2 eggs',
	steps: 'Mix.\n\nBake.'
};

describe('parseContent', () => {
	test('parses every content field from one form', () => {
		const value = unwrap(parseContent(form(FULL)));
		expect(value).toMatchObject({
			title: 'Cookies',
			description: 'Crisp edges.',
			servings: 4,
			prepTimeMinutes: 10,
			cookTimeMinutes: 20
		});
		expect(value.ingredients.map((i) => i.text)).toEqual(['1 cup flour', '2 eggs']);
		expect(value.steps.map((s) => s.text)).toEqual(['Mix.', 'Bake.']);
	});

	test('rejects a blank title', () => {
		expect(parseContent(form({ ...FULL, title: '  ' }))).toEqual({
			ok: false,
			error: 'Title is required'
		});
	});

	test('keeps the existing ingredient line cap', () => {
		expect(parseContent(form({ ...FULL, ingredients: '1 cup ' + 'x'.repeat(300) }))).toEqual({
			ok: false,
			error: 'An ingredient line is too long (300 characters max)'
		});
	});

	test('blank description and numbers are null', () => {
		const value = unwrap(
			parseContent(form({ ...FULL, description: '', servings: '', prepTimeMinutes: '' }))
		);
		expect(value.description).toBeNull();
		expect(value.servings).toBeNull();
		expect(value.prepTimeMinutes).toBeNull();
	});
});

describe('parseSettings', () => {
	test('reads visibility and tags', () => {
		const value = unwrap(parseSettings(form({ isPublic: 'on', tags: ['Dessert', 'Baking'] })));
		expect(value).toEqual({ isPublic: true, tagNames: ['Dessert', 'Baking'] });
	});

	test('an unchecked box is private', () => {
		expect(unwrap(parseSettings(form({}))).isPublic).toBe(false);
	});

	test('trims, drops blanks and deduplicates tags case-insensitively, keeping the first spelling', () => {
		const value = unwrap(parseSettings(form({ tags: ['Dessert', ' dessert ', '', 'Baking'] })));
		expect(value.tagNames).toEqual(['Dessert', 'Baking']);
	});
});

describe('draftOf', () => {
	test('returns every text field exactly as submitted, valid or not', () => {
		const fd = form({
			...FULL,
			prepTimeMinutes: '-5',
			commitMessage: 'Tweak',
			editRevision: '3',
			isPublic: 'on',
			tags: ['Dessert'],
			removeImage: 'on'
		});
		expect(draftOf(fd)).toEqual({
			title: 'Cookies',
			description: 'Crisp edges.',
			servings: '4',
			prepTimeMinutes: '-5',
			cookTimeMinutes: '20',
			ingredients: '1 cup flour\n2 eggs',
			steps: 'Mix.\n\nBake.',
			commitMessage: 'Tweak',
			editRevision: '3',
			isPublic: true,
			tags: ['Dessert'],
			hadPhoto: false,
			removeImage: true
		});
	});

	test('missing fields come back as empty strings and false', () => {
		expect(draftOf(form({}))).toMatchObject({
			title: '',
			tags: [],
			isPublic: false,
			hadPhoto: false,
			removeImage: false
		});
	});

	test('hadPhoto is true when a non-empty file was sent', () => {
		const fd = form({});
		fd.append('image', new File(['x'], 'pic.png', { type: 'image/png' }));
		expect(draftOf(fd).hadPhoto).toBe(true);
	});
});
