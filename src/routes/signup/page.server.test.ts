import { vi, describe, test, expect, beforeEach } from 'vitest';
import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { invokeAction as invoke, formEvent } from '#lib/testing/actions.js';
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
const makeEvent = (fields: Record<string, string>) =>
	formEvent({ fields, locals: { supabase: { auth: { signUp } } } });

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
			data: { message: 'Email and password are required.' }
		});
		expect(signUp).not.toHaveBeenCalled();
	});

	test.each(['', 'ab', 'a'.repeat(31), 'Jane Doe', 'jane.doe', 'jané'])(
		'refuses the username %j as a field error before calling Supabase',
		async (username) => {
			const result = await invoke(actions.default as never, makeEvent({ ...valid, username }));

			expect(result).toMatchObject({ status: 400, data: { errors: { username: USERNAME_RULE } } });
			expect(signUp).not.toHaveBeenCalled();
		}
	);

	test('refuses a taken username as a field error before calling Supabase', async () => {
		usernameTaken.mockResolvedValue(true);

		const result = await invoke(actions.default as never, makeEvent(valid));

		expect(usernameTaken).toHaveBeenCalledWith('cook');
		expect(result).toMatchObject({
			status: 400,
			data: { errors: { username: 'That username is taken' } }
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
			data: { message: 'Could not create the account. Try again.' }
		});
		expect(result).not.toMatchObject({ data: { registered: true } });
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

		expect(signUp).toHaveBeenCalledWith({ email: 'cook@b.com', password: 'pw' });
		expect(ensureProfile).toHaveBeenCalledWith({ id: 'user-1' }, 'cook');
		expect(isRedirect(result)).toBe(true);
		expect(result).toMatchObject({ status: 303, location: '/confirm-email' });
	});
});

describe('signup load', () => {
	const run = (query = '') =>
		load({ locals: { user: null }, url: new URL(`http://x/signup${query}`) } as never);

	test('the tab title matches the h1', async () => {
		expect(await run()).toMatchObject({ meta: { title: 'Create an account' } });
	});

	test('carries a local redirectTo from the login page, so Log in can hand it back', async () => {
		expect(await run('?redirectTo=%2Ffavorites')).toMatchObject({ redirectTo: '/favorites' });
		expect(await run('?redirectTo=%2F%2Fevil.example')).toMatchObject({ redirectTo: null });
	});
});
