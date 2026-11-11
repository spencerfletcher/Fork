import { vi, describe, test, expect, beforeEach } from 'vitest';
import type { SQL } from 'drizzle-orm';
import { chain, sqlOf } from '#lib/testing/drizzle.js';

const db = await vi.hoisted(async () => (await import('#lib/testing/drizzle.js')).mockDb());
vi.mock('#lib/server/db/index.js', () => ({ db }));
const { select: selectMock, selectDistinct: selectDistinctMock } = db;
const findManyMock = db.query.recipes.findMany;

import { loadDiscover, LEAD_WINDOW_DAYS, RECENT_CHANGES } from './discover.server';
import { CARDS_PER_PAGE } from '#lib/listPage.js';
import { CARD_WITH } from '#lib/server/recipeCounts.js';
import { authorIsFriendOf, visibleTo } from '#lib/server/visibility.js';

const VIEWER = { id: 'viewer-5' };
const url = (search = '') => new URL(`http://localhost/discover${search}`);

const row = (id: number, username = 'maria') => ({
	id,
	slug: `r-${id}`,
	title: `Recipe ${id}`,
	authorId: `a-${username}`,
	author: { id: `a-${username}`, username },
	// Lower ids changed later, so the default order (newest first) is by id.
	updatedAt: new Date(Date.UTC(2026, 0, 10 - id))
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
});

describe('loadDiscover', () => {
	test('reads one page of the grid, one card past it, and counts the whole set', async () => {
		mockSelects([], []);
		db.$count.mockResolvedValueOnce(130);

		const result = await loadDiscover(url(), VIEWER);

		expect(findManyMock.mock.calls[0][0].limit).toBe(CARDS_PER_PAGE + 1);
		expect(result.total).toBe(130);
		expect(sqlOf(db.$count.mock.calls[0][1])).toEqual(sqlOf(findManyMock.mock.calls[0][0].where));
	});

	test("Show more's fetch (after a cursor) reads the next cards alone: no lead, no Recent changes", async () => {
		selectMock.mockReturnValue(chain([]));

		const result = await loadDiscover(url('?after=24'), VIEWER);

		expect(result.lead).toBeNull();
		expect(result.recentChanges).toEqual([]);
		// The two card aggregates only: neither the lead's nor Recent changes' query ran.
		expect(selectMock).toHaveBeenCalledTimes(2);
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

	test('the lead is the most-saved visible recipe of the last week, and stays in the grid', async () => {
		const { leadChain } = mockSelects([{ recipeId: 3, saves: 4 }], []);
		const before = Date.now();

		const result = await loadDiscover(url(), VIEWER);

		expect(result.lead?.id).toBe(3);
		expect(result.recipes.map((r) => r.id)).toEqual(ROWS.map((r) => r.id));
		const leadWhere = sqlOf(leadChain.where.mock.calls[0][0]);
		expect(leadWhere.params).toContain(VIEWER.id);
		const cutoff = leadWhere.params.find(
			(p) => typeof p === 'string' && /^\d{4}-\d\d-\d\d/.test(p)
		);
		const days = (before - Date.parse(String(cutoff))) / 86_400_000;
		expect(days).toBeCloseTo(LEAD_WINDOW_DAYS, 2);
	});

	test('a most-saved recipe past the first page is read on its own to lead', async () => {
		findManyMock.mockResolvedValueOnce(ROWS).mockResolvedValueOnce([row(80)]);
		mockSelects([{ recipeId: 80, saves: 9 }], []);

		const result = await loadDiscover(url(), VIEWER);

		expect(result.lead?.id).toBe(80);
		expect(result.recipes.map((r) => r.id)).toEqual(ROWS.map((r) => r.id));
		expect(sqlOf(findManyMock.mock.calls[1][0].where).params).toContain(80);
	});

	test('with no saves this week the newest recipe leads', async () => {
		mockSelects([], []);

		const result = await loadDiscover(url(), VIEWER);

		expect(result.lead?.id).toBe(ROWS[0].id);
		expect(result.recipes.map((r) => r.id)).toEqual(ROWS.map((r) => r.id));
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

	test('a filter narrows the lead and Recent changes to the filtered set too', async () => {
		const { leadChain, recentChain } = mockSelects([{ recipeId: 2, saves: 3 }], []);

		const result = await loadDiscover(url('?q=dal'), VIEWER);

		expect(result.lead?.id).toBe(2);
		expect(result.recipes.map((r) => r.id)).toEqual(ROWS.map((r) => r.id));
		expect(sqlOf(findManyMock.mock.calls[0][0].where).params).toContain('dal');
		expect(sqlOf(leadChain.where.mock.calls[0][0]).params).toContain('dal');
		expect(sqlOf(recentChain.where.mock.calls[0][0]).params).toContain('dal');
	});

	test('a tag filter narrows the lead query to the recipes carrying the tags', async () => {
		selectDistinctMock.mockReturnValue(chain([{ id: 5, name: 'Baking', slug: 'baking' }]));
		const { leadChain } = mockSelects([], []);

		await loadDiscover(url('?tags=baking'), VIEWER);

		// The tag's id, in the carrying-every-tag subquery.
		expect(sqlOf(leadChain.where.mock.calls[0][0]).params).toContain(5);
	});

	test('filtered with no saves this week, the newest recipe in the set leads', async () => {
		// Text search orders by relevance, so the newest is read on its own.
		findManyMock.mockResolvedValueOnce([row(3), row(1), row(2)]).mockResolvedValueOnce([row(1)]);
		mockSelects([], []);

		const result = await loadDiscover(url('?q=dal'), VIEWER);

		expect(result.lead?.id).toBe(1);
		expect(result.recipes.map((r) => r.id)).toEqual([3, 1, 2]);
		const newest = findManyMock.mock.calls[1][0];
		expect(newest.limit).toBe(2);
		expect(newest.orderBy).toHaveLength(2);
		expect(sqlOf(newest.where).params).toContain('dal');
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

	test('an @handle a cook gave up still finds them, through the one resolver', async () => {
		selectMock.mockReturnValue(chain([]));

		await loadDiscover(url('?q=' + encodeURIComponent('@devcooks')), VIEWER);

		const where = sqlOf(findManyMock.mock.calls[0][0].where).sql;
		expect(where).toContain('"former_usernames"');
	});

	// The friends rule's fragment, its placeholders numbered as $ alone, counted.
	const friendRules = (where: SQL) => {
		const strip = (q: SQL) => sqlOf(q).sql.replace(/\$\d+/g, '$');
		return strip(where).split(strip(authorIsFriendOf(VIEWER.id))).length - 1;
	};

	test('friends=1 narrows to accepted friends’ recipes, inside what the viewer may see', async () => {
		selectMock.mockReturnValue(chain([]));

		const result = await loadDiscover(url('?friends=1'), VIEWER);

		// Once inside visibleTo's friends rule, once more as the filter.
		expect(friendRules(findManyMock.mock.calls[0][0].where)).toBe(2);
		expect(result.friendsOnly).toBe(true);
	});

	test('without friends=1 nothing narrows to friends', async () => {
		mockSelects([], []);

		const result = await loadDiscover(url(), VIEWER);

		expect(friendRules(findManyMock.mock.calls[0][0].where)).toBe(1);
		expect(result.friendsOnly).toBe(false);
	});

	test('signed out there is no friends toggle, and friends=1 is ignored', async () => {
		mockSelects([], []);

		const result = await loadDiscover(url('?friends=1'), null);

		expect(result.friendsOnly).toBeUndefined();
		expect(friendRules(findManyMock.mock.calls[0][0].where)).toBe(0);
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
