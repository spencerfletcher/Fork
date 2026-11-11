import { vi, describe, test, expect, beforeEach } from 'vitest';
import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { invokeAction as invoke, formEvent, cookieJar } from '#lib/testing/actions.js';
import { actions, load } from './+page.server';
import { CONFIRM_COOKIE } from '#lib/server/confirmEmail.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();
const resend = vi.fn();
const supabase = { auth: { exchangeCodeForSession, verifyOtp, resend } };

const ORIGIN = 'https://cooks.example';

const signedUp = () => cookieJar({ [CONFIRM_COOKIE]: 'cook@b.com' });

const runLoad = (query = '', cookies = cookieJar()) =>
	invoke(load as never, {
		url: new URL(`${ORIGIN}/confirm-email${query}`),
		locals: { supabase },
		cookies
	});

const makeEvent = (fields: Record<string, string>, cookies = cookieJar()) => ({
	...formEvent({ fields, locals: { supabase } }),
	url: new URL(`${ORIGIN}/confirm-email`),
	cookies
});

beforeEach(() => vi.clearAllMocks());

// ─── load ─────────────────────────────────────────────────────────────────────

describe('confirm-email load', () => {
	test('names the address sign-up remembered, with a noindex tab titled as the h1', async () => {
		expect(await runLoad('', signedUp())).toMatchObject({
			state: 'sent',
			email: 'cook@b.com',
			meta: { title: 'Check your email', noindex: true }
		});
	});

	test('without the cookie the page has no address to name', async () => {
		expect(await runLoad()).toMatchObject({ state: 'sent', email: null });
	});

	test('carries a local redirectTo from signup and drops an off-site one', async () => {
		expect(await runLoad('?redirectTo=%2Ffavorites')).toMatchObject({ redirectTo: '/favorites' });
		expect(await runLoad('?redirectTo=%2F%2Fevil.example')).toMatchObject({ redirectTo: null });
	});

	test('a confirm link with a code signs the cook in, forgets the address and goes home', async () => {
		exchangeCodeForSession.mockResolvedValue({ error: null });
		const cookies = signedUp();

		const result = await runLoad('?code=abc', cookies);

		expect(exchangeCodeForSession).toHaveBeenCalledWith('abc');
		expect(isRedirect(result)).toBe(true);
		expect(result).toMatchObject({ status: 303, location: '/' });
		expect(cookies.delete).toHaveBeenCalledWith(CONFIRM_COOKIE, { path: '/' });
	});

	test('a token_hash link is verified as an email confirmation', async () => {
		verifyOtp.mockResolvedValue({ error: null });

		const result = await runLoad('?token_hash=th&type=email');

		expect(verifyOtp).toHaveBeenCalledWith({ type: 'email', token_hash: 'th' });
		expect(result).toMatchObject({ status: 303, location: '/' });
	});

	// Supabase only issues the code after confirming the address; the trade
	// fails on another device, which lacks the sign-up's code verifier.
	test('a code that cannot be traded still means the address is confirmed', async () => {
		exchangeCodeForSession.mockResolvedValue({ error: { message: 'code verifier missing' } });

		expect(await runLoad('?code=abc')).toMatchObject({
			state: 'confirmed',
			meta: { title: 'Email confirmed', noindex: true }
		});
	});

	test('a dead token_hash reads as an expired link', async () => {
		verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } });

		expect(await runLoad('?token_hash=th&type=email')).toMatchObject({
			state: 'expired',
			meta: { title: 'Link expired' }
		});
	});

	test("Supabase's error redirect for an expired or used link reads as expired, address kept", async () => {
		expect(
			await runLoad(
				'?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid',
				signedUp()
			)
		).toMatchObject({ state: 'expired', email: 'cook@b.com' });
	});
});

// ─── default action (resend) ──────────────────────────────────────────────────

describe('confirm-email resend', () => {
	test('refuses an empty address without calling Supabase when no address is remembered', async () => {
		const result = await invoke(actions.default as never, makeEvent({ email: '  ' }));

		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Enter your email.', code: 'invalid' }
		});
		expect(resend).not.toHaveBeenCalled();
	});

	test('resends to the remembered address, the link landing back on this page', async () => {
		resend.mockResolvedValue({ data: {}, error: null });

		const result = await invoke(actions.default as never, makeEvent({}, signedUp()));

		expect(resend).toHaveBeenCalledWith({
			type: 'signup',
			email: 'cook@b.com',
			options: { emailRedirectTo: `${ORIGIN}/confirm-email` }
		});
		expect(result).toEqual({ sent: true, email: 'cook@b.com' });
	});

	// Supabase answers the same for an unknown or already confirmed address, so
	// the page's answer cannot tell them apart either.
	test('a typed address gets the same answer whether or not it has an account', async () => {
		resend.mockResolvedValue({ data: {}, error: null });

		const result = await invoke(actions.default as never, makeEvent({ email: ' who@b.com ' }));

		expect(resend).toHaveBeenCalledWith(expect.objectContaining({ email: 'who@b.com' }));
		expect(result).toEqual({ sent: true, email: 'who@b.com' });
	});

	test("Supabase's minimum interval becomes the wait, in Fork's words", async () => {
		resend.mockResolvedValue({
			data: null,
			error: {
				status: 429,
				code: 'over_email_send_rate_limit',
				message: 'For security purposes, you can only request this after 42 seconds.'
			}
		});

		const result = await invoke(actions.default as never, makeEvent({}, signedUp()));

		expect(result).toMatchObject({
			status: 429,
			data: { error: 'Wait 42 seconds before asking again.', code: 'rate_limited' }
		});
	});

	test('the hourly mail cap, which names no wait, says so', async () => {
		resend.mockResolvedValue({
			data: null,
			error: {
				status: 429,
				code: 'over_email_send_rate_limit',
				message: 'email rate limit exceeded'
			}
		});

		const result = await invoke(actions.default as never, makeEvent({}, signedUp()));

		expect(result).toMatchObject({
			status: 429,
			data: {
				error: "We've sent too many emails for now. Try again in an hour.",
				code: 'rate_limited'
			}
		});
	});

	test('any other error is a generic sentence with its status, never the raw message', async () => {
		resend.mockResolvedValue({ data: null, error: { status: 500, message: 'smtp down' } });

		const result = await invoke(actions.default as never, makeEvent({}, signedUp()));

		expect(result).toMatchObject({
			status: 500,
			data: { error: 'Could not send the link. Try again in a minute.', code: 'auth_failed' }
		});
	});
});
