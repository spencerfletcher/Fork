import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain, sqlOf } from '#lib/testing/drizzle.js';
import { cookieJar, loadEvent, loadPage } from '#lib/testing/actions.js';
import { VIEW_COOKIE } from './filters.js';

const db = await vi.hoisted(async () => ({
	...(await import('#lib/testing/drizzle.js')).mockDb(),
	$count: vi.fn().mockResolvedValue(0)
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
const bulkMock = vi.hoisted(() => ({
	collectionsFor: vi.fn(),
	collectAll: vi.fn(),
	newCollectionWith: vi.fn(),
	tagAll: vi.fn(),
	trashAll: vi.fn()
}));
vi.mock('#lib/server/bulk.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/bulk.js')>()),
	...bulkMock
}));
const { select: selectMock, selectDistinct: selectDistinctMock } = db;
const findManyMock = db.query.recipes.findMany;

import { load, actions } from './+page.server';
import { formEvent, invokeAction } from '#lib/testing/actions.js';
import { COLLECTION_NAME_ERROR } from '#lib/collections.js';
import { BULK_MAX } from '#lib/server/bulk.js';
import { CAPS, CAP_MESSAGES } from '#lib/recipes/validation.js';
import { inTrashOf } from '#lib/server/trash.js';
import { recipes } from '#lib/server/db/schema.js';
import type { SQL } from 'drizzle-orm';
import type { PageData } from './$types';

// What the database decides (segments, collections, tags, search, kept
// copies, pages) is pinned against the real one in page.server.db.test.ts.
// These cover what the load does around it.

const USER = { id: 'cook-9' };

const makeEvent = (search = '', user: { id: string } | null = USER) =>
	loadEvent({ path: `/cookbook${search}`, user });

const loadResult = (search = '') => loadPage<PageData>(load, makeEvent(search));

/** The one counts row: the library, then inside the collection. */
const counted = (all: number, mine: number, inAll = all, inMine = mine) =>
	chain([{ all, mine, inAll, inMine }]);

describe('/cookbook load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		selectDistinctMock.mockReturnValue(chain([]));
		selectMock.mockReturnValue(chain([]));
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

	test('counts the library in the database, by segment, and the Trash for its link', async () => {
		const countsChain = counted(3, 2);
		selectMock.mockReturnValueOnce(countsChain);
		db.$count.mockResolvedValue(4);

		const result = await loadResult('?filter=saved');

		expect(result.counts).toEqual({ all: 3, mine: 2, saved: 1, trash: 4 });
		const libraryWhere = sqlOf(countsChain.where.mock.calls[0][0]);
		// Own by author id, saved through the favourites subquery, both under visibleTo.
		expect(libraryWhere.sql).toContain('"favorites"');
		const [table, where] = db.$count.mock.calls[0] as [unknown, SQL];
		expect(table).toBe(recipes);
		// inTrashOf reads the clock, so the cutoff param is left out.
		expect(sqlOf(where).sql).toBe(sqlOf(inTrashOf(USER.id)).sql);
		expect(sqlOf(where).params[0]).toBe(USER.id);
	});

	test('an empty library still counts the Trash, runs the purge, and asks for no cards', async () => {
		selectMock.mockReturnValueOnce(counted(0, 0));
		db.$count.mockResolvedValue(1);

		const result = await loadResult('?q=dal');

		expect(result.counts.trash).toBe(1);
		expect(result.searchQuery).toBe('');
		expect(purgeMock).toHaveBeenCalledTimes(1);
		expect(findManyMock).not.toHaveBeenCalled();
	});

	test('unfiltered, the total is the segment’s count, with no count query of its own', async () => {
		selectMock.mockReturnValueOnce(counted(5, 2));
		db.$count.mockResolvedValue(0);

		const result = await loadResult('?filter=saved');

		expect(result.total).toBe(3);
		// The Trash's count alone.
		expect(db.$count).toHaveBeenCalledTimes(1);
	});

	test('a search asks for its total, and the cards come a page at a time with their cursor', async () => {
		selectMock.mockReturnValueOnce(counted(5, 2));
		db.$count.mockResolvedValueOnce(0).mockResolvedValueOnce(7);

		const result = await loadResult('?q=saffron');

		expect(result.total).toBe(7);
		const query = findManyMock.mock.calls[0][0];
		expect(sqlOf(query.where).params).toContain('saffron');
		expect(query.limit).toBe(25);
		expect(result.next).toBeNull();
	});

	describe('the sort', () => {
		/** The page's sort, and the SQL the cards were ordered by. */
		const sortOf = async (search: string) => {
			selectMock.mockReturnValueOnce(counted(2, 1));
			db.$count.mockResolvedValue(2);
			const result = await loadResult(search);
			const { orderBy } = findManyMock.mock.calls[0][0];
			return { sort: result.sort, order: (orderBy as SQL[]).map((o) => sqlOf(o).sql).join(', ') };
		};

		test('is the newest change, with no Journal read, when the URL names none', async () => {
			const { sort, order } = await sortOf('');
			expect(sort).toBe('newest');
			expect(order).not.toContain('log_entries');
		});

		test('?sort= picks one, ordered by the cook’s own Journal', async () => {
			const { sort, order } = await sortOf('?sort=stale');
			expect(sort).toBe('stale');
			expect(order).toContain('log_entries');
			expect(order).toContain('NULLS FIRST');
		});

		test('garbage reads as the newest change', async () => {
			const { sort, order } = await sortOf('?sort=random');
			expect(sort).toBe('newest');
			expect(order).not.toContain('log_entries');
		});

		test('a search ranks by best match, the sort kept for when the search is cleared', async () => {
			const { sort, order } = await sortOf('?sort=most&q=dal');
			expect(sort).toBe('most');
			expect(order).not.toContain('log_entries');
		});
	});

	describe('the view, Grid or List', () => {
		const viewOf = async (search: string, cookie?: string) => {
			selectMock.mockReturnValueOnce(counted(2, 1));
			const cookies = cookieJar(cookie === undefined ? {} : { [VIEW_COOKIE]: cookie });
			const event = loadEvent({ path: `/cookbook${search}`, user: USER, cookies });
			const result = await loadPage<PageData>(load, event);
			return { view: result.view, cookies };
		};

		test('is the grid with neither the URL nor the device saying otherwise', async () => {
			const { view, cookies } = await viewOf('');
			expect(view).toBe('grid');
			expect(cookies.set).not.toHaveBeenCalled();
		});

		test('the device remembers the cook’s last choice', async () => {
			expect((await viewOf('', 'list')).view).toBe('list');
		});

		test('the URL wins over the device, and is remembered for a year on the Cookbook', async () => {
			const { view, cookies } = await viewOf('?view=grid', 'list');
			expect(view).toBe('grid');
			expect(cookies.set).toHaveBeenCalledWith(VIEW_COOKIE, 'grid', {
				path: '/cookbook',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 365
			});
		});

		test('garbage in the URL or the cookie reads as the default, and is not remembered', async () => {
			const { view, cookies } = await viewOf('?view=table', 'mosaic');
			expect(view).toBe('grid');
			expect(cookies.set).not.toHaveBeenCalled();
			expect((await viewOf('?view=table', 'list')).view).toBe('list');
		});
	});
});

const QUICK = { id: 41, name: 'Quick', count: 2 };

describe('/cookbook load, within a collection', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		selectDistinctMock.mockReturnValue(chain([]));
		selectMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([]);
		collectionsMock.collectionsOf.mockResolvedValue([QUICK]);
		collectionsMock.recipeIdsIn.mockResolvedValue([2, 3]);
	});

	test('lists the viewer’s collections, and asks for no members without one chosen', async () => {
		selectMock.mockReturnValueOnce(counted(3, 2));

		const result = await loadResult();

		expect(collectionsMock.collectionsOf).toHaveBeenCalledWith(USER);
		expect(result.collections).toEqual([QUICK]);
		expect(result.collection).toBeNull();
		expect(collectionsMock.recipeIdsIn).not.toHaveBeenCalled();
	});

	test('?collection= names it and counts the segments inside it, the subtitle the whole library', async () => {
		selectMock.mockReturnValueOnce(counted(3, 2, 2, 1));

		const result = await loadResult(`?collection=${QUICK.id}&filter=mine`);

		expect(collectionsMock.recipeIdsIn).toHaveBeenCalledWith(USER, QUICK.id);
		expect(result.collection).toEqual({ id: QUICK.id, name: QUICK.name });
		expect(result.inView).toEqual({ all: 2, mine: 1, saved: 1 });
		expect(result.counts).toMatchObject({ all: 3, mine: 2, saved: 1 });
		expect(sqlOf(findManyMock.mock.calls[0][0].where).params).toEqual(
			expect.arrayContaining([2, 3])
		);
	});

	test('a collection that is not the viewer’s, or not a number, reads as none', async () => {
		for (const search of ['?collection=999', '?collection=abc']) {
			vi.clearAllMocks();
			collectionsMock.collectionsOf.mockResolvedValue([QUICK]);
			collectionsMock.recipeIdsIn.mockResolvedValue(null);
			selectMock.mockReturnValueOnce(counted(3, 2));

			const result = await loadResult(search);

			expect(result.collection).toBeNull();
		}
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

// Which ids each act takes (library, own, caps) is pinned against the real
// database in src/lib/server/bulk.db.test.ts; these cover the form around it.
describe('/cookbook bulk actions, for select mode', () => {
	const act = (name: keyof typeof actions, fields: Record<string, string>, user = USER) =>
		invokeAction(actions[name], formEvent({ fields, locals: { user } }));
	const BULK = [
		'bulkCollections',
		'bulkCollect',
		'bulkNewCollection',
		'bulkTag',
		'bulkTrash'
	] as const;

	beforeEach(() => vi.clearAllMocks());

	test('a lapsed session is told to log in, for every one', async () => {
		for (const name of BULK) {
			const result = await invokeAction(actions[name], formEvent({ locals: { user: null } }));
			expect(result).toMatchObject({ status: 401, data: { code: 'unauthenticated' } });
		}
	});

	test.each([
		['missing', ''],
		['not a number', '3,x'],
		['negative', '-3'],
		['a fraction', '3.5'],
		['over the cap', Array.from({ length: BULK_MAX + 1 }, (_, i) => i + 1).join(',')]
	])('ids %s are refused by every one, and nothing is asked of the database', async (_, ids) => {
		for (const name of BULK) {
			const result = await act(name, {
				ids,
				collectionId: '4',
				member: '1',
				name: 'Quick',
				tags: 'Quick'
			});
			expect(result).toMatchObject({ status: 400, data: { code: 'invalid' } });
		}
		for (const fn of Object.values(bulkMock)) expect(fn).not.toHaveBeenCalled();
	});

	test('repeats are dropped, and the cap itself is taken', async () => {
		bulkMock.trashAll.mockResolvedValue({ moved: 2, skipped: 0 });
		await act('bulkTrash', { ids: '5,3,5' });
		expect(bulkMock.trashAll).toHaveBeenCalledWith(USER, [5, 3]);

		const most = Array.from({ length: BULK_MAX }, (_, i) => i + 1);
		await act('bulkTrash', { ids: most.join(',') });
		expect(bulkMock.trashAll).toHaveBeenLastCalledWith(USER, most);
	});

	test('the collections come marked for the selection', async () => {
		const collections = [{ id: 4, name: 'Quick', has: 'mixed' }];
		bulkMock.collectionsFor.mockResolvedValue(collections);
		expect(await act('bulkCollections', { ids: '3,5' })).toEqual({ collections });
		expect(bulkMock.collectionsFor).toHaveBeenCalledWith(USER, [3, 5]);
	});

	test('collect adds (member=1) or removes (member=0), and says how many', async () => {
		bulkMock.collectAll.mockResolvedValue({ changed: 2, skipped: 1 });
		expect(await act('bulkCollect', { ids: '3,5,8', collectionId: '4', member: '1' })).toEqual({
			collected: 4,
			changed: 2,
			skipped: 1
		});
		expect(bulkMock.collectAll).toHaveBeenCalledWith(USER, 4, [3, 5, 8], true);
		await act('bulkCollect', { ids: '3', collectionId: '4', member: '0' });
		expect(bulkMock.collectAll).toHaveBeenLastCalledWith(USER, 4, [3], false);
	});

	test("collect refuses a bad form and another cook's collection", async () => {
		for (const fields of [
			{ ids: '3', collectionId: 'x', member: '1' },
			{ ids: '3', collectionId: '4', member: 'yes' }
		])
			expect(await act('bulkCollect', fields)).toMatchObject({ status: 400 });
		bulkMock.collectAll.mockResolvedValue(null);
		expect(await act('bulkCollect', { ids: '3', collectionId: '4', member: '1' })).toMatchObject({
			status: 404,
			data: { code: 'not_found' }
		});
	});

	test('a new collection is made with the selection in it; a refused name says why', async () => {
		bulkMock.newCollectionWith.mockResolvedValueOnce({ id: 9, changed: 2, skipped: 0 });
		expect(await act('bulkNewCollection', { ids: '3,5', name: 'Sunday' })).toEqual({
			collected: 9,
			changed: 2,
			skipped: 0
		});
		expect(bulkMock.newCollectionWith).toHaveBeenCalledWith(USER, 'Sunday', [3, 5]);

		const error = COLLECTION_NAME_ERROR.taken('Sunday');
		bulkMock.newCollectionWith.mockResolvedValueOnce({ error });
		expect(await act('bulkNewCollection', { ids: '3', name: 'Sunday' })).toMatchObject({
			status: 400,
			data: { code: 'invalid', error, name: 'Sunday' }
		});
	});

	test('the tags are trimmed, repeats dropped, and go to the database with the counts back', async () => {
		const counts = { changed: 2, already: 1, full: 1, skipped: 2 };
		bulkMock.tagAll.mockResolvedValue(counts);
		const fields = { ids: '3,5', tags: ['  Quick ', 'Vegan', 'quick'] };
		const result = await invokeAction(
			actions.bulkTag,
			formEvent({ fields, locals: { user: USER } })
		);
		expect(result).toEqual({ tagged: ['Quick', 'Vegan'], ...counts });
		expect(bulkMock.tagAll).toHaveBeenCalledWith(USER, ['Quick', 'Vegan'], [3, 5]);
	});

	test('no tag, a tag over the cap, or too many tags, is refused before the database', async () => {
		expect(await act('bulkTag', { ids: '3', tags: '  ' })).toMatchObject({
			status: 400,
			data: { code: 'invalid' }
		});
		expect(await act('bulkTag', { ids: '3', tags: 'x'.repeat(CAPS.tag + 1) })).toMatchObject({
			status: 400,
			data: { code: 'invalid', error: CAP_MESSAGES.tag }
		});
		const many = { ids: '3', tags: Array.from({ length: CAPS.tags + 1 }, (_, i) => `t${i}`) };
		expect(
			await invokeAction(actions.bulkTag, formEvent({ fields: many, locals: { user: USER } }))
		).toMatchObject({ status: 400, data: { error: CAP_MESSAGES.tags } });
		expect(await act('bulkTag', { ids: '3', tags: 'x'.repeat(CAPS.tag) })).not.toHaveProperty(
			'status'
		);
		expect(bulkMock.tagAll).toHaveBeenCalledTimes(1);
	});

	test('Move to Trash says how many moved', async () => {
		bulkMock.trashAll.mockResolvedValue({ moved: 3, skipped: 2 });
		expect(await act('bulkTrash', { ids: '1,2,3,4,5' })).toEqual({ moved: 3, skipped: 2 });
	});
});
