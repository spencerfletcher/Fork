import { vi, describe, test, expect, beforeEach } from 'vitest';
import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { invokeAction as invoke, formEvent, cookieJar } from '#lib/testing/actions.js';
import { CONFIRM_COOKIE } from '#lib/server/confirmEmail.js';
import { actions, load } from './+page.server';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signInWithPassword = vi.fn();

/** Builds a minimal RequestEvent-like object for the login action. */
const makeEvent = (fields: Record<string, string>, cookies = cookieJar()) => ({
	...formEvent({ fields, locals: { supabase: { auth: { signInWithPassword } } } }),
	cookies
});

// ─── default action ───────────────────────────────────────────────────────────

describe('login action', () => {
	beforeEach(() => vi.clearAllMocks());

	test('returns a 400 failure with a message when fields are missing', async () => {
		const result = await invoke(actions.default as never, makeEvent({ email: 'a@b.com' }));

		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Email and password are required.', code: 'invalid' }
		});
		expect(signInWithPassword).not.toHaveBeenCalled();
	});

	test("maps bad credentials to a 401 with the site's own sentence", async () => {
		signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });

		const result = await invoke(
			actions.default as never,
			makeEvent({ email: 'a@b.com', password: 'wrong' })
		);

		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({
			status: 401,
			data: { error: "That email and password don't match.", code: 'auth_failed' }
		});
	});

	test('maps any other Supabase error to a generic sentence, never the raw message', async () => {
		signInWithPassword.mockResolvedValue({ error: { message: 'Email rate limit exceeded' } });

		const result = await invoke(
			actions.default as never,
			makeEvent({ email: 'a@b.com', password: 'right' })
		);

		expect(result).toMatchObject({
			status: 401,
			data: { error: 'Could not log in. Try again.', code: 'auth_failed' }
		});
	});

	// Supabase says so only once the password matched, so it tells a stranger nothing.
	test('an unconfirmed account is told so, and the confirm page will name its address', async () => {
		signInWithPassword.mockResolvedValue({
			error: { status: 400, code: 'email_not_confirmed', message: 'Email not confirmed' }
		});
		const cookies = cookieJar();

		const result = await invoke(
			actions.default as never,
			makeEvent({ email: 'a@b.com', password: 'right' }, cookies)
		);

		expect(result).toMatchObject({
			status: 401,
			data: {
				error: 'Confirm your email first: open the link we sent you.',
				code: 'auth_failed',
				unconfirmed: true
			}
		});
		expect(cookies.set).toHaveBeenCalledWith(CONFIRM_COOKIE, 'a@b.com', expect.anything());
	});

	test('logging in forgets the address the confirm page held', async () => {
		signInWithPassword.mockResolvedValue({ error: null });
		const cookies = cookieJar({ [CONFIRM_COOKIE]: 'a@b.com' });

		await invoke(
			actions.default as never,
			makeEvent({ email: 'a@b.com', password: 'right' }, cookies)
		);

		expect(cookies.delete).toHaveBeenCalledWith(CONFIRM_COOKIE, { path: '/' });
	});

	test('redirects to a local redirectTo on success, and home when it is off-site', async () => {
		signInWithPassword.mockResolvedValue({ error: null });
		const local = await invoke(
			actions.default as never,
			makeEvent({ email: 'a@b.com', password: 'right', redirectTo: '/recipes/cookies?version=2' })
		);
		expect(local).toMatchObject({ status: 303, location: '/recipes/cookies?version=2' });
		const offsite = await invoke(
			actions.default as never,
			makeEvent({ email: 'a@b.com', password: 'right', redirectTo: '//evil.example' })
		);
		expect(offsite).toMatchObject({ status: 303, location: '/' });
	});

	test('redirects home on success', async () => {
		signInWithPassword.mockResolvedValue({ error: null });

		const result = await invoke(
			actions.default as never,
			makeEvent({ email: 'a@b.com', password: 'right' })
		);

		expect(isRedirect(result)).toBe(true);
		expect(result).toMatchObject({ status: 303, location: '/' });
	});
});

describe('login load', () => {
	test('a signed-in visitor goes to a local redirectTo, else home', async () => {
		const signedIn = (query: string) =>
			invoke(load as never, {
				locals: { user: { id: 'u1' } },
				url: new URL(`http://x/login${query}`)
			});
		expect(await signedIn('?redirectTo=%2Ffavorites%3Fq%3Dsoup')).toMatchObject({
			status: 303,
			location: '/favorites?q=soup'
		});
		expect(await signedIn('?redirectTo=https%3A%2F%2Fevil.example')).toMatchObject({
			location: '/'
		});
		expect(await signedIn('?redirectTo=%2F%5Cevil.example')).toMatchObject({ location: '/' });
		expect(await signedIn('')).toMatchObject({ location: '/' });
	});

	test('hands a local redirectTo to the page and drops an off-site one', async () => {
		const run = (redirectTo: string) =>
			load({
				locals: { user: null },
				url: new URL(`http://x/login?redirectTo=${encodeURIComponent(redirectTo)}`)
			} as never);
		expect(await run('/recipes/cookies')).toMatchObject({ redirectTo: '/recipes/cookies' });
		expect(await run('https://evil.example')).toMatchObject({ redirectTo: null });
	});

	test('the tab says "Log in", the verb the navbar and the button use', async () => {
		const result = await load({ locals: { user: null }, url: new URL('http://x/login') } as never);
		expect(result).toMatchObject({ meta: { title: 'Log in' } });
	});
});
