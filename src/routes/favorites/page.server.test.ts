import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';

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
import type { PageData } from './$types';

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

type FavouriteRow = { recipeId: number; isPublic: boolean; authorId: string };

/** Wires the favourite lookup with explicit visibility, then the attachRecipeCounts aggregates. */
function mockFavouriteRows(rows: FavouriteRow[], ...afterFavourites: ReturnType<typeof chain>[]) {
	selectMock.mockReturnValueOnce(chain(rows));
	for (const c of afterFavourites) selectMock.mockReturnValueOnce(c);
	selectMock.mockReturnValue(chain([])); // attachRecipeCounts aggregates
}

/** Favourites of public recipes by another author — the common case. */
function mockFavourites(ids: number[], ...afterFavourites: ReturnType<typeof chain>[]) {
	mockFavouriteRows(
		ids.map((id) => ({ recipeId: id, isPublic: true, authorId: 'someone-else' })),
		...afterFavourites
	);
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

	test('hides a favourite whose recipe has since been made private by its owner', async () => {
		mockFavouriteRows([{ recipeId: 1, isPublic: false, authorId: 'someone-else' }]);

		const result = await loadResult(makeEvent());

		expect(result.favoriteRecipes).toEqual([]);
		// Its tags must not leak through the filter chips either.
		expect(result.allTags).toEqual([]);
		expect(selectDistinctMock).not.toHaveBeenCalled();
		expect(findManyMock).not.toHaveBeenCalled();
	});

	test("keeps a favourite of the user's own private recipe", async () => {
		mockFavouriteRows([{ recipeId: 1, isPublic: false, authorId: 'u1' }]);
		findManyMock.mockResolvedValue([{ id: 1, author: null, recipesToTags: [] }]);

		const result = await loadResult(makeEvent());

		expect(findManyMock).toHaveBeenCalledTimes(1);
		expect(result.favoriteRecipes).toHaveLength(1);
	});
});
