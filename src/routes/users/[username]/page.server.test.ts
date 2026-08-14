import { vi, describe, test, expect, beforeEach } from 'vitest';
import { load } from './+page.server';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { findProfileMock, findRecipesMock, selectMock } = vi.hoisted(() => ({
	findProfileMock: vi.fn(),
	findRecipesMock: vi.fn(),
	selectMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
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

function makeLoadEvent(username: string) {
	return { params: { username } } as Parameters<typeof load>[0];
}

/** Drizzle-compatible chainable mock — thenable, and every chain method returns itself. */
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
		selectMock.mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ commitCount: 7 }])
			})
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = (await load(makeLoadEvent('chefmaria'))) as any;
		expect(result.commitCount).toBe(7);
	});
});
