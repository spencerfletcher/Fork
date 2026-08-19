import { vi, describe, test, expect, beforeEach } from 'vitest';
import { and, eq, inArray } from 'drizzle-orm';
import { recipes, recipeVersions } from '$lib/server/db/schema';

const { findManyMock, selectMock, recipeVersionsFindManyMock } = vi.hoisted(() => ({
	findManyMock: vi.fn(),
	selectMock: vi.fn(),
	recipeVersionsFindManyMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			recipes: { findMany: findManyMock },
			recipeVersions: { findMany: recipeVersionsFindManyMock }
		},
		select: selectMock
	}
}));

import { load } from './+page.server';
import type { PageData } from './$types';

function chain(resolved: unknown = []) {
	const p = Promise.resolve(resolved);
	const c: Record<string, unknown> = {
		then: p.then.bind(p),
		catch: p.catch.bind(p),
		finally: p.finally.bind(p)
	};
	for (const m of ['from', 'where', 'groupBy', 'innerJoin', 'leftJoin', 'orderBy']) {
		c[m] = vi.fn().mockReturnValue(c);
	}
	return c;
}

/**
 * `load` is annotated with the generic `PageServerLoad` interface, whose
 * default `OutputData` includes `Record<string, any>` — so `ReturnType<typeof load>`
 * types every property as `any`, and may also be `void`. The framework's own
 * `PageData` (derived from the real implementation via SvelteKit's generated
 * proxy module) is the precise type; narrow to it once here.
 */
async function loadResult(event: Parameters<typeof load>[0]): Promise<PageData> {
	const result = await load(event);
	if (!result) throw new Error('load returned no data');
	return result as PageData;
}

describe('homepage load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default: no second version available, so sampleDiff stays null unless a
		// test sets it up explicitly. Keeps pre-existing tests (which don't care
		// about the diff) from needing to know about this call.
		recipeVersionsFindManyMock.mockResolvedValue([]);
	});

	test('attaches version and fork counts without a query per card', async () => {
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'A', recipesToTags: [], author: null },
			{ id: 2, title: 'B', recipesToTags: [], author: null },
			{ id: 3, title: 'C', recipesToTags: [], author: null }
		]);
		selectMock
			.mockReturnValueOnce(
				chain([
					{ recipeId: 1, count: 2 },
					{ recipeId: 2, count: 1 }
				])
			)
			.mockReturnValueOnce(chain([{ parentId: 1, count: 4 }]));

		const result = await loadResult({
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0]);

		expect(result.recipes[0].versionCount).toBe(2);
		expect(result.recipes[0].forkCount).toBe(4);
		expect(result.recipes[2].versionCount).toBe(0);
		// Two aggregates total, regardless of how many recipes came back.
		expect(selectMock).toHaveBeenCalledTimes(2);
	});

	test('scopes the fork-count aggregate to public recipes', async () => {
		// This is the anonymous homepage feed — no auth check. A private fork
		// must not inflate a public parent's fork count for every visitor.
		findManyMock.mockResolvedValue([{ id: 1, title: 'A', recipesToTags: [], author: null }]);
		const versionChain = chain([]);
		const forkChain = chain([{ parentId: 1, count: 3 }]);
		selectMock.mockReturnValueOnce(versionChain).mockReturnValueOnce(forkChain);

		const result = await loadResult({
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0]);

		expect(result.recipes[0].forkCount).toBe(3);

		// Structural assertion, not a decorative "was .where called" check: this
		// compares the exact condition object the loader passed to `.where()`
		// against the same condition built directly from drizzle-orm here, so it
		// fails if the loader drops the `isPublic` filter, uses the wrong column,
		// or the wrong literal — not just if `.where` was called at all.
		const whereMock = forkChain.where as ReturnType<typeof vi.fn>;
		const whereArg = whereMock.mock.calls[0][0];
		expect(whereArg).toEqual(and(inArray(recipes.parentId, [1]), eq(recipes.isPublic, true)));
	});

	test('returns feed mode for a logged-in user', async () => {
		findManyMock.mockResolvedValue([]);
		selectMock.mockReturnValue(chain([]));

		const result = await loadResult({
			locals: { user: { id: 'u1' } }
		} as unknown as Parameters<typeof load>[0]);

		expect(result.mode).toBe('feed');
	});

	test('returns landing mode for an anonymous visitor', async () => {
		findManyMock.mockResolvedValue([]);
		selectMock.mockReturnValue(chain([]));

		const result = await loadResult({
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0]);

		expect(result.mode).toBe('landing');
	});

	test('skips a recipe whose latest two versions are identical, in favor of one that actually differs', async () => {
		// B has more history than a recipe needs to qualify, but its latest two
		// versions are a no-op commit (e.g. re-saved with no changes) — the
		// landing page must not show "A real change, diffed" over an empty diff.
		// C's latest two versions do differ, so C should be picked instead.
		const showcaseAuthor = { id: 'user-1', username: 'spencerfletcher' };
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'B', slug: 'b', recipesToTags: [], author: showcaseAuthor },
			{ id: 2, title: 'C', slug: 'c', recipesToTags: [], author: showcaseAuthor }
		]);
		selectMock.mockReturnValueOnce(
			chain([
				{ recipeId: 1, count: 2 },
				{ recipeId: 2, count: 2 }
			])
		);
		selectMock.mockReturnValueOnce(chain([]));

		const sameIngredients = [{ amount: '1', unit: 'cup', name: 'flour' }];
		const sameSteps = [{ step: 1, text: 'Mix.' }];

		recipeVersionsFindManyMock
			// Called for candidate B first (withCounts preserves findMany order)
			.mockResolvedValueOnce([
				{ ingredients: sameIngredients, steps: sameSteps },
				{ ingredients: sameIngredients, steps: sameSteps }
			])
			// Then for candidate C
			.mockResolvedValueOnce([
				{ ingredients: [{ amount: '2', unit: 'cup', name: 'flour' }], steps: sameSteps },
				{ ingredients: sameIngredients, steps: sameSteps }
			]);

		const result = await loadResult({
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0]);

		expect(result.sampleDiff?.recipeTitle).toBe('C');
		expect(recipeVersionsFindManyMock).toHaveBeenCalledTimes(2);
		const hasVisibleChange =
			result.sampleDiff?.ingredientDiff.some((r) => r.status !== 'unchanged') ||
			result.sampleDiff?.stepDiff.some((r) => r.status !== 'unchanged');
		expect(hasVisibleChange).toBe(true);
	});

	test('counts only the recipes the landing page actually renders', async () => {
		// The landing page shows three cards. Aggregating over every public recipe
		// to display three is work that grows with the size of the site for a page
		// whose output does not.
		findManyMock.mockResolvedValue(
			Array.from({ length: 20 }, (_, i) => ({
				id: i + 1,
				title: `R${i + 1}`,
				slug: `r${i + 1}`,
				recipesToTags: [],
				author: null
			}))
		);
		const versionChain = chain([]);
		selectMock.mockReturnValueOnce(versionChain).mockReturnValueOnce(chain([]));

		const result = await loadResult({
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0]);

		expect(result.recipes.length).toBe(3);
		// Structural: compare the condition object against one built here, so the
		// test fails if the loader widens the id set rather than merely if
		// `.where` was called.
		const whereArg = (versionChain.where as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(whereArg).toEqual(inArray(recipeVersions.recipeId, [1, 2, 3]));
	});

	test('still counts showcase candidates that fall outside the three rendered cards', async () => {
		// The diff picker needs version counts for the owner's recipes to know
		// which have history — scoping the aggregate must not starve it.
		const showcaseAuthor = { id: 'user-1', username: 'spencerfletcher' };
		findManyMock.mockResolvedValue([
			...Array.from({ length: 3 }, (_, i) => ({
				id: i + 1,
				title: `R${i + 1}`,
				slug: `r${i + 1}`,
				recipesToTags: [],
				author: null
			})),
			{ id: 9, title: 'Owned', slug: 'owned', recipesToTags: [], author: showcaseAuthor }
		]);
		const versionChain = chain([{ recipeId: 9, count: 2 }]);
		selectMock.mockReturnValueOnce(versionChain).mockReturnValueOnce(chain([]));
		recipeVersionsFindManyMock.mockResolvedValue([
			{ ingredients: [{ amount: '2', unit: 'cup', name: 'flour' }], steps: [], versionNumber: 2 },
			{ ingredients: [{ amount: '1', unit: 'cup', name: 'flour' }], steps: [], versionNumber: 1 }
		]);

		const result = await loadResult({
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0]);

		const whereArg = (versionChain.where as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(whereArg).toEqual(inArray(recipeVersions.recipeId, [1, 2, 3, 9]));
		expect(result.sampleDiff?.recipeTitle).toBe('Owned');
	});

	test('picks the pair with the most changes, not merely the first that differs', async () => {
		// The landing diff is the shop window. A one-line tweak on the newest
		// recipe used to win it outright, including the version the e2e suite
		// writes on every run.
		const showcaseAuthor = { id: 'user-1', username: 'spencerfletcher' };
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'Tweak', slug: 'tweak', recipesToTags: [], author: showcaseAuthor },
			{
				id: 2,
				title: 'Substantial',
				slug: 'substantial',
				recipesToTags: [],
				author: showcaseAuthor
			}
		]);
		selectMock
			.mockReturnValueOnce(
				chain([
					{ recipeId: 1, count: 2 },
					{ recipeId: 2, count: 2 }
				])
			)
			.mockReturnValueOnce(chain([]));

		const steps = [{ step: 1, text: 'Mix.' }];
		// Candidate 1 is newer and does differ — one ingredient amount.
		recipeVersionsFindManyMock
			.mockResolvedValueOnce([
				{
					versionNumber: 2,
					ingredients: [{ amount: '2', unit: 'tsp', name: 'vanilla' }],
					steps
				},
				{ versionNumber: 1, ingredients: [{ amount: '1', unit: 'tsp', name: 'vanilla' }], steps }
			])
			// Candidate 2 is older but rewrites three ingredients and a step.
			.mockResolvedValueOnce([
				{
					versionNumber: 2,
					ingredients: [
						{ amount: '½', unit: 'cup', name: 'sugar' },
						{ amount: '1', unit: 'cup', name: 'brown sugar' },
						{ amount: '1', unit: 'tsp', name: 'flaky salt' }
					],
					steps: [{ step: 1, text: 'Chill the dough overnight.' }]
				},
				{
					versionNumber: 1,
					ingredients: [
						{ amount: '¾', unit: 'cup', name: 'sugar' },
						{ amount: '¾', unit: 'cup', name: 'brown sugar' }
					],
					steps
				}
			]);

		const result = await loadResult({
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0]);

		expect(result.sampleDiff?.recipeTitle).toBe('Substantial');
	});

	test('keeps the newer recipe when two candidates change equally', async () => {
		const showcaseAuthor = { id: 'user-1', username: 'spencerfletcher' };
		findManyMock.mockResolvedValue([
			{ id: 1, title: 'Newer', slug: 'newer', recipesToTags: [], author: showcaseAuthor },
			{ id: 2, title: 'Older', slug: 'older', recipesToTags: [], author: showcaseAuthor }
		]);
		selectMock
			.mockReturnValueOnce(
				chain([
					{ recipeId: 1, count: 2 },
					{ recipeId: 2, count: 2 }
				])
			)
			.mockReturnValueOnce(chain([]));

		const pair = (name: string) => [
			{ versionNumber: 2, ingredients: [{ amount: '2', unit: 'tsp', name }], steps: [] },
			{ versionNumber: 1, ingredients: [{ amount: '1', unit: 'tsp', name }], steps: [] }
		];
		recipeVersionsFindManyMock
			.mockResolvedValueOnce(pair('vanilla'))
			.mockResolvedValueOnce(pair('almond'));

		const result = await loadResult({
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0]);

		expect(result.sampleDiff?.recipeTitle).toBe('Newer');
	});

	test('does not select a qualifying recipe from another author for the showcase diff', async () => {
		// Signup is open, so any registered user's recipe would otherwise qualify.
		// The showcase diff must stay pinned to the site owner's own recipes — a
		// stranger's recipe with two differing versions must never be picked, even
		// when it is the only qualifying candidate.
		findManyMock.mockResolvedValue([
			{
				id: 1,
				title: 'Stranger Danger',
				slug: 'stranger-danger',
				recipesToTags: [],
				author: { id: 'user-2', username: 'not-spencer' }
			}
		]);
		selectMock.mockReturnValueOnce(chain([{ recipeId: 1, count: 2 }]));
		selectMock.mockReturnValueOnce(chain([]));

		const result = await loadResult({
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0]);

		expect(result.sampleDiff).toBeNull();
		// The candidate was excluded before the loop, so no per-recipe version
		// query should ever have been issued for it.
		expect(recipeVersionsFindManyMock).not.toHaveBeenCalled();
	});
});
