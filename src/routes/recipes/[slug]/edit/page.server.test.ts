import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { invokeAction as invoke, formEvent } from '#lib/testing/actions.js';
import { actions, load } from './+page.server';
import { makeContent, makeIngredient, makeStep } from '#lib/recipes/fixtures.js';
import { WIDENS_PARENT } from '#lib/server/visibility.js';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { recipes } from '#lib/server/db/schema.js';

// ─── Hoisted mocks (must be available inside vi.mock factory) ─────────────────

const {
	findRecipeMock,
	dbInsert,
	dbSelectDistinct,
	transactionMock,
	uploadMock,
	removeMock,
	syncTagsMock,
	countMock
} = vi.hoisted(() => ({
	countMock: vi.fn(),
	findRecipeMock: vi.fn(),
	dbSelectDistinct: vi.fn(),
	dbInsert: vi.fn().mockReturnValue({
		values: vi.fn().mockReturnValue({
			onConflictDoNothing: vi.fn().mockResolvedValue(undefined)
		})
	}),
	transactionMock: vi.fn(),
	uploadMock: vi.fn(),
	removeMock: vi.fn().mockResolvedValue(undefined),
	syncTagsMock: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('#lib/server/images.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/images.js')>()),
	uploadRecipeImage: uploadMock,
	removeRecipeImage: removeMock
}));
vi.mock('#lib/server/tags.js', () => ({
	syncTags: syncTagsMock,
	listTags: vi.fn().mockResolvedValue([])
}));

vi.mock('#lib/server/db/index.js', () => ({
	db: {
		query: {
			recipes: { findFirst: findRecipeMock },
			tags: { findMany: vi.fn().mockResolvedValue([]) }
		},
		insert: dbInsert,
		selectDistinct: dbSelectDistinct,
		transaction: transactionMock,
		$count: countMock
	}
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * A fresh drizzle-compatible tx mock. `select().from().where().for('update')`
 * resolves the locked recipe rows in order, one per call, so a test can make
 * the second save see a bumped revision. `query.recipeVersions.findFirst`
 * resolves the latest version.
 */
function makeTx(opts: { locked?: unknown[]; latest?: unknown } = {}) {
	const insertChain = chain();
	const updateChain = chain();
	const deleteChain = chain();
	const selectChain = chain();
	const lockFor = vi.fn();
	for (const row of opts.locked ?? [LOCKED]) lockFor.mockResolvedValueOnce([row]);
	selectChain.for = lockFor;
	const findLatest = vi.fn().mockResolvedValue(opts.latest === undefined ? LATEST : opts.latest);

	return {
		insert: vi.fn().mockReturnValue(insertChain),
		update: vi.fn().mockReturnValue(updateChain),
		delete: vi.fn().mockReturnValue(deleteChain),
		select: vi.fn().mockReturnValue(selectChain),
		query: { recipeVersions: { findFirst: findLatest } },
		// Exposed for assertions
		insertChain,
		updateChain,
		deleteChain,
		selectChain,
		lockFor,
		findLatest
	};
}

/** Builds a minimal SvelteKit RequestEvent-like object. */
const makeEvent = (opts: {
	params?: Record<string, string>;
	fields?: Record<string, string | string[]>;
	file?: File;
	user?: { id: string; email: string } | null;
}) =>
	formEvent({
		...opts,
		params: opts.params ?? { slug: 'test-slug' },
		locals: { user: opts.user ?? null, supabase: SUPABASE }
	});

const OWNER = { id: 'owner-123', email: 'owner@test.com' };
const OTHER = { id: 'other-456', email: 'other@test.com' };
const RECIPE = {
	id: 1,
	authorId: 'owner-123',
	slug: 'test-slug',
	imageUrl: 'https://cdn/old.png',
	visibility: 'public',
	editRevision: 0,
	parent: null,
	recipesToTags: [{ tag: { name: 'Dessert' } }, { tag: { name: 'Baking' } }]
};
/** The row as read under FOR UPDATE. */
const LOCKED = {
	id: 1,
	authorId: 'owner-123',
	imageUrl: 'https://cdn/old.png',
	visibility: 'public',
	editRevision: 0
};
const LATEST = {
	id: 10,
	versionNumber: 2,
	commitMessage: 'Initial recipe',
	...makeContent({
		title: 'Cookies',
		description: null,
		servings: 4,
		prepTimeMinutes: 10,
		cookTimeMinutes: 20,
		imageUrl: 'https://cdn/old.png',
		ingredients: [makeIngredient('2 cups flour')],
		steps: [makeStep('Mix everything.')]
	})
};
const SUPABASE = { storage: {} };

/** A submission identical to LATEST and RECIPE, so nothing has changed. */
const UNCHANGED = {
	title: 'Cookies',
	description: '',
	servings: '4',
	prepTimeMinutes: '10',
	cookTimeMinutes: '20',
	ingredients: '2 cups flour',
	steps: 'Mix everything.',
	visibility: 'public',
	tags: ['Dessert', 'Baking'],
	editRevision: '0'
};

const STALE =
	'This recipe was changed in another tab. Reload to see the latest version, then reapply your edits.';

// ─── save ─────────────────────────────────────────────────────────────────────

describe('save', () => {
	let tx: ReturnType<typeof makeTx>;

	beforeEach(() => {
		vi.clearAllMocks();
		findRecipeMock.mockResolvedValue(RECIPE);
		tx = makeTx();
		transactionMock.mockImplementation(async (cb: (t: unknown) => Promise<unknown>) => cb(tx));
		uploadMock.mockResolvedValue({ url: 'https://cdn/new.png', path: 'owner-123/new.png' });
	});

	const save = (
		fields: Record<string, string | string[]>,
		extra: { file?: File; user?: typeof OWNER | null } = {}
	) =>
		invoke(
			actions.save as never,
			makeEvent({ user: extra.user === undefined ? OWNER : extra.user, fields, file: extra.file })
		);

	const versionInserts = () => tx.insertChain.values.mock.calls.map((c) => c[0]);
	const noWrites = () => {
		expect(tx.insert).not.toHaveBeenCalled();
		expect(tx.update).not.toHaveBeenCalled();
		expect(syncTagsMock).not.toHaveBeenCalled();
	};

	test('a lapsed session returns 401 with the draft, so nothing typed is lost', async () => {
		const result = await save({ ...UNCHANGED, servings: '8' }, { user: null });
		expect(result.status).toBe(401);
		expect(result.data).toMatchObject({
			error: 'Your session ended. Log in in another tab, then save again.',
			code: 'unauthenticated',
			draft: { servings: '8' }
		});
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test('throws 404 when recipe is not found', async () => {
		findRecipeMock.mockResolvedValue(null);
		expect((await save(UNCHANGED)).status).toBe(404);
	});

	test('throws 403 when user does not own recipe', async () => {
		expect((await save(UNCHANGED, { user: OTHER })).status).toBe(403);
	});

	test('returns 400 with the raw draft when validation fails, and uploads nothing', async () => {
		const result = await save(
			{ ...UNCHANGED, title: '', prepTimeMinutes: '-5' },
			{ file: new File(['x'], 'a.png', { type: 'image/png' }) }
		);
		expect(result.status).toBe(400);
		expect(result.data).toMatchObject({
			error: 'Title is required',
			code: 'invalid',
			draft: { title: '', prepTimeMinutes: '-5', editRevision: '0', hadPhoto: true }
		});
		expect(uploadMock).not.toHaveBeenCalled();
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test('returns 400 when editRevision is not an integer', async () => {
		for (const editRevision of ['', 'abc', '1.5']) {
			const result = await save({ ...UNCHANGED, editRevision });
			expect(result.status).toBe(400);
			expect(result.data).toMatchObject({ code: 'invalid' });
		}
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test('locks the recipe row before reading the latest version', async () => {
		await save({ ...UNCHANGED, servings: '8' });
		expect(tx.lockFor).toHaveBeenCalledWith('update');
		expect(tx.lockFor.mock.invocationCallOrder[0]).toBeLessThan(
			tx.findLatest.mock.invocationCallOrder[0]
		);
	});

	test('returns 409 with the draft carrying its original editRevision when the locked row moved on, and writes nothing', async () => {
		tx = makeTx({ locked: [{ ...LOCKED, editRevision: 1 }] });
		const result = await save({ ...UNCHANGED, servings: '8' });
		expect(result.status).toBe(409);
		expect(result.data).toMatchObject({
			error: STALE,
			code: 'stale',
			draft: { servings: '8', editRevision: '0' }
		});
		expect(tx.findLatest).not.toHaveBeenCalled();
		noWrites();
	});

	test('a tab already stale on the loaded row is refused before it uploads anything', async () => {
		findRecipeMock.mockResolvedValue({ ...RECIPE, editRevision: 2 });
		const result = await save(
			{ ...UNCHANGED, servings: '8' },
			{ file: new File(['x'], 'a.png', { type: 'image/png' }) }
		);
		expect(result.status).toBe(409);
		expect(result.data).toMatchObject({ code: 'stale' });
		expect(uploadMock).not.toHaveBeenCalled();
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test('losing ownership between load and lock is a 403, and a new upload is removed', async () => {
		tx = makeTx({ locked: [{ ...LOCKED, authorId: 'someone-else' }] });
		const result = await save(UNCHANGED, { file: new File(['x'], 'a.png', { type: 'image/png' }) });
		expect(result.status).toBe(403);
		expect(removeMock).toHaveBeenCalledWith(SUPABASE, 'owner-123/new.png');
		expect(tx.insert).not.toHaveBeenCalled();
	});

	test('two submissions with the same revision give one success and one 409, never two versions', async () => {
		tx = makeTx({ locked: [LOCKED, { ...LOCKED, editRevision: 1 }] });
		const first = await save({ ...UNCHANGED, servings: '8' });
		const second = await save({ ...UNCHANGED, servings: '6' });
		expect(first.status).toBe(303);
		expect(second.status).toBe(409);
		expect(versionInserts()).toHaveLength(1);
	});

	test('writes nothing when nothing changed, not even updatedAt, and redirects', async () => {
		const result = await save(UNCHANGED);
		expect(result.status).toBe(303);
		expect(result.location).toBe('/recipes/test-slug');
		noWrites();
	});

	test('a message alone writes a version carrying it and the latest content, and bumps editRevision', async () => {
		const result = await save({ ...UNCHANGED, commitMessage: ' Just a note ' });
		expect(result.status).toBe(303);
		const [version] = versionInserts();
		expect(versionInserts()).toHaveLength(1);
		expect(version).toMatchObject({
			recipeId: 1,
			versionNumber: 3,
			commitMessage: 'Just a note',
			title: 'Cookies',
			imageUrl: 'https://cdn/old.png',
			createdBy: 'owner-123'
		});
		expect(version.steps).toEqual(LATEST.steps);
		expect(syncTagsMock).not.toHaveBeenCalled();
		expect(tx.update).toHaveBeenCalledTimes(1);
		expect(tx.updateChain.set.mock.calls[0][0]).not.toHaveProperty('visibility');
	});

	test('a whitespace-only message is no message: nothing is written', async () => {
		await save({ ...UNCHANGED, commitMessage: '   ' });
		noWrites();
	});

	test('a reordered or re-cased tag list is not a settings change', async () => {
		await save({ ...UNCHANGED, tags: ['baking', 'DESSERT'] });
		noWrites();
	});

	test('removeImage with no stored image is not a change', async () => {
		tx = makeTx({ latest: { ...LATEST, imageUrl: null } });
		await save({ ...UNCHANGED, removeImage: 'on' });
		noWrites();
	});

	test('settings only: updates visibility and tags, bumps editRevision, inserts no version', async () => {
		await save({ ...UNCHANGED, visibility: 'private', tags: ['Dessert'] });
		expect(tx.insert).not.toHaveBeenCalled();
		expect(syncTagsMock).toHaveBeenCalledWith(tx, 1, ['Dessert']);
		expect(tx.update).toHaveBeenCalledTimes(1);
		const set = tx.updateChain.set.mock.calls[0][0];
		expect(set).toMatchObject({
			visibility: 'private',
			editRevision: expect.anything(),
			updatedAt: expect.any(Date)
		});
		expect(set).not.toHaveProperty('title');
	});

	test('a typed message on a settings-only save is kept: a version carrying it and the latest content', async () => {
		await save({
			...UNCHANGED,
			visibility: 'private',
			tags: ['Dessert'],
			commitMessage: ' Private for now '
		});
		const [version] = versionInserts();
		expect(versionInserts()).toHaveLength(1);
		expect(version).toMatchObject({
			recipeId: 1,
			versionNumber: 3,
			commitMessage: 'Private for now',
			title: 'Cookies',
			servings: 4,
			imageUrl: 'https://cdn/old.png',
			createdBy: 'owner-123'
		});
		expect(version.steps).toEqual(LATEST.steps);
		expect(syncTagsMock).toHaveBeenCalledWith(tx, 1, ['Dessert']);
		expect(tx.update).toHaveBeenCalledTimes(1);
		expect(tx.updateChain.set.mock.calls[0][0]).toMatchObject({ visibility: 'private' });
	});

	test('removeImage is a content change: a version without the photo, and the copy cleared', async () => {
		await save({ ...UNCHANGED, removeImage: 'on' });
		expect(versionInserts()[0]).toMatchObject({ imageUrl: null, versionNumber: 3 });
		expect(versionInserts()[0].commitMessage).toBe('Updated photo');
		expect(tx.updateChain.set.mock.calls[0][0]).toMatchObject({ imageUrl: null });
		expect(removeMock).not.toHaveBeenCalled();
	});

	test('content changed: inserts the next version with the submitted content and message, and updates all six copies and editRevision in one update', async () => {
		const result = await save({
			...UNCHANGED,
			servings: '8',
			ingredients: '4 cups flour',
			commitMessage: 'Doubled'
		});
		expect(result.status).toBe(303);
		const [version] = versionInserts();
		expect(version).toMatchObject({
			recipeId: 1,
			versionNumber: 3,
			commitMessage: 'Doubled',
			title: 'Cookies',
			servings: 8,
			createdBy: 'owner-123'
		});
		expect(version.ingredients.map((i: { text: string }) => i.text)).toEqual(['4 cups flour']);
		expect(tx.update).toHaveBeenCalledTimes(1);
		expect(tx.updateChain.set.mock.calls[0][0]).toMatchObject({
			title: 'Cookies',
			description: null,
			servings: 8,
			prepTimeMinutes: 10,
			cookTimeMinutes: 20,
			imageUrl: 'https://cdn/old.png',
			editRevision: expect.anything(),
			updatedAt: expect.any(Date)
		});
		expect(syncTagsMock).not.toHaveBeenCalled();
	});

	test('a yield and a group heading save as a version carrying both; the recipe row keeps no yield', async () => {
		await save({
			...UNCHANGED,
			makes: ' 24 cookies ',
			ingredients: '# Dough\n2 cups flour',
			steps: '# Mix\nMix everything.'
		});
		const [version] = versionInserts();
		expect(version.makes).toBe('24 cookies');
		expect(version.servings).toBe(4);
		expect(version.ingredients[0].group).toBe('Dough');
		expect(version.steps[0].group).toBe('Mix');
		expect(version.commitMessage).toBe('Updated yield, ingredients, steps');
		expect(tx.updateChain.set.mock.calls[0][0]).not.toHaveProperty('makes');
	});

	test('a yield cleared to blank is a change to null', async () => {
		tx = makeTx({ latest: { ...LATEST, makes: '24 cookies' } });
		await save({ ...UNCHANGED, makes: '  ' });
		expect(versionInserts()[0]).toMatchObject({ makes: null, commitMessage: 'Updated yield' });
	});

	test('uses the generated message when the field is blank', async () => {
		await save({ ...UNCHANGED, servings: '8', ingredients: '4 cups flour', commitMessage: '  ' });
		expect(versionInserts()[0].commitMessage).toBe('Updated servings, ingredients');
	});

	test('content and settings together: one version, one update', async () => {
		await save({ ...UNCHANGED, title: 'Biscuits', visibility: 'private' });
		expect(versionInserts()).toHaveLength(1);
		expect(tx.update).toHaveBeenCalledTimes(1);
		expect(tx.updateChain.set.mock.calls[0][0]).toMatchObject({
			title: 'Biscuits',
			visibility: 'private'
		});
	});

	describe('a fork never widens access', () => {
		const forkOf = (parent: 'private' | 'friends', visibility = 'private') => ({
			...RECIPE,
			visibility,
			parent: { visibility: parent }
		});

		test.each([
			['friends', 'public'],
			['private', 'friends'],
			['private', 'public']
		] as const)(
			'a fork of a %s recipe set to %s is refused with the draft, before any upload or write',
			async (parent, visibility) => {
				findRecipeMock.mockResolvedValue(forkOf(parent));
				const result = await save({ ...UNCHANGED, visibility }, { file: new File(['x'], 'a.png') });
				expect(result.status).toBe(400);
				expect(result.data).toMatchObject({
					error: WIDENS_PARENT[parent],
					code: 'invalid',
					draft: { visibility }
				});
				expect(uploadMock).not.toHaveBeenCalled();
				expect(transactionMock).not.toHaveBeenCalled();
			}
		);

		test('a fork of a friends recipe may be shared with friends', async () => {
			findRecipeMock.mockResolvedValue(forkOf('friends'));
			await save({ ...UNCHANGED, visibility: 'friends' });
			expect(tx.updateChain.set.mock.calls[0][0]).toMatchObject({ visibility: 'friends' });
		});

		test('a fork left as wide as it was still saves after its parent narrowed', async () => {
			findRecipeMock.mockResolvedValue(forkOf('private', 'public'));
			tx = makeTx({ locked: [{ ...LOCKED, visibility: 'public' }] });
			await save({ ...UNCHANGED, title: 'Biscuits' });
			expect(versionInserts()).toHaveLength(1);
		});
	});

	test('a new photo is a content change, uploaded before the transaction', async () => {
		const order: string[] = [];
		uploadMock.mockImplementation(async () => {
			order.push('upload');
			return { url: 'https://cdn/new.png', path: 'owner-123/new.png' };
		});
		transactionMock.mockImplementation(async (cb: (t: unknown) => Promise<unknown>) => {
			order.push('transaction');
			return cb(tx);
		});
		await save(UNCHANGED, { file: new File(['x'], 'a.png', { type: 'image/png' }) });
		expect(order).toEqual(['upload', 'transaction']);
		expect(uploadMock).toHaveBeenCalledWith(SUPABASE, 'owner-123', expect.any(File));
		expect(tx.updateChain.set.mock.calls[0][0]).toMatchObject({ imageUrl: 'https://cdn/new.png' });
		expect(versionInserts()[0]).toMatchObject({
			imageUrl: 'https://cdn/new.png',
			title: 'Cookies'
		});
	});

	test('a failed upload returns 400 with the draft and writes nothing', async () => {
		uploadMock.mockRejectedValue(new Error('Photo upload failed'));
		const result = await save(UNCHANGED, { file: new File(['x'], 'a.png', { type: 'image/png' }) });
		expect(result.status).toBe(400);
		expect(result.data).toMatchObject({
			error: 'Photo upload failed. Try again.',
			code: 'upload_failed',
			draft: { hadPhoto: true }
		});
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test('an upload that succeeds before a 409 is removed, and the stored image is untouched', async () => {
		tx = makeTx({ locked: [{ ...LOCKED, editRevision: 1 }] });
		const result = await save(UNCHANGED, { file: new File(['x'], 'a.png', { type: 'image/png' }) });
		expect(result.status).toBe(409);
		expect(removeMock).toHaveBeenCalledWith(SUPABASE, 'owner-123/new.png');
		noWrites();
	});

	test('a throw inside the transaction removes the new upload and returns 500 with the draft', async () => {
		transactionMock.mockRejectedValue(new Error('db down'));
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		const result = await save(
			{ ...UNCHANGED, servings: '8' },
			{ file: new File(['x'], 'a.png', { type: 'image/png' }) }
		);
		expect(result.status).toBe(500);
		expect(result.data).toMatchObject({
			error: 'Could not save the recipe. Try again.',
			code: 'save_failed',
			draft: { servings: '8' }
		});
		expect(removeMock).toHaveBeenCalledWith(SUPABASE, 'owner-123/new.png');
		error.mockRestore();
	});
});

// ─── deleteRecipe ─────────────────────────────────────────────────────────────

describe('deleteRecipe', () => {
	const photo = (name: string) =>
		`http://127.0.0.1:54321/storage/v1/object/public/recipe-images/owner-123/${name}.png`;

	/** The recipe with one version per photo url; null is a version with no photo. */
	const withVersions = (...imageUrls: (string | null)[]) => ({
		...RECIPE,
		versions: imageUrls.map((imageUrl) => ({ imageUrl }))
	});

	let deleteChain: ReturnType<typeof chain>;
	let tx: ReturnType<typeof makeTx>;

	/** `kept` is what another recipe's versions still show once this one is gone.
	 *  The versions are read, and the row deleted, inside the transaction. */
	function setUp(recipe: { versions: unknown[] }, kept: string[] = []) {
		vi.clearAllMocks();
		findRecipeMock.mockResolvedValue(recipe);
		tx = makeTx();
		Object.assign(tx.query.recipeVersions, {
			findMany: vi.fn().mockResolvedValue(recipe.versions)
		});
		deleteChain = tx.deleteChain;
		transactionMock.mockImplementation(async (fn: (t: unknown) => unknown) => fn(tx));
		dbSelectDistinct.mockReturnValue(chain(kept.map((imageUrl) => ({ imageUrl }))));
	}

	const del = (user: typeof OWNER | null = OWNER) =>
		invoke(actions.deleteRecipe, makeEvent({ user }));

	test("the owner's delete removes the row, each distinct photo once, and lands on /recipes", async () => {
		setUp(withVersions(photo('a'), photo('a'), null, photo('b')));
		const result = await del();
		// Under the save action's row lock, so a save cannot land mid-delete.
		expect(transactionMock).toHaveBeenCalledTimes(1);
		expect(tx.lockFor).toHaveBeenCalledWith('update');
		expect(tx.delete).toHaveBeenCalledTimes(1);
		expect(deleteChain.where).toHaveBeenCalledTimes(1);
		expect(removeMock).toHaveBeenCalledTimes(1);
		expect(removeMock).toHaveBeenCalledWith(SUPABASE, 'owner-123/a.png', 'owner-123/b.png');
		expect(result).toMatchObject({ status: 303, location: '/recipes' });
	});

	test("keeps a photo another recipe still shows, as a fork shows its parent's", async () => {
		setUp(withVersions(photo('a'), photo('b')), [photo('a')]);
		await del();
		expect(removeMock).toHaveBeenCalledWith(SUPABASE, 'owner-123/b.png');
	});

	test('removes nothing from storage when no photo is in the bucket', async () => {
		setUp(withVersions(null, 'https://images.example.com/cake.jpg'));
		const result = await del();
		expect(removeMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 303, location: '/recipes' });
	});

	test('refuses another user with a 403 in the { error, code } shape, deleting nothing', async () => {
		setUp(withVersions(photo('a')));
		const result = await del(OTHER);
		expect(result).toMatchObject({
			status: 403,
			data: { error: 'Not authorized', code: 'forbidden' }
		});
		expect(transactionMock).not.toHaveBeenCalled();
		expect(removeMock).not.toHaveBeenCalled();
	});

	test('a lapsed session is a 401 in the { error, code } shape', async () => {
		setUp(withVersions(photo('a')));
		const result = await del(null);
		expect(result).toMatchObject({ status: 401, data: { code: 'unauthenticated' } });
		expect(transactionMock).not.toHaveBeenCalled();
	});
});

describe('edit load', () => {
	test("forkCount counts this recipe's forks of any visibility, for the forks hint", async () => {
		findRecipeMock.mockResolvedValue({ ...RECIPE, id: 42, versions: [LATEST] });
		countMock.mockResolvedValue(3);
		const event = {
			params: { slug: 'soup' },
			url: new URL('http://x/recipes/soup/edit'),
			locals: { user: OWNER }
		};
		const data = (await load(event as never)) as { forkCount: number };
		expect(data.forkCount).toBe(3);
		const [table, filter] = countMock.mock.calls[0] as [unknown, SQL];
		expect(table).toBe(recipes);
		// Only the parent link: a private fork still means forks exist.
		expect(new PgDialect().sqlToQuery(filter)).toMatchObject({
			sql: '"recipes"."parent_id" = $1',
			params: [42]
		});
	});

	test("another user's recipe is a 403 that says Not authorized, as the actions do", async () => {
		findRecipeMock.mockResolvedValue(RECIPE);
		const event = {
			params: { slug: 'soup' },
			url: new URL('http://x/recipes/soup/edit'),
			locals: { user: OTHER }
		};
		await expect(Promise.resolve().then(() => load(event as never))).rejects.toMatchObject({
			status: 403,
			body: { message: 'Not authorized' }
		});
	});

	test('a logged-out visitor is sent to log in and brought back to this editor', async () => {
		const event = {
			params: { slug: 'soup' },
			url: new URL('http://x/recipes/soup/edit?from=nav'),
			locals: { user: null }
		};
		await expect(Promise.resolve().then(() => load(event as never))).rejects.toMatchObject({
			status: 303,
			location: '/login?redirectTo=%2Frecipes%2Fsoup%2Fedit%3Ffrom%3Dnav'
		});
	});
});
