import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { actions, load } from './+page.server';
import { invokeAction, formEvent, loadEvent, photoFile } from '#lib/testing/actions.js';
import { loginHref } from '#lib/auth/loginHref.js';
import { SESSION_ENDED } from '#lib/server/actions.js';
import { PHOTO_UPLOAD_FAILED } from '#lib/server/submission.js';
import {
	PHOTO_TYPES,
	PHOTO_MAX_BYTES,
	PHOTO_TYPE_MESSAGE,
	PHOTO_SIZE_MESSAGE,
	REQUIRED_MESSAGES,
	SOURCE_URL_MESSAGES
} from '#lib/recipes/validation.js';
import { OVERNIGHT_MINUTES } from '#lib/recipes/times.js';

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
const PNG = () => photoFile('a.png');
const SUPABASE = { storage: {} };

const FULL = {
	title: 'Soup',
	description: 'Warm.',
	servings: '4',
	prepTimeMinutes: '10',
	cookTimeMinutes: '20',
	ingredients: '1 cup flour\n2 eggs',
	steps: 'Mix.\n\nBake.',
	visibility: 'friends',
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
	test('a lapsed session returns 401 with the draft, so nothing typed is lost', async () => {
		const result = await invoke(makeEvent({ fields: FULL, user: null }));
		expect(result.status).toBe(401);
		expect(result.data).toMatchObject({
			error: SESSION_ENDED('save again'),
			code: 'unauthenticated',
			draft: { title: 'Soup', tags: ['Dessert', 'Baking'] }
		});
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test('returns 400 with the raw draft when validation fails, and uploads nothing', async () => {
		const result = await invoke(
			makeEvent({
				fields: { ...FULL, title: '', prepTimeMinutes: '-5' },
				file: PNG()
			})
		);
		expect(result.status).toBe(400);
		expect(result.data).toMatchObject({
			error: REQUIRED_MESSAGES.title,
			code: 'invalid',
			draft: { title: '', prepTimeMinutes: '-5', tags: ['Dessert', 'Baking'], hadPhoto: true }
		});
		expect(uploadMock).not.toHaveBeenCalled();
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test('a recipe sent with no visibility is private', async () => {
		const fields: Record<string, string | string[]> = { ...FULL };
		delete fields.visibility;
		await invoke(makeEvent({ fields }));
		expect(tx.recipeInsert.values.mock.calls[0][0].visibility).toBe('private');
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
			visibility: 'friends',
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

	test('stores the yield and the groups on version 1, and no yield on the recipe row', async () => {
		await invoke(
			makeEvent({
				fields: {
					...FULL,
					makes: '12 buns',
					ingredients: '# Dough\n1 cup flour',
					steps: '# Bake\nBake.'
				}
			})
		);
		const recipe = tx.recipeInsert.values.mock.calls[0][0];
		const version = tx.versionInsert.values.mock.calls[0][0];
		expect(version.makes).toBe('12 buns');
		expect(version.servings).toBe(4);
		expect(version.ingredients[0].group).toBe('Dough');
		expect(version.steps[0].group).toBe('Bake');
		expect(recipe).not.toHaveProperty('makes');
	});

	test('stores the source, the times as minutes and the notes on version 1 only', async () => {
		await invoke(
			makeEvent({
				fields: {
					...FULL,
					prepTimeMinutes: '1 h 30',
					restTimeMinutes: 'overnight',
					sourceName: 'Gran',
					sourceUrl: 'gran.example/soup',
					notes: 'Season late.',
					reheating: 'Gently'
				}
			})
		);
		const recipe = tx.recipeInsert.values.mock.calls[0][0];
		const version = tx.versionInsert.values.mock.calls[0][0];
		expect(version).toMatchObject({
			prepTimeMinutes: 90,
			restTimeMinutes: OVERNIGHT_MINUTES,
			sourceName: 'Gran',
			sourceUrl: 'https://gran.example/soup',
			notes: 'Season late.',
			reheating: 'Gently',
			storage: null
		});
		expect(recipe.prepTimeMinutes).toBe(90);
		for (const key of ['restTimeMinutes', 'sourceName', 'sourceUrl', 'notes', 'reheating'])
			expect(recipe).not.toHaveProperty(key);
	});

	test('a source link that is not http or https is refused, and nothing is written', async () => {
		const result = await invoke(
			makeEvent({ fields: { ...FULL, sourceUrl: 'javascript:alert(1)' } })
		);
		expect(result.status).toBe(400);
		expect(result.data).toMatchObject({ code: 'invalid', error: SOURCE_URL_MESSAGES.invalid });
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test('an empty group is refused with the draft, and nothing is written', async () => {
		const result = await invoke(
			makeEvent({ fields: { ...FULL, ingredients: '# Dough\nflour\n# Filling' } })
		);
		expect(result.status).toBe(400);
		expect(result.data).toMatchObject({
			code: 'invalid',
			error: '“Filling” has no ingredients. Add some under it or delete the heading.'
		});
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test('a profile failure returns the draft before anything is uploaded', async () => {
		ensureProfileMock.mockRejectedValueOnce(new Error('db down'));
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		const result = await invoke(makeEvent({ fields: FULL, file: PNG() }));
		expect(result.status).toBe(500);
		expect(result.data).toMatchObject({ code: 'save_failed', draft: { title: 'Soup' } });
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
		await invoke(makeEvent({ fields: FULL, file: PNG() }));
		expect(order).toEqual(['upload', 'transaction']);
		expect(uploadMock).toHaveBeenCalledWith(SUPABASE, 'user-1', expect.any(File), 'image/png');
		expect(tx.recipeInsert.values.mock.calls[0][0].imageUrl).toBe('https://cdn/img.png');
		expect(tx.versionInsert.values.mock.calls[0][0].imageUrl).toBe('https://cdn/img.png');
	});

	test('a failed upload returns 400 with the draft and writes nothing', async () => {
		uploadMock.mockRejectedValue(new Error('Photo upload failed'));
		const result = await invoke(makeEvent({ fields: FULL, file: PNG() }));
		expect(result.status).toBe(400);
		expect(result.data).toMatchObject({
			error: PHOTO_UPLOAD_FAILED,
			code: 'upload_failed',
			draft: { title: 'Soup', hadPhoto: true }
		});
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test('a photo of a type the editor does not offer is refused with the draft, and nothing is stored', async () => {
		const result = await invoke(
			makeEvent({ fields: FULL, file: new File(['x'], 'a.svg', { type: 'image/svg+xml' }) })
		);
		expect(result.status).toBe(400);
		expect(result.data).toMatchObject({
			error: PHOTO_TYPE_MESSAGE,
			code: 'invalid',
			draft: { title: 'Soup', hadPhoto: true }
		});
		expect(uploadMock).not.toHaveBeenCalled();
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test('a photo over the size cap is refused with the draft; one at the cap is stored', async () => {
		const sized = (bytes: number) =>
			photoFile('big.jpg', PHOTO_TYPES[0], bytes);
		const over = await invoke(makeEvent({ fields: FULL, file: sized(PHOTO_MAX_BYTES + 1) }));
		expect(over.status).toBe(400);
		expect(over.data).toMatchObject({
			error: PHOTO_SIZE_MESSAGE,
			code: 'invalid',
			draft: { title: 'Soup' }
		});
		expect(uploadMock).not.toHaveBeenCalled();
		const at = await invoke(makeEvent({ fields: FULL, file: sized(PHOTO_MAX_BYTES) }));
		expect(at.status).toBe(303);
		expect(uploadMock).toHaveBeenCalledOnce();
	});

	test('a failed transaction removes the new upload and returns the draft', async () => {
		transactionMock.mockRejectedValue(new Error('db down'));
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		const result = await invoke(makeEvent({ fields: FULL, file: PNG() }));
		expect(removeMock).toHaveBeenCalledWith(SUPABASE, 'user-1/img.png');
		expect(result.status).toBe(500);
		expect(result.data).toMatchObject({
			error: 'Could not save the recipe. Try again.',
			code: 'save_failed',
			draft: { title: 'Soup' }
		});
		error.mockRestore();
	});
});

describe('new recipe load', () => {
	test('a logged-out visitor is sent to log in and brought back here', async () => {
		const path = '/recipes/new?from=nav';
		await expect(Promise.resolve().then(() => load(loadEvent({ path })))).rejects.toMatchObject({
			status: 303,
			location: loginHref(path)
		});
	});
});
