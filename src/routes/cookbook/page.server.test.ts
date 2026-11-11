import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain, sqlOf } from '#lib/testing/drizzle.js';
import { loadEvent, loadPage } from '#lib/testing/actions.js';

const db = await vi.hoisted(async () => ({
	...(await import('#lib/testing/drizzle.js')).mockDb(),
	$count: vi.fn()
}));
vi.mock('#lib/server/db/index.js', () => ({ db }));
const { purgeMock } = vi.hoisted(() => ({ purgeMock: vi.fn().mockResolvedValue(undefined) }));
vi.mock('#lib/server/trash.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/trash.js')>()),
	purgeExpiredTrash: purgeMock
}));
const { select: selectMock, selectDistinct: selectDistinctMock } = db;
const findManyMock = db.query.recipes.findMany;

import { load } from './+page.server';
import { CARD_WITH } from '#lib/server/recipeCounts.js';
import { inTrashOf } from '#lib/server/trash.js';
import { recipes } from '#lib/server/db/schema.js';
import type { SQL } from 'drizzle-orm';
import type { PageData } from './$types';

const USER = { id: 'cook-9' };
const OTHER = 'someone-else';

const makeEvent = (search = '', user: { id: string } | null = USER) =>
	loadEvent({ path: `/cookbook${search}`, user });

const loadResult = (search = '') => loadPage<PageData>(load, makeEvent(search));

type LibraryRow = { id: number; authorId: string | null };

/** The library lookup, then whatever follows (tag matches, then the count aggregates). */
function mockLibrary(rows: LibraryRow[], ...after: ReturnType<typeof chain>[]) {
	selectMock.mockReturnValueOnce(chain(rows));
	for (const c of after) selectMock.mockReturnValueOnce(c);
	selectMock.mockReturnValue(chain([]));
}

const LIBRARY: LibraryRow[] = [
	{ id: 1, authorId: USER.id },
	{ id: 2, authorId: USER.id },
	{ id: 3, authorId: OTHER }
];

/** findMany returns exactly the rows the loader asked for, by id. */
function findManyByIds() {
	findManyMock.mockImplementation(async ({ where }: { where: SQL }) => {
		const params = sqlOf(where).params;
		return LIBRARY.filter((r) => params.includes(r.id)).map((r) => ({
			...r,
			author: { id: r.authorId, username: r.authorId }
		}));
	});
}

describe('/cookbook load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		selectDistinctMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([]);
	});

	test('sends a signed-out visitor to log in, coming back to the same filters', async () => {
		await expect(load(makeEvent('?filter=saved&q=dal', null))).rejects.toMatchObject({
			status: 303,
			location: `/login?redirectTo=${encodeURIComponent('/cookbook?filter=saved&q=dal')}`
		});
	});

	test('the library is the viewer’s own recipes and the saved ones they may still see', async () => {
		mockLibrary(LIBRARY);
		findManyByIds();

		await loadResult();

		const libraryWhere = sqlOf(selectMock.mock.results[0].value.where.mock.calls[0][0]);
		// Own by author id, saved through the favourites subquery, both under visibleTo.
		expect(libraryWhere.sql).toContain('"favorites"');
		// visibleTo names the viewer three times; own-recipes and the favourites subquery once each.
		expect(libraryWhere.params.filter((p) => p === USER.id)).toHaveLength(5);
	});

	test('counts the library by filter, whatever the filter shows, and the Trash for its link', async () => {
		mockLibrary(LIBRARY);
		findManyByIds();
		db.$count.mockResolvedValue(4);

		const result = await loadResult('?filter=saved');

		expect(result.counts).toEqual({ all: 3, mine: 2, saved: 1, trash: 4 });
		const [table, where] = db.$count.mock.calls[0] as [unknown, SQL];
		expect(table).toBe(recipes);
		// inTrashOf reads the clock, so the cutoff param is left out.
		expect(sqlOf(where).sql).toBe(sqlOf(inTrashOf(USER.id)).sql);
		expect(sqlOf(where).params[0]).toBe(USER.id);
	});

	test('an empty library still counts the Trash, and the visit runs the purge', async () => {
		mockLibrary([]);
		db.$count.mockResolvedValue(1);

		const result = await loadResult();

		expect(result.counts.trash).toBe(1);
		expect(purgeMock).toHaveBeenCalledTimes(1);
	});

	test('Mine shows own recipes only, Saved only the others’, All both', async () => {
		for (const [filter, ids] of [
			['mine', [1, 2]],
			['saved', [3]],
			['all', [1, 2, 3]]
		] as const) {
			vi.clearAllMocks();
			mockLibrary(LIBRARY);
			findManyByIds();
			const result = await loadResult(`?filter=${filter}`);
			expect(result.filter).toBe(filter);
			expect(result.recipes.map((r) => r.id).sort()).toEqual(ids);
		}
	});

	test('an unknown filter reads as All', async () => {
		mockLibrary(LIBRARY);
		findManyByIds();

		const result = await loadResult('?filter=bogus');

		expect(result.filter).toBe('all');
		expect(result.recipes).toHaveLength(LIBRARY.length);
	});

	test('a saved recipe is marked saved; an own one is not', async () => {
		mockLibrary(LIBRARY);
		findManyByIds();

		const result = await loadResult();

		const saved = Object.fromEntries(result.recipes.map((r) => [r.id, r.saved]));
		expect(saved).toEqual({ 1: false, 2: false, 3: true });
	});

	test('cards get their author relation and fork counts the viewer may see', async () => {
		const forkChain = chain([]);
		mockLibrary(LIBRARY, chain([]), forkChain);
		findManyByIds();

		await loadResult();

		expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({ with: CARD_WITH }));
		expect(sqlOf(forkChain.where.mock.calls[0][0]).params).toContain(USER.id);
	});

	test('the query searches by text, as Search does', async () => {
		mockLibrary(LIBRARY);
		findManyByIds();

		const result = await loadResult('?q=saffron');

		expect(result.searchQuery).toBe('saffron');
		expect(sqlOf(findManyMock.mock.calls[0][0].where).params).toContain('saffron');
	});

	test('tag chips come from the whole library, so a filter can be widened again', async () => {
		mockLibrary(LIBRARY);
		findManyByIds();

		await loadResult('?filter=saved');

		const scope = sqlOf(selectDistinctMock.mock.results[0].value.where.mock.calls[0][0]);
		expect(scope.params).toEqual(expect.arrayContaining([1, 2, 3]));
	});

	test('a tag that matches nothing keeps the filters and returns no recipes', async () => {
		selectDistinctMock.mockReturnValue(chain([{ id: 7, name: 'Baking', slug: 'baking' }]));
		mockLibrary(LIBRARY, chain([]));

		const result = await loadResult('?filter=mine&tags=baking&q=bun');

		expect(result.recipes).toEqual([]);
		expect(result).toMatchObject({ filter: 'mine', selectedTags: ['baking'], searchQuery: 'bun' });
		expect(findManyMock).not.toHaveBeenCalled();
	});

	test('an empty library asks no further queries and hears of no filters', async () => {
		mockLibrary([]);

		const result = await loadResult('?q=dal&tags=baking');

		expect(result).toMatchObject({
			recipes: [],
			counts: { all: 0, mine: 0, saved: 0 },
			searchQuery: '',
			selectedTags: []
		});
		expect(selectDistinctMock).not.toHaveBeenCalled();
		expect(findManyMock).not.toHaveBeenCalled();
	});
});
