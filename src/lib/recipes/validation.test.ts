import { describe, test, expect } from 'vitest';
import { formOf } from '#lib/testing/actions.js';
import {
	parseDraftContent,
	parseSettings,
	draftOf,
	contentDraft,
	numberMessages,
	timeMessages,
	readSourceUrl,
	SOURCE_URL_MESSAGES,
	TIME_FIELDS,
	fieldOfMessage,
	REQUIRED_MESSAGES,
	tagNameMessage,
	emptyGroupMessage,
	unnamedGroupMessage,
	VISIBILITIES,
	PHOTO_HINT,
	PHOTO_MAX_BYTES,
	PHOTO_SIZE_MESSAGE,
	PHOTO_TYPE_MESSAGE,
	PHOTO_TYPES,
	photoError,
	type Result
} from './validation';
import {
	MAKES_TOO_LONG,
	MAX_FIELD,
	MAX_GROUP_NAME,
	MAX_LINE,
	MAX_MAKES,
	MAX_SOURCE_URL,
	TEXT_LIMITS,
	groupNameTooLong,
	textTooLong
} from './limits';
import { MAX_DURATION_MINUTES, OVERNIGHT_MINUTES } from './times';
import { makeContent, makeIngredient, makeStep } from './fixtures';

const form = (fields: Record<string, string | string[]>) => formOf(fields);

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
	// The content is parsed from the draft, so FormData is read in one place.
	expect(mod).not.toHaveProperty('parseContent');
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

// The content parse as an action runs it: the form's draft, then the parse.
const parseContent = (fd: FormData) => parseDraftContent(draftOf(fd));

describe('parseDraftContent(draftOf(form))', () => {
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
			error: REQUIRED_MESSAGES.title
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

	test('keeps the "# Name" groups on ingredients and steps', () => {
		const value = unwrap(
			parseContent(form({ ...FULL, ingredients: '# Dough\nflour', steps: '# Bake\nBake.' }))
		);
		expect(value.ingredients[0].group).toBe('Dough');
		expect(value.steps[0].group).toBe('Bake');
	});

	test.each([
		['ingredients', '# Dough\nflour\n# Filling\n\n# Icing\nsugar', 'Filling', 'ingredients'],
		['steps', '# Mix\nMix.\n\n# Bake', 'Bake', 'steps']
	])('a heading with nothing under it in %s is refused by name', (field, value, name, items) => {
		expect(parseContent(form({ ...FULL, [field]: value }))).toEqual({
			ok: false,
			error: emptyGroupMessage(name, items as 'ingredients' | 'steps')
		});
		expect(emptyGroupMessage('Filling', 'ingredients')).toBe(
			'“Filling” has no ingredients. Add some under it or delete the heading.'
		);
	});

	test.each([
		['ingredients', 'flour\n#\nsugar'],
		['steps', 'Mix.\n\n# \nBake.']
	])('a heading with no name in %s is refused, and placed under that box', (field, value) => {
		const result = parseContent(form({ ...FULL, [field]: value }));
		expect(result).toEqual({
			ok: false,
			error: unnamedGroupMessage(field as 'ingredients' | 'steps')
		});
		if (!result.ok) expect(fieldOfMessage(result.error)).toBe(field);
	});

	test('a group name longer than the cap is refused', () => {
		const name = 'x'.repeat(MAX_GROUP_NAME + 1);
		expect(parseContent(form({ ...FULL, steps: `# ${name}\nMix.` }))).toEqual({
			ok: false,
			error: groupNameTooLong('steps')
		});
		const fits = unwrap(parseContent(form({ ...FULL, steps: `# ${name.slice(1)}\nMix.` })));
		expect(fits.steps[0].group).toHaveLength(MAX_GROUP_NAME);
	});

	describe('makes', () => {
		test('is trimmed, and blank or missing is null', () => {
			expect(unwrap(parseContent(form({ ...FULL, makes: ' 12 buns ' }))).makes).toBe('12 buns');
			expect(unwrap(parseContent(form({ ...FULL, makes: '   ' }))).makes).toBeNull();
			expect(unwrap(parseContent(form(FULL))).makes).toBeNull();
		});

		test('longer than the cap is refused', () => {
			expect(parseContent(form({ ...FULL, makes: 'x'.repeat(MAX_MAKES + 1) }))).toEqual({
				ok: false,
				error: MAKES_TOO_LONG
			});
		});

		test('never sets servings', () => {
			const value = unwrap(parseContent(form({ ...FULL, servings: '', makes: '12 buns' })));
			expect(value.servings).toBeNull();
		});
	});

	describe('integer fields', () => {
		const bad = ['x', '2.5', '4people', '-3', '0x10', '+4', '2.', '1e'];

		test.each(bad)('rejects servings %j', (value) => {
			expect(parseContent(form({ ...FULL, servings: value }))).toEqual(rejected);
		});

		// A number input sends what was typed, and counts these as whole numbers.
		test.each([
			['2.0', 2],
			['1e2', 100],
			['4.00', 4],
			['20E-1', 2]
		] as const)('accepts servings %j as %d, as the number input does', (value, expected) => {
			expect(unwrap(parseContent(form({ ...FULL, servings: value }))).servings).toBe(expected);
		});

		// The editor shows these same strings live, so the two must agree.
		test.each([
			['servings', '0', 'belowMin'],
			['servings', '-3', 'belowMin'],
			['servings', '2.5', 'whole'],
			['servings', '1e400', 'tooLarge']
		] as const)('%s %j is refused with its %s message', (field, value, kind) => {
			expect(parseContent(form({ ...FULL, [field]: value }))).toEqual({
				ok: false,
				error: numberMessages(field)[kind]
			});
		});

		test('rejects zero servings', () => {
			expect(parseContent(form({ ...FULL, servings: '0' }))).toEqual(rejected);
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

	describe('times', () => {
		test.each(Object.keys(TIME_FIELDS) as Array<keyof typeof TIME_FIELDS>)(
			'%s reads plain language as minutes',
			(field) => {
				expect(unwrap(parseContent(form({ ...FULL, [field]: '1 h 30' })))[field]).toBe(90);
				expect(unwrap(parseContent(form({ ...FULL, [field]: 'overnight' })))[field]).toBe(
					OVERNIGHT_MINUTES
				);
				expect(unwrap(parseContent(form({ ...FULL, [field]: '0' })))[field]).toBe(0);
				expect(unwrap(parseContent(form({ ...FULL, [field]: ' ' })))[field]).toBeNull();
			}
		);

		test('rest is missing from an old form and reads as none', () => {
			expect(unwrap(parseContent(form(FULL))).restTimeMinutes).toBeNull();
		});

		test.each([
			['prepTimeMinutes', 'soon', 'unreadable'],
			['cookTimeMinutes', '-5', 'unreadable'],
			['restTimeMinutes', `${MAX_DURATION_MINUTES + 1} min`, 'tooLong']
		] as const)('%s %j is refused with its %s message', (field, value, kind) => {
			expect(parseContent(form({ ...FULL, [field]: value }))).toEqual({
				ok: false,
				error: timeMessages(field)[kind]
			});
		});

		test('each time names itself in its messages', () => {
			expect(timeMessages('restTimeMinutes').unreadable).toBe(
				'Write the rest time like 45 min, 1 h 30 or 2 days'
			);
			expect(timeMessages('prepTimeMinutes').tooLong).toBe('Prep time is too long (30 days max)');
		});
	});

	describe('source', () => {
		test('a name alone is kept, trimmed; blank is null', () => {
			const value = unwrap(parseContent(form({ ...FULL, sourceName: '  Gran  ' })));
			expect(value).toMatchObject({ sourceName: 'Gran', sourceUrl: null });
			expect(unwrap(parseContent(form(FULL))).sourceName).toBeNull();
		});

		test.each([
			['https://www.bbc.co.uk/food/x', 'https://www.bbc.co.uk/food/x'],
			['http://example.com', 'http://example.com/'],
			['  example.com/pie ', 'https://example.com/pie'],
			['HTTPS://Example.com/A', 'https://example.com/A']
		])('the link %j is kept as %j', (typed, url) => {
			expect(readSourceUrl(typed)).toEqual({ ok: true, url });
			expect(unwrap(parseContent(form({ ...FULL, sourceUrl: typed }))).sourceUrl).toBe(url);
		});

		test.each([
			'javascript:alert(1)',
			'ftp://example.com/x',
			'data:text/html,hi',
			'mailto:a@b.example',
			'https://localhost',
			'not a link',
			'https://'
		])('the link %j is refused', (typed) => {
			expect(readSourceUrl(typed)).toEqual({ ok: false, error: SOURCE_URL_MESSAGES.invalid });
			expect(parseContent(form({ ...FULL, sourceUrl: typed }))).toEqual({
				ok: false,
				error: SOURCE_URL_MESSAGES.invalid
			});
		});

		test('a link past the cap is refused', () => {
			const long = `https://example.com/${'x'.repeat(MAX_SOURCE_URL)}`;
			expect(readSourceUrl(long)).toEqual({ ok: false, error: SOURCE_URL_MESSAGES.tooLong });
		});

		test('blank is no link', () => {
			expect(readSourceUrl('  ')).toEqual({ ok: true, url: null });
		});
	});

	describe('notes and the short text fields', () => {
		test('notes keep their line breaks, as one kind', () => {
			const value = unwrap(parseContent(form({ ...FULL, notes: ' One\r\n\r\nTwo\n ' })));
			expect(value.notes).toBe('One\n\nTwo');
		});

		test.each(Object.keys(TEXT_LIMITS) as Array<keyof typeof TEXT_LIMITS>)(
			'%s is trimmed, blank is null, and past its cap is refused',
			(field) => {
				expect(unwrap(parseContent(form({ ...FULL, [field]: ' x ' })))[field]).toBe('x');
				expect(unwrap(parseContent(form({ ...FULL, [field]: ' ' })))[field]).toBeNull();
				const long = 'x'.repeat(TEXT_LIMITS[field].max + 1);
				expect(parseContent(form({ ...FULL, [field]: long }))).toEqual({
					ok: false,
					error: textTooLong(field)
				});
			}
		);

		test('the messages read as sentences', () => {
			expect(textTooLong('notes')).toBe(
				`Notes are too long (${TEXT_LIMITS.notes.max.toLocaleString('en-US')} characters max)`
			);
			expect(textTooLong('makes')).toBe(MAKES_TOO_LONG);
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

describe('the editor reads the same messages', () => {
	test.each(Object.entries(REQUIRED_MESSAGES))(
		'a blank %s is refused with %j',
		(field, message) => {
			expect(parseContent(form({ ...FULL, [field]: '  ' }))).toEqual({ ok: false, error: message });
		}
	);

	// Every way each field can be refused, so a message the schema gives is
	// one the editor can place under its field.
	const REFUSALS: Array<[string, string]> = [
		['title', ''],
		['servings', 'x'],
		['servings', '0'],
		['servings', '2147483648'],
		['prepTimeMinutes', 'soon'],
		['prepTimeMinutes', '2147483648'],
		['cookTimeMinutes', 'soon'],
		['cookTimeMinutes', '2147483648'],
		['restTimeMinutes', 'soon'],
		['restTimeMinutes', '2147483648'],
		['sourceUrl', 'ftp://example.com'],
		['sourceUrl', `https://example.com/${'x'.repeat(MAX_SOURCE_URL)}`],
		...Object.entries(TEXT_LIMITS).map(([field, { max }]): [string, string] => [
			field,
			'x'.repeat(max + 1)
		]),
		['ingredients', ''],
		['ingredients', 'x'.repeat(MAX_LINE + 1)],
		['ingredients', 'x\n'.repeat(MAX_FIELD)],
		['steps', ''],
		['steps', 'x'.repeat(MAX_FIELD + 1)],
		['ingredients', '# Dough'],
		['ingredients', `# ${'x'.repeat(MAX_GROUP_NAME + 1)}\nflour`],
		['steps', '# Bake'],
		['steps', `# ${'x'.repeat(MAX_GROUP_NAME + 1)}\nMix.`]
	];

	test.each(REFUSALS)('%s %#: the message names its field', (field, value) => {
		const result = parseContent(form({ ...FULL, [field]: value }));
		if (result.ok) throw new Error('expected a refusal');
		expect(fieldOfMessage(result.error)).toBe(field);
	});

	test('a message no field owns stays with the form', () => {
		expect(fieldOfMessage('Could not save the recipe. Try again.')).toBeUndefined();
	});
});

describe('parseSettings', () => {
	test('reads visibility and tags', () => {
		const value = unwrap(
			parseSettings(form({ visibility: 'friends', tags: ['Dessert', 'Baking'] }))
		);
		expect(value).toEqual({ visibility: 'friends', tagNames: ['Dessert', 'Baking'] });
	});

	test.each(VISIBILITIES)('reads the %s radio', (visibility) => {
		expect(unwrap(parseSettings(form({ visibility }))).visibility).toBe(visibility);
	});

	test('a missing or unknown visibility is private', () => {
		expect(unwrap(parseSettings(form({}))).visibility).toBe('private');
		expect(unwrap(parseSettings(form({ visibility: 'everyone' }))).visibility).toBe('private');
	});

	test('trims, drops blanks and deduplicates tags case-insensitively, keeping the first spelling', () => {
		const value = unwrap(parseSettings(form({ tags: ['Dessert', ' dessert ', '', 'Baking'] })));
		expect(value.tagNames).toEqual(['Dessert', 'Baking']);
	});

	// A tag's link is its slug, built from its letters and digits in any script; with none there is no link.
	test('refuses a tag name with no letter or digit, naming it', () => {
		expect(parseSettings(form({ tags: ['Dessert', '!!'] }))).toEqual({
			ok: false,
			error: tagNameMessage('!!')
		});
		expect(tagNameMessage('!!')).toContain('!!');
	});

	test('a name with any letter or digit is kept, in any script', () => {
		expect(
			unwrap(parseSettings(form({ tags: ['Café', '7-up', '日本', 'Борщ'] }))).tagNames
		).toEqual(['Café', '7-up', '日本', 'Борщ']);
	});
});

describe('contentDraft', () => {
	const settings = { editRevision: '3', visibility: 'friends' as const, tags: ['Soup'] };

	test('a version reads back through the parser as the same content', () => {
		const content = makeContent({
			description: 'Warm.',
			makes: '2 L',
			prepTimeMinutes: 90,
			cookTimeMinutes: 2880,
			restTimeMinutes: OVERNIGHT_MINUTES,
			sourceName: 'Gran',
			sourceUrl: 'https://example.com/soup',
			notes: 'One\n\nTwo',
			makeAhead: 'Keeps',
			equipment: 'Pot',
			storage: 'Cold',
			reheating: 'Gently',
			ingredients: [makeIngredient('1 cup flour'), makeIngredient('2 eggs')],
			steps: [makeStep('Mix.'), makeStep('Bake.', { type: 'tip', text: 'watch it' })]
		});
		const draft = contentDraft(content, settings);
		expect(draft).toMatchObject({ prepTimeMinutes: '1 h 30 min', cookTimeMinutes: '2 days' });
		// The photo is a file, not a form string, so only it is not read back.
		expect({ ...unwrap(parseDraftContent(draft)), imageUrl: content.imageUrl }).toEqual(content);
	});

	test('no content is a blank form with the settings given', () => {
		const draft = contentDraft(null, settings);
		expect(draft).toMatchObject({ title: '', notes: '', restTimeMinutes: '', ...settings });
		expect(draft.hadPhoto).toBe(false);
	});
});

describe('draftOf', () => {
	test('returns every text field exactly as submitted, valid or not', () => {
		const fd = form({
			...FULL,
			prepTimeMinutes: '-5',
			restTimeMinutes: 'overnight',
			makes: ' 12 buns',
			sourceName: 'Gran',
			sourceUrl: 'example.com',
			notes: 'A\nB',
			makeAhead: 'Keeps',
			equipment: 'Tin',
			storage: 'Cold',
			reheating: 'Warm',
			commitMessage: 'Tweak',
			editRevision: '3',
			visibility: 'public',
			tags: ['Dessert'],
			removeImage: 'on'
		});
		expect(draftOf(fd)).toEqual({
			title: 'Cookies',
			description: 'Crisp edges.',
			servings: '4',
			prepTimeMinutes: '-5',
			cookTimeMinutes: '20',
			restTimeMinutes: 'overnight',
			makes: ' 12 buns',
			sourceName: 'Gran',
			sourceUrl: 'example.com',
			notes: 'A\nB',
			makeAhead: 'Keeps',
			equipment: 'Tin',
			storage: 'Cold',
			reheating: 'Warm',
			ingredients: '1 cup flour\n2 eggs',
			steps: 'Mix.\n\nBake.',
			commitMessage: 'Tweak',
			editRevision: '3',
			visibility: 'public',
			tags: ['Dessert'],
			hadPhoto: false,
			removeImage: true
		});
	});

	test('missing fields come back as empty strings and false', () => {
		expect(draftOf(form({}))).toMatchObject({
			title: '',
			tags: [],
			visibility: 'private',
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

describe('photoError', () => {
	const sized = (bytes: number, type: string = PHOTO_TYPES[0]) =>
		new File([new Uint8Array(bytes)], 'a.jpg', { type });

	test('every offered type at the cap is accepted; one byte over is refused', () => {
		for (const type of PHOTO_TYPES) expect(photoError(sized(PHOTO_MAX_BYTES, type))).toBeNull();
		expect(photoError(sized(PHOTO_MAX_BYTES + 1))).toBe(PHOTO_SIZE_MESSAGE);
	});

	test('a type not offered is refused, whatever its size', () => {
		expect(photoError(sized(1, 'image/svg+xml'))).toBe(PHOTO_TYPE_MESSAGE);
		expect(photoError(sized(1, ''))).toBe(PHOTO_TYPE_MESSAGE);
	});

	test('the hint and the message state the cap the check enforces', () => {
		const mb = `${PHOTO_MAX_BYTES / 1024 / 1024} MB`;
		expect(PHOTO_HINT).toContain(mb);
		expect(PHOTO_SIZE_MESSAGE).toContain(mb);
	});

	// Netlify buffers a function request up to 6 MB and Base64-encodes a binary
	// body, so about 4.5 MB of it arrives; past that the platform answers before
	// the action runs and no `{ error, code }` can be returned
	// (https://docs.netlify.com/build/functions/configuration/#default-values).
	// The whole multipart body must fit: the photo at its cap, every capped text
	// field full at 3 bytes a character, and room for headers and boundaries.
	test('a photo at the cap with a full recipe fits the host body limit', () => {
		const HOST_BINARY_BODY = 4_500_000;
		const capped =
			2 * MAX_FIELD +
			MAX_SOURCE_URL +
			Object.values(TEXT_LIMITS).reduce((sum, { max }) => sum + max, 0);
		const overhead = 16 * 1024;
		expect(PHOTO_MAX_BYTES + 3 * capped + overhead).toBeLessThan(HOST_BINARY_BODY);
	});
});
