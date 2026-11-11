import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { invokeAction, formEvent, loadEvent, loadPage, photoFile } from '#lib/testing/actions.js';
import { loginHref } from '#lib/auth/loginHref.js';
import { PHOTO_SIZE_MESSAGE, PHOTO_MAX_BYTES } from '#lib/recipes/validation.js';
import { ENTRY_MESSAGES } from '#lib/server/journal.js';
import { actions, load } from './+page.server';
import type { PageData } from './$types';

const { insertMock, resolveMock, choicesMock, audienceMock, uploadMock, removeMock } = vi.hoisted(
	() => ({
		insertMock: vi.fn(),
		resolveMock: vi.fn(),
		choicesMock: vi.fn(),
		audienceMock: vi.fn(),
		uploadMock: vi.fn(),
		removeMock: vi.fn().mockResolvedValue(undefined)
	})
);

vi.mock('#lib/server/db/index.js', () => ({ db: { insert: insertMock } }));
vi.mock('#lib/server/journal.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/journal.js')>()),
	resolveRecipe: resolveMock,
	recipeChoices: choicesMock,
	defaultAudience: audienceMock
}));
vi.mock('#lib/server/images.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/images.js')>()),
	uploadRecipeImage: uploadMock,
	removeRecipeImage: removeMock
}));
vi.mock('#lib/server/profiles.js', () => ({ ensureProfile: vi.fn().mockResolvedValue(undefined) }));

const USER = { id: 'user-1' };
const LINKED = {
	recipeId: 7,
	versionId: 70,
	slug: 'buns-ab12',
	title: 'Cardamom Buns',
	versionNumber: 3,
	visibility: 'private' as const
};

const invoke = (fields: Record<string, string>, file?: File, user: typeof USER | null = USER) =>
	invokeAction(
		actions.default as never,
		formEvent({ fields, file, locals: { user, supabase: { storage: {} } } })
	);

const loadAt = (search: string, user: typeof USER | null = USER) =>
	loadPage<PageData>(load as never, loadEvent({ path: `/journal/new${search}`, user }));

beforeEach(() => {
	vi.clearAllMocks();
	insertMock.mockReturnValue(chain([{ id: 99 }]));
	choicesMock.mockResolvedValue([]);
	audienceMock.mockResolvedValue('friends');
});

describe('journal/new load', () => {
	test('signed out goes to log in and back', async () => {
		await expect(loadAt('?recipe=x', null)).rejects.toMatchObject({
			status: 303,
			location: loginHref('/journal/new?recipe=x')
		});
	});

	test("Cook's link prefills the dish, recipe, version and serves; the audience is the remembered one", async () => {
		resolveMock.mockResolvedValue(LINKED);
		const data = await loadAt(`?recipe=${LINKED.slug}&version=3&serves=24`);
		expect(resolveMock).toHaveBeenCalledWith(USER, LINKED.slug, 3);
		expect(data.values).toMatchObject({
			dish: LINKED.title,
			recipe: LINKED.slug,
			version: '3',
			servings: '24',
			audience: 'friends'
		});
		// Not saved, but reached by link: offered all the same.
		expect(data.choices).toEqual([
			{
				slug: LINKED.slug,
				title: LINKED.title,
				visibility: LINKED.visibility,
				latestVersion: LINKED.versionNumber
			}
		]);
	});

	test('a recipe the reader may not see prefills nothing', async () => {
		resolveMock.mockResolvedValue(null);
		const data = await loadAt('?recipe=secret&serves=4');
		expect(data.values).toMatchObject({ dish: '', recipe: '', version: '', servings: '' });
	});
});

describe('journal/new action', () => {
	test('Dish and Date alone are logged, Only me, and land on the Journal', async () => {
		const result = await invoke({ dish: 'Fried rice', cookedOn: '2026-11-06' });
		expect(result).toMatchObject({ status: 303, location: '/journal?logged=99' });
		expect(insertMock.mock.results[0].value.values).toHaveBeenCalledWith({
			userId: USER.id,
			recipeId: null,
			versionId: null,
			dish: 'Fried rice',
			cookedOn: '2026-11-06',
			servings: null,
			photoUrl: null,
			caption: null,
			note: null,
			audience: 'private',
			sourceUrl: null
		});
	});

	test('a link with no recipe is stored as the source', async () => {
		const link = 'https://www.seriouseats.com/dal';
		await invoke({ dish: 'Dal', cookedOn: '2026-11-06', link });
		expect(insertMock.mock.results[0].value.values).toHaveBeenCalledWith(
			expect.objectContaining({ recipeId: null, sourceUrl: link })
		);
	});

	test('a link that is not http(s) is refused with what was typed handed back', async () => {
		const result = await invoke({ dish: 'Dal', cookedOn: '2026-11-06', link: 'javascript:x' });
		expect(result).toMatchObject({
			status: 400,
			data: { error: ENTRY_MESSAGES.linkInvalid, code: 'invalid', values: { link: 'javascript:x' } }
		});
		expect(insertMock).not.toHaveBeenCalled();
	});

	test('a missing dish is refused with everything typed handed back', async () => {
		const result = await invoke({ dish: '', cookedOn: '2026-11-06', caption: 'Kimchi' });
		expect(result).toMatchObject({
			status: 400,
			data: { error: ENTRY_MESSAGES.dishRequired, code: 'invalid', values: { caption: 'Kimchi' } }
		});
		expect(insertMock).not.toHaveBeenCalled();
	});

	test('a recipe the reader may not see is refused, not linked', async () => {
		resolveMock.mockResolvedValue(null);
		const result = await invoke({ dish: 'Buns', cookedOn: '2026-11-08', recipe: 'secret' });
		expect(result).toMatchObject({
			status: 400,
			data: { error: ENTRY_MESSAGES.recipeUnavailable }
		});
		expect(insertMock).not.toHaveBeenCalled();
	});

	test('links the resolved recipe and version, and stores the photo', async () => {
		resolveMock.mockResolvedValue(LINKED);
		uploadMock.mockResolvedValue({ url: 'https://x/p.png', path: 'user-1/p.png' });
		await invoke(
			{
				dish: 'Buns',
				cookedOn: '2026-11-08',
				recipe: LINKED.slug,
				version: '3',
				audience: 'friends'
			},
			photoFile('p.png')
		);
		expect(resolveMock).toHaveBeenCalledWith(USER, LINKED.slug, 3);
		expect(insertMock.mock.results[0].value.values).toHaveBeenCalledWith(
			expect.objectContaining({
				recipeId: LINKED.recipeId,
				versionId: LINKED.versionId,
				photoUrl: 'https://x/p.png',
				audience: 'friends'
			})
		);
	});

	test('an oversized photo is refused before anything is stored', async () => {
		const big = new File([new Uint8Array(PHOTO_MAX_BYTES + 1)], 'p.png', { type: 'image/png' });
		const result = await invoke({ dish: 'Buns', cookedOn: '2026-11-08' }, big);
		expect(result).toMatchObject({ status: 400, data: { error: PHOTO_SIZE_MESSAGE } });
		expect(uploadMock).not.toHaveBeenCalled();
	});

	test('a failed save removes the photo it stored', async () => {
		uploadMock.mockResolvedValue({ url: 'https://x/p.png', path: 'user-1/p.png' });
		insertMock.mockReturnValue({
			values: () => ({ returning: () => Promise.reject(new Error('db')) })
		});
		const result = await invoke({ dish: 'Buns', cookedOn: '2026-11-08' }, photoFile('p.png'));
		expect(result).toMatchObject({ status: 500, data: { code: 'save_failed' } });
		expect(removeMock).toHaveBeenCalledWith(expect.anything(), 'user-1/p.png');
	});

	test('a lapsed session hands the form back', async () => {
		const result = await invoke({ dish: 'Buns', cookedOn: '2026-11-08' }, undefined, null);
		expect(result).toMatchObject({ status: 401, data: { code: 'unauthenticated' } });
	});
});
