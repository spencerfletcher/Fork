import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { invokeAction as invoke, formEvent } from '#lib/testing/actions.js';
import { actions, load } from './+page.server';
import { makeIngredient, makeStep, makeContent } from '#lib/recipes/fixtures.js';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const {
	findRecipeMock,
	findFavoriteMock,
	selectMock,
	dbInsert,
	transactionMock,
	ensureProfileMock
} = vi.hoisted(() => ({
	findRecipeMock: vi.fn(),
	findFavoriteMock: vi.fn(),
	selectMock: vi.fn(),
	dbInsert: vi.fn(),
	transactionMock: vi.fn(),
	ensureProfileMock: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('#lib/server/db/index.js', () => ({
	db: {
		query: {
			recipes: { findFirst: findRecipeMock },
			favorites: { findFirst: findFavoriteMock }
		},
		select: selectMock,
		insert: dbInsert,
		transaction: transactionMock
	}
}));

vi.mock('#lib/server/profiles.js', () => ({ ensureProfile: ensureProfileMock }));

// The slug suffix must be deterministic so we can predict slugs.
vi.spyOn(crypto, 'randomUUID').mockReturnValue('abc12345-0000-4000-8000-000000000000');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTx(opts: { newRecipeId?: number; newRecipeSlug?: string } = {}) {
	const newRecipe = {
		id: opts.newRecipeId ?? 99,
		slug: opts.newRecipeSlug ?? 'forked-slug-abc12345'
	};
	const insertChain = chain([newRecipe]);
	const updateChain = chain();
	const deleteChain = chain();

	return {
		insert: vi.fn().mockReturnValue(insertChain),
		update: vi.fn().mockReturnValue(updateChain),
		delete: vi.fn().mockReturnValue(deleteChain),
		insertChain,
		updateChain
	};
}

const makeEvent = (opts: {
	params?: Record<string, string>;
	fields?: Record<string, string>;
	user?: { id: string; email: string } | null;
}) =>
	formEvent({
		fields: opts.fields,
		params: opts.params ?? { slug: 'source-recipe' },
		locals: { user: opts.user ?? null }
	});

const FORKER = { id: 'forker-id', email: 'forker@test.com' };

/** A complete source recipe with one version and one tag. */
// The recipe row's copies deliberately disagree with the latest version, so a
// test can tell which one the fork read from. The version is the truth.
const LATEST = makeContent({
	title: 'Classic Cookies',
	description: 'Good cookies',
	servings: 24,
	prepTimeMinutes: 20,
	cookTimeMinutes: 12,
	imageUrl: 'https://img/version.png',
	ingredients: [makeIngredient('2 cups flour')],
	steps: [makeStep('Mix.')]
});

const SOURCE_RECIPE = {
	id: 42,
	authorId: 'original-author',
	slug: 'classic-cookies',
	title: 'STALE COPY',
	description: 'stale',
	imageUrl: 'https://img/cookies.png',
	servings: 1,
	prepTimeMinutes: 1,
	cookTimeMinutes: 1,
	isPublic: true,
	parentId: null,
	forkedAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	editRevision: 3,
	versions: [{ id: 1, versionNumber: 1, commitMessage: 'Initial recipe', ...LATEST }],
	recipesToTags: [{ tagId: 7 }]
};

// ─── fork action ──────────────────────────────────────────────────────────────

describe('fork', () => {
	beforeEach(() => vi.clearAllMocks());

	test('throws 401 when not logged in', async () => {
		const result = await invoke(actions.fork as never, makeEvent({ user: null }));
		expect(result.status).toBe(401);
	});

	test('throws 404 when source recipe does not exist', async () => {
		findRecipeMock.mockResolvedValue(null);
		const result = await invoke(actions.fork as never, makeEvent({ user: FORKER }));
		expect(result.status).toBe(404);
	});

	test('throws 400 when source recipe has no versions', async () => {
		findRecipeMock.mockResolvedValue({ ...SOURCE_RECIPE, versions: [] });
		const result = await invoke(actions.fork as never, makeEvent({ user: FORKER }));
		expect(result.status).toBe(400);
	});

	test('ensures a profile for the forking user before the transaction', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeSlug: 'classic-cookies-abc12345' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(actions.fork as never, makeEvent({ user: FORKER }));

		expect(ensureProfileMock).toHaveBeenCalledWith(FORKER);
		expect(ensureProfileMock.mock.invocationCallOrder[0]).toBeLessThan(
			transactionMock.mock.invocationCallOrder[0]
		);
	});

	test('redirects to /edit of the new forked recipe on success', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeSlug: 'classic-cookies-abc12345' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		const result = await invoke(
			actions.fork as never,
			makeEvent({ user: FORKER, fields: { commitMessage: 'Forked!' } })
		);

		expect(result.status).toBe(303);
		expect(result.location).toBe('/recipes/classic-cookies-abc12345/edit');
	});

	test('inserts new recipe row with parentId pointing at source', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeSlug: 'classic-cookies-abc12345' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(actions.fork as never, makeEvent({ user: FORKER }));

		// First tx.insert call is the recipes table
		const recipeValues = tx.insertChain.values.mock.calls[0][0];
		expect(recipeValues.parentId).toBe(SOURCE_RECIPE.id);
		expect(recipeValues.authorId).toBe(FORKER.id);
	});

	test('writes the five copies on the new recipe from the latest version, not the source row', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeSlug: 'classic-cookies-abc12345' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(actions.fork as never, makeEvent({ user: FORKER }));

		const recipeValues = tx.insertChain.values.mock.calls[0][0];
		expect(recipeValues).toMatchObject({
			title: 'Classic Cookies',
			description: 'Good cookies',
			servings: 24,
			prepTimeMinutes: 20,
			cookTimeMinutes: 12,
			slug: 'classic-cookies-abc12345'
		});
	});

	test('takes visibility and tags from the source recipe, the photo from its latest version, and nothing else from the row', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeId: 99, newRecipeSlug: 'classic-cookies-abc12345' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(actions.fork as never, makeEvent({ user: FORKER }));

		const recipeValues = tx.insertChain.values.mock.calls[0][0];
		expect(recipeValues.imageUrl).toBe('https://img/version.png');
		expect(recipeValues.isPublic).toBe(true);
		expect(recipeValues).not.toHaveProperty('id');
		expect(recipeValues).not.toHaveProperty('editRevision');
		expect(recipeValues).not.toHaveProperty('createdAt');
		expect(tx.insertChain.values.mock.calls[1][0]).toEqual([{ recipeId: 99, tagId: 7 }]);
	});

	test('does not modify the source recipe', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx();
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(actions.fork as never, makeEvent({ user: FORKER }));

		expect(tx.update).not.toHaveBeenCalled();
		expect(tx.delete).not.toHaveBeenCalled();
	});

	test('inserts version 1 as the complete latest content of the source', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeId: 99, newRecipeSlug: 'classic-cookies-abc12345' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(
			actions.fork as never,
			makeEvent({ user: FORKER, fields: { commitMessage: 'My fork' } })
		);

		// Third tx.insert call is recipeVersions (after recipes + recipesToTags)
		const versionValues = tx.insertChain.values.mock.calls[2][0];
		expect(versionValues).toMatchObject({
			recipeId: 99,
			versionNumber: 1,
			commitMessage: 'My fork',
			createdBy: FORKER.id,
			...LATEST
		});
		expect(versionValues).not.toHaveProperty('id');
		expect(versionValues).not.toHaveProperty('createdAt');
	});

	test('copies tags from the source recipe', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeId: 99, newRecipeSlug: 'classic-cookies-abc12345' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(actions.fork as never, makeEvent({ user: FORKER }));

		// Second tx.insert call is recipesToTags
		const tagValues = tx.insertChain.values.mock.calls[1][0];
		expect(tagValues).toEqual([{ recipeId: 99, tagId: 7 }]);
	});

	test('uses a default commit message when none is provided', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeSlug: 'classic-cookies-abc12345' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(actions.fork as never, makeEvent({ user: FORKER, fields: { commitMessage: '' } }));

		const versionValues = tx.insertChain.values.mock.calls[2][0];
		expect(versionValues.commitMessage).toBe('Forked recipe');
	});
});

// ─── load: fork attribution ───────────────────────────────────────────────────

/** A RequestEvent-like object for `load`, which reads params, url, and locals. */
function makeLoadEvent(user: { id: string; email: string } | null = null) {
	return {
		params: { slug: 'the-fork' },
		url: new URL('http://localhost/recipes/the-fork'),
		locals: { user }
	};
}

/** A public fork whose parent has the given visibility and owner. */
function forkOf(parent: { isPublic: boolean; authorId: string }) {
	return {
		...SOURCE_RECIPE,
		id: 99,
		slug: 'the-fork',
		authorId: 'fork-author',
		parentId: 42,
		parent: {
			id: 42,
			slug: 'secret-original',
			title: 'Secret Original',
			...parent,
			author: { id: parent.authorId, username: 'original' }
		}
	};
}

// Column names referenced anywhere inside a Drizzle SQL fragment.
function columnNames(node: unknown, out: string[] = []): string[] {
	if (node && typeof node === 'object') {
		if ('queryChunks' in node) {
			for (const chunk of (node as { queryChunks: unknown[] }).queryChunks) columnNames(chunk, out);
		} else if ('name' in node && 'table' in node) {
			out.push((node as { name: string }).name);
		}
	}
	return out;
}

async function loadData(user: { id: string; email: string } | null = null) {
	return (await load(makeLoadEvent(user) as never)) as {
		recipe: { parent: unknown; parentId: number | null };
		forkCount: number;
		currentVersion: { ingredients: unknown[] } | null;
		grams: unknown[];
		meta: { title: string; description: string; image: string };
	};
}

describe('load: fork attribution', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		findFavoriteMock.mockResolvedValue(undefined);
		selectMock.mockReturnValue(chain([{ value: 0 }]));
	});

	test('counts public forks of the recipe', async () => {
		findRecipeMock.mockResolvedValue(forkOf({ isPublic: true, authorId: 'original-author' }));
		selectMock.mockReturnValue(chain([{ count: 2 }]));
		const data = await loadData();
		expect(data.forkCount).toBe(2);
	});

	test('includes a public parent', async () => {
		findRecipeMock.mockResolvedValue(forkOf({ isPublic: true, authorId: 'original-author' }));
		const data = await loadData();
		expect(data.recipe.parent).toMatchObject({ slug: 'secret-original' });
	});

	test('withholds a private parent from a viewer who does not own it', async () => {
		findRecipeMock.mockResolvedValue(forkOf({ isPublic: false, authorId: 'original-author' }));
		const data = await loadData(FORKER);
		expect(data.recipe.parent).toBeNull();
		// parentId stays so the page can say it was forked from a private recipe.
		expect(data.recipe.parentId).toBe(42);
	});

	test('withholds a private parent from a logged-out viewer', async () => {
		findRecipeMock.mockResolvedValue(forkOf({ isPublic: false, authorId: 'original-author' }));
		const data = await loadData(null);
		expect(data.recipe.parent).toBeNull();
	});

	test("includes a private parent for the parent's owner", async () => {
		findRecipeMock.mockResolvedValue(forkOf({ isPublic: false, authorId: 'original-author' }));
		const data = await loadData({ id: 'original-author', email: 'o@test.com' });
		expect(data.recipe.parent).toMatchObject({ slug: 'secret-original' });
	});

	test('builds the page metadata from the shown version, not the recipe copy', async () => {
		findRecipeMock.mockResolvedValue(forkOf({ isPublic: true, authorId: 'original-author' }));
		const data = await loadData();
		expect(data.meta.title).toBe('Classic Cookies');
		expect(data.meta.description).toBe('Good cookies');
		expect(data.meta.image).toBe('https://img/version.png');
	});

	test('404s a recipe with no version rather than rendering a broken page', async () => {
		findRecipeMock.mockResolvedValue({
			...forkOf({ isPublic: true, authorId: 'o' }),
			versions: []
		});
		const result = await Promise.resolve()
			.then(() => load(makeLoadEvent() as never))
			.catch((e: unknown) => e);
		expect(result).toMatchObject({ status: 404 });
	});

	test('returns one gram result per ingredient of the shown version', async () => {
		findRecipeMock.mockResolvedValue(forkOf({ isPublic: true, authorId: 'original-author' }));
		const data = await loadData();
		expect(data.grams).toHaveLength(data.currentVersion?.ingredients.length ?? -1);
	});

	test('counts only public forks, so private forks stay invisible', async () => {
		findRecipeMock.mockResolvedValue(forkOf({ isPublic: true, authorId: 'original-author' }));
		const countQuery = chain([{ count: 1 }]);
		selectMock.mockReturnValue(countQuery);
		await loadData();
		// The where clause must name is_public: a count of every fork would reveal
		// private forks by number.
		expect(columnNames(countQuery.where.mock.calls[0][0])).toContain('is_public');
	});
});
