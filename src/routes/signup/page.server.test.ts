import { vi, describe, test, expect, beforeEach } from 'vitest';
import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { invokeAction as invoke, formEvent, cookieJar } from '#lib/testing/actions.js';
import { CONFIRM_COOKIE } from '#lib/server/confirmEmail.js';
import { actions, load } from './+page.server';
import { USERNAME_MESSAGE } from '#lib/auth/rules.js';

// ─── Hoisted mocks (must be available inside vi.mock factory) ─────────────────

const { ensureProfile, usernameTaken } = vi.hoisted(() => ({
	ensureProfile: vi.fn().mockResolvedValue(undefined),
	usernameTaken: vi.fn().mockResolvedValue(false)
}));

vi.mock('#lib/server/profiles.js', () => ({ ensureProfile, usernameTaken }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signUp = vi.fn();

/** Builds a minimal RequestEvent-like object for the signup action. */
const makeEvent = (fields: Record<string, string>, query = '', cookies = cookieJar()) => ({
	...formEvent({ fields, locals: { supabase: { auth: { signUp } } } }),
	url: new URL(`http://x/signup${query}`),
	cookies
});

const valid = { email: 'cook@b.com', username: 'cook', password: 'pw' };

const USERNAME_RULE = USERNAME_MESSAGE;

// ─── default action ───────────────────────────────────────────────────────────

describe('signup action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		usernameTaken.mockResolvedValue(false);
	});

	test('returns a 400 failure with a message when fields are missing', async () => {
		const result = await invoke(actions.default as never, makeEvent({ password: 'pw' }));

		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Email and password are required.', code: 'invalid' }
		});
		expect(signUp).not.toHaveBeenCalled();
	});

	test.each(['', 'ab', 'a'.repeat(31), 'Jane Doe', 'jane.doe', 'jané'])(
		'refuses the username %j as a field error before calling Supabase',
		async (username) => {
			const result = await invoke(actions.default as never, makeEvent({ ...valid, username }));

			expect(result).toMatchObject({
				status: 400,
				data: { error: USERNAME_RULE, field: 'username', code: 'invalid' }
			});
			expect(signUp).not.toHaveBeenCalled();
		}
	);

	test('refuses a taken username as a field error before calling Supabase', async () => {
		usernameTaken.mockResolvedValue(true);

		const result = await invoke(actions.default as never, makeEvent(valid));

		expect(usernameTaken).toHaveBeenCalledWith('cook');
		expect(result).toMatchObject({
			status: 400,
			data: { error: 'That username is taken', field: 'username', code: 'invalid' }
		});
		expect(signUp).not.toHaveBeenCalled();
	});

	test('lowercases and trims the username before checking and storing it', async () => {
		signUp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

		await invoke(actions.default as never, makeEvent({ ...valid, username: ' Cook_1 ' }));

		expect(usernameTaken).toHaveBeenCalledWith('cook_1');
		expect(ensureProfile).toHaveBeenCalledWith({ id: 'user-1' }, 'cook_1');
	});

	test("returns Fork's wording with the Supabase status when sign-up fails", async () => {
		signUp.mockResolvedValue({
			data: { user: null },
			error: { status: 429, message: 'Rate limit exceeded' }
		});

		const result = await invoke(actions.default as never, makeEvent(valid));

		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({
			status: 429,
			data: { error: 'Could not create the account. Try again.', code: 'auth_failed' }
		});
		expect(result).not.toMatchObject({ data: { registered: true, code: 'auth_failed' } });
	});

	test('falls back to 500 when Supabase gives no status', async () => {
		signUp.mockResolvedValue({ data: { user: null }, error: { message: 'Unexpected failure' } });

		const result = await invoke(actions.default as never, makeEvent(valid));

		expect(result).toMatchObject({ status: 500 });
	});

	test('an already registered email is flagged so the page can offer Log in', async () => {
		signUp.mockResolvedValue({
			data: { user: null },
			error: { status: 422, message: 'User already registered' }
		});

		const result = await invoke(actions.default as never, makeEvent(valid));

		expect(result).toMatchObject({ status: 422, data: { registered: true } });
		expect(ensureProfile).not.toHaveBeenCalled();
	});

	test('creates a profile with the chosen username and redirects to the confirm-email page', async () => {
		signUp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

		const result = await invoke(actions.default as never, makeEvent(valid));

		// The link lands on the confirm page, which trades it for a session.
		expect(signUp).toHaveBeenCalledWith({
			email: 'cook@b.com',
			password: 'pw',
			options: { emailRedirectTo: 'http://x/confirm-email' }
		});
		expect(ensureProfile).toHaveBeenCalledWith({ id: 'user-1' }, 'cook');
		expect(isRedirect(result)).toBe(true);
		expect(result).toMatchObject({ status: 303, location: '/confirm-email' });
	});

	// No personal data in a URL: the confirm page reads the address from an httpOnly cookie.
	test('remembers the address for the confirm page in a cookie, never in the redirect', async () => {
		signUp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
		const cookies = cookieJar();

		const result = await invoke(
			actions.default as never,
			makeEvent(valid, '?redirectTo=%2Ffavorites', cookies)
		);

		expect(cookies.set).toHaveBeenCalledWith(CONFIRM_COOKIE, 'cook@b.com', {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 3600
		});
		expect(String(result.location)).not.toContain('cook');
	});

	test('a refused sign-up remembers nothing', async () => {
		signUp.mockResolvedValue({ data: null, error: { status: 500, message: 'x' } });
		const cookies = cookieJar();

		await invoke(actions.default as never, makeEvent(valid, '', cookies));

		expect(cookies.set).not.toHaveBeenCalled();
	});

	// The form posts to its own URL, so the login page's redirectTo is still there.
	test('hands a local redirectTo on to the confirm-email page and drops an off-site one', async () => {
		signUp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

		const local = await invoke(
			actions.default as never,
			makeEvent(valid, '?redirectTo=%2Frecipes%2Fcookies%3Fversion%3D2')
		);
		expect(local).toMatchObject({
			status: 303,
			location: '/confirm-email?redirectTo=%2Frecipes%2Fcookies%3Fversion%3D2'
		});

		const offsite = await invoke(
			actions.default as never,
			makeEvent(valid, '?redirectTo=%2F%2Fevil.example')
		);
		expect(offsite).toMatchObject({ status: 303, location: '/confirm-email' });
	});
});

describe('signup load', () => {
	const run = (query = '', cookies = cookieJar()) =>
		load({ locals: { user: null }, url: new URL(`http://x/signup${query}`), cookies } as never);

	test('a signed-in visitor goes to a local redirectTo, else home', async () => {
		const signedIn = (query: string) =>
			invoke(load as never, {
				locals: { user: { id: 'u1' } },
				url: new URL(`http://x/signup${query}`)
			});
		expect(await signedIn('?redirectTo=%2Ffavorites%3Fq%3Dsoup')).toMatchObject({
			status: 303,
			location: '/favorites?q=soup'
		});
		expect(await signedIn('?redirectTo=%2F%2Fevil.example')).toMatchObject({ location: '/' });
		expect(await signedIn('?redirectTo=%2F%5Cevil.example')).toMatchObject({ location: '/' });
		expect(await signedIn('')).toMatchObject({ location: '/' });
	});

	test('the tab title matches the h1', async () => {
		expect(await run()).toMatchObject({ meta: { title: 'Create an account' } });
	});

	test('carries a local redirectTo from the login page, so Log in can hand it back', async () => {
		expect(await run('?redirectTo=%2Ffavorites')).toMatchObject({ redirectTo: '/favorites' });
		expect(await run('?redirectTo=%2F%2Fevil.example')).toMatchObject({ redirectTo: null });
	});

	// "Wrong address? Sign up again" from the confirm page.
	test('hands the remembered address back, so a mistyped one can be fixed', async () => {
		expect(await run('', cookieJar({ [CONFIRM_COOKIE]: 'cook@b.con' }))).toMatchObject({
			email: 'cook@b.con'
		});
		expect(await run()).toMatchObject({ email: null });
	});
});
