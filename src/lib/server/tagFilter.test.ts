import { describe, test, expect, vi, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { recipes } from './db/schema';
import { byTagMatches, tagMatchCounts, visibleTags } from './tagFilter';

const { selectMock, selectDistinctMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	selectDistinctMock: vi.fn()
}));
vi.mock('./db/index.js', () => ({
	db: { select: selectMock, selectDistinct: selectDistinctMock }
}));

function chain(rows: unknown) {
	const p = Promise.resolve(rows);
	const c: Record<string, unknown> = { then: p.then.bind(p) };
	for (const m of ['from', 'innerJoin', 'where', 'orderBy']) c[m] = vi.fn().mockReturnValue(c);
	return c as Record<string, ReturnType<typeof vi.fn>>;
}

beforeEach(() => vi.clearAllMocks());

describe('visibleTags', () => {
	test('returns the distinct tags for the scope, ordered by name', async () => {
		const c = chain([{ id: 1, name: 'Baking', slug: 'baking' }]);
		selectDistinctMock.mockReturnValue(c);
		const result = await visibleTags(eq(recipes.isPublic, true));
		expect(result).toEqual([{ id: 1, name: 'Baking', slug: 'baking' }]);
		expect(c.innerJoin).toHaveBeenCalledTimes(2);
		expect(c.where).toHaveBeenCalledTimes(1);
		expect(c.orderBy).toHaveBeenCalledTimes(1);
	});
});

describe('tagMatchCounts', () => {
	test('counts how many selected tags each recipe carries', async () => {
		selectMock.mockReturnValue(chain([{ recipeId: 7 }, { recipeId: 7 }, { recipeId: 9 }]));
		const counts = await tagMatchCounts([1, 2]);
		expect([...counts.entries()]).toEqual([
			[7, 2],
			[9, 1]
		]);
	});

	test('leaves out recipes that match nothing', async () => {
		selectMock.mockReturnValue(chain([]));
		expect((await tagMatchCounts([1])).size).toBe(0);
	});
});

describe('byTagMatches', () => {
	test('sorts recipes with more matches first and leaves unmatched ones last', () => {
		const counts = new Map([
			[1, 1],
			[2, 3]
		]);
		const sorted = [{ id: 1 }, { id: 3 }, { id: 2 }].sort(byTagMatches(counts));
		expect(sorted.map((r) => r.id)).toEqual([2, 1, 3]);
	});
});
