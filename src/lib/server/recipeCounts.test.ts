import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain, sqlOf } from '#lib/testing/drizzle.js';
import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { visibleTo } from './visibility';

const { selectMock, findManyMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	findManyMock: vi.fn()
}));

vi.mock('#lib/server/db/index.js', () => ({
	db: { select: selectMock, query: { recipes: { findMany: findManyMock } } }
}));

import { attachRecipeCounts, cardList, CARD_WITH } from './recipeCounts';

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
		expect(forkWhere).toEqual(and(inArray(recipes.parentId, [7, 9]), visibleTo(null)));
	});

	// A fork counts when the viewer could open it: the same rule as every list.
	test('counts the forks the viewer may see, by the one access rule', async () => {
		const viewer = { id: 'viewer-42' };
		const forkChain = chain([]);
		selectMock.mockReturnValueOnce(chain([])).mockReturnValueOnce(forkChain);

		await attachRecipeCounts([{ id: 7 }], viewer);

		const dialect = new PgDialect();
		const forkWhere = (forkChain.where as ReturnType<typeof vi.fn>).mock.calls[0][0] as SQL;
		const expected = and(inArray(recipes.parentId, [7]), visibleTo(viewer)) as SQL;
		expect(dialect.sqlToQuery(forkWhere)).toEqual(dialect.sqlToQuery(expected));
		expect(dialect.sqlToQuery(forkWhere).params).toContain(viewer.id);
	});

	test('returns an empty list without querying when given no recipes', async () => {
		const result = await attachRecipeCounts([]);

		expect(result).toEqual([]);
		expect(selectMock).not.toHaveBeenCalled();
	});
});

describe('cardList', () => {
	const viewer = { id: 'viewer-42' };
	const WHERE = eq(recipes.visibility, 'public');
	const FIRST = { after: null, limit: 5 };

	beforeEach(() => {
		vi.clearAllMocks();
		findManyMock.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
		selectMock.mockReturnValue(chain([]));
	});

	test('reads the cards for the condition, rank first, then newest change and id, one past the page', async () => {
		const rank = [sql`1`];
		await cardList(WHERE, rank, viewer, FIRST);
		const query = findManyMock.mock.calls[0][0];
		expect(sqlOf(query.where)).toEqual(sqlOf(WHERE));
		expect(query).toMatchObject({
			with: CARD_WITH,
			limit: 6,
			offset: 0
		});
		expect(query.orderBy).toEqual([...rank, desc(recipes.updatedAt), desc(recipes.id)]);
	});

	test("keeps the query's order", async () => {
		const { cards } = await cardList(WHERE, [], viewer, FIRST);
		expect(cards.map((r) => r.id)).toEqual([1, 2, 3]);
	});

	test("counts each card's forks for the viewer", async () => {
		const forkChain = chain([]);
		selectMock.mockReturnValueOnce(chain([])).mockReturnValueOnce(forkChain);
		await cardList(WHERE, [], viewer, FIRST);
		expect(forkChain.where.mock.calls[0][0]).toEqual(
			and(inArray(recipes.parentId, [1, 2, 3]), visibleTo(viewer))
		);
	});

	test('a ranked cursor is the offset of the next page', async () => {
		findManyMock.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
		const { cards, next } = await cardList(WHERE, [sql`1`], viewer, { after: '4', limit: 2 });
		expect(findManyMock.mock.calls[0][0]).toMatchObject({ offset: 4, limit: 3 });
		expect(cards).toHaveLength(2);
		expect(next).toBe('6');
	});

	test.each([
		['007', 7],
		['', 0],
		['-4', 0],
		['4.5', 0],
		['2026-11-11 10:00:00~3', 0]
	])('a ranked cursor %j reads as offset %i', async (after, offset) => {
		await cardList(WHERE, [sql`1`], viewer, { after, limit: 2 });
		expect(findManyMock.mock.calls[0][0]).toMatchObject({ offset });
	});

	test('an unranked list never offsets, even after a number', async () => {
		await cardList(WHERE, [], viewer, { after: '4', limit: 2 });
		expect(findManyMock.mock.calls[0][0]).toMatchObject({ offset: 0 });
	});
});

describe('cardList: times and last cooked', () => {
	const viewer = { id: 'viewer-42' };
	const WHERE = eq(recipes.visibility, 'public');

	beforeEach(() => {
		vi.clearAllMocks();
		findManyMock.mockResolvedValue(Array.from({ length: 30 }, (_, i) => ({ id: i + 1 })));
		selectMock.mockReturnValue(chain([]));
	});

	test('asked for, one grouped query more for the whole list, scoped to its ids and the viewer', async () => {
		const cookedChain = chain([{ recipeId: 2, timesCooked: 4, lastCookedOn: '2026-11-03' }]);
		selectMock
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(cookedChain);

		const { cards: rows } = await cardList(WHERE, [], viewer, {
			after: null,
			limit: 30,
			cooked: true
		});

		expect(selectMock).toHaveBeenCalledTimes(3);
		const where = sqlOf(cookedChain.where.mock.calls[0][0]);
		expect(where.params).toContain(viewer.id);
		expect(where.params).toEqual(expect.arrayContaining(rows.map((r) => r.id)));
		expect(rows[1]).toMatchObject({ timesCooked: 4, lastCookedOn: '2026-11-03' });
		expect(rows[0]).not.toHaveProperty('timesCooked');
	});

	test('not asked for, no lookup and no values', async () => {
		const { cards: rows } = await cardList(WHERE, [], viewer, { after: null, limit: 30 });
		expect(selectMock).toHaveBeenCalledTimes(2);
		expect(rows[0]).not.toHaveProperty('timesCooked');
	});

	test('signed out, nothing is anyone’s: no lookup', async () => {
		const { cards: rows } = await cardList(WHERE, [], null, {
			after: null,
			limit: 30,
			cooked: true
		});
		expect(selectMock).toHaveBeenCalledTimes(2);
		expect(rows[0]).not.toHaveProperty('timesCooked');
	});
});
