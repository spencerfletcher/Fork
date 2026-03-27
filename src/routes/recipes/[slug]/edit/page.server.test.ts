import { vi, describe, test, expect, beforeEach } from 'vitest';
import { actions } from './+page.server';

// ─── Hoisted mocks (must be available inside vi.mock factory) ─────────────────

const { findRecipeMock, dbInsert, transactionMock } = vi.hoisted(() => ({
	findRecipeMock: vi.fn(),
	dbInsert: vi.fn().mockReturnValue({
		values: vi.fn().mockReturnValue({
			onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
		}),
	}),
	transactionMock: vi.fn(),
}));

vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			recipes: { findFirst: findRecipeMock },
			tags: { findMany: vi.fn().mockResolvedValue([]) },
		},
		insert: dbInsert,
		transaction: transactionMock,
	},
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Makes a Drizzle-compatible chainable mock.
 * Awaiting the object resolves to `resolved`.
 * Calling .returning() also resolves to `resolved`.
 * Calling .values()/.set()/.from()/.where() returns the same object (chainable).
 */
function chain(resolved: unknown = undefined) {
	const p = Promise.resolve(resolved);
	const c: Record<string, unknown> = {
		then: p.then.bind(p),
		catch: p.catch.bind(p),
		finally: p.finally.bind(p),
		onConflictDoNothing: vi.fn().mockReturnValue(Promise.resolve()),
		returning: vi.fn().mockReturnValue(p),
	};
	for (const m of ['values', 'set', 'from', 'where']) {
		c[m] = vi.fn().mockReturnValue(c);
	}
	return c as Record<string, ReturnType<typeof vi.fn>>;
}

/** Creates a fresh drizzle-compatible tx mock for each test. */
function makeTx(opts: { maxVer?: number; insertedRows?: unknown[] } = {}) {
	const insertChain = chain(opts.insertedRows ?? []);
	const updateChain = chain();
	const deleteChain = chain();
	const selectChain = chain([{ maxVer: opts.maxVer ?? 0 }]);

	return {
		insert: vi.fn().mockReturnValue(insertChain),
		update: vi.fn().mockReturnValue(updateChain),
		delete: vi.fn().mockReturnValue(deleteChain),
		select: vi.fn().mockReturnValue(selectChain),
		query: { tags: { findMany: vi.fn().mockResolvedValue([]) } },
		// Exposed for assertions
		insertChain,
		updateChain,
		deleteChain,
		selectChain,
	};
}

/** Calls a SvelteKit action and returns whatever it throws (or returns). */
async function invoke(action: (...args: unknown[]) => unknown, event: unknown): Promise<Record<string, unknown>> {
	return (action(event as never) as Promise<unknown>).catch((e: unknown) => e) as Promise<Record<string, unknown>>;
}

/** Builds a minimal SvelteKit RequestEvent-like object. */
function makeEvent(opts: {
	params?: Record<string, string>;
	fields?: Record<string, string | string[]>;
	user?: { id: string; email: string } | null;
}) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(opts.fields ?? {})) {
		if (Array.isArray(v)) v.forEach((val) => fd.append(k, val));
		else fd.append(k, v);
	}
	return {
		params: opts.params ?? { slug: 'test-slug' },
		request: { formData: vi.fn().mockResolvedValue(fd) },
		locals: { user: opts.user ?? null },
	};
}

const OWNER = { id: 'owner-123', email: 'owner@test.com' };
const OTHER = { id: 'other-456', email: 'other@test.com' };
const RECIPE = { id: 1, authorId: 'owner-123', slug: 'test-slug' };

const VALID_INGREDIENTS = JSON.stringify([{ amount: '2', unit: 'cups', name: 'flour' }]);
const VALID_STEPS = JSON.stringify([{ step: 1, text: 'Mix everything.' }]);

// ─── saveMeta ─────────────────────────────────────────────────────────────────

describe('saveMeta', () => {
	beforeEach(() => vi.clearAllMocks());

	test('throws 401 when not logged in', async () => {
		const result = await invoke(actions.saveMeta as never, makeEvent({ user: null }));
		expect(result.status).toBe(401);
	});

	test('throws 404 when recipe is not found', async () => {
		findRecipeMock.mockResolvedValue(null);
		const result = await invoke(actions.saveMeta as never, makeEvent({ user: OWNER }));
		expect(result.status).toBe(404);
	});

	test('throws 403 when user does not own recipe', async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const result = await invoke(actions.saveMeta as never, makeEvent({ user: OTHER }));
		expect(result.status).toBe(403);
	});

	test('throws 400 when title is missing', async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const result = await invoke(
			actions.saveMeta as never,
			makeEvent({ user: OWNER, fields: { title: '   ' } })
		);
		expect(result.status).toBe(400);
	});

	test('redirects to recipe page on success', async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const tx = makeTx();
		transactionMock.mockImplementationOnce(async (cb: Function) => cb(tx));

		const result = await invoke(
			actions.saveMeta as never,
			makeEvent({ user: OWNER, params: { slug: 'test-slug' }, fields: { title: 'New Title', isPublic: 'on' } })
		);

		expect(result.status).toBe(303);
		expect(result.location).toBe('/recipes/test-slug');
	});

	test('calls tx.update with the submitted fields', async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const tx = makeTx();
		transactionMock.mockImplementationOnce(async (cb: Function) => cb(tx));

		await invoke(
			actions.saveMeta as never,
			makeEvent({
				user: OWNER,
				fields: {
					title: 'Banana Bread',
					description: 'Moist and delicious',
					servings: '8',
					isPublic: 'on',
				},
			})
		);

		expect(tx.update).toHaveBeenCalled();
		// .set() is called on the chain returned by .update()
		const setCall = tx.updateChain.set.mock.calls[0][0];
		expect(setCall).toMatchObject({ title: 'Banana Bread', description: 'Moist and delicious', servings: 8 });
	});

	test('calls tx.delete to clear old tags before re-inserting', async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const tx = makeTx();
		transactionMock.mockImplementationOnce(async (cb: Function) => cb(tx));

		await invoke(
			actions.saveMeta as never,
			makeEvent({ user: OWNER, fields: { title: 'Any Title', isPublic: 'on' } })
		);

		expect(tx.delete).toHaveBeenCalled();
	});
});

// ─── saveVersion ──────────────────────────────────────────────────────────────

describe('saveVersion', () => {
	beforeEach(() => vi.clearAllMocks());

	test('throws 401 when not logged in', async () => {
		const result = await invoke(actions.saveVersion as never, makeEvent({ user: null }));
		expect(result.status).toBe(401);
	});

	test('throws 404 when recipe is not found', async () => {
		findRecipeMock.mockResolvedValue(null);
		const result = await invoke(actions.saveVersion as never, makeEvent({ user: OWNER }));
		expect(result.status).toBe(404);
	});

	test('throws 403 when user does not own recipe', async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const result = await invoke(actions.saveVersion as never, makeEvent({ user: OTHER }));
		expect(result.status).toBe(403);
	});

	test('throws 400 when commit message is empty', async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const result = await invoke(
			actions.saveVersion as never,
			makeEvent({
				user: OWNER,
				fields: { commitMessage: '  ', ingredients: VALID_INGREDIENTS, steps: VALID_STEPS },
			})
		);
		expect(result.status).toBe(400);
	});

	test('throws 400 when ingredients JSON is invalid', async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const result = await invoke(
			actions.saveVersion as never,
			makeEvent({
				user: OWNER,
				fields: { commitMessage: 'fix', ingredients: 'not-json', steps: VALID_STEPS },
			})
		);
		expect(result.status).toBe(400);
	});

	test('throws 400 when ingredients array is empty', async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const result = await invoke(
			actions.saveVersion as never,
			makeEvent({
				user: OWNER,
				fields: { commitMessage: 'fix', ingredients: '[]', steps: VALID_STEPS },
			})
		);
		expect(result.status).toBe(400);
	});

	test('throws 400 when steps array is empty', async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const result = await invoke(
			actions.saveVersion as never,
			makeEvent({
				user: OWNER,
				fields: { commitMessage: 'fix', ingredients: VALID_INGREDIENTS, steps: '[]' },
			})
		);
		expect(result.status).toBe(400);
	});

	test('redirects to recipe page on success', async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const tx = makeTx({ maxVer: 1 });
		transactionMock.mockImplementationOnce(async (cb: Function) => cb(tx));

		const result = await invoke(
			actions.saveVersion as never,
			makeEvent({
				user: OWNER,
				params: { slug: 'test-slug' },
				fields: { commitMessage: 'Add cream', ingredients: VALID_INGREDIENTS, steps: VALID_STEPS },
			})
		);

		expect(result.status).toBe(303);
		expect(result.location).toBe('/recipes/test-slug');
	});

	test('inserts a new version with versionNumber = maxVer + 1', async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const tx = makeTx({ maxVer: 2 }); // existing max is 2 → next should be 3
		transactionMock.mockImplementationOnce(async (cb: Function) => cb(tx));

		await invoke(
			actions.saveVersion as never,
			makeEvent({
				user: OWNER,
				fields: { commitMessage: 'Adjust spices', ingredients: VALID_INGREDIENTS, steps: VALID_STEPS },
			})
		);

		const inserted = tx.insertChain.values.mock.calls[0][0];
		expect(inserted.versionNumber).toBe(3);
		expect(inserted.commitMessage).toBe('Adjust spices');
		expect(inserted.recipeId).toBe(RECIPE.id);
		expect(inserted.createdBy).toBe(OWNER.id);
	});

	test('normalizes step numbers to be sequential', async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const tx = makeTx({ maxVer: 0 });
		transactionMock.mockImplementationOnce(async (cb: Function) => cb(tx));

		const messedUpSteps = JSON.stringify([
			{ step: 5, text: 'First' },
			{ step: 10, text: 'Second' },
		]);

		await invoke(
			actions.saveVersion as never,
			makeEvent({
				user: OWNER,
				fields: { commitMessage: 'fix steps', ingredients: VALID_INGREDIENTS, steps: messedUpSteps },
			})
		);

		const inserted = tx.insertChain.values.mock.calls[0][0];
		expect(inserted.steps[0].step).toBe(1);
		expect(inserted.steps[1].step).toBe(2);
	});
});
