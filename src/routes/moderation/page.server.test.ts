import { vi, describe, test, expect, beforeEach } from 'vitest';
import { invokeAction, loadEvent, loadPage } from '#lib/testing/actions.js';

const moderation = vi.hoisted(() => ({
	isModerator: vi.fn(),
	moderationList: vi.fn(),
	linkReportList: vi.fn()
}));
vi.mock('#lib/server/moderation.js', () => moderation);

import { load } from './+page.server';
import type { PageData } from './$types';

const MODERATOR = { id: 'mod-id' };
const LIST = [{ slug: 'soup', title: 'Soup', author: 'cook', hidden: false, reports: [] }];
const LINKS = [
	{
		path: '/recipes/soup',
		text: 'My photo',
		contact: 'me@example.com',
		reportedAt: new Date(),
		reporter: null
	}
];

beforeEach(() => {
	vi.clearAllMocks();
	moderation.isModerator.mockImplementation((user: { id: string } | null) => user?.id === 'mod-id');
	moderation.moderationList.mockResolvedValue(LIST);
	moderation.linkReportList.mockResolvedValue(LINKS);
});

describe('/moderation load', () => {
	test('anyone but a moderator, signed in or not, gets the 404 of an address with no page, and nothing is read', async () => {
		for (const user of [null, { id: 'cook' }]) {
			const result = await invokeAction(load, loadEvent({ path: '/moderation', user }));
			expect(result).toMatchObject({ status: 404, body: { message: 'Not Found' } });
		}
		expect(moderation.moderationList).not.toHaveBeenCalled();
		expect(moderation.linkReportList).not.toHaveBeenCalled();
	});

	test('a moderator reads the list, noindex', async () => {
		const data = await loadPage<PageData>(
			load,
			loadEvent({ path: '/moderation', user: MODERATOR })
		);
		expect(moderation.isModerator).toHaveBeenCalledWith(MODERATOR);
		expect(data.recipes).toEqual(LIST);
		expect(data.links).toEqual(LINKS);
		expect(data.meta).toEqual({ title: 'Moderation', noindex: true });
	});
});
