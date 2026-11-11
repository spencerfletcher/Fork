import { describe, test, expect, vi, beforeEach } from 'vitest';
import { chain, sqlOf } from '#lib/testing/drizzle.js';
import { eq } from 'drizzle-orm';
import { recipes } from './db/schema';
import { tagSelection, visibleTags } from './tagFilter';

const { selectDistinctMock } = vi.hoisted(() => ({ selectDistinctMock: vi.fn() }));
vi.mock('./db/index.js', () => ({
	db: { selectDistinct: selectDistinctMock }
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

describe('tagSelection', () => {
	const CHIPS = [
		{ id: 1, name: 'Baking', slug: 'baking' },
		{ id: 2, name: 'Quick', slug: 'quick' }
	];

	test('no known slug selects nothing and filters nothing', () => {
		expect(tagSelection(CHIPS, ['unknown'])).toEqual({ selectedTags: [], where: undefined });
	});

	test("keeps the URL's order of the known slugs and asks for recipes carrying every one", () => {
		const { selectedTags, where } = tagSelection(CHIPS, ['quick', 'nope', 'baking']);
		expect(selectedTags).toEqual(['quick', 'baking']);
		const { sql, params } = sqlOf(where!);
		expect(sql).toMatch(
			/"id" in \(select .*"recipes_to_tags".*group by .*having count\(\*\) = \$\d/i
		);
		expect(params).toEqual([1, 2, 2]);
	});
});
