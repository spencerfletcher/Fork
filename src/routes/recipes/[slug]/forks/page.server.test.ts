import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { and, desc, eq, or } from 'drizzle-orm';
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

const OWNER = { id: 'owner-id', email: 'owner@test.com' };
const VISITOR = { id: 'visitor-id', email: 'visitor@test.com' };
const RECIPE = {
	id: 42,
	slug: 'classic-cookies',
	title: 'Classic Cookies',
	isPublic: true,
	authorId: OWNER.id
};

const makeEvent = (user: { id: string; email: string } | null = null) =>
	({ params: { slug: RECIPE.slug }, locals: { user } }) as unknown as Parameters<typeof load>[0];

const run = (user: { id: string; email: string } | null = null) =>
	Promise.resolve()
		.then(() => load(makeEvent(user)))
		.catch((e: unknown) => e);

type Query = { where: unknown; orderBy: unknown };
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

	test('404s a private recipe to anyone but its author', async () => {
		findFirstMock.mockResolvedValue({ ...RECIPE, isPublic: false });
		expect(await run(VISITOR)).toMatchObject({ status: 404 });
		expect(await run(null)).toMatchObject({ status: 404 });
	});

	test('shows a private recipe’s forks to its author', async () => {
		findFirstMock.mockResolvedValue({ ...RECIPE, isPublic: false });
		expect(await run(OWNER)).toMatchObject({ recipe: { slug: RECIPE.slug } });
	});

	test('a logged-out visitor sees the public forks only', async () => {
		await run(null);
		expect(forksQuery().where).toEqual(
			and(eq(recipes.parentId, RECIPE.id), eq(recipes.isPublic, true))
		);
	});

	test('a signed-in visitor also sees their own private forks', async () => {
		await run(VISITOR);
		expect(forksQuery().where).toEqual(
			and(
				eq(recipes.parentId, RECIPE.id),
				or(eq(recipes.isPublic, true), eq(recipes.authorId, VISITOR.id))
			)
		);
	});

	test('lists the newest fork first', async () => {
		await run();
		expect(forksQuery().orderBy).toEqual([desc(recipes.createdAt)]);
	});

	test('returns the forks with their card counts', async () => {
		findManyMock.mockResolvedValue([{ id: 7, slug: 'my-cookies' }]);
		const data = await run();
		expect(data).toMatchObject({
			forks: [{ id: 7, slug: 'my-cookies', versionCount: 0, forkCount: 0 }]
		});
	});

	test('titles the page after the recipe', async () => {
		expect(await run()).toMatchObject({ meta: { title: `Forks of ${RECIPE.title}` } });
	});
});
