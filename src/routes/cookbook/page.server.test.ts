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
const collectionsMock = vi.hoisted(() => ({
	collectionsOf: vi.fn(),
	recipeIdsIn: vi.fn(),
	createCollection: vi.fn(),
	renameCollection: vi.fn(),
	deleteCollection: vi.fn()
}));
vi.mock('#lib/server/collections.js', () => collectionsMock);
const { keptVersionsMock } = vi.hoisted(() => ({
	keptVersionsMock: vi.fn().mockResolvedValue(new Map())
}));
vi.mock('#lib/server/keptCopies.js', () => ({ keptVersionsOf: keptVersionsMock }));
const { select: selectMock, selectDistinct: selectDistinctMock } = db;
const findManyMock = db.query.recipes.findMany;

import { load, actions } from './+page.server';
import { formEvent, invokeAction } from '#lib/testing/actions.js';
import { COLLECTION_NAME_ERROR } from '#lib/collections.js';
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

type LibraryRow = { id: number; authorId: string | null; kept?: boolean };

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
		collectionsMock.collectionsOf.mockResolvedValue([]);
		collectionsMock.recipeIdsIn.mockResolvedValue(null);
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
		// visibleTo names the viewer three times; own-recipes, the favourites
		// subquery and the kept copies' subquery once each.
		expect(libraryWhere.params.filter((p) => p === USER.id)).toHaveLength(6);
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

	describe('a kept copy of a recipe its author withdrew', () => {
		const WITH_COPY: LibraryRow[] = [...LIBRARY, { id: 4, authorId: OTHER, kept: true }];
		const COPY_VERSION = {
			recipeId: 4,
			versionNumber: 2,
			title: 'Soup as kept',
			description: 'Kept words',
			imageUrl: null,
			prepTimeMinutes: 5,
			cookTimeMinutes: 10
		};

		beforeEach(() => {
			mockLibrary(WITH_COPY);
			findManyMock.mockImplementation(async ({ where }: { where: SQL }) => {
				const params = sqlOf(where).params;
				return WITH_COPY.filter((r) => params.includes(r.id)).map((r) => ({
					...r,
					title: r.id === 4 ? 'Renamed in private' : 'T',
					visibility: r.id === 4 ? 'private' : 'public',
					author: { id: r.authorId, username: r.authorId }
				}));
			});
			keptVersionsMock.mockResolvedValue(new Map([[4, COPY_VERSION]]));
		});

		test('counts as saved, and its card reads from the kept version, marked kept, with no audience or version mark', async () => {
			const result = await loadResult('?filter=saved');
			expect(result.counts).toMatchObject({ all: 4, saved: 2 });
			expect(keptVersionsMock).toHaveBeenCalledWith(USER, [4]);
			expect(result.recipes.find((r) => r.id === 4)).toMatchObject({
				title: 'Soup as kept',
				description: 'Kept words',
				prepTimeMinutes: 5,
				saved: true,
				kept: true,
				versionCount: 0,
				visibility: undefined
			});
			expect(result.recipes.find((r) => r.id === 3)).toMatchObject({ kept: false });
		});

		test('lends no tag chips, and drops out of a text search, whose matcher reads every version', async () => {
			await loadResult('?q=soup');
			const scope = sqlOf(selectDistinctMock.mock.results[0].value.where.mock.calls[0][0]);
			expect(scope.params).not.toContain(4);
			expect(sqlOf(findManyMock.mock.calls[0][0].where).params).not.toContain(4);
		});
	});

	test('cards get their author relation and fork counts the viewer may see', async () => {
		const forkChain = chain([]);
		mockLibrary(LIBRARY, chain([]), forkChain);
		findManyByIds();

		await loadResult();

		expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({ with: CARD_WITH }));
		expect(sqlOf(forkChain.where.mock.calls[0][0]).params).toContain(USER.id);
	});

	test('cards carry the viewer’s own times and last cooked, from their entries only', async () => {
		const cookedChain = chain([{ recipeId: 3, timesCooked: 2, lastCookedOn: '2026-11-03' }]);
		mockLibrary(LIBRARY, chain([]), chain([]), cookedChain);
		findManyByIds();

		const result = await loadResult();

		expect(sqlOf(cookedChain.where.mock.calls[0][0]).params).toContain(USER.id);
		const three = result.recipes.find((r) => r.id === 3);
		expect(three).toMatchObject({ timesCooked: 2, lastCookedOn: '2026-11-03' });
		expect(result.recipes.find((r) => r.id === 1)).not.toHaveProperty('timesCooked');
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

const QUICK = { id: 41, name: 'Quick', count: 2 };

describe('/cookbook load, within a collection', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		selectDistinctMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([]);
		collectionsMock.collectionsOf.mockResolvedValue([QUICK]);
		collectionsMock.recipeIdsIn.mockResolvedValue([2, 3]);
	});

	test('lists the viewer’s collections with their counts', async () => {
		mockLibrary(LIBRARY);
		findManyByIds();

		const result = await loadResult();

		expect(collectionsMock.collectionsOf).toHaveBeenCalledWith(USER);
		expect(result.collections).toEqual([QUICK]);
		expect(result.collection).toBeNull();
		expect(collectionsMock.recipeIdsIn).not.toHaveBeenCalled();
	});

	test('?collection= shows its recipes, the segments counting inside it, the subtitle the whole library', async () => {
		mockLibrary(LIBRARY);
		findManyByIds();

		const result = await loadResult(`?collection=${QUICK.id}&filter=mine`);

		expect(collectionsMock.recipeIdsIn).toHaveBeenCalledWith(USER, QUICK.id);
		expect(result.collection).toEqual({ id: QUICK.id, name: QUICK.name });
		expect(result.recipes.map((r) => r.id)).toEqual([2]);
		expect(result.inView).toEqual({ all: 2, mine: 1, saved: 1 });
		expect(result.counts).toMatchObject({ all: 3, mine: 2, saved: 1 });
	});

	test('a collection that is not the viewer’s, or not a number, reads as none', async () => {
		for (const search of ['?collection=999', '?collection=abc']) {
			vi.clearAllMocks();
			collectionsMock.collectionsOf.mockResolvedValue([QUICK]);
			collectionsMock.recipeIdsIn.mockResolvedValue(null);
			mockLibrary(LIBRARY);
			findManyByIds();

			const result = await loadResult(search);

			expect(result.collection).toBeNull();
			expect(result.recipes).toHaveLength(LIBRARY.length);
		}
	});

	test('an empty collection returns no recipes and asks for no cards', async () => {
		collectionsMock.recipeIdsIn.mockResolvedValue([]);
		mockLibrary(LIBRARY);

		const result = await loadResult(`?collection=${QUICK.id}`);

		expect(result.recipes).toEqual([]);
		expect(result.inView).toEqual({ all: 0, mine: 0, saved: 0 });
		expect(findManyMock).not.toHaveBeenCalled();
	});
});

describe('/cookbook collection actions', () => {
	const act = (name: keyof typeof actions, fields: Record<string, string>, user = USER) =>
		invokeAction(actions[name], formEvent({ fields, locals: { user } }));

	beforeEach(() => vi.clearAllMocks());

	test('a lapsed session is told to log in, for every action', async () => {
		for (const name of ['createCollection', 'renameCollection', 'deleteCollection'] as const) {
			const result = await invokeAction(actions[name], formEvent({ locals: { user: null } }));
			expect(result).toMatchObject({ status: 401, data: { code: 'unauthenticated' } });
		}
	});

	test('create opens the new collection', async () => {
		collectionsMock.createCollection.mockResolvedValue({ id: 77 });

		const result = await act('createCollection', { name: 'Italian' });

		expect(collectionsMock.createCollection).toHaveBeenCalledWith(USER.id, 'Italian');
		expect(result).toMatchObject({ status: 303, location: '/cookbook?collection=77' });
	});

	test('a refused name comes back as the form’s error, with the name as typed', async () => {
		const error = COLLECTION_NAME_ERROR.taken('Quick');
		collectionsMock.createCollection.mockResolvedValue({ error });

		const result = await act('createCollection', { name: 'Quick' });

		expect(result).toMatchObject({
			status: 400,
			data: { code: 'invalid', error, name: 'Quick', intent: 'create' }
		});
	});

	test('rename names the collection; another cook’s is not found', async () => {
		collectionsMock.renameCollection.mockResolvedValueOnce({ renamed: true });
		expect(await act('renameCollection', { id: '41', name: 'Fast' })).toEqual({ renamed: 41 });
		expect(collectionsMock.renameCollection).toHaveBeenCalledWith(USER.id, 41, 'Fast');

		collectionsMock.renameCollection.mockResolvedValueOnce({ renamed: false });
		expect(await act('renameCollection', { id: '41', name: 'Fast' })).toMatchObject({
			status: 404,
			data: { code: 'not_found' }
		});
	});

	test('rename with a refused name says why', async () => {
		collectionsMock.renameCollection.mockResolvedValue({ error: COLLECTION_NAME_ERROR.empty });
		expect(await act('renameCollection', { id: '41', name: ' ' })).toMatchObject({
			status: 400,
			data: { code: 'invalid', error: COLLECTION_NAME_ERROR.empty, intent: 'rename' }
		});
	});

	test('delete goes back to the whole Cookbook; a bad or foreign id is refused', async () => {
		collectionsMock.deleteCollection.mockResolvedValueOnce(true);
		expect(await act('deleteCollection', { id: '41' })).toMatchObject({
			status: 303,
			location: '/cookbook'
		});
		expect(collectionsMock.deleteCollection).toHaveBeenCalledWith(USER.id, 41);

		collectionsMock.deleteCollection.mockResolvedValueOnce(false);
		expect(await act('deleteCollection', { id: '41' })).toMatchObject({ status: 404 });
		expect(await act('deleteCollection', { id: 'x' })).toMatchObject({ status: 400 });
	});
});
