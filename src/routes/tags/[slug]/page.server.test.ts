import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain, sqlOf } from '#lib/testing/drizzle.js';
import { loadEvent } from '#lib/testing/actions.js';
import { desc } from 'drizzle-orm';
import { recipes } from '#lib/server/db/schema.js';
import { visibleTo } from '#lib/server/visibility.js';

const { countMock, findFirstMock, findManyMock, selectMock, visibleTagsMock } = vi.hoisted(() => ({
	countMock: vi.fn(),
	findFirstMock: vi.fn(),
	findManyMock: vi.fn(),
	selectMock: vi.fn(),
	visibleTagsMock: vi.fn()
}));
vi.mock('#lib/server/db/index.js', () => ({
	db: {
		query: { tags: { findFirst: findFirstMock }, recipes: { findMany: findManyMock } },
		select: selectMock,
		$count: countMock
	}
}));
vi.mock('#lib/server/tagFilter.js', () => ({ visibleTags: visibleTagsMock }));

import { load } from './+page.server';

const makeEvent = (user: { id: string } | null = null) =>
	loadEvent({ params: { slug: 'dessert' }, user });
const event = makeEvent();

beforeEach(() => {
	vi.clearAllMocks();
	findFirstMock.mockResolvedValue({ id: 1, name: 'Dessert', slug: 'dessert' });
	findManyMock.mockResolvedValue([]);
	countMock.mockResolvedValue(0);
	selectMock.mockReturnValue(chain([]));
	visibleTagsMock.mockResolvedValue([{ id: 1, name: 'Dessert', slug: 'dessert' }]);
});

describe('/tags/[slug] load', () => {
	test('signed out, returns the public tags for the tabs', async () => {
		const result = await load(event);
		expect(visibleTagsMock.mock.calls[0][0]).toEqual(visibleTo(null));
		expect(result).toMatchObject({ tags: [{ id: 1, name: 'Dessert', slug: 'dessert' }] });
	});

	// One access rule: a friend sees their friends' Friends-level recipes here too.
	test('signed in, the recipes, tabs and fork counts follow what the viewer may see', async () => {
		const viewer = { id: 'viewer-7' };
		findManyMock.mockResolvedValue([{ id: 3, author: null }]);
		const forkChain = chain([]);
		// The tag's exists() subquery, then the version and fork aggregates.
		selectMock
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(forkChain);

		await load(makeEvent(viewer));

		expect(sqlOf(visibleTagsMock.mock.calls[0][0]).params).toContain(viewer.id);
		expect(sqlOf(findManyMock.mock.calls[0][0].where).params).toContain(viewer.id);
		expect(sqlOf(forkChain.where.mock.calls[0][0]).params).toContain(viewer.id);
		expect(sqlOf(visibleTagsMock.mock.calls[0][0])).toEqual(sqlOf(visibleTo(viewer)));
	});

	test('lists the tagged recipes newest change first, as /recipes does', async () => {
		await load(event);
		const { orderBy } = findManyMock.mock.calls[0][0];
		expect(orderBy).toEqual([desc(recipes.updatedAt), desc(recipes.id)]);
	});

	test('the total and the link preview count every tagged recipe, not the page', async () => {
		countMock.mockResolvedValue(40);
		const result = await load(event);
		expect(result).toMatchObject({ total: 40 });
		expect(result && 'meta' in result && result.meta.description).toContain('40 Dessert recipes');
		expect(sqlOf(countMock.mock.calls[0][1])).toEqual(sqlOf(findManyMock.mock.calls[0][0].where));
	});
});
