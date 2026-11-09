import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

const { selectMock, selectDistinctMock, findManyMock, friendIdsOfMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	selectDistinctMock: vi.fn(),
	findManyMock: vi.fn(),
	friendIdsOfMock: vi.fn()
}));

vi.mock('#lib/server/db/index.js', () => ({
	db: {
		select: selectMock,
		selectDistinct: selectDistinctMock,
		query: { recipes: { findMany: findManyMock } }
	}
}));
vi.mock('#lib/server/visibility.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/visibility.js')>()),
	friendIdsOf: friendIdsOfMock
}));

import { loadDiscover, DISCOVER_LIMIT, LEAD_WINDOW_DAYS, RECENT_CHANGES } from './discover.server';
import { CARD_WITH } from '#lib/server/recipeCounts.js';
import { visibleTo } from '#lib/server/visibility.js';

const VIEWER = { id: 'viewer-5' };
const sqlOf = (q: SQL) => new PgDialect().sqlToQuery(q);
const url = (search = '') => new URL(`http://localhost/discover${search}`);

const row = (id: number, username = 'maria') => ({
	id,
	slug: `r-${id}`,
	title: `Recipe ${id}`,
	authorId: `a-${username}`,
	author: { id: `a-${username}`, username }
});
const ROWS = [row(1), row(2), row(3, 'devcooks')];

/** The lead and recent-changes lookups, then the two count aggregates. */
function mockSelects(lead: unknown[], recent: unknown[]) {
	const leadChain = chain(lead);
	const recentChain = chain(recent);
	selectMock.mockReturnValueOnce(leadChain).mockReturnValueOnce(recentChain);
	selectMock.mockReturnValue(chain([]));
	return { leadChain, recentChain };
}

beforeEach(() => {
	vi.clearAllMocks();
	selectDistinctMock.mockReturnValue(chain([]));
	findManyMock.mockResolvedValue(ROWS);
	friendIdsOfMock.mockResolvedValue([]);
});

describe('loadDiscover', () => {
	test('caps the grid query', async () => {
		mockSelects([], []);

		await loadDiscover(url(), VIEWER);

		expect(findManyMock.mock.calls[0][0].limit).toBe(DISCOVER_LIMIT);
	});

	test('lists what the viewer may see, newest first, as cards', async () => {
		mockSelects([], []);

		await loadDiscover(url(), VIEWER);

		const { where, with: w } = findManyMock.mock.calls[0][0];
		expect(w).toEqual(CARD_WITH);
		expect(sqlOf(where)).toEqual(sqlOf(visibleTo(VIEWER)));
	});

	test('signed out, public only: the grid, the tags, the lead and Recent changes', async () => {
		const { leadChain, recentChain } = mockSelects([], []);

		await loadDiscover(url(), null);

		const publicOnly = sqlOf(visibleTo(null));
		for (const c of [leadChain, recentChain]) {
			const where = sqlOf(c.where.mock.calls[0][0]);
			expect(where.sql).toContain(publicOnly.sql);
			expect(where.params).toContain('public');
		}

		expect(sqlOf(findManyMock.mock.calls[0][0].where)).toEqual(sqlOf(visibleTo(null)));
		expect(sqlOf(selectDistinctMock.mock.results[0].value.where.mock.calls[0][0])).toEqual(
			sqlOf(visibleTo(null))
		);
	});

	test('the lead is the most-saved visible recipe of the last week, out of the grid', async () => {
		const { leadChain } = mockSelects([{ recipeId: 3, saves: 4 }], []);
		const before = Date.now();

		const result = await loadDiscover(url(), VIEWER);

		expect(result.lead?.id).toBe(3);
		expect(result.recipes.map((r) => r.id)).toEqual([1, 2]);
		const leadWhere = sqlOf(leadChain.where.mock.calls[0][0]);
		expect(leadWhere.params).toContain(VIEWER.id);
		const cutoff = leadWhere.params.find(
			(p) => typeof p === 'string' && /^\d{4}-\d\d-\d\d/.test(p)
		);
		const days = (before - Date.parse(String(cutoff))) / 86_400_000;
		expect(days).toBeCloseTo(LEAD_WINDOW_DAYS, 2);
	});

	test('with no saves this week the newest recipe leads', async () => {
		mockSelects([], []);

		const result = await loadDiscover(url(), VIEWER);

		expect(result.lead?.id).toBe(ROWS[0].id);
		expect(result.recipes.map((r) => r.id)).toEqual([2, 3]);
	});

	test('recent changes: newest later versions of visible recipes, linking to their diff', async () => {
		const { recentChain } = mockSelects(
			[],
			[
				{
					versionNumber: 4,
					commitMessage: 'Changed the glaze',
					slug: 'buns',
					title: 'Buns',
					username: 'maria'
				}
			]
		);

		const result = await loadDiscover(url(), VIEWER);

		expect(result.recentChanges).toEqual([
			{
				versionNumber: 4,
				commitMessage: 'Changed the glaze',
				slug: 'buns',
				title: 'Buns',
				username: 'maria',
				href: '/recipes/buns/diff?from=3&to=4'
			}
		]);
		expect(sqlOf(recentChain.where.mock.calls[0][0]).params).toContain(VIEWER.id);
		expect(recentChain.limit).toHaveBeenCalledWith(RECENT_CHANGES);
	});

	test('a filtered list is one plain grid: no lead, no recent changes', async () => {
		selectMock.mockReturnValue(chain([]));

		const result = await loadDiscover(url('?q=dal'), VIEWER);

		expect(result.lead).toBeNull();
		expect(result.recentChanges).toEqual([]);
		expect(result.recipes).toHaveLength(ROWS.length);
		expect(sqlOf(findManyMock.mock.calls[0][0].where).params).toContain('dal');
	});

	test('an @handle in the query narrows to that cook and leaves the rest as text', async () => {
		selectMock.mockReturnValue(chain([]));

		const result = await loadDiscover(url('?q=' + encodeURIComponent('@DevCooks dal')), VIEWER);

		const where = sqlOf(findManyMock.mock.calls[0][0].where);
		expect(where.params).toContain('devcooks');
		expect(where.params).toContain('dal');
		expect(where.params).not.toContain('@DevCooks dal');
		expect(result.searchQuery).toBe('@DevCooks dal');
	});

	test('friends=1 narrows to accepted friends’ recipes', async () => {
		friendIdsOfMock.mockResolvedValue(['friend-1']);
		selectMock.mockReturnValue(chain([]));

		const result = await loadDiscover(url('?friends=1'), VIEWER);

		expect(friendIdsOfMock).toHaveBeenCalledWith(VIEWER.id);
		expect(sqlOf(findManyMock.mock.calls[0][0].where).params).toContain('friend-1');
		expect(result.friendsOnly).toBe(true);
	});

	test('friends=1 with no friends is an empty list, not everyone', async () => {
		selectMock.mockReturnValue(chain([]));

		const result = await loadDiscover(url('?friends=1'), VIEWER);

		expect(result.recipes).toEqual([]);
		expect(findManyMock).not.toHaveBeenCalled();
	});

	test('signed out there is no friends toggle, and friends=1 is ignored', async () => {
		mockSelects([], []);

		const result = await loadDiscover(url('?friends=1'), null);

		expect(result.friendsOnly).toBeUndefined();
		expect(friendIdsOfMock).not.toHaveBeenCalled();
	});

	test('fork counts follow the viewer', async () => {
		const forkChain = chain([]);
		selectMock
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(forkChain);

		await loadDiscover(url(), VIEWER);

		expect(sqlOf(forkChain.where.mock.calls[0][0]).params).toContain(VIEWER.id);
	});
});
