import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { numberMessages } from '#lib/recipes/validation.js';

const { selectMock } = vi.hoisted(() => ({ selectMock: vi.fn() }));
vi.mock('#lib/server/db/index.js', () => ({ db: { select: selectMock } }));

import {
	ENTRY_MESSAGES,
	MAX_DISH,
	MAX_ENTRY_TEXT,
	canSeeEntry,
	defaultAudience,
	parseEntryForm,
	sourceOf,
	type SourceRow
} from './journal.js';

const ME = { id: 'me' };
const FRIEND = 'friend';

function makeForm(fields: Record<string, string>) {
	const fd = new FormData();
	for (const [k, v] of Object.entries({ dish: 'Dal', cookedOn: '2026-11-08', ...fields }))
		fd.append(k, v);
	return fd;
}

function makeSourceRow(overrides: Partial<SourceRow> = {}): SourceRow {
	return {
		recipeId: 7,
		recipe: { slug: 'dal', title: 'Dal', visibility: 'public', authorId: ME.id },
		versionNumber: 2,
		...overrides
	};
}

beforeEach(() => vi.clearAllMocks());

describe('parseEntryForm', () => {
	test('Dish and Date alone make a whole entry; the rest is empty and Only me', () => {
		expect(parseEntryForm(makeForm({}))).toEqual({
			ok: true,
			value: {
				dish: 'Dal',
				cookedOn: '2026-11-08',
				servings: null,
				caption: null,
				note: null,
				audience: 'private',
				recipe: null,
				version: null
			}
		});
	});

	test.each([
		[{ dish: '  ' }, ENTRY_MESSAGES.dishRequired],
		[{ dish: 'x'.repeat(MAX_DISH + 1) }, ENTRY_MESSAGES.dishTooLong],
		[{ cookedOn: '' }, ENTRY_MESSAGES.dateRequired],
		[{ cookedOn: '2026-02-30' }, ENTRY_MESSAGES.dateInvalid],
		[{ cookedOn: 'yesterday' }, ENTRY_MESSAGES.dateInvalid],
		[{ servings: '2.5' }, numberMessages('servings').whole],
		[{ servings: '0' }, numberMessages('servings').belowMin],
		[{ caption: 'x'.repeat(MAX_ENTRY_TEXT + 1) }, ENTRY_MESSAGES.captionTooLong],
		[{ note: 'x'.repeat(MAX_ENTRY_TEXT + 1) }, ENTRY_MESSAGES.noteTooLong]
	])('%o is refused: %s', (fields, error) => {
		expect(parseEntryForm(makeForm(fields))).toEqual({ ok: false, error });
	});

	test('reads the recipe, its version, servings and a Friends audience', () => {
		const result = parseEntryForm(
			makeForm({ recipe: 'dal', version: '3', servings: '12', audience: 'friends' })
		);
		expect(result).toMatchObject({
			ok: true,
			value: { recipe: 'dal', version: 3, servings: 12, audience: 'friends' }
		});
	});

	test('an unknown audience falls back to Only me; a version without a recipe is dropped', () => {
		const result = parseEntryForm(makeForm({ audience: 'public', version: '3' }));
		expect(result).toMatchObject({ ok: true, value: { audience: 'private', version: null } });
	});
});

describe('sourceOf', () => {
	test('no recipe id is improvised; an id with no row is a deleted recipe', () => {
		expect(sourceOf(makeSourceRow({ recipeId: null, recipe: null }), ME, [])).toEqual({
			kind: 'improvised'
		});
		expect(sourceOf(makeSourceRow({ recipe: null }), ME, [])).toEqual({ kind: 'deleted' });
	});

	test("a friend's Friends recipe hides once they are no longer friends", () => {
		const row = makeSourceRow({
			recipe: { slug: 's', title: 'Shakshuka', visibility: 'friends', authorId: FRIEND }
		});
		expect(sourceOf(row, ME, [FRIEND])).toMatchObject({ kind: 'recipe', own: false });
		expect(sourceOf(row, ME, [])).toEqual({ kind: 'hidden' });
	});

	test('the viewer’s own recipe is marked own, with its version number', () => {
		expect(sourceOf(makeSourceRow(), ME, [])).toEqual({
			kind: 'recipe',
			slug: 'dal',
			title: 'Dal',
			versionNumber: 2,
			visibility: 'public',
			own: true
		});
	});
});

describe('canSeeEntry', () => {
	const entry = (audience: 'private' | 'friends') => ({ userId: FRIEND, audience });

	test('Friends entries reach accepted friends only; private ones the owner only', () => {
		expect(canSeeEntry(entry('friends'), ME, [FRIEND])).toBe(true);
		expect(canSeeEntry(entry('friends'), ME, [])).toBe(false);
		expect(canSeeEntry(entry('private'), ME, [FRIEND])).toBe(false);
		expect(canSeeEntry(entry('private'), { id: FRIEND }, [])).toBe(true);
		expect(canSeeEntry(entry('friends'), null, [FRIEND])).toBe(false);
	});
});

describe('defaultAudience', () => {
	test('Only me while there are no friends, whatever was chosen last', async () => {
		selectMock.mockReturnValueOnce(chain([]));
		expect(await defaultAudience(ME.id)).toBe('private');
		expect(selectMock).toHaveBeenCalledTimes(1);
	});

	test('with a friend, the latest entry’s audience', async () => {
		selectMock
			.mockReturnValueOnce(chain([{ requesterId: ME.id, addresseeId: FRIEND }]))
			.mockReturnValueOnce(chain([{ audience: 'friends' }]));
		expect(await defaultAudience(ME.id)).toBe('friends');
	});

	test('with a friend and no entries yet, Only me', async () => {
		selectMock
			.mockReturnValueOnce(chain([{ requesterId: FRIEND, addresseeId: ME.id }]))
			.mockReturnValueOnce(chain([]));
		expect(await defaultAudience(ME.id)).toBe('private');
	});
});
