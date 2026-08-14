import { vi, describe, test, expect, beforeEach } from 'vitest';
import { and, eq, isNotNull } from 'drizzle-orm';
import { recipes } from '$lib/server/db/schema';

const { findManyMock, selectMock, recipeVersionsFindManyMock } = vi.hoisted(() => ({
	findManyMock: vi.fn(),
	selectMock: vi.fn(),
	recipeVersionsFindManyMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			recipes: { findMany: findManyMock },
			recipeVersions: { findMany: recipeVersionsFindManyMock }
		},
		select: selectMock
	}
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
	beforeEach(() => {
		vi.clearAllMocks();
		// Default: no second version available, so sampleDiff stays null unless a
		// test sets it up explicitly. Keeps pre-existing tests (which don't care
		// about the diff) from needing to know about this call.
		recipeVersionsFindManyMock.mockResolvedValue([]);
	});

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

	test('scopes the fork-count aggregate to public recipes', async () => {
		// This is the anonymous homepage feed — no auth check. A private fork
		// must not inflate a public parent's fork count for every visitor.
		findManyMock.mockResolvedValue([{ id: 1, title: 'A', recipesToTags: [], author: null }]);
		const versionChain = chain([]);
		const forkChain = chain([{ parentId: 1, count: 3 }]);
		selectMock.mockReturnValueOnce(versionChain).mockReturnValueOnce(forkChain);

		const result = await loadResult({
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0]);

		expect(result.recipes[0].forkCount).toBe(3);

		// Structural assertion, not a decorative "was .where called" check: this
		// compares the exact condition object the loader passed to `.where()`
		// against the same condition built directly from drizzle-orm here, so it
		// fails if the loader drops the `isPublic` filter, uses the wrong column,
		// or the wrong literal — not just if `.where` was called at all.
		const whereMock = forkChain.where as ReturnType<typeof vi.fn>;
		const whereArg = whereMock.mock.calls[0][0];
		expect(whereArg).toEqual(and(isNotNull(recipes.parentId), eq(recipes.isPublic, true)));
	});

	test('returns feed mode for a logged-in user', async () => {
		findManyMock.mockResolvedValue([]);
		selectMock.mockReturnValue(chain([]));

		const result = await loadResult({
			locals: { user: { id: 'u1' } }
		} as unknown as Parameters<typeof load>[0]);

		expect(result.mode).toBe('feed');
	});

	test('returns landing mode for an anonymous visitor', async () => {
		findManyMock.mockResolvedValue([]);
		selectMock.mockReturnValue(chain([]));

		const result = await loadResult({
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0]);

		expect(result.mode).toBe('landing');
	});
});
