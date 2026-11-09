import { vi, describe, test, expect, beforeEach } from 'vitest';

const { loadDiscoverMock } = vi.hoisted(() => ({ loadDiscoverMock: vi.fn() }));
vi.mock('./discover/discover.server.js', () => ({ loadDiscover: loadDiscoverMock }));

import { load } from './+page.server';

const makeEvent = (user: { id: string } | null, search = '') =>
	({
		url: new URL(`http://localhost/${search}`),
		locals: { user }
	}) as unknown as Parameters<typeof load>[0];

beforeEach(() => {
	vi.clearAllMocks();
	loadDiscoverMock.mockResolvedValue({ recipes: [{ id: 4 }] });
});

describe('/ load', () => {
	test('signed in, home is the Cookbook', async () => {
		await expect(load(makeEvent({ id: 'u1' }))).rejects.toMatchObject({
			status: 302,
			location: '/cookbook'
		});
		expect(loadDiscoverMock).not.toHaveBeenCalled();
	});

	test('signed out, home is Discover for a visitor, with its filters', async () => {
		const event = makeEvent(null, '?tags=baking');

		const result = await load(event);

		expect(result).toEqual({ recipes: [{ id: 4 }] });
		expect(loadDiscoverMock).toHaveBeenCalledWith(event.url, null);
	});
});
