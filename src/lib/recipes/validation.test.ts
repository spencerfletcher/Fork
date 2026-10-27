import { describe, test, expect } from 'vitest';
import { parseContent, parseSettings, draftOf, type Result } from './validation';

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

// The old split parsers are gone; one save parses content and settings.
test('no longer exports the two-form parsers', async () => {
	const mod = await import('./validation');
	expect(mod).not.toHaveProperty('parseRecipeMeta');
	expect(mod).not.toHaveProperty('parseRecipeContent');
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

	test('trims title and description', () => {
		const value = unwrap(
			parseContent(form({ ...FULL, title: '  Cookies ', description: ' Chewy ' }))
		);
		expect(value.title).toBe('Cookies');
		expect(value.description).toBe('Chewy');
	});

	test('rejects a missing title', () => {
		const rest: Record<string, string> = { ...FULL };
		delete rest.title;
		expect(parseContent(form(rest))).toEqual(rejected);
	});

	test('an unparsable ingredient line is kept, not rejected', () => {
		const value = unwrap(parseContent(form({ ...FULL, ingredients: 'salt to taste' })));
		expect(value.ingredients[0]).toMatchObject({ quantity: null, name: 'salt to taste' });
	});

	test('keeps step annotations', () => {
		const value = unwrap(parseContent(form({ ...FULL, steps: 'Mix.\n\nBake.\ntip: watch it' })));
		expect(value.steps[1]).toEqual({
			text: 'Bake.',
			annotation: { type: 'tip', text: 'watch it' }
		});
	});

	test.each(['', '   \n\n'])('rejects ingredients %j with the existing message', (value) => {
		expect(parseContent(form({ ...FULL, ingredients: value }))).toEqual({
			ok: false,
			error: 'At least one ingredient is required'
		});
	});

	test.each(['', '   \n\n'])('rejects steps %j with the existing message', (value) => {
		expect(parseContent(form({ ...FULL, steps: value }))).toEqual({
			ok: false,
			error: 'At least one step is required'
		});
	});

	test('rejects step text longer than 20,000 characters', () => {
		expect(parseContent(form({ ...FULL, steps: 'x'.repeat(20_001) }))).toEqual({
			ok: false,
			error: 'Steps are too long (20,000 characters max)'
		});
	});

	describe('integer fields', () => {
		const bad = ['x', '2.5', '2.0', '4people', '-3', '1e2', '0x10', '+4'];

		test.each(bad)('rejects servings %j', (value) => {
			expect(parseContent(form({ ...FULL, servings: value }))).toEqual(rejected);
		});

		test.each(bad)('rejects prep time %j', (value) => {
			expect(parseContent(form({ ...FULL, prepTimeMinutes: value }))).toEqual(rejected);
		});

		test('rejects zero servings', () => {
			expect(parseContent(form({ ...FULL, servings: '0' }))).toEqual(rejected);
		});

		test('keeps zero prep and cook time', () => {
			const value = unwrap(
				parseContent(form({ ...FULL, prepTimeMinutes: '0', cookTimeMinutes: '0' }))
			);
			expect(value.prepTimeMinutes).toBe(0);
			expect(value.cookTimeMinutes).toBe(0);
		});

		test('trims surrounding whitespace', () => {
			expect(unwrap(parseContent(form({ ...FULL, servings: ' 4 ' }))).servings).toBe(4);
		});

		test('rejects above the integer column limit', () => {
			expect(unwrap(parseContent(form({ ...FULL, servings: '2147483647' }))).servings).toBe(
				2147483647
			);
			expect(parseContent(form({ ...FULL, servings: '2147483648' }))).toEqual(rejected);
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
