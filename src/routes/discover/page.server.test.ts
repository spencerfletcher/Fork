import { vi, describe, test, expect } from 'vitest';

const { loadDiscoverMock } = vi.hoisted(() => ({ loadDiscoverMock: vi.fn() }));
vi.mock('./discover.server.js', () => ({ loadDiscover: loadDiscoverMock }));

import { load } from './+page.server';

describe('/discover load', () => {
	test('works for everyone, as the viewer, titled Discover', async () => {
		loadDiscoverMock.mockResolvedValue({ recipes: [] });
		const user = { id: 'viewer-3' };
		const event = {
			url: new URL('http://localhost/discover?friends=1'),
			locals: { user }
		} as unknown as Parameters<typeof load>[0];

		const result = await load(event);

		expect(loadDiscoverMock).toHaveBeenCalledWith(event.url, user);
		expect(result).toMatchObject({ recipes: [], meta: { title: 'Discover' } });
	});
});
