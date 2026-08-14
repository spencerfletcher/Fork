import { vi, describe, test, expect, beforeEach } from 'vitest';

const { selectMock, findManyMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	findManyMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		selectDistinct: selectMock,
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

function makeEvent(query = '') {
	return {
		url: new URL(`http://localhost/search?q=${encodeURIComponent(query)}`),
		locals: { user: null }
	} as unknown as Parameters<typeof load>[0];
}

/**
 * `load` is annotated with the generic `PageServerLoad` interface, whose
 * default `OutputData` includes `Record<string, any>` — so `ReturnType<typeof load>`
 * types every property as `any`, and may also be `void`. The framework's own
 * `PageData` (derived from the real implementation via SvelteKit's generated
 * proxy module) is the precise type; narrow to it once here.
 */
async function loadResult(event: Parameters<typeof load>[0]): Promise<PageData> {
	const result = await load(event);
	if (!result) throw new Error('load returned no data');
	return result as PageData;
}

describe('search load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('returns recipes carrying author and tag relations', async () => {
		selectMock
			.mockReturnValueOnce(chain([])) // tags for the filter UI
			.mockReturnValueOnce(chain([{ id: 2 }, { id: 1 }])) // pass 1: ranked FTS hits
			.mockReturnValueOnce(chain([])); // pass 2: no ingredient-only matches
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'One', author: { id: 'u1', username: 'a' }, recipesToTags: [] },
			{ id: 2, title: 'Two', author: { id: 'u1', username: 'a' }, recipesToTags: [] }
		]);

		const result = await loadResult(makeEvent('cookie'));

		expect(result.recipes.length).toBe(2);
		for (const r of result.recipes) {
			expect(r).toHaveProperty('author');
			expect(r).toHaveProperty('recipesToTags');
		}
	});

	test('preserves ranked order, not database order', async () => {
		// Ranking puts 2 before 1; findMany returns them the other way round.
		selectMock
			.mockReturnValueOnce(chain([])) // tags for the filter UI
			.mockReturnValueOnce(chain([{ id: 2 }, { id: 1 }])) // pass 1: ranked FTS hits
			.mockReturnValueOnce(chain([])); // pass 2: no ingredient-only matches
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'One', author: null, recipesToTags: [] },
			{ id: 2, title: 'Two', author: null, recipesToTags: [] }
		]);

		const result = await loadResult(makeEvent('cookie'));

		expect(result.recipes.map((r) => r.id)).toEqual([2, 1]);
	});

	test('hydrates with a single relational query', async () => {
		selectMock
			.mockReturnValueOnce(chain([])) // tags for the filter UI
			.mockReturnValueOnce(chain([{ id: 1 }])) // pass 1: ranked FTS hits
			.mockReturnValueOnce(chain([])); // pass 2: no ingredient-only matches
		findManyMock.mockResolvedValue([{ id: 1, author: null, recipesToTags: [] }]);

		await loadResult(makeEvent('cookie'));

		expect(findManyMock).toHaveBeenCalledTimes(1);
	});

	test('offers only tags that have at least one recipe', async () => {
		// The tag query is the first db.select call; it must join through
		// recipes_to_tags rather than selecting the whole table.
		selectMock.mockReturnValue(chain([{ id: 1, name: 'Dessert', slug: 'dessert' }]));
		findManyMock.mockResolvedValue([]);

		const result = await loadResult(makeEvent(''));

		expect(result.allTags).toEqual([{ id: 1, name: 'Dessert', slug: 'dessert' }]);
		// A bare select().from(tags) takes no join; the fixed query must.
		const firstCall = selectMock.mock.results[0].value;
		expect(firstCall.innerJoin).toHaveBeenCalled();
	});
});
