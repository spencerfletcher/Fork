import { vi, describe, test, expect, beforeEach } from 'vitest';
import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { invokeAction as invoke, formEvent } from '#lib/testing/actions.js';
import { actions } from './+page.server';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signInWithPassword = vi.fn();

/** Builds a minimal RequestEvent-like object for the login action. */
const makeEvent = (fields: Record<string, string>) =>
	formEvent({ fields, locals: { supabase: { auth: { signInWithPassword } } } });

// ─── default action ───────────────────────────────────────────────────────────

describe('login action', () => {
	beforeEach(() => vi.clearAllMocks());

	test('returns a 400 failure with a message when fields are missing', async () => {
		const result = await invoke(actions.default as never, makeEvent({ email: 'a@b.com' }));

		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Email and password are required.' }
		});
		expect(signInWithPassword).not.toHaveBeenCalled();
	});

	test('returns a 401 failure with the Supabase message on bad credentials', async () => {
		signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });

		const result = await invoke(
			actions.default as never,
			makeEvent({ email: 'a@b.com', password: 'wrong' })
		);

		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({ status: 401, data: { message: 'Invalid login credentials' } });
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
