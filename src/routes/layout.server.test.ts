import { vi, describe, test, expect, beforeEach } from 'vitest';
import { loadEvent, loadPage } from '#lib/testing/actions.js';
import { load } from './+layout.server';

const { findProfileMock, unseenCountMock } = vi.hoisted(() => ({
	findProfileMock: vi.fn(),
	unseenCountMock: vi.fn()
}));
vi.mock('#lib/server/db/index.js', () => ({
	db: { query: { profiles: { findFirst: findProfileMock } } }
}));
vi.mock('#lib/server/notifications.js', () => ({ unseenCount: unseenCountMock }));

beforeEach(() => {
	unseenCountMock.mockReset().mockResolvedValue(0);
});

describe('the dot by Friends', () => {
	test('lit when the signed-in cook has anything unseen', async () => {
		unseenCountMock.mockResolvedValue(3);
		const data = await loadPage<{ unseen: boolean }>(load, loadEvent({ user: { id: 'me' } }));
		expect(unseenCountMock).toHaveBeenCalledExactlyOnceWith({ id: 'me' });
		expect(data.unseen).toBe(true);
	});

	test('dark when nothing is', async () => {
		const data = await loadPage<{ unseen: boolean }>(load, loadEvent({ user: { id: 'me' } }));
		expect(data.unseen).toBe(false);
	});

	test('never read for a signed-out visitor', async () => {
		const data = await loadPage<{ unseen: boolean }>(load, loadEvent());
		expect(unseenCountMock).not.toHaveBeenCalled();
		expect(data.unseen).toBe(false);
	});

	// SvelteKit reruns a server load on navigation only for what it read; the
	// path makes it rerun on each page, so the dot is gone once Friends was seen.
	test('reads the path, so it reruns on every navigation', async () => {
		const read: PropertyKey[] = [];
		const event = loadEvent({ user: { id: 'me' } }) as { url: URL };
		event.url = new Proxy(event.url, {
			get: (url, key) => (read.push(key), Reflect.get(url, key))
		});
		await load(event as never);
		expect(read).toContain('pathname');
	});
});

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
