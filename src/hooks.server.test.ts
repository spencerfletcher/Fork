import { describe, test, expect, vi, beforeEach } from 'vitest';

const { getUser, signOut } = vi.hoisted(() => ({ getUser: vi.fn(), signOut: vi.fn() }));
vi.mock('@supabase/ssr', () => ({
	createServerClient: () => ({ auth: { getUser, signOut } })
}));
vi.mock('$app/env/public', () => ({
	PUBLIC_SUPABASE_URL: 'http://x',
	PUBLIC_SUPABASE_ANON_KEY: 'k'
}));

import { handle } from './hooks.server';

async function run() {
	const locals: Record<string, unknown> = {};
	const event = { locals, cookies: { getAll: () => [] }, url: new URL('http://x/') };
	await handle({ event, resolve: async () => new Response('') } as never);
	return locals;
}

beforeEach(() => vi.clearAllMocks());

describe('handle', () => {
	test('a signed-in user is the request’s user', async () => {
		const user = { id: 'u1', user_metadata: {} };
		getUser.mockResolvedValue({ data: { user } });
		expect((await run()).user).toBe(user);
		expect(signOut).not.toHaveBeenCalled();
	});

	// Settings' Delete account leaves the auth user (no service key) marked:
	// signing in again must not make it a new, empty profile.
	test('an account deleted in Settings is signed out and treated as signed out', async () => {
		getUser.mockResolvedValue({
			data: { user: { id: 'u1', user_metadata: { account_deleted: true } } }
		});
		expect((await run()).user).toBeNull();
		expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
	});
});
