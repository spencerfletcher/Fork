import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { invokeAction as invoke, formEvent, loadEvent } from '#lib/testing/actions.js';
import { actions, load } from './+page.server';
import { VERSION_NOT_FOUND } from './versionError.js';
import { inGroup, makeIngredient, makeStep, makeContent } from '#lib/recipes/fixtures.js';
import { favorites, friendships, recipes } from '#lib/server/db/schema.js';
import type { Visibility } from '#lib/recipes/validation.js';
import { SESSION_ENDED } from '#lib/server/actions.js';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const {
	findRecipeMock,
	findFavoriteMock,
	countMock,
	selectMock,
	dbInsert,
	dbDelete,
	transactionMock,
	ensureProfileMock,
	lastEntryMock
} = vi.hoisted(() => ({
	findRecipeMock: vi.fn(),
	findFavoriteMock: vi.fn(),
	countMock: vi.fn(),
	selectMock: vi.fn(),
	dbInsert: vi.fn(),
	dbDelete: vi.fn(),
	transactionMock: vi.fn(),
	ensureProfileMock: vi.fn().mockResolvedValue(undefined),
	lastEntryMock: vi.fn().mockResolvedValue(null)
}));

vi.mock('#lib/server/db/index.js', () => ({
	db: {
		query: {
			recipes: { findFirst: findRecipeMock },
			favorites: { findFirst: findFavoriteMock }
		},
		$count: countMock,
		select: selectMock,
		insert: dbInsert,
		delete: dbDelete,
		transaction: transactionMock
	}
}));

vi.mock('#lib/server/profiles.js', () => ({ ensureProfile: ensureProfileMock }));
vi.mock('#lib/server/journal.js', () => ({ lastEntryFor: lastEntryMock }));

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
	makes: '24 cookies',
	prepTimeMinutes: 20,
	cookTimeMinutes: 12,
	imageUrl: 'https://img/version.png',
	ingredients: [makeIngredient('salt'), ...inGroup('Dough', [makeIngredient('2 cups flour')])],
	steps: inGroup('Bake', [makeStep('Mix.')])
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
	visibility: 'public',
	parentId: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	editRevision: 3,
	versions: [{ id: 1, versionNumber: 1, commitMessage: 'Initial recipe', ...LATEST }],
	recipesToTags: [{ tagId: 7 }],
	author: { username: 'chef' }
};

// ─── fork action ──────────────────────────────────────────────────────────────

describe('fork', () => {
	beforeEach(() => vi.clearAllMocks());

	test('signed out is a 401 form failure saying the session ended', async () => {
		const result = await invoke(actions.fork as never, makeEvent({ user: null }));
		expect(result).toMatchObject({
			status: 401,
			data: { error: SESSION_ENDED('try again'), code: 'unauthenticated' }
		});
		expect(findRecipeMock).not.toHaveBeenCalled();
	});

	test('throws 404 when source recipe does not exist', async () => {
		findRecipeMock.mockResolvedValue(null);
		const result = await invoke(actions.fork as never, makeEvent({ user: FORKER }));
		expect(result.status).toBe(404);
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

	test('takes tags from the source recipe, the photo from its latest version, and nothing else from the row; the fork starts private', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeId: 99, newRecipeSlug: 'classic-cookies-abc12345' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(actions.fork as never, makeEvent({ user: FORKER }));

		const recipeValues = tx.insertChain.values.mock.calls[0][0];
		expect(recipeValues.imageUrl).toBe('https://img/version.png');
		expect(recipeValues.visibility).toBe('private');
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

	test('inserts version 1 as the complete latest content of the source, with a message naming where it came from', async () => {
		findRecipeMock.mockResolvedValue({
			...SOURCE_RECIPE,
			versions: [{ id: 3, versionNumber: 3, commitMessage: 'Chill the dough', ...LATEST }]
		});
		const tx = makeTx({ newRecipeId: 99, newRecipeSlug: 'classic-cookies-abc12345' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		// Forking is one click: no message is asked for, so none is read.
		await invoke(actions.fork as never, makeEvent({ user: FORKER }));

		// Third tx.insert call is recipeVersions (after recipes + recipesToTags)
		const versionValues = tx.insertChain.values.mock.calls[2][0];
		expect(versionValues).toMatchObject({
			recipeId: 99,
			versionNumber: 1,
			commitMessage: 'Forked from @chef, v3',
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

	test('ignores a commit message sent with the form', async () => {
		findRecipeMock.mockResolvedValue(SOURCE_RECIPE);
		const tx = makeTx({ newRecipeSlug: 'classic-cookies-abc12345' });
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);

		await invoke(
			actions.fork as never,
			makeEvent({ user: FORKER, fields: { commitMessage: 'My fork' } })
		);

		const versionValues = tx.insertChain.values.mock.calls[2][0];
		expect(versionValues.commitMessage).toBe('Forked from @chef, v1');
	});
});

// ─── load: fork attribution ───────────────────────────────────────────────────

/** A load event for the fork's page, at `path` (its query included). */
const makeLoadEvent = (
	user: { id: string; email: string } | null = null,
	path = '/recipes/the-fork'
) => loadEvent({ params: { slug: 'the-fork' }, path, user });

/** A public fork whose parent has the given visibility and owner. */
function forkOf(parent: { visibility: Visibility; authorId: string }) {
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

/**
 * Answers the fork aggregate attachRecipeCounts reads with `n` forks of the
 * loaded recipe (id 99, as forkOf makes it); returns the chain whose `where`
 * holds the count's filter.
 */
function forkAggregate(n: number) {
	const forks = chain([{ parentId: 99, count: n }]);
	selectMock.mockImplementation(() => {
		const q = chain();
		q.from.mockImplementation((table: unknown) => (table === recipes ? forks : chain([])));
		return q;
	});
	return forks;
}
const forkFilter = (forks: ReturnType<typeof forkAggregate>) => forks.where.mock.calls[0][0];

async function loadData(user: { id: string; email: string } | null = null) {
	return (await load(makeLoadEvent(user) as never)) as {
		recipe: { parent: unknown; parentId: number | null; parentDeleted: boolean };
		forkCount: number;
		favoriteCount: number;
		currentVersion: { ingredients: unknown[] } | null;
		grams: unknown[];
		meta: { title: string; description: string; image: string };
	};
}

describe('load: fork attribution', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		findFavoriteMock.mockResolvedValue(undefined);
		countMock.mockResolvedValue(0);
		selectMock.mockReturnValue(chain([]));
	});

	test('counts public forks of the recipe', async () => {
		findRecipeMock.mockResolvedValue(forkOf({ visibility: 'public', authorId: 'original-author' }));
		forkAggregate(2);
		const data = await loadData();
		expect(data.forkCount).toBe(2);
	});

	test('counts the favorites on this recipe, from the favorites table', async () => {
		findRecipeMock.mockResolvedValue(forkOf({ visibility: 'public', authorId: 'original-author' }));
		// Each count answers by the table it is read from, so the test does not
		// lean on the order the loader asks in.
		countMock.mockImplementation(async (table: unknown) => (table === favorites ? 7 : 0));
		forkAggregate(2);
		const data = await loadData();
		expect(data.favoriteCount).toBe(7);
		expect(data.forkCount).toBe(2);
		// Counted for this recipe only.
		const [, filter] = countMock.mock.calls.find(([table]) => table === favorites)!;
		expect(columnNames(filter)).toEqual(['recipe_id']);
	});

	test('includes a public parent', async () => {
		findRecipeMock.mockResolvedValue(forkOf({ visibility: 'public', authorId: 'original-author' }));
		const data = await loadData();
		expect(data.recipe.parent).toMatchObject({ slug: 'secret-original' });
	});

	test('withholds a private parent from a viewer who does not own it', async () => {
		findRecipeMock.mockResolvedValue(
			forkOf({ visibility: 'private', authorId: 'original-author' })
		);
		const data = await loadData(FORKER);
		expect(data.recipe.parent).toBeNull();
		// parentId stays so the page can say it was forked from a private recipe.
		expect(data.recipe.parentId).toBe(42);
	});

	test('withholds a private parent from a logged-out viewer', async () => {
		findRecipeMock.mockResolvedValue(
			forkOf({ visibility: 'private', authorId: 'original-author' })
		);
		const data = await loadData(null);
		expect(data.recipe.parent).toBeNull();
	});

	test('says the parent was deleted when its row is gone, and not for a private one', async () => {
		findRecipeMock.mockResolvedValue({
			...forkOf({ visibility: 'public', authorId: 'a' }),
			parent: null
		});
		expect((await loadData()).recipe).toMatchObject({ parent: null, parentDeleted: true });

		findRecipeMock.mockResolvedValue(
			forkOf({ visibility: 'private', authorId: 'original-author' })
		);
		expect((await loadData(FORKER)).recipe).toMatchObject({ parentDeleted: false });
	});

	test("includes a private parent for the parent's owner", async () => {
		findRecipeMock.mockResolvedValue(
			forkOf({ visibility: 'private', authorId: 'original-author' })
		);
		const data = await loadData({ id: 'original-author', email: 'o@test.com' });
		expect(data.recipe.parent).toMatchObject({ slug: 'secret-original' });
	});

	test('builds the page metadata from the shown version, not the recipe copy', async () => {
		findRecipeMock.mockResolvedValue(forkOf({ visibility: 'public', authorId: 'original-author' }));
		const data = await loadData();
		expect(data.meta.title).toBe('Classic Cookies');
		expect(data.meta.description).toBe('Good cookies');
		expect(data.meta.image).toBe('https://img/version.png');
	});

	test('returns one gram result per ingredient of the shown version', async () => {
		findRecipeMock.mockResolvedValue(forkOf({ visibility: 'public', authorId: 'original-author' }));
		const data = await loadData();
		expect(data.grams).toHaveLength(data.currentVersion?.ingredients.length ?? -1);
	});

	test('counts only public forks, so private forks stay invisible', async () => {
		findRecipeMock.mockResolvedValue(forkOf({ visibility: 'public', authorId: 'original-author' }));
		const forks = forkAggregate(0);
		await loadData();
		// The filter must name visibility: a count of every fork would reveal
		// private forks by number.
		expect(columnNames(forkFilter(forks))).toContain('visibility');
	});

	test("counts the viewer's own private forks too, as the forks page lists them", async () => {
		findRecipeMock.mockResolvedValue(forkOf({ visibility: 'public', authorId: 'original-author' }));
		const forks = forkAggregate(1);
		await loadData(FORKER);
		expect(columnNames(forkFilter(forks))).toEqual(
			expect.arrayContaining(['parent_id', 'visibility', 'author_id'])
		);
	});
});

// ─── load: the personal line ──────────────────────────────────────────────────

describe('load: the personal line', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		findFavoriteMock.mockResolvedValue(undefined);
		countMock.mockResolvedValue(0);
		selectMock.mockReturnValue(chain([]));
		findRecipeMock.mockResolvedValue(forkOf({ visibility: 'public', authorId: 'original-author' }));
	});

	test('signed out there is no line, and no Journal lookup', async () => {
		const data = (await load(makeLoadEvent() as never)) as { journal: unknown };
		expect(data.journal).toBeNull();
		expect(lastEntryMock).not.toHaveBeenCalled();
	});

	test("signed in: the reader's latest entry of this recipe, and Add to Journal for the version read", async () => {
		const reader = { id: 'reader', email: 'r@test.com' };
		const latest = { id: 12, cookedOn: '2026-11-08' };
		lastEntryMock.mockResolvedValue(latest);
		const data = (await load(makeLoadEvent(reader, '/recipes/the-fork?version=1'))) as {
			journal: unknown;
		};
		expect(lastEntryMock).toHaveBeenCalledWith(reader.id, 99);
		expect(data.journal).toEqual({
			lastEntry: latest,
			addHref: '/journal/new?recipe=the-fork&version=1'
		});
	});
});

// ─── load: ?version= ──────────────────────────────────────────────────────────

describe('load: ?version=', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		findFavoriteMock.mockResolvedValue(undefined);
		countMock.mockResolvedValue(0);
		selectMock.mockReturnValue(chain([]));
		findRecipeMock.mockResolvedValue(forkOf({ visibility: 'public', authorId: 'original-author' }));
	});

	const loadVersion = (version: string) =>
		invoke(load as never, makeLoadEvent(null, `/recipes/the-fork?version=${version}`));

	test.each(['1abc', '1.5', ' 1', '-1'])('%j is not a version number: 404', async (version) => {
		expect(await loadVersion(version)).toMatchObject({
			status: 404,
			body: { message: VERSION_NOT_FOUND }
		});
	});

	test('a plain number the recipe has shows that version', async () => {
		expect(await loadVersion('1')).toMatchObject({ currentVersion: { versionNumber: 1 } });
	});
});

// ─── visibility: a private recipe by another user ─────────────────────────────

describe("visibility: another user's private recipe", () => {
	const PRIVATE = { ...SOURCE_RECIPE, visibility: 'private', parent: null };

	beforeEach(() => {
		vi.clearAllMocks();
		findRecipeMock.mockResolvedValue(PRIVATE);
	});

	test('load answers 404, as for a missing recipe', async () => {
		const result = await invoke(load as never, makeLoadEvent(FORKER));
		expect(result).toMatchObject({ status: 404, body: { message: 'Recipe not found' } });
	});

	test('toggleFavorite answers 404 and saves nothing', async () => {
		const result = await invoke(actions.toggleFavorite as never, makeEvent({ user: FORKER }));
		expect(result).toMatchObject({ status: 404, body: { message: 'Recipe not found' } });
		expect(dbInsert).not.toHaveBeenCalled();
	});

	test('fork answers 404 and copies nothing', async () => {
		const result = await invoke(actions.fork as never, makeEvent({ user: FORKER }));
		expect(result).toMatchObject({ status: 404, body: { message: 'Source recipe not found' } });
		expect(transactionMock).not.toHaveBeenCalled();
	});
});

// ─── toggleFavorite ───────────────────────────────────────────────────────────

describe('toggleFavorite', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		findRecipeMock.mockResolvedValue({ ...SOURCE_RECIPE, visibility: 'public' });
		dbInsert.mockReturnValue(chain());
	});

	test('a favorite is removed, and nothing is inserted', async () => {
		dbDelete.mockReturnValue(chain([{ recipeId: SOURCE_RECIPE.id }]));
		await invoke(actions.toggleFavorite as never, makeEvent({ user: FORKER }));
		expect(dbDelete).toHaveBeenCalledWith(favorites);
		expect(dbInsert).not.toHaveBeenCalled();
	});

	test('with nothing to remove, the recipe is favorited', async () => {
		dbDelete.mockReturnValue(chain([]));
		const insert = chain();
		dbInsert.mockReturnValue(insert);
		await invoke(actions.toggleFavorite as never, makeEvent({ user: FORKER }));
		expect(dbInsert).toHaveBeenCalledWith(favorites);
		expect(insert.values).toHaveBeenCalledWith({ userId: FORKER.id, recipeId: SOURCE_RECIPE.id });
	});

	test('signed out is a 401 form failure saying the session ended, and touches nothing', async () => {
		const result = await invoke(actions.toggleFavorite as never, makeEvent({ user: null }));
		expect(result).toMatchObject({
			status: 401,
			data: { error: SESSION_ENDED('try again'), code: 'unauthenticated' }
		});
		expect(dbDelete).not.toHaveBeenCalled();
	});
});

// ─── visibility: a friends recipe by another user ─────────────────────────────

describe('visibility: a friends recipe', () => {
	const FRIENDS = { ...SOURCE_RECIPE, visibility: 'friends', parent: null };

	/** Friendship rows answer friendIdsOf, the only select these paths make. */
	function friendsWith(...ids: string[]) {
		selectMock.mockImplementation(() => {
			const q = chain();
			q.from.mockImplementation((table: unknown) =>
				table === friendships
					? chain(ids.map((id) => ({ requesterId: id, addresseeId: FORKER.id })))
					: chain([])
			);
			return q;
		});
	}

	beforeEach(() => {
		vi.clearAllMocks();
		findFavoriteMock.mockResolvedValue(undefined);
		countMock.mockResolvedValue(0);
		selectMock.mockReturnValue(chain([]));
		findRecipeMock.mockResolvedValue(FRIENDS);
	});

	test('load shows it to an accepted friend of the author', async () => {
		friendsWith(SOURCE_RECIPE.authorId);
		const data = await loadData(FORKER);
		expect(data.recipe).toMatchObject({ slug: SOURCE_RECIPE.slug });
	});

	test('load answers 404 to a signed-in reader who is not a friend', async () => {
		friendsWith('someone-else');
		const result = await invoke(load as never, makeLoadEvent(FORKER));
		expect(result).toMatchObject({ status: 404, body: { message: 'Recipe not found' } });
	});

	test('load answers 404 to a logged-out reader', async () => {
		friendsWith(SOURCE_RECIPE.authorId);
		const result = await invoke(load as never, makeLoadEvent(null));
		expect(result).toMatchObject({ status: 404 });
	});

	test('a friend can fork it, and the fork starts private', async () => {
		friendsWith(SOURCE_RECIPE.authorId);
		const tx = makeTx();
		transactionMock.mockImplementationOnce(
			async (cb: (tx: ReturnType<typeof makeTx>) => Promise<void>) => cb(tx)
		);
		await invoke(actions.fork as never, makeEvent({ user: FORKER }));
		expect(tx.insertChain.values.mock.calls[0][0].visibility).toBe('private');
	});

	test('a stranger cannot fork it', async () => {
		friendsWith('someone-else');
		const result = await invoke(actions.fork as never, makeEvent({ user: FORKER }));
		expect(result).toMatchObject({ status: 404 });
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test("a friends parent is withheld from a reader who is not the parent author's friend", async () => {
		friendsWith('someone-else');
		findRecipeMock.mockResolvedValue(
			forkOf({ visibility: 'friends', authorId: 'original-author' })
		);
		const data = await loadData(FORKER);
		expect(data.recipe.parent).toBeNull();
	});

	test("a friends parent is shown to the parent author's friend", async () => {
		friendsWith('original-author');
		findRecipeMock.mockResolvedValue(
			forkOf({ visibility: 'friends', authorId: 'original-author' })
		);
		const data = await loadData(FORKER);
		expect(data.recipe.parent).toMatchObject({ slug: 'secret-original' });
	});
});
