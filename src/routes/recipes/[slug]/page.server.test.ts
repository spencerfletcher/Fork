import { vi, describe, test, expect, beforeEach } from 'vitest';
import { actions } from './+page.server';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { findRecipeMock, dbInsert, transactionMock } = vi.hoisted(() => ({
	findRecipeMock: vi.fn(),
	// db.insert is called at the top level (profile upsert) before the transaction
	dbInsert: vi.fn().mockReturnValue({
		values: vi.fn().mockReturnValue({
			onConflictDoNothing: vi.fn().mockResolvedValue(undefined)
		})
	}),
	transactionMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			recipes: { findFirst: findRecipeMock }
		},
		insert: dbInsert,
		transaction: transactionMock
	}
}));

// nanoid must be deterministic so we can predict slugs
vi.mock('nanoid', () => ({ nanoid: vi.fn().mockReturnValue('abc123') }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Drizzle-compatible chainable mock — see edit/page.server.test.ts for rationale. */
function chain(resolved: unknown = undefined) {
	const p = Promise.resolve(resolved);
	const c: Record<string, unknown> = {
		then: p.then.bind(p),
		catch: p.catch.bind(p),
		finally: p.finally.bind(p),
		onConflictDoNothing: vi.fn().mockReturnValue(Promise.resolve()),
		returning: vi.fn().mockReturnValue(p)
	};
	for (const m of ['values', 'set', 'from', 'where']) {
		c[m] = vi.fn().mockReturnValue(c);
	}
	return c as Record<string, ReturnType<typeof vi.fn>>;
}

function makeTx(opts: { newRecipeId?: number; newRecipeSlug?: string } = {}) {
	const newRecipe = {
		id: opts.newRecipeId ?? 99,
		slug: opts.newRecipeSlug ?? 'forked-slug-abc123'
	};
	const insertChain = chain([newRecipe]);
	const updateChain = chain();
	const deleteChain = chain();

	return {
		insert: vi.fn().mockReturnValue(insertChain),
		update: vi.fn().mockReturnValue(updateChain),
		delete: vi.fn().mockReturnValue(deleteChain),
		query: { tags: { findMany: vi.fn().mockResolvedValue([]) } },
		insertChain,
		updateChain
	};
}

async function invoke(
	action: (...args: unknown[]) => unknown,
	event: unknown
): Promise<Record<string, unknown>> {
	return (action(event as never) as Promise<unknown>).catch((e: unknown) => e) as Promise<
		Record<string, unknown>
	>;
}

function makeEvent(opts: {
	params?: Record<string, string>;
	fields?: Record<string, string>;
	user?: { id: string; email: string } | null;
}) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(opts.fields ?? {})) fd.append(k, v);
	return {
		params: opts.params ?? { slug: 'source-recipe' },
		request: { formData: vi.fn().mockResolvedValue(fd) },
		locals: { user: opts.user ?? null }
	};
}

const FORKER = { id: 'forker-id', email: 'forker@test.com' };

/** A complete source recipe with one version and one tag. */
const SOURCE_RECIPE = {
	id: 42,
	authorId: 'original-author',
	slug: 'classic-cookies',
	title: 'Classic Cookies',
	description: 'Good cookies',
	imageUrl: null,
	servings: 24,
	prepTimeMinutes: 20,
	cookTimeMinutes: 12,
	isPublic: true,
	parentId: null,
	forkedAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	versions: [
		{
			id: 1,
			versionNumber: 1,
			commitMessage: 'Initial recipe',
			ingredients: [{ amount: '2', unit: 'cups', name: 'flour' }],
			steps: [{ step: 1, text: 'Mix.' }]
		}
	],
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

	test('upserts a profile for the forking user before the transaction', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeSlug: 'classic-cookies-abc123' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(actions.fork as never, makeEvent({ user: FORKER }));

		expect(dbInsert).toHaveBeenCalled();
		const profileValues = (dbInsert.mock.results[0].value.values as ReturnType<typeof vi.fn>).mock
			.calls[0][0];
		expect(profileValues.id).toBe(FORKER.id);
	});

	test('redirects to /edit of the new forked recipe on success', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeSlug: 'classic-cookies-abc123' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		const result = await invoke(
			actions.fork as never,
			makeEvent({ user: FORKER, fields: { commitMessage: 'Forked!' } })
		);

		expect(result.status).toBe(303);
		expect(result.location).toBe('/recipes/classic-cookies-abc123/edit');
	});

	test('inserts new recipe row with parentId pointing at source', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeSlug: 'classic-cookies-abc123' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(actions.fork as never, makeEvent({ user: FORKER }));

		// First tx.insert call is the recipes table
		const recipeValues = tx.insertChain.values.mock.calls[0][0];
		expect(recipeValues.parentId).toBe(SOURCE_RECIPE.id);
		expect(recipeValues.authorId).toBe(FORKER.id);
		expect(recipeValues.title).toBe(SOURCE_RECIPE.title);
	});

	test('inserts version 1 copying ingredients and steps from source', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeId: 99, newRecipeSlug: 'classic-cookies-abc123' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(
			actions.fork as never,
			makeEvent({ user: FORKER, fields: { commitMessage: 'My fork' } })
		);

		// Third tx.insert call is recipeVersions (after recipes + recipesToTags)
		const versionValues = tx.insertChain.values.mock.calls[2][0];
		expect(versionValues.versionNumber).toBe(1);
		expect(versionValues.commitMessage).toBe('My fork');
		expect(versionValues.ingredients).toEqual(SOURCE_RECIPE.versions[0].ingredients);
		expect(versionValues.steps).toEqual(SOURCE_RECIPE.versions[0].steps);
		expect(versionValues.createdBy).toBe(FORKER.id);
	});

	test('copies tags from the source recipe', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeId: 99, newRecipeSlug: 'classic-cookies-abc123' });
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
		const tx = makeTx({ newRecipeSlug: 'classic-cookies-abc123' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(actions.fork as never, makeEvent({ user: FORKER, fields: { commitMessage: '' } }));

		const versionValues = tx.insertChain.values.mock.calls[2][0];
		expect(versionValues.commitMessage).toBe('Forked recipe');
	});
});
