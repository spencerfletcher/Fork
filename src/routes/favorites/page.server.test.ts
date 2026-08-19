import { vi, describe, test, expect, beforeEach } from 'vitest';

const { selectMock, selectDistinctMock, findManyMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	selectDistinctMock: vi.fn(),
	findManyMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		selectDistinct: selectDistinctMock,
		query: { recipes: { findMany: findManyMock } }
	}
}));

import { load } from './+page.server';
import type { PageData } from './$types';

/** Drizzle-compatible chainable mock. */
function chain(resolved: unknown = []) {
	const p = Promise.resolve(resolved);
	const c: Record<string, unknown> = {
		then: p.then.bind(p),
		catch: p.catch.bind(p),
		finally: p.finally.bind(p)
	};
	for (const m of ['from', 'where', 'orderBy', 'innerJoin', 'leftJoin', 'groupBy', 'limit']) {
		c[m] = vi.fn().mockReturnValue(c);
	}
	return c;
}

function makeEvent(search = '', user: { id: string } | null = { id: 'u1' }) {
	return {
		url: new URL(`http://localhost/favorites${search}`),
		locals: { user }
	} as unknown as Parameters<typeof load>[0];
}

async function loadResult(event: Parameters<typeof load>[0]): Promise<PageData> {
	const result = await load(event);
	if (!result) throw new Error('load returned no data');
	return result as PageData;
}

/** Wires the favourite-id lookup, then the two attachRecipeCounts aggregates. */
function mockFavourites(ids: number[], ...afterFavourites: ReturnType<typeof chain>[]) {
	selectMock.mockReturnValueOnce(chain(ids.map((id) => ({ recipeId: id }))));
	for (const c of afterFavourites) selectMock.mockReturnValueOnce(c);
	selectMock.mockReturnValue(chain([])); // attachRecipeCounts aggregates
}

describe('favorites load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		selectDistinctMock.mockReturnValue(chain([]));
		findManyMock.mockResolvedValue([]);
	});

	test('redirects anonymous visitors to the login page', async () => {
		await expect(load(makeEvent('', null))).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
	});

	test('requests the author relation, so cards are not rendered authorless', async () => {
		mockFavourites([1]);
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'One', author: { id: 'u1', username: 'a' }, recipesToTags: [] }
		]);

		const result = await loadResult(makeEvent());

		expect(result.favoriteRecipes.length).toBe(1);
		// The fixture returns an author regardless of what the loader asked for,
		// so assert on the query itself — otherwise deleting `author: true` keeps
		// this test green while the page silently loses its bylines.
		expect(findManyMock).toHaveBeenCalledWith(
			expect.objectContaining({
				with: expect.objectContaining({ author: true, recipesToTags: expect.anything() })
			})
		);
	});

	test('fetches recipes with a single relational query when filtering by tag', async () => {
		selectDistinctMock.mockReturnValue(
			chain([
				{ id: 7, name: 'Dessert', slug: 'dessert' },
				{ id: 8, name: 'Quick', slug: 'quick' }
			])
		);
		mockFavourites([1, 2], chain([{ recipeId: 1 }, { recipeId: 2 }, { recipeId: 2 }]));
		findManyMock.mockResolvedValue([
			{ id: 1, author: null, recipesToTags: [] },
			{ id: 2, author: null, recipesToTags: [] }
		]);

		await loadResult(makeEvent('?tags=dessert,quick'));

		expect(findManyMock).toHaveBeenCalledTimes(1);
	});

	test('ranks recipes matching more of the selected tags first', async () => {
		selectDistinctMock.mockReturnValue(
			chain([
				{ id: 7, name: 'Dessert', slug: 'dessert' },
				{ id: 8, name: 'Quick', slug: 'quick' }
			])
		);
		// Recipe 2 carries both selected tags, recipe 1 only one.
		mockFavourites([1, 2], chain([{ recipeId: 1 }, { recipeId: 2 }, { recipeId: 2 }]));
		// findMany returns them in the wrong order on purpose.
		findManyMock.mockResolvedValue([
			{ id: 1, author: null, recipesToTags: [] },
			{ id: 2, author: null, recipesToTags: [] }
		]);

		const result = await loadResult(makeEvent('?tags=dessert,quick'));

		expect(result.favoriteRecipes.map((r) => r.id)).toEqual([2, 1]);
	});

	test('offers filter chips for every favourited tag, not only the filtered subset', async () => {
		// Narrowing to one tag must not drop the other chips — otherwise the
		// filter is a one-way door and the user cannot widen it again.
		selectDistinctMock.mockReturnValue(
			chain([
				{ id: 7, name: 'Dessert', slug: 'dessert' },
				{ id: 8, name: 'Quick', slug: 'quick' }
			])
		);
		mockFavourites([1, 2], chain([{ recipeId: 1 }]));
		findManyMock.mockResolvedValue([{ id: 1, author: null, recipesToTags: [] }]);

		const result = await loadResult(makeEvent('?tags=dessert'));

		expect(result.allTags.map((t) => t.slug)).toEqual(['dessert', 'quick']);
		// Scoped to the user's favourites via a join, not the whole tags table.
		const tagsChain = selectDistinctMock.mock.results[0].value;
		expect(tagsChain.innerJoin).toHaveBeenCalled();
		expect(tagsChain.where).toHaveBeenCalled();
	});

	test('returns empty without querying recipes when the user has no favourites', async () => {
		mockFavourites([]);

		const result = await loadResult(makeEvent());

		expect(result.favoriteRecipes).toEqual([]);
		expect(result.allTags).toEqual([]);
		expect(findManyMock).not.toHaveBeenCalled();
	});
});
