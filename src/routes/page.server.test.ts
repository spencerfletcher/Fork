import { vi, describe, test, expect, beforeEach } from 'vitest';

const { findManyMock, selectMock } = vi.hoisted(() => ({
	findManyMock: vi.fn(),
	selectMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	db: { query: { recipes: { findMany: findManyMock } }, select: selectMock }
}));

import { load } from './+page.server';
import type { PageData } from './$types';

function chain(resolved: unknown = []) {
	const p = Promise.resolve(resolved);
	const c: Record<string, unknown> = {
		then: p.then.bind(p),
		catch: p.catch.bind(p),
		finally: p.finally.bind(p)
	};
	for (const m of ['from', 'where', 'groupBy', 'innerJoin', 'leftJoin', 'orderBy']) {
		c[m] = vi.fn().mockReturnValue(c);
	}
	return c;
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

describe('homepage load', () => {
	beforeEach(() => vi.clearAllMocks());

	test('attaches version and fork counts without a query per card', async () => {
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'A', recipesToTags: [], author: null },
			{ id: 2, title: 'B', recipesToTags: [], author: null },
			{ id: 3, title: 'C', recipesToTags: [], author: null }
		]);
		selectMock
			.mockReturnValueOnce(
				chain([
					{ recipeId: 1, count: 2 },
					{ recipeId: 2, count: 1 }
				])
			)
			.mockReturnValueOnce(chain([{ parentId: 1, count: 4 }]));

		const result = await loadResult({
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0]);

		expect(result.recipes[0].versionCount).toBe(2);
		expect(result.recipes[0].forkCount).toBe(4);
		expect(result.recipes[2].versionCount).toBe(0);
		// Two aggregates total, regardless of how many recipes came back.
		expect(selectMock).toHaveBeenCalledTimes(2);
	});
});
