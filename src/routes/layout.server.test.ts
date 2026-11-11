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
		const data = await loadPage<{ profile: unknown }>(load, loadEvent());
		expect(data.profile).toBeNull();
	});
});
