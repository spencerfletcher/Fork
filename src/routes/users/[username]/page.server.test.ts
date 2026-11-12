import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain, sqlOf } from '#lib/testing/drizzle.js';
import { loadEvent, loadPage } from '#lib/testing/actions.js';
import { load } from './+page.server';
import type { PageData } from './$types';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { namedBy } from '#lib/server/profiles.js';
import { and, desc, eq, inArray, type SQL } from 'drizzle-orm';
import { visibleTo } from '#lib/server/visibility.js';
import { CARDS_PER_PAGE } from '#lib/listPage.js';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { findProfileMock, findRecipesMock, selectMock, relationMock, countMock } = vi.hoisted(
	() => ({
		findProfileMock: vi.fn(),
		findRecipesMock: vi.fn(),
		selectMock: vi.fn(),
		relationMock: vi.fn(),
		countMock: vi.fn()
	})
);

vi.mock('#lib/server/friends.js', () => ({ relationOf: relationMock }));

vi.mock('#lib/server/db/index.js', () => ({
	db: {
		query: {
			profiles: { findFirst: findProfileMock },
			recipes: { findMany: findRecipesMock }
		},
		select: selectMock,
		$count: countMock
	}
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProfile(overrides = {}) {
	return {
		id: 'user-1',
		username: 'chefmaria',
		avatarUrl: null,
		createdAt: new Date(),
		...overrides
	};
}

function makeLoadEvent(username: string, viewerId: string | null = null, search = '') {
	return loadEvent({
		params: { username },
		path: `/users/${username}${search}`,
		user: viewerId ? { id: viewerId } : null
	});
}

/** Counts by condition: the public recipes for the preview, else the viewer's total. */
function countsBy({ total, publicCount }: { total: number; publicCount: number }) {
	const publicWhere = JSON.stringify(sqlOf(and(eq(recipes.authorId, 'user-1'), visibleTo(null))!));
	countMock.mockImplementation(async (_table: unknown, where: SQL) =>
		JSON.stringify(sqlOf(where)) === publicWhere ? publicCount : total
	);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('users/[username] load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default: commitCount query resolves to 0, and the version/fork count
		// aggregates (attachRecipeCounts) resolve to empty — same mock shape
		// serves both since `.groupBy()` is just another link in the chain.
		selectMock.mockReturnValue(chain([{ commitCount: 0 }]));
		countMock.mockResolvedValue(0);
	});

	test('throws 404 when profile is not found', async () => {
		findProfileMock.mockResolvedValue(null);
		await expect(load(makeLoadEvent('nobody'))).rejects.toMatchObject({ status: 404 });
	});

	// Usernames are stored lowercased, so /users/ChefMaria moves to the one
	// canonical URL rather than serving a second copy of the page.
	test('a mixed-case username redirects permanently to the lowercase path', async () => {
		await expect(load(makeLoadEvent('ChefMaria'))).rejects.toMatchObject({
			status: 301,
			location: '/users/chefmaria'
		});
		expect(findProfileMock).not.toHaveBeenCalled();
	});

	test('the redirect keeps the query string and encodes the handle', async () => {
		await expect(load(makeLoadEvent('Chef Maria', null, '?tab=forks'))).rejects.toMatchObject({
			status: 301,
			location: '/users/chef%20maria?tab=forks'
		});
	});

	test('looks the username up as given when it is already lowercase, current or former', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([]);
		await load(makeLoadEvent('chefmaria'));
		expect(sqlOf(findProfileMock.mock.calls[0][0].where)).toEqual(sqlOf(namedBy('chefmaria')));
	});

	// A renamed cook's old links keep working: one hop to the new name. Not
	// permanent, since a browser would keep it after the cook takes the name back.
	test('a former username redirects to the current one, not permanently, query kept', async () => {
		findProfileMock.mockResolvedValue(makeProfile({ username: 'mariacooks' }));
		await expect(load(makeLoadEvent('chefmaria', null, '?tab=forks'))).rejects.toMatchObject({
			status: 302,
			location: '/users/mariacooks?tab=forks'
		});
		expect(findRecipesMock).not.toHaveBeenCalled();
	});

	test("the relation is the viewer's with this person; signed out there is none", async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([]);
		relationMock.mockResolvedValue('received');
		const signedIn = (await load(makeLoadEvent('chefmaria', 'viewer'))) as { relation: unknown };
		expect(relationMock).toHaveBeenCalledWith('viewer', 'user-1');
		expect(signedIn.relation).toBe('received');

		relationMock.mockClear();
		const signedOut = (await load(makeLoadEvent('chefmaria'))) as { relation: unknown };
		expect(signedOut.relation).toBeNull();
		expect(relationMock).not.toHaveBeenCalled();
	});

	test('returns profile when found', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([]);
		const result = await loadPage<PageData>(load as never, makeLoadEvent('chefmaria'));
		expect(result.profile.username).toBe('chefmaria');
	});

	// The page shows the handle and the month joined; the cook's settings are
	// theirs alone, and the page does not need them even for its owner.
	test.each([
		['a stranger', null],
		['the owner', 'user-1']
	])('hands %s only what the page shows, never the settings', async (_who, viewer) => {
		const row = makeProfile({
			defaultVisibility: 'friends',
			measurement: 'us',
			startersMadeAt: new Date(),
			avatarUrl: 'https://cdn.test/a.png'
		});
		findProfileMock.mockResolvedValue(row);
		const result = await loadPage<PageData>(load as never, makeLoadEvent('chefmaria', viewer));
		expect(result.profile).toEqual({
			id: row.id,
			username: row.username,
			createdAt: row.createdAt
		});
	});

	test('lists what the viewer may see: public to strangers, friends recipes to friends, everything to the owner', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([]);
		for (const viewer of [null, 'someone-else', 'user-1']) {
			findRecipesMock.mockClear();
			countMock.mockClear();
			await load(makeLoadEvent('chefmaria', viewer));
			const user = viewer ? { id: viewer } : null;
			const where = sqlOf(and(eq(recipes.authorId, 'user-1'), visibleTo(user))!);
			expect(sqlOf(findRecipesMock.mock.calls[0][0].where)).toEqual(where);
			// The grid's count is the same list's, whole.
			expect(countMock.mock.calls.map((c) => sqlOf(c[1]))).toContainEqual(where);
		}
	});

	// The shared card list: newest change first, one page and a keyset cursor.
	test('shows one page of cards, newest change first, with the cursor of the next', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		const rows = Array.from({ length: CARDS_PER_PAGE + 1 }, (_, i) => ({
			id: 100 - i,
			visibility: 'public',
			cursorAt: `2026-11-0${(i % 9) + 1} 10:00:00`
		}));
		findRecipesMock.mockResolvedValue(rows);
		const result = await loadPage<PageData>(load as never, makeLoadEvent('chefmaria'));
		const query = findRecipesMock.mock.calls[0][0];
		expect(query.orderBy).toEqual([desc(recipes.updatedAt), desc(recipes.id)]);
		expect(query.limit).toBe(CARDS_PER_PAGE + 1);
		expect(result.recipes).toHaveLength(CARDS_PER_PAGE);
		const last = rows[CARDS_PER_PAGE - 1];
		expect(result.next).toBe(`${last.cursorAt}~${last.id}`);
	});

	test('a cursor in the URL reads the page after it', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([]);
		await load(makeLoadEvent('chefmaria', null, '?after=2026-11-03%2010:00:00~42'));
		expect(sqlOf(findRecipesMock.mock.calls[0][0].where).params).toEqual(
			expect.arrayContaining(['2026-11-03 10:00:00', 42])
		);
	});

	test("fork counts are the viewer's: the counts are attached for the signed-in viewer", async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([{ id: 7, visibility: 'public', cursorAt: 'x' }]);
		const forkChain = chain([]);
		// The commit count, then the version and fork aggregates.
		selectMock
			.mockReturnValueOnce(chain([{ commitCount: 0 }]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(forkChain);
		await load(makeLoadEvent('chefmaria', 'viewer'));
		expect(sqlOf(forkChain.where.mock.calls[0][0])).toEqual(
			sqlOf(and(inArray(recipes.parentId, [7]), visibleTo({ id: 'viewer' }))!)
		);
	});

	test('the total and the link preview are counts, the preview of public recipes only, even for the owner', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([{ id: 1, visibility: 'public' }]);
		countsBy({ total: 61, publicCount: 30 });
		const result = await loadPage<PageData>(load as never, makeLoadEvent('chefmaria', 'user-1'));
		expect(result.total).toBe(61);
		expect(result.meta.description).toBe('30 public recipes and 0 changes on Fork.');
		expect(result.meta.noindex).toBe(false);
	});

	test('a profile with no public recipe is noindex, even to its owner who sees the rest', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([{ id: 2, visibility: 'friends' }]);
		countsBy({ total: 1, publicCount: 0 });
		const result = await loadPage<PageData>(load as never, makeLoadEvent('chefmaria', 'user-1'));
		expect(result.meta.noindex).toBe(true);
	});

	test('returns commitCount from db', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([]);
		selectMock.mockReturnValue(chain([{ commitCount: 7 }]));
		const result = await loadPage<PageData>(load as never, makeLoadEvent('chefmaria'));
		expect(result.commitCount).toBe(7);
		// The profile says "changes", not git's "commits", in its link preview too.
		expect(result.meta.description).toBe('0 public recipes and 7 changes on Fork.');
	});

	test('counts only commits on public recipes, so private work stays hidden', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([]);

		await load(makeLoadEvent('chefmaria'));

		// The first select is the commit count. It has to reach the recipes
		// table to know each version's visibility.
		const commitChain = selectMock.mock.results[0].value;
		const joinedTables = commitChain.innerJoin.mock.calls.map((call: unknown[]) => call[0]);
		expect(joinedTables).toContain(recipes);
		// Public as a signed-out visitor sees it, so a recipe in the Trash counts nothing.
		expect(commitChain.where.mock.calls[0][0]).toEqual(
			and(eq(recipeVersions.createdBy, 'user-1'), visibleTo(null))
		);
	});
});
