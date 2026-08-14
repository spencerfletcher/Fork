import { vi, describe, test, expect, beforeEach } from 'vitest';
import { and, eq, inArray } from 'drizzle-orm';
import { recipes, recipeVersions } from '$lib/server/db/schema';

const { selectMock } = vi.hoisted(() => ({
	selectMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	db: { select: selectMock }
}));

import { attachRecipeCounts } from './recipeCounts';

/** Drizzle-compatible chainable mock. */
function chain(resolved: unknown = []) {
	const p = Promise.resolve(resolved);
	const c: Record<string, unknown> = {
		then: p.then.bind(p),
		catch: p.catch.bind(p),
		finally: p.finally.bind(p)
	};
	for (const m of ['from', 'where', 'groupBy']) {
		c[m] = vi.fn().mockReturnValue(c);
	}
	return c;
}

describe('attachRecipeCounts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('issues exactly two queries regardless of list length', async () => {
		const manyRecipes = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
		selectMock.mockReturnValue(chain([]));

		await attachRecipeCounts(manyRecipes);

		// Two grouped aggregates for the whole list, never one query per recipe —
		// this is the property that actually matters, so assert it directly
		// rather than trusting the implementation not to regress into a loop.
		expect(selectMock).toHaveBeenCalledTimes(2);
	});

	test('attaches versionCount and forkCount from the two aggregates', async () => {
		selectMock
			.mockReturnValueOnce(
				chain([
					{ recipeId: 1, count: 3 },
					{ recipeId: 2, count: 1 }
				])
			)
			.mockReturnValueOnce(chain([{ parentId: 1, count: 5 }]));

		const result = await attachRecipeCounts([{ id: 1 }, { id: 2 }]);

		expect(result[0]).toMatchObject({ id: 1, versionCount: 3, forkCount: 5 });
		expect(result[1]).toMatchObject({ id: 2, versionCount: 1, forkCount: 0 });
	});

	test('scopes both aggregates to the ids of the passed-in list', async () => {
		const versionChain = chain([]);
		const forkChain = chain([]);
		selectMock.mockReturnValueOnce(versionChain).mockReturnValueOnce(forkChain);

		await attachRecipeCounts([{ id: 7 }, { id: 9 }]);

		const versionWhere = (versionChain.where as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(versionWhere).toEqual(inArray(recipeVersions.recipeId, [7, 9]));

		const forkWhere = (forkChain.where as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(forkWhere).toEqual(and(inArray(recipes.parentId, [7, 9]), eq(recipes.isPublic, true)));
	});

	test('returns an empty list without querying when given no recipes', async () => {
		const result = await attachRecipeCounts([]);

		expect(result).toEqual([]);
		expect(selectMock).not.toHaveBeenCalled();
	});
});
