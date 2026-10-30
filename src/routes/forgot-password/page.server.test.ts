import { vi, describe, test, expect, beforeEach } from 'vitest';
import { isActionFailure } from '@sveltejs/kit';
import { invokeAction as invoke, formEvent } from '#lib/testing/actions.js';
import { actions, load } from './+page.server';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// The Supabase client arrives on locals, as on login, so no module mock is needed.
const resetPasswordForEmail = vi.fn();

const ORIGIN = 'https://cooks.example';

/** A form-action event on this site's origin, so the email's link can be checked. */
const makeEvent = (fields: Record<string, string>) => ({
	...formEvent({ fields, locals: { supabase: { auth: { resetPasswordForEmail } } } }),
	url: new URL(`${ORIGIN}/forgot-password`)
});

// ─── default action ───────────────────────────────────────────────────────────

describe('forgot-password action', () => {
	beforeEach(() => vi.clearAllMocks());

	test('returns a 400 failure without calling Supabase when the email is missing', async () => {
		const result = await invoke(actions.default as never, makeEvent({ email: '  ' }));

		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({ status: 400, data: { message: 'Enter your email.' } });
		expect(resetPasswordForEmail).not.toHaveBeenCalled();
	});

	test("asks Supabase for a reset email whose link lands on this site's /reset-password", async () => {
		resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

		const result = await invoke(actions.default as never, makeEvent({ email: ' cook@b.com ' }));

		expect(resetPasswordForEmail).toHaveBeenCalledWith('cook@b.com', {
			redirectTo: `${ORIGIN}/reset-password`
		});
		// The same answer whether or not the address has an account.
		expect(result).toEqual({ sent: true, email: 'cook@b.com' });
	});

	test("maps a Supabase error to Fork's sentence with its status, never the raw message", async () => {
		resetPasswordForEmail.mockResolvedValue({
			data: null,
			error: { status: 429, message: 'Email rate limit exceeded' }
		});

		const result = await invoke(actions.default as never, makeEvent({ email: 'cook@b.com' }));

		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({
			status: 429,
			data: { message: 'Could not send the link. Try again in a minute.' }
		});
	});

	test('falls back to 500 when Supabase gives no status', async () => {
		resetPasswordForEmail.mockResolvedValue({ data: null, error: { message: 'Unexpected' } });

		const result = await invoke(actions.default as never, makeEvent({ email: 'cook@b.com' }));

		expect(result).toMatchObject({ status: 500 });
	});
});

describe('forgot-password load', () => {
	test('the tab title matches the h1', async () => {
		expect(await load({} as never)).toMatchObject({ meta: { title: 'Forgot your password?' } });
	});
});
