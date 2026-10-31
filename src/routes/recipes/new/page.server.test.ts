import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { actions, load } from './+page.server';
import { invokeAction, formEvent } from '#lib/testing/actions.js';

const invoke = (event: unknown) => invokeAction(actions.default as never, event);

const { transactionMock, uploadMock, removeMock, syncTagsMock, ensureProfileMock } = vi.hoisted(
	() => ({
		transactionMock: vi.fn(),
		uploadMock: vi.fn(),
		removeMock: vi.fn().mockResolvedValue(undefined),
		syncTagsMock: vi.fn().mockResolvedValue(undefined),
		ensureProfileMock: vi.fn().mockResolvedValue(undefined)
	})
);

vi.mock('#lib/server/db/index.js', () => ({ db: { transaction: transactionMock } }));
vi.mock('#lib/server/images.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/images.js')>()),
	uploadRecipeImage: uploadMock,
	removeRecipeImage: removeMock
}));
vi.mock('#lib/server/tags.js', () => ({ syncTags: syncTagsMock }));
vi.mock('#lib/server/profiles.js', () => ({ ensureProfile: ensureProfileMock }));

/** A tx whose first insert is the recipe (returns id 42) and second is the version. */
function makeTx() {
	const recipeInsert = chain([{ id: 42 }]);
	const versionInsert = chain();
	const insert = vi.fn().mockReturnValueOnce(recipeInsert).mockReturnValueOnce(versionInsert);
	return { insert, recipeInsert, versionInsert };
}

const USER = { id: 'user-1', email: 'u@test.com' };
const SUPABASE = { storage: {} };

const FULL = {
	title: 'Soup',
	description: 'Warm.',
	servings: '4',
	prepTimeMinutes: '10',
	cookTimeMinutes: '20',
	ingredients: '1 cup flour\n2 eggs',
	steps: 'Mix.\n\nBake.',
	isPublic: 'on',
	tags: ['Dessert', 'Baking']
};

const makeEvent = (opts: {
	fields?: Record<string, string | string[]>;
	file?: File;
	user?: typeof USER | null;
}) =>
	formEvent({
		...opts,
		locals: { user: opts.user === undefined ? USER : opts.user, supabase: SUPABASE }
	});

let tx: ReturnType<typeof makeTx>;

beforeEach(() => {
	vi.clearAllMocks();
	tx = makeTx();
	transactionMock.mockImplementation(async (fn: (t: unknown) => Promise<void>) => fn(tx));
	uploadMock.mockResolvedValue({ url: 'https://cdn/img.png', path: 'user-1/img.png' });
});

describe('new recipe action', () => {
	test('throws 401 when not logged in', async () => {
		const result = await invoke(makeEvent({ fields: FULL, user: null }));
		expect(result.status).toBe(401);
	});

	test('returns 400 with the raw draft when validation fails, and uploads nothing', async () => {
		const result = await invoke(
			makeEvent({
				fields: { ...FULL, title: '', prepTimeMinutes: '-5' },
				file: new File(['x'], 'a.png')
			})
		);
		expect(result.status).toBe(400);
		expect(result.data).toMatchObject({
			error: 'Title is required',
			draft: { title: '', prepTimeMinutes: '-5', tags: ['Dessert', 'Baking'], hadPhoto: true }
		});
		expect(uploadMock).not.toHaveBeenCalled();
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test('inserts the recipe with the six copies equal to version 1, then redirects', async () => {
		const result = await invoke(makeEvent({ fields: FULL }));
		const recipe = tx.recipeInsert.values.mock.calls[0][0];
		const version = tx.versionInsert.values.mock.calls[0][0];
		for (const key of [
			'title',
			'description',
			'servings',
			'prepTimeMinutes',
			'cookTimeMinutes',
			'imageUrl'
		]) {
			expect(recipe[key]).toEqual(version[key]);
		}
		expect(recipe).toMatchObject({
			title: 'Soup',
			servings: 4,
			isPublic: true,
			authorId: 'user-1',
			imageUrl: null
		});
		expect(recipe.slug).toMatch(/^soup-[a-f0-9]{8}$/);
		expect(version).toMatchObject({
			recipeId: 42,
			versionNumber: 1,
			commitMessage: 'Initial recipe',
			createdBy: 'user-1'
		});
		expect(version.ingredients.map((i: { text: string }) => i.text)).toEqual([
			'1 cup flour',
			'2 eggs'
		]);
		expect(syncTagsMock).toHaveBeenCalledWith(tx, 42, ['Dessert', 'Baking']);
		expect(ensureProfileMock).toHaveBeenCalledWith(USER);
		expect(result.status).toBe(303);
		expect(result.location).toBe(`/recipes/${recipe.slug}`);
	});

	test('a profile failure returns the draft before anything is uploaded', async () => {
		ensureProfileMock.mockRejectedValueOnce(new Error('db down'));
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		const result = await invoke(makeEvent({ fields: FULL, file: new File(['x'], 'a.png') }));
		expect(result.status).toBe(500);
		expect(result.data).toMatchObject({ draft: { title: 'Soup' } });
		expect(uploadMock).not.toHaveBeenCalled();
		error.mockRestore();
	});

	test('uploads the photo before the transaction and stores its url', async () => {
		const order: string[] = [];
		uploadMock.mockImplementation(async () => {
			order.push('upload');
			return { url: 'https://cdn/img.png', path: 'user-1/img.png' };
		});
		transactionMock.mockImplementation(async (fn: (t: unknown) => Promise<void>) => {
			order.push('transaction');
			return fn(tx);
		});
		await invoke(
			makeEvent({ fields: FULL, file: new File(['x'], 'a.png', { type: 'image/png' }) })
		);
		expect(order).toEqual(['upload', 'transaction']);
		expect(uploadMock).toHaveBeenCalledWith(SUPABASE, 'user-1', expect.any(File));
		expect(tx.recipeInsert.values.mock.calls[0][0].imageUrl).toBe('https://cdn/img.png');
		expect(tx.versionInsert.values.mock.calls[0][0].imageUrl).toBe('https://cdn/img.png');
	});

	test('a failed upload returns 400 with the draft and writes nothing', async () => {
		uploadMock.mockRejectedValue(new Error('Photo upload failed'));
		const result = await invoke(makeEvent({ fields: FULL, file: new File(['x'], 'a.png') }));
		expect(result.status).toBe(400);
		expect(result.data).toMatchObject({
			error: 'Photo upload failed. Please try again.',
			draft: { title: 'Soup', hadPhoto: true }
		});
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test('a failed transaction removes the new upload and returns the draft', async () => {
		transactionMock.mockRejectedValue(new Error('db down'));
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		const result = await invoke(makeEvent({ fields: FULL, file: new File(['x'], 'a.png') }));
		expect(removeMock).toHaveBeenCalledWith(SUPABASE, 'user-1/img.png');
		expect(result.status).toBe(500);
		expect(result.data).toMatchObject({
			error: 'Could not save the recipe. Please try again.',
			draft: { title: 'Soup' }
		});
		error.mockRestore();
	});
});

describe('new recipe load', () => {
	test('a logged-out visitor is sent to log in and brought back here', async () => {
		const event = { url: new URL('http://x/recipes/new'), locals: { user: null } };
		await expect(Promise.resolve().then(() => load(event as never))).rejects.toMatchObject({
			status: 303,
			location: '/login?redirectTo=%2Frecipes%2Fnew'
		});
	});
});
