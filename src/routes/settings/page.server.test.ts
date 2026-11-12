import { vi, describe, test, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { chain } from '#lib/testing/drizzle.js';
import { invokeAction, formEvent, loadEvent } from '#lib/testing/actions.js';
import { loginHref } from '#lib/auth/loginHref.js';
import { SESSION_ENDED } from '#lib/server/actions.js';
import { ACCOUNT_DELETED, DELETE_FAILED, TYPE_USERNAME } from '#lib/account.js';
import { USERNAME_MESSAGE, USERNAME_TAKEN } from '#lib/auth/rules.js';
import { profiles } from '#lib/server/db/schema.js';
import { AS_WRITTEN } from '#lib/measurement.js';
import { dayLabel } from '#lib/journal.js';
import { NOTIFICATION_KINDS } from '#lib/notifications.js';
import { actions, load } from './+page.server';

const { findProfileMock, updateMock, changeUsernameMock, ensureProfileMock, deleteAccountMock } =
	vi.hoisted(() => ({
		findProfileMock: vi.fn(),
		updateMock: vi.fn(),
		changeUsernameMock: vi.fn(),
		ensureProfileMock: vi.fn().mockResolvedValue(undefined),
		deleteAccountMock: vi.fn()
	}));

vi.mock('#lib/server/db/index.js', () => ({
	db: { query: { profiles: { findFirst: findProfileMock } }, update: updateMock }
}));
vi.mock('#lib/server/profiles.js', () => ({
	changeUsername: changeUsernameMock,
	ensureProfile: ensureProfileMock
}));
vi.mock('#lib/server/account.js', () => ({ deleteAccount: deleteAccountMock }));

const ME = { id: 'me-1', email: 'me@example.com' };

const post = (
	action: keyof typeof actions,
	fields: Record<string, string>,
	user: typeof ME | null = ME
) => invokeAction(actions[action] as never, formEvent({ fields, locals: { user } }));

/** The update chain the next `db.update` returns, so a test can read its `set` and `where`. */
function nextUpdate() {
	const c = chain();
	updateMock.mockReturnValueOnce(c);
	return c;
}

beforeEach(() => {
	vi.clearAllMocks();
	changeUsernameMock.mockResolvedValue({ result: 'changed' });
});

describe('settings load', () => {
	test('signed out goes to log in and back to /settings', async () => {
		await expect(load(loadEvent({ path: '/settings' }))).rejects.toMatchObject({
			status: 303,
			location: loginHref('/settings')
		});
	});

	test("signed in it reads the viewer's own profile and their sign-in email", async () => {
		findProfileMock.mockResolvedValue({
			username: 'cook',
			defaultVisibility: 'friends',
			measurement: null,
			mutedNotifications: [NOTIFICATION_KINDS[1], 'retired-kind']
		});
		const data = await load(loadEvent({ path: '/settings', user: ME }));
		expect(ensureProfileMock).toHaveBeenCalledWith(ME);
		expect(data).toMatchObject({
			email: 'me@example.com',
			settings: {
				username: 'cook',
				defaultVisibility: 'friends',
				measurement: null,
				// A stored kind no longer in the list is not shown as muted.
				mutedNotifications: [NOTIFICATION_KINDS[1]]
			},
			// A signed-in page: kept out of search, no preview.
			meta: { noindex: true }
		});
	});
});

describe('username action', () => {
	test('saves the normalised name for the signed-in profile only', async () => {
		const result = await post('username', { username: '  NewCook ', id: 'someone-else' });
		expect(changeUsernameMock).toHaveBeenCalledWith('me-1', 'newcook');
		expect(result).toEqual({ section: 'username', saved: true });
	});

	test("refuses a name outside sign-up's rule, without writing", async () => {
		const result = await post('username', { username: 'a!' });
		expect(result).toMatchObject({
			status: 400,
			data: { section: 'username', code: 'invalid', error: USERNAME_MESSAGE, username: 'a!' }
		});
		expect(changeUsernameMock).not.toHaveBeenCalled();
	});

	test('a name someone else holds, now or formerly, is refused as taken', async () => {
		changeUsernameMock.mockResolvedValue({ result: 'taken' });
		const result = await post('username', { username: 'taken' });
		expect(result).toMatchObject({
			status: 400,
			data: { section: 'username', code: 'invalid', error: USERNAME_TAKEN, username: 'taken' }
		});
	});

	test('a change past the limit is refused with the day the next one is allowed', async () => {
		const nextChange = new Date('2026-12-14T09:30:00Z');
		changeUsernameMock.mockResolvedValue({ result: 'too_soon', nextChange });
		const result = await post('username', { username: 'another' });
		expect(result).toMatchObject({
			status: 429,
			data: {
				section: 'username',
				code: 'rate_limited',
				error: `You can change your username again on ${dayLabel(nextChange)}.`,
				username: 'another'
			}
		});
	});

	test('a lapsed session is refused with the session wording, nothing written', async () => {
		const result = await post('username', { username: 'newcook' }, null);
		expect(result).toMatchObject({
			status: 401,
			data: { section: 'username', code: 'unauthenticated', error: SESSION_ENDED('save again') }
		});
		expect(changeUsernameMock).not.toHaveBeenCalled();
	});
});

describe('audience action', () => {
	test("stores the chosen default on the viewer's profile", async () => {
		const update = nextUpdate();
		const result = await post('audience', { defaultVisibility: 'friends', id: 'someone-else' });
		expect(updateMock).toHaveBeenCalledWith(profiles);
		expect(update.set).toHaveBeenCalledWith({ defaultVisibility: 'friends' });
		expect(update.where).toHaveBeenCalledWith(eq(profiles.id, 'me-1'));
		expect(result).toEqual({ section: 'audience', saved: true });
	});

	test('refuses anything but the three audiences', async () => {
		const result = await post('audience', { defaultVisibility: 'everyone' });
		expect(result).toMatchObject({ status: 400, data: { section: 'audience', code: 'invalid' } });
		expect(updateMock).not.toHaveBeenCalled();
	});

	test('a lapsed session is refused, nothing written', async () => {
		const result = await post('audience', { defaultVisibility: 'public' }, null);
		expect(result).toMatchObject({ status: 401, data: { code: 'unauthenticated' } });
		expect(updateMock).not.toHaveBeenCalled();
	});
});

describe('measurement action', () => {
	test.each([
		['metric', 'metric'],
		['us', 'us'],
		[AS_WRITTEN, null]
	])('%s stores %s', async (value, stored) => {
		const update = nextUpdate();
		const result = await post('measurement', { measurement: value });
		expect(update.set).toHaveBeenCalledWith({ measurement: stored });
		expect(result).toEqual({ section: 'measurement', saved: true });
	});

	test('refuses an unknown unit system', async () => {
		const result = await post('measurement', { measurement: 'imperial' });
		expect(result).toMatchObject({
			status: 400,
			data: { section: 'measurement', code: 'invalid' }
		});
		expect(updateMock).not.toHaveBeenCalled();
	});

	test('a lapsed session is refused, nothing written', async () => {
		const result = await post('measurement', { measurement: 'us' }, null);
		expect(result).toMatchObject({ status: 401, data: { code: 'unauthenticated' } });
		expect(updateMock).not.toHaveBeenCalled();
	});
});

describe('notifications action', () => {
	const muting = (muted: string[], user: typeof ME | null = ME) =>
		invokeAction(
			actions.notifications as never,
			formEvent({ fields: { muted }, locals: { user } })
		);

	test("stores the muted kinds, once each in the list's order, on the signed-in profile only", async () => {
		const [first, second] = NOTIFICATION_KINDS;
		const update = nextUpdate();
		const result = await muting([second, first, second]);
		expect(update.set).toHaveBeenCalledWith({ mutedNotifications: [first, second] });
		expect(update.where).toHaveBeenCalledWith(eq(profiles.id, 'me-1'));
		expect(result).toEqual({ section: 'notifications', saved: true });
	});

	test('nothing ticked mutes nothing', async () => {
		const update = nextUpdate();
		await muting([]);
		expect(update.set).toHaveBeenCalledWith({ mutedNotifications: [] });
	});

	test('refuses a kind that is not one, nothing written', async () => {
		const result = await muting([NOTIFICATION_KINDS[0], 'comments']);
		expect(result).toMatchObject({
			status: 400,
			data: { section: 'notifications', code: 'invalid' }
		});
		expect(updateMock).not.toHaveBeenCalled();
	});

	test('a lapsed session is refused, nothing written', async () => {
		const result = await muting([NOTIFICATION_KINDS[0]], null);
		expect(result).toMatchObject({
			status: 401,
			data: { section: 'notifications', code: 'unauthenticated' }
		});
		expect(updateMock).not.toHaveBeenCalled();
	});
});

describe('deleteAccount action', () => {
	function auth() {
		return {
			updateUser: vi.fn().mockResolvedValue({ error: null }),
			signOut: vi.fn().mockResolvedValue({ error: null })
		};
	}
	const del = (fields: Record<string, string>, user: typeof ME | null = ME, a = auth()) =>
		invokeAction(
			actions.deleteAccount as never,
			formEvent({ fields, locals: { user, supabase: { auth: a } } })
		);

	beforeEach(() => {
		findProfileMock.mockResolvedValue({ username: 'cook' });
		deleteAccountMock.mockResolvedValue('login_deleted');
	});

	test('the typed username, as sign-up normalises it, deletes the signed-in account and its login, signs out everywhere and lands on the goodbye', async () => {
		const a = auth();
		const result = await del({ confirmUsername: ' Cook ', id: 'someone-else' }, ME, a);
		expect(findProfileMock.mock.calls[0][0].where).toEqual(eq(profiles.id, 'me-1'));
		expect(deleteAccountMock).toHaveBeenCalledWith('me-1', { auth: a });
		expect(a.updateUser).not.toHaveBeenCalled();
		expect(a.signOut).toHaveBeenCalledWith({ scope: 'global' });
		expect(result).toMatchObject({ status: 303, location: ACCOUNT_DELETED });
	});

	test('a login the database would not delete is marked, so hooks.server.ts signs it out on any later sign-in', async () => {
		deleteAccountMock.mockResolvedValue('login_kept');
		const a = auth();
		const result = await del({ confirmUsername: 'cook' }, ME, a);
		expect(a.updateUser).toHaveBeenCalledWith({ data: { account_deleted: true } });
		expect(a.updateUser.mock.invocationCallOrder[0]).toBeGreaterThan(
			deleteAccountMock.mock.invocationCallOrder[0]
		);
		expect(a.signOut).toHaveBeenCalledWith({ scope: 'global' });
		expect(result).toMatchObject({ status: 303, location: ACCOUNT_DELETED });
	});

	test('any other name, or none, is refused under the step and nothing is deleted', async () => {
		for (const confirmUsername of ['cook2', '', 'someone']) {
			const a = auth();
			const result = await del({ confirmUsername }, ME, a);
			expect(result).toMatchObject({
				status: 400,
				data: { section: 'delete', code: 'invalid', error: TYPE_USERNAME }
			});
			expect(a.signOut).not.toHaveBeenCalled();
		}
		expect(deleteAccountMock).not.toHaveBeenCalled();
	});

	test('a lapsed session is a 401 with the delete wording, nothing deleted', async () => {
		const result = await del({ confirmUsername: 'cook' }, null);
		expect(result).toMatchObject({
			status: 401,
			data: { section: 'delete', code: 'unauthenticated', error: SESSION_ENDED('delete again') }
		});
		expect(deleteAccountMock).not.toHaveBeenCalled();
	});

	test('a failure part way keeps the session, so the cook can try again', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		deleteAccountMock.mockRejectedValue(new Error('db down'));
		const a = auth();
		const result = await del({ confirmUsername: 'cook' }, ME, a);
		expect(result).toMatchObject({
			status: 500,
			data: { section: 'delete', code: 'delete_failed', error: DELETE_FAILED }
		});
		expect(a.updateUser).not.toHaveBeenCalled();
		expect(a.signOut).not.toHaveBeenCalled();
		error.mockRestore();
	});
});
