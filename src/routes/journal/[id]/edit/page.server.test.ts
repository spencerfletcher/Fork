import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { invokeAction, formEvent, loadPage } from '#lib/testing/actions.js';
import { KEEP_SOURCE } from '#lib/journal.js';
import { actions, load } from './+page.server';
import type { PageData } from './$types';

const { updateMock, deleteMock, ownEntryMock, choicesMock, resolveMock, removeMock } = vi.hoisted(
	() => ({
		updateMock: vi.fn(),
		deleteMock: vi.fn(),
		ownEntryMock: vi.fn(),
		choicesMock: vi.fn(),
		resolveMock: vi.fn(),
		removeMock: vi.fn().mockResolvedValue(undefined)
	})
);

vi.mock('#lib/server/db/index.js', () => ({
	db: { update: updateMock, delete: deleteMock }
}));
vi.mock('#lib/server/journal.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/journal.js')>()),
	ownEntry: ownEntryMock,
	recipeChoices: choicesMock,
	resolveRecipe: resolveMock
}));
vi.mock('#lib/server/images.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/images.js')>()),
	removeRecipeImage: removeMock
}));

const USER = { id: 'user-1' };
const PHOTO = 'https://p.supabase.co/storage/v1/object/public/recipe-images/user-1/old.png';

function makeStored(overrides = {}) {
	return {
		id: 5,
		userId: USER.id,
		recipeId: 7,
		versionId: 70,
		dish: 'Buns',
		cookedOn: '2026-11-08',
		servings: 12,
		photoUrl: PHOTO,
		caption: null,
		note: 'Proof longer',
		audience: 'friends',
		sourceUrl: null,
		createdAt: new Date(),
		...overrides
	};
}

const event = (fields: Record<string, string> = {}, id = '5') =>
	formEvent({ fields, params: { id }, locals: { user: USER, supabase: { storage: {} } } });

beforeEach(() => {
	vi.clearAllMocks();
	ownEntryMock.mockResolvedValue({ ...makeStored(), source: { kind: 'deleted' } });
	updateMock.mockReturnValue(chain());
	deleteMock.mockReturnValue(chain());
	choicesMock.mockResolvedValue([]);
});

describe('journal/[id]/edit load', () => {
	test("someone else's entry, or no entry, is a 404", async () => {
		ownEntryMock.mockResolvedValue(null);
		await expect(
			load({
				params: { id: '5' },
				url: new URL('http://l/journal/5/edit'),
				locals: { user: USER }
			} as never)
		).rejects.toMatchObject({ status: 404 });
	});

	test('a deleted recipe is kept as stored and named as such', async () => {
		ownEntryMock.mockResolvedValue({ ...makeStored(), source: { kind: 'deleted' } });
		const data = await loadPage<PageData>(load as never, {
			params: { id: '5' },
			url: new URL('http://l/journal/5/edit'),
			locals: { user: USER }
		});
		expect(data.keepLabel).toBe('Recipe deleted');
		expect(data.values.recipe).toBe(KEEP_SOURCE);
	});

	test('a linked entry prefills its link and no recipe', async () => {
		const url = 'https://seriouseats.com/dal';
		ownEntryMock.mockResolvedValue({
			...makeStored({ recipeId: null, versionId: null, sourceUrl: url }),
			source: { kind: 'link', url, host: 'seriouseats.com' }
		});
		const data = await loadPage<PageData>(load as never, {
			params: { id: '5' },
			url: new URL('http://l/journal/5/edit'),
			locals: { user: USER }
		});
		expect(data.values).toMatchObject({ link: url, recipe: '' });
	});
});

describe('journal/[id]/edit save', () => {
	test("someone else's id is a 404 and nothing is written", async () => {
		ownEntryMock.mockResolvedValue(null);
		const result = await invokeAction(
			actions.save as never,
			event({ dish: 'x', cookedOn: '2026-11-08' })
		);
		expect(result).toMatchObject({ status: 404 });
		expect(updateMock).not.toHaveBeenCalled();
	});

	test('keep leaves the stored recipe; removing the photo deletes its file', async () => {
		const result = await invokeAction(
			actions.save as never,
			event({ dish: 'Buns', cookedOn: '2026-11-09', recipe: KEEP_SOURCE, removeImage: 'on' })
		);
		expect(result).toMatchObject({ status: 303, location: '/journal?logged=5' });
		expect(resolveMock).not.toHaveBeenCalled();
		expect(updateMock.mock.results[0].value.set).toHaveBeenCalledWith(
			expect.objectContaining({
				recipeId: 7,
				versionId: 70,
				photoUrl: null,
				cookedOn: '2026-11-09'
			})
		);
		expect(removeMock).toHaveBeenCalledWith(expect.anything(), 'user-1/old.png');
	});

	test('switching to a link stores it and drops the recipe', async () => {
		const link = 'https://seriouseats.com/buns';
		await invokeAction(
			actions.save as never,
			event({ dish: 'Buns', cookedOn: '2026-11-09', recipe: '', link })
		);
		expect(updateMock.mock.results[0].value.set).toHaveBeenCalledWith(
			expect.objectContaining({ recipeId: null, versionId: null, sourceUrl: link })
		);
	});
});

describe('journal/[id]/edit deleteEntry', () => {
	test('deletes the own entry and its photo, then lands on the Journal', async () => {
		const result = await invokeAction(actions.deleteEntry as never, event());
		expect(result).toMatchObject({ status: 303, location: '/journal?deleted=1' });
		expect(deleteMock).toHaveBeenCalledTimes(1);
		expect(removeMock).toHaveBeenCalledWith(expect.anything(), 'user-1/old.png');
	});

	test("refuses someone else's entry", async () => {
		ownEntryMock.mockResolvedValue(null);
		const result = await invokeAction(actions.deleteEntry as never, event());
		expect(result).toMatchObject({ status: 404 });
		expect(deleteMock).not.toHaveBeenCalled();
	});
});
