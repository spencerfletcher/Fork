import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { loadEvent } from '#lib/testing/actions.js';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { recipes } from '#lib/server/db/schema.js';

const { findFirstMock, findManyMock, selectMock } = vi.hoisted(() => ({
	findFirstMock: vi.fn(),
	findManyMock: vi.fn(),
	selectMock: vi.fn()
}));
vi.mock('#lib/server/db/index.js', () => ({
	db: {
		query: { recipes: { findFirst: findFirstMock, findMany: findManyMock } },
		select: selectMock
	}
}));

import { load } from './+page.server';
import { visibleTo } from '#lib/server/visibility.js';

const OWNER = { id: 'owner-id', email: 'owner@test.com' };
const VISITOR = { id: 'visitor-id', email: 'visitor@test.com' };
const RECIPE = {
	id: 42,
	slug: 'classic-cookies',
	title: 'Classic Cookies',
	visibility: 'public',
	authorId: OWNER.id
};

const makeEvent = (user: { id: string; email: string } | null = null) =>
	loadEvent({ params: { slug: RECIPE.slug }, user });

const run = (user: { id: string; email: string } | null = null) =>
	Promise.resolve()
		.then(() => load(makeEvent(user)))
		.catch((e: unknown) => e);

type Query = { where: unknown; orderBy: unknown; with: Record<string, unknown> };
const forksQuery = () => findManyMock.mock.calls[0][0] as Query;

beforeEach(() => {
	vi.clearAllMocks();
	findFirstMock.mockResolvedValue(RECIPE);
	findManyMock.mockResolvedValue([]);
	selectMock.mockReturnValue(chain([]));
});

describe('/recipes/[slug]/forks load', () => {
	test('404s a recipe that does not exist', async () => {
		findFirstMock.mockResolvedValue(undefined);
		expect(await run()).toMatchObject({ status: 404 });
	});

	test("a public recipe's forks page previews; a private one is noindex to its author", async () => {
		expect(await run()).toMatchObject({ meta: { noindex: false } });
		findFirstMock.mockResolvedValue({ ...RECIPE, visibility: 'private' });
		expect(await run(OWNER)).toMatchObject({ meta: { noindex: true } });
	});

	test('404s a private recipe to anyone but its author', async () => {
		findFirstMock.mockResolvedValue({ ...RECIPE, visibility: 'private' });
		expect(await run(VISITOR)).toMatchObject({ status: 404 });
		expect(await run(null)).toMatchObject({ status: 404 });
	});

	test('shows a private recipe’s forks to its author', async () => {
		findFirstMock.mockResolvedValue({ ...RECIPE, visibility: 'private' });
		expect(await run(OWNER)).toMatchObject({ recipe: { slug: RECIPE.slug } });
	});

	test('a logged-out visitor sees the public forks only, none in the Trash or hidden', async () => {
		await run(null);
		expect(forksQuery().where).toEqual(
			and(
				eq(recipes.parentId, RECIPE.id),
				and(
					isNull(recipes.deletedAt),
					isNull(recipes.suppressedAt),
					eq(recipes.visibility, 'public')
				)
			)
		);
	});

	test('a signed-in visitor sees the forks visibleTo allows them', async () => {
		await run(VISITOR);
		expect(forksQuery().where).toEqual(and(eq(recipes.parentId, RECIPE.id), visibleTo(VISITOR)));
	});

	test("shows a friends recipe's forks to a friend of its author, 404 to anyone else", async () => {
		findFirstMock.mockResolvedValue({ ...RECIPE, visibility: 'friends' });
		selectMock.mockReturnValueOnce(
			chain([{ requesterId: RECIPE.authorId, addresseeId: VISITOR.id }])
		);
		expect(await run(VISITOR)).toMatchObject({ recipe: { slug: RECIPE.slug } });
		selectMock.mockReturnValueOnce(chain([]));
		expect(await run(VISITOR)).toMatchObject({ status: 404 });
	});

	test('lists the newest fork first', async () => {
		await run();
		expect(forksQuery().orderBy).toEqual([desc(recipes.createdAt)]);
	});

	test('returns the forks with their card counts', async () => {
		findManyMock.mockResolvedValue([{ id: 7, slug: 'my-cookies', versions: [] }]);
		const data = await run();
		expect(data).toMatchObject({
			forks: [{ id: 7, slug: 'my-cookies', versionCount: 0, forkCount: 0 }]
		});
	});

	test("a signed-in visitor's card fork counts include the forks visibleTo lets them see", async () => {
		findManyMock.mockResolvedValue([{ id: 7, slug: 'my-cookies', versions: [] }]);
		const forkCounts = chain([]);
		// attachRecipeCounts: version counts first, then fork counts.
		selectMock.mockReturnValueOnce(chain([])).mockReturnValueOnce(forkCounts);
		await run(VISITOR);
		expect(forkCounts.where).toHaveBeenCalledWith(
			and(inArray(recipes.parentId, [7]), visibleTo(VISITOR))
		);
	});

	test("each fork's note is read from this recipe, its parent: the author's current handle and the version copied", async () => {
		findFirstMock.mockResolvedValue({ ...RECIPE, author: { username: 'owner-renamed' } });
		findManyMock.mockResolvedValue([
			{ id: 7, slug: 'my-cookies', parentVersion: 3 },
			{ id: 8, slug: 'old', parentVersion: null }
		]);
		const data = (await run()) as { forks: Record<string, unknown>[] };
		expect(findFirstMock.mock.calls[0][0].with).toEqual({
			author: { columns: { username: true } }
		});
		expect(data.forks[0]).toMatchObject({ id: 7, forkNote: 'Forked from @owner-renamed, v3' });
		expect(data.forks[1]).toMatchObject({ id: 8, forkNote: 'Forked from @owner-renamed' });
		expect(forksQuery().with).not.toHaveProperty('versions');
	});

	test('titles the page after the recipe', async () => {
		expect(await run()).toMatchObject({ meta: { title: `Forks of ${RECIPE.title}` } });
	});
});
