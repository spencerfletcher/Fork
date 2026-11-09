import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { loadPage } from '#lib/testing/actions.js';

const { selectMock, selectDistinctMock, findManyMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	selectDistinctMock: vi.fn(),
	findManyMock: vi.fn()
}));

vi.mock('#lib/server/db/index.js', () => ({
	db: {
		select: selectMock,
		selectDistinct: selectDistinctMock,
		query: { recipes: { findMany: findManyMock } }
	}
}));

import { load } from './+page.server';
import { CARD_WITH } from '#lib/server/recipeCounts.js';
import { and, desc, eq } from 'drizzle-orm';
import { recipes } from '#lib/server/db/schema.js';
import { visibleTo } from '#lib/server/visibility.js';
import type { PageData } from './$types';

function makeEvent(query = '', user: { id: string } | null = null) {
	return {
		url: new URL(`http://localhost/search?q=${encodeURIComponent(query)}`),
		locals: { user }
	} as unknown as Parameters<typeof load>[0];
}

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

	test('returns recipes carrying the author relation', async () => {
		selectDistinctMock.mockReturnValue(chain([])); // tags for the filter UI
		selectMock
			.mockReturnValueOnce(chain([{ id: 2 }, { id: 1 }])) // pass 1: ranked FTS hits
			.mockReturnValueOnce(chain([])) // pass 2: no ingredient-only matches
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
		// Relevance first, then recency; without a query only recency applies.
		expect(findManyMock.mock.calls[0][0].orderBy).toHaveLength(2);
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
		expect(findManyMock.mock.calls[0][0].orderBy).toEqual([desc(recipes.updatedAt)]);
	});

	test('a ranked search breaks ties by the newest change', async () => {
		selectDistinctMock.mockReturnValue(chain([]));
		selectMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([]);
		await loadResult(makeEvent('cookies'));
		expect(findManyMock.mock.calls[0][0].orderBy[1]).toEqual(desc(recipes.updatedAt));
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

		selectMock.mockReturnValueOnce(chain([{ recipeId: 5 }]));
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
		expect(findManyMock.mock.calls[0][0].where).toEqual(and(own, undefined, undefined));
		expect(selectDistinctMock.mock.results[0].value.where).toHaveBeenCalledWith(own);
	});

	test('a logged-out visitor finds public recipes only', async () => {
		const pub = eq(recipes.visibility, 'public');
		await loadResult(makeEvent(''));
		expect(findManyMock.mock.calls[0][0].where).toEqual(and(pub, undefined, undefined));
		expect(selectDistinctMock.mock.results[0].value.where).toHaveBeenCalledWith(pub);
	});
});
