import { vi, describe, test, expect } from 'vitest';
import { loadEvent, loadPage } from '#lib/testing/actions.js';
import { load } from './+layout.server';

const { findProfileMock } = vi.hoisted(() => ({ findProfileMock: vi.fn() }));
vi.mock('#lib/server/db/index.js', () => ({
	db: { query: { profiles: { findFirst: findProfileMock } } }
}));

describe('root layout load', () => {
	// Every page reads the viewer's settings from here: the recipe page's
	// quantities will read `measurement`, the new-recipe page `defaultVisibility`.
	test("hands every page the viewer's whole profile, settings included", async () => {
		const row = { id: 'me', username: 'cook', defaultVisibility: 'friends', measurement: 'us' };
		findProfileMock.mockResolvedValue(row);
		const data = await loadPage<{ profile: unknown }>(load, loadEvent({ user: { id: 'me' } }));
		expect(findProfileMock.mock.calls[0][0]).not.toHaveProperty('columns');
		expect(data.profile).toEqual(row);
	});

	test('signed out there is no profile', async () => {
		const data = await loadPage<{ profile: unknown; user: unknown }>(load, loadEvent());
		expect(data.profile).toBeNull();
		expect(data.user).toBeNull();
	});

	// The page data is serialised into every page's HTML; the session's tokens,
	// metadata and sign-in history stay on the server.
	test('hands the page only the viewer id and email of the auth user', async () => {
		findProfileMock.mockResolvedValue(null);
		const authUser = {
			id: 'me',
			email: 'cook@example.com',
			phone: '+15550100',
			app_metadata: { provider: 'email' },
			user_metadata: { full_name: 'A Cook' },
			identities: [{ id: 'x' }],
			last_sign_in_at: '2026-11-01T00:00:00Z'
		};
		const data = await loadPage<{ user: unknown }>(load, loadEvent({ user: authUser }));
		expect(data.user).toEqual({ id: 'me', email: 'cook@example.com' });
	});
});
