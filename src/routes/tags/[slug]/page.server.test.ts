import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { eq } from 'drizzle-orm';
import { recipes } from '#lib/server/db/schema.js';

const { findFirstMock, findManyMock, selectMock, visibleTagsMock } = vi.hoisted(() => ({
	findFirstMock: vi.fn(),
	findManyMock: vi.fn(),
	selectMock: vi.fn(),
	visibleTagsMock: vi.fn()
}));
vi.mock('#lib/server/db/index.js', () => ({
	db: {
		query: { tags: { findFirst: findFirstMock }, recipes: { findMany: findManyMock } },
		select: selectMock
	}
}));
vi.mock('#lib/server/tagFilter.js', () => ({ visibleTags: visibleTagsMock }));

import { load } from './+page.server';

const event = { params: { slug: 'dessert' } } as unknown as Parameters<typeof load>[0];

beforeEach(() => {
	vi.clearAllMocks();
	findFirstMock.mockResolvedValue({ id: 1, name: 'Dessert', slug: 'dessert' });
	findManyMock.mockResolvedValue([]);
	selectMock.mockReturnValue(chain([]));
	visibleTagsMock.mockResolvedValue([{ id: 1, name: 'Dessert', slug: 'dessert' }]);
});

describe('/tags/[slug] load', () => {
	test('returns the public tags for the tabs', async () => {
		const result = await load(event);
		expect(visibleTagsMock.mock.calls[0][0]).toEqual(eq(recipes.isPublic, true));
		expect(result).toMatchObject({ tags: [{ id: 1, name: 'Dessert', slug: 'dessert' }] });
	});
});
