import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { load } from './+page.server';
import { recipes } from '#lib/server/db/schema.js';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { findProfileMock, findRecipesMock, selectMock, countMock } = vi.hoisted(() => ({
	findProfileMock: vi.fn(),
	findRecipesMock: vi.fn(),
	selectMock: vi.fn(),
	countMock: vi.fn()
}));

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

function makeLoadEvent(username: string, viewerId: string | null = null) {
	return {
		params: { username },
		locals: { user: viewerId ? { id: viewerId } : null }
	} as Parameters<typeof load>[0];
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

	test('returns profile when found', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([]);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = (await load(makeLoadEvent('chefmaria'))) as any;
		expect(result.profile.username).toBe('chefmaria');
	});

	test('returns public recipes for the user', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		const recipes = [
			{ id: 1, title: 'Pasta', slug: 'pasta-abc' },
			{ id: 2, title: 'Soup', slug: 'soup-xyz' }
		];
		findRecipesMock.mockResolvedValue(recipes);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = (await load(makeLoadEvent('chefmaria'))) as any;
		expect(result.recipes).toHaveLength(2);
	});

	test('returns commitCount from db', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([]);
		selectMock.mockReturnValue(chain([{ commitCount: 7 }]));
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = (await load(makeLoadEvent('chefmaria'))) as any;
		expect(result.commitCount).toBe(7);
	});

	test('tells the owner how many private recipes they have', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([]);
		countMock.mockResolvedValue(2);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = (await load(makeLoadEvent('chefmaria', 'user-1'))) as any;
		expect(result.privateCount).toBe(2);
	});

	test('never counts private recipes for anyone but the owner', async () => {
		findProfileMock.mockResolvedValue(makeProfile());
		findRecipesMock.mockResolvedValue([]);
		countMock.mockResolvedValue(2);
		for (const viewer of [null, 'someone-else']) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result = (await load(makeLoadEvent('chefmaria', viewer))) as any;
			expect(result.privateCount).toBe(0);
		}
		expect(countMock).not.toHaveBeenCalled();
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
