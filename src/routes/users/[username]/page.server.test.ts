import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain, sqlOf } from '#lib/testing/drizzle.js';
import { loadEvent, loadPage } from '#lib/testing/actions.js';
import { load } from './+page.server';
import type { PageData } from './$types';
import { recipes } from '#lib/server/db/schema.js';
import { namedBy } from '#lib/server/profiles.js';
import { and, eq } from 'drizzle-orm';
import { visibleTo } from '#lib/server/visibility.js';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { findProfileMock, findRecipesMock, selectMock, relationMock } = vi.hoisted(() => ({
	findProfileMock: vi.fn(),
	findRecipesMock: vi.fn(),
	selectMock: vi.fn(),
	relationMock: vi.fn()
}));

vi.mock('#lib/server/friends.js', () => ({ relationOf: relationMock }));
vi.mock('#lib/server/recipeCounts.js', async (importOriginal) => {
	const real = await importOriginal<typeof import('#lib/server/recipeCounts.js')>();
	return { ...real, attachRecipeCounts: vi.fn(real.attachRecipeCounts) };
});

vi.mock('#lib/server/db/index.js', () => ({
	db: {
		query: {
			profiles: { findFirst: findProfileMock },
			recipes: { findMany: findRecipesMock }
		},
		select: selectMock
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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('users/[username] load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default: commitCount query resolves to 0, and the version/fork count
		// aggregates (attachRecipeCounts) resolve to empty — same mock shape
		// serves both since `.groupBy()` is just another link in the chain.
		selectMock.mockReturnValue(chain([{ commitCount: 0 }]));
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

	// A renamed cook's old links keep working: one permanent hop to the new name.
	test('a former username redirects permanently to the current one, query kept', async () => {
		findProfileMock.mockResolvedValue(makeProfile({ username: 'mariacooks' }));
		await expect(load(makeLoadEvent('chefmaria', null, '?tab=forks'))).rejects.toMatchObject({
			status: 301,
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

	test('lists what the viewer may see: public to strangers, friends recipes to friends, everything to the owner', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([]);
		for (const viewer of [null, 'someone-else', 'user-1']) {
			findRecipesMock.mockClear();
			await load(makeLoadEvent('chefmaria', viewer));
			const user = viewer ? { id: viewer } : null;
			expect(findRecipesMock.mock.calls[0][0].where).toEqual(
				and(eq(recipes.authorId, 'user-1'), visibleTo(user))
			);
		}
	});

	test("fork counts are the viewer's: the counts are attached for the signed-in viewer", async () => {
		const shown = [{ id: 7, visibility: 'public' }];
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue(shown);
		await load(makeLoadEvent('chefmaria', 'viewer'));
		expect(attachRecipeCounts).toHaveBeenCalledWith(shown, { id: 'viewer' });
	});

	test('the link preview counts public recipes only, even for the owner', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([
			{ id: 1, visibility: 'public' },
			{ id: 2, visibility: 'friends' },
			{ id: 3, visibility: 'private' }
		]);
		const result = await loadPage<PageData>(load as never, makeLoadEvent('chefmaria', 'user-1'));
		expect(result.recipes).toHaveLength(3);
		expect(result.meta.description).toBe('1 public recipe and 0 changes on Fork.');
	});

	test('returns public recipes for the user', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		const recipes = [
			{ id: 1, title: 'Pasta', slug: 'pasta-abc' },
			{ id: 2, title: 'Soup', slug: 'soup-xyz' }
		];
		findRecipesMock.mockResolvedValue(recipes);
		const result = await loadPage<PageData>(load as never, makeLoadEvent('chefmaria'));
		expect(result.recipes).toHaveLength(2);
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
	});
});
