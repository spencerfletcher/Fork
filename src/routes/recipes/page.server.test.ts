import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { eq } from 'drizzle-orm';
import { recipes } from '#lib/server/db/schema.js';

const { findManyMock, selectMock, visibleTagsMock } = vi.hoisted(() => ({
	findManyMock: vi.fn(),
	selectMock: vi.fn(),
	visibleTagsMock: vi.fn()
}));
vi.mock('#lib/server/db/index.js', () => ({
	db: { query: { recipes: { findMany: findManyMock } }, select: selectMock }
}));
vi.mock('#lib/server/tagFilter.js', () => ({ visibleTags: visibleTagsMock }));

import { load } from './+page.server';

const event = (user: { id: string } | null) =>
	({ locals: { user } }) as unknown as Parameters<typeof load>[0];

beforeEach(() => {
	vi.clearAllMocks();
	findManyMock.mockResolvedValue([{ id: 1, recipesToTags: [], author: null }]);
	selectMock.mockReturnValue(chain([]));
	visibleTagsMock.mockResolvedValue([{ id: 1, name: 'Dessert', slug: 'dessert' }]);
});

describe('/recipes load', () => {
	test('a guest sees every public recipe', async () => {
		const result = await load(event(null));
		expect(findManyMock.mock.calls[0][0].where).toEqual(eq(recipes.isPublic, true));
		expect(result).toMatchObject({ mine: false, recipes: [{ id: 1 }] });
	});

	test('a signed-in user sees their own recipes, private ones included', async () => {
		const result = await load(event({ id: 'u1' }));
		expect(findManyMock.mock.calls[0][0].where).toEqual(eq(recipes.authorId, 'u1'));
		expect(result).toMatchObject({ mine: true });
	});

	test('the tab title matches the h1: "My Recipes" signed in, "Recipes" signed out', async () => {
		expect(await load(event({ id: 'u1' }))).toMatchObject({ meta: { title: 'My Recipes' } });
		expect(await load(event(null))).toMatchObject({ meta: { title: 'Recipes' } });
	});

	test('a guest gets the tags with public recipes, for the tabs', async () => {
		const result = await load(event(null));
		expect(visibleTagsMock.mock.calls[0][0]).toEqual(eq(recipes.isPublic, true));
		expect(result).toMatchObject({ tags: [{ id: 1, name: 'Dessert', slug: 'dessert' }] });
	});

	test('a signed-in user browsing their own recipes gets no tabs', async () => {
		const result = await load(event({ id: 'u1' }));
		expect(visibleTagsMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({ tags: [] });
	});
});
