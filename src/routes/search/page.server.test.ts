import { vi, describe, test, expect, beforeEach } from 'vitest';

const { selectMock, findManyMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	findManyMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		query: { recipes: { findMany: findManyMock } }
	}
}));

import { load } from './+page.server';

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

function makeEvent(query = '') {
	return {
		url: new URL(`http://localhost/search?q=${encodeURIComponent(query)}`),
		locals: { user: null }
	} as unknown as Parameters<typeof load>[0];
}

describe('search load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('returns recipes carrying author and tag relations', async () => {
		selectMock.mockReturnValue(chain([{ id: 2 }, { id: 1 }]));
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'One', author: { id: 'u1', username: 'a' }, recipesToTags: [] },
			{ id: 2, title: 'Two', author: { id: 'u1', username: 'a' }, recipesToTags: [] }
		]);

		const result = await load(makeEvent('cookie'));

		expect(result.recipes.length).toBe(2);
		for (const r of result.recipes) {
			expect(r).toHaveProperty('author');
			expect(r).toHaveProperty('recipesToTags');
		}
	});

	test('preserves ranked order, not database order', async () => {
		// Ranking puts 2 before 1; findMany returns them the other way round.
		selectMock.mockReturnValue(chain([{ id: 2 }, { id: 1 }]));
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'One', author: null, recipesToTags: [] },
			{ id: 2, title: 'Two', author: null, recipesToTags: [] }
		]);

		const result = await load(makeEvent('cookie'));

		expect(result.recipes.map((r) => r.id)).toEqual([2, 1]);
	});

	test('hydrates with a single relational query', async () => {
		selectMock.mockReturnValue(chain([{ id: 1 }]));
		findManyMock.mockResolvedValue([{ id: 1, author: null, recipesToTags: [] }]);

		await load(makeEvent('cookie'));

		expect(findManyMock).toHaveBeenCalledTimes(1);
	});
});
