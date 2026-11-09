import { describe, test, expect, vi, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { eq } from 'drizzle-orm';
import { recipes } from './db/schema';
import { byTagMatches, tagMatchCounts, tagSelection, visibleTags } from './tagFilter';

const { selectMock, selectDistinctMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	selectDistinctMock: vi.fn()
}));
vi.mock('./db/index.js', () => ({
	db: { select: selectMock, selectDistinct: selectDistinctMock }
}));

beforeEach(() => vi.clearAllMocks());

describe('visibleTags', () => {
	test('returns the distinct tags for the scope, ordered by name', async () => {
		const c = chain([{ id: 1, name: 'Baking', slug: 'baking' }]);
		selectDistinctMock.mockReturnValue(c);
		const result = await visibleTags(eq(recipes.visibility, 'public'));
		expect(result).toEqual([{ id: 1, name: 'Baking', slug: 'baking' }]);
		expect(c.innerJoin).toHaveBeenCalledTimes(2);
		expect(c.where).toHaveBeenCalledTimes(1);
		expect(c.orderBy).toHaveBeenCalledTimes(1);
	});
});

describe('tagMatchCounts', () => {
	test('two tags keep only the recipes carrying both', async () => {
		selectMock.mockReturnValue(chain([{ recipeId: 7 }, { recipeId: 7 }, { recipeId: 9 }]));
		const counts = await tagMatchCounts([1, 2]);
		expect([...counts.keys()]).toEqual([7]);
	});

	test('leaves out recipes that match nothing', async () => {
		selectMock.mockReturnValue(chain([]));
		expect((await tagMatchCounts([1])).size).toBe(0);
	});
});

describe('tagSelection', () => {
	const CHIPS = [
		{ id: 1, name: 'Baking', slug: 'baking' },
		{ id: 2, name: 'Quick', slug: 'quick' }
	];

	test('no known slug selects nothing, filters nothing and asks nothing', async () => {
		expect(await tagSelection(CHIPS, ['unknown'])).toEqual({ selectedTags: [], matches: null });
		expect(selectMock).not.toHaveBeenCalled();
	});

	test("keeps the URL's order of the known slugs and matches every selected tag", async () => {
		const c = chain([{ recipeId: 7 }, { recipeId: 7 }]);
		selectMock.mockReturnValue(c);
		const { selectedTags, matches } = await tagSelection(CHIPS, ['quick', 'nope', 'baking']);
		expect(selectedTags).toEqual(['quick', 'baking']);
		expect([...(matches?.keys() ?? [])]).toEqual([7]);
	});

	test('within no recipes there are no matches, and nothing is asked', async () => {
		const { matches } = await tagSelection(CHIPS, ['baking'], []);
		expect(matches?.size).toBe(0);
		expect(selectMock).not.toHaveBeenCalled();
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
