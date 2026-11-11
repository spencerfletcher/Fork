import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain, sqlOf } from '#lib/testing/drizzle.js';
import { loadEvent, loadPage } from '#lib/testing/actions.js';

const db = await vi.hoisted(async () => (await import('#lib/testing/drizzle.js')).mockDb());
vi.mock('#lib/server/db/index.js', () => ({ db }));
const { select: selectMock, selectDistinct: selectDistinctMock } = db;
const findManyMock = db.query.recipes.findMany;

import { load } from './+page.server';
import { CARD_WITH } from '#lib/server/recipeCounts.js';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { recipes } from '#lib/server/db/schema.js';
import { authorIsFriendOf, visibleTo } from '#lib/server/visibility.js';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import type { PageData } from './$types';

const makeEvent = (query = '', user: { id: string } | null = null) =>
	loadEvent({ path: `/search?q=${encodeURIComponent(query)}`, user });

const loadResult = (event: Parameters<typeof load>[0]) => loadPage<PageData>(load, event);

describe('search load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('the tab title quotes the query and capitalises Search, as the h1 does', async () => {
		selectDistinctMock.mockReturnValue(chain([]));
		selectMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([]);
		const result = await loadResult(makeEvent('cookie'));
		expect(result.meta.title).toBe('“cookie” — Search');
	});

	test('the total and the link preview count every match, not the page', async () => {
		selectDistinctMock.mockReturnValue(chain([]));
		selectMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([{ id: 1, author: null }]);
		db.$count.mockResolvedValueOnce(130);
		const result = await loadResult(makeEvent('cookie'));
		expect(result.total).toBe(130);
		expect(result.meta.description).toContain('130 recipes');
		expect(sqlOf(db.$count.mock.calls[0][1])).toEqual(sqlOf(findManyMock.mock.calls[0][0].where));
	});

	test('returns recipes carrying the author relation', async () => {
		selectDistinctMock.mockReturnValue(chain([])); // tags for the filter UI
		selectMock
			.mockReturnValueOnce(chain([])) // attachRecipeCounts: version counts
			.mockReturnValueOnce(chain([])); // attachRecipeCounts: fork counts
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'One', author: { id: 'u1', username: 'a' }, recipesToTags: [] },
			{ id: 2, title: 'Two', author: { id: 'u1', username: 'a' }, recipesToTags: [] }
		]);

		const result = await loadResult(makeEvent('cookie'));

		expect(result.recipes.length).toBe(2);
		for (const r of result.recipes) {
			expect(r).toHaveProperty('author');
		}

		// The fixture above returns an author regardless of what the loader asked
		// for — assert the loader actually requests the relation, otherwise this
		// test stays green even if `with:` is deleted.
		expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({ with: CARD_WITH }));
	});

	test('a search is one relational query, ranked in the database', async () => {
		selectDistinctMock.mockReturnValue(chain([])); // tags for the filter UI
		selectMock.mockReturnValue(chain([])); // attachRecipeCounts aggregates
		findManyMock.mockResolvedValue([{ id: 1, author: null, recipesToTags: [] }]);

		await loadResult(makeEvent('cookie'));

		expect(findManyMock).toHaveBeenCalledTimes(1);
		// Where it matched, then saves, then recency and id; without a query only the last two.
		expect(findManyMock.mock.calls[0][0].orderBy).toHaveLength(4);
	});

	test('a result says why it matched when its title does not', async () => {
		selectDistinctMock.mockReturnValue(chain([]));
		selectMock
			.mockReturnValueOnce(chain([])) // version counts
			.mockReturnValueOnce(chain([])) // fork counts
			.mockReturnValueOnce(
				chain([
					{
						id: 1,
						tier: 2,
						title: 'Stir fry',
						current: {
							version: 1,
							title: 'Stir fry',
							ingredients: ['fresh ginger'],
							description: null,
							step: null
						},
						older: null
					}
				])
			);
		findManyMock.mockResolvedValue([{ id: 1, title: 'Stir fry', author: null }]);

		const result = await loadResult(makeEvent('ginger'));

		expect(result.recipes[0].match).toEqual({
			title: 'Stir fry',
			label: 'Ingredient',
			text: 'fresh ginger'
		});
	});

	test('keeps database order when there is no query', async () => {
		selectDistinctMock.mockReturnValue(chain([]));
		selectMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([
			{ id: 2, title: 'Two', author: null, recipesToTags: [] },
			{ id: 1, title: 'One', author: null, recipesToTags: [] }
		]);

		const result = await loadResult(makeEvent(''));

		expect(result.recipes.map((r) => r.id)).toEqual([2, 1]);
		// Newest change first, the same order as browse.
		expect(findManyMock.mock.calls[0][0].orderBy).toEqual([
			desc(recipes.updatedAt),
			desc(recipes.id)
		]);
	});

	test('a ranked search breaks its last ties by the newest change', async () => {
		selectDistinctMock.mockReturnValue(chain([]));
		selectMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([]);
		await loadResult(makeEvent('cookies'));
		expect(findManyMock.mock.calls[0][0].orderBy.slice(-2)).toEqual([
			desc(recipes.updatedAt),
			desc(recipes.id)
		]);
	});

	// A slug no chip carries (renamed, mistyped) filters nothing: the page is
	// told only of the tags it can show as pressed, and lists as if unfiltered.
	test('an unknown tag slug is ignored, and only known slugs come back as selected', async () => {
		selectDistinctMock.mockReturnValue(chain([{ id: 1, name: 'Dessert', slug: 'dessert' }]));
		selectMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([{ id: 5, author: null, recipesToTags: [] }]);
		const event = (tags: string) =>
			({
				url: new URL(`http://localhost/search?tags=${tags}`),
				locals: { user: null }
			}) as unknown as Parameters<typeof load>[0];

		const unknown = await loadResult(event('bogus'));
		expect(unknown.selectedTags).toEqual([]);
		expect(unknown.recipes.map((r) => r.id)).toEqual([5]);

		const mixed = await loadResult(event('bogus,dessert'));
		expect(mixed.selectedTags).toEqual(['dessert']);
	});

	test('offers only tags that have at least one recipe', async () => {
		// The tag query must join through recipes_to_tags rather than
		// selecting the whole table.
		selectDistinctMock.mockReturnValue(chain([{ id: 1, name: 'Dessert', slug: 'dessert' }]));
		selectMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([]);

		const result = await loadResult(makeEvent(''));

		expect(result.allTags).toEqual([{ id: 1, name: 'Dessert', slug: 'dessert' }]);

		// The join is what scopes tags to ones that match a recipe...
		const tagsChain = selectDistinctMock.mock.results[0].value;
		expect(tagsChain.innerJoin).toHaveBeenCalled();
		// ...and selectDistinct is what stops the join fanning out duplicate chips.
		expect(selectDistinctMock).toHaveBeenCalledTimes(1);
	});

	test("offers only tags from recipes the viewer can see, not other users' private ones", async () => {
		selectDistinctMock.mockReturnValue(chain([]));
		selectMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([]);

		await loadResult(makeEvent(''));

		// The tag query has to reach the recipes table to know each recipe's
		// visibility, and filter on it.
		const tagsChain = selectDistinctMock.mock.results[0].value;
		const joinedTables = tagsChain.innerJoin.mock.calls.map((call: unknown[]) => call[0]);
		expect(joinedTables).toContain(recipes);
		expect(tagsChain.where).toHaveBeenCalledTimes(1);
	});
});

describe('search visibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		selectDistinctMock.mockReturnValue(chain([]));
		selectMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([]);
	});

	test("finds public recipes and the viewer's own, never another user's private ones", async () => {
		const own = visibleTo({ id: 'viewer' });
		await loadResult(makeEvent('', { id: 'viewer' }));
		expect(sqlOf(findManyMock.mock.calls[0][0].where)).toEqual(sqlOf(and(own)!));
		expect(selectDistinctMock.mock.results[0].value.where).toHaveBeenCalledWith(own);
	});

	test('a logged-out visitor finds public recipes only, none in the Trash', async () => {
		const pub = and(isNull(recipes.deletedAt), eq(recipes.visibility, 'public'));
		await loadResult(makeEvent(''));
		expect(sqlOf(findManyMock.mock.calls[0][0].where)).toEqual(sqlOf(and(pub)!));
		expect(selectDistinctMock.mock.results[0].value.where).toHaveBeenCalledWith(pub);
	});
});

describe('search load, the Friends filter', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		selectDistinctMock.mockReturnValue(chain([]));
		selectMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([]);
	});

	const VIEWER = { id: 'viewer-7' };
	// Placeholders numbered as $ alone, so a fragment matches wherever it sits.
	const sqlOf = (q: SQL) => {
		const { sql, params } = new PgDialect().sqlToQuery(q);
		return { sql: sql.replace(/\$\d+/g, '$'), params };
	};
	const friendRules = (sql: string) => sql.split(sqlOf(authorIsFriendOf(VIEWER.id)).sql).length - 1;
	const event = (search: string, user: { id: string } | null) =>
		loadEvent({ path: `/search${search}`, user });

	test('friends=1 keeps what the viewer may see, by friends, with the query and tags', async () => {
		selectDistinctMock.mockReturnValue(chain([{ id: 3, name: 'Quick', slug: 'quick' }]));

		const result = await loadResult(event('?friends=1&q=dal&tags=quick', VIEWER));

		const where = sqlOf(findManyMock.mock.calls[0][0].where);
		expect(where.sql).toContain(sqlOf(visibleTo(VIEWER)).sql);
		// Once inside visibleTo's friends rule, once more as the filter.
		expect(friendRules(where.sql)).toBe(2);
		expect(where.params).toContain('dal');
		// The tag's id, in the carrying-every-tag subquery.
		expect(where.params).toContain(3);
		expect(result.friendsOnly).toBe(true);
	});

	test('without friends=1 the filter is off and nothing narrows to friends', async () => {
		const result = await loadResult(event('?q=dal', VIEWER));

		expect(result.friendsOnly).toBe(false);
		const where = sqlOf(findManyMock.mock.calls[0][0].where);
		expect(where.sql).toContain(sqlOf(visibleTo(VIEWER)).sql);
		expect(friendRules(where.sql)).toBe(1);
	});

	test('signed out there is no Friends filter, and friends=1 is ignored', async () => {
		const result = await loadResult(event('?friends=1', null));

		expect(result.friendsOnly).toBeUndefined();
		expect(sqlOf(findManyMock.mock.calls[0][0].where)).toEqual(
			sqlOf(and(and(isNull(recipes.deletedAt), eq(recipes.visibility, 'public')))!)
		);
	});
});
