import { vi, describe, test, expect, beforeEach } from 'vitest';
import { and, desc, eq, type SQL } from 'drizzle-orm';
import { chain, sqlOf } from '#lib/testing/drizzle.js';
import { formEvent, invokeAction as invoke, loadEvent, loadPage } from '#lib/testing/actions.js';
import { SESSION_ENDED } from '#lib/server/actions.js';
import { recipes } from '#lib/server/db/schema.js';
import { TRASH_DAYS } from '#lib/trash.js';

const { selectMock, updateMock, trashedMock, deleteForeverMock, purgeMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	updateMock: vi.fn(),
	trashedMock: vi.fn(),
	deleteForeverMock: vi.fn().mockResolvedValue(undefined),
	purgeMock: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('#lib/server/db/index.js', () => ({ db: { select: selectMock, update: updateMock } }));
vi.mock('#lib/server/trash.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/trash.js')>()),
	trashedRecipe: trashedMock,
	deleteForever: deleteForeverMock,
	purgeExpiredTrash: purgeMock
}));

import { actions, load } from './+page.server';
import { NOT_IN_TRASH } from '#lib/trash.js';
import { inTrashOf } from '#lib/server/trash.js';
import type { PageData } from './$types';

const OWNER = { id: 'owner-1', email: 'o@test.dev' };
const SUPABASE = { storage: {} };
const DAY = 86_400_000;
const SOUP = { id: 7, slug: 'soup', title: 'Soup' };

/** The load event, with the Supabase client the purge removes photos through. */
const makeLoad = (user: typeof OWNER | null = OWNER) => {
	const event = loadEvent({ path: '/cookbook/trash', user }) as unknown as {
		locals: Record<string, unknown>;
	};
	event.locals.supabase = SUPABASE;
	return event as never;
};

const makeForm = (fields: Record<string, string>, user: typeof OWNER | null = OWNER) =>
	formEvent({ fields, locals: { user, supabase: SUPABASE } });

beforeEach(() => vi.clearAllMocks());

describe('/cookbook/trash load', () => {
	test('sends a signed-out visitor to log in, coming back here', async () => {
		await expect(Promise.resolve().then(() => load(makeLoad(null)))).rejects.toMatchObject({
			status: 303,
			location: `/login?redirectTo=${encodeURIComponent('/cookbook/trash')}`
		});
		expect(selectMock).not.toHaveBeenCalled();
	});

	test("lists the owner's restorable recipes, newest deletion first, each with its age and days left", async () => {
		const rows = chain([
			{ slug: 'soup', title: 'Soup', deletedAt: new Date(Date.now() - 3.5 * DAY) },
			{ slug: 'dal', title: 'Dal', deletedAt: new Date(Date.now() - 0.1 * DAY) }
		]);
		selectMock.mockReturnValue(rows);
		const data = await loadPage<PageData>(load, makeLoad());

		expect(purgeMock).toHaveBeenCalledWith(SUPABASE);
		// inTrashOf reads the clock, so the cutoff param is left out.
		const where = sqlOf(rows.where.mock.calls[0][0] as SQL);
		expect(where.sql).toBe(sqlOf(inTrashOf(OWNER.id)).sql);
		expect(where.params[0]).toBe(OWNER.id);
		expect(rows.orderBy).toHaveBeenCalledWith(desc(recipes.deletedAt));
		expect(data.recipes).toEqual([
			{
				slug: 'soup',
				title: 'Soup',
				deleted: 'Deleted 3 days ago',
				left: `${TRASH_DAYS - 3} days left`
			},
			{ slug: 'dal', title: 'Dal', deleted: 'Deleted today', left: `${TRASH_DAYS} days left` }
		]);
		expect(data.meta.title).toBe('Trash');
	});
});

describe('restore', () => {
	test("clears the owner's deletion, still inside the 30 days, and opens the recipe", async () => {
		trashedMock.mockResolvedValue(SOUP);
		const update = chain();
		updateMock.mockReturnValue(update);
		const result = await invoke(actions.restore, makeForm({ slug: 'soup' }));

		expect(trashedMock).toHaveBeenCalledWith('soup', OWNER.id);
		expect(updateMock).toHaveBeenCalledWith(recipes);
		expect(update.set).toHaveBeenCalledWith({ deletedAt: null });
		// Still in the Trash when written, so a purge that ran meanwhile wins.
		const where = sqlOf(update.where.mock.calls[0][0] as SQL);
		const expected = sqlOf(and(eq(recipes.id, SOUP.id), inTrashOf(OWNER.id))!);
		expect(where.sql).toBe(expected.sql);
		expect(where.params.slice(0, 2)).toEqual([SOUP.id, OWNER.id]);
		expect(result).toMatchObject({ status: 303, location: '/recipes/soup' });
	});

	test("refuses another user's recipe, a live one or one past the 30 days as not in the Trash", async () => {
		trashedMock.mockResolvedValue(null);
		const result = await invoke(actions.restore, makeForm({ slug: 'soup' }));
		expect(result).toMatchObject({ status: 404, data: { code: 'not_found', error: NOT_IN_TRASH } });
		expect(updateMock).not.toHaveBeenCalled();
	});

	test('a missing slug is invalid; a lapsed session is a 401', async () => {
		expect(await invoke(actions.restore, makeForm({}))).toMatchObject({
			status: 400,
			data: { code: 'invalid' }
		});
		expect(await invoke(actions.restore, makeForm({ slug: 'soup' }, null))).toMatchObject({
			status: 401,
			data: { code: 'unauthenticated', error: SESSION_ENDED('try again') }
		});
		expect(trashedMock).not.toHaveBeenCalled();
		expect(updateMock).not.toHaveBeenCalled();
	});
});

describe('deleteForever', () => {
	test("deletes the owner's trashed recipe for good, through the one permanent path", async () => {
		trashedMock.mockResolvedValue(SOUP);
		const result = await invoke(actions.deleteForever, makeForm({ slug: 'soup' }));
		expect(trashedMock).toHaveBeenCalledWith('soup', OWNER.id);
		expect(deleteForeverMock).toHaveBeenCalledWith(SOUP.id, SUPABASE);
		expect(result).toEqual({ deleted: 'Soup' });
	});

	test("refuses another user's recipe, a live one or one past the 30 days", async () => {
		trashedMock.mockResolvedValue(null);
		const result = await invoke(actions.deleteForever, makeForm({ slug: 'soup' }));
		expect(result).toMatchObject({ status: 404, data: { code: 'not_found', error: NOT_IN_TRASH } });
		expect(deleteForeverMock).not.toHaveBeenCalled();
	});

	test('a missing slug is invalid; a lapsed session is a 401', async () => {
		expect(await invoke(actions.deleteForever, makeForm({}))).toMatchObject({
			status: 400,
			data: { code: 'invalid' }
		});
		expect(await invoke(actions.deleteForever, makeForm({ slug: 'soup' }, null))).toMatchObject({
			status: 401,
			data: { code: 'unauthenticated', error: SESSION_ENDED('delete again') }
		});
		expect(deleteForeverMock).not.toHaveBeenCalled();
	});
});
