import { vi, describe, test, expect, beforeEach } from 'vitest';
import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { invokeAction as invoke } from '#lib/testing/actions.js';
import { actions } from './+page.server';

// ─── Hoisted mocks (must be available inside vi.mock factory) ─────────────────

const { ensureProfile } = vi.hoisted(() => ({
	ensureProfile: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('#lib/server/profiles.js', () => ({ ensureProfile }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signUp = vi.fn();

/** Builds a minimal RequestEvent-like object for the signup action. */
function makeEvent(fields: Record<string, string>) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) fd.append(k, v);
	return {
		request: { formData: vi.fn().mockResolvedValue(fd) },
		locals: { supabase: { auth: { signUp } } }
	};
}

// ─── default action ───────────────────────────────────────────────────────────

describe('signup action', () => {
	beforeEach(() => vi.clearAllMocks());

	test('returns a 400 failure with a message when fields are missing', async () => {
		const result = await invoke(actions.default as never, makeEvent({ password: 'pw' }));

		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Email and password are required.' }
		});
		expect(signUp).not.toHaveBeenCalled();
	});

	test('returns a failure with the Supabase status and message', async () => {
		signUp.mockResolvedValue({
			data: { user: null },
			error: { status: 422, message: 'User already registered' }
		});

		const result = await invoke(
			actions.default as never,
			makeEvent({ email: 'a@b.com', password: 'pw' })
		);

		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({ status: 422, data: { message: 'User already registered' } });
	});

	test('falls back to 500 when Supabase gives no status', async () => {
		signUp.mockResolvedValue({ data: { user: null }, error: { message: 'Unexpected failure' } });

		const result = await invoke(
			actions.default as never,
			makeEvent({ email: 'a@b.com', password: 'pw' })
		);

		expect(result).toMatchObject({ status: 500, data: { message: 'Unexpected failure' } });
	});

	test('creates a profile and redirects to the confirm-email page on success', async () => {
		signUp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

		const result = await invoke(
			actions.default as never,
			makeEvent({ email: 'cook@b.com', password: 'pw' })
		);

		expect(ensureProfile).toHaveBeenCalledWith({ id: 'user-1' });
		expect(isRedirect(result)).toBe(true);
		expect(result).toMatchObject({ status: 303, location: '/confirm-email' });
	});
});
