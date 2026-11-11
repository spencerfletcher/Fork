import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { formOf } from '#lib/testing/actions.js';
import { numberMessages } from '#lib/recipes/validation.js';
import { MAX_LINK } from '#lib/journal.js';

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

const makeForm = (fields: Record<string, string>) =>
	formOf({ dish: 'Dal', cookedOn: '2026-11-08', ...fields });

/** A valid link of exactly `length` characters. */
function longLink(length: number, scheme = 'https') {
	const head = `${scheme}://seriouseats.com/`;
	return head + 'a'.repeat(length - head.length);
}

function makeSourceRow(overrides: Partial<SourceRow> = {}): SourceRow {
	return {
		recipeId: 7,
		recipe: { slug: 'dal', title: 'Dal', visibility: 'public', authorId: ME.id, deletedAt: null },
		versionNumber: 2,
		sourceUrl: null,
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
				version: null,
				sourceUrl: null
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
		[{ note: 'x'.repeat(MAX_ENTRY_TEXT + 1) }, ENTRY_MESSAGES.noteTooLong],
		[{ link: 'seriouseats.com/dal' }, ENTRY_MESSAGES.linkInvalid],
		[{ link: 'javascript:alert(1)' }, ENTRY_MESSAGES.linkInvalid],
		[{ link: 'ftp://example.com/dal' }, ENTRY_MESSAGES.linkInvalid],
		[{ link: longLink(MAX_LINK + 1) }, ENTRY_MESSAGES.linkTooLong]
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

	test.each(['http', 'https'])('an %s link of exactly the maximum length is kept', (scheme) => {
		const link = longLink(MAX_LINK, scheme);
		expect(parseEntryForm(makeForm({ link: `  ${link} ` }))).toMatchObject({
			ok: true,
			value: { sourceUrl: link }
		});
	});

	test('a link is dropped when a recipe is attached: the recipe is the source', () => {
		const result = parseEntryForm(makeForm({ recipe: 'dal', link: 'https://seriouseats.com/dal' }));
		expect(result).toMatchObject({ ok: true, value: { recipe: 'dal', sourceUrl: null } });
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

	test('a recipe in the Trash reads as deleted, to its owner too, and links again once restored', () => {
		const trashed = makeSourceRow();
		trashed.recipe = { ...trashed.recipe!, deletedAt: new Date() };
		expect(sourceOf(trashed, ME, [])).toEqual({ kind: 'deleted' });
		expect(sourceOf(makeSourceRow(), ME, [])).toMatchObject({ kind: 'recipe' });
	});

	test('an improvised entry with a link shows the link and its host, without www', () => {
		const sourceUrl = 'https://www.seriouseats.com/dal?x=1';
		expect(sourceOf(makeSourceRow({ recipeId: null, recipe: null, sourceUrl }), ME, [])).toEqual({
			kind: 'link',
			url: sourceUrl,
			host: 'seriouseats.com'
		});
	});

	test("a friend's Friends recipe hides once they are no longer friends", () => {
		const row = makeSourceRow({
			recipe: {
				slug: 's',
				title: 'Shakshuka',
				visibility: 'friends',
				authorId: FRIEND,
				deletedAt: null
			}
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
