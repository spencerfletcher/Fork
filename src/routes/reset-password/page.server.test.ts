import { vi, describe, test, expect, beforeEach } from 'vitest';
import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { invokeAction as invoke, formEvent } from '#lib/testing/actions.js';
import { actions, load, RECOVERY_COOKIE } from './+page.server';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// The Supabase client arrives on locals, as on login, so no module mock is needed.
const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();
const updateUser = vi.fn();
const supabase = { auth: { exchangeCodeForSession, verifyOtp, updateUser } };

const USER = { id: 'user-1' };

// The recovery cookie is what separates "arrived through the emailed link"
// from "happens to be signed in on this device".
const cookieJar = () => {
	const jar = new Map<string, string>();
	return {
		get: (k: string) => jar.get(k),
		set: vi.fn((k: string, v: string) => void jar.set(k, v)),
		delete: vi.fn((k: string) => void jar.delete(k))
	};
};

const makeEvent = (
	fields: Record<string, string>,
	user: unknown = USER,
	cookies = cookieJar()
) => ({ ...formEvent({ fields, locals: { supabase, user } }), cookies });

const runLoad = (query: string, user: unknown = null, cookies = cookieJar()) =>
	invoke(load as never, {
		url: new URL(`http://x/reset-password${query}`),
		locals: { supabase, user },
		cookies
	});

const recovered = () => {
	const c = cookieJar();
	c.set(RECOVERY_COOKIE, '1');
	return c;
};

// ─── load ─────────────────────────────────────────────────────────────────────

describe('reset-password load', () => {
	beforeEach(() => vi.clearAllMocks());

	test("trades the email link's code for a session, then drops it from the address", async () => {
		exchangeCodeForSession.mockResolvedValue({ error: null });

		const result = await runLoad('?code=abc');

		expect(exchangeCodeForSession).toHaveBeenCalledWith('abc');
		expect(isRedirect(result)).toBe(true);
		expect(result).toMatchObject({ status: 303, location: '/reset-password' });
	});

	test('verifies a token_hash link (the recovery template) the same way', async () => {
		verifyOtp.mockResolvedValue({ error: null });

		const result = await runLoad('?token_hash=hash-1&type=recovery');

		expect(verifyOtp).toHaveBeenCalledWith({ type: 'recovery', token_hash: 'hash-1' });
		expect(result).toMatchObject({ status: 303, location: '/reset-password' });
	});

	test('a used or expired link shows the expired state, even to a signed-in visitor', async () => {
		exchangeCodeForSession.mockResolvedValue({ error: { message: 'invalid flow state' } });

		expect(await runLoad('?code=old', USER)).toMatchObject({ linkValid: false });
	});

	test('a good link leaves a short-lived recovery cookie behind', async () => {
		exchangeCodeForSession.mockResolvedValue({ error: null });
		const cookies = cookieJar();
		await runLoad('?code=abc', null, cookies);
		expect(cookies.set).toHaveBeenCalledWith(
			RECOVERY_COOKIE,
			'1',
			expect.objectContaining({ path: '/reset-password', httpOnly: true, maxAge: 15 * 60 })
		);
	});

	test('with no link, the form is offered only to a session that came through the link', async () => {
		expect(await runLoad('', USER, recovered())).toMatchObject({
			linkValid: true,
			meta: { title: 'Reset password' }
		});
		// A session that is merely signed in on this device (a shared kitchen
		// tablet) does not get a password form.
		expect(await runLoad('', USER)).toMatchObject({ linkValid: false });
		// Supabase's own error redirect (?error_code=otp_expired) lands here too.
		expect(await runLoad('?error_code=otp_expired')).toMatchObject({ linkValid: false });
		expect(exchangeCodeForSession).not.toHaveBeenCalled();
	});
});

// ─── default action ───────────────────────────────────────────────────────────

describe('reset-password action', () => {
	beforeEach(() => vi.clearAllMocks());

	test('refuses a password under 6 characters without calling Supabase', async () => {
		const result = await invoke(actions.default as never, makeEvent({ password: '12345' }));

		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Use at least 6 characters.' }
		});
		expect(updateUser).not.toHaveBeenCalled();
	});

	test('refuses a visitor with no session: the link has expired', async () => {
		const result = await invoke(
			actions.default as never,
			makeEvent({ password: 'new-secret' }, null)
		);

		expect(result).toMatchObject({
			status: 401,
			data: { message: 'This link has expired. Ask for a new one.' }
		});
		expect(updateUser).not.toHaveBeenCalled();
	});

	test('refuses a signed-in session that did not come through the link', async () => {
		const result = await invoke(actions.default as never, makeEvent({ password: 'new-secret' }));

		expect(result).toMatchObject({ status: 401 });
		expect(updateUser).not.toHaveBeenCalled();
	});

	test('sets the password, spends the recovery cookie and sends the cook home, signed in', async () => {
		updateUser.mockResolvedValue({ data: { user: USER }, error: null });
		const cookies = recovered();

		const result = await invoke(
			actions.default as never,
			makeEvent({ password: 'new-secret' }, USER, cookies)
		);

		expect(updateUser).toHaveBeenCalledWith({ password: 'new-secret' });
		expect(cookies.delete).toHaveBeenCalledWith(RECOVERY_COOKIE, { path: '/reset-password' });
		expect(isRedirect(result)).toBe(true);
		expect(result).toMatchObject({ status: 303, location: '/' });
	});

	test('the current password is named as such', async () => {
		updateUser.mockResolvedValue({
			data: { user: null },
			error: { status: 422, code: 'same_password', message: 'New password should be different' }
		});

		const result = await invoke(
			actions.default as never,
			makeEvent({ password: 'old-secret' }, USER, recovered())
		);

		expect(result).toMatchObject({
			status: 422,
			data: { message: "That's your current password. Choose a new one." }
		});
	});

	test("any other Supabase error gets Fork's sentence, with a 500 when there is no status", async () => {
		updateUser.mockResolvedValue({ data: { user: null }, error: { message: 'Unexpected' } });

		const result = await invoke(
			actions.default as never,
			makeEvent({ password: 'new-secret' }, USER, recovered())
		);

		expect(result).toMatchObject({
			status: 500,
			data: { message: 'Could not set the password. Try again.' }
		});
	});
});
